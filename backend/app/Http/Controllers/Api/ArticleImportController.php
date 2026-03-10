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
                'message' => "Import terminé : {$stats['inserted']} insérés, {$stats['updated']} mis à jour, {$stats['skipped']} ignorés",
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

    // =========================================================
    // ✅ NOUVELLE FONCTION : Nettoyer l'ID proprement
    // "1.0" → "1" | "ART-001" → "ART-001" | " 01 " → "01"
    // =========================================================
    private function cleanId($rawId): ?string
    {
        if ($rawId === null || trim((string) $rawId) === '') {
            return null;
        }

        $id = trim((string) $rawId);

        // ✅ Excel transforme "1" en "1.0" → on retire le .0 parasite
        if (preg_match('/^\d+\.0+$/', $id)) {
            $id = (string)(int) $id;
        }

        return $id;
    }

    /**
     * Import CSV
     */
    private function importCSV($file)
    {
        $stats = ['inserted' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => []];

        $handle = fopen($file->getRealPath(), 'r');
        if (!$handle) {
            throw new \Exception("Impossible d'ouvrir le fichier CSV");
        }

        $headers    = array_map('strtolower', array_map('trim', fgetcsv($handle)));
        $lineNumber = 1;

        while (($row = fgetcsv($handle)) !== false) {
            $lineNumber++;

            if (empty(array_filter($row))) {
                $stats['skipped']++;
                continue;
            }

            if (count($headers) !== count($row)) {
                $stats['errors'][] = "Ligne $lineNumber : nombre de colonnes incorrect";
                $stats['skipped']++;
                continue;
            }

            $data        = array_combine($headers, $row);
            $articleData = $this->mapRowData($data);
            $this->saveArticle($articleData, $stats, $lineNumber);
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

        $stats = ['inserted' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => []];

        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet       = $spreadsheet->getActiveSheet();

        $rows = $sheet->toArray(
            null,   // nullValue
            true,   // calculateFormulas
            true,   // formatData → préserve le format original
            false   // returnCellRef
        );

        $headers    = array_map('strtolower', array_map('trim', array_shift($rows)));
        $lineNumber = 1;

        foreach ($rows as $row) {
            $lineNumber++;

            if (empty(array_filter($row))) {
                $stats['skipped']++;
                continue;
            }

            if (count($headers) !== count($row)) {
                $stats['errors'][] = "Ligne $lineNumber : nombre de colonnes incorrect";
                $stats['skipped']++;
                continue;
            }

            $data        = array_combine($headers, $row);
            $articleData = $this->mapRowData($data);
            $this->saveArticle($articleData, $stats, $lineNumber);
        }

        return $stats;
    }

    /**
     * Mapper les données — ID nettoyé via cleanId()
     */
    private function mapRowData(array $data): array
    {
        return [
            // ✅ cleanId() règle le problème "1.0" → "1"
            'id'        => $this->cleanId($data['id'] ?? null),

            'categorie' => isset($data['categorie']) ? trim($data['categorie']) : null,
            'libelle'   => isset($data['libelle'])   ? trim($data['libelle'])   : null,
            'produit'   => isset($data['produit']) && $data['produit'] !== ''
                            ? (float) $data['produit'] : 0,
            'unite'     => isset($data['unite'])     ? trim($data['unite'])     : null,
            'prix'      => isset($data['prix']) && $data['prix'] !== ''
                            ? (float) $data['prix'] : null,
            'date'      => Carbon::now()->format('Y-m-d'),
        ];
    }

    /**
     * Insert / Update — updateOrCreate évite tout doublon
     */
    private function saveArticle(array $data, array &$stats, int $lineNumber = 0)
    {
        $validator = Validator::make($data, [
            'id'        => 'required|string|max:50',
            'categorie' => 'required|string|max:20',
            'libelle'   => 'required|string|max:100',
            'produit'   => 'required|numeric|min:0',
            'unite'     => 'required|string|max:20',
            'prix'      => 'nullable|numeric|min:0',
            'date'      => 'required|date',
        ]);

        if ($validator->fails()) {
            $stats['skipped']++;
            $stats['errors'][] = "Ligne $lineNumber : " . implode(', ', $validator->errors()->all());
            return;
        }

        // Insertion directe : l'ID peut être dupliqué, on insère toujours un nouvel enregistrement
        Article::create([
            'id'        => $data['id'],
            'categorie' => $data['categorie'],
            'libelle'   => $data['libelle'],
            'produit'   => $data['produit'],
            'unite'     => $data['unite'],
            'prix'      => $data['prix'],
            'date'      => $data['date'],
        ]);
        $stats['inserted']++;
    }
}