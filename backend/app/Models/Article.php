<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasFactory;

    protected $table = 'article';
    
    protected $primaryKey = 'id';
    
    public $incrementing = false; // ID manuel
    
    protected $keyType = 'int';
    
    public $timestamps = false; // ← AJOUTER CETTE LIGNE pour désactiver les timestamps

    protected $fillable = [
        'id',
        'categorie',
        'libelle',
        'produit',
        'unite',
        'prix',
        'date'
    ];

    // Casts pour les types de données
    protected $casts = [
        'id' => 'integer',
        'produit' => 'decimal:2',
        'prix' => 'decimal:2',
        'date' => 'date',
    ];
}