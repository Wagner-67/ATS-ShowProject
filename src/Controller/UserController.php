<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class UserController extends AbstractController
{
    #[Route('/api/user', name: 'user_register', methods: ['POST'])]
    public function register(
        Request $request,
        UserService $userService,
    ): JsonResponse
    {

        $data = json_decode($request->getContent(), true);

        $result = $userService->registerUser($data);

        $status = $result['status'] ?? null;

        if ($status === null) {
            $status = Response::HTTP_INTERNAL_SERVER_ERROR;
        }

        $response = new JsonResponse($result['body'], $status);

        if (($result['status'] ?? Response::HTTP_CREATED) === Response::HTTP_CREATED && isset($result['refreshTokenEntity'])) {
            $refreshTokenEntity = $result['refreshTokenEntity'];
            $cookie = Cookie::create('refresh_token')
                ->withValue($refreshTokenEntity->getRefreshToken())
                ->withExpires($refreshTokenEntity->getValid())
                ->withPath('/')
                ->withDomain(null)
                ->withSecure(false)
                ->withHttpOnly(true)
                ->withSameSite('lax');
            $response->headers->setCookie($cookie);
        }

        return $response;

    }

    #[Route('/api/me', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function me(): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            throw new \LogicException('User must be instance of App\Entity\User');
        }

        $type = $user->getType();

        return $this->json([
            'user' => 'logged in',
            'type' => $type->value,
        ]);
    }
}
