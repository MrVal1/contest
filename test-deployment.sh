#!/bin/bash

VPS_IP="xx.xx.xx.xx"

echo "🧪 Test du déploiement..."

# Test de l'API
echo "📡 Test de l'API..."
curl -f http://$VPS_IP/contest/api/contests || echo "❌ API non accessible"

# Test du frontend
echo "🌐 Test du frontend..."
curl -f http://$VPS_IP/contest/ || echo "❌ Frontend non accessible"

echo "✅ Tests terminés"
