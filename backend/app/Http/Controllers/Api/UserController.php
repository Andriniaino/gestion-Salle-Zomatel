<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;           // <- Import du model User
use Illuminate\Support\Facades\Validator; // <- Import Validator
use Illuminate\Support\Facades\Hash;      // <- Import Hash

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
        // Validation
        $request->validate([
            'nom' => 'required|string|max:100',
            'prenoms' => 'required|string|max:150',
            'email' => 'required|email|unique:users,email',  // Changé de 'mail' à 'email'
            'password' => 'required|min:6',
            'confirmPassword' => 'required|same:password',
            'categorie' => 'required|string|max:50',
        ]);

        // Création
        $user = User::create([
            'nom' => $request->nom,
            'prenoms' => $request->prenoms,
            'email' => $request->email,  // Changé de $request->mail à $request->email
            'password' => Hash::make($request->password),  // Hash explicite
            'categorie' => $request->categorie,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur ajouté avec succès',
            'data' => $user
        ], 201);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur de validation',
            'errors' => $e->errors()
        ], 422);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur serveur: '.$e->getMessage()
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
            'name'      => 'sometimes|string|max:100',
            'email'     => 'sometimes|email|unique:users,email,' . $id,
            'password'  => 'sometimes|string|min:6',
            'categorie' => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors'  => $validator->errors()
            ], 422);
        }

        $data = $request->all();
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur modifié avec succès',
            'data'    => $user
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
