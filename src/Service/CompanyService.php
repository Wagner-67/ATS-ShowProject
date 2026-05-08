<?php

namespace App\Service;

use App\Entity\Company;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class CompanyService
{

    public function __construct(
        private EntityManagerInterface $em,
        private ValidatorInterface $validator,
    ) {}

    public function createCompany(array $data, $user): array
    {
        $company = new Company();
        $company->setCompanyName($data['companyName'] ?? null);
        $company->setCompanySector($data['companySector'] ?? null);
        $company->setCompanyLocation($data['companyLocation'] ?? null);
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
                'companyName' => $company->getCompanyName(),
                'companySector' => $company->getCompanySector(),
                'companyLocation' => $company->getCompanyLocation(),
                'jobName' => $company->getJobName(),
                'description' => $company->getMarkdown(),
                'createdAt' => $company->getCreatedAt()->format('Y-m-d H:i:s'),
                'applicationId' => $company->getApplicationId(),
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

        $company->setCompanyName($data['companyName'] ?? $company->getCompanyName());
        $company->setCompanySector($data['companySector'] ?? $company->getCompanySector());
        $company->setCompanyLocation($data['companyLocation'] ?? $company->getCompanyLocation());
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

}