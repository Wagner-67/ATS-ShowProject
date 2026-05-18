<?php

namespace App\Listener;

use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
#[AsEventListener(event: KernelEvents::REQUEST, method: 'onKernelRequest', priority: 100)]
final class ApiRateLimiterListener
{
    public function __construct(
        #[Autowire(service: 'limiter.anonymous_api')]
        private RateLimiterFactory $anonymousApiLimiter,
        #[Autowire(service: 'limiter.authenticated_api')]
        private RateLimiterFactory $authenticatedApiLimiter,
        private Security $security
    ) {}

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();

        $path = $request->getPathInfo();
        if (!str_starts_with($path, '/api')) {
            return;
        }

        $user = $this->security->getUser();

        if ($user) {
            $limiter = $this->authenticatedApiLimiter->create($user->getUserIdentifier());
        } else {
            $limiter = $this->anonymousApiLimiter->create($request->getClientIp());
        }

        $limit = $limiter->consume();

        if (!$limit->isAccepted()) {
            $retryAfter = $limit->getRetryAfter()?->getTimestamp() - time();
            throw new TooManyRequestsHttpException($retryAfter ?: 60, 'Too many requests, slow down.');
        }
    }
}