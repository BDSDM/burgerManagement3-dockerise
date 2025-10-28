# Étape 1 : Build de l'application Java
FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Étape 2 : Image finale
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# Copier le JAR depuis l’étape de build
COPY --from=build /app/target/*.jar app.jar

# Charger les variables d'environnement depuis app.env (géré par docker-compose)
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]