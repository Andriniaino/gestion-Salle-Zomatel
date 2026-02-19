<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Perte extends Model
{
    protected $table = 'pertes';

    public $timestamps = true;

    protected $fillable = [
        'article_id',
        'categorie',
        'produit',
        'commentaire'
    ];

    protected $casts = [
        'produit' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function article()
    {
        return $this->belongsTo(Article::class, 'article_id');
    }

    
    
}