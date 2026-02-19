<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\ArticleWeekController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PerteController;
use App\Http\Controllers\Api\PerteExportController;
use App\Http\Controllers\Api\ArticleImportController;





    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::apiResource('users', UserController::class);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
    Route::post('auth/register', [UserController::class, 'store']); // Alias pour /api/auth/register





// Routes pour Article
Route::prefix('articles')->group(function () {
    Route::get('/', [ArticleController::class, 'indexArticle']);
    Route::get('export/excel', [ArticleController::class, 'exportExcel']);
    Route::get('{id}', [ArticleController::class, 'show']);
    Route::post('/', [ArticleController::class, 'store']);
    Route::put('{id}', [ArticleController::class, 'update']);
    Route::patch('{id}/produit', [ArticleController::class, 'updateProduit']);
    Route::delete('{id}', [ArticleController::class, 'destroy']);
    Route::get('/template', [ArticleImportController::class, 'downloadTemplate']);
    Route::post('/import', [ArticleImportController::class, 'importFile']);

    
   // Route::get('/', [ArticleImportController::class, 'index']);
});

// Routes pour ArticleWeek
Route::prefix('articleweeks')->group(function () {
    Route::get('/', [ArticleWeekController::class, 'index']);
    Route::get('{id}', [ArticleWeekController::class, 'show']);
    Route::get('week/{semaine}/{annee}', [ArticleWeekController::class, 'getByWeek']);
    Route::get('article/{article_id}', [ArticleWeekController::class, 'getByArticleId']);
    Route::post('/', [ArticleWeekController::class, 'store']);
    Route::put('{id}', [ArticleWeekController::class, 'update']);
    Route::delete('{id}', [ArticleWeekController::class, 'destroy']);
});


// Routes pour notification
Route::prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/unread', [NotificationController::class, 'unread']);
    Route::get('{id}', [NotificationController::class, 'show']);
    Route::post('/', [NotificationController::class, 'store']);
    Route::put('{id}', [NotificationController::class, 'update']);
    Route::delete('/backup-delete', [NotificationController::class, 'backupAndDeleteAll']);


});
    //pertess Cient
    Route::get('/pertes/search', [PerteController::class, 'search']);
    Route::post('/pertes', [PerteController::class, 'store']);

    Route::get('/pertes', [PerteController::class, 'index']);
    Route::put('/pertes/{id}', [PerteController::class, 'update']);
    Route::delete('/pertes/{id}', [PerteController::class, 'destroy']);
    Route::get('/pertes/export', [PerteExportController::class, 'export']);
    Route::get('/pertes/{id}', [PerteController::class, 'show']);


