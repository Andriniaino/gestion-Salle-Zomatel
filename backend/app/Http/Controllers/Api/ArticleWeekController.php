<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArticleWeek;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Exception;

class ArticleWeekController extends Controller
{
    // Afficher tous les articles par semaine
    public function index()
    {
        try {
            $articleWeeks = ArticleWeek::all();
            return response()->json([
                'success' => true,
                'data' => $articleWeeks
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des articles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Afficher les articles par semaine et année
    public function getByWeek($semaine, $annee)
    {
        try {
            $articleWeeks = ArticleWeek::where('semaine', $semaine)
                                       ->where('annee', $annee)
                                       ->get();
            
            if ($articleWeeks->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun article trouvé pour cette semaine'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $articleWeeks
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des articles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Afficher les articles par article_id
    public function getByArticleId($article_id)
    {
        try {
            $articleWeeks = ArticleWeek::where('article_id', $article_id)->get();
            
            if ($articleWeeks->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun article trouvé pour cet article_id'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $articleWeeks
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des articles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Créer un nouvel article par semaine
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'article_id' => 'required|integer',
                'categorie' => 'required|string|max:100',
                'libelle' => 'required|string|max:100',
                'produit' => 'required|numeric|min:0',
                'date' => 'required|date',
                'semaine' => 'required|integer|min:1|max:53',
                'annee' => 'required|integer|min:2000|max:2100',
            ]);

            $articleWeek = ArticleWeek::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Article créé avec succès',
                'data' => $articleWeek
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

    // Afficher un article par ID
    public function show($id)
    {
        try {
            $articleWeek = ArticleWeek::find($id);
            
            if (!$articleWeek) {
                return response()->json([
                    'success' => false,
                    'message' => 'Article non trouvé'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $articleWeek
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
            $articleWeek = ArticleWeek::find($id);
            
            if (!$articleWeek) {
                return response()->json([
                    'success' => false,
                    'message' => 'Article non trouvé'
                ], 404);
            }

            $validated = $request->validate([
                'article_id' => 'sometimes|required|integer',
                'categorie' => 'sometimes|required|string|max:100',
                'libelle' => 'sometimes|required|string|max:100',
                'produit' => 'sometimes|required|numeric|min:0',
                'date' => 'sometimes|required|date',
                'semaine' => 'sometimes|required|integer|min:1|max:53',
                'annee' => 'sometimes|required|integer|min:2000|max:2100',
            ]);

            $articleWeek->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Article mis à jour avec succès',
                'data' => $articleWeek->fresh()
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

    // Supprimer un article
    public function destroy($id)
    {
        try {
            $articleWeek = ArticleWeek::find($id);
            
            if (!$articleWeek) {
                return response()->json([
                    'success' => false,
                    'message' => 'Article non trouvé'
                ], 404);
            }

            $articleWeek->delete();

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