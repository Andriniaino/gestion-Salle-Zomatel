<?php

namespace App\Exports;

use App\Models\Article;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ArticlesExport implements FromCollection, WithHeadings, WithMapping
{
    protected $search;

    public function __construct($search = null)
    {
        $this->search = $search;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        $query = Article::query();
        
        if ($this->search) {
            $query->where(function($q) {
                $q->where('categorie', 'like', '%' . $this->search . '%')
                  ->orWhere('libelle', 'like', '%' . $this->search . '%');
            });
        }
        
        return $query->get();
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'ID',
            'Catégorie',
            'Libellé',
            'Produit',
            'Unité',
            'Prix',
            'Date'
        ];
    }

    /**
     * @param Article $article
     * @return array
     */
    public function map($article): array
    {
        return [
            $article->id,
            $article->categorie,
            $article->libelle,
            $article->produit,
            $article->unite,
            $article->prix,
            $article->date ? $article->date->format('Y-m-d') : '',
        ];
    }
}
