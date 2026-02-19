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
        Schema::create('notibackup', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('article_id');
            $table->string('categorie', 50);
            $table->string('libelle')->nullable();

            $table->float('produit');
            $table->string('unite')->nullable();

            $table->float('prix');

            $table->date('date_ajout');
            $table->time('heure_ajout');

            $table->boolean('lu')->default(false);

            $table->timestamp('backup_at')->nullable();

            // ❌ pas de timestamps car $timestamps = false
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notibackups');
    }
};
