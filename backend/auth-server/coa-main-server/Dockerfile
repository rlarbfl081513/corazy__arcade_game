# Multi-stage build for Java 21 Spring Boot application

# Build stage
FROM gradle:8.5-jdk21 AS build

WORKDIR /app

# Copy gradle files for dependency caching
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY gradlew ./

# Grant execute permission to gradlew
RUN chmod +x gradlew

# Download dependencies (cached layer)
RUN ./gradlew dependencies --no-daemon || true

# Copy source code
COPY src ./src

# Build the application
RUN ./gradlew bootJar --no-daemon

# Runtime stage
FROM bellsoft/liberica-openjre-alpine:21

WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Copy .env file if it exists (optional, better to use environment variables)
COPY .env* ./

# Expose port (default Spring Boot port)
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
