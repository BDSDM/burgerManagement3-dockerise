🍔 Burger Management 3 – Application de Gestion de Burgers

Burger Management 3 est une application fullstack (Angular + Spring Boot + MySQL) permettant aux utilisateurs de commander un burger, une boisson, un dessert ou un menu complet, et de recevoir automatiquement la facture par mail.
Elle propose également une interface administrateur pour gérer les utilisateurs, leurs rôles et leurs accès.

Cette nouvelle version introduit une amélioration majeure avec la gestion intelligente des cookies, permettant de mémoriser le thème choisi (clair/sombre) et de revenir automatiquement sur la dernière page consultée après reconnexion.

🚀 Fonctionnalités principales

🔐 Authentification sécurisée avec JWT

🍪 Gestion avancée des cookies :

Sauvegarde automatique du thème sélectionné (clair/sombre)

Restauration de la dernière page consultée à la reconnexion

👥 Gestion complète des utilisateurs avec rôles (ADMIN / USER)

📊 Tableau de bord administrateur (gestion des utilisateurs et commandes)

🛒 Commande de burgers, boissons, desserts et menus complets

🧾 Facture envoyée automatiquement par mail après validation du panier

🐳 Application fullstack conteneurisée avec Docker (MySQL + Spring Boot + Angular)

🌍 Compatible multi-plateforme : Windows, Linux et macOS

⚙️ Installation & Lancement
🪟 Sous Windows (CMD / PowerShell)

```cmd
(for %P in (3306 8080 4200) do @for /f "tokens=1" %I in ('docker ps --format "{{.ID}} {{.Ports}}" ^| findstr ":%P"') do docker rm -f %I) & git clone https://github.com/BDSDM/burgerManagement3-dockerise.git && cd burgerManagement3-dockerise && docker compose --env-file app.env up -d
```
🐧 Sous Linux / macOS (bash / zsh)

```cmd
for P in 3306 8080 4200; do
  docker ps -q --filter "publish=$P" | xargs -r docker rm -f
done && \
git clone https://github.com/BDSDM/burgerManagement3-dockerise.git && \
cd burgerManagement3-dockerise && \
docker compose up -d
