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

        $result = $searchService->listApplications($page, $limit);

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
}
