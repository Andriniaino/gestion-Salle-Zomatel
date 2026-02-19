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
        Schema::create('pertes', function (Blueprint $table) {
            $table->id();
            $table->integer('article_id');
            $table->string('categorie', 100);
            $table->decimal('produit', 10, 2);
            $table->text('commentaire')->nullable();
            $table->timestamps();
            
            // Clé étrangère vers la table article
            $table->foreign('article_id')->references('id')->on('article')->onDelete('cascade');
            
            // Index pour améliorer les performances
            $table->index('article_id');
            $table->index('categorie');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pertes');
    }
};
