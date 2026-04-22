FROM eclipse-temurin:17
EXPOSE 8095
ADD target/skill-validation-service-0.0.1-SNAPSHOT.jar skill-validation.jar
ENTRYPOINT ["java", "-jar", "skill-validation.jar"]