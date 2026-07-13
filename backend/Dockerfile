# Build stage using Maven and Eclipse Temurin JDK 17
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy the pom.xml to download dependencies and utilize Docker cache layer
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy the source code and package the application, skipping tests for rapid deployment
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage using lightweight Eclipse Temurin JRE 17
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build /app/target/geeknito-backend-0.0.1-SNAPSHOT.jar app.jar

# Expose port 8080 (the default server port, overridden dynamically by Render's PORT env var)
EXPOSE 8080

# Start the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
