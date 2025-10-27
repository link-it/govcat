/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
package testsuite.oidc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * Provider per ottenere token JWT da Keycloak per i test di integrazione.
 * Esegue l'autenticazione OAuth2 Resource Owner Password Credentials flow
 * per ottenere un access token valido da usare nei test.
 */
@Component
public class KeycloakTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(KeycloakTokenProvider.class);

    @Value("${keycloak.test.token-endpoint}")
    private String tokenEndpoint;

    @Value("${keycloak.test.client-id}")
    private String clientId;

    @Value("${keycloak.test.client-secret:}")
    private String clientSecret;

    @Value("${keycloak.test.username}")
    private String username;

    @Value("${keycloak.test.password}")
    private String password;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Ottiene un access token JWT da Keycloak per l'utente configurato.
     *
     * @return access token JWT
     * @throws RuntimeException se l'autenticazione fallisce
     */
    public String getAccessToken() {
        try {
            logger.info("Richiesta token a Keycloak per utente: {}", username);
            logger.debug("Token endpoint: {}", tokenEndpoint);

            // Prepara i parametri per la richiesta token
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "password");
            params.add("client_id", clientId);
            params.add("username", username);
            params.add("password", password);

            // Aggiungi client_secret solo se configurato
            if (clientSecret != null && !clientSecret.trim().isEmpty()) {
                params.add("client_secret", clientSecret);
            }

            // Prepara gli header
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            // Crea la richiesta
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            // Esegui la richiesta
            ResponseEntity<String> response = restTemplate.exchange(
                    tokenEndpoint,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                // Estrai l'access token dalla risposta JSON
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                String accessToken = jsonNode.get("access_token").asText();

                logger.info("Token JWT ottenuto con successo da Keycloak");
                logger.debug("Token (primi 50 caratteri): {}...", accessToken.substring(0, Math.min(50, accessToken.length())));

                return accessToken;
            } else {
                throw new RuntimeException("Risposta non valida da Keycloak: " + response.getStatusCode());
            }

        } catch (Exception e) {
            logger.error("Errore durante l'ottenimento del token da Keycloak", e);
            throw new RuntimeException("Impossibile ottenere token da Keycloak: " + e.getMessage(), e);
        }
    }

    /**
     * Ottiene un refresh token JWT da Keycloak per l'utente configurato.
     *
     * @return refresh token JWT
     * @throws RuntimeException se l'autenticazione fallisce
     */
    public String getRefreshToken() {
        try {
            logger.info("Richiesta refresh token a Keycloak per utente: {}", username);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "password");
            params.add("client_id", clientId);
            params.add("username", username);
            params.add("password", password);

            if (clientSecret != null && !clientSecret.trim().isEmpty()) {
                params.add("client_secret", clientSecret);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    tokenEndpoint,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                String refreshToken = jsonNode.get("refresh_token").asText();

                logger.info("Refresh token ottenuto con successo da Keycloak");
                return refreshToken;
            } else {
                throw new RuntimeException("Risposta non valida da Keycloak: " + response.getStatusCode());
            }

        } catch (Exception e) {
            logger.error("Errore durante l'ottenimento del refresh token da Keycloak", e);
            throw new RuntimeException("Impossibile ottenere refresh token da Keycloak: " + e.getMessage(), e);
        }
    }

    /**
     * Verifica se Keycloak è raggiungibile.
     *
     * @return true se Keycloak è raggiungibile, false altrimenti
     */
    public boolean isKeycloakAvailable() {
        try {
            // Estrai l'URL base dal token endpoint
            String baseUrl = tokenEndpoint.substring(0, tokenEndpoint.indexOf("/protocol"));

            logger.debug("Verifica disponibilità Keycloak su: {}", baseUrl);

            ResponseEntity<String> response = restTemplate.getForEntity(baseUrl, String.class);
            boolean available = response.getStatusCode().is2xxSuccessful();

            logger.info("Keycloak disponibilità: {}", available ? "OK" : "NON DISPONIBILE");
            return available;

        } catch (Exception e) {
            logger.warn("Keycloak non raggiungibile: {}", e.getMessage());
            return false;
        }
    }
}
