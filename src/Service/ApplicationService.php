<?php

namespace App\Service;

use App\Entity\Application;
use App\Entity\Company;
use App\Entity\User;
use App\Entity\UserPdfs;
use App\Event\ApplicationSubmitEvent;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

final class ApplicationService
{
    private const MAX_FILE_SIZE = 20 * 1024 * 1024;
    private const ALLOWED_MIME_TYPE = 'application/pdf';
    private const ALLOWED_EXTENSION = 'pdf';
    private string $uploadDir;

    public function __construct(
        private EntityManagerInterface $em,
        private EventDispatcherInterface $eventDispatcher,
    ) {
        $this->uploadDir = __DIR__ . '/../../public/uploads';
    }

    /**
     * @param array{
     *     salutation?: string,
     *     firstname?: string,
     *     lastname?: string,
     *     email?: string,
     *     phoneNumber?: string,
     *     street?: string,
     *     houseNumber?: string,
     *     city?: string
     * } $data
     * @param array<int, UploadedFile> $files
     * @return array{status: int, body: array{error?: string, details?: array<int, string>, message?: string, applicationId?: int|null, status?: string|null, uploadedFiles?: int, files?: array<int, array{fileName: string|null, filePath: string|null, size: int|null}>}}
     */
    public function createApplication(array $data, string $companyApplicationId, ?User $user = null, array $files = []): array
    {

        $company = $this->em->getRepository(Company::class)->findOneBy(['applicationId' => $companyApplicationId]);

        if (!$company) {
            return [
                'status' => 404,
                'body' => ['error' => 'No company application found with the provided ID.']
            ];
        }

        if (empty($files)) {
            return [
                'status' => 400,
                'body' => ['error' => 'At least one file must be uploaded.']
            ];
        }

        $application = new Application();
        $application->setSalutation($data['salutation'] ?? null);
        $application->setFirstname($data['firstname'] ?? null);
        $application->setLastname($data['lastname'] ?? null);
        $application->setEmail($data['email'] ?? null);
        $application->setPhoneNumber($data['phoneNumber'] ?? null);
        $application->setStreet($data['street'] ?? null);
        $application->setHouseNumber($data['houseNumber'] ?? null);
        $application->setCity($data['city'] ?? null);
        $application->setApplicationId($companyApplicationId);

        if ($user) {
            $application->setUser($user);
        }

        $this->em->persist($application);
        $this->em->flush();

        $uploadedDocuments = [];
        $errors = [];

        foreach ($files as $index => $file) {
            /** @var UploadedFile|null $file */
            if (!$file instanceof UploadedFile) {
                $errors[] = "File at index $index is not a valid UploadedFile.";
                continue;
            }

            try {
                $this->validateFile($file);
                $document = $this->saveDocument($file, $application);
                $uploadedDocuments[] = $document;
            } catch (\RuntimeException $e) {
                $errors[] = "File '{$file->getClientOriginalName()}': " . $e->getMessage();
            }
        }

        if (empty($uploadedDocuments) && !empty($errors)) {
            $this->em->remove($application);
            $this->em->flush();
            
            return [
                'status' => 400,
                'body' => ['error' => 'No files could be uploaded successfully.', 'details' => $errors]
            ];
        }

        foreach ($uploadedDocuments as $document) {
            $this->em->persist($document);
        }
        
        $this->em->flush();

        $this->eventDispatcher->dispatch(
            new ApplicationSubmitEvent($user, $application)
        );

        return [
            'status' => 201,
            'body' => [
                'message' => 'Application created successfully.',
                'applicationId' => $application->getId(),
                'status' => $application->getStatus()?->value,
                'uploadedFiles' => count($uploadedDocuments),
                'files' => array_map(function(UserPdfs $doc) {
                    return [
                        'fileName' => $doc->getFileName(),
                        'filePath' => $doc->getFilePath(),
                        'size' => $doc->getSize()
                    ];
                }, $uploadedDocuments)
            ]
        ];
    }

    private function saveDocument(UploadedFile $file, Application $application): UserPdfs
    {
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFileName = $this->sanitizeFileName($originalName);
        $uniqueFileName = $safeFileName . '_' . uniqid() . '_' . time() . '.' . self::ALLOWED_EXTENSION;

        if (!is_dir($this->uploadDir)) {
            if (!mkdir($this->uploadDir, 0777, true)) {
                throw new \RuntimeException('Could not create upload directory.');
            }
        }

        $originalFileName = $file->getClientOriginalName();
        $mimeType = $file->getClientMimeType();
        $fileSize = $file->getSize();

        $file->move($this->uploadDir, $uniqueFileName);


        $filePath = '/uploads/' . $uniqueFileName; 

        $document = new UserPdfs();
        $document->setFileName($originalFileName);
        $document->setFilePath($filePath);
        $document->setMimeType($mimeType);
        $document->setSize($fileSize);
        $document->setCreatedAt(new \DateTimeImmutable());
        $document->setApplication($application);

        return $document;
    }

    private function validateFile(UploadedFile $file): void
    {

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new \RuntimeException('File too large. Maximum size is 20MB.');
        }

        if ($file->getClientOriginalExtension() !== self::ALLOWED_EXTENSION) {
            throw new \RuntimeException('Only PDF files are allowed.');
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $pathname = $file->getPathname();
        if (empty($pathname) || !file_exists($pathname)) {
            throw new \RuntimeException('Uploaded file is not accessible.');
        }
        $mime = $finfo->file($pathname);

        if ($mime !== self::ALLOWED_MIME_TYPE) {
            throw new \RuntimeException('Invalid file type. Only PDF files are allowed.');
        }

        $originalName = $file->getClientOriginalName();
        if (strpos($originalName, '..') !== false || 
            strpos($originalName, '/') !== false || 
            strpos($originalName, '\\') !== false) {
            throw new \RuntimeException('Invalid file name.');
        }

        $handle = fopen($file->getPathname(), 'rb');
        $header = fread($handle, 4);
        fclose($handle);

        if ($header !== '%PDF') {
            throw new \RuntimeException('Invalid PDF signature. The file is not a valid PDF.');
        }
    }

    private function sanitizeFileName(string $fileName): string
    {

        $fileName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $fileName);

        return substr($fileName, 0, 50);
    }

    /**
     * @return array<int, array{id: int|null, firstname: string|null, lastname: string|null, email: string|null, status: string|null, documents: array<int, array{fileName: string|null, filePath: string|null, createdAt: string}>}>
     */

    public function getApplicationsForUser(User $user): array
    {
        $applications = $this->em->getRepository(Application::class)->findBy(['user' => $user]);
        
        return array_map(function(Application $app) {
            return [
                'id' => $app->getId(),
                'firstname' => $app->getFirstname(),
                'lastname' => $app->getLastname(),
                'email' => $app->getEmail(),
                'status' => $app->getStatus()?->value,
                'documents' => array_map(function(UserPdfs $doc) {
                    return [
                        'fileName' => $doc->getFileName(),
                        'filePath' => $doc->getFilePath(),
                        'createdAt' => $doc->getCreatedAt()->format('Y-m-d H:i:s')
                    ];
                }, $app->getDocuments()->toArray())
            ];
        }, $applications);
    }

    /**
     * @return array<string, mixed>
    */

    public function deleteApplication(Application $application, ?User $user = null): array
    {

        if ($user && $application->getUser() !== $user) {
            return [
                'status' => 403,
                'body' => ['error' => 'You are not authorized to delete this application.']
            ];
        }

        foreach ($application->getDocuments() as $document) {
            $filePath = $document->getFilePath();
            if (file_exists($filePath)) {
                unlink($filePath);
            }
            $this->em->remove($document);
        }

        $this->em->remove($application);
        $this->em->flush();

        return [
            'status' => 200,
            'body' => ['message' => 'Application deleted successfully.']
        ];
    }

    /**
     * @return array<string, mixed>
    */

    public function getAllApplications(User $user): array
    {
        $applications = $this->em->getRepository(Application::class)->findBy(['user' => $user]);
        
        $data = array_map(function(Application $app) {
            return $this->formatApplicationData($app);
        }, $applications);
        
        return [
            'status' => 200,
            'body' => $data
        ];
    }

    /**
     * @return array<string, mixed>
    */

    public function getApplicationById(int $id, User $user): array
    {
        $application = $this->em->getRepository(Application::class)->findOneBy([
            'id' => $id,
            'user' => $user
        ]);
        
        if (!$application) {
            return [
                'status' => 404,
                'body' => ['error' => 'Application not found']
            ];
        }
        
        return [
            'status' => 200,
            'body' => $this->formatApplicationData($application)
        ];
    }

    /**
     * @return array{id: int|null, salutation: string|null, firstname: string|null, lastname: string|null, email: string|null, phoneNumber: string|null, street: string|null, houseNumber: string|null, city: string|null, status: string|null, documents: array<int, array{id: int|null, fileName: string|null, filePath: string|null, mimeType: string|null, size: int|null, createdAt: string}>, jobName?: string|null, companyName?: string|null}
     */

    private function formatApplicationData(Application $application): array
    {
        $data = [
            'id' => $application->getId(),
            'salutation' => $application->getSalutation()?->value,
            'firstname' => $application->getFirstname(),
            'lastname' => $application->getLastname(),
            'email' => $application->getEmail(),
            'phoneNumber' => $application->getPhoneNumber(),
            'street' => $application->getStreet(),
            'houseNumber' => $application->getHouseNumber(),
            'city' => $application->getCity(),
            'status' => $application->getStatus()?->value,
            'documents' => array_map(function($doc) {
                return [
                    'id' => $doc->getId(),
                    'fileName' => $doc->getFileName(),
                    'filePath' => $doc->getFilePath(),
                    'mimeType' => $doc->getMimeType(),
                    'size' => $doc->getSize(),
                    'createdAt' => $doc->getCreatedAt()->format('Y-m-d H:i:s')
                ];
            }, $application->getDocuments()->toArray())
        ];

        $company = $this->em->getRepository(Company::class)->findOneBy([
            'applicationId' => $application->getApplicationId()
        ]);
        
        if ($company) {
            $data['jobName'] = $company->getJobName();
            $data['companyName'] = $company->getCompanyName();
        }
        
        return $data;
    }

    /**
     * @return array<string, mixed>
    */

    public function deleteApplicationById(int $applicationId, ?User $user = null): array
    {
        $application = $this->em->getRepository(Application::class)->find($applicationId);
        
        if (!$application) {
            return [
                'status' => 404,
                'body' => ['error' => 'Application not found']
            ];
        }
        
        return $this->deleteApplication($application, $user);
    }
}