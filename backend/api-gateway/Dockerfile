# Multi-stage build for API Gateway
# Author: Yusuf Alperen Bozkurt

FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# first copy pom and download deps so docker can cache this layer
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw
RUN --mount=type=cache,target=/root/.m2/repository ./mvnw dependency:go-offline -B

# then copy source and build
COPY src src
RUN --mount=type=cache,target=/root/.m2/repository ./mvnw package -DskipTests -B

# runtime image - alpine to keep it small
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
