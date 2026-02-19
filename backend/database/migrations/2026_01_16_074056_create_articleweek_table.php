<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('articleweek', function (Blueprint $table) {
            $table->id();
            $table->integer('article_id');
            $table->string('categorie', 50);
            $table->string('libelle', 50);
            $table->decimal('produit', 10, 2);
            $table->date('date');
            $table->integer('semaine');
            $table->integer('annee');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articleweek');
    }
};
