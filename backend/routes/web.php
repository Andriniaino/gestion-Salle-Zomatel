<?php

use Illuminate\Support\Facades\Route;

use Illuminate\Support\Facades\Mail;
use App\Mail\PerteSignaleeMail;

Route::get('/test-mail', function () {
    Mail::to('johanesaalitera@gmail.com')->send(new PerteSignaleeMail());
    return 'Mail envoyé';
});
Route::get('/', function () {
    return view('welcome');
});
