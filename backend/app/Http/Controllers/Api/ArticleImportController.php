<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ArticleImportController extends Controller
{
    /**
     * Import CSV ou Excel
     * Fonction renommée pour matcher le route
     */
    public function importFile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Fichier invalide',
                'errors'  => $validator->errors()
            ], 422);
        }

        $file = $request->file('file');
        $ext  = strtolower($file->getClientOriginalExtension());

        try {
            if (in_array($ext, ['csv', 'txt'])) {
                $stats = $this->importCSV($file);
            } else {
                $stats = $this->importExcel($file);
            }

            return response()->json([
                'success' => true,
                'message' => 'Import terminé avec succès',
                'stats'   => $stats
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur import article : ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur import : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import CSV
     */
    private function importCSV($file)
    {
        $stats = ['inserted' => 0, 'updated' => 0, 'skipped' => 0];

        $handle = fopen($file->getRealPath(), 'r');
        if (!$handle) {
            throw new \Exception('Impossible d’ouvrir le fichier CSV');
        }

        $headers = array_map('strtolower', fgetcsv($handle));

        while (($row = fgetcsv($handle)) !== false) {
            if (empty(array_filter($row))) {
                $stats['skipped']++;
                continue;
            }

            $data = array_combine($headers, $row);

            $articleData = [
                'id'        => isset($data['id']) ? (int) $data['id'] : null,
                'categorie' => trim($data['categorie']),
                'libelle'   => trim($data['libelle']),
                'produit'   => isset($data['produit']) ? (float) $data['produit'] : 0,
                'unite'     => trim($data['unite']),
                'prix'      => isset($data['prix']) && $data['prix'] !== '' ? (float) $data['prix'] : null,
                'date'      => Carbon::now()->format('Y-m-d'),
            ];

            $this->saveArticle($articleData, $stats);
        }

        fclose($handle);
        return $stats;
    }

    /**
     * Import Excel
     */
    private function importExcel($file)
    {
        if (!class_exists(IOFactory::class)) {
            throw new \Exception('PhpSpreadsheet non installé');
        }

        $stats = ['inserted' => 0, 'updated' => 0, 'skipped' => 0];

        $sheet = IOFactory::load($file->getRealPath())
                    ->getActiveSheet()
                    ->toArray();

        $headers = array_map('strtolower', array_shift($sheet));

        foreach ($sheet as $row) {
            if (empty(array_filter($row))) {
                $stats['skipped']++;
                continue;
            }

            $data = array_combine($headers, $row);

            $articleData = [
                'id'        => isset($data['id']) ? (int) $data['id'] : null,
                'categorie' => trim($data['categorie']),
                'libelle'   => trim($data['libelle']),
                'produit'   => isset($data['produit']) ? (float) $data['produit'] : 0,
                'unite'     => trim($data['unite']),
                'prix'      => isset($data['prix']) && $data['prix'] !== '' ? (float) $data['prix'] : null,
                'date'      => Carbon::now()->format('Y-m-d'),
            ];

            $this->saveArticle($articleData, $stats);
        }

        return $stats;
    }

    /**
     * Insert / Update article
     */
    private function saveArticle(array $data, array &$stats)
    {
        $validator = Validator::make($data, [
            'id'        => 'required|integer|min:1',
            'categorie' => 'required|string|max:20',
            'libelle'   => 'required|string|max:100',
            'produit'   => 'required|numeric|min:0',
            'unite'     => 'required|string|max:20',
            'prix'      => 'nullable|numeric|min:0',
            'date'      => 'required|date',
        ]);

        if ($validator->fails()) {
            $stats['skipped']++;
            return;
        }

        $article = Article::where('id', $data['id'])->first();

        if ($article) {
            $article->update($data);
            $stats['updated']++;
        } else {
            Article::create($data);
            $stats['inserted']++;
        }
    }
}
