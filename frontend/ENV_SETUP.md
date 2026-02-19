# Configuration des variables d'environnement - Frontend

## Variables d'environnement requises

Créez un fichier `.env` à la racine du dossier `frontend` avec les variables suivantes :

```env
# URL de l'API Laravel
REACT_APP_API_URL=http://127.0.0.1:8000

# Configuration Reverb (WebSocket)
REACT_APP_REVERB_APP_KEY=f4mxonz864balft6wegl
REACT_APP_REVERB_HOST=127.0.0.1
REACT_APP_REVERB_PORT=8080
REACT_APP_REVERB_SCHEME=http

# Cluster Pusher (requis par pusher-js, même si Reverb ne l'utilise pas)
REACT_APP_PUSHER_CLUSTER=mt1
```

## Explication des variables

- **REACT_APP_API_URL** : URL de base de votre API Laravel (sans `/api` à la fin)
- **REACT_APP_REVERB_APP_KEY** : Clé d'application Reverb (doit correspondre à `REVERB_APP_KEY` dans le `.env` du backend)
- **REACT_APP_REVERB_HOST** : Adresse du serveur Reverb (généralement `127.0.0.1` en local)
- **REACT_APP_REVERB_PORT** : Port du serveur Reverb (généralement `8080`)
- **REACT_APP_REVERB_SCHEME** : Schéma de connexion (`http` en local, `https` en production)
- **REACT_APP_PUSHER_CLUSTER** : Cluster Pusher (requis par pusher-js, valeur par défaut: `mt1`)

## Note importante

⚠️ **Important** : Les variables d'environnement dans React doivent commencer par `REACT_APP_` pour être accessibles dans le code.

## Démarrage du serveur Reverb

Avant de démarrer le frontend, assurez-vous que le serveur Reverb est en cours d'exécution :

```bash
cd backend
php artisan reverb:start
```

Ou en production :

```bash
php artisan reverb:start --host=0.0.0.0 --port=8080
```
