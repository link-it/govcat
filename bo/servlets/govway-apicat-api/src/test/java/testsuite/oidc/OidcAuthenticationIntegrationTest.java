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

import static org.junit.jupiter.api.Assertions.*;

import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.servlets.model.Profilo;
import org.govway.catalogo.servlets.model.StatoProfiloEnum;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.groovy.template.GroovyTemplateAutoConfiguration;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * Test di integrazione per l'autenticazione OIDC con Keycloak.
 *
 * <h2>Prerequisiti:</h2>
 * <ul>
 *   <li>Keycloak in esecuzione su http://localhost:9999</li>
 *   <li>Realm "PROVA" configurato</li>
 *   <li>Utente "bssgnn" con password "giovannibu"</li>
 *   <li>Client "govcat-api" configurato nel realm</li>
 * </ul>
 *
 * <h2>Per eseguire il test:</h2>
 * <pre>
 * mvn test -Dtest=OidcAuthenticationIntegrationTest -Doidc.test.enabled=true
 * </pre>
 *
 * <h2>Setup Keycloak via Docker:</h2>
 * <pre>
 * docker run -d \
 *   --name keycloak-test \
 *   -p 9999:8080 \
 *   -e KEYCLOAK_ADMIN=admin \
 *   -e KEYCLOAK_ADMIN_PASSWORD=admin \
 *   quay.io/keycloak/keycloak:latest \
 *   start-dev
 * </pre>
 *
 * Poi accedi a http://localhost:9999 e configura:
 * <ol>
 *   <li>Crea realm "PROVA"</li>
 *   <li>Crea client "govcat-api" (public client, Direct Access Grants abilitato)</li>
 *   <li>Crea utente "bssgnn" con password "giovannibu"</li>
 *   <li>Configura i mapper per i claims custom se necessario</li>
 * </ol>
 */
@SpringBootTest(
        classes = OpenAPI2SpringBoot.class,
        webEnvironment = WebEnvironment.RANDOM_PORT
)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("oidc-test")
@DirtiesContext(classMode = ClassMode.AFTER_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Transactional
@EnabledIfSystemProperty(named = "oidc.test.enabled", matches = "true")
public class OidcAuthenticationIntegrationTest {

    private static final Logger logger = LoggerFactory.getLogger(OidcAuthenticationIntegrationTest.class);

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private KeycloakTokenProvider tokenProvider;

    @Value("${keycloak.test.username}")
    private String expectedUsername;

    private String baseUrl;
    private String jwtToken;

    @BeforeAll
    public void setupClass() {
        logger.info("=============================================================");
        logger.info("SETUP TEST OIDC AUTHENTICATION");
        logger.info("=============================================================");

        // Verifica che Keycloak sia disponibile
        boolean keycloakAvailable = tokenProvider.isKeycloakAvailable();
        if (!keycloakAvailable) {
            fail("Keycloak non è disponibile. Assicurati che sia in esecuzione su http://localhost:9999");
        }
        logger.info("✓ Keycloak è disponibile");
    }

    @BeforeEach
    public void setup() {
        baseUrl = "http://localhost:" + port + "/api/v1";
        logger.info("Base URL per i test: {}", baseUrl);

        // Ottieni un token JWT valido da Keycloak
        try {
            jwtToken = tokenProvider.getAccessToken();
            assertNotNull(jwtToken, "Token JWT non può essere null");
            assertTrue(jwtToken.length() > 0, "Token JWT non può essere vuoto");
            logger.info("✓ Token JWT ottenuto con successo");
        } catch (Exception e) {
            fail("Impossibile ottenere token JWT da Keycloak: " + e.getMessage());
        }
    }

    /**
     * Test 1: GET /profilo senza token deve fallire con 403 Forbidden
     */
    @Test
    public void testGetProfiloSenzaToken_DeveRestituire403() {
        logger.info("=============================================================");
        logger.info("TEST 1: GET /profilo senza token");
        logger.info("=============================================================");

        // Crea la richiesta senza header Authorization
        HttpHeaders headers = new HttpHeaders();
        HttpEntity<String> entity = new HttpEntity<>(headers);

        // Esegui la richiesta
        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl + "/profilo",
                HttpMethod.GET,
                entity,
                String.class
        );

        logger.info("Status code ricevuto: {}", response.getStatusCode());

        // Verifica che la richiesta sia stata rifiutata
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode(),
                "Richiesta senza token deve restituire 403 Forbidden");

        logger.info("✓ Test completato con successo");
    }

    /**
     * Test 2: GET /profilo con token invalido deve fallire con 403 Forbidden
     */
    @Test
    public void testGetProfiloConTokenInvalido_DeveRestituire403() {
        logger.info("=============================================================");
        logger.info("TEST 2: GET /profilo con token invalido");
        logger.info("=============================================================");

        // Crea la richiesta con un token JWT non valido
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer invalid.jwt.token");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        // Esegui la richiesta
        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl + "/profilo",
                HttpMethod.GET,
                entity,
                String.class
        );

        logger.info("Status code ricevuto: {}", response.getStatusCode());

        // Verifica che la richiesta sia stata rifiutata
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode(),
                "Richiesta con token invalido deve restituire 403 Forbidden");

        logger.info("✓ Test completato con successo");
    }

    /**
     * Test 3: GET /profilo con token valido deve restituire 200 OK con dati profilo
     */
    @Test
    public void testGetProfiloConTokenValido_DeveRestituire200() {
        logger.info("=============================================================");
        logger.info("TEST 3: GET /profilo con token JWT valido");
        logger.info("=============================================================");

        // Crea la richiesta con il token JWT valido
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        logger.info("Invio richiesta GET /profilo con token JWT...");

        // Esegui la richiesta
        ResponseEntity<Profilo> response = restTemplate.exchange(
                baseUrl + "/profilo",
                HttpMethod.GET,
                entity,
                Profilo.class
        );

        logger.info("Status code ricevuto: {}", response.getStatusCode());

        // Verifica che la richiesta sia andata a buon fine
        assertEquals(HttpStatus.OK, response.getStatusCode(),
                "Richiesta con token valido deve restituire 200 OK");

        assertNotNull(response.getBody(), "Il corpo della risposta non può essere null");

        Profilo profilo = response.getBody();
        logger.info("Profilo ricevuto:");
        logger.info("  - Username: {}", profilo.getIdm() != null ? profilo.getIdm().getPrincipal() : "N/A");
        logger.info("  - Email: {}", profilo.getIdm() != null ? profilo.getIdm().getEmail() : "N/A");
        logger.info("  - Nome: {}", profilo.getIdm() != null ? profilo.getIdm().getNome() : "N/A");
        logger.info("  - Cognome: {}", profilo.getIdm() != null ? profilo.getIdm().getCognome() : "N/A");
        logger.info("  - Stato: {}", profilo.getStato());

        // Verifica che i dati del profilo siano stati estratti dal token JWT
        assertNotNull(profilo.getIdm(), "IDM non può essere null");
        assertEquals(expectedUsername, profilo.getIdm().getPrincipal(),
                "Username deve corrispondere a quello configurato");

        // Lo stato può essere SCONOSCIUTO se l'utente non è registrato nel DB,
        // o ABILITATO se esiste nel DB
        assertTrue(
                profilo.getStato() == StatoProfiloEnum.SCONOSCIUTO ||
                        profilo.getStato() == StatoProfiloEnum.ABILITATO,
                "Stato profilo deve essere SCONOSCIUTO o ABILITATO"
        );

        logger.info("✓ Test completato con successo");
    }

    /**
     * Test 4: Verifica che i claims JWT siano stati mappati correttamente
     */
    @Test
    public void testMappingClaimsJWT_VerificaDatiUtente() {
        logger.info("=============================================================");
        logger.info("TEST 4: Verifica mapping claims JWT");
        logger.info("=============================================================");

        // Crea la richiesta con il token JWT valido
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        // Esegui la richiesta
        ResponseEntity<Profilo> response = restTemplate.exchange(
                baseUrl + "/profilo",
                HttpMethod.GET,
                entity,
                Profilo.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());

        Profilo profilo = response.getBody();
        assertNotNull(profilo.getIdm(), "IDM non può essere null");

        // Verifica che i claims standard siano stati mappati
        logger.info("Verifica mapping claims standard:");

        String username = profilo.getIdm().getPrincipal();
        logger.info("  - preferred_username -> principal: {}", username);
        assertNotNull(username, "Username (claim preferred_username) non può essere null");
        assertEquals(expectedUsername, username, "Username deve corrispondere");

        // Email potrebbe non essere presente nel token
        String email = profilo.getIdm().getEmail();
        logger.info("  - email -> email: {}", email != null ? email : "(non presente)");

        // Nome e cognome potrebbero non essere presenti
        String nome = profilo.getIdm().getNome();
        String cognome = profilo.getIdm().getCognome();
        logger.info("  - given_name -> nome: {}", nome != null ? nome : "(non presente)");
        logger.info("  - family_name -> cognome: {}", cognome != null ? cognome : "(non presente)");

        // Ruoli potrebbero essere presenti
        if (profilo.getIdm().getRuoli() != null && !profilo.getIdm().getRuoli().isEmpty()) {
            logger.info("  - realm_access.roles -> ruoli: {}", profilo.getIdm().getRuoli());
        } else {
            logger.info("  - realm_access.roles -> ruoli: (non presenti)");
        }

        logger.info("✓ Test completato con successo");
    }

    /**
     * Test 5: Verifica autenticazione con token scaduto o refresh
     */
    @Test
    public void testTokenScaduto_DeveGestireCorrettamente() {
        logger.info("=============================================================");
        logger.info("TEST 5: Gestione token scaduto (test informativo)");
        logger.info("=============================================================");

        // Questo test è principalmente informativo
        // In un test reale dovresti aspettare che il token scada (tipicamente 5-10 minuti)
        // o usare un token già scaduto

        logger.info("NOTA: Per testare completamente la gestione dei token scaduti:");
        logger.info("  1. Configura un token con TTL molto breve in Keycloak");
        logger.info("  2. Attendi che il token scada");
        logger.info("  3. Verifica che venga restituito 403 Forbidden");
        logger.info("  4. Usa un refresh token per ottenerne uno nuovo");

        // Per ora verifichiamo solo che il token corrente sia valido
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<Profilo> response = restTemplate.exchange(
                baseUrl + "/profilo",
                HttpMethod.GET,
                entity,
                Profilo.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode(),
                "Token corrente dovrebbe essere ancora valido");

        logger.info("✓ Token corrente è valido");
    }

    /**
     * Test 6: Test completo del flusso di autenticazione
     */
    @Test
    public void testFlussoCompletoAutenticazione() {
        logger.info("=============================================================");
        logger.info("TEST 6: Flusso completo autenticazione OIDC");
        logger.info("=============================================================");

        // Step 1: Tentativo senza autenticazione -> 403
        logger.info("Step 1: Tentativo senza token...");
        HttpHeaders headersNoAuth = new HttpHeaders();
        HttpEntity<String> entityNoAuth = new HttpEntity<>(headersNoAuth);
        ResponseEntity<String> responseNoAuth = restTemplate.exchange(
                baseUrl + "/profilo",
                HttpMethod.GET,
                entityNoAuth,
                String.class
        );
        assertEquals(HttpStatus.FORBIDDEN, responseNoAuth.getStatusCode());
        logger.info("  ✓ Correttamente rifiutato (403)");

        // Step 2: Ottenimento token da Keycloak
        logger.info("Step 2: Ottenimento token da Keycloak...");
        String token = tokenProvider.getAccessToken();
        assertNotNull(token);
        logger.info("  ✓ Token ottenuto");

        // Step 3: Chiamata autenticata -> 200
        logger.info("Step 3: Chiamata autenticata con token...");
        HttpHeaders headersAuth = new HttpHeaders();
        headersAuth.set("Authorization", "Bearer " + token);
        HttpEntity<String> entityAuth = new HttpEntity<>(headersAuth);
        ResponseEntity<Profilo> responseAuth = restTemplate.exchange(
                baseUrl + "/profilo",
                HttpMethod.GET,
                entityAuth,
                Profilo.class
        );
        assertEquals(HttpStatus.OK, responseAuth.getStatusCode());
        assertNotNull(responseAuth.getBody());
        logger.info("  ✓ Autenticazione riuscita (200)");

        // Step 4: Verifica dati estratti dal token
        logger.info("Step 4: Verifica dati estratti dal token...");
        Profilo profilo = responseAuth.getBody();
        assertNotNull(profilo.getIdm());
        assertEquals(expectedUsername, profilo.getIdm().getPrincipal());
        logger.info("  ✓ Dati utente estratti correttamente");

        logger.info("✓ Flusso completo completato con successo!");
    }
}
