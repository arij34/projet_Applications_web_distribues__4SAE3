package com.smartfreelance.subscription.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Extracts roles from Keycloak JWT and maps them to Spring Security authorities.
 *
 * Keycloak realm roles are in: realm_access.roles
 * Spring expects roles like: ROLE_ADMIN
 */
public class KeycloakJwtRolesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

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

        // Optional: client roles
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
