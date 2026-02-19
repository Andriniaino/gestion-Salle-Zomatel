-- Script de création de la base de données PostgreSQL
-- Base de données : Production, mot de passe: 123456789

-- Table utilisateur
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY, 
    nom VARCHAR(50) NOT NULL,
    prenoms VARCHAR(100) NOT NULL,
    mail VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    categorie VARCHAR(20) CHECK (categorie IN ('admin', 'resto', 'snack', 'detente')) NOT NULL
);

-- Table article (id ne s'incrémente pas automatiquement comme spécifié)
CREATE TABLE article (
    id INT PRIMARY KEY,
    categorie VARCHAR(20) NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    produit NUMERIC(10,2) NOT NULL DEFAULT 0,
    unite VARCHAR(20) CHECK (unite IN ('pièce','cl')) NOT NULL,
    prix NUMERIC(10,2),
    date DATE DEFAULT CURRENT_DATE
);

-- Création des rôles
CREATE ROLE admin_role;
CREATE ROLE client_role;

-- Droits sur la table article
GRANT SELECT, INSERT, UPDATE, DELETE ON article TO admin_role;
GRANT INSERT, SELECT ON article TO client_role;
GRANT UPDATE (produit) ON article TO client_role;

-- Insertion de données de test
INSERT INTO "user" (nom, prenoms, mail, password, categorie) VALUES
('Admin', 'Système', 'admin@gestion.com', '$2b$10$rOvHPxfzO2.KjB7YVz8zKOqP5vQw8zKOqP5vQw8zKOqP5vQw8zKOq', 'admin'),
('Resto', 'Manager', 'resto@gestion.com', '$2b$10$rOvHPxfzO2.KjB7YVz8zKOqP5vQw8zKOqP5vQw8zKOqP5vQw8zKOq', 'resto'),
('Snack', 'Manager', 'snack@gestion.com', '$2b$10$rOvHPxfzO2.KjB7YVz8zKOqP5vQw8zKOqP5vQw8zKOqP5vQw8zKOq', 'snack'),
('Detente', 'Manager', 'detente@gestion.com', '$2b$10$rOvHPxfzO2.KjB7YVz8zKOqP5vQw8zKOqP5vQw8zKOqP5vQw8zKOq', 'detente');

-- Données de test pour les articles
INSERT INTO article (id, categorie, libelle, produit, unite, prix, date) VALUES
(1, 'resto', 'Plat du jour', 0, 'pièce', 15.50, CURRENT_DATE),
(2, 'resto', 'Menu enfant', 0, 'pièce', 8.00, CURRENT_DATE),
(3, 'snack', 'Sandwich', 0, 'pièce', 5.50, CURRENT_DATE),
(4, 'snack', 'Boisson', 0, 'cl', 2.50, CURRENT_DATE),
(5, 'detente', 'Café', 0, 'cl', 1.50, CURRENT_DATE),
(6, 'detente', 'Thé', 0, 'cl', 1.20, CURRENT_DATE);
