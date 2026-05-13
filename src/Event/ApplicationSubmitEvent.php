<?php

namespace App\Event;

use App\Entity\Application;
use App\Entity\User;
use Symfony\Contracts\EventDispatcher\Event;

final class ApplicationSubmitEvent extends Event
{
    public function __construct(
        public readonly ?User $user,
        public readonly Application $application,
    ) {}
}