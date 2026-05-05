package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
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
import org.govway.catalogo.OrganizationContext;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.UtenteAuthorization;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ServiziController;
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
import org.govway.catalogo.servlets.model.ProfiloRuoli;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.RuoloReferenteEnum;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.StatoUtenteEnum;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteOrganizzazioneCreate;
import org.govway.catalogo.servlets.model.UtenteUpdate;
import org.govway.catalogo.servlets.model.ProfiloOrganizationUpdate;
import org.govway.catalogo.servlets.model.RuoloOrganizzazioneEnum;
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
    private DominiController dominiController;

    @Autowired
    private ServiziController serviziController;

    @Autowired
    private UtenteService utenteService;

    @Autowired
    private OrganizzazioneService organizzazioneService;

    @Autowired
    private EmailUpdateVerificationRepository emailUpdateVerificationRepository;

    @Autowired
    private Configurazione configurazione;

    @Autowired
    private OrganizationContext organizationContext;

    @MockBean
    private JavaMailSender mailSender;

    private static final String UTENTE_GESTORE = "gestore";

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

        InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.findByPrincipal(UTENTE_GESTORE).get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);

        // Setup mock per l'invio email MIME multipart
        when(this.mailSender.createMimeMessage()).thenReturn(new jakarta.mail.internet.MimeMessage((jakarta.mail.Session) null));

        SecurityContextHolder.setContext(this.securityContext);

        // Reset stato bean request-scoped tra un test e l'altro
        organizationContext.setIdOrganizzazione(null);
        organizationContext.setRuoloOrganizzazione(null);
        organizationContext.setInitialized(false);
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
        CommonUtils.setOrganizzazione(utente, responseOrganizzazione.getBody().getIdOrganizzazione());

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
        CommonUtils.setOrganizzazione(utente, responseOrganizzazione.getBody().getIdOrganizzazione());

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
        CommonUtils.setOrganizzazione(utente, responseOrganizzazione.getBody().getIdOrganizzazione());

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
        CommonUtils.setOrganizzazione(utente, responseOrganizzazione.getBody().getIdOrganizzazione());

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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate1, responseOrganizzazione.getBody().getIdOrganizzazione());
        controller.createUtente(utenteCreate1);

        UtenteCreate utenteCreate2 = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate2, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate1, responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate1.setStato(StatoUtenteEnum.ABILITATO);
        controller.createUtente(utenteCreate1);

        UtenteCreate utenteCreate2 = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate2, responseOrganizzazione.getBody().getIdOrganizzazione());
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
            CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
            CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
            CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate1, responseOrganizzazione.getBody().getIdOrganizzazione());
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
            controller.listUtenti(null, null, null, List.of(idClasseUtenteNonEsistente), null, null, null, null, null, 0, 10, null);
        });

        // Asserzioni
        assertEquals("CLS.404", exception.getMessage());
    }

    @Test
    void testListUtentiDashboardFilterGestore() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione di un utente con stato NON_CONFIGURATO
        UtenteCreate utenteCreate1 = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate1, responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate1.setStato(StatoUtenteEnum.NON_CONFIGURATO);
        controller.createUtente(utenteCreate1);

        // Creazione di un utente con stato ABILITATO
        UtenteCreate utenteCreate2 = CommonUtils.getUtenteCreate();
        utenteCreate2.setPrincipal("second.user");
        CommonUtils.setOrganizzazione(utenteCreate2, responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate2.setStato(StatoUtenteEnum.ABILITATO);
        controller.createUtente(utenteCreate2);

        // Recupero della lista con dashboard=true (utente gestore)
        ResponseEntity<PagedModelItemUtente> responseList = controller.listUtenti(null, null, null, null, null, null, null, true, null, 0, 10, null);

        // Asserzioni
        assertNotNull(responseList.getBody());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        // Verifica che vengano restituiti solo utenti con stato NON_CONFIGURATO o PENDING_UPDATE
        List<ItemUtente> content = responseList.getBody().getContent();
        for (ItemUtente utente : content) {
            assertTrue(utente.getStato() == StatoUtenteEnum.NON_CONFIGURATO || utente.getStato() == StatoUtenteEnum.PENDING_UPDATE);
        }
    }

    @Test
    void testUpdateUtenteUnauthorized() {
        // Creazione dell'organizzazione necessaria
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        utente.setPrincipal("unoqualsiasi");
        
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);
        
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);
        
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        utente.setPrincipal("unoqualsiasi");
        
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);
        
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
        
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
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
        CommonUtils.setOrganizzazione(utenteCreate, responseOrg.getBody().getIdOrganizzazione());
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

    // ==================== Test Update Profilo Organization ====================

    @Test
    void testUpdateProfiloOrganization_Success() {
        // Creazione dell'organizzazione iniziale
        ResponseEntity<Organizzazione> responseOrganizzazione1 = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione1.getBody());

        // Creazione della nuova organizzazione
        var orgCreate2 = CommonUtils.getOrganizzazioneCreate();
        orgCreate2.setNome("Nuova Organizzazione");
        orgCreate2.setCodiceEnte("NUOVA_ORG");
        ResponseEntity<Organizzazione> responseOrganizzazione2 = organizzazioniController.createOrganizzazione(orgCreate2);
        assertNotNull(responseOrganizzazione2.getBody());

        // Creazione dell'utente associato alla prima organizzazione
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione1.getBody().getIdOrganizzazione());
        utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Configura l'utente come utente loggato
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        // Richiesta di cambio organizzazione
        ProfiloOrganizationUpdate request = new ProfiloOrganizationUpdate();
        request.setIdOrganizzazione(responseOrganizzazione2.getBody().getIdOrganizzazione());
        request.setIdOrganizzazionePartenza(responseOrganizzazione1.getBody().getIdOrganizzazione());

        ResponseEntity<Utente> response = controller.updateProfiloOrganization(request);

        // Asserzioni
        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(StatoUtenteEnum.PENDING_UPDATE, response.getBody().getStato());
        assertNotNull(response.getBody().getOrganizzazionePending());
        assertEquals(responseOrganizzazione2.getBody().getIdOrganizzazione(), response.getBody().getOrganizzazionePending().getIdOrganizzazione());
        // L'organizzazione attuale deve rimanere invariata
        assertEquals(1, response.getBody().getOrganizzazioni().size());
        assertEquals(responseOrganizzazione1.getBody().getIdOrganizzazione(), response.getBody().getOrganizzazioni().get(0).getOrganizzazione().getIdOrganizzazione());
    }

    @Test
    void testUpdateProfiloOrganization_OrganizzazioneNotFound() {
        // Creazione dell'organizzazione
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Configura l'utente come utente loggato
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        // Richiesta di cambio a organizzazione inesistente
        ProfiloOrganizationUpdate request = new ProfiloOrganizationUpdate();
        request.setIdOrganizzazione(UUID.randomUUID());

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.updateProfiloOrganization(request);
        });

        assertEquals("ORG.404", exception.getMessage());
    }

    @Test
    void testUpdateProfiloOrganization_UtenteNonAutenticato() {
        // Creazione dell'organizzazione
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Logout
        this.tearDown();

        // Richiesta di cambio organizzazione senza autenticazione
        ProfiloOrganizationUpdate request = new ProfiloOrganizationUpdate();
        request.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.updateProfiloOrganization(request);
        });

        assertEquals("AUT.403", exception.getMessage());
    }

    @Test
    void testUpdateProfiloOrganization_SovrascriveRichiestaPrecedente() {
        // Creazione di tre organizzazioni
        ResponseEntity<Organizzazione> responseOrganizzazione1 = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione1.getBody());

        var orgCreate2 = CommonUtils.getOrganizzazioneCreate();
        orgCreate2.setNome("Seconda Organizzazione");
        orgCreate2.setCodiceEnte("ORG_2");
        ResponseEntity<Organizzazione> responseOrganizzazione2 = organizzazioniController.createOrganizzazione(orgCreate2);
        assertNotNull(responseOrganizzazione2.getBody());

        var orgCreate3 = CommonUtils.getOrganizzazioneCreate();
        orgCreate3.setNome("Terza Organizzazione");
        orgCreate3.setCodiceEnte("ORG_3");
        ResponseEntity<Organizzazione> responseOrganizzazione3 = organizzazioniController.createOrganizzazione(orgCreate3);
        assertNotNull(responseOrganizzazione3.getBody());

        // Creazione dell'utente associato alla prima organizzazione
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione1.getBody().getIdOrganizzazione());
        utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Configura l'utente come utente loggato
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        // Prima richiesta di cambio organizzazione
        ProfiloOrganizationUpdate request1 = new ProfiloOrganizationUpdate();
        request1.setIdOrganizzazione(responseOrganizzazione2.getBody().getIdOrganizzazione());
        request1.setIdOrganizzazionePartenza(responseOrganizzazione1.getBody().getIdOrganizzazione());

        ResponseEntity<Utente> response1 = controller.updateProfiloOrganization(request1);
        assertEquals(responseOrganizzazione2.getBody().getIdOrganizzazione(), response1.getBody().getOrganizzazionePending().getIdOrganizzazione());

        // Seconda richiesta di cambio organizzazione (deve sovrascrivere la prima)
        ProfiloOrganizationUpdate request2 = new ProfiloOrganizationUpdate();
        request2.setIdOrganizzazione(responseOrganizzazione3.getBody().getIdOrganizzazione());
        request2.setIdOrganizzazionePartenza(responseOrganizzazione1.getBody().getIdOrganizzazione());

        ResponseEntity<Utente> response2 = controller.updateProfiloOrganization(request2);

        // Asserzioni: la seconda richiesta deve aver sovrascritto la prima
        assertNotNull(response2.getBody());
        assertEquals(HttpStatus.OK, response2.getStatusCode());
        assertEquals(StatoUtenteEnum.PENDING_UPDATE, response2.getBody().getStato());
        assertEquals(responseOrganizzazione3.getBody().getIdOrganizzazione(), response2.getBody().getOrganizzazionePending().getIdOrganizzazione());
        // L'organizzazione attuale deve rimanere invariata
        assertEquals(1, response2.getBody().getOrganizzazioni().size());
        assertEquals(responseOrganizzazione1.getBody().getIdOrganizzazione(), response2.getBody().getOrganizzazioni().get(0).getOrganizzazione().getIdOrganizzazione());
    }

    @Test
    void testUpdateProfiloOrganization_UtenteConRuoloReferenteServizio() {
        // Creazione delle organizzazioni
        ResponseEntity<Organizzazione> responseOrganizzazione1 = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione1.getBody());

        var orgCreate2 = CommonUtils.getOrganizzazioneCreate();
        orgCreate2.setNome("Altra Organizzazione");
        orgCreate2.setCodiceEnte("ALTRA_ORG");
        ResponseEntity<Organizzazione> responseOrganizzazione2 = organizzazioniController.createOrganizzazione(orgCreate2);
        assertNotNull(responseOrganizzazione2.getBody());

        // Creazione dell'utente con ruolo REFERENTE_SERVIZIO
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione1.getBody().getIdOrganizzazione());
        utenteCreate.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Configura l'utente come utente loggato
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        // Richiesta di cambio organizzazione
        ProfiloOrganizationUpdate request = new ProfiloOrganizationUpdate();
        request.setIdOrganizzazione(responseOrganizzazione2.getBody().getIdOrganizzazione());
        request.setIdOrganizzazionePartenza(responseOrganizzazione1.getBody().getIdOrganizzazione());

        // Un utente con ruolo REFERENTE_SERVIZIO deve poter richiedere il cambio organizzazione
        ResponseEntity<Utente> response = controller.updateProfiloOrganization(request);

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(StatoUtenteEnum.PENDING_UPDATE, response.getBody().getStato());
    }

    // ==================== Test Get Profilo Ruoli ====================

    @Test
    void testGetProfiloRuoli_Success_NoRuoliReferente() {
        // Creazione dell'organizzazione
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente senza ruoli di referente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Configura l'utente come utente loggato
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        // Chiamata all'API
        ResponseEntity<ProfiloRuoli> response = controller.getProfiloRuoli();

        // Asserzioni
        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        // L'utente non ha ruolo definito, quindi ruolo è null
        // I ruoli di referente devono essere vuoti
        assertTrue(response.getBody().getRuoliReferente() == null || response.getBody().getRuoliReferente().isEmpty());
    }

    @Test
    void testGetProfiloRuoli_Success_ConRuoloUtente() {
        // Creazione dell'organizzazione
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione dell'utente con ruolo GESTORE
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
        utenteCreate.setRuolo(RuoloUtenteEnum.GESTORE);
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Configura l'utente come utente loggato
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        // Chiamata all'API
        ResponseEntity<ProfiloRuoli> response = controller.getProfiloRuoli();

        // Asserzioni
        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(RuoloUtenteEnum.GESTORE, response.getBody().getRuolo());
    }

    @Test
    void testGetProfiloRuoli_Success_ConReferenteDominio() {
        // Creazione dell'organizzazione
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione del soggetto
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("soggetto-test-ruoli");
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        soggettoCreate.setReferente(true);
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        // Creazione del dominio
        var dominioCreate = CommonUtils.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(responseSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> responseDominio = dominiController.createDominio(dominioCreate);
        assertNotNull(responseDominio.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
        utenteCreate.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Aggiunge l'utente come referente del dominio
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        dominiController.createReferenteDominio(responseDominio.getBody().getIdDominio(), referenteCreate);

        // Configura l'utente come utente loggato
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        // Chiamata all'API
        ResponseEntity<ProfiloRuoli> response = controller.getProfiloRuoli();

        // Asserzioni
        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE, response.getBody().getRuolo());
        assertNotNull(response.getBody().getRuoliReferente());
        assertTrue(response.getBody().getRuoliReferente().contains(RuoloReferenteEnum.REFERENTE_DOMINIO));
    }

    @Test
    void testGetProfiloRuoli_Success_ConReferenteTecnicoDominio() {
        // Creazione dell'organizzazione
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione del soggetto
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("soggetto-test-ruoli-tecnico");
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        soggettoCreate.setReferente(true);
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        // Creazione del dominio
        var dominioCreate = CommonUtils.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(responseSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> responseDominio = dominiController.createDominio(dominioCreate);
        assertNotNull(responseDominio.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setPrincipal("utente-tecnico-dominio");
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
        utenteCreate.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Aggiunge l'utente come referente tecnico del dominio
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        dominiController.createReferenteDominio(responseDominio.getBody().getIdDominio(), referenteCreate);

        // Configura l'utente come utente loggato
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        // Chiamata all'API
        ResponseEntity<ProfiloRuoli> response = controller.getProfiloRuoli();

        // Asserzioni
        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody().getRuoliReferente());
        assertTrue(response.getBody().getRuoliReferente().contains(RuoloReferenteEnum.REFERENTE_TECNICO_DOMINIO));
    }

    @Test
    void testGetProfiloRuoli_Success_ConReferenteServizio() {
        // Creazione dell'organizzazione
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione del soggetto
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("soggetto-test-servizio");
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        soggettoCreate.setReferente(true);
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        // Creazione del dominio
        var dominioCreate = CommonUtils.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(responseSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> responseDominio = dominiController.createDominio(dominioCreate);
        assertNotNull(responseDominio.getBody());

        // Creazione dell'utente che sarà il referente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setPrincipal("utente-ref-servizio");
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
        utenteCreate.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Creazione del servizio con referente
        var servizioCreate = CommonUtils.getServizioCreate();
        servizioCreate.setIdDominio(responseDominio.getBody().getIdDominio());
        servizioCreate.setIdSoggettoInterno(responseSoggetto.getBody().getIdSoggetto());
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        servizioCreate.setReferenti(List.of(referenteCreate));
        ResponseEntity<Servizio> responseServizio = serviziController.createServizio(servizioCreate);
        assertNotNull(responseServizio.getBody());

        // Configura l'utente come utente loggato
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        // Chiamata all'API
        ResponseEntity<ProfiloRuoli> response = controller.getProfiloRuoli();

        // Asserzioni
        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody().getRuoliReferente());
        assertTrue(response.getBody().getRuoliReferente().contains(RuoloReferenteEnum.REFERENTE_SERVIZIO));
    }

    @Test
    void testGetProfiloRuoli_Success_ConRichiedenteServizio() {
        // Creazione dell'organizzazione
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione del soggetto
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("soggetto-test-richiedente");
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        soggettoCreate.setReferente(true);
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        // Creazione del dominio
        var dominioCreate = CommonUtils.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(responseSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> responseDominio = dominiController.createDominio(dominioCreate);
        assertNotNull(responseDominio.getBody());

        // Creazione dell'utente che sarà il richiedente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setPrincipal("utente-richiedente-servizio");
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
        utenteCreate.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Configura l'utente come utente loggato per creare il servizio (sarà automaticamente richiedente)
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        // Creazione del servizio (l'utente loggato diventa richiedente)
        var servizioCreate = CommonUtils.getServizioCreate();
        servizioCreate.setIdDominio(responseDominio.getBody().getIdDominio());
        servizioCreate.setIdSoggettoInterno(responseSoggetto.getBody().getIdSoggetto());
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        servizioCreate.setReferenti(List.of(referenteCreate));
        ResponseEntity<Servizio> responseServizio = serviziController.createServizio(servizioCreate);
        assertNotNull(responseServizio.getBody());

        // Chiamata all'API
        ResponseEntity<ProfiloRuoli> response = controller.getProfiloRuoli();

        // Asserzioni
        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody().getRuoliReferente());
        assertTrue(response.getBody().getRuoliReferente().contains(RuoloReferenteEnum.RICHIEDENTE_SERVIZIO));
    }

    @Test
    void testGetProfiloRuoli_UtenteNonAutenticato() {
        // Logout
        this.tearDown();

        // Chiamata all'API senza autenticazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.getProfiloRuoli();
        });

        // Asserzioni
        assertEquals("AUT.403", exception.getMessage());
    }

    @Test
    void testGetProfiloRuoli_Success_MultipleRuoli() {
        // Creazione dell'organizzazione
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione del soggetto
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("soggetto-test-multi");
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        soggettoCreate.setReferente(true);
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        // Creazione del dominio
        var dominioCreate = CommonUtils.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(responseSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> responseDominio = dominiController.createDominio(dominioCreate);
        assertNotNull(responseDominio.getBody());

        // Creazione dell'utente
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setPrincipal("utente-multi-ruoli");
        CommonUtils.setOrganizzazione(utenteCreate, responseOrganizzazione.getBody().getIdOrganizzazione());
        utenteCreate.setStato(StatoUtenteEnum.ABILITATO);
        utenteCreate.setRuolo(RuoloUtenteEnum.COORDINATORE);
        ResponseEntity<Utente> responseUtente = controller.createUtente(utenteCreate);
        assertNotNull(responseUtente.getBody());

        // Creazione del servizio con referente
        var servizioCreate = CommonUtils.getServizioCreate();
        servizioCreate.setIdDominio(responseDominio.getBody().getIdDominio());
        servizioCreate.setIdSoggettoInterno(responseSoggetto.getBody().getIdSoggetto());
        ReferenteCreate referenteServizioCreate = new ReferenteCreate();
        referenteServizioCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteServizioCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        servizioCreate.setReferenti(List.of(referenteServizioCreate));
        ResponseEntity<Servizio> responseServizio = serviziController.createServizio(servizioCreate);
        assertNotNull(responseServizio.getBody());

        // Aggiunge l'utente come referente del dominio
        ReferenteCreate referenteDominioCreate = new ReferenteCreate();
        referenteDominioCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteDominioCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        dominiController.createReferenteDominio(responseDominio.getBody().getIdDominio(), referenteDominioCreate);

        // Aggiunge l'utente come referente tecnico del servizio
        ReferenteCreate referenteTecnicoServizioCreate = new ReferenteCreate();
        referenteTecnicoServizioCreate.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        referenteTecnicoServizioCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        serviziController.createReferenteServizio(responseServizio.getBody().getIdServizio(), null, referenteTecnicoServizioCreate);

        // Configura l'utente come utente loggato
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        // Chiamata all'API
        ResponseEntity<ProfiloRuoli> response = controller.getProfiloRuoli();

        // Asserzioni
        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(RuoloUtenteEnum.COORDINATORE, response.getBody().getRuolo());
        assertNotNull(response.getBody().getRuoliReferente());
        // Deve avere almeno 2 ruoli (referente dominio e referente tecnico servizio)
        assertTrue(response.getBody().getRuoliReferente().size() >= 2);
        assertTrue(response.getBody().getRuoliReferente().contains(RuoloReferenteEnum.REFERENTE_DOMINIO));
        assertTrue(response.getBody().getRuoliReferente().contains(RuoloReferenteEnum.REFERENTE_TECNICO_SERVIZIO));
    }

    // ============================================================
    // createUtente per AMMINISTRATORE_ORGANIZZAZIONE (multi-org)
    // ============================================================

    /**
     * Popola manualmente il contesto organizzazione (simula l'OrganizationContextInterceptor).
     */
    private void simulaContestoOrganizzazione(Organizzazione org,
            RuoloOrganizzazione ruolo) {
        OrganizzazioneEntity orgEntity =
                organizzazioneService.find(org.getIdOrganizzazione()).get();
        organizationContext.setIdOrganizzazione(orgEntity.getId());
        organizationContext.setRuoloOrganizzazione(ruolo);
        organizationContext.setInitialized(true);
    }

    private void resetContestoOrganizzazione() {
        organizationContext.setIdOrganizzazione(null);
        organizationContext.setRuoloOrganizzazione(null);
        organizationContext.setInitialized(false);
    }

    /**
     * Crea un AMM_ORG sull'organizzazione indicata e lo imposta come utente di sessione,
     * popolando anche il contesto organizzazione di sessione.
     */
    private Utente creaAmmOrgEAutentica(String principal, Organizzazione org) {
        UtenteCreate uc = CommonUtils.getUtenteCreate();
        uc.setPrincipal(principal);
        uc.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        UtenteOrganizzazioneCreate assoc =
                new UtenteOrganizzazioneCreate();
        assoc.setIdOrganizzazione(org.getIdOrganizzazione());
        assoc.setRuoloOrganizzazione(
                RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
        uc.setOrganizzazioni(List.of(assoc));
        Utente creato = controller.createUtente(uc).getBody();

        // Autentica come AMM_ORG
        CommonUtils.getSessionUtente(principal, securityContext, authentication, utenteService);
        simulaContestoOrganizzazione(org, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        return creato;
    }

    @Test
    public void testCreateUtente_AmmOrg_Success() {
        Organizzazione org = organizzazioniController.createOrganizzazione(
                CommonUtils.getOrganizzazioneCreate()).getBody();
        creaAmmOrgEAutentica("amm.org.create.ok", org);

        // L'AMM_ORG crea un nuovo utente con ruolo OPERATORE_API sulla sua organizzazione
        UtenteCreate nuovo = CommonUtils.getUtenteCreate();
        nuovo.setPrincipal("amm.org.create.target");
        nuovo.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        UtenteOrganizzazioneCreate ass =
                new UtenteOrganizzazioneCreate();
        ass.setIdOrganizzazione(org.getIdOrganizzazione());
        ass.setRuoloOrganizzazione(
                RuoloOrganizzazioneEnum.OPERATORE_API);
        nuovo.setOrganizzazioni(List.of(ass));

        ResponseEntity<Utente> response = controller.createUtente(nuovo);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("amm.org.create.target", response.getBody().getPrincipal());
        assertEquals(1, response.getBody().getOrganizzazioni().size());
    }

    @Test
    public void testCreateUtente_AmmOrg_PuoCreareAltroAmmOrg() {
        Organizzazione org = organizzazioniController.createOrganizzazione(
                CommonUtils.getOrganizzazioneCreate()).getBody();
        creaAmmOrgEAutentica("amm.org.create.amm", org);

        // L'AMM_ORG crea un nuovo AMM_ORG sulla stessa organizzazione
        UtenteCreate nuovo = CommonUtils.getUtenteCreate();
        nuovo.setPrincipal("amm.org.create.amm.target");
        nuovo.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        UtenteOrganizzazioneCreate ass =
                new UtenteOrganizzazioneCreate();
        ass.setIdOrganizzazione(org.getIdOrganizzazione());
        ass.setRuoloOrganizzazione(
                RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
        nuovo.setOrganizzazioni(List.of(ass));

        ResponseEntity<Utente> response = controller.createUtente(nuovo);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE,
                response.getBody().getOrganizzazioni().get(0).getRuoloOrganizzazione());
    }

    @Test
    public void testCreateUtente_AmmOrg_RuoloGestore_Forbidden() {
        Organizzazione org = organizzazioniController.createOrganizzazione(
                CommonUtils.getOrganizzazioneCreate()).getBody();
        creaAmmOrgEAutentica("amm.org.create.gestore", org);

        UtenteCreate nuovo = CommonUtils.getUtenteCreate();
        nuovo.setPrincipal("amm.org.create.gestore.target");
        nuovo.setRuolo(RuoloUtenteEnum.GESTORE);
        UtenteOrganizzazioneCreate ass =
                new UtenteOrganizzazioneCreate();
        ass.setIdOrganizzazione(org.getIdOrganizzazione());
        ass.setRuoloOrganizzazione(
                RuoloOrganizzazioneEnum.OPERATORE_API);
        nuovo.setOrganizzazioni(List.of(ass));

        NotAuthorizedException ex = assertThrows(NotAuthorizedException.class, () -> {
            controller.createUtente(nuovo);
        });
        assertTrue(ex.getMessage().startsWith("AUT.403"));
    }

    @Test
    public void testCreateUtente_AmmOrg_OrgDiversaDaSessione_Forbidden() {
        Organizzazione orgSessione = organizzazioniController.createOrganizzazione(
                CommonUtils.getOrganizzazioneCreate()).getBody();
        creaAmmOrgEAutentica("amm.org.create.altraorg", orgSessione);

        // Come gestore creo un'altra org per il test (mi devo prima ri-autenticare per crearla)
        // In realtà questa org la creiamo come AMM_ORG... ma AMM_ORG non può creare org. Quindi
        // cambiamo strategia: passiamo un id_organizzazione casuale (UUID inesistente).
        UtenteCreate nuovo = CommonUtils.getUtenteCreate();
        nuovo.setPrincipal("amm.org.create.altraorg.target");
        nuovo.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        UtenteOrganizzazioneCreate ass =
                new UtenteOrganizzazioneCreate();
        ass.setIdOrganizzazione(UUID.randomUUID()); // org diversa da quella di sessione
        ass.setRuoloOrganizzazione(
                RuoloOrganizzazioneEnum.OPERATORE_API);
        nuovo.setOrganizzazioni(List.of(ass));

        NotAuthorizedException ex = assertThrows(NotAuthorizedException.class, () -> {
            controller.createUtente(nuovo);
        });
        assertTrue(ex.getMessage().startsWith("AUT.403"));
    }

    @Test
    public void testCreateUtente_AmmOrg_NoOrganizzazioni_Forbidden() {
        Organizzazione org = organizzazioniController.createOrganizzazione(
                CommonUtils.getOrganizzazioneCreate()).getBody();
        creaAmmOrgEAutentica("amm.org.create.noorg", org);

        UtenteCreate nuovo = CommonUtils.getUtenteCreate();
        nuovo.setPrincipal("amm.org.create.noorg.target");
        nuovo.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        // organizzazioni non impostato

        NotAuthorizedException ex = assertThrows(NotAuthorizedException.class, () -> {
            controller.createUtente(nuovo);
        });
        assertTrue(ex.getMessage().startsWith("AUT.403"));
    }

    @Test
    public void testCreateUtente_OperatoreApi_Forbidden() {
        // Un OPERATORE_API (non AMM_ORG) non può creare utenti
        Organizzazione org = organizzazioniController.createOrganizzazione(
                CommonUtils.getOrganizzazioneCreate()).getBody();

        UtenteCreate operCreate = CommonUtils.getUtenteCreate();
        operCreate.setPrincipal("oper.create.attempt");
        operCreate.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        UtenteOrganizzazioneCreate ass =
                new UtenteOrganizzazioneCreate();
        ass.setIdOrganizzazione(org.getIdOrganizzazione());
        ass.setRuoloOrganizzazione(
                RuoloOrganizzazioneEnum.OPERATORE_API);
        operCreate.setOrganizzazioni(List.of(ass));
        controller.createUtente(operCreate);

        CommonUtils.getSessionUtente("oper.create.attempt", securityContext, authentication, utenteService);
        simulaContestoOrganizzazione(org, RuoloOrganizzazione.OPERATORE_API);

        UtenteCreate nuovo = CommonUtils.getUtenteCreate();
        nuovo.setPrincipal("oper.create.target");
        nuovo.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        UtenteOrganizzazioneCreate ass2 =
                new UtenteOrganizzazioneCreate();
        ass2.setIdOrganizzazione(org.getIdOrganizzazione());
        ass2.setRuoloOrganizzazione(
                RuoloOrganizzazioneEnum.OPERATORE_API);
        nuovo.setOrganizzazioni(List.of(ass2));

        NotAuthorizedException ex = assertThrows(NotAuthorizedException.class, () -> {
            controller.createUtente(nuovo);
        });
        assertTrue(ex.getMessage().startsWith("AUT.403"));

        resetContestoOrganizzazione();
    }

    // ============================================================
    // Test endpoint GET /aziende-esterne (lookup) e behavior
    // find-or-create dell'assembler sul campo azienda_esterna.
    // ============================================================

    private UtenteCreate utenteCreateConPrincipal(String principal) {
        UtenteCreate u = CommonUtils.getUtenteCreate();
        u.setPrincipal(principal);
        return u;
    }

    @Test
    public void testListAziendeEsterneVuotaSenzaUtenti() {
        ResponseEntity<List<String>> response = controller.listAziendeEsterne(null, 0, 25, null);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty(), "Nessun utente con azienda esterna inserita: lista attesa vuota");
    }

    @Test
    public void testListAziendeEsterneDopoCreazioneUtente() {
        UtenteCreate u = utenteCreateConPrincipal("utente.azienda.1");
        u.setAziendaEsterna("ACME Inc.");
        ResponseEntity<Utente> created = controller.createUtente(u);
        assertEquals(HttpStatus.OK, created.getStatusCode());
        assertEquals("ACME Inc.", created.getBody().getAziendaEsterna());

        ResponseEntity<List<String>> response = controller.listAziendeEsterne(null, 0, 25, null);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals("ACME Inc.", response.getBody().get(0));
    }

    @Test
    public void testListAziendeEsterneNonDuplicaQuandoStessoNome() {
        UtenteCreate u1 = utenteCreateConPrincipal("utente.dup.1");
        u1.setAziendaEsterna("Stessa Azienda SRL");
        controller.createUtente(u1);

        UtenteCreate u2 = utenteCreateConPrincipal("utente.dup.2");
        u2.setAziendaEsterna("Stessa Azienda SRL");
        controller.createUtente(u2);

        ResponseEntity<List<String>> response = controller.listAziendeEsterne(null, 0, 25, null);
        assertEquals(1, response.getBody().size(), "Due utenti con la stessa azienda devono produrre una sola riga");
        assertEquals("Stessa Azienda SRL", response.getBody().get(0));
    }

    @Test
    public void testListAziendeEsterneFiltroQ() {
        UtenteCreate u1 = utenteCreateConPrincipal("utente.q.1");
        u1.setAziendaEsterna("Acme Corporation");
        controller.createUtente(u1);

        UtenteCreate u2 = utenteCreateConPrincipal("utente.q.2");
        u2.setAziendaEsterna("Globex Industries");
        controller.createUtente(u2);

        UtenteCreate u3 = utenteCreateConPrincipal("utente.q.3");
        u3.setAziendaEsterna("Initech");
        controller.createUtente(u3);

        ResponseEntity<List<String>> response = controller.listAziendeEsterne("acm", 0, 25, null);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals("Acme Corporation", response.getBody().get(0));
    }

    @Test
    public void testListAziendeEsterneFiltroQNoMatch() {
        UtenteCreate u1 = utenteCreateConPrincipal("utente.nomatch");
        u1.setAziendaEsterna("Foo Bar SRL");
        controller.createUtente(u1);

        ResponseEntity<List<String>> response = controller.listAziendeEsterne("inesistente", 0, 25, null);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    public void testListAziendeEsternePaginazione() {
        for (int i = 0; i < 5; i++) {
            UtenteCreate u = utenteCreateConPrincipal("utente.page." + i);
            u.setAziendaEsterna("Azienda " + i);
            controller.createUtente(u);
        }

        ResponseEntity<List<String>> page0 = controller.listAziendeEsterne(null, 0, 2, null);
        assertEquals(2, page0.getBody().size());

        ResponseEntity<List<String>> page1 = controller.listAziendeEsterne(null, 1, 2, null);
        assertEquals(2, page1.getBody().size());

        ResponseEntity<List<String>> page2 = controller.listAziendeEsterne(null, 2, 2, null);
        assertEquals(1, page2.getBody().size());

        assertFalse(page0.getBody().stream().anyMatch(page1.getBody()::contains));
        assertFalse(page1.getBody().stream().anyMatch(page2.getBody()::contains));
    }

    @Test
    public void testCreateUtenteAziendaEsternaConSpaziVieneNormalizzata() {
        UtenteCreate u = utenteCreateConPrincipal("utente.trim");
        u.setAziendaEsterna("  Trim Test SRL  ");
        ResponseEntity<Utente> created = controller.createUtente(u);
        assertEquals("Trim Test SRL", created.getBody().getAziendaEsterna(),
                "Il nome dell'azienda esterna deve essere salvato senza spazi iniziali/finali");

        ResponseEntity<List<String>> list = controller.listAziendeEsterne(null, 0, 25, null);
        assertEquals(1, list.getBody().size());
        assertEquals("Trim Test SRL", list.getBody().get(0));
    }

    @Test
    public void testUpdateUtenteImpostaAziendaEsterna() {
        UtenteCreate u = utenteCreateConPrincipal("utente.update.azienda");
        ResponseEntity<Utente> created = controller.createUtente(u);
        UUID idUtente = created.getBody().getIdUtente();
        assertNull(created.getBody().getAziendaEsterna(), "Nessuna azienda iniziale");

        UtenteUpdate update = new UtenteUpdate();
        update.setStato(CommonUtils.STATO_UTENTE);
        update.setNome(CommonUtils.NOME_UTENTE);
        update.setCognome(CommonUtils.COGNOME_UTENTE);
        update.setEmail(CommonUtils.EMAIL_UTENTE);
        update.setEmailAziendale(CommonUtils.EMAIL_AZIENDALE);
        update.setTelefonoAziendale(CommonUtils.TELEFONO_AZIENDALE);
        update.setPrincipal("utente.update.azienda");
        update.setAziendaEsterna("Nuova Azienda SRL");

        ResponseEntity<Utente> updated = controller.updateUtente(idUtente, update);
        assertEquals("Nuova Azienda SRL", updated.getBody().getAziendaEsterna());

        ResponseEntity<List<String>> list = controller.listAziendeEsterne(null, 0, 25, null);
        assertEquals(1, list.getBody().size());
        assertEquals("Nuova Azienda SRL", list.getBody().get(0));
    }

    @Test
    public void testUpdateUtenteRimuoveAziendaEsterna() {
        UtenteCreate u = utenteCreateConPrincipal("utente.clear.azienda");
        u.setAziendaEsterna("Da Rimuovere SRL");
        ResponseEntity<Utente> created = controller.createUtente(u);
        UUID idUtente = created.getBody().getIdUtente();
        assertEquals("Da Rimuovere SRL", created.getBody().getAziendaEsterna());

        UtenteUpdate update = new UtenteUpdate();
        update.setStato(CommonUtils.STATO_UTENTE);
        update.setNome(CommonUtils.NOME_UTENTE);
        update.setCognome(CommonUtils.COGNOME_UTENTE);
        update.setEmail(CommonUtils.EMAIL_UTENTE);
        update.setEmailAziendale(CommonUtils.EMAIL_AZIENDALE);
        update.setTelefonoAziendale(CommonUtils.TELEFONO_AZIENDALE);
        update.setPrincipal("utente.clear.azienda");
        update.setAziendaEsterna(null);

        ResponseEntity<Utente> updated = controller.updateUtente(idUtente, update);
        assertNull(updated.getBody().getAziendaEsterna(), "Passando null l'associazione deve essere rimossa");

        // L'entità dell'azienda esterna resta in lookup table per altri eventuali utenti
        ResponseEntity<List<String>> list = controller.listAziendeEsterne(null, 0, 25, null);
        assertEquals(1, list.getBody().size());
        assertEquals("Da Rimuovere SRL", list.getBody().get(0));
    }

    // =========================================================================
    // Test approvazione richiesta cambio organizzazione (multi-org)
    // =========================================================================

    private Organizzazione creaOrgConNomeMultiOrg(String nome) {
        var oc = CommonUtils.getOrganizzazioneCreate();
        oc.setNome(nome);
        oc.setCodiceEnte(nome);
        oc.setCodiceFiscaleSoggetto(nome);
        return organizzazioniController.createOrganizzazione(oc).getBody();
    }

    private Utente creaUtenteAssociatoA(String principal, List<UUID> idOrgs, RuoloOrganizzazioneEnum ruolo) {
        UtenteCreate uc = CommonUtils.getUtenteCreate();
        uc.setPrincipal(principal);
        uc.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        uc.setStato(StatoUtenteEnum.ABILITATO);
        List<UtenteOrganizzazioneCreate> assoc = new java.util.ArrayList<>();
        for (UUID id : idOrgs) {
            UtenteOrganizzazioneCreate a = new UtenteOrganizzazioneCreate();
            a.setIdOrganizzazione(id);
            a.setRuoloOrganizzazione(ruolo);
            assoc.add(a);
        }
        uc.setOrganizzazioni(assoc);
        return controller.createUtente(uc).getBody();
    }

    private void autenticaPrincipal(String principal) {
        InfoProfilo info = new InfoProfilo(principal,
                this.utenteService.findByPrincipal(principal).get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(info);
    }

    private void setOrgContextSu(UUID idOrgUuid, RuoloOrganizzazione ruolo) {
        Long idLong = organizzazioneService.find(idOrgUuid).get().getId();
        organizationContext.setIdOrganizzazione(idLong);
        organizationContext.setRuoloOrganizzazione(ruolo);
        organizationContext.setInitialized(true);
    }

    private UtenteUpdate buildApprovazioneUpdate(Utente utenteAttuale, UUID idOrgPending, RuoloOrganizzazioneEnum ruoloAssegnato) {
        UtenteUpdate uu = new UtenteUpdate();
        uu.setPrincipal(utenteAttuale.getPrincipal());
        uu.setNome(utenteAttuale.getNome());
        uu.setCognome(utenteAttuale.getCognome());
        uu.setEmail(utenteAttuale.getEmail());
        uu.setEmailAziendale(utenteAttuale.getEmailAziendale());
        uu.setTelefonoAziendale(utenteAttuale.getTelefonoAziendale());
        uu.setStato(StatoUtenteEnum.ABILITATO);
        uu.setRuolo(utenteAttuale.getRuolo());
        UtenteOrganizzazioneCreate uoc = new UtenteOrganizzazioneCreate();
        uoc.setIdOrganizzazione(idOrgPending);
        uoc.setRuoloOrganizzazione(ruoloAssegnato);
        uu.setOrganizzazioni(List.of(uoc));
        return uu;
    }

    @Test
    public void testUpdateProfiloOrganization_OrgPartenzaSameAsTarget_BadRequest() {
        Organizzazione org1 = creaOrgConNomeMultiOrg("ucp-same");
        Utente utente = creaUtenteAssociatoA("ucp.same", List.of(org1.getIdOrganizzazione()),
                RuoloOrganizzazioneEnum.OPERATORE_API);
        autenticaPrincipal(utente.getPrincipal());

        ProfiloOrganizationUpdate req = new ProfiloOrganizationUpdate();
        req.setIdOrganizzazione(org1.getIdOrganizzazione());
        req.setIdOrganizzazionePartenza(org1.getIdOrganizzazione());

        var ex = assertThrows(org.govway.catalogo.exception.BadRequestException.class,
                () -> controller.updateProfiloOrganization(req));
        assertEquals("UT.400.ORG.PARTENZA.SAME.AS.TARGET", ex.getMessage());
    }

    @Test
    public void testUpdateProfiloOrganization_OrgPartenzaNotAssociated_BadRequest() {
        Organizzazione org1 = creaOrgConNomeMultiOrg("ucp-no-assoc-1");
        Organizzazione org2 = creaOrgConNomeMultiOrg("ucp-no-assoc-2");
        Organizzazione orgEstranea = creaOrgConNomeMultiOrg("ucp-no-assoc-estranea");
        Utente utente = creaUtenteAssociatoA("ucp.noassoc", List.of(org1.getIdOrganizzazione()),
                RuoloOrganizzazioneEnum.OPERATORE_API);
        autenticaPrincipal(utente.getPrincipal());

        ProfiloOrganizationUpdate req = new ProfiloOrganizationUpdate();
        req.setIdOrganizzazione(org2.getIdOrganizzazione());
        req.setIdOrganizzazionePartenza(orgEstranea.getIdOrganizzazione()); // non associata all'utente

        var ex = assertThrows(org.govway.catalogo.exception.BadRequestException.class,
                () -> controller.updateProfiloOrganization(req));
        assertEquals("UT.400.ORG.PARTENZA.NOT.ASSOCIATED", ex.getMessage());
    }

    @Test
    public void testUpdateProfiloOrganization_TargetGiaAssociata_BadRequest() {
        Organizzazione orgX = creaOrgConNomeMultiOrg("ucp-already-x");
        Organizzazione orgY = creaOrgConNomeMultiOrg("ucp-already-y");
        Utente utente = creaUtenteAssociatoA("ucp.already",
                List.of(orgX.getIdOrganizzazione(), orgY.getIdOrganizzazione()),
                RuoloOrganizzazioneEnum.OPERATORE_API);
        autenticaPrincipal(utente.getPrincipal());

        ProfiloOrganizationUpdate req = new ProfiloOrganizationUpdate();
        req.setIdOrganizzazione(orgY.getIdOrganizzazione()); // già associato a Y
        req.setIdOrganizzazionePartenza(orgX.getIdOrganizzazione());

        var ex = assertThrows(org.govway.catalogo.exception.BadRequestException.class,
                () -> controller.updateProfiloOrganization(req));
        assertEquals("UT.400.ORG.PENDING.ALREADY.ASSOCIATED", ex.getMessage());
    }

    @Test
    public void testUpdateProfiloOrganization_UtenteSenzaAssociazioni_OK() {
        Organizzazione org = creaOrgConNomeMultiOrg("ucp-noassoc-target");
        Utente utente = creaUtenteAssociatoA("ucp.noassoc.user", List.of(),
                RuoloOrganizzazioneEnum.OPERATORE_API);
        autenticaPrincipal(utente.getPrincipal());

        ProfiloOrganizationUpdate req = new ProfiloOrganizationUpdate();
        req.setIdOrganizzazione(org.getIdOrganizzazione()); // niente partenza, è permesso

        ResponseEntity<Utente> resp = controller.updateProfiloOrganization(req);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(StatoUtenteEnum.PENDING_UPDATE, resp.getBody().getStato());
        assertNotNull(resp.getBody().getOrganizzazionePending());
        assertNull(resp.getBody().getOrganizzazionePartenza());
    }

    @Test
    public void testApprovazione_DaGestore_SwapAssociazioneSingleOrg() {
        Organizzazione orgX = creaOrgConNomeMultiOrg("appr-gest-x");
        Organizzazione orgY = creaOrgConNomeMultiOrg("appr-gest-y");
        Utente utente = creaUtenteAssociatoA("appr.gest.single",
                List.of(orgX.getIdOrganizzazione()),
                RuoloOrganizzazioneEnum.OPERATORE_API);
        UUID idUtenteOriginale = utente.getIdUtente();

        // Richiesta come utente
        autenticaPrincipal(utente.getPrincipal());
        ProfiloOrganizationUpdate req = new ProfiloOrganizationUpdate();
        req.setIdOrganizzazione(orgY.getIdOrganizzazione());
        req.setIdOrganizzazionePartenza(orgX.getIdOrganizzazione());
        controller.updateProfiloOrganization(req);

        // Approvazione come gestore con ruolo AMMINISTRATORE_ORGANIZZAZIONE su Y
        autenticaPrincipal(UTENTE_GESTORE);
        UtenteUpdate uu = buildApprovazioneUpdate(utente, orgY.getIdOrganizzazione(),
                RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
        ResponseEntity<Utente> resp = controller.updateUtente(utente.getIdUtente(), uu);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(StatoUtenteEnum.ABILITATO, resp.getBody().getStato());
        assertNull(resp.getBody().getOrganizzazionePending());
        assertNull(resp.getBody().getOrganizzazionePartenza());
        // Stesso idUtente: niente più archive+recreate
        assertEquals(idUtenteOriginale, resp.getBody().getIdUtente());
        assertEquals("appr.gest.single", resp.getBody().getPrincipal());
        // Una sola associazione, su Y, con il ruolo deciso
        assertEquals(1, resp.getBody().getOrganizzazioni().size());
        assertEquals(orgY.getIdOrganizzazione(),
                resp.getBody().getOrganizzazioni().get(0).getOrganizzazione().getIdOrganizzazione());
        assertEquals(RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE,
                resp.getBody().getOrganizzazioni().get(0).getRuoloOrganizzazione());
    }

    @Test
    public void testApprovazione_DaGestore_SwapMantenendoAltreAssociazioni() {
        Organizzazione orgA = creaOrgConNomeMultiOrg("appr-multi-a");
        Organizzazione orgB = creaOrgConNomeMultiOrg("appr-multi-b");
        Organizzazione orgC = creaOrgConNomeMultiOrg("appr-multi-c");
        Utente utente = creaUtenteAssociatoA("appr.multi",
                List.of(orgA.getIdOrganizzazione(), orgB.getIdOrganizzazione()),
                RuoloOrganizzazioneEnum.OPERATORE_API);

        autenticaPrincipal(utente.getPrincipal());
        ProfiloOrganizationUpdate req = new ProfiloOrganizationUpdate();
        req.setIdOrganizzazione(orgC.getIdOrganizzazione());
        req.setIdOrganizzazionePartenza(orgA.getIdOrganizzazione()); // sostituisce A con C, mantiene B
        controller.updateProfiloOrganization(req);

        autenticaPrincipal(UTENTE_GESTORE);
        UtenteUpdate uu = buildApprovazioneUpdate(utente, orgC.getIdOrganizzazione(),
                RuoloOrganizzazioneEnum.OPERATORE_API);
        ResponseEntity<Utente> resp = controller.updateUtente(utente.getIdUtente(), uu);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(StatoUtenteEnum.ABILITATO, resp.getBody().getStato());
        // Deve avere B e C, non più A
        assertEquals(2, resp.getBody().getOrganizzazioni().size());
        boolean hasB = resp.getBody().getOrganizzazioni().stream().anyMatch(uo ->
                orgB.getIdOrganizzazione().equals(uo.getOrganizzazione().getIdOrganizzazione()));
        boolean hasC = resp.getBody().getOrganizzazioni().stream().anyMatch(uo ->
                orgC.getIdOrganizzazione().equals(uo.getOrganizzazione().getIdOrganizzazione()));
        boolean hasA = resp.getBody().getOrganizzazioni().stream().anyMatch(uo ->
                orgA.getIdOrganizzazione().equals(uo.getOrganizzazione().getIdOrganizzazione()));
        assertTrue(hasB, "Associazione B deve essere mantenuta");
        assertTrue(hasC, "Associazione C deve essere aggiunta");
        assertFalse(hasA, "Associazione A deve essere rimossa");
    }

    @Test
    public void testApprovazione_DaAmmOrgTarget_OK() {
        Organizzazione orgX = creaOrgConNomeMultiOrg("appr-amm-x");
        Organizzazione orgY = creaOrgConNomeMultiOrg("appr-amm-y");

        // Utente richiedente, OPERATORE_API su X
        Utente utente = creaUtenteAssociatoA("appr.amm.user",
                List.of(orgX.getIdOrganizzazione()),
                RuoloOrganizzazioneEnum.OPERATORE_API);

        // AMM_ORG di Y (creato come gestore)
        creaUtenteAssociatoA("appr.amm.target",
                List.of(orgY.getIdOrganizzazione()),
                RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);

        // Richiesta come utente
        autenticaPrincipal(utente.getPrincipal());
        ProfiloOrganizationUpdate req = new ProfiloOrganizationUpdate();
        req.setIdOrganizzazione(orgY.getIdOrganizzazione());
        req.setIdOrganizzazionePartenza(orgX.getIdOrganizzazione());
        controller.updateProfiloOrganization(req);

        // Approvazione come AMM_ORG di Y
        autenticaPrincipal("appr.amm.target");
        setOrgContextSu(orgY.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        UtenteUpdate uu = buildApprovazioneUpdate(utente, orgY.getIdOrganizzazione(),
                RuoloOrganizzazioneEnum.OPERATORE_API);
        ResponseEntity<Utente> resp = controller.updateUtente(utente.getIdUtente(), uu);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(StatoUtenteEnum.ABILITATO, resp.getBody().getStato());
        assertEquals(1, resp.getBody().getOrganizzazioni().size());
        assertEquals(orgY.getIdOrganizzazione(),
                resp.getBody().getOrganizzazioni().get(0).getOrganizzazione().getIdOrganizzazione());
    }

    @Test
    public void testApprovazione_DaAmmOrgAltraOrg_Forbidden() {
        Organizzazione orgX = creaOrgConNomeMultiOrg("appr-altra-x");
        Organizzazione orgY = creaOrgConNomeMultiOrg("appr-altra-y");
        Organizzazione orgZ = creaOrgConNomeMultiOrg("appr-altra-z");

        Utente utente = creaUtenteAssociatoA("appr.altra.user",
                List.of(orgX.getIdOrganizzazione()),
                RuoloOrganizzazioneEnum.OPERATORE_API);

        // AMM_ORG di Z (NON il target)
        creaUtenteAssociatoA("appr.altra.amm",
                List.of(orgZ.getIdOrganizzazione()),
                RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);

        autenticaPrincipal(utente.getPrincipal());
        ProfiloOrganizationUpdate req = new ProfiloOrganizationUpdate();
        req.setIdOrganizzazione(orgY.getIdOrganizzazione());
        req.setIdOrganizzazionePartenza(orgX.getIdOrganizzazione());
        controller.updateProfiloOrganization(req);

        autenticaPrincipal("appr.altra.amm");
        setOrgContextSu(orgZ.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        UtenteUpdate uu = buildApprovazioneUpdate(utente, orgY.getIdOrganizzazione(),
                RuoloOrganizzazioneEnum.OPERATORE_API);
        var ex = assertThrows(NotAuthorizedException.class,
                () -> controller.updateUtente(utente.getIdUtente(), uu));
        assertEquals("AUT.403.AMM.ORG.NOT.TARGET", ex.getMessage());
    }

    @Test
    public void testApprovazione_AmmOrgSuUtenteNonPending_Forbidden() {
        Organizzazione orgY = creaOrgConNomeMultiOrg("appr-nopend-y");

        Utente utente = creaUtenteAssociatoA("appr.nopend.user", List.of(),
                RuoloOrganizzazioneEnum.OPERATORE_API);
        // utente NON è in PENDING_UPDATE

        creaUtenteAssociatoA("appr.nopend.amm",
                List.of(orgY.getIdOrganizzazione()),
                RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);

        autenticaPrincipal("appr.nopend.amm");
        setOrgContextSu(orgY.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        UtenteUpdate uu = buildApprovazioneUpdate(utente, orgY.getIdOrganizzazione(),
                RuoloOrganizzazioneEnum.OPERATORE_API);
        var ex = assertThrows(NotAuthorizedException.class,
                () -> controller.updateUtente(utente.getIdUtente(), uu));
        assertEquals("AUT.403.AMM.ORG.NOT.TARGET", ex.getMessage());
    }

    @Test
    public void testListUtentiDashboard_AmmOrg_FiltraOrgPending() {
        Organizzazione orgX = creaOrgConNomeMultiOrg("dash-x");
        Organizzazione orgY = creaOrgConNomeMultiOrg("dash-y");
        Organizzazione orgZ = creaOrgConNomeMultiOrg("dash-z");

        // Tre utenti: utenteA richiede passaggio a Y, utenteB richiede passaggio a Z, utenteC abilitato
        Utente utenteA = creaUtenteAssociatoA("dash.user.a",
                List.of(orgX.getIdOrganizzazione()), RuoloOrganizzazioneEnum.OPERATORE_API);
        Utente utenteB = creaUtenteAssociatoA("dash.user.b",
                List.of(orgX.getIdOrganizzazione()), RuoloOrganizzazioneEnum.OPERATORE_API);
        creaUtenteAssociatoA("dash.user.c",
                List.of(orgY.getIdOrganizzazione()), RuoloOrganizzazioneEnum.OPERATORE_API);

        autenticaPrincipal(utenteA.getPrincipal());
        ProfiloOrganizationUpdate reqA = new ProfiloOrganizationUpdate();
        reqA.setIdOrganizzazione(orgY.getIdOrganizzazione());
        reqA.setIdOrganizzazionePartenza(orgX.getIdOrganizzazione());
        controller.updateProfiloOrganization(reqA);

        autenticaPrincipal(utenteB.getPrincipal());
        ProfiloOrganizationUpdate reqB = new ProfiloOrganizationUpdate();
        reqB.setIdOrganizzazione(orgZ.getIdOrganizzazione());
        reqB.setIdOrganizzazionePartenza(orgX.getIdOrganizzazione());
        controller.updateProfiloOrganization(reqB);

        // Crea AMM_ORG di Y come gestore (createUtente richiede gestore)
        autenticaPrincipal(UTENTE_GESTORE);
        creaUtenteAssociatoA("dash.amm.y",
                List.of(orgY.getIdOrganizzazione()),
                RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
        autenticaPrincipal("dash.amm.y");
        setOrgContextSu(orgY.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        ResponseEntity<?> respList = controller.listUtenti(null, null, null, null, null, null, null, true, null, 0, 50, null);
        assertEquals(HttpStatus.OK, respList.getStatusCode());
        org.govway.catalogo.servlets.model.PagedModelItemUtente body =
                (org.govway.catalogo.servlets.model.PagedModelItemUtente) respList.getBody();
        boolean hasA = body.getContent().stream().anyMatch(u -> "dash.user.a".equals(u.getPrincipal()));
        boolean hasB = body.getContent().stream().anyMatch(u -> "dash.user.b".equals(u.getPrincipal()));
        boolean hasC = body.getContent().stream().anyMatch(u -> "dash.user.c".equals(u.getPrincipal()));
        assertTrue(hasA, "AMM_ORG di Y deve vedere utenteA (pending verso Y)");
        assertFalse(hasB, "AMM_ORG di Y NON deve vedere utenteB (pending verso Z)");
        assertFalse(hasC, "AMM_ORG di Y NON deve vedere utenteC (abilitato non pending)");
    }
}

