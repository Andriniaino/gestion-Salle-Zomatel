<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Autoriser plusieurs enregistrements avec le même ID dans article.
     * - Ajout d'une clé primaire surrogate (pk)
     * - Le champ id devient une colonne ordinaire (non unique)
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        // 1. Pertes : retirer la FK et l'index (si présents)
        try {
            Schema::table('pertes', function (Blueprint $table) {
                $table->dropForeign(['article_id']);
            });
        } catch (\Throwable $e) { /* FK peut être absente */ }
        try {
            Schema::table('pertes', function (Blueprint $table) {
                $table->dropIndex(['article_id']);
            });
        } catch (\Throwable $e) { /* Index peut être absent */ }

        // 2. Article : supprimer la PK sur id
        Schema::table('article', function (Blueprint $table) {
            $table->dropPrimary(['id']);
        });

        // 3. Ajouter la colonne pk
        Schema::table('article', function (Blueprint $table) {
            $table->unsignedBigInteger('pk')->first();
        });

        // 4. Peupler pk pour les enregistrements existants (MySQL)
        if ($driver === 'mysql') {
            DB::statement('SET @rn = 0');
            DB::statement('UPDATE article SET pk = (@rn := @rn + 1) ORDER BY id, libelle, unite');
        } else {
            $rows = DB::table('article')->orderBy('id')->orderBy('libelle')->orderBy('unite')->get();
            foreach ($rows as $i => $row) {
                DB::table('article')
                    ->where('id', $row->id)
                    ->where('libelle', $row->libelle)
                    ->where('unite', $row->unite)
                    ->where('categorie', $row->categorie)
                    ->where('date', $row->date)
                    ->limit(1)
                    ->update(['pk' => $i + 1]);
            }
        }

        // 5. Définir pk comme primary key et auto_increment
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE article MODIFY pk BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST');
        } else {
            Schema::table('article', function (Blueprint $table) {
                $table->unsignedBigInteger('pk')->nullable(false)->change();
                $table->primary('pk');
            });
        }

        Schema::table('article', function (Blueprint $table) {
            $table->index('id');
        });

        // 6. Pertes : migrer article_id (varchar) -> article_id (bigint, référence article.pk)
        Schema::table('pertes', function (Blueprint $table) {
            $table->unsignedBigInteger('article_pk_temp')->nullable()->after('id');
        });

        foreach (DB::table('pertes')->get() as $perte) {
            $art = DB::table('article')->where('id', $perte->article_id)->first();
            if ($art) {
                DB::table('pertes')->where('id', $perte->id)->update(['article_pk_temp' => $art->pk]);
            }
        }

        // Supprimer les pertes orphelines (article inexistant)
        DB::table('pertes')->whereNull('article_pk_temp')->delete();

        Schema::table('pertes', function (Blueprint $table) {
            $table->dropColumn('article_id');
        });
        // CHANGE fonctionne sur MySQL et MariaDB
        DB::statement('ALTER TABLE pertes CHANGE article_pk_temp article_id BIGINT UNSIGNED NOT NULL');
        Schema::table('pertes', function (Blueprint $table) {
            $table->index('article_id');
            $table->foreign('article_id')->references('pk')->on('article')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('pertes', function (Blueprint $table) {
            $table->dropForeign(['article_id']);
            $table->dropIndex(['article_id']);
        });

        Schema::table('pertes', function (Blueprint $table) {
            $table->string('article_id_old', 10)->nullable()->after('id');
        });
        foreach (DB::table('pertes')->get() as $perte) {
            $art = DB::table('article')->where('pk', $perte->article_id)->first();
            if ($art) {
                DB::table('pertes')->where('id', $perte->id)->update(['article_id_old' => $art->id]);
            }
        }
        Schema::table('pertes', function (Blueprint $table) {
            $table->dropColumn('article_id');
        });
        DB::statement('ALTER TABLE pertes CHANGE article_id_old article_id VARCHAR(10) NOT NULL');
        Schema::table('pertes', function (Blueprint $table) {
            $table->string('article_id', 10)->nullable(false)->change();
            $table->index('article_id');
            $table->foreign('article_id')->references('id')->on('article')->onDelete('cascade');
        });

        Schema::table('article', function (Blueprint $table) {
            $table->dropPrimary(['pk']);
            $table->dropIndex(['id']);
            $table->dropColumn('pk');
            $table->primary('id');
        });
    }
};
