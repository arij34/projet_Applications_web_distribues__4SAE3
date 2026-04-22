# Google sign-in: choix du rôle + 2FA

## Objectif
- Afficher **le choix du rôle (Client / Freelancer) avant** l’authentification Google.
- Après login Google, si l’utilisateur n’a pas encore de rôle Keycloak, l’app assigne le rôle via le backend.
- Optionnel: activer une **2FA** (recommandée: TOTP).

## 1) Choix du rôle AVANT Google login

### Pourquoi ce n’était pas affiché ?
Si l’utilisateur clique sur **Sign In** puis choisit Google depuis la page Keycloak, l’app Angular ne peut pas afficher le modal.

### Fix appliqué
Le guard (`RoleGuard`) redirige d’abord vers `/signin` (au lieu de rediriger directement vers Keycloak). 
Ainsi, l’utilisateur arrive dans l’app et voit le modal de choix du rôle.

Fichier:
- `src/app/core/auth/role.guard.ts`

### Google IdP caché sur la page Keycloak
Pour éviter que l’utilisateur démarre Google login depuis Keycloak (sans choisir le rôle), le provisioning met:
`hideOnLoginPage = true` dans la config de l’IdP Google.

Fichier:
- `tools/keycloak/provision.ps1`

> L’IdP est toujours utilisable via `kc_idp_hint=google` (ce que l’app Angular fait).

## 2) Assignation du rôle après login Google

### Backend
Endpoint (auth requis):
- `POST /api/me/role`
- Body: `{ "role": "CLIENT" }` ou `{ "role": "FREELANCER" }`

Effet:
- assigne le realm role dans Keycloak (Admin API)
- met à jour le rôle dans la DB (best-effort)

### Front
- Le choix du rôle est mémorisé dans `localStorage.pendingGoogleRole` avant la redirection Google.
- Au retour sur `/signin`, l’app appelle `/api/me/role` puis force un refresh token.

## 3) 2FA (recommandation)

### Meilleure option
**TOTP** (Google Authenticator / Microsoft Authenticator) : simple, universel, support natif Keycloak.

### Provisioning automatique
Le script supporte un paramètre:

```powershell
./tools/keycloak/provision.ps1 -Enable2FA true
```

Cela:
- configure la policy OTP (TOTP)
- active le required action `CONFIGURE_TOTP` (l’utilisateur configure l’OTP à la première connexion)

### Remarque
Selon la version/config Keycloak, certains paramètres MFA peuvent nécessiter un réglage manuel:
- Admin Console → Realm → Authentication → Required actions → **Configure OTP** (Enabled + Default)
- Admin Console → Realm → Realm Settings → OTP Policy

## Test manuel rapide
1) Reprovision Keycloak:
   - `./tools/keycloak/provision.ps1`
2) Aller sur un lien protégé (ex: `/client`) → redirection `/signin?returnUrl=%2Fclient`.
3) Cliquer **Sign in with Google** → modal choix rôle → continuer.
4) Vérifier redirection vers la bonne route.
