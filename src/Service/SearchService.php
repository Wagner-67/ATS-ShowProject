<?php

namespace App\Service;

use App\Entity\Company;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

final class SearchService
{
    public function __construct(
        private EntityManagerInterface $em,
        private ?LoggerInterface $logger = null,
    ) {}

    public function listApplications(int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;

        $qb = $this->em
            ->getRepository(Company::class)
            ->createQueryBuilder('c')
            ->orderBy('c.created_at', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($limit);

        $companies = $qb->getQuery()->getResult();

        $total = $this->em
            ->getRepository(Company::class)
            ->createQueryBuilder('c')
            ->select('COUNT(c.id)')
            ->getQuery()
            ->getSingleScalarResult();

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
            'body' => [
                'data' => $result,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => (int) $total,
                    'pages' => ceil($total / $limit),
                ]
            ]
        ];
    }

public function searchApplications(array $data): array
    {
        $qb = $this->em
            ->getRepository(Company::class)
            ->createQueryBuilder('c');

        if (!empty($data['companyName'])) {
            $qb->andWhere('LOWER(c.CompanyName) LIKE :companyName')
            ->setParameter('companyName', '%' . strtolower($data['companyName']) . '%');
        }

        if (!empty($data['companySector'])) {
            $qb->andWhere('LOWER(c.CompanySector) LIKE :companySector')
            ->setParameter('companySector', '%' . strtolower($data['companySector']) . '%');
        }

        if (!empty($data['companyLocation'])) {
            $qb->andWhere('LOWER(c.CompanyLocation) LIKE :companyLocation')
            ->setParameter('companyLocation', '%' . strtolower($data['companyLocation']) . '%');
        }

        if (!empty($data['jobName'])) {
            $qb->andWhere('LOWER(c.JobName) LIKE :jobName')
            ->setParameter('jobName', '%' . strtolower($data['jobName']) . '%');
        }

        if (!empty($data['applicationId'])) {
            $qb->andWhere('LOWER(c.applicationId) LIKE :applicationId')
            ->setParameter('applicationId', '%' . strtolower($data['applicationId']) . '%');
        }

        if (!empty($data['description'])) {
            $qb->andWhere('LOWER(c.markdown) LIKE :description')
            ->setParameter('description', '%' . strtolower($data['description']) . '%');
        }

        if (!empty($data['createdFrom'])) {
            $qb->andWhere('c.created_at >= :createdFrom')
            ->setParameter('createdFrom', new \DateTimeImmutable($data['createdFrom']));
        }

        if (!empty($data['createdTo'])) {
            $qb->andWhere('c.created_at <= :createdTo')
            ->setParameter('createdTo', new \DateTimeImmutable($data['createdTo']));
        }

        if (!empty($data['search'])) {
            $searchTerm = strtolower($data['search']);
            $qb->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->like('LOWER(c.CompanyName)', ':search'),
                    $qb->expr()->like('LOWER(c.CompanySector)', ':search'),
                    $qb->expr()->like('LOWER(c.CompanyLocation)', ':search'),
                    $qb->expr()->like('LOWER(c.JobName)', ':search'),
                    $qb->expr()->like('LOWER(c.applicationId)', ':search'),
                    $qb->expr()->like('LOWER(c.markdown)', ':search')
                )
            )->setParameter('search', '%' . $searchTerm . '%');
        }

        $sortField = $data['sortBy'] ?? 'created_at';
        $sortOrder = strtoupper($data['sortOrder'] ?? 'DESC');
 
        $sortFieldMap = [
            'created_at' => 'created_at',
            'companyName' => 'CompanyName',
            'jobName' => 'JobName',
            'companyLocation' => 'CompanyLocation',
            'companySector' => 'CompanySector',
        ];
        
        if (isset($sortFieldMap[$sortField])) {
            $qb->orderBy('c.' . $sortFieldMap[$sortField], $sortOrder);
        } else {
            $qb->orderBy('c.created_at', 'DESC');
        }

        $companies = $qb->getQuery()->getResult();

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
            'body' => [
                'data' => $result,
            ]
        ];
    }
}