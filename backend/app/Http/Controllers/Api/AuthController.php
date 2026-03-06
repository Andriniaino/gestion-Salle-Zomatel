<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // LOGIN — ✅ FIX : retourne un token Sanctum
    public function login(Request $request)
    {
        $request->validate([
            'mail' => 'required|email',
            'password' => 'required',
        ]);

        // Chercher l'utilisateur par email
        $user = User::where('email', $request->mail)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Identifiants invalides'
            ], 401);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Mot de passe incorrect'
            ], 401);
        }

        // ✅ FIX CRITIQUE : créer un token Sanctum pour TOUS les utilisateurs
        // Sans token, /me échoue au refresh et l'utilisateur est déconnecté
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,           // ✅ token retourné
            'access_token' => $token,    // ✅ alias pour compatibilité AuthContext
            'user' => $user
        ]);
    }

    // ME — ✅ FIX : utiliser auth:sanctum uniquement
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // LOGOUT — ✅ FIX : révoquer le token actuel
    public function logout(Request $request)
    {
        // Révoquer le token si disponible
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie'
        ]);
    }
}
