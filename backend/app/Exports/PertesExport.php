<?php

namespace App\Exports;

use App\Models\Perte;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class PertesExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    protected ?string $categorie;

    public function __construct(?string $categorie = null)
    {
        $this->categorie = $categorie ? trim($categorie) : null;
    }

    public function query()
    {
        $q = Perte::query()
            ->with('article')
            ->orderByDesc('created_at');

        if ($this->categorie && strtolower($this->categorie) !== 'tous') {
            // Tolère les variations d'espaces autour du slash.
            $needle = preg_replace('/\s*\/\s*/', '/', $this->categorie);
            $q->where(function (Builder $sub) use ($needle) {
                $sub->where('categorie', $this->categorie)
                    ->orWhereRaw("REPLACE(categorie, ' ', '') = ?", [str_replace(' ', '', $this->categorie)])
                    ->orWhereRaw("REPLACE(categorie, ' ', '') = ?", [str_replace(' ', '', str_replace('/', ' / ', $needle))])
                    ->orWhere('categorie', 'like', '%' . $this->categorie . '%');
            });
        }

        return $q;
    }

    public function headings(): array
    {
        return [
            'ID Perte',
            'Article',
            'Catégorie',
            'Quantité perdue',
            'Commentaire',
            'Date',
        ];
    }

    /**
     * @param \App\Models\Perte $perte
     */
    public function map($perte): array
    {
        return [
            $perte->id,
            optional($perte->article)->libelle,
            $perte->categorie ?? optional($perte->article)->categorie,
            $perte->produit,
            $perte->commentaire,
            optional($perte->created_at)->format('Y-m-d H:i:s'),
        ];
    }
}