<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\ApplicationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class ApplicationController extends AbstractController
{
    #[Route('/api/application/{id}', name: 'application_post', methods: ['POST'])]
    public function post(
        Request $request,
        string $id,
        ApplicationService $applicationService
    ): JsonResponse
    {
        $data = [
            'salutation' => $request->request->get('salutation'),
            'firstname' => $request->request->get('firstname'),
            'lastname' => $request->request->get('lastname'),
            'email' => $request->request->get('email'),
            'phoneNumber' => $request->request->get('phoneNumber'),
            'street' => $request->request->get('street'),
            'houseNumber' => $request->request->get('houseNumber'),
            'city' => $request->request->get('city')
        ];
        
        $files = $request->files->get('documents', []);
        
        if (!is_array($files)) {
            $files = [$files];
        }
        
        $files = array_filter($files, function($file) {
            return $file !== null;
        });
        
        $user = $this->getUser();
        
        $result = $applicationService->createApplication($data, $id, $user, $files);
        
        return new JsonResponse($result['body'], $result['status']);
    }

    #[Route('/api/applications', name: 'applications_get_all', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getAll(ApplicationService $applicationService): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            throw new \LogicException('User must be instance of App\Entity\User');
        }

        $result = $applicationService->getAllApplications($user);

        return new JsonResponse($result['body'], $result['status']);
    }

    #[Route('/api/application/{id}', name: 'application_get_one', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getOne(int $id, ApplicationService $applicationService): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            throw new \LogicException('User must be instance of App\Entity\User');
        }
        
        $result = $applicationService->getApplicationById($id, $user);

        return new JsonResponse($result['body'], $result['status']);
    }

    #[Route('/api/application/{id}', name: 'application_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(int $id, ApplicationService $applicationService): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            throw new \LogicException('User must be instance of App\Entity\User');
        }

        $result = $applicationService->deleteApplicationById($id, $user);
        
        return new JsonResponse($result['body'], $result['status']);
    }
}