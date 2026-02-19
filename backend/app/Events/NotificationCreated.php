<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\PublicChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event pour les notifications temps réel
 * 
 * Cet événement est broadcasté lorsqu'une nouvelle notification est créée
 * Il implémente ShouldBroadcastNow pour diffuser immédiatement en temps réel via WebSocket
 */
class NotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * La notification créée
     *
     * @var Notification
     */
    public $notification;

    /**
     * Create a new event instance.
     *
     * @param Notification $notification
     */
    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Utiliser un canal public pour que tous les clients puissent écouter
        // Pour un canal privé (authentifié), utiliser: new PrivateChannel('notifications')
        return [
            new Channel('notifications'),
        ];
    }

    /**
     * Le nom de l'événement à diffuser
     *
     * @return string
     */
    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    /**
     * Les données à diffuser
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->notification->id,
            'article_id' => $this->notification->article_id,
            'categorie' => $this->notification->categorie,
            'libelle' => $this->notification->libelle,
            'produit' => $this->notification->produit,
            'unite' => $this->notification->unite,
            'prix' => $this->notification->prix,
            'date_ajout' => $this->notification->date_ajout,
            'heure_ajout' => $this->notification->heure_ajout,
            'lu' => $this->notification->lu,
            'created_at' => $this->notification->created_at,
        ];
    }
}
