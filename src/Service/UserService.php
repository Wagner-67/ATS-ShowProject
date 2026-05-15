<?php

namespace App\Service;

use App\Entity\User;
use App\Enum\ProfileType;
use Doctrine\ORM\EntityManagerInterface;
use Gesdinet\JWTRefreshTokenBundle\Generator\RefreshTokenGeneratorInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class UserService
{

    public function __construct(
    
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private ValidatorInterface $validator,
        private JWTTokenManagerInterface $jwtManager,
        private RefreshTokenGeneratorInterface $refreshTokenGenerator,
        private RefreshTokenManagerInterface $refreshTokenManager
    ) {}

    /**
     * @param array{
     *     email?: string,
     *     password?: string,
     *     confirmPassword?: string,
     *     type?: string
     * } $data
     * @return array<string, mixed>
     */

    public function registerUser(array $data): array
    {
        if (!isset($data['confirmPassword'])) {
            return [
                'status' => 400,
                'body' => ['error' => 'Confirm password is required.']
            ];
        }

        if (($data['password']) !== $data['confirmPassword']) {
            return [
                'status' => 400,
                'body' => ['error' => 'Passwords do not match.']
            ];
        }

        if (($data['type'])) {
            if (!in_array($data['type'], ['company', 'applicant'])) {
                return [
                    'status' => 400,
                    'body' => ['error' => 'Invalid profile type. Must be "company" or "applicant".']
                ];
            }
        } else {
            return [
                'status' => 400,
                'body' => ['error' => 'Profile type is required.']
            ];
        }

        $existingUser = $this->em->getRepository(User::class)->findOneBy(['email' => $data['email']]);
        if ($existingUser) {
            return [
                'status' => 400,
                'body' => ['error' => 'User with this email already exists.']
            ];
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setPassword($data['password']);
        $user->setType(ProfileType::from($data['type']));

        $violations = $this->validator->validate($user);
        if (count($violations) > 0) {
            $errors = [];
            foreach ($violations as $violation) {
                $errors[] = $violation->getMessage();
            }
            return [
                'status' => 400,
                'body' => ['errors' => $errors]
            ];
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $data['password']));

        $this->em->persist($user);
        $this->em->flush();

        $token = $this->jwtManager->create($user);
        $refreshTokenEntity = $this->refreshTokenGenerator->createForUserWithTtl($user, 2592000);
        $this->refreshTokenManager->save($refreshTokenEntity);

        return [
            'status' => 201,
            'body' => [
                'message' => 'User registered successfully.',
                'token' => $token
            ],
            'refreshTokenEntity' => $refreshTokenEntity
        ];

    }
}