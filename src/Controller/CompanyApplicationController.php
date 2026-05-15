<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\CompanyService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class CompanyApplicationController extends AbstractController
{
    public function __construct(
        private CompanyService $companyService
    ) {}

    #[Route('/api/company', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(Request $request): JsonResponse
    {

        $user = $this->getUser();
        
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('Invalid user type');
        }

        $data = $request->request->all();
        $result = $this->companyService->createCompany($data, $user);
        return new JsonResponse($result['body'], $result['status']);
    }

    #[Route('/api/company', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(): JsonResponse
    {

        $user = $this->getUser();
        
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('Invalid user type');
        }

        $result = $this->companyService->getCompany($user);
        return new JsonResponse($result['body'], $result['status']);
    }

    #[Route('/api/company/{id}', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function update(Request $request, string $id): JsonResponse
    {

        $user = $this->getUser();
        
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('Invalid user type');
        }

        $data = $request->request->all();
        $result = $this->companyService->updateCompany($data, $user, $id);
        return new JsonResponse($result['body'], $result['status']);
    }

    #[Route('/api/company/{id}', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(string $id): JsonResponse
    {
  
        $user = $this->getUser();
        
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('Invalid user type');
        }

        $result = $this->companyService->deleteCompany($user, $id);
        return new JsonResponse($result['body'], $result['status']);
    }

    #[Route('/api/company/applications', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function applications(): JsonResponse
    {

        $user = $this->getUser();
        
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('Invalid user type');
        }

        $result = $this->companyService->getApplications($user);
        return $this->json($result);
    }

    #[Route('/api/company/application/{id}/status', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function changeStatus(Request $request, int $id): JsonResponse
    {

        $user = $this->getUser();
        
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('Invalid user type');
        }

        $data = $request->request->all();
        $result = $this->companyService->changeStatus($id, $data, $user);
        return new JsonResponse($result['body'], $result['status']);
    }
}