<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('article', function (Blueprint $table) {
            $table->integer('id')->primary();         
            $table->string('categorie', 50);           
            $table->string('libelle', 50);           
            $table->decimal('produit', 10, 2)->default(0); 
            $table->string('unite',20);    
            $table->decimal('prix', 10, 2)->nullable();
            $table->date('date');                     
            $table->timestamps();                     
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article');
    }
};
