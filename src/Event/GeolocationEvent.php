<?php

namespace App\Event;

use App\Entity\Company;
use Symfony\Contracts\EventDispatcher\Event;

final class GeolocationEvent extends Event
{
    public function __construct(
        public readonly ?Company $company,
    ) {}
}