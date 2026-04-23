# Multi-stage build for Spring Boot (Maven + Java 17)
FROM maven:3.9.8-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy pom first to cache dependency resolution between builds
COPY pom.xml .
RUN mvn -B -DskipTests dependency:go-offline

# Copy project files and build the executable JAR
COPY src ./src
RUN mvn -B clean package -DskipTests

# Runtime image
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy built jar from builder stage
COPY --from=builder /app/target/*.jar app.jar

# App runs on 8084
EXPOSE 8084

# Run Spring Boot application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
