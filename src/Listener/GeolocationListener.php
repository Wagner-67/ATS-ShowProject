<?php

namespace App\Listener;

use App\Event\GeolocationEvent;
use App\Service\GeocodingService;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

#[AsEventListener]
final class GeolocationListener
{
    public function __construct(
        private GeocodingService $geocodingService,
    ) {}

    public function __invoke(GeolocationEvent $event): void
    {
        $company = $event->company;

        if (!$company) { 
            return;
        }

        $geolocation = $this->geocodingService->geocode(
            $company->getStreet(),
            $company->getHouseNumber(),
            $company->getPostalCode(),
            $company->getCity()
        );

        if ($geolocation) {
            $company->setLat($geolocation['lat']);
            $company->setLng($geolocation['lng']);
        }
    }
}