<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\NotificationCreated;
use App\Models\Notification;
use Illuminate\Http\Request;
use App\Models\NotiBackup;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller

{

    //backup des notifications

    

       

    // Liste des notifications
    public function index(Request $request)
    {
        $query = Notification::query();
        
        // Filtrer par notifications non lues si demandé
        if ($request->has('unread') && $request->boolean('unread')) {
            $query->where('lu', false);
        }

        // Filtrage par date
        // - ?date=YYYY-MM-DD  -> uniquement ce jour
        // - ?start=YYYY-MM-DD&end=YYYY-MM-DD -> plage inclusive
        if ($request->filled('date')) {
            $query->whereDate('date_ajout', $request->input('date'));
        } else {
            $start = $request->input('start');
            $end = $request->input('end');

            if (!empty($start)) {
                $query->whereDate('date_ajout', '>=', $start);
            }
            if (!empty($end)) {
                $query->whereDate('date_ajout', '<=', $end);
            }
        }
        
        return response()->json([
            'success' => true,
            'data' => $query
                ->orderBy('date_ajout', 'desc')
                ->orderBy('heure_ajout', 'desc')
                ->get()
        ]);
    }
    
    // Récupérer les notifications non lues (pour l'admin)
    public function unread()
    {
        $unreadNotifications = Notification::where('lu', false)
            ->orderBy('heure_ajout', 'desc')
            ->get();
            
        return response()->json([
            'success' => true,
            'count' => $unreadNotifications->count(),
            'data' => $unreadNotifications
        ]);
    }

    // Ajouter une notification
    public function store(Request $request)
{
    $request->validate([
        'article_id' => 'required|integer',
        'categorie' => 'required|string|max:100',
        'libelle' => 'required|string|max:100',
        'produit' => 'required|numeric',
        'unite' => 'required|string|max:20',
        'prix' => 'required|numeric',
    ]);

    $notification = Notification::create([
        'article_id' => $request->article_id,
        'categorie' => $request->categorie,
        'libelle' => $request->libelle,
        'produit' => $request->produit,
        'unite' => $request->unite,
        'prix' => $request->prix,
        'date_ajout' => now()->toDateString(),     // 👈 auto
        'heure_ajout' => now()->toTimeString(),    // 👈 auto
        'lu' => false,
    ]);

    // Rafraîchir la notification pour avoir toutes les données à jour
    $notification->refresh();

    // Émettre l'événement de notification (diffusion immédiate)
    event(new NotificationCreated($notification));
    
    \Log::info('Notification créée via API et événement émis', [
        'notification_id' => $notification->id
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Notification créée avec succès',
        'data' => $notification
    ]);
}

    // Afficher une notification
    public function show($id)
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification non trouvée'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $notification
        ]);
    }

    // Marquer comme lue (PATCH /notifications/{id}/read)
    public function markAsRead($id)
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification non trouvée'
            ], 404);
        }

        $notification->update(['lu' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue',
            'data' => $notification->fresh()
        ]);
    }

    // Marquer comme lue / mise à jour (PUT)
    public function update(Request $request, $id)
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification non trouvée'
            ], 404);
        }

        $request->validate([
            'lu' => 'required|boolean'
        ]);

        $notification->update([
            'lu' => $request->lu
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification mise à jour',
            'data' => $notification
        ]);
    }

    // Supprimer une notification
        public function backupAndDeleteAll()
    {
        DB::beginTransaction();

        try {
            $notifications = Notification::all();

            if ($notifications->isEmpty()) {
                return response()->json([
                    'message' => 'Aucune notification à sauvegarder'
                ], 400);
            }

            foreach ($notifications as $notif) {
                NotiBackup::create([
                    'article_id'  => $notif->article_id,
                    'categorie'   => $notif->categorie,
                    'libelle'     => $notif->libelle,
                    'produit'     => $notif->produit,
                    'unite'       => $notif->unite,
                    'prix'        => $notif->prix,
                    'date_ajout'  => $notif->date_ajout,
                    'heure_ajout' => $notif->heure_ajout,
                    'lu'          => $notif->lu,
                    'backup_at'   => now(),
                ]);
            }

            // Supprimer toutes les notifications
            Notification::truncate();

            DB::commit();

            return response()->json([
                'message' => 'Notifications sauvegardées et supprimées avec succès'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Erreur lors du backup',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
    

}
