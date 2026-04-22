# Save Sonar Points - Backend Guide

## API Contract

| Item | Value |
|------|-------|
| Method | PATCH |
| Path | `/participations/{participationId}/sonar-results/{sonarResultId}/points` |
| Content-Type | application/json |
| Body | `{ "pointsAwarded": 75 }` (earned points: 0 to challenge max points) |

## Implementation (Java/Spring Boot)

The endpoint is implemented in `ParticipationController` and `ParticipationServiceImpl`:

- **Controller:** `PATCH /participations/{participationId}/sonar-results/{sonarResultId}/points`
- **Service:** `saveSonarPoints(participationId, sonarResultId, pointsAwarded)`
- **Entity:** `SonarCloudResult` has `pointsAwarded` (Integer) column

## Entity/DB

The `SonarCloudResult` entity includes:

```java
private Integer pointsAwarded;
```

JPA maps this to `points_awarded` (snake_case) by default. With `spring.jpa.hibernate.ddl-auto=update`, the column is created automatically.

## SQL (if column is missing)

If you need to add the column manually:

```sql
-- Table name follows JPA default: sonar_cloud_result
ALTER TABLE sonar_cloud_result ADD COLUMN points_awarded INT NULL;
```

## Validation

- `pointsAwarded` must be **≥ 0**.
- `pointsAwarded` must not exceed the **challenge’s max points** for that participation (if the challenge has a `points` value).

## Points Formula (Frontend)

The frontend computes a health score and maps it to earned points (0 up to the challenge’s max points). The formula may use a 0–100 scale internally, then scale to challenge max:

- Start: 100
- minus bugs × 10
- minus vulnerabilities × 8
- minus security hotspots × 3
- minus code smells × 1
- minus (100 - coverage) × 0.2
- minus duplication × 2
- Clamp to [0, 100]

## Alternative: Backend-Based Calculation

Instead of the frontend sending points, the backend could compute them when saving SonarCloud results (scheduler/refresh) using the same formula. The current design lets the frontend compute and send them via this PATCH endpoint.
