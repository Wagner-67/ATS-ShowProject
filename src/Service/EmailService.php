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
        
        if (!$user) {
            return;
        }

        $subject = 'Bewerbung erfolgreich erstellt';

        $body = sprintf(
            '<h1>Hallo %s</h1>
            <p>Deine Bewerbung wurde erfolgreich erstellt.</p>
            <p>Du kannst deine Bewerbung jederzeit in deinem Profil zurücksehen und den Status ansehen.</p>',
            $application->getFirstName(),
        );

        $this->bus->dispatch(
            new SendEmailMessage(
                $user->getEmail(),
                $subject,
                $body,
            )
        );
    }
}