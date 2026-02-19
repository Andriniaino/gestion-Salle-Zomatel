<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Perte;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;


class PerteController extends Controller
{
    /**
     * Rechercher un article par libellé
     */
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2',
            // optionnel: fallback si Auth::user() indisponible (ex: API non protégée)
            'categorie' => 'nullable|string|max:50',
        ]);

        try {
            $userCategorie = Auth::user()->categorie ?? $request->input('categorie');

            $articlesQuery = Article::query()
                ->where('libelle', 'like', '%' . $request->q . '%');

            // Filtrage strict par catégorie du compte (sauf admin)
            if (!empty($userCategorie) && $userCategorie !== 'admin') {
                $articlesQuery->where(function ($q) use ($userCategorie) {
                    $q->where('categorie', 'like', '%/' . $userCategorie)
                      ->orWhere('categorie', $userCategorie);
                });
            }

            $articles = $articlesQuery
                ->limit(10)
                ->get();

            return response()->json($articles);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    //affichages de pertes


    public function index()
    {
        $pertes = \App\Models\Perte::with('article')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pertes
        ]);
    }
   


    public function store(Request $request)
    {
        try {
            $request->validate([
                'article_id' => 'required|integer',
                'categorie'  => 'required|string|max:50',
                'produit'    => 'required|numeric',
                'commentaire'=> 'nullable|string',
            ]);

            $perte = Perte::create([
                'article_id' => $request->article_id,
                'categorie'  => $request->categorie,
                'produit'    => $request->produit,
                'commentaire'=> $request->commentaire,
            ]);

            

            // 4️⃣ Récupération de l’article
            $article = Article::find($request->article_id);

            // 🔹 Origine : utilisateur connecté
            $user = Auth::user();
            $origine = $user ? "{$user->name} ({$user->email})" : ucfirst($request->categorie);


            // 3️⃣ Envoi mail
            Mail::raw(
                "⚠️ PERTE DÉTECTÉE\n\n"
                . "Article : " . ($article->libelle ?? 'Inconnu') . "\n"
                . "Catégorie : " . $request->categorie . "\n"
                . "Produit perdue : " . $request->produit . "\n"
                . "Commentaire : " . ($request->commentaire ?? 'Aucun') . "\n"
                . "Date : " . now()->format('d/m/Y H:i'),
                function ($message) use ($origine) {
                    $message->to('johanesaalitera@gmail.com')
                            ->subject("⚠️ Alerte Perte en — {$origine}");
                }
            );


            // 5️⃣ Réponse API
            return response()->json([
                'success' => true,
                'message' => 'Perte enregistrée et email envoyé avec succès',
                'data'    => $perte
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Modification d'une perte
     */
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'produit' => 'required|numeric|min:0.01',
                'commentaire' => 'nullable|string|max:1000'
            ]);

            $perte = Perte::find($id);
            if (!$perte) {
                return response()->json([
                    'success' => false,
                    'message' => 'Perte introuvable'
                ], 404);
            }

            $perte->update([
                'produit' => (float) $request->produit,
                'commentaire' => $request->filled('commentaire') ? (string) $request->commentaire : null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Perte modifiée avec succès',
                'data' => $perte->fresh()->load('article')
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            \Log::error('Erreur modification perte: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification de la perte.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }


    /* =========================
    DELETE PERTE
    ========================= */
    public function destroy($id)
    {
    $perte = Perte::find($id);


    if (!$perte) {
    return response()->json([
            'success' => false,
            'message' => 'Perte introuvable'
     ], 404);
    }


    $perte->delete();


    return response()->json([
            'success' => true,
            'message' => 'Perte supprimée avec succès'
        ]);
    }



}