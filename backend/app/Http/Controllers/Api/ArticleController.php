<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Notification;
use App\Events\NotificationCreated;
use App\Exports\ArticlesExport;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Exception;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class ArticleController extends Controller
{
    // Export Excel
    public function exportExcel(Request $request)
    {
        try {
            $search = $request->get('search');
            $export = new ArticlesExport($search);
            
            $filename = 'Articles_' . date('Y-m-d_His') . '.xlsx';
            
            return Excel::download($export, $filename);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export Excel',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Afficher tous les articles
    public function indexArticle()
    {
        try {
            $articles = Article::all();
            return response()->json([
                'success' => true,
                'data' => $articles
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des articles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Ajouter un article
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'id' => 'required|integer|unique:article,id',
                'categorie' => 'required|string|max:20',
                'libelle' => 'required|string|max:100',
                'produit' => 'required|numeric|min:0',
                'unite' => 'required|string|max:20',
                'prix' => 'nullable|numeric|min:0',
                'date' => 'required|date',
            ]);

            $article = Article::create($validated);

            // Créer une notification pour l'ajout d'article
            try {
                $notification = Notification::create([
                    'article_id' => $article->id,
                    'categorie' => $article->categorie,
                    'libelle' => $article->libelle,
                    'produit' => $article->produit,
                    'unite' => $article->unite,
                    'prix' => $article->prix ?? 0,
                    'date_ajout' => $article->date ?? Carbon::now()->format('Y-m-d'),
                    'heure_ajout' => Carbon::now()->format('H:i:s'),
                    'lu' => false,
                ]);

                // Rafraîchir la notification pour avoir toutes les données à jour
                $notification->refresh();

                // Émettre l'événement de notification (diffusion immédiate)
                event(new NotificationCreated($notification));
                
                \Log::info('Notification créée et événement émis', [
                    'notification_id' => $notification->id,
                    'article_id' => $article->id
                ]);
            } catch (Exception $e) {
                // Logger l'erreur mais ne pas faire échouer la création d'article
                \Log::error('Erreur lors de la création de notification: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Article créé avec succès',
                'data' => $article
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'article',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Afficher un article - UTILISER WHERE AU LIEU DE FIND
    public function show($id)
    {
        try {
            // Utiliser where() pour éviter les problèmes de type
            $article = Article::where('id', $id)->first();
            
            if (!$article) {
                return response()->json([
                    'success' => false,
                    'message' => 'Article non trouvé'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $article
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'article',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Mettre à jour un article - UTILISER WHERE AU LIEU DE FIND
    public function update(Request $request, $id)
    {
        try {
            // Utiliser where() pour éviter les problèmes de type
            $article = Article::where('id', $id)->first();
            
            if (!$article) {
                return response()->json([
                    'success' => false,
                    'message' => 'Article non trouvé'
                ], 404);
            }

            $validated = $request->validate([
                'categorie' => 'sometimes|required|string|max:20',
                'libelle' => 'sometimes|required|string|max:100',
                'produit' => 'sometimes|required|numeric|min:0',
                'unite' => 'sometimes|required|string|max:20',
                'prix' => 'nullable|numeric|min:0',
                'date' => 'sometimes|required|date',
            ]);

            $article->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Article mis à jour avec succès',
                'data' => $article->fresh()
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'article',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Mettre à jour uniquement le produit
    public function updateProduit(Request $request, $id)
    {
        try {
            $article = Article::where('id', $id)->first();
            
            if (!$article) {
                return response()->json([
                    'success' => false,
                    'message' => 'Article non trouvé'
                ], 404);
            }

            $validated = $request->validate([
                'produit' => 'required|numeric|min:0',
                'date_ajout' => 'nullable|date', // Accepté mais non utilisé pour la notification
                'heure_ajout' => 'nullable|date_format:H:i', // Accepté mais non utilisé pour la notification
            ]);

            $ancienProduit = $article->produit;
            
            // Mettre à jour le produit ET la date avec la date du jour
            $dateDuJour = Carbon::now()->format('Y-m-d');
            $article->update([
                'produit' => $validated['produit'],
                'date' => $dateDuJour, // Mettre à jour la date avec la date du jour
            ]);
            $article->refresh();

            // Créer une notification uniquement si la quantité a augmenté
            if ($validated['produit'] > $ancienProduit) {
                try {
                    // Toujours utiliser la date et l'heure actuelles du serveur pour la notification
                    $dateNotification = Carbon::now()->format('Y-m-d');
                    $heureNotification = Carbon::now()->format('H:i:s');
                    
                    $notification = Notification::create([
                        'article_id' => $article->id,
                        'categorie' => $article->categorie,
                        'libelle' => $article->libelle,
                        'produit' => $validated['produit'] - $ancienProduit, // Quantité ajoutée
                        'unite' => $article->unite,
                        'prix' => $article->prix ?? 0,
                        'date_ajout' => $dateNotification, // Date actuelle du serveur
                        'heure_ajout' => $heureNotification, // Heure actuelle du serveur
                        'lu' => false,
                    ]);

                    // Rafraîchir la notification pour avoir toutes les données à jour
                    $notification->refresh();

                    // Émettre l'événement de notification (diffusion immédiate)
                    event(new NotificationCreated($notification));
                    
                    \Log::info('Notification créée lors de la mise à jour et événement émis', [
                        'notification_id' => $notification->id,
                        'article_id' => $article->id
                    ]);
                } catch (Exception $e) {
                    // Logger l'erreur mais ne pas faire échouer la mise à jour
                    \Log::error('Erreur lors de la création de notification: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Produit mis à jour avec succès',
                'data' => $article->fresh()
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du produit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Supprimer un article - UTILISER WHERE AU LIEU DE FIND
    public function destroy($id)
    {
        try {
            // Utiliser where() pour éviter les problèmes de type
            $article = Article::where('id', $id)->first();
            
            if (!$article) {
                return response()->json([
                    'success' => false,
                    'message' => 'Article non trouvé'
                ], 404);
            }

            $article->delete();

            return response()->json([
                'success' => true,
                'message' => 'Article supprimé avec succès'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'article',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}