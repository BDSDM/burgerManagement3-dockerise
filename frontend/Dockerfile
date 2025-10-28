# Étape 1 : Build Angular
FROM node:20 AS build
WORKDIR /usr/src/app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du projet
COPY . .

# Builder le projet Angular en production (nom du projet correct)
RUN npm run build -- --project burgerManagementFrontend3 --configuration production

# Étape 2 : Serveur NGINX
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Supprimer le contenu par défaut et copier la build Angular
RUN rm -rf ./*
COPY --from=build /usr/src/app/dist/burger-management-frontend3/ ./

# Copier la config nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]