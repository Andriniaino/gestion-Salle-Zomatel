<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\PertesExport;

class PerteExportController extends Controller
{
    public function export(Request $request)
    {
        // Récupération de la catégorie et décodage des caractères spéciaux
        $categorie = urldecode($request->query('categorie', 'tous'));

        // Nom de fichier propre
        $nomFichier = 'pertes_' . str_replace([' ', '/'], ['_', '_'], $categorie) . '_' . date('Y-m-d_H-i-s') . '.xlsx';

        try {
            // Lancer l'export Excel
            return Excel::download(new PertesExport($categorie), $nomFichier);
        } catch (\Exception $e) {
            \Log::error("Erreur export Excel : " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export Excel.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}