<?php

namespace App\Service;

use App\Entity\Application;
use App\Entity\User;
use App\Message\SendEmailMessage;
use Symfony\Component\Messenger\MessageBusInterface;

final class EmailService
{
    public function __construct(
        private MessageBusInterface $bus,
    ) {}

    public function sendCreationSuccessMail(
        ?User $user,
        Application $application,
    ): void {

        $email = $user?->getEmail() ?? $application->getEmail();

        if (!$email) {
            return;
        }

        $subject = 'Bewerbung erfolgreich erstellt';

        $body = sprintf(
            '<h1>Hallo %s</h1>
            <p>Deine Bewerbung wurde erfolgreich erstellt.</p>
            <p>Du kannst deine Bewerbung jederzeit in deinem Profil zurücksehen und den Status ansehen.</p>',
            $application->getFirstname(),
        );

        $this->bus->dispatch(
            new SendEmailMessage(
                $email,
                $subject,
                $body,
            )
        );
    }
}