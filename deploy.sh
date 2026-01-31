#!/bin/bash

# Script de déploiement pour OVH
echo "🚀 Déploiement de CortiContest sur OVH"

# 1. Créer le répertoire de données
mkdir -p data

# 2. Construire et démarrer avec Docker
echo "📦 Construction de l'image Docker..."
docker-compose build

echo "🔄 Démarrage de l'application..."
docker-compose up -d

# 3. Vérifier le statut
echo "📊 Vérification du statut..."
sleep 10
docker-compose ps

# 4. Afficher les logs
echo "📋 Logs de l'application:"
docker-compose logs corti-contest

echo "✅ Déploiement terminé!"
echo "🌐 Application disponible sur: http://localhost:5001"
