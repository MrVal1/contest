# Guide de Déploiement VPS - CortiContest

Ce guide explique comment déployer l'application sur un VPS (Virtual Private Server) à partir de zéro, en utilisant Git pour récupérer le code.

## prérequis

- Un VPS (Debian/Ubuntu recommandé) avec accès SSH.
- [Git](https://git-scm.com/) installé sur le VPS.
- [Docker](https://docs.docker.com/engine/install/) et [Docker Compose](https://docs.docker.com/compose/install/) installés sur le VPS.
- Nginx installé (si vous souhaitez utiliser le reverse proxy).

## 1. Récupérer le code

Connectez-vous à votre VPS et clonez le dépôt (remplacez l'URL par la vôtre) :

```bash
cd /var/www
git clone https://github.com/votre-utilisateur/corti-contest.git
cd corti-contest
```

## 2. Configuration

L'application utilise des variables d'environnement pour définir les ports et la base de données.

1. Copiez le fichier d'exemple :
   ```bash
   cp .env.example .env
   ```

2. Modifiez le fichier `.env` pour adapter les ports à votre environnement (surtout si vous avez déjà des services sur les ports 3000 ou 5001) :
   ```bash
   nano .env
   ```

   **Exemple de configuration :**
   ```ini
   # Ports pour Docker
   FRONTEND_PORT=3015
   BACKEND_PORT=5015

   # Base de données (ne pas toucher)
   DB_PATH=/app/data/contest.db
   ```

## 3. Démarrage Rapide

Nous avons inclus un script pour simplifier le démarrage. Il va construire les conteneurs et lancer l'application.

```bash
chmod +x start.sh
./start.sh
```

Une fois terminé, vos conteneurs Docker tourneront sur les ports définis.

## 4. Configuration Nginx (Reverse Proxy)

Pour rendre l'application accessible via un nom de domaine ou un sous-dossier standard (port 80/443), configurez Nginx.

1. Un fichier d'exemple est fourni : `nginx-vps.conf.example`.
2. Adaptez-le à votre besoin (changez les ports `proxy_pass` pour qu'ils correspondent à votre `.env`).

**Exemple rapide :**

```bash
# Copier la config (adaptez le nom du fichier destination)
sudo cp nginx-vps.conf.example /etc/nginx/sites-available/contest

# Editer pour vérifier la config (déjà configuré pour 3015/5015 et /contest)
sudo nano /etc/nginx/sites-available/contest

# Activer le site
sudo ln -s /etc/nginx/sites-available/contest /etc/nginx/sites-enabled/

# Vérifier et redémarrer Nginx
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Mises à jour

Pour mettre à jour l'application plus tard :

```bash
# Récupérer les changements
git pull

# Redémarrer
./start.sh
```
