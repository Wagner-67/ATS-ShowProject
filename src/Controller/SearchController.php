<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use App\Service\SearchService;

final class SearchController extends AbstractController
{
    #[Route('/api/search', name: 'list_applications', methods: ['GET'])]
    public function list(
        Request $request,
        SearchService $searchService
    ): Response
    {
        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(100, max(1, $request->query->getInt('limit', 10)));

        $userLat = $request->query->get('latitude') ? (float) $request->query->get('latitude') : null;
        $userLng = $request->query->get('longitude') ? (float) $request->query->get('longitude') : null;

        $result = $searchService->listApplications($page, $limit, $userLat, $userLng);

        return $this->json($result['body'], $result['status']);
    }

    #[Route('/api/search', name: 'search_applications_by_criteria', methods: ['POST'])]
    public function search(
        Request $request,
        SearchService $searchService
    ): Response
    {
        $data = json_decode($request->getContent(), true);

        $result = $searchService->searchApplications($data);

        return $this->json($result['body'], $result['status']);
    }

    #[Route('/api/search/radius', name: 'search_by_radius', methods: ['POST'])]
    public function searchByRadius(
        Request $request,
        SearchService $searchService
    ): Response
    {
        $data = json_decode($request->getContent(), true);
        
        if (empty($data['latitude']) || empty($data['longitude'])) {
            return $this->json([
                'status' => 400,
                'body' => ['error' => 'Latitude and longitude are required']
            ], 400);
        }
        
        $result = $searchService->searchApplications($data);
        
        return $this->json($result['body'], $result['status']);
    }
}