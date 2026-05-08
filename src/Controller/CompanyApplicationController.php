<?php

namespace App\Controller;

use App\Service\CompanyService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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

}
