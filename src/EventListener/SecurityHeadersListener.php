<?php

namespace App\EventListener;

use Symfony\Component\HttpKernel\Event\ResponseEvent;

class SecurityHeadersListener
{
    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $response = $event->getResponse();

        $headers = [
            'X-Frame-Options' => 'deny',                     
            'X-Content-Type-Options' => 'nosniff',           
            'X-XSS-Protection' => '1; mode=block',           
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
        ];
        
        foreach ($headers as $name => $value) {
            if (!$response->headers->has($name)) {
                $response->headers->set($name, $value);
            }
        }
        
        $response->headers->remove('X-Powered-By');
    }
}