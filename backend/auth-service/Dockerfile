# Multi-stage build for Auth Service

FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw
RUN --mount=type=cache,target=/root/.m2/repository ./mvnw dependency:go-offline -B

COPY src src
RUN --mount=type=cache,target=/root/.m2/repository ./mvnw package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
