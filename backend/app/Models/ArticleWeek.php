<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArticleWeek extends Model
{
    use HasFactory;

    protected $table = 'articleweek';

    protected $fillable = [
        'article_id',
        'categorie',
        'libelle',
        'produit',
        'date',
        'semaine',
        'annee'
    ];

    // Casts pour les types de données
    protected $casts = [
        'article_id' => 'integer',
        'produit' => 'decimal:2',
        'date' => 'date',
        'semaine' => 'integer',
        'annee' => 'integer',
    ];

    // Relation avec Article (optionnelle)
    public function article()
    {
        return $this->belongsTo(Article::class, 'article_id', 'id');
    }
}