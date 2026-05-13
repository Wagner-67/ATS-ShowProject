<?php

namespace App\Listener;

use App\Event\ApplicationSubmitEvent;
use App\Service\EmailService;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

#[AsEventListener]
final class ApplicationSubmitListener
{
    public function __construct(
        private EmailService $emailService,
    ) {}

    public function __invoke(ApplicationSubmitEvent $event): void
    {
        $this->emailService->sendCreationSuccessMail(
            $event->user,
            $event->application
        );
    }
}