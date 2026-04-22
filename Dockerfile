FROM eclipse-temurin:17
EXPOSE 8086
ADD target/skill-management-0.0.1-SNAPSHOT.jar skill-management.jar
ENTRYPOINT ["java", "-jar", "skill-management.jar"]