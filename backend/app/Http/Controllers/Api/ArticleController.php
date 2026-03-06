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

    // ✅ FIX PRINCIPAL : Afficher les articles avec filtre optionnel par catégorie
    // AVANT : Article::all() → ignorait totalement ?categorie=resto
    // APRÈS : filtre LIKE '%resto%' si le paramètre categorie est présent
    public function indexArticle(Request $request)
    {
        try {
            $query = Article::query();

            // ✅ Si le paramètre "categorie" est présent dans l'URL (?categorie=resto)
            if ($request->has('categorie') && !empty($request->get('categorie'))) {
                $categorie = $request->get('categorie');

                // ✅ LIKE '%resto%' pour matcher "boisson/resto" ET "salle/resto"
                // Cela résout le problème : le compte resto reçoit bien ses articles
                $query->where('categorie', 'LIKE', '%' . $categorie . '%');
            }

            $articles = $query->get();

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
                'id' => 'required|string|max:10|unique:article,id',
                'categorie' => 'required|string|max:20',
                'libelle' => 'required|string|max:100',
                'produit' => 'required|numeric|min:0',
                'unite' => 'required|string|max:20',
                'prix' => 'nullable|numeric|min:0',
                'date' => 'required|date',
            ]);

            $article = Article::create($validated);

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
                $notification->refresh();
                event(new NotificationCreated($notification));
            } catch (Exception $e) {
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

    // Afficher un article
    public function show($id)
    {
        try {
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

    // Mettre à jour un article
    public function update(Request $request, $id)
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
                'date_ajout' => 'nullable|date',
                'heure_ajout' => 'nullable|date_format:H:i',
            ]);

            $ancienProduit = $article->produit;
            $dateDuJour = Carbon::now()->format('Y-m-d');

            $article->update([
                'produit' => $validated['produit'],
                'date' => $dateDuJour,
            ]);
            $article->refresh();

            if ($validated['produit'] > $ancienProduit) {
                try {
                    $notification = Notification::create([
                        'article_id' => $article->id,
                        'categorie' => $article->categorie,
                        'libelle' => $article->libelle,
                        'produit' => $validated['produit'] - $ancienProduit,
                        'unite' => $article->unite,
                        'prix' => $article->prix ?? 0,
                        'date_ajout' => Carbon::now()->format('Y-m-d'),
                        'heure_ajout' => Carbon::now()->format('H:i:s'),
                        'lu' => false,
                    ]);
                    $notification->refresh();
                    event(new NotificationCreated($notification));
                } catch (Exception $e) {
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

    // Supprimer un article
    public function destroy($id)
    {
        try {
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