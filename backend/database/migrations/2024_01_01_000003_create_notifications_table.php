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
        Schema::create('notification', function (Blueprint $table) {
            $table->id();
            $table->integer('article_id');
            $table->string('categorie', 50);
            $table->string('libelle', 50);
            $table->decimal('produit', 10, 2);
            $table->string('unite', 20);
            $table->decimal('prix', 10, 2);
            $table->date('date_ajout');
            $table->time('heure_ajout');
            $table->boolean('lu')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification');
    }
};

