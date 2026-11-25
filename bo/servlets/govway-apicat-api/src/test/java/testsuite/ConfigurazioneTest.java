package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.ClasseUtenteAuthorization;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.controllers.ClassiUtenteController;
import org.govway.catalogo.controllers.ConfigurazioneController;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.services.ClasseUtenteService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.Adesione;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneNoteVetrina;
import org.govway.catalogo.servlets.model.ConfigurazioneRuolo;
import org.govway.catalogo.servlets.model.ConfigurazioneServizio;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.VisibilitaServizioEnum;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class ConfigurazioneTest {
	@Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private ClasseUtenteAuthorization authorization;

    @Mock
    private CoreAuthorization coreAuthorization;

    @Autowired
    UtenteService utenteService;

    @Autowired
    ClasseUtenteService classeUtenteService;
    
    @Autowired
    private ConfigurazioneController configurazioneController;
    
    //@Autowired
	//private Configurazione configurazione;
    
    private static final String UTENTE_GESTORE = "gestore";

    @BeforeEach
    private void setUp() {
        MockitoAnnotations.initMocks(this);
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);

        when(coreAuthorization.isAnounymous()).thenReturn(true);

        SecurityContextHolder.setContext(this.securityContext);
    }

    @AfterEach
    private void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetConfigurazioneSuccess() { 
    	
    	ResponseEntity<Configurazione> configurazione = configurazioneController.getConfigurazione();
    	
    	assertEquals(HttpStatus.OK, configurazione.getStatusCode());
        assertNotNull(configurazione.getBody());
    }

    @Test
    void testGetStatusSuccess() { 
    	
    	ResponseEntity<String> status = configurazioneController.getStatus();
    	
    	assertEquals(HttpStatus.OK, status.getStatusCode());
    }
    
    @Test
    void testGetVersionSuccess() { 
    	
    	ResponseEntity<String> status = configurazioneController.getVersion();
    	
    	assertEquals(HttpStatus.OK, status.getStatusCode());
        assertNotNull(status.getBody());
    }

    /** Lo stesso mapper con cui OpenAPI2SpringBoot legge il configurazione.json. */
    private static ObjectMapper configurazioneMapper() {
        ObjectMapper om = new ObjectMapper();
        om.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        om.registerModule(OpenAPI2SpringBoot.stepWizardStatiAliasModule());
        return om;
    }

    @Test
    void testGetConfigurazioneNoteVetrina() {
        ResponseEntity<Configurazione> configurazione = configurazioneController.getConfigurazione();

        ConfigurazioneNoteVetrina noteVetrina = configurazione.getBody().getServizio().getNoteVetrina();
        assertNotNull(noteVetrina, "servizio.note_vetrina del configurazione.json di test deve essere esposta dalla GET /configurazione");
        assertTrue(noteVetrina.isAbilitato());
        assertEquals(List.of(ConfigurazioneRuolo.REFERENTE_SUPERIORE, ConfigurazioneRuolo.REFERENTE), noteVetrina.getRuoliAbilitati());
    }

    @Test
    void testNoteVetrinaAssente() throws Exception {
        // retrocompatibilita': un configurazione.json senza la chiave deve continuare a essere letto
        ConfigurazioneServizio servizio = configurazioneMapper().readValue("{}", ConfigurazioneServizio.class);

        assertNull(servizio.getNoteVetrina());
    }

    @Test
    void testNoteVetrinaSoloAbilitato() throws Exception {
        ConfigurazioneServizio servizio = configurazioneMapper().readValue(
                "{\"note_vetrina\":{\"abilitato\":false}}", ConfigurazioneServizio.class);

        assertNotNull(servizio.getNoteVetrina());
        assertFalse(servizio.getNoteVetrina().isAbilitato());
    }

    @Test
    void testNoteVetrinaTuttiIRuoli() throws Exception {
        ConfigurazioneServizio servizio = configurazioneMapper().readValue(
                "{\"note_vetrina\":{\"abilitato\":true,\"ruoli_abilitati\":[\"richiedente\",\"referente\",\"referente_superiore\",\"gestore\"]}}",
                ConfigurazioneServizio.class);

        assertEquals(List.of(ConfigurazioneRuolo.RICHIEDENTE, ConfigurazioneRuolo.REFERENTE,
                ConfigurazioneRuolo.REFERENTE_SUPERIORE, ConfigurazioneRuolo.GESTORE),
                servizio.getNoteVetrina().getRuoliAbilitati());
    }

    @Test
    void testNoteVetrinaRuoloNonPrevisto() {
        // i ruoli tecnici non sono configurabili: valgono come i corrispondenti non tecnici
        ObjectMapper om = configurazioneMapper();
        assertThrows(JsonMappingException.class, () -> om.readValue(
                "{\"note_vetrina\":{\"abilitato\":true,\"ruoli_abilitati\":[\"referente_tecnico\"]}}",
                ConfigurazioneServizio.class));
    }
}
