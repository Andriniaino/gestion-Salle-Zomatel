<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $table = 'notification';

    // 👇 IMPORTANT : désactiver timestamps
    public $timestamps = false;

    protected $fillable = [
        'article_id',
        'categorie',
        'libelle',
        'produit',
        'unite',
        'prix',
        'date_ajout',
        'heure_ajout',
        'lu'
    ];

    protected $casts = [
        'lu' => 'boolean',
        'produit' => 'float',
        'prix' => 'float',
    ];
}
