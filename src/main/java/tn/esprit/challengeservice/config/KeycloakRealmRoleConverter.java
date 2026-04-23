package tn.esprit.challengeservice.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Extracts Keycloak realm roles (and client roles) from the JWT and maps them
 * to Spring Security authorities with the ROLE_ prefix.
 *
 * Keycloak realm roles are in: realm_access.roles
 * Keycloak client roles are in: resource_access.{client}.roles
 */
public class KeycloakRealmRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Set<String> roles = new HashSet<>();

        // Realm roles
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null) {
            Object realmRoles = realmAccess.get("roles");
            if (realmRoles instanceof Collection) {
                for (Object r : (Collection<?>) realmRoles) {
                    if (r != null) roles.add(String.valueOf(r));
                }
            }
        }

        // Client roles (resource_access.{client}.roles)
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            for (Object clientObj : resourceAccess.values()) {
                if (clientObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> clientMap = (Map<String, Object>) clientObj;
                    Object clientRoles = clientMap.get("roles");
                    if (clientRoles instanceof Collection) {
                        for (Object r : (Collection<?>) clientRoles) {
                            if (r != null) roles.add(String.valueOf(r));
                        }
                    }
                }
            }
        }

        return roles.stream()
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toUnmodifiableSet());
    }
}
