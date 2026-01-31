#!/bin/bash

echo "🚀 Déploiement CortiContest sur VPS (direct)"

# 1. Construire les conteneurs Docker
echo "🏗️ Construction des conteneurs..."
sudo docker-compose -f docker-compose.prod.yml build

# 2. Démarrer les services
echo "🚀 Démarrage des services..."
sudo docker-compose -f docker-compose.prod.yml up -d

# 3. Attendre le démarrage
sleep 10

# 4. Vérifier le statut
echo "📊 Vérification du statut..."
sudo docker-compose -f docker-compose.prod.yml ps

# 5. Configurer Nginx
echo "🌐 Configuration Nginx..."
sudo tee /etc/nginx/sites-available/contest << 'EOF'
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
EOF

# 6. Activer le site Nginx
sudo ln -sf /etc/nginx/sites-available/contest /etc/nginx/sites-enabled/

# 7. Tester et recharger Nginx
echo "🔄 Rechargement Nginx..."
sudo nginx -t && sudo systemctl reload nginx

# 8. Afficher les logs
echo "📋 Logs des services (Ctrl+C pour arrêter)..."
sudo docker-compose -f docker-compose.prod.yml logs -f

echo "✅ Déploiement terminé!"
echo "🌐 Application disponible sur: http://51.178.38.40/contest"
echo "🔧 Admin: http://51.178.38.40/contest/admin"
