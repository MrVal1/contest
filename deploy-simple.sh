#!/bin/bash

echo "🚀 Préparation du déploiement CortiContest"

# 1. Créer l'archive du projet
echo "📦 Création de l'archive..."
tar -czf corti-contest.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=client/node_modules \
    --exclude=server/node_modules \
    --exclude=data \
    --exclude=.env \
    .

echo "✅ Archive créée: corti-contest.tar.gz"
echo ""
echo "📋 Instructions manuelles pour le déploiement :"
echo ""
echo "1. Transférer l'archive sur le VPS :"
echo "   scp corti-contest.tar.gz user@51.178.38.40:/tmp/"
echo ""
echo "2. Se connecter au VPS :"
echo "   ssh user@51.178.38.40"
echo ""
echo "3. Sur le VPS, exécuter :"
echo "   cd /var/www/"
echo "   sudo mkdir -p contest"
echo "   cd contest"
echo "   sudo tar -xzf /tmp/corti-contest.tar.gz"
echo "   sudo docker-compose -f docker-compose.prod.yml build"
echo "   sudo docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "4. Configurer Nginx (si nécessaire) :"
echo "   sudo nano /etc/nginx/sites-available/default"
echo "   # Ajouter les lignes pour /contest et /contest/api"
echo "   sudo systemctl reload nginx"
