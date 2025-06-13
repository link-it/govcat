package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.UtenteAuthorization;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.ConfigurazioneNotifiche;
import org.govway.catalogo.servlets.model.ItemUtente;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.PagedModelItemUtente;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.StatoUtenteEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteUpdate;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.groovy.template.GroovyTemplateAutoConfiguration;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
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

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
public class UtentiTest {

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private UtenteAuthorization authorization;

    @Mock
    private CoreAuthorization coreAuthorization;

    @Autowired
    private OrganizzazioniController organizzazioniController;

    @Autowired
    private UtentiController controller;

    @Autowired
    private SoggettiController soggettiController;

    @Autowired
    private UtenteService utenteService;

    @Autowired
    private OrganizzazioneService organizzazioneService;

    private static final String UTENTE_GESTORE = "gestore";

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

        InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.findByPrincipal(UTENTE_GESTORE).get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);

        SecurityContextHolder.setContext(this.securityContext);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void testCreateUtenteSuccess() throws Exception {
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());

        ResponseEntity<Utente> responseUtente = controller.createUtente(utente);
        assertNotNull(responseUtente.getBody());

        assertEquals(HttpStatus.OK, responseUtente.getStatusCode());
        assertEquals(CommonUtils.NOME_UTENTE, responseUtente.getBody().getNome());
    }

    @Test
    public void testCreateUtenteConflict() {
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());

        controller.createUtente(utente);

        ConflictException exception = assertThrows(ConflictException.class, () -> {
            controller.createUtente(utente);
        });

        assertEquals("Utente [" + CommonUtils.USERNAME + "] esiste gia", exception.getMessage());
    }

    @Test
    public void testCreateUtenteUnauthorized() {
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createUtente(utente);
        });

        assertEquals("Utente non abilitato", exception.getMessage());
    }
    
    @Test
    public void testCreateUtenteUtenteAnonimo() {
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());

        this.tearDown();

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createUtente(utente);
        });

        assertEquals("Utente non specificato", exception.getMessage());
    }

    @Test
    public void testDeleteUtenteSuccess() {
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        ResponseEntity<Void> responseDelete = controller.deleteUtente(responseUtente.getBody().getIdUtente());
        assertEquals(HttpStatus.OK, responseDelete.getStatusCode());
    }

    @Test
    public void testDeleteUtenteNotFound() {
        UUID idUtenteNonEsistente = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.deleteUtente(idUtenteNonEsistente);
        });

        assertEquals("Utente [" + idUtenteNonEsistente + "] non trovato", exception.getMessage());
    }

    @Test
    public void testUpdateUtenteSuccess() {
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        UtenteUpdate utenteUpdate = new UtenteUpdate();
        utenteUpdate.setNome("NuovoNome");
        utenteUpdate.setStato(CommonUtils.STATO_UTENTE);
        utenteUpdate.setCognome(CommonUtils.COGNOME_UTENTE);
        utenteUpdate.setEmail(CommonUtils.EMAIL_UTENTE);
        utenteUpdate.setEmailAziendale(CommonUtils.EMAIL_AZIENDALE);
        utenteUpdate.setTelefonoAziendale(CommonUtils.TELEFONO_AZIENDALE);
        utenteUpdate.setPrincipal(CommonUtils.USERNAME);

        ResponseEntity<Utente> responseUpdate = controller.updateUtente(responseUtente.getBody().getIdUtente(), utenteUpdate);
        assertNotNull(responseUpdate.getBody());
        assertEquals("NuovoNome", responseUpdate.getBody().getNome());
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());
    }

    @Test
    public void testUpdateUtenteNotFound() {
        UUID idUtenteNonEsistente = UUID.randomUUID();

        UtenteUpdate utenteUpdate = new UtenteUpdate();
        utenteUpdate.setNome("NuovoNome");
        utenteUpdate.setStato(CommonUtils.STATO_UTENTE);
        utenteUpdate.setCognome(CommonUtils.COGNOME_UTENTE);
        utenteUpdate.setEmail(CommonUtils.EMAIL_UTENTE);
        utenteUpdate.setEmailAziendale(CommonUtils.EMAIL_AZIENDALE);
        utenteUpdate.setTelefonoAziendale(CommonUtils.TELEFONO_AZIENDALE);
        utenteUpdate.setPrincipal(CommonUtils.USERNAME);

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.updateUtente(idUtenteNonEsistente, utenteUpdate);
        });

        assertEquals("Utente [" + idUtenteNonEsistente + "] non trovato", exception.getMessage());
    }

    @Test
    public void testListUtentiSuccessNoFilters() {
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        UtenteCreate utenteCreate1 = CommonUtils.getUtenteCreate();
        utenteCreate1.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        controller.createUtente(utenteCreate1);

        UtenteCreate utenteCreate2 = CommonUtils.getUtenteCreate();
        utenteCreate2.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate2.setPrincipal("second.user");
        controller.createUtente(utenteCreate2);

        ResponseEntity<?> responseList = controller.listUtenti(null, responseOrganizzazione.getBody().getIdOrganizzazione(), null, null, null, null, null, null, null, 0, 10, null);

        assertNotNull(responseList.getBody());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
    }
    
    @Test
    void testListUtentiWithFilters() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione di alcuni utenti
        UtenteCreate utenteCreate1 = CommonUtils.getUtenteCreate();
        utenteCreate1.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate1.setStato(StatoUtenteEnum.ABILITATO);
        controller.createUtente(utenteCreate1);

        UtenteCreate utenteCreate2 = CommonUtils.getUtenteCreate();
        utenteCreate2.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate2.setPrincipal("second.user");
        utenteCreate2.setStato(StatoUtenteEnum.DISABILITATO);
        controller.createUtente(utenteCreate2);

        // Recupero della lista di utenti con filtri applicati (solo utenti ATTIVI)
        ResponseEntity<PagedModelItemUtente> responseList = controller.listUtenti(StatoUtenteEnum.ABILITATO, responseOrganizzazione.getBody().getIdOrganizzazione(), null, null, null, null, null, null, null, 0, 10, null);

        // Asserzioni
        assertNotNull(responseList.getBody());
        assertEquals(1, responseList.getBody().getContent().size());
        assertEquals(StatoUtenteEnum.ABILITATO, responseList.getBody().getContent().get(0).getStato());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
    }

    @Test
    void testListUtentiSortedUsernameDesc() {
    	// Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

    	for(int n = 0; n < 3; n++) {
    		// Creazione di alcuni utenti
            UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
            utenteCreate.setPrincipal("username"+n);
            utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
            utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
            controller.createUtente(utenteCreate);
    	}

        List<String> sort = new ArrayList<>();
        sort.add("principal,desc");
        
        ResponseEntity<PagedModelItemUtente> responseList = controller.listUtenti(null, responseOrganizzazione.getBody().getIdOrganizzazione(), null, null, null, null, null, null, null, 0, 10, sort);
        
        // Verifica del successo
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertFalse(responseList.getBody().getContent().isEmpty());

        // Verifica che il gruppo filtrato sia presente nell'elenco
        List<ItemUtente> listUtenti = responseList.getBody().getContent();
        //listSoggetti.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(listUtenti.stream().anyMatch(s -> s.getPrincipal().equals("username"+0)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals("username"+2, listUtenti.get(0).getPrincipal());
    }
	
    @Test
    void testListUtentiSortedUsernameAsc() {
    	// Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

    	for(int n = 0; n < 3; n++) {
    		// Creazione di alcuni utenti
            UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
            utenteCreate.setPrincipal("username"+n);
            utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
            utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
            controller.createUtente(utenteCreate);
    	}

        List<String> sort = new ArrayList<>();
        sort.add("principal,asc");
        
        ResponseEntity<PagedModelItemUtente> responseList = controller.listUtenti(null, responseOrganizzazione.getBody().getIdOrganizzazione(), null, null, null, null, null, null, null, 0, 10, sort);
        
        // Verifica del successo
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertFalse(responseList.getBody().getContent().isEmpty());

        // Verifica che il gruppo filtrato sia presente nell'elenco
        List<ItemUtente> listUtenti = responseList.getBody().getContent();
        //listSoggetti.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(listUtenti.stream().anyMatch(s -> s.getPrincipal().equals("username"+2)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals("username"+0, listUtenti.get(0).getPrincipal());
    }
    
    @Test
    void testListUtentiMultiPage() {
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 50;
    	// Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

    	for(int n = 0; n < numeroTotaleDiElementi; n++) {
    		// Creazione di utenti
            UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
            utenteCreate.setPrincipal("username"+n);
            utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
            utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
            controller.createUtente(utenteCreate);
    	}
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
        	ResponseEntity<PagedModelItemUtente> responseList = controller.listUtenti(null, responseOrganizzazione.getBody().getIdOrganizzazione(), null, null, null, null, null, null, null, n, numeroElementiPerPagina, null);

            // Verifica del successo
            assertEquals(HttpStatus.OK, responseList.getStatusCode());
            assertNotNull(responseList.getBody());
            assertFalse(responseList.getBody().getContent().isEmpty());
        }
    }

    @Test
    void testListUtentiUnauthorized() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione di alcuni utenti
        UtenteCreate utenteCreate1 = CommonUtils.getUtenteCreate();
        utenteCreate1.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate1.setStato(StatoUtenteEnum.ABILITATO);
        controller.createUtente(utenteCreate1);

        this.tearDown();

        // Verifica che venga lanciata l'eccezione NullPointerException qualora l'utente non fosse loggato
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.listUtenti(null, responseOrganizzazione.getBody().getIdOrganizzazione(), null, null, null, null, null, null, null, 0, 10, null);
        });

    }

    @Test
    void testListUtentiNotFoundClasseUtente() {
        UUID idClasseUtenteNonEsistente = UUID.randomUUID();

        // Tentativo di recuperare la lista di utenti filtrata per una classe utente non esistente
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.listUtenti(null, null, null, null, List.of(idClasseUtenteNonEsistente), null, null, null, null, 0, 10, null);
        });

        // Asserzioni
        assertEquals("Classe Utente [" + idClasseUtenteNonEsistente + "] non trovata", exception.getMessage());
    }

    @Test
    void testUpdateUtenteUnauthorized() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Preparazione dell'update
        UtenteUpdate utenteUpdate = new UtenteUpdate();
        utenteUpdate.setNome("NuovoNome");
        utenteUpdate.setStato(CommonUtils.STATO_UTENTE);
        utenteUpdate.setCognome(CommonUtils.COGNOME_UTENTE);
        utenteUpdate.setEmail(CommonUtils.EMAIL_UTENTE);
        utenteUpdate.setEmailAziendale(CommonUtils.EMAIL_AZIENDALE);
        utenteUpdate.setTelefonoAziendale(CommonUtils.TELEFONO_AZIENDALE);
        utenteUpdate.setPrincipal(CommonUtils.USERNAME);

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Tentativo di aggiornare l'utente senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.updateUtente(responseUtente.getBody().getIdUtente(), utenteUpdate);
        });

        // Asserzioni
        assertEquals("Utente non abilitato", exception.getMessage());
    }
    
    @Test
    void testUpdateUtenteUtenteAnonimo() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Preparazione dell'update
        UtenteUpdate utenteUpdate = new UtenteUpdate();
        utenteUpdate.setNome("NuovoNome");
        utenteUpdate.setStato(CommonUtils.STATO_UTENTE);
        utenteUpdate.setCognome(CommonUtils.COGNOME_UTENTE);
        utenteUpdate.setEmail(CommonUtils.EMAIL_UTENTE);
        utenteUpdate.setEmailAziendale(CommonUtils.EMAIL_AZIENDALE);
        utenteUpdate.setTelefonoAziendale(CommonUtils.TELEFONO_AZIENDALE);
        utenteUpdate.setPrincipal(CommonUtils.USERNAME);

        this.tearDown();

        // Tentativo di aggiornare l'utente senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.updateUtente(responseUtente.getBody().getIdUtente(), utenteUpdate);
        });

        // Asserzioni
        assertEquals("Utente non specificato", exception.getMessage());
    }

    @Test
    void testGetProfiloSuccessAbilitato() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());
        
        // Creazione del SoggettoCreate e associazione all'organizzazione
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("xxxx");
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());

        // Creazione del soggetto tramite il controller
        ResponseEntity<Soggetto> soggettoResponse = soggettiController.createSoggetto(soggettoCreate);
        
        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
        
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody().getIdUtente());

        // Esecuzione del metodo
        ResponseEntity<Utente> responseProfilo = controller.getUtente(responseUtente.getBody().getIdUtente());

        // Asserzioni
        assertNotNull(responseProfilo.getBody());
        assertEquals(StatoUtenteEnum.ABILITATO, responseProfilo.getBody().getStato());
        assertEquals(HttpStatus.OK, responseProfilo.getStatusCode());
    }

    @Test
    void testGetProfiloSuccessNonConfigurato() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate.setStato(StatoUtenteEnum.NON_CONFIGURATO);
        
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Esecuzione del metodo
        ResponseEntity<Utente> responseProfilo = controller.getUtente(responseUtente.getBody().getIdUtente());

        // Asserzioni
        assertNotNull(responseProfilo.getBody());
        assertEquals(StatoUtenteEnum.NON_CONFIGURATO, responseProfilo.getBody().getStato());
        assertEquals(HttpStatus.OK, responseProfilo.getStatusCode());
    }

    @Test
    void testGetProfiloSconosciuto() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate.setStato(StatoUtenteEnum.NON_CONFIGURATO);
        
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Esecuzione del metodo
        ResponseEntity<Utente> responseProfilo = controller.getUtente(responseUtente.getBody().getIdUtente());

        // Asserzioni
        assertNotNull(responseProfilo.getBody());
        assertEquals(StatoUtenteEnum.NON_CONFIGURATO, responseProfilo.getBody().getStato());
        assertEquals(HttpStatus.OK, responseProfilo.getStatusCode());
    }

    @Test
    void testGetUtenteSettingsSuccess() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate.setRuolo(RuoloUtenteEnum.GESTORE);
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Configurazione del profilo utente per il test
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);
        // Esecuzione del metodo
        ResponseEntity<Object> responseSettings = controller.getUtenteSettings(responseUtente.getBody().getIdUtente());

        // Asserzioni
        assertNotNull(responseSettings.getBody());
        assertEquals(HttpStatus.OK, responseSettings.getStatusCode());
    }

    @Test
    void testGetUtenteSettingsNotFound() {
        UUID idUtenteNonEsistente = UUID.randomUUID();

        // Tentativo di recuperare le impostazioni di un utente inesistente
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.getUtenteSettings(idUtenteNonEsistente);
        });

        // Asserzioni
        assertEquals("Utente [" + idUtenteNonEsistente + "] non trovata", exception.getMessage());
    }
    /*
    @Test
    void testGetUtenteSettingsUnauthorized() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Configura un InfoProfilo senza il ruolo richiesto
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Tentativo di recuperare le impostazioni dell'utente senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.getUtenteSettings(responseUtente.getBody().getIdUtente());
        });

        // Asserzioni
        assertEquals("Utente non abilitato", exception.getMessage());
    }
    */
    @Test
    void testGetUtenteSettingsUtenteAnonimo() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        this.tearDown();
        
        // Tentativo di recuperare le impostazioni dell'utente senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.getUtenteSettings(responseUtente.getBody().getIdUtente());
        });

        // Asserzioni
        assertEquals("Required: Utente autenticato", exception.getMessage());
    }

    @Test
    void testUpdateUtenteSettingsSuccess() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Creazione del body per l'aggiornamento delle impostazioni
        Map<String, Object> body = new HashMap<>();
        body.put("preference", "dark_mode");
        body.put("notifications", true);
        body.put("language", "it");

        // Esecuzione del metodo di aggiornamento
        ResponseEntity<Object> responseUpdate = controller.updateUtenteSettings(responseUtente.getBody().getIdUtente(), body);

        // Asserzioni
        assertNotNull(responseUpdate.getBody());
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());
    }

    @Test
    void testUpdateUtenteSettingsNotFound() {
        UUID idUtenteNonEsistente = UUID.randomUUID();
        Map<String, Object> body = new HashMap<>();
        body.put("preference", "dark_mode");
        body.put("notifications", true);
        body.put("language", "it");

        // Tentativo di aggiornare le impostazioni di un utente inesistente
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.updateUtenteSettings(idUtenteNonEsistente, body);
        });

        // Asserzioni
        assertEquals("Utente [" + idUtenteNonEsistente + "] non trovato", exception.getMessage());
    }

    @Test
    void testUpdateUtenteSettingsUnauthorized() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Creazione del body per l'aggiornamento delle impostazioni
        Map<String, Object> body = new HashMap<>();
        body.put("preference", "dark_mode");
        body.put("notifications", true);
        body.put("language", "it");

        // Configura un InfoProfilo senza il ruolo richiesto
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Tentativo di aggiornare le impostazioni senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.updateUtenteSettings(responseUtente.getBody().getIdUtente(), body);
        });

        // Asserzioni
        assertEquals("Utente non abilitato", exception.getMessage());
    }
    
    @Test
    void testUpdateUtenteSettingsUtenteAnonimo() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Creazione del body per l'aggiornamento delle impostazioni
        Map<String, Object> body = new HashMap<>();
        body.put("preference", "dark_mode");
        body.put("notifications", true);
        body.put("language", "it");

        this.tearDown();
        
        // Tentativo di aggiornare le impostazioni senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.updateUtenteSettings(responseUtente.getBody().getIdUtente(), body);
        });

        // Asserzioni
        assertEquals("Utente non specificato", exception.getMessage());
    }

    @Test
    void testGetUtenteSettingsNotificheSuccess() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Configurazione del profilo utente per il test
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);

        // Esecuzione del metodo
        ResponseEntity<ConfigurazioneNotifiche> responseNotifiche = controller.getUtenteSettingsNotifiche(responseUtente.getBody().getIdUtente());

        // Asserzioni
        assertNotNull(responseNotifiche.getBody());
        assertEquals(HttpStatus.OK, responseNotifiche.getStatusCode());
        // Puoi aggiungere ulteriori verifiche sul contenuto delle notifiche, se necessario
    }

    @Test
    void testGetUtenteSettingsNotificheNotFound() {
        UUID idUtenteNonEsistente = UUID.randomUUID();

        // Tentativo di recuperare le notifiche di un utente inesistente
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.getUtenteSettingsNotifiche(idUtenteNonEsistente);
        });

        // Asserzioni
        assertEquals("Utente [" + idUtenteNonEsistente + "] non trovata", exception.getMessage());
    }

    @Test
    void testGetUtenteSettingsNotificheUnauthorized() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Configura un InfoProfilo senza il ruolo richiesto
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Tentativo di recuperare le notifiche senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.getUtenteSettingsNotifiche(responseUtente.getBody().getIdUtente());
        });

        // Asserzioni
        assertEquals("Utente non abilitato", exception.getMessage());
    }
    
    @Test
    void testGetUtenteSettingsNotificheUtenteAnonimo() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        this.tearDown();
        
        // Tentativo di recuperare le notifiche senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.getUtenteSettingsNotifiche(responseUtente.getBody().getIdUtente());
        });

        // Asserzioni
        assertEquals("Utente non specificato", exception.getMessage());
    }

    @Test
    void testUpdateUtenteSettingsNotificheSuccess() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Creazione della configurazione notifiche
        ConfigurazioneNotifiche configurazioneNotifiche = new ConfigurazioneNotifiche();

        // Esecuzione del metodo di aggiornamento
        ResponseEntity<ConfigurazioneNotifiche> responseUpdate = controller.updateUtenteSettingsNotifiche(responseUtente.getBody().getIdUtente(), configurazioneNotifiche);

        // Asserzioni
        assertNotNull(responseUpdate.getBody());
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());
    }

    @Test
    void testUpdateUtenteSettingsNotificheNotFound() {
        UUID idUtenteNonEsistente = UUID.randomUUID();
        ConfigurazioneNotifiche configurazioneNotifiche = new ConfigurazioneNotifiche();

        // Tentativo di aggiornare le notifiche di un utente inesistente
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.updateUtenteSettingsNotifiche(idUtenteNonEsistente, configurazioneNotifiche);
        });

        // Asserzioni
        assertEquals("Utente [" + idUtenteNonEsistente + "] non trovato", exception.getMessage());
    }

    @Test
    void testUpdateUtenteSettingsNotificheUnauthorized() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Creazione della configurazione notifiche
        ConfigurazioneNotifiche configurazioneNotifiche = new ConfigurazioneNotifiche();

        // Configura un InfoProfilo senza il ruolo richiesto
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Tentativo di aggiornare le notifiche senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.updateUtenteSettingsNotifiche(responseUtente.getBody().getIdUtente(), configurazioneNotifiche);
        });

        // Asserzioni
        assertEquals("Utente non abilitato", exception.getMessage());
    }

    @Test
    void testUpdateUtenteSettingsNotificheUtenteAnonimo() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Creazione della configurazione notifiche
        ConfigurazioneNotifiche configurazioneNotifiche = new ConfigurazioneNotifiche();

        this.tearDown();
        
        // Tentativo di aggiornare le notifiche senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.updateUtenteSettingsNotifiche(responseUtente.getBody().getIdUtente(), configurazioneNotifiche);
        });

        // Asserzioni
        assertEquals("Utente non specificato", exception.getMessage());
    }
    
    @Autowired
    UtentiController utentiController;
    
    @Test
    public void testCreateDeleteUtenteCoordinatoreSuccess() {
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setRuolo(RuoloUtenteEnum.COORDINATORE);
        utente.setReferenteTecnico(false);
        utente.setPrincipal("unoqualsiasi");
        
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);
        
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);
        
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente2 = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente2.getBody());

        ResponseEntity<Void> responseDelete = controller.deleteUtente(responseUtente2.getBody().getIdUtente());
        assertEquals(HttpStatus.OK, responseDelete.getStatusCode());
    }
    
    @Test
    public void testCreateUtenteReferenteServizioError() {
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
        utente.setReferenteTecnico(false);
        utente.setPrincipal("unoqualsiasi");
        
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);
        
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
        	controller.createUtente(utenteCreate);
    	});

        assertEquals("Required: Ruolo AMMINISTRATORE", exception.getMessage());
    }
}

