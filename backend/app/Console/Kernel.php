<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Chaque dimanche à 23h59 : copie article → articleweek puis remet produit à 0
        $schedule->command('articles:weekly-backup')
            ->weeklyOn(0, '23:59')
            ->timezone(config('app.timezone', 'UTC'));
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
