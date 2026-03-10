<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // D'abord, retirer les contraintes qui dépendent de article_id (si elles existent)
        try {
            Schema::table('pertes', function (Blueprint $table) {
                $table->dropForeign(['article_id']);
            });
        } catch (\Throwable $e) {
            // Ignorer si la FK n'existe pas
        }
        try {
            Schema::table('pertes', function (Blueprint $table) {
                $table->dropIndex(['article_id']);
            });
        } catch (\Throwable $e) {
            // Ignorer si l'index n'existe pas
        }

        // Changer le type de article.id en VARCHAR(10)
        Schema::table('article', function (Blueprint $table) {
            $table->string('id', 10)->change();
        });

        // Changer le type de toutes les colonnes article_id liées en VARCHAR(10)
        Schema::table('articleweek', function (Blueprint $table) {
            $table->string('article_id', 10)->change();
        });

        Schema::table('pertes', function (Blueprint $table) {
            $table->string('article_id', 10)->change();
            $table->index('article_id');
            // FK non recréée ici : la migration allow_duplicate_article_id la gère
        });

        Schema::table('notification', function (Blueprint $table) {
            $table->string('article_id', 10)->change();
        });

        Schema::table('notibackup', function (Blueprint $table) {
            $table->string('article_id', 10)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Annuler les changements en sens inverse
        Schema::table('pertes', function (Blueprint $table) {
            $table->dropForeign(['article_id']);
            $table->dropIndex(['article_id']);
        });

        Schema::table('notibackup', function (Blueprint $table) {
            $table->unsignedBigInteger('article_id')->change();
        });

        Schema::table('notification', function (Blueprint $table) {
            $table->integer('article_id')->change();
        });

        Schema::table('pertes', function (Blueprint $table) {
            $table->integer('article_id')->change();

            $table->index('article_id');
            $table->foreign('article_id')
                ->references('id')
                ->on('article')
                ->onDelete('cascade');
        });

        Schema::table('articleweek', function (Blueprint $table) {
            $table->integer('article_id')->change();
        });

        Schema::table('article', function (Blueprint $table) {
            $table->integer('id')->change();
        });
    }
};

