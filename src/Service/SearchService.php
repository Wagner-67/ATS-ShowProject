<?php

namespace App\Service;

use App\Entity\Company;
use Doctrine\ORM\EntityManagerInterface;

final class SearchService
{
    private const EARTH_RADIUS_KM = 6371;

    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    /**
     * @return array{status: int, body: array{data: array<int, array<string, mixed>>, pagination: array{page: int, limit: int, total: int, pages: float}}}
     */
    public function listApplications(int $page = 1, int $limit = 10, ?float $userLat = null, ?float $userLng = null): array
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
            $result[] = $this->serializeCompany($company, $userLat, $userLng);
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

    /**
     * @param array{
     *     companyName?: string,
     *     companySector?: string,
     *     companyLocation?: string,
     *     jobName?: string,
     *     applicationId?: string,
     *     description?: string,
     *     title?: string,
     *     createdFrom?: string,
     *     createdTo?: string,
     *     search?: string,
     *     applicationType?: string,
     *     latitude?: string|float,
     *     longitude?: string|float,
     *     radius?: string|float,
     *     sortBy?: string,
     *     sortOrder?: string
     * } $data
     * @return array{status: int, body: array{data: array<int, array<string, mixed>>}}
     */
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
            $qb->andWhere('LOWER(c.city) LIKE :companyLocation')
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

        if (!empty($data['title'])) {
            $qb->andWhere('LOWER(c.titel) LIKE :title')
                ->setParameter('title', '%' . strtolower($data['title']) . '%');
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
                    $qb->expr()->like('LOWER(c.city)', ':search'),
                    $qb->expr()->like('LOWER(c.JobName)', ':search'),
                    $qb->expr()->like('LOWER(c.titel)', ':search'),
                    $qb->expr()->like('LOWER(c.applicationId)', ':search'),
                    $qb->expr()->like('LOWER(c.markdown)', ':search')
                )
            )->setParameter('search', '%' . $searchTerm . '%');
        }

        if (!empty($data['applicationType'])) {
            $qb->andWhere('LOWER(c.applicationType) = :applicationType')
                ->setParameter('applicationType', strtolower($data['applicationType']));
        }

        $userLat = !empty($data['latitude']) ? (float) $data['latitude'] : null;
        $userLng = !empty($data['longitude']) ? (float) $data['longitude'] : null;
        $radiusKm = !empty($data['radius']) ? (float) $data['radius'] : null;

        if ($userLat !== null && $userLng !== null && $radiusKm !== null) {
            // Verwende die tatsächlichen Feldnamen aus der Entity
            // Versuche zuerst die Getter-Methoden zu finden
            $latField = 'c.lat'; // oder 'c.latitude' - je nach Entity-Definition
            $lngField = 'c.lng'; // oder 'c.longitude' - je nach Entity-Definition
            
            $latDelta = rad2deg($radiusKm / self::EARTH_RADIUS_KM);
            $lngDelta = rad2deg($radiusKm / (self::EARTH_RADIUS_KM * cos(deg2rad($userLat))));

            $qb->andWhere($latField . ' IS NOT NULL')
                ->andWhere($lngField . ' IS NOT NULL')
                ->andWhere($latField . ' BETWEEN :latMin AND :latMax')
                ->andWhere($lngField . ' BETWEEN :lngMin AND :lngMax')
                ->setParameter('latMin', $userLat - $latDelta)
                ->setParameter('latMax', $userLat + $latDelta)
                ->setParameter('lngMin', $userLng - $lngDelta)
                ->setParameter('lngMax', $userLng + $lngDelta);
        }

        $sortField = $data['sortBy'] ?? 'created_at';
        $sortOrder = strtoupper($data['sortOrder'] ?? 'DESC');

        $allowedSortFields = [
            'created_at' => 'c.created_at',
            'companyName' => 'c.CompanyName',
            'jobName' => 'c.JobName',
            'city' => 'c.city',
            'companySector' => 'c.CompanySector',
            'title' => 'c.titel',
        ];

        if (isset($allowedSortFields[$sortField])) {
            $qb->orderBy($allowedSortFields[$sortField], $sortOrder);
        } else {
            $qb->orderBy('c.created_at', 'DESC');
        }

        $companies = $qb->getQuery()->getResult();

        $result = [];
        foreach ($companies as $company) {
            $item = $this->serializeCompany($company, $userLat, $userLng);

            if ($radiusKm !== null && $userLat !== null && $userLng !== null) {
                $distance = $item['distance'];
                if ($distance === null || $distance > $radiusKm) {
                    continue;
                }
            }

            $result[] = $item;
        }

        if ($sortField === 'distance' && $userLat !== null && $userLng !== null) {
            usort($result, function ($a, $b) use ($sortOrder) {
                $distA = $a['distance'] ?? PHP_FLOAT_MAX;
                $distB = $b['distance'] ?? PHP_FLOAT_MAX;
                return $sortOrder === 'ASC' ? $distA <=> $distB : $distB <=> $distA;
            });
        }

        return [
            'status' => 200,
            'body' => [
                'data' => $result,
            ]
        ];
    }

    /**
     * @return float|null
     */
    private function calculateDistance(float $lat1, float $lng1, ?float $lat2, ?float $lng2): ?float
    {
        if ($lat2 === null || $lng2 === null) {
            return null;
        }

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round(self::EARTH_RADIUS_KM * $c, 1);
    }

    /**
     * @return array{id: int|null, title: string|null, companyName: string|null, companySector: string|null, street: string|null, houseNumber: string|null, city: string|null, postalCode: string|null, jobName: string|null, description: string|null, createdAt: string, applicationId: string|null, latitude: float|null, longitude: float|null, distance?: float|null}
     */
    private function serializeCompany(Company $company, ?float $userLat = null, ?float $userLng = null): array
    {

        $lat = $company->getLat() !== null ? (float) $company->getLat() : null;
        $lng = $company->getLng() !== null ? (float) $company->getLng() : null;

        $data = [
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
            'latitude' => $lat,
            'longitude' => $lng,
        ];

        if ($userLat !== null && $userLng !== null) {
            $data['distance'] = $this->calculateDistance($userLat, $userLng, $lat, $lng);
        }

        return $data;
    }
}