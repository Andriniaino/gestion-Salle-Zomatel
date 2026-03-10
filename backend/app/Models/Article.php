<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasFactory;

    protected $table      = 'article';
    protected $primaryKey = 'pk';      // Clé primaire technique (surrogate)
    public    $incrementing = true;    // pk auto-increment
    protected $keyType    = 'int';     // pk entier
    public    $timestamps = false;

    protected $fillable = [
        'id',           // ID métier (peut être dupliqué)
        'categorie',
        'libelle',
        'produit',
        'unite',
        'prix',
        'date',
    ];

    protected $casts = [
        'pk'      => 'integer',
        'id'      => 'string',
        'produit' => 'decimal:2',
        'prix'    => 'decimal:2',
        'date'    => 'date:Y-m-d',
    ];
}