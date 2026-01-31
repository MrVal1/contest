#!/bin/bash

# Ensure we are in project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.." || exit

# Load deployment config if exists
if [ -f .env.deploy ]; then
    source .env.deploy
fi

# Configuration par défaut ou demande
VPS_IP="${VPS_IP:-51.178.38.40}"
VPS_USER="${VPS_USER:-debian}"
APP_NAME="corti-contest"

# Demander les ports si non définis
if [ -z "$VPS_FRONTEND_PORT" ]; then
    read -p "Port Frontend sur le VPS (défaut: 3015): " VPS_FRONTEND_PORT
    VPS_FRONTEND_PORT=${VPS_FRONTEND_PORT:-3015}
fi

if [ -z "$VPS_BACKEND_PORT" ]; then
    read -p "Port Backend sur le VPS (défaut: 5015): " VPS_BACKEND_PORT
    VPS_BACKEND_PORT=${VPS_BACKEND_PORT:-5015}
fi

echo "🚀 Déploiement sur VPS: $VPS_IP"
echo "🔌 Ports: Frontend=$VPS_FRONTEND_PORT, Backend=$VPS_BACKEND_PORT"

# 1. Créer l'archive du projet
echo "📦 Création de l'archive..."
rm -f $APP_NAME.tar.gz
tar -czf $APP_NAME.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=client/node_modules \
    --exclude=server/node_modules \
    --exclude=data \
    --exclude=.env \
    --exclude=*.tar.gz \
    .

# 2. Transférer sur le VPS
echo "📤 Transfert vers le VPS..."
scp $APP_NAME.tar.gz $VPS_USER@$VPS_IP:/tmp/

# 3. Déployer sur le VPS
echo "🔧 Configuration sur le VPS..."
ssh $VPS_USER@$VPS_IP "VPS_FRONTEND_PORT=$VPS_FRONTEND_PORT VPS_BACKEND_PORT=$VPS_BACKEND_PORT bash -s" << 'REMOTE_SCRIPT'
#!/bin/bash

# Variables
APP_DIR="/var/www/contest"
SERVICE_NAME="corti-contest"

# Arrêter les services existants
echo "⏹️ Arrêt des services existants..."
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
    sudo docker-compose down 2>/dev/null || true
fi

# Créer le répertoire
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
cd $APP_DIR

# Extraire l'archive
echo "📂 Extraction des fichiers..."
sudo tar -xzf /tmp/corti-contest.tar.gz -C $APP_DIR
sudo rm /tmp/corti-contest.tar.gz

# Créer le fichier .env
echo "📝 Configuration de l'environnement..."
cat > .env <<EOF
FRONTEND_PORT=$VPS_FRONTEND_PORT
BACKEND_PORT=$VPS_BACKEND_PORT
DB_PATH=/app/data/contest.db
EOF

# Construire et démarrer
echo "🏗️ Construction des conteneurs..."
sudo docker-compose build

echo "🚀 Démarrage des services..."
sudo docker-compose up -d

# Attendre le démarrage
sleep 10

# Vérifier le statut
echo "📊 Vérification du statut..."
sudo docker-compose ps

REMOTE_SCRIPT

# Nettoyer l'archive locale
rm $APP_NAME.tar.gz

echo ""
echo "✅ Déploiement terminé!"
echo "⚠️  NOTE IMPORTANTE POUR NGINX :"
echo "   Une configuration Nginx exemple a été copiée sur le serveur."
echo "   Pour l'activer, connectez-vous au VPS et configurez votre reverse proxy :"
echo ""
echo "   ssh $VPS_USER@$VPS_IP"
echo "   cd /var/www/contest"
echo "   cat nginx-vps.conf.example"
echo ""
echo "   Adaptez ce fichier et incluez-le dans votre configuration Nginx principale."
echo "   (Probablement dans /etc/nginx/sites-available/default ou un nouveau fichier)"
