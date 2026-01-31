# 🚀 Déploiement de CortiContest sur VPS

## 📋 Prérequis

- Accès SSH à votre VPS
- Docker et Docker Compose installés sur le VPS
- Nginx installé sur le VPS
- Droits sudo sur le VPS

## 🔧 Configuration

1. **Modifiez le fichier `deploy-vps.sh`** avec vos informations :
   ```bash
   VPS_IP="votre_ip_vps"
   VPS_USER="votre_utilisateur_ssh"
   ```

2. **Assurez-vous que les ports sont disponibles** :
   - Port 3000 (frontend)
   - Port 5001 (backend)

## 🚀 Déploiement

### Étape 1: Rendre les scripts exécutables
```bash
chmod +x deploy-vps.sh
chmod +x test-deployment.sh
```

### Étape 2: Lancer le déploiement
```bash
./deploy-vps.sh
```

### Étape 3: Tester le déploiement
```bash
./test-deployment.sh
```

## 🌐 Accès à l'application

Une fois le déploiement terminé, l'application sera accessible via :

- **Application principale** : `http://xx.xx.xx.xx/contest`
- **Administration** : `http://xx.xx.xx.xx/contest/admin`
- **API** : `http://xx.xx.xx.xx/contest/api`

## 📊 Gestion des services

### Vérifier le statut
```bash
ssh votre_user@votre_ip "cd /var/www/contest && sudo docker-compose ps"
```

### Voir les logs
```bash
ssh votre_user@votre_ip "cd /var/www/contest && sudo docker-compose logs -f"
```

### Redémarrer les services
```bash
ssh votre_user@votre_ip "cd /var/www/contest && sudo docker-compose restart"
```

### Arrêter les services
```bash
ssh votre_user@votre_ip "cd /var/www/contest && sudo docker-compose down"
```

## 🗂️ Structure des fichiers

- `Dockerfile.backend` : Configuration Docker pour le backend Node.js
- `Dockerfile.frontend` : Configuration Docker pour le frontend React + Nginx
- `nginx.conf` : Configuration Nginx interne aux conteneurs
- `docker-compose.prod.yml` : Configuration Docker Compose pour la production
- `deploy-vps.sh` : Script automatisé de déploiement
- `test-deployment.sh` : Script de test du déploiement

## 🔍 Dépannage

### Problèmes courants

1. **Ports déjà utilisés**
   ```bash
   # Vérifier les ports sur le VPS
   ssh votre_user@votre_ip "sudo netstat -tlnp | grep -E ':(3000|5001)'"
   ```

2. **Permissions Docker**
   ```bash
   # Ajouter l'utilisateur au groupe docker
   ssh votre_user@votre_ip "sudo usermod -aG docker votre_user"
   ```

3. **Configuration Nginx**
   ```bash
   # Tester la configuration Nginx
   ssh votre_user@votre_ip "sudo nginx -t"
   
   # Recharger Nginx
   ssh votre_user@votre_ip "sudo systemctl reload nginx"
   ```

## 📝 Notes importantes

- La base de données SQLite est persistée dans le volume `./data` sur le VPS
- Les conteneurs redémarrent automatiquement en cas de crash
- Nginx sur le VPS route les requêtes vers les conteneurs Docker
- Les logs sont disponibles via Docker Compose

## 🔄 Mises à jour

Pour mettre à jour l'application :

1. Modifiez votre code localement
2. Relancez le script de déploiement :
   ```bash
   ./deploy-vps.sh
   ```

Le script arrêtera les anciens conteneurs, déploiera la nouvelle version et redémarrera les services.
