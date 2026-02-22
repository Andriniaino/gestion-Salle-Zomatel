<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\ArticleWeek;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * Tâche hebdomadaire : chaque dimanche à 23h59
 * - Copie toutes les données de la table article (sur la semaine) vers articleweek
 * - Remet à 0 la colonne produit dans article
 */
class WeeklyArticleBackup extends Command
{
    protected $signature = 'articles:weekly-backup';

    protected $description = 'Copie les articles vers articleweek (semaine en cours) et remet produit à 0';

    public function handle(): int
    {
        $now = Carbon::now();
        $semaine = (int) $now->weekOfYear;
        $annee = (int) $now->year;

        $this->info("Début de la sauvegarde hebdomadaire (semaine {$semaine}, année {$annee}).");

        $articles = Article::all();

        if ($articles->isEmpty()) {
            $this->warn('Aucun article à copier.');
        } else {
            $count = 0;
            foreach ($articles as $article) {
                ArticleWeek::create([
                    'article_id' => $article->id,
                    'categorie' => $article->categorie,
                    'libelle' => $article->libelle,
                    'produit' => $article->produit,
                    'date' => $article->date ?? $now->toDateString(),
                    'semaine' => $semaine,
                    'annee' => $annee,
                ]);
                $count++;
            }
            $this->info("{$count} enregistrement(s) copié(s) vers articleweek.");
        }

        // Remettre à 0 la colonne produit dans article
        Article::query()->update(['produit' => 0]);
        $this->info('Colonne produit remise à 0 dans la table article.');

        return self::SUCCESS;
    }
}
