# Subscription microservice

Microservice Spring Boot pour gérer **Subscription**, **SubscriptionStatus**, **SubscriptionType**.

## Démarrage

Pré-requis:
- Java 17+
- MySQL (ex: local)
- Eureka server (si tu veux l’enregistrement)
- Keycloak (si tu veux tester les endpoints sécurisés)

### Base de données

Créer la base:

```sql
CREATE DATABASE smart_freelance_subscription;
```

Configurer `Subscription/src/main/resources/application.properties` si besoin.

### Run

```bash
mvn -f Subscription/pom.xml spring-boot:run
```

Service: `http://localhost:8091`

## Endpoints

### Public (sans authentification)

- `GET /api/public/subscriptions/types`
- `GET /api/public/subscriptions/statuses`

### Admin (ROLE_ADMIN)

- `GET /api/admin/subscriptions`
- `GET /api/admin/subscriptions/{id}`
- `DELETE /api/admin/subscriptions/{id}`

### Client/Freelancer (ROLE_CLIENT ou ROLE_FREELANCER)

- `GET /api/client/subscriptions/user/{userId}`
- `GET /api/freelancer/subscriptions/user/{userId}`

- `POST /api/client/subscriptions`
- `POST /api/freelancer/subscriptions`

Body exemple:

```json
{
  "userId": 1,
  "type": "VIP",
  "startDate": "2026-03-18",
  "endDate": "2026-04-18",
  "status": "ACTIVE"
}
```

- `PUT /api/client/subscriptions/{id}/type`
- `PUT /api/client/subscriptions/{id}/status`

## Notes d’architecture

- Comme c’est un microservice séparé, on ne fait pas de relation JPA avec `User`.
- On stocke uniquement `userId` dans l’entité `Subscription`.
