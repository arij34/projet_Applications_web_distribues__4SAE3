package tn.esprit.projet_module.messaging;

import java.time.Instant;

public record ProjectCreatedEvent(
        Long projectId,
        String title,
        Long clientId,
        String clientKeycloakId,
        Instant createdAt
) {
}
