#!/bin/bash

# Script de déploiement sur VPS
VPS_IP="51.178.38.40"
VPS_USER="debian"
APP_NAME="corti-contest"

echo "🚀 Déploiement sur VPS: $VPS_IP"

# 1. Créer l'archive du projet
echo "📦 Création de l'archive..."
tar -czf $APP_NAME.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=client/node_modules \
    --exclude=server/node_modules \
    --exclude=data \
    --exclude=.env \
    .

# 2. Transférer sur le VPS
echo "📤 Transfert vers le VPS..."
scp $APP_NAME.tar.gz $VPS_USER@$VPS_IP:/tmp/

# 3. Déployer sur le VPS
echo "🔧 Configuration sur le VPS..."
ssh $VPS_USER@$VPS_IP << 'REMOTE_SCRIPT'
#!/bin/bash

# Variables
APP_DIR="/var/www/contest"
SERVICE_NAME="corti-contest"

# Arrêter les services existants
echo "⏹️ Arrêt des services existants..."
sudo docker-compose -f $APP_DIR/docker-compose.prod.yml down 2>/dev/null || true
sudo docker rm $SERVICE_NAME-backend 2>/dev/null || true
sudo docker rm $SERVICE_NAME-frontend 2>/dev/null || true

# Créer le répertoire
sudo mkdir -p $APP_DIR
cd $APP_DIR

# Extraire l'archive
echo "📂 Extraction des fichiers..."
sudo tar -xzf /tmp/$SERVICE_NAME.tar.gz -C $APP_DIR
sudo rm /tmp/$SERVICE_NAME.tar.gz

# Donner les permissions
sudo chown -R $USER:$USER $APP_DIR

# Construire et démarrer
echo "🏗️ Construction des conteneurs..."
sudo docker-compose -f docker-compose.prod.yml build

echo "🚀 Démarrage des services..."
sudo docker-compose -f docker-compose.prod.yml up -d

# Attendre le démarrage
sleep 10

# Vérifier le statut
echo "📊 Vérification du statut..."
sudo docker-compose -f docker-compose.prod.yml ps

REMOTE_SCRIPT

# 4. Configurer Nginx sur le VPS
echo "🌐 Configuration Nginx..."
ssh $VPS_USER@$VPS_IP << 'NGINX_SCRIPT'
#!/bin/bash

# Créer la configuration Nginx
sudo tee /etc/nginx/sites-available/contest << 'NGINX_CONF'
location /contest {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /contest/api {
    proxy_pass http://localhost:5001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
NGINX_CONF

# Activer le site
sudo ln -sf /etc/nginx/sites-available/contest /etc/nginx/sites-enabled/

# Tester et recharger Nginx
sudo nginx -t && sudo systemctl reload nginx

NGINX_SCRIPT

# Nettoyer l'archive locale
rm $APP_NAME.tar.gz

echo "✅ Déploiement terminé!"
echo "🌐 Application disponible sur: http://$VPS_IP/contest"
echo "🔧 Admin: http://$VPS_IP/contest/admin"
echo "📊 Logs: ssh $VPS_USER@$VPS_IP 'cd /var/www/contest && sudo docker-compose logs -f'"
