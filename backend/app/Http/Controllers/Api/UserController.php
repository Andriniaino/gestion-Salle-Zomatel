<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    /**
     * Afficher tous les utilisateurs
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'message' => 'Liste des utilisateurs récupérée avec succès',
            'data' => User::all()
        ]);
    }

    /**
     * Créer un nouvel utilisateur
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'nom'       => 'required|string|max:100',
                'prenoms'   => 'required|string|max:150',
                'email'     => 'required|email|unique:users,email',
                'password'  => 'required|min:6',
                'categorie' => 'required|string|max:50',
                // ✅ Image optionnelle dès la création
                'image'     => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            ]);
    
            // ✅ Gestion de l'image si envoyée
            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('avatars', 'public');
            }
    
            $user = User::create([
                'nom'       => $request->nom,
                'prenoms'   => $request->prenoms,
                'email'     => $request->email,
                'password'  => Hash::make($request->password),
                'categorie' => $request->categorie,
                'image'     => $imagePath, // ✅ null si pas d'image
            ]);
    
            return response()->json([
                'success' => true,
                'message' => 'Utilisateur ajouté avec succès',
                'data'    => $user
            ], 201);
    
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors'  => $e->errors()
            ], 422);
    
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Mettre à jour un utilisateur
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => "Utilisateur avec l'ID $id introuvable"
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nom'       => 'sometimes|string|max:100',
            'prenoms'   => 'sometimes|string|max:150',
            'email'     => 'sometimes|email|unique:users,email,' . $id,
            'password'  => 'sometimes|string|min:6',
            'categorie' => 'sometimes|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors'  => $validator->errors()
            ], 422);
        }

        $data = $request->only(['nom', 'prenoms', 'email', 'password', 'categorie']);
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update(array_filter($data, fn($v) => $v !== null && $v !== ''));

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur modifié avec succès',
            'data'    => $user
        ]);
    }

    /**
     * Mettre à jour la photo de profil
     */
    public function uploadAvatar(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => "Utilisateur introuvable"
            ], 404);
        }

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        // Supprimer l'ancienne image si elle existe
        if ($user->image) {
            Storage::disk('public')->delete($user->image);
        }

        // Stocker la nouvelle image
        $path = $request->file('image')->store('avatars', 'public');

        $user->update(['image' => $path]);

        $url = asset('storage/' . $path);

        return response()->json([
            'success' => true,
            'message' => 'Photo de profil mise à jour',
            'data' => ['user' => $user->fresh(), 'image_url' => $url]
        ]);
    }

    /**
     * Supprimer un utilisateur
     */
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => "Utilisateur avec l'ID $id introuvable"
            ], 404);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur supprimé avec succès'
        ]);
    }
}
