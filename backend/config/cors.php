<?php

return [


    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],

    'allowed_methods' => ['*'],

    // Permettre les origines spécifiques pour le développement et la production
    'allowed_origins' => [
        'http://10.10.10.75:3000',
        'http://localhost:3000',
        env('FRONTEND_URL', 'http://10.10.10.75:3000'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Activer les credentials si vous utilisez l'authentification avec cookies/tokens
    'supports_credentials' => true,

];
