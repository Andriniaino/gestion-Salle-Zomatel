<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    // LOGIN
    public function login(Request $request)
    {
        $request->validate([
            'mail' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt(['email' => $request->mail, 'password' => $request->password])) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'user' => Auth::user()
        ]);
    }

    // ME (récupérer utilisateur connecté)
    public function me()
    {
        return response()->json(Auth::user());
    }

    // LOGOUT
    public function logout()
    {
        Auth::logout();
        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie'
        ]);
    }
}
