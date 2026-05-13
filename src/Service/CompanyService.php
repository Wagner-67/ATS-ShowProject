<?php

namespace App\Service;

use App\Entity\Application;
use App\Entity\Company;
use App\Event\GeolocationEvent;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class CompanyService
{

    public function __construct(
        private EntityManagerInterface $em,
        private ValidatorInterface $validator,
        private EventDispatcherInterface $eventDispatcher,
    ) {}

    public function createCompany(array $data, $user): array
    {
        $company = new Company();
        $company->setTitel($data['title'] ?? null);
        $company->setCompanyName($data['companyName'] ?? null);
        $company->setCompanySector($data['companySector'] ?? null);
        $company->setStreet($data['street'] ?? null);
        $company->setHouseNumber($data['houseNumber'] ?? null);
        $company->setCity($data['city'] ?? null);
        $company->setPostalCode($data['postalCode'] ?? null);
        $company->setJobName($data['jobName'] ?? null);
        $company->setMarkdown($data['description'] ?? '');
        $company->setUser($user);

        $errors = $this->validator->validate($company);
        if (count($errors) > 0) {
            return [
                'status' => 400,
                'body' => ['error' => (string) $errors]
            ];
        }

        

        $this->em->persist($company);

        $this->eventDispatcher->dispatch(new GeolocationEvent($company));

        $this->em->flush();

        return [
            'status' => 201,
            'body' => ['message' => 'Company application created successfully.']
        ];
    }

    public function getCompany($user): array
    {
        $companies = $this->em->getRepository(Company::class)->findBy(['user' => $user]);

        if (!$companies) {
            return [
                'status' => 404,
                'body' => ['error' => 'No company applications found for this user.']
            ];
        }

        $result = [];

        foreach ($companies as $company) {
            $result[] = [
                'id' => $company->getId(),
                'title' => $company->getTitel(),
                'companyName' => $company->getCompanyName(),
                'companySector' => $company->getCompanySector(),
                'street' => $company->getStreet(),
                'houseNumber' => $company->getHouseNumber(),
                'city' => $company->getCity(),
                'postalCode' => $company->getPostalCode(),
                'jobName' => $company->getJobName(),
                'description' => $company->getMarkdown(),
                'createdAt' => $company->getCreatedAt()->format('Y-m-d H:i:s'),
                'applicationId' => $company->getApplicationId(),
                'latitude' => $company->getLat(),
                'longitude' => $company->getLng(),
            ];
        }

        return [
            'status' => 200,
            'body' => $result
        ];
    }

    public function updateCompany(array $data, $user, string $id): array
    {
        $company = $this->em->getRepository(Company::class)->findOneBy([
            'id' => $id,
            'user' => $user
        ]);

        if (!$company) {
            return [
                'status' => 404,
                'body' => ['error' => 'Company not found or access denied.']
            ];
        }

        $company->setTitel($data['title'] ?? $company->getTitel());
        $company->setCompanyName($data['companyName'] ?? $company->getCompanyName());
        $company->setCompanySector($data['companySector'] ?? $company->getCompanySector());
        $company->setStreet($data['street'] ?? $company->getStreet());
        $company->setHouseNumber($data['houseNumber'] ?? $company->getHouseNumber());
        $company->setCity($data['city'] ?? $company->getCity());
        $company->setPostalCode($data['postalCode'] ?? $company->getPostalCode());
        $company->setJobName($data['jobName'] ?? $company->getJobName());
        $company->setMarkdown($data['description'] ?? $company->getMarkdown());

        $errors = $this->validator->validate($company);
        if (count($errors) > 0) {
            return [
                'status' => 400,
                'body' => ['error' => (string) $errors]
            ];
        }

        $this->em->flush();

        return [
            'status' => 200,
            'body' => ['message' => 'Company application updated successfully.']
        ];
    }

    public function deleteCompany($user, string $id): array
    {
        $company = $this->em->getRepository(Company::class)->findOneBy([
            'id' => $id,
            'user' => $user
        ]);

        if (!$company) {
            return [
                'status' => 404,
                'body' => ['error' => 'Company not found or access denied.']
            ];
        }

        $this->em->remove($company);
        $this->em->flush();

        return [
            'status' => 200,
            'body' => ['message' => 'Company application deleted successfully.']
        ];
    }

    public function getApplications($user): array
    {
        $companies = $this->em
            ->getRepository(Company::class)
            ->findBy(['user' => $user]);

        $result = [];

        foreach ($companies as $company) {

            $applications = $this->em
                ->getRepository(Application::class)
                ->findBy([
                    'applicationId' => $company->getApplicationId()
                ]);

            foreach ($applications as $application) {
                $result[] = [
                    'id' => $application->getId(),
                    'applicationId' => $application->getApplicationId(),
                    'firstname' => $application->getFirstname(),
                    'lastname' => $application->getLastname(),
                    'email' => $application->getEmail(),
                    'phoneNumber' => $application->getPhoneNumber(),
                    'street' => $application->getStreet(),
                    'houseNumber' => $application->getHouseNumber(),
                    'city' => $application->getCity(),
                    'latitude' => $company->getLat(),
                    'longitude' => $company->getLng(),
                    'jobName' => $company->getJobName(),
                    'status' => $application->getStatus()?->value,
                ];

                foreach ($application->getDocuments() as $document) {
                    $result[count($result) - 1]['documents'][] = [
                        'id' => $document->getId(),
                        'fileName' => $document->getFileName(),
                        'filePath' => $document->getFilePath(),
                    ];
                }
            }
        }

        return $result;
    }

    public function changeStatus($id, $data, $user): array
    {

        $application = $this->em->getRepository(Application::class)->find($id);

        if (!$application) {
            return [
                'status' => 404,
                'body' => ['error' => 'Application not found.']
            ];
        }

        $company = $this->em->getRepository(Company::class)->findOneBy([
            'applicationId' => $application->getApplicationId(),
            'user' => $user
        ]);

        if (!$company) {
            return [
                'status' => 403,
                'body' => ['error' => 'Access denied. You do not own this job posting.']
            ];
        }

        $allowedStatuses = ['pending', 'review', 'approved', 'rejected'];
        $newStatus = $data['status'] ?? null;
        
        if (!$newStatus || !in_array($newStatus, $allowedStatuses)) {
            return [
                'status' => 400,
                'body' => ['error' => 'Invalid status. Allowed values: ' . implode(', ', $allowedStatuses)]
            ];
        }

        $application->setStatus($newStatus);

        $errors = $this->validator->validate($application);
        if (count($errors) > 0) {
            return [
                'status' => 400,
                'body' => ['error' => (string) $errors]
            ];
        }

        $this->em->flush();

        return [
            'status' => 200,
            'body' => [
                'message' => 'Application status updated successfully.',
                'applicationId' => $application->getId(),
                'newStatus' => $newStatus
            ]
        ];
    }
}