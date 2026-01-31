# CortiContest - Application de Gestion de Contest d'Escalade

Application web complète pour gérer des contests d'escalade en salle avec système de points, classement en temps réel et interface d'administration.

## 🚀 Fonctionnalités

### 👥 Gestion des Grimpeurs
- **Inscription en ligne** avec prénom, nom, catégorie et sexe
- **Catégories obligatoires** : U11, U13, U15, U19, Senior
- **Séparation par sexe** : fille/garçon
- Chaque grimpeur participe uniquement dans sa catégorie et son sexe

### 🧩 Gestion des Blocs et Zones
- **Création de blocs** avec description
- **Configuration des zones** intermédiaires pour chaque bloc
- **Ordre de validation** des zones
- **Top** à valider pour chaque bloc

### ✅ Système de Validation
- **Validation simple** depuis téléphone ou tablette
- **Validation des zones** dans l'ordre
- **Validation des tops** séparément
- **Interface intuitive** pour les grimpeurs

### 🧮 Calcul des Points
- **1000 points de base** pour chaque zone et top
- **Points divisés** par le nombre de grimpeurs ayant validé la même zone/top
- **Score total** = somme des points obtenus
- **Calcul automatique** en temps réel

### 🏆 Classement en Temps Réel
- **Classement instantané** après chaque validation
- **Filtrage par catégorie** et sexe
- **Affichage des zones validées**, tops et score total
- **Mise à jour automatique** via WebSocket

### 🛠 Interface Administration
- **Création des contests** avec heures de début/fin
- **Configuration des blocs** et zones
- **Activation/désactivation** des contests
- **Gestion complète** de l'événement

## 🛠️ Installation et Démarrage

### Prérequis
- Node.js (version 14 ou supérieure)
- npm

### Installation

1. **Cloner le projet** :
```bash
git clone <repository-url>
cd CortiContest
```

2. **Installer les dépendances** :
```bash
npm install
cd client && npm install && cd ..
```

3. **Démarrer l'application** :
```bash
npm run dev
```

Cette commande démarre simultanément :
- Le **serveur backend** sur `http://localhost:5001`
- Le **client React** sur `http://localhost:3000`

### Démarrage Séparé

Pour démarrer les serveurs séparément :

**Serveur backend** :
```bash
npm run server
```

**Client frontend** :
```bash
npm run client
```

## 📱 Utilisation

### 1. Configuration Initiale (Admin)

1. Accédez à `http://localhost:3000/admin`
2. **Créez un contest** :
   - Nom du contest
   - Date et heure de début
   - Date et heure de fin
3. **Activez le contest** avec le bouton "Activer"
4. **Créez des blocs** pour le contest
5. **Ajoutez des zones** à chaque bloc dans l'ordre de validation

### 2. Inscription des Grimpeurs

1. Allez dans la section **Inscription**
2. Remplissez le formulaire avec :
   - Prénom et Nom
   - Catégorie (U11, U13, U15, U19, Senior)
   - Sexe (Fille/Garçon)
3. Cliquez sur **"Inscrire le grimpeur"**

### 3. Validation des Blocs

1. Accédez à la section **Validation**
2. **Sélectionnez un grimpeur** dans la liste
3. **Validez les zones** une par une dans l'ordre
4. **Validez le top** une fois toutes les zones validées
5. Le score et le classement se mettent à jour automatiquement

### 4. Consultation du Classement

1. Allez dans la section **Classement**
2. **Filtrez par catégorie** et/ou sexe si nécessaire
3. Consultez :
   - Le rang de chaque grimpeur
   - Le nombre de zones et tops validés
   - Le score total calculé automatiquement

## 🏗️ Architecture Technique

### Backend (Node.js + Express)
- **Base de données** : SQLite
- **API REST** pour toutes les opérations CRUD
- **WebSocket (Socket.io)** pour le classement en temps réel
- **CORS** configuré pour le développement

### Frontend (React + TypeScript)
- **React Router** pour la navigation
- **Axios** pour les appels API
- **Socket.io Client** pour les mises à jour en temps réel
- **CSS Modules** pour le style
- **Interface responsive** pour mobile/desktop

### Base de Données

**Tables principales** :
- `grimpeurs` : informations des participants
- `contests` : événements
- `blocs` : parcours d'escalade
- `zones` : points de validation intermédiaires
- `validations` : validations effectuées par les grimpeurs

## 🚀 Déploiement Production (VPS)

### 📋 Prérequis

- Accès SSH à votre VPS
- Docker et Docker Compose installés sur le VPS
- Nginx installé sur le VPS
- Droits sudo sur le VPS

### 🔧 Configuration

1. **Modifiez le fichier `scripts/deploy-vps.sh`** avec vos informations :
   ```bash
   VPS_IP="votre_ip_vps"
   VPS_USER="votre_utilisateur_ssh"
   ```

2. **Choix des ports** :
   Le script de déploiement vous demandera quels ports utiliser sur le VPS.
   - Par défaut : 3011 (frontend) et 5011 (backend)
   - Vous pouvez les personnaliser pour éviter les conflits avec vos autres applications.

### 🚀 Lancement du déploiement

**Étape 1: Rendre les scripts exécutables**
```bash
chmod +x scripts/deploy-vps.sh
chmod +x scripts/test-deployment.sh
```

**Étape 2: Lancer le déploiement**
```bash
./scripts/deploy-vps.sh
```

Suivez les instructions à l'écran pour configurer les ports.

**Étape 3: Configurer Nginx (Reverse Proxy)**

Le script de déploiement copie un fichier `nginx-vps.conf.example` sur votre serveur.
1. Connectez-vous au VPS : `ssh user@ip`
2. Allez dans le dossier : `cd /var/www/contest`
3. Adaptez le fichier exemple à votre configuration Nginx existante.

### 🌐 Accès à l'application

Une fois Nginx configuré, l'application sera accessible via l'URL que vous avez définie (ex: `http://votre-domaine.com/contest`).

### 📊 Gestion des services

**Vérifier le statut**
```bash
ssh votre_user@votre_ip "cd /var/www/contest && sudo docker-compose ps"
```

**Voir les logs**
```bash
ssh votre_user@votre_ip "cd /var/www/contest && sudo docker-compose logs -f"
```

**Redémarrer les services**
```bash
ssh votre_user@votre_ip "cd /var/www/contest && sudo docker-compose restart"
```

**Arrêter les services**
```bash
ssh votre_user@votre_ip "cd /var/www/contest && sudo docker-compose down"
```

### 🗂️ Structure des fichiers

- `Dockerfile.backend` : Configuration Docker pour le backend Node.js
- `Dockerfile.frontend` : Configuration Docker pour le frontend React + Nginx
- `nginx.conf` : Configuration Nginx interne aux conteneurs
- `docker-compose.yml` : Configuration Docker Compose pour la production
- `scripts/deploy-vps.sh` : Script automatisé de déploiement
- `scripts/test-deployment.sh` : Script de test du déploiement

### 🔍 Dépannage

**Problèmes courants**

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

### 📝 Notes importantes

- La base de données SQLite est persistée dans le volume `./data` sur le VPS
- Les conteneurs redémarrent automatiquement en cas de crash
- Nginx sur le VPS route les requêtes vers les conteneurs Docker
- Les logs sont disponibles via Docker Compose

### 🔄 Mises à jour

Pour mettre à jour l'application :

1. Modifiez votre code localement
2. Relancez le script de déploiement :
   ```bash
   ./scripts/deploy-vps.sh
   ```

Le script arrêtera les anciens conteneurs, déploiera la nouvelle version et redémarrera les services.

## 📋 Déroulement d'un Contest

1. **Phase de préparation** (Admin) :
   - Création du contest
   - Configuration des blocs et zones
   - Activation du contest

2. **Phase d'inscription** :
   - Inscription des grimpeurs avec leur catégorie
   - Vérification des informations

3. **Phase de competition** :
   - Validation des blocs par les grimpeurs
   - Mise à jour en temps réel du classement
   - Suivi des scores

4. **Phase de résultats** :
   - Consultation du classement final
   - Analyse des performances

## 🔧 Personnalisation

### Ajouter de nouvelles catégories
Modifiez le fichier `server/index.js` dans la table `grimpeurs` :
```sql
categorie TEXT NOT NULL CHECK (categorie IN ('U11', 'U13', 'U15', 'U19', 'Senior', 'NOUVELLE_CATEGORIE'))
```

### Modifier le calcul des points
Adaptez la fonction de calcul dans l'API `/api/rankings` dans `server/index.js`.

### Personnaliser l'interface
Modifiez les fichiers CSS dans `client/src/components/` pour changer les couleurs et styles.

## 🐛 Dépannage

### Port déjà utilisé
Si le port 5001 est utilisé, modifiez la constante `PORT` dans `server/index.js`.

### Problème de proxy
Le fichier `client/src/setupProxy.js` configure le proxy entre le client et le serveur.

### Base de données
La base de données SQLite `contest.db` est créée automatiquement au premier démarrage.

## 📄 Licence

Ce projet est sous licence MIT.

---

**Développé avec ❤️ pour la communauté d'escalade**
