<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Canal pour les utilisateurs authentifiés
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Canal public pour les notifications (accessible sans authentification)
// Si vous voulez restreindre l'accès, vous pouvez utiliser PrivateChannel
// et ajouter une vérification d'authentification ici
Broadcast::channel('notifications', function ($user = null) {
    // Pour un canal public, retourner true
    // Pour un canal privé, vérifier l'authentification:
    // return $user !== null;
    return true;
});

// Exemple de canal privé pour les notifications par utilisateur
// Décommentez si vous voulez des notifications privées par utilisateur
/*
Broadcast::channel('notifications.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
*/
