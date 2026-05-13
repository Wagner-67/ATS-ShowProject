<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

final class GeocodingService
{
    private const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
    ) {}

    public function geocode(
        ?string $street,
        ?string $houseNumber,
        ?string $postalCode,
        ?string $city,
    ): ?array {

        if (
            !$street ||
            !$houseNumber ||
            !$postalCode ||
            !$city
        ) {
            return null;
        }

        $address = sprintf(
            '%s %s, %s %s',
            trim($street),
            trim($houseNumber),
            trim($postalCode),
            trim($city),
        );

        try {

            $response = $this->httpClient->request(
                'GET',
                self::NOMINATIM_URL,
                [
                    'query' => [
                        'q' => $address,
                        'format' => 'jsonv2',
                        'limit' => 1,
                    ],
                    'headers' => [
                        'User-Agent' => 'YourApp/1.0',
                    ],
                ]
            );

            $data = $response->toArray();

            if (empty($data[0])) {
                return null;
            }

            return [
                'lat' => (float) $data[0]['lat'],
                'lng' => (float) $data[0]['lon'],
            ];

        } catch (\Throwable $e) {

            return null;
        }
    }
}