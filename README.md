# Gestion de Salle

Application complète de gestion de salle avec React.js, Express.js et PostgreSQL.

## Architecture

- **Frontend**: React.js avec Bootstrap 5
- **Backend**: Express.js avec architecture MVC
- **Base de données**: PostgreSQL
- **Authentification**: JWT avec rôles utilisateur

## Fonctionnalités

### Authentification
- Connexion avec email, mot de passe et sélection de catégorie
- Icône "œil" pour afficher/masquer le mot de passe
- Rôles: admin, resto, snack, détente

### Interface Administrateur
- CRUD complet sur les articles (Ajout, Modification, Suppressio```md file="README.md"
# Gestion de Salle

Application complète de gestion de salle avec React.js, Express.js et PostgreSQL.

## Architecture

- **Frontend**: React.js avec Bootstrap 5
- **Backend**: Express.js avec architecture MVC
- **Base de données**: PostgreSQL
- **Authentification**: JWT avec rôles utilisateur

## Fonctionnalités

### Authentification
- Connexion avec email, mot de passe et sélection de catégorie
- Icône "œil" pour afficher/masquer le mot de passe
- Rôles: admin, resto, snack, détente

### Interface Administrateur
- CRUD complet sur les articles (Ajout, Modification, Suppression, Affichage)
- Export Excel des données
- Gestion complète des prix et informations
- Interface avec formulaire complet

### Interface Client
- Affichage des articles par catégorie
- Ajout de produits uniquement (quantités s'additionnent)
- Interface simplifiée sans prix
- Restriction par catégorie utilisateur

## Installation et Configuration

### Prérequis
- Node.js (v14 ou supérieur)
- PostgreSQL
- npm ou yarn

### Base de données
1. Créer une base de données PostgreSQL nommée "Production"
2. Exécuter le script SQL dans `scripts/01-create-database.sql`

### Backend
\`\`\`bash
cd backend
npm install
cp .env.example .env
# Configurer les variables d'environnement dans .env
npm run dev
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

## Variables d'environnement

### Backend (.env)
\`\`\`
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Production
DB_USER=postgres
DB_PASSWORD=123456789
JWT_SECRET=votre_secret_jwt_tres_securise_ici
PORT=5000
\`\`\`

## Comptes de test

- **Admin**: admin@gestion.com / 123456789
- **Resto**: resto@gestion.com / 123456789
- **Snack**: snack@gestion.com / 123456789
- **Détente**: detente@gestion.com / 123456789

## Structure du projet

\`\`\`
gestion-salle/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Article.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── articles.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── ClientDashboard.js
│   │   │   └── ProtectedRoute.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── scripts/
    └── 01-create-database.sql
\`\`\`

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription (admin seulement)

### Articles
- `GET /api/articles` - Liste des articles
- `GET /api/articles/categorie/:categorie` - Articles par catégorie
- `POST /api/articles` - Créer un article (admin)
- `PUT /api/articles/:id` - Modifier un article (admin)
- `PATCH /api/articles/:id/produit` - Ajouter un produit (clients)
- `DELETE /api/articles/:id` - Supprimer un article (admin)
- `GET /api/articles/export/excel` - Export Excel (admin)

## Sécurité

- Authentification JWT
- Middleware de vérification des rôles
- Validation des données côté serveur
- Protection CORS configurée
- Mots de passe hashés avec bcrypt

## Déploiement

1. Configurer la base de données PostgreSQL en production
2. Mettre à jour les variables d'environnement
3. Builder le frontend: `npm run build`
4. Déployer le backend et servir les fichiers statiques du frontend

## Support

Pour toute question ou problème, consultez la documentation ou contactez l'équipe de développement.

##env

APP_NAME=Laravel
APP_ENV=local
APP_KEY=base64:GENERATE_WITH_ARTISAN
APP_DEBUG=true
APP_URL=http://192.168.7.163:8000
#APP_URL=http://10.10.10.155:8000


DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=production
DB_USERNAME=root
DB_PASSWORD=

#config email

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
#MAIL_USERNAME=economat@zomatel.com
#MAIL_PASSWORD=ukdaexsbohdgofke
MAIL_USERNAME=johanesaalitera@gmail.com
MAIL_PASSWORD=mzntliuqbuoqxpbh
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=johanesaalitera@gmail.com
MAIL_FROM_NAME="Control +"
QUEUE_CONNECTION=sync


BROADCAST_CONNECTION=pusher

PUSHER_APP_ID=476966
PUSHER_APP_KEY=f4mxonz864balft6wegl
PUSHER_APP_SECRET=yi9fklczpx6rl7ucn9jw
PUSHER_HOST=127.0.0.1
PUSHER_PORT=8080
PUSHER_SCHEME=http
PUSHER_APP_CLUSTER=mt1



# Vite / React
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
