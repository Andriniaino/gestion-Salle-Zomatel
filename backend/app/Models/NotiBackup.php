<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotiBackup extends Model
{
    protected $table = 'notibackup';
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
        'lu',
        'backup_at'
    ];

    // 👇 cast mitovy amin'ny Notification
    protected $casts = [
        'lu' => 'boolean',
        'produit' => 'float',
        'prix' => 'float',
        'backup_at' => 'datetime',
    ];
}
