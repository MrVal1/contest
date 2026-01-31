#!/bin/bash

# start.sh - Script de démarrage simple pour CortiContest

echo "🚀 Démarrage de CortiContest..."

# 1. Vérification de la configuration
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env introuvable."
    if [ -f .env.example ]; then
        echo "📝 Création automatique à partir de .env.example..."
        cp .env.example .env
        echo "✅ Fichier .env créé. Veuillez le modifier si nécessaire pour changer les ports."
        echo "   Appuyez sur Entrée pour continuer avec les ports par défaut ou Ctrl+C pour modifier .env"
        read
    else
        echo "❌ Erreur: ni .env ni .env.example n'existent."
        exit 1
    fi
fi

# Charger les variables pour l'affichage
source .env

echo "🔌 Configuration :"
echo "   - Frontend : port ${FRONTEND_PORT:-3000}"
echo "   - Backend  : port ${BACKEND_PORT:-5001}"
echo ""

# 2. Construction et Démarrage
echo "🏗️  Construction et démarrage des conteneurs..."
docker-compose up -d --build --remove-orphans

# 3. Vérification
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Application démarrée avec succès !"
    echo "📊 État des services :"
    docker-compose ps
    echo ""
    echo "🌐 Accès local :"
    echo "   Frontend : http://localhost:${FRONTEND_PORT:-3000}"
    echo "   API      : http://localhost:${BACKEND_PORT:-5001}"
else
    echo ""
    echo "❌ Une erreur est survenue lors du démarrage."
fi
