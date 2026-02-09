package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
import org.govway.catalogo.core.dao.repositories.EmailUpdateVerificationRepository;
import org.govway.catalogo.core.orm.entity.EmailUpdateVerificationEntity;
import org.govway.catalogo.core.orm.entity.EmailUpdateVerificationEntity.StatoVerifica;
import org.govway.catalogo.core.orm.entity.EmailUpdateVerificationEntity.TipoEmail;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.CambioEmailRequest;
import org.govway.catalogo.servlets.model.CodiceInviato;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneNotifiche;
import org.govway.catalogo.servlets.model.ConfigurazioneUtente;
import org.govway.catalogo.servlets.model.RisultatoCambioEmail;
import org.govway.catalogo.servlets.model.VerificaCodiceRequest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.govway.catalogo.servlets.model.ItemUtente;
import org.govway.catalogo.servlets.model.RuoloNotifica;
import org.govway.catalogo.servlets.model.TipoEntitaNotifica;
import org.govway.catalogo.servlets.model.TipoNotificaEnum;
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
import org.junit.jupiter.api.TestInstance;
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
import org.springframework.transaction.annotation.Transactional;

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
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

    @Autowired
    private EmailUpdateVerificationRepository emailUpdateVerificationRepository;

    @Autowired
    private Configurazione configurazione;

    @MockBean
    private JavaMailSender mailSender;

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

        assertEquals("UT.409", exception.getMessage());
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

        assertEquals("UT.403", exception.getMessage());
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

        assertEquals("AUT.403", exception.getMessage());
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

        assertEquals("UT.404", exception.getMessage());
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

        assertEquals("UT.404", exception.getMessage());
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
        assertEquals("CLS.404", exception.getMessage());
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
        assertEquals("UT.403", exception.getMessage());
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
        assertEquals("AUT.403", exception.getMessage());
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
        assertEquals("UT.404", exception.getMessage());
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
        assertEquals("UT.403", exception.getMessage());
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
        assertEquals("AUT.403", exception.getMessage());
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
        assertEquals("UT.404", exception.getMessage());
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
        assertEquals("UT.403", exception.getMessage());
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
        assertEquals("AUT.403", exception.getMessage());
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
        assertEquals("UT.404", exception.getMessage());
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
        assertEquals("UT.403", exception.getMessage());
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
        assertEquals("AUT.403", exception.getMessage());
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
        assertEquals("UT.404", exception.getMessage());
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
        assertEquals("UT.403", exception.getMessage());
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
        assertEquals("AUT.403", exception.getMessage());
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

        assertEquals("AUT.403", exception.getMessage());
    }

    @Test
    void testUpdateUtenteSettingsNotificheWithEmailTypes() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Creazione della configurazione notifiche con tipi email (solo email)
        ConfigurazioneNotifiche configurazioneNotifiche = new ConfigurazioneNotifiche();
        configurazioneNotifiche.setEmettiPerTipi(List.of(
            TipoNotificaEnum.COMUNICAZIONE_EMAIL,
            TipoNotificaEnum.CAMBIO_STATO_EMAIL
        ));
        configurazioneNotifiche.setEmettiPerEntita(List.of(
            TipoEntitaNotifica.SERVIZIO_EMAIL,
            TipoEntitaNotifica.ADESIONE_EMAIL
        ));
        configurazioneNotifiche.setEmettiPerRuoli(List.of(
            RuoloNotifica.SERVIZIO_REFERENTE_DOMINIO_EMAIL,
            RuoloNotifica.ADESIONE_REFERENTE_ADESIONE_EMAIL
        ));

        // Esecuzione del metodo di aggiornamento
        ResponseEntity<ConfigurazioneNotifiche> responseUpdate = controller.updateUtenteSettingsNotifiche(responseUtente.getBody().getIdUtente(), configurazioneNotifiche);

        // Asserzioni
        assertNotNull(responseUpdate.getBody());
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());

        // Verifica che i tipi email siano stati salvati correttamente
        assertTrue(responseUpdate.getBody().getEmettiPerTipi().contains(TipoNotificaEnum.COMUNICAZIONE_EMAIL));
        assertTrue(responseUpdate.getBody().getEmettiPerTipi().contains(TipoNotificaEnum.CAMBIO_STATO_EMAIL));
        assertTrue(responseUpdate.getBody().getEmettiPerEntita().contains(TipoEntitaNotifica.SERVIZIO_EMAIL));
        assertTrue(responseUpdate.getBody().getEmettiPerEntita().contains(TipoEntitaNotifica.ADESIONE_EMAIL));
        assertTrue(responseUpdate.getBody().getEmettiPerRuoli().contains(RuoloNotifica.SERVIZIO_REFERENTE_DOMINIO_EMAIL));
        assertTrue(responseUpdate.getBody().getEmettiPerRuoli().contains(RuoloNotifica.ADESIONE_REFERENTE_ADESIONE_EMAIL));
    }

    @Test
    void testUpdateUtenteSettingsNotificheAllNotifications() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Creazione della configurazione notifiche con tutti i tipi (push + email)
        ConfigurazioneNotifiche configurazioneNotifiche = new ConfigurazioneNotifiche();
        configurazioneNotifiche.setEmettiPerTipi(List.of(
            TipoNotificaEnum.COMUNICAZIONE,
            TipoNotificaEnum.CAMBIO_STATO,
            TipoNotificaEnum.COMUNICAZIONE_EMAIL,
            TipoNotificaEnum.CAMBIO_STATO_EMAIL
        ));
        configurazioneNotifiche.setEmettiPerEntita(List.of(
            TipoEntitaNotifica.SERVIZIO,
            TipoEntitaNotifica.ADESIONE,
            TipoEntitaNotifica.SERVIZIO_EMAIL,
            TipoEntitaNotifica.ADESIONE_EMAIL
        ));

        // Esecuzione del metodo di aggiornamento
        ResponseEntity<ConfigurazioneNotifiche> responseUpdate = controller.updateUtenteSettingsNotifiche(responseUtente.getBody().getIdUtente(), configurazioneNotifiche);

        // Asserzioni
        assertNotNull(responseUpdate.getBody());
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());
        assertEquals(4, responseUpdate.getBody().getEmettiPerTipi().size());
        assertEquals(4, responseUpdate.getBody().getEmettiPerEntita().size());
    }

    @Test
    void testUpdateUtenteSettingsNotifichePushOnly() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Creazione della configurazione notifiche solo push (senza email)
        ConfigurazioneNotifiche configurazioneNotifiche = new ConfigurazioneNotifiche();
        configurazioneNotifiche.setEmettiPerTipi(List.of(
            TipoNotificaEnum.COMUNICAZIONE,
            TipoNotificaEnum.CAMBIO_STATO
        ));
        configurazioneNotifiche.setEmettiPerEntita(List.of(
            TipoEntitaNotifica.SERVIZIO,
            TipoEntitaNotifica.ADESIONE
        ));
        configurazioneNotifiche.setEmettiPerRuoli(List.of(
            RuoloNotifica.SERVIZIO_REFERENTE_DOMINIO,
            RuoloNotifica.ADESIONE_REFERENTE_ADESIONE
        ));

        // Esecuzione del metodo di aggiornamento
        ResponseEntity<ConfigurazioneNotifiche> responseUpdate = controller.updateUtenteSettingsNotifiche(responseUtente.getBody().getIdUtente(), configurazioneNotifiche);

        // Asserzioni
        assertNotNull(responseUpdate.getBody());
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());

        // Verifica che solo i tipi push siano presenti (no email)
        assertFalse(responseUpdate.getBody().getEmettiPerTipi().contains(TipoNotificaEnum.COMUNICAZIONE_EMAIL));
        assertFalse(responseUpdate.getBody().getEmettiPerTipi().contains(TipoNotificaEnum.CAMBIO_STATO_EMAIL));
        assertTrue(responseUpdate.getBody().getEmettiPerTipi().contains(TipoNotificaEnum.COMUNICAZIONE));
        assertTrue(responseUpdate.getBody().getEmettiPerTipi().contains(TipoNotificaEnum.CAMBIO_STATO));
    }

    @Test
    void testUpdateUtenteSettingsNotificheDisabled() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Creazione della configurazione notifiche disabilitate (liste vuote)
        ConfigurazioneNotifiche configurazioneNotifiche = new ConfigurazioneNotifiche();
        configurazioneNotifiche.setEmettiPerTipi(List.of());
        configurazioneNotifiche.setEmettiPerEntita(List.of());
        configurazioneNotifiche.setEmettiPerRuoli(List.of());

        // Esecuzione del metodo di aggiornamento
        ResponseEntity<ConfigurazioneNotifiche> responseUpdate = controller.updateUtenteSettingsNotifiche(responseUtente.getBody().getIdUtente(), configurazioneNotifiche);

        // Asserzioni
        assertNotNull(responseUpdate.getBody());
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());

        // Verifica che le liste siano vuote (notifiche disabilitate)
        assertTrue(responseUpdate.getBody().getEmettiPerTipi().isEmpty());
        assertTrue(responseUpdate.getBody().getEmettiPerEntita().isEmpty());
        assertTrue(responseUpdate.getBody().getEmettiPerRuoli().isEmpty());
    }

    @Test
    void testUpdateUtenteSettingsNotificheAllEmailRoles() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Creazione della configurazione notifiche con tutti i ruoli email
        ConfigurazioneNotifiche configurazioneNotifiche = new ConfigurazioneNotifiche();
        configurazioneNotifiche.setEmettiPerRuoli(List.of(
            RuoloNotifica.SERVIZIO_REFERENTE_DOMINIO_EMAIL,
            RuoloNotifica.SERVIZIO_REFERENTE_TECNICO_DOMINIO_EMAIL,
            RuoloNotifica.SERVIZIO_REFERENTE_SERVIZIO_EMAIL,
            RuoloNotifica.SERVIZIO_REFERENTE_TECNICO_SERVIZIO_EMAIL,
            RuoloNotifica.SERVIZIO_RICHIEDENTE_SERVIZIO_EMAIL,
            RuoloNotifica.ADESIONE_REFERENTE_DOMINIO_EMAIL,
            RuoloNotifica.ADESIONE_REFERENTE_TECNICO_DOMINIO_EMAIL,
            RuoloNotifica.ADESIONE_REFERENTE_SERVIZIO_EMAIL,
            RuoloNotifica.ADESIONE_REFERENTE_TECNICO_SERVIZIO_EMAIL,
            RuoloNotifica.ADESIONE_RICHIEDENTE_SERVIZIO_EMAIL,
            RuoloNotifica.ADESIONE_REFERENTE_ADESIONE_EMAIL,
            RuoloNotifica.ADESIONE_REFERENTE_TECNICO_ADESIONE_EMAIL,
            RuoloNotifica.ADESIONE_RICHIEDENTE_ADESIONE_EMAIL
        ));

        // Esecuzione del metodo di aggiornamento
        ResponseEntity<ConfigurazioneNotifiche> responseUpdate = controller.updateUtenteSettingsNotifiche(responseUtente.getBody().getIdUtente(), configurazioneNotifiche);

        // Asserzioni
        assertNotNull(responseUpdate.getBody());
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());
        assertEquals(13, responseUpdate.getBody().getEmettiPerRuoli().size());
    }

    // ==================== Test Verifica Email Modifica Profilo ====================

    private UtenteEntity setupUtentePerTestEmailVerification(String principal) {
        // Crea organizzazione
        ResponseEntity<Organizzazione> responseOrg = organizzazioniController.createOrganizzazione(
            CommonUtils.getOrganizzazioneCreate());

        // Crea utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setIdOrganizzazione(responseOrg.getBody().getIdOrganizzazione());
        utenteCreate.setPrincipal(principal);
        utenteCreate.setEmailAziendale("originale@test.com");

        controller.createUtente(utenteCreate);
        return this.utenteService.findByPrincipal(principal).get();
    }

    private void abilitaVerificaEmailProfilo(boolean abilitata) {
        if (this.configurazione.getUtente() == null) {
            this.configurazione.setUtente(new ConfigurazioneUtente());
        }
        this.configurazione.getUtente().setProfiloModificaEmailRichiedeVerifica(abilitata);
    }

    @Test
    void testInviaCodiceCambioEmail_EmailAziendale_Success() {
        abilitaVerificaEmailProfilo(true);
        UtenteEntity utente = setupUtentePerTestEmailVerification("test.email.invio");
        CommonUtils.getSessionUtente(utente.getPrincipal(), securityContext, authentication, utenteService);

        CambioEmailRequest request = new CambioEmailRequest();
        request.setEmailAziendale("nuova@test.com");

        ResponseEntity<CodiceInviato> response = controller.inviaCodiceCambioEmail(request);

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody().getMessaggio());
        assertTrue(response.getBody().getScadenzaSecondi() > 0);

        // Verifica che la verifica sia stata salvata nel database
        Optional<EmailUpdateVerificationEntity> verification =
            emailUpdateVerificationRepository.findByUtenteAndStato(utente, StatoVerifica.CODE_SENT);
        assertTrue(verification.isPresent());
        assertEquals("nuova@test.com", verification.get().getNuovaEmail());
        assertEquals(TipoEmail.EMAIL_AZIENDALE, verification.get().getTipoEmail());
    }

    @Test
    void testInviaCodiceCambioEmail_EmailPersonale_Success() {
        abilitaVerificaEmailProfilo(true);
        UtenteEntity utente = setupUtentePerTestEmailVerification("test.email.personale");
        CommonUtils.getSessionUtente(utente.getPrincipal(), securityContext, authentication, utenteService);

        CambioEmailRequest request = new CambioEmailRequest();
        request.setEmail("nuova.personale@test.com");

        ResponseEntity<CodiceInviato> response = controller.inviaCodiceCambioEmail(request);

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());

        // Verifica che la verifica sia stata salvata con tipo EMAIL
        Optional<EmailUpdateVerificationEntity> verification =
            emailUpdateVerificationRepository.findByUtenteAndStato(utente, StatoVerifica.CODE_SENT);
        assertTrue(verification.isPresent());
        assertEquals("nuova.personale@test.com", verification.get().getNuovaEmail());
        assertEquals(TipoEmail.EMAIL, verification.get().getTipoEmail());
    }

    @Test
    void testInviaCodiceCambioEmail_EntrambiCampi_BadRequest() {
        abilitaVerificaEmailProfilo(true);
        UtenteEntity utente = setupUtentePerTestEmailVerification("test.email.entrambi");
        CommonUtils.getSessionUtente(utente.getPrincipal(), securityContext, authentication, utenteService);

        CambioEmailRequest request = new CambioEmailRequest();
        request.setEmail("personale@test.com");
        request.setEmailAziendale("aziendale@test.com");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.inviaCodiceCambioEmail(request);
        });

        assertEquals("GEN.400.REQUEST", exception.getMessage());
    }

    @Test
    void testInviaCodiceCambioEmail_NessunCampo_BadRequest() {
        abilitaVerificaEmailProfilo(true);
        UtenteEntity utente = setupUtentePerTestEmailVerification("test.email.nessuno");
        CommonUtils.getSessionUtente(utente.getPrincipal(), securityContext, authentication, utenteService);

        CambioEmailRequest request = new CambioEmailRequest();
        // Nessun campo email impostato

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.inviaCodiceCambioEmail(request);
        });

        assertEquals("GEN.400.REQUEST", exception.getMessage());
    }

    @Test
    void testInviaCodiceCambioEmail_FeatureDisabilitata() {
        abilitaVerificaEmailProfilo(false);
        UtenteEntity utente = setupUtentePerTestEmailVerification("test.email.disabled");
        CommonUtils.getSessionUtente(utente.getPrincipal(), securityContext, authentication, utenteService);

        CambioEmailRequest request = new CambioEmailRequest();
        request.setEmailAziendale("nuova@test.com");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.inviaCodiceCambioEmail(request);
        });

        assertEquals("REG.400.NOT.ENABLED", exception.getMessage());
    }

    @Test
    void testInviaCodiceCambioEmail_UtenteNonAutenticato() {
        abilitaVerificaEmailProfilo(true);
        this.tearDown();

        CambioEmailRequest request = new CambioEmailRequest();
        request.setEmailAziendale("nuova@test.com");

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.inviaCodiceCambioEmail(request);
        });

        assertEquals("AUT.403", exception.getMessage());
    }

    @Test
    void testVerificaCodiceCambioEmail_CodiceCorretto_EmailAziendale() {
        abilitaVerificaEmailProfilo(true);
        UtenteEntity utente = setupUtentePerTestEmailVerification("test.verifica.ok");
        CommonUtils.getSessionUtente(utente.getPrincipal(), securityContext, authentication, utenteService);

        // Crea una verifica con codice valido per email aziendale
        EmailUpdateVerificationEntity verification = new EmailUpdateVerificationEntity();
        verification.setUtente(utente);
        verification.setNuovaEmail("nuova.verificata@test.com");
        verification.setTipoEmail(TipoEmail.EMAIL_AZIENDALE);
        verification.setCodiceVerifica("ABC123");
        verification.setCodiceVerificaScadenza(new Date(System.currentTimeMillis() + 300000));
        verification.setStato(StatoVerifica.CODE_SENT);
        verification.setTentativiVerifica(0);
        verification.setTentativiInvio(1);
        verification.setDataCreazione(new Date());
        emailUpdateVerificationRepository.save(verification);

        VerificaCodiceRequest request = new VerificaCodiceRequest();
        request.setCodice("ABC123");

        ResponseEntity<RisultatoCambioEmail> response = controller.verificaCodiceCambioEmail(request);

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEsito());

        // Verifica che l'email aziendale dell'utente sia stata aggiornata
        UtenteEntity utenteAggiornato = this.utenteService.findByPrincipal("test.verifica.ok").get();
        assertEquals("nuova.verificata@test.com", utenteAggiornato.getEmailAziendale());
    }

    @Test
    void testVerificaCodiceCambioEmail_CodiceCorretto_EmailPersonale() {
        abilitaVerificaEmailProfilo(true);
        UtenteEntity utente = setupUtentePerTestEmailVerification("test.verifica.personale");
        CommonUtils.getSessionUtente(utente.getPrincipal(), securityContext, authentication, utenteService);

        // Crea una verifica con codice valido per email personale
        EmailUpdateVerificationEntity verification = new EmailUpdateVerificationEntity();
        verification.setUtente(utente);
        verification.setNuovaEmail("nuova.personale@test.com");
        verification.setTipoEmail(TipoEmail.EMAIL);
        verification.setCodiceVerifica("XYZ789");
        verification.setCodiceVerificaScadenza(new Date(System.currentTimeMillis() + 300000));
        verification.setStato(StatoVerifica.CODE_SENT);
        verification.setTentativiVerifica(0);
        verification.setTentativiInvio(1);
        verification.setDataCreazione(new Date());
        emailUpdateVerificationRepository.save(verification);

        VerificaCodiceRequest request = new VerificaCodiceRequest();
        request.setCodice("XYZ789");

        ResponseEntity<RisultatoCambioEmail> response = controller.verificaCodiceCambioEmail(request);

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEsito());

        // Verifica che l'email personale dell'utente sia stata aggiornata
        UtenteEntity utenteAggiornato = this.utenteService.findByPrincipal("test.verifica.personale").get();
        assertEquals("nuova.personale@test.com", utenteAggiornato.getEmail());
    }

    @Test
    void testVerificaCodiceCambioEmail_CodiceErrato() {
        abilitaVerificaEmailProfilo(true);
        UtenteEntity utente = setupUtentePerTestEmailVerification("test.verifica.errato");
        CommonUtils.getSessionUtente(utente.getPrincipal(), securityContext, authentication, utenteService);

        // Crea una verifica con codice valido
        EmailUpdateVerificationEntity verification = new EmailUpdateVerificationEntity();
        verification.setUtente(utente);
        verification.setNuovaEmail("nuova@test.com");
        verification.setTipoEmail(TipoEmail.EMAIL_AZIENDALE);
        verification.setCodiceVerifica("ABC123");
        verification.setCodiceVerificaScadenza(new Date(System.currentTimeMillis() + 300000));
        verification.setStato(StatoVerifica.CODE_SENT);
        verification.setTentativiVerifica(0);
        verification.setTentativiInvio(1);
        verification.setDataCreazione(new Date());
        emailUpdateVerificationRepository.save(verification);

        VerificaCodiceRequest request = new VerificaCodiceRequest();
        request.setCodice("WRONG1");

        ResponseEntity<RisultatoCambioEmail> response = controller.verificaCodiceCambioEmail(request);

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertFalse(response.getBody().isEsito());
        assertTrue(response.getBody().getMessaggio().contains("Codice errato"));
    }

    @Test
    void testVerificaCodiceCambioEmail_CodiceScaduto() {
        abilitaVerificaEmailProfilo(true);
        UtenteEntity utente = setupUtentePerTestEmailVerification("test.verifica.scaduto");
        CommonUtils.getSessionUtente(utente.getPrincipal(), securityContext, authentication, utenteService);

        // Crea una verifica con codice scaduto
        EmailUpdateVerificationEntity verification = new EmailUpdateVerificationEntity();
        verification.setUtente(utente);
        verification.setNuovaEmail("nuova@test.com");
        verification.setTipoEmail(TipoEmail.EMAIL_AZIENDALE);
        verification.setCodiceVerifica("ABC123");
        verification.setCodiceVerificaScadenza(new Date(System.currentTimeMillis() - 300000)); // Scaduto
        verification.setStato(StatoVerifica.CODE_SENT);
        verification.setTentativiVerifica(0);
        verification.setTentativiInvio(1);
        verification.setDataCreazione(new Date());
        emailUpdateVerificationRepository.save(verification);

        VerificaCodiceRequest request = new VerificaCodiceRequest();
        request.setCodice("ABC123");

        ResponseEntity<RisultatoCambioEmail> response = controller.verificaCodiceCambioEmail(request);

        assertNotNull(response.getBody());
        assertEquals(410, response.getStatusCode().value());
        assertFalse(response.getBody().isEsito());
    }

    @Test
    void testVerificaCodiceCambioEmail_NessunCodiceInviato() {
        abilitaVerificaEmailProfilo(true);
        UtenteEntity utente = setupUtentePerTestEmailVerification("test.verifica.nocode");
        CommonUtils.getSessionUtente(utente.getPrincipal(), securityContext, authentication, utenteService);

        VerificaCodiceRequest request = new VerificaCodiceRequest();
        request.setCodice("ABC123");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.verificaCodiceCambioEmail(request);
        });

        assertEquals("REG.400.NO.CODE", exception.getMessage());
    }

    @Test
    void testFlussoCompleto_InvioEVerificaCodice_EmailAziendale() {
        abilitaVerificaEmailProfilo(true);
        UtenteEntity utente = setupUtentePerTestEmailVerification("test.flusso.completo");
        CommonUtils.getSessionUtente(utente.getPrincipal(), securityContext, authentication, utenteService);

        // Step 1: Invia codice per email aziendale
        CambioEmailRequest invioRequest = new CambioEmailRequest();
        invioRequest.setEmailAziendale("nuova.completo@test.com");

        ResponseEntity<CodiceInviato> invioResponse = controller.inviaCodiceCambioEmail(invioRequest);
        assertEquals(HttpStatus.OK, invioResponse.getStatusCode());

        // Recupera il codice dal database
        Optional<EmailUpdateVerificationEntity> verification =
            emailUpdateVerificationRepository.findByUtenteAndStato(utente, StatoVerifica.CODE_SENT);
        assertTrue(verification.isPresent());
        assertEquals(TipoEmail.EMAIL_AZIENDALE, verification.get().getTipoEmail());
        String codice = verification.get().getCodiceVerifica();

        // Step 2: Verifica codice
        VerificaCodiceRequest verificaRequest = new VerificaCodiceRequest();
        verificaRequest.setCodice(codice);

        ResponseEntity<RisultatoCambioEmail> verificaResponse = controller.verificaCodiceCambioEmail(verificaRequest);

        assertEquals(HttpStatus.OK, verificaResponse.getStatusCode());
        assertTrue(verificaResponse.getBody().isEsito());

        // Verifica finale: l'email aziendale dell'utente deve essere aggiornata
        UtenteEntity utenteAggiornato = this.utenteService.findByPrincipal("test.flusso.completo").get();
        assertEquals("nuova.completo@test.com", utenteAggiornato.getEmailAziendale());
    }

    @Test
    void testFlussoCompleto_InvioEVerificaCodice_EmailPersonale() {
        abilitaVerificaEmailProfilo(true);
        UtenteEntity utente = setupUtentePerTestEmailVerification("test.flusso.personale");
        CommonUtils.getSessionUtente(utente.getPrincipal(), securityContext, authentication, utenteService);

        // Step 1: Invia codice per email personale
        CambioEmailRequest invioRequest = new CambioEmailRequest();
        invioRequest.setEmail("nuova.personale.completo@test.com");

        ResponseEntity<CodiceInviato> invioResponse = controller.inviaCodiceCambioEmail(invioRequest);
        assertEquals(HttpStatus.OK, invioResponse.getStatusCode());

        // Recupera il codice dal database
        Optional<EmailUpdateVerificationEntity> verification =
            emailUpdateVerificationRepository.findByUtenteAndStato(utente, StatoVerifica.CODE_SENT);
        assertTrue(verification.isPresent());
        assertEquals(TipoEmail.EMAIL, verification.get().getTipoEmail());
        String codice = verification.get().getCodiceVerifica();

        // Step 2: Verifica codice
        VerificaCodiceRequest verificaRequest = new VerificaCodiceRequest();
        verificaRequest.setCodice(codice);

        ResponseEntity<RisultatoCambioEmail> verificaResponse = controller.verificaCodiceCambioEmail(verificaRequest);

        assertEquals(HttpStatus.OK, verificaResponse.getStatusCode());
        assertTrue(verificaResponse.getBody().isEsito());

        // Verifica finale: l'email personale dell'utente deve essere aggiornata
        UtenteEntity utenteAggiornato = this.utenteService.findByPrincipal("test.flusso.personale").get();
        assertEquals("nuova.personale.completo@test.com", utenteAggiornato.getEmail());
    }
}

