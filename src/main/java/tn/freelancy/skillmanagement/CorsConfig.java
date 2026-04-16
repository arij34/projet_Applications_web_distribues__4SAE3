package tn.freelancy.skillmanagement;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {

        CorsConfiguration config = new CorsConfiguration();

        // Autoriser Angular frontend
        config.setAllowedOriginPatterns(Arrays.asList("http://localhost:4200"));

        // Autoriser toutes les méthodes nécessaires
        config.setAllowedMethods(Arrays.asList(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS",
                "PATCH"
        ));

        // Autoriser tous les headers
        config.setAllowedHeaders(Arrays.asList("*"));

        // Exposer les headers si nécessaire
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));

        // Autoriser les credentials (important pour JWT / cookies)
        config.setAllowCredentials(true);

        // Appliquer à toutes les routes
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
