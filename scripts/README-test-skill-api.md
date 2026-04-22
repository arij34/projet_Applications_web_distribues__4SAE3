# Test des API Skill Management

Ce script vérifie que les endpoints utilisés par le front (FreelancerSkill, Availability, Education, Experience, Notifications) répondent correctement.

## Prérequis

- **Backend** (API Gateway / skill-management) démarré sur le port **8091** (voir `proxy.conf.json`).
- Node.js (pour exécuter le script).

## Utilisation

```bash
# Tester sans token (routes publiques + skip des routes /user/me et /admin)
npm run test:skill-api

# Tester avec token Keycloak (pour vérifier les routes protégées)
node scripts/test-skill-management-api.js --token=VOTRE_BEARER_TOKEN

# Ou avec variable d'environnement
set BEARER_TOKEN=xxx
npm run test:skill-api

# Changer la base URL (si votre API est ailleurs ou avec préfixe)
set API_BASE=http://localhost:8091
npm run test:skill-api
```

## Interprétation des résultats

| Symbole | Signification |
|--------|----------------|
| ✓ | **200** – Requête OK, endpoint fonctionnel |
| ◐ | **401/403/400** – Endpoint trouvé mais auth requise ou requête invalide |
| ○ | **SKIP** – Route protégée, token non fourni |
| ✗ | **404** ou **ERR** – Route introuvable ou erreur réseau |

- Si **tous les appels sont en 404** : le service sur le port 8091 n’expose pas ces chemins (vérifier le backend / gateway).
- Si vous voyez **401** sur les routes `/user/me` ou `/admin` après avoir passé un token : vérifier que le token est valide et que le gateway transmet bien l’en-tête `Authorization`.

## Endpoints testés

- **FreelancerSkill** : `GET /freelancer-skill`, `/user/me`, `/level/3`, `POST /check-skills/me`, `/check-existing/me`
- **Availability** : `GET /availability`, `/user/me`, `POST /preview`
- **Education** : `GET /education`, `/user/me`, `/user/me/latest`
- **Experience** : `GET /experience`, `/user/me/total-years`
- **Notifications** : `GET /notifications/admin`, `/user/me`, unread-count, etc.
