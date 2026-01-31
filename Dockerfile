FROM node:18-alpine

WORKDIR /app

# Installer les dépendances du serveur
COPY server/package*.json ./server/
RUN cd server && npm install

# Installer les dépendances du client
COPY client/package*.json ./client/
RUN cd client && npm install

# Copier tout le code
COPY . .

# Construire le client pour la production
RUN cd client && npm run build

# Exposer le port du serveur
EXPOSE 5001

# Démarrer le serveur
CMD ["node", "server/index.js"]
