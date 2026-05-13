<?php

namespace App\Controller;

use App\Entity\Company;
use App\Entity\UserPdfs;
use App\Service\CompanyService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class CompanyApplicationController extends AbstractController
{
    #[Route('/api/company', name: 'company_application_create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function index(
        Request $request,
        CompanyService $CompanyService,
    ): JsonResponse
    {

    $data = json_decode($request->getContent(), true);

    $result = $CompanyService->createCompany($data, $this->getUser());

    return $this->json($result['body'], $result['status']);

    }

    #[Route('/api/company', name: 'company_application_read', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getCompany(
        CompanyService $CompanyService,
    ): JsonResponse
    {

        $result = $CompanyService->getCompany($this->getUser());

        return $this->json($result['body'], $result['status']);

    }

    #[Route('/api/company/{id}', name: 'company_application_update', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function updateCompany(
        string $id,
        Request $request,
        CompanyService $CompanyService,
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $result = $CompanyService->updateCompany($data, $this->getUser(), $id);

        return $this->json($result['body'], $result['status']);
    }

    #[Route('/api/company/{id}', name: 'company_application_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function deleteCompany(
        string $id,
        CompanyService $CompanyService,
    ): JsonResponse
    {
        $result = $CompanyService->deleteCompany($this->getUser(), $id);

        return $this->json($result['body'], $result['status']);
    }

    #[Route('/api/company/application', name: 'company_application_get_all', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getAllCompanies(
        CompanyService $companyService,
    ): JsonResponse
    {
        $applications = $companyService->getApplications($this->getUser());

        return $this->json($applications, 200);
    }


    #[Route('/api/document/{id}', name: 'api_document_get', methods: ['GET'])]
    public function getDocument(int $id, EntityManagerInterface $em): Response
    {
        $document = $em->getRepository(UserPdfs::class)->find($id);
        
        if (!$document) {
            throw $this->createNotFoundException('Document not found');
        }

        $application = $document->getApplication();
        $user = $this->getUser();
 
        $hasAccess = false;
  
        if ($application->getUser() === $user) {
            $hasAccess = true;
        }
        
        $companies = $em->getRepository(Company::class)->findBy(['user' => $user]);
        foreach ($companies as $company) {
            if ($company->getApplicationId() === $application->getApplicationId()) {
                $hasAccess = true;
                break;
            }
        }
        
        if (!$hasAccess) {
            throw $this->createAccessDeniedException('Access denied');
        }

        $projectDir = $this->getParameter('kernel.project_dir');
        $filePath = $projectDir . '/public' . $document->getFilePath();
        
        if (!file_exists($filePath)) {
            throw $this->createNotFoundException('File not found');
        }
        
        return $this->file($filePath, $document->getFileName(), ResponseHeaderBag::DISPOSITION_INLINE);
    }

    #[Route('/api/company/status/{id}', name: 'company_application_status', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function changeStatus(
        string $id,
        Request $request,
        CompanyService $CompanyService,
    ): JsonResponse
    {        
        $data = json_decode($request->getContent(), true);

        $result = $CompanyService->changeStatus($id, $data, $this->getUser());

        return $this->json($result['body'], $result['status']);
    }
}