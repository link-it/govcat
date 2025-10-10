package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.codec.binary.Base64;
import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.API;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.AuthTypeApiResourceProprietaCustom;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.RuoloAPIEnum;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.StatoUpdate;
import org.govway.catalogo.servlets.model.StatoUtenteEnum;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteUpdate;
import org.govway.catalogo.servlets.model.VisibilitaDominioEnum;
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

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class WorkflowServiziTest {
	private static final String UTENTE_QUALSIASI = "utente_qualsiasi";
	private static final String UTENTE_RICHIEDENTE_SERVIZIO = "utente_richiedente_servizio";
	private static final String UTENTE_REFERENTE_SERVIZIO = "utente_referente__servizio";
	private static final String UTENTE_REFERENTE_TECNICO_SERVIZIO = "utente_referente_tecnico__servizio";
	private static final String UTENTE_REFERENTE_DOMINIO = "utente_referente__dominio";
	private static final String UTENTE_REFERENTE_TECNICO_DOMINIO = "utente_referente_tecnico__dominio";
    private static final String UTENTE_GESTORE = "gestore";
    
    private static UUID ID_UTENTE_QUALSIASI;
	private static UUID ID_UTENTE_RICHIEDENTE_SERVIZIO;
	private static UUID ID_UTENTE_REFERENTE_SERVIZIO;
	private static UUID ID_UTENTE_REFERENTE_TECNICO_SERVIZIO;
	private static UUID ID_UTENTE_REFERENTE_DOMINIO;
	private static UUID ID_UTENTE_REFERENTE_TECNICO_DOMINIO;
    private static UUID ID_UTENTE_GESTORE;
    
    private static final String NOME_GRUPPO = "Gruppo xyz";
    
    private InfoProfilo info;
    
    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Autowired
    private UtenteService utenteService;
    
    @Autowired
    private ServiziController serviziController;

    @Autowired
    private GruppiController gruppiController;

    @Autowired
    private APIController apiController;

    @Autowired
    private OrganizzazioniController organizzazioniController;

    @Autowired
    private SoggettiController soggettiController;

    @Autowired
    private DominiController dominiController;
    
    @Autowired
    private UtentiController utentiController;
    
    @Autowired
    private AdesioniController adesioniController;

    @PersistenceContext
    private EntityManager entityManager;

    private UUID idServizio;
    private UUID idOrganizzazione;
    
    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);  // Inizializza i mock con JUnit 5
        SecurityContextHolder.setContext(securityContext);
        
        info = CommonUtils.getInfoProfilo(UTENTE_GESTORE, utenteService);
        ID_UTENTE_GESTORE = UUID.fromString(info.utente.getIdUtente());
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }
    
    @Test
    public void daStatoBozzaAStatoRichiestoInCollaudo() {
    	
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
    	StatoUpdate statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("richiesto_collaudo");
	    statoServizioUpdate.setCommento("richiesta di collaudo");
	    ResponseEntity<Servizio> servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("richiesto_collaudo", servizioUpdated.getBody().getStato());
    	
    	statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("bozza");
	    statoServizioUpdate.setCommento("bozza");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("bozza", servizioUpdated.getBody().getStato());
    	
    	CommonUtils.getSessionUtente(UTENTE_RICHIEDENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("richiesto_collaudo");
	    statoServizioUpdate.setCommento("richiesta di collaudo");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    
	    assertEquals("richiesto_collaudo", servizioUpdated.getBody().getStato());
	    
	    statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("bozza");
	    statoServizioUpdate.setCommento("bozza");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    
	    assertEquals("bozza", servizioUpdated.getBody().getStato());
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
        
        statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("richiesto_collaudo");
	    statoServizioUpdate.setCommento("richiesta di collaudo");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    
	    assertEquals("richiesto_collaudo", servizioUpdated.getBody().getStato());
	    
	    statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("bozza");
	    statoServizioUpdate.setCommento("bozza");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    
	    assertEquals("bozza", servizioUpdated.getBody().getStato());
    	
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("richiesto_collaudo");
	    statoServizioUpdate.setCommento("richiesta di collaudo");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    
	    assertEquals("richiesto_collaudo", servizioUpdated.getBody().getStato());
	    
	    statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("bozza");
	    statoServizioUpdate.setCommento("bozza");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    
	    assertEquals("bozza", servizioUpdated.getBody().getStato());
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("richiesto_collaudo");
		    statoServizioUpdaten.setCommento("richiesta di collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("richiesto_collaudo");
		    statoServizioUpdaten.setCommento("richiesta di collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
        
        CommonUtils.getSessionUtente(UTENTE_QUALSIASI, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("richiesto_collaudo");
		    statoServizioUpdaten.setCommento("richiesta di collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");

    	/*
	    statoServizioUpdate.setStato("autorizzato_collaudo");
	    statoServizioUpdate.setCommento("autorizzato collaudo");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    statoServizioUpdate.setStato("in_configurazione_collaudo");
	    statoServizioUpdate.setCommento("in configurazione collaudo");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    statoServizioUpdate.setStato("pubblicato_collaudo");
	    statoServizioUpdate.setCommento("pubblicato in collaudo");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);

		statoServizioUpdate.setStato("richiesto_produzione");
	    statoServizioUpdate.setCommento("richiesto in produzione");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);	    
	    statoServizioUpdate.setStato("autorizzato_produzione");
	    statoServizioUpdate.setCommento("autorizzato in produzione");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
		statoServizioUpdate.setStato("in_configurazione_produzione");
	    statoServizioUpdate.setCommento("in configurazione in produzione");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
		statoServizioUpdate.setStato("pubblicato_produzione");
	    statoServizioUpdate.setCommento("pubblicato in produzione");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    */
    }
    
    @Test
    public void daStatoBozzaAStatoInConfigurazioneInCollaudoUtenteCoordinatore() {
    	Dominio dominio = this.getDominio(null);
    	
    	String utenteCoordinatore = "utente_coordinatore";
    	
    	UtenteCreate utente = CommonUtils.getUtenteCreate();
    	utente.setRuolo(RuoloUtenteEnum.COORDINATORE);
    	utente.setPrincipal(utenteCoordinatore);
        utente.setIdOrganizzazione(idOrganizzazione);
        utente.setStato(StatoUtenteEnum.ABILITATO);

        ResponseEntity<Utente> utenteC = utentiController.createUtente(utente);
        
        ReferenteCreate ref = new ReferenteCreate();
        ref.setIdUtente(utenteC.getBody().getIdUtente());
        ref.setTipo(TipoReferenteEnum.REFERENTE);
        dominiController.createReferenteDominio(dominio.getIdDominio(), ref);

    	Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	ReferenteCreate referente = new ReferenteCreate();
        referente.setTipo(TipoReferenteEnum.REFERENTE);
        referente.setIdUtente(utenteC.getBody().getIdUtente());
    	
    	serviziController.createReferenteServizio(servizio.getIdServizio(), null, referente);
    	
    	this.getAPI();
    	//System.out.println(servizio.getIdServizio());

    	CommonUtils.getSessionUtente(utenteCoordinatore, securityContext, authentication, utenteService);
    	
    	StatoUpdate statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("richiesto_collaudo");
	    statoServizioUpdate.setCommento("richiesta di collaudo");
	    ResponseEntity<Servizio> servizioUpdated = serviziController.updateStatoServizio(servizio.getIdServizio(), statoServizioUpdate, null);
    	
    	assertEquals("richiesto_collaudo", servizioUpdated.getBody().getStato());
    	
    	CommonUtils.getSessionUtente(utenteCoordinatore, securityContext, authentication, utenteService);

    	statoServizioUpdate = new StatoUpdate();
    	statoServizioUpdate.setStato("autorizzato_collaudo");
    	statoServizioUpdate.setCommento("autorizzato collaudo");
    	servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);

    	CommonUtils.getSessionUtente(utenteCoordinatore, securityContext, authentication, utenteService);

    	assertThrows(NotAuthorizedException.class, ()->{
    		StatoUpdate statoServizioUpdaten = new StatoUpdate();
    		statoServizioUpdaten.setStato("in_configurazione_collaudo");
    		statoServizioUpdaten.setCommento("in configurazione collaudo");
    		serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
    	}, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    }
    
    @Test
    public void daStatoRichiestoInCollaudoAAutorizzatoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//imposto lo stato di partenza a Richiesto In Collaudo
    	this.cambioStatoFinoA("richiesto_collaudo");
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
    	StatoUpdate statoServizioUpdate = new StatoUpdate();
    	statoServizioUpdate.setStato("autorizzato_collaudo");
	    statoServizioUpdate.setCommento("autorizzato collaudo");
	    ResponseEntity<Servizio> servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("autorizzato_collaudo", servizioUpdated.getBody().getStato());
    	
    	statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("richiesto_collaudo");
	    statoServizioUpdate.setCommento("richiesta di collaudo");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("richiesto_collaudo", servizioUpdated.getBody().getStato());
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
        
        statoServizioUpdate = new StatoUpdate();
    	statoServizioUpdate.setStato("autorizzato_collaudo");
	    statoServizioUpdate.setCommento("autorizzato collaudo");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("autorizzato_collaudo", servizioUpdated.getBody().getStato());
    	
    	statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("richiesto_collaudo");
	    statoServizioUpdate.setCommento("richiesta di collaudo");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("richiesto_collaudo", servizioUpdated.getBody().getStato());
    	
    	CommonUtils.getSessionUtente(UTENTE_RICHIEDENTE_SERVIZIO, securityContext, authentication, utenteService);

	    assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("autorizzato_collaudo");
		    statoServizioUpdaten.setCommento("autorizzato collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
	    
	    
	    /*
	    UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setRuolo(RuoloUtenteEnum.COORDINATORE);
        
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);
        
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);
	    
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("autorizzato_collaudo");
		    statoServizioUpdaten.setCommento("autorizzato collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
        */
        
        
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);

	    assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("autorizzato_collaudo");
		    statoServizioUpdaten.setCommento("autorizzato collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("autorizzato_collaudo");
		    statoServizioUpdaten.setCommento("autorizzato collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("autorizzato_collaudo");
		    statoServizioUpdaten.setCommento("autorizzato collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
        
        CommonUtils.getSessionUtente(UTENTE_QUALSIASI, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("autorizzato_collaudo");
		    statoServizioUpdaten.setCommento("autorizzato collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    }
    
    @Test
    public void daStatoAutorizzatoInCollaudoAInConfigurazioneInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//imposto lo stato di partenza
    	this.cambioStatoFinoA("autorizzato_collaudo");
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
    	StatoUpdate statoServizioUpdate = new StatoUpdate();
    	statoServizioUpdate.setStato("in_configurazione_collaudo");
	    statoServizioUpdate.setCommento("in configurazione collaudo");
	    ResponseEntity<Servizio> servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("in_configurazione_collaudo", servizioUpdated.getBody().getStato());
    	
    	statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("autorizzato_collaudo");
	    statoServizioUpdate.setCommento("autorizzato collaudo");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("autorizzato_collaudo", servizioUpdated.getBody().getStato());
    	
    	CommonUtils.getSessionUtente(UTENTE_RICHIEDENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("in_configurazione_collaudo");
		    statoServizioUpdaten.setCommento("in configurazione collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("in_configurazione_collaudo");
		    statoServizioUpdaten.setCommento("in configurazione collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);

	    assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("in_configurazione_collaudo");
		    statoServizioUpdaten.setCommento("in configurazione collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("in_configurazione_collaudo");
		    statoServizioUpdaten.setCommento("in configurazione collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("in_configurazione_collaudo");
		    statoServizioUpdaten.setCommento("in configurazione collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
        
        CommonUtils.getSessionUtente(UTENTE_QUALSIASI, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("in_configurazione_collaudo");
		    statoServizioUpdaten.setCommento("in configurazione collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    }
    
    @Test
    public void daStatoInConfigurazioneInCollaudoAPubblicatoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//imposto lo stato di partenza
    	this.cambioStatoFinoA("in_configurazione_collaudo");
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
    	StatoUpdate statoServizioUpdate = new StatoUpdate();
    	statoServizioUpdate.setStato("pubblicato_collaudo");
	    statoServizioUpdate.setCommento("pubblicato in collaudo");
	    ResponseEntity<Servizio> servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("pubblicato_collaudo", servizioUpdated.getBody().getStato());
    	
    	statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("in_configurazione_collaudo");
	    statoServizioUpdate.setCommento("in configurazione collaudo");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("in_configurazione_collaudo", servizioUpdated.getBody().getStato());
    	
    	CommonUtils.getSessionUtente(UTENTE_RICHIEDENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("pubblicato_collaudo");
	    	statoServizioUpdaten.setCommento("pubblicato in collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("pubblicato_collaudo");
	    	statoServizioUpdaten.setCommento("pubblicato in collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);

	    assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("pubblicato_collaudo");
	    	statoServizioUpdaten.setCommento("pubblicato in collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("pubblicato_collaudo");
	    	statoServizioUpdaten.setCommento("pubblicato in collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("pubblicato_collaudo");
	    	statoServizioUpdaten.setCommento("pubblicato in collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
        
        CommonUtils.getSessionUtente(UTENTE_QUALSIASI, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("pubblicato_collaudo");
	    	statoServizioUpdaten.setCommento("pubblicato in collaudo");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    }
    
    @Test
    public void daStatoPubblicatoInCollaudoARichiestoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//imposto lo stato di partenza
    	this.cambioStatoFinoA("pubblicato_collaudo");
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
    	StatoUpdate statoServizioUpdate = new StatoUpdate();
    	statoServizioUpdate.setStato("richiesto_produzione");
	    statoServizioUpdate.setCommento("richiesto in produzione");
	    ResponseEntity<Servizio> servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
        entityManager.flush();
        entityManager.clear();
    	assertEquals("richiesto_produzione", servizioUpdated.getBody().getStato());
    	
    	statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("pubblicato_collaudo");
	    statoServizioUpdate.setCommento("pubblicato in collaudo");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
        entityManager.flush();
        entityManager.clear();
    	assertEquals("pubblicato_collaudo", servizioUpdated.getBody().getStato());
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
        
        statoServizioUpdate = new StatoUpdate();
    	statoServizioUpdate.setStato("richiesto_produzione");
	    statoServizioUpdate.setCommento("richiesto in produzione");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
        entityManager.flush();
        entityManager.clear();
    	assertEquals("richiesto_produzione", servizioUpdated.getBody().getStato());
    	
    	statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("pubblicato_collaudo");
	    statoServizioUpdate.setCommento("pubblicato in collaudo");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
        entityManager.flush();
        entityManager.clear();
	    assertEquals("pubblicato_collaudo", servizioUpdated.getBody().getStato());
    	
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);

        statoServizioUpdate = new StatoUpdate();
    	statoServizioUpdate.setStato("richiesto_produzione");
	    statoServizioUpdate.setCommento("richiesto in produzione");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
        entityManager.flush();
        entityManager.clear();
    	assertEquals("richiesto_produzione", servizioUpdated.getBody().getStato());
    	
    	statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("pubblicato_collaudo");
	    statoServizioUpdate.setCommento("pubblicato in collaudo");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
        entityManager.flush();
        entityManager.clear();
	    assertEquals("pubblicato_collaudo", servizioUpdated.getBody().getStato());
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("richiesto_produzione");
	    	statoServizioUpdaten.setCommento("richiesto in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
        entityManager.flush();
        entityManager.clear();
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("richiesto_produzione");
	    	statoServizioUpdaten.setCommento("richiesto in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
        entityManager.flush();
        entityManager.clear();
        
        CommonUtils.getSessionUtente(UTENTE_QUALSIASI, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("richiesto_produzione");
	    	statoServizioUpdaten.setCommento("richiesto in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
        entityManager.flush();
        entityManager.clear();
        CommonUtils.getSessionUtente(UTENTE_RICHIEDENTE_SERVIZIO, securityContext, authentication, utenteService);
        entityManager.flush();
        entityManager.clear();
        statoServizioUpdate = new StatoUpdate();
    	statoServizioUpdate.setStato("richiesto_produzione");
	    statoServizioUpdate.setCommento("richiesto in produzione");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
        entityManager.flush();
        entityManager.clear();
    	assertEquals("richiesto_produzione", servizioUpdated.getBody().getStato());
    	
    	statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("pubblicato_collaudo");
	    statoServizioUpdate.setCommento("pubblicato in collaudo");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
        entityManager.flush();
        entityManager.clear();
	    assertEquals("pubblicato_collaudo", servizioUpdated.getBody().getStato());

    }
    
    @Test
    public void daStatoRichiestoInProduzioneAAutorizzatoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//imposto lo stato di partenza
    	this.cambioStatoFinoA("richiesto_produzione");
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
    	StatoUpdate statoServizioUpdate = new StatoUpdate();
    	statoServizioUpdate.setStato("autorizzato_produzione");
	    statoServizioUpdate.setCommento("autorizzato in produzione");
	    ResponseEntity<Servizio> servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("autorizzato_produzione", servizioUpdated.getBody().getStato());
    	
    	statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("richiesto_produzione");
	    statoServizioUpdate.setCommento("richiesto in produzione");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("richiesto_produzione", servizioUpdated.getBody().getStato());
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
        
        statoServizioUpdate = new StatoUpdate();
    	statoServizioUpdate.setStato("autorizzato_produzione");
	    statoServizioUpdate.setCommento("autorizzato in produzione");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("autorizzato_produzione", servizioUpdated.getBody().getStato());
    	
    	statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("richiesto_produzione");
	    statoServizioUpdate.setCommento("richiesto in produzione");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    
	    assertEquals("richiesto_produzione", servizioUpdated.getBody().getStato());
    	
	    CommonUtils.getSessionUtente(UTENTE_RICHIEDENTE_SERVIZIO, securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("autorizzato_produzione");
	    	statoServizioUpdaten.setCommento("autorizzato in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("autorizzato_produzione");
	    	statoServizioUpdaten.setCommento("autorizzato in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");

	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("autorizzato_produzione");
	    	statoServizioUpdaten.setCommento("autorizzato in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("autorizzato_produzione");
	    	statoServizioUpdaten.setCommento("autorizzato in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
        
        CommonUtils.getSessionUtente(UTENTE_QUALSIASI, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("autorizzato_produzione");
	    	statoServizioUpdaten.setCommento("autorizzato in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    }
    
    @Test
    public void daStatoAutorizzatoInProduzioneAInConfigurazioneInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//imposto lo stato di partenza
    	this.cambioStatoFinoA("autorizzato_produzione");
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
    	StatoUpdate statoServizioUpdate = new StatoUpdate();
    	statoServizioUpdate.setStato("in_configurazione_produzione");
	    statoServizioUpdate.setCommento("in configurazione in produzione");
	    ResponseEntity<Servizio> servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("in_configurazione_produzione", servizioUpdated.getBody().getStato());
    	
    	statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("autorizzato_produzione");
	    statoServizioUpdate.setCommento("autorizzato in produzione");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("autorizzato_produzione", servizioUpdated.getBody().getStato());
    	
    	CommonUtils.getSessionUtente(UTENTE_RICHIEDENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("in_configurazione_produzione");
	    	statoServizioUpdaten.setCommento("in configurazione in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("in_configurazione_produzione");
	    	statoServizioUpdaten.setCommento("in configurazione in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("in_configurazione_produzione");
	    	statoServizioUpdaten.setCommento("in configurazione in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");

	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("in_configurazione_produzione");
	    	statoServizioUpdaten.setCommento("in configurazione in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("in_configurazione_produzione");
	    	statoServizioUpdaten.setCommento("in configurazione in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
        
        CommonUtils.getSessionUtente(UTENTE_QUALSIASI, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("in_configurazione_produzione");
	    	statoServizioUpdaten.setCommento("in configurazione in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");         
    }
    
    @Test
    public void daStatoInConfigurazioneInProduzioneAPubblicatoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//imposto lo stato di partenza
    	this.cambioStatoFinoA("in_configurazione_produzione");
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
    	StatoUpdate statoServizioUpdate = new StatoUpdate();
    	statoServizioUpdate.setStato("pubblicato_produzione");
	    statoServizioUpdate.setCommento("pubblicato in produzione");
	    ResponseEntity<Servizio> servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("pubblicato_produzione", servizioUpdated.getBody().getStato());
    	
    	statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("in_configurazione_produzione");
	    statoServizioUpdate.setCommento("in configurazione in produzione");
	    servizioUpdated = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    	
    	assertEquals("in_configurazione_produzione", servizioUpdated.getBody().getStato());
    	
    	CommonUtils.getSessionUtente(UTENTE_RICHIEDENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("pubblicato_produzione");
	    	statoServizioUpdaten.setCommento("pubblicato in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("pubblicato_produzione");
	    	statoServizioUpdaten.setCommento("pubblicato in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("pubblicato_produzione");
	    	statoServizioUpdaten.setCommento("pubblicato in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");

	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("pubblicato_produzione");
	    	statoServizioUpdaten.setCommento("pubblicato in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
	    
	    CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("pubblicato_produzione");
	    	statoServizioUpdaten.setCommento("pubblicato in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
        
        CommonUtils.getSessionUtente(UTENTE_QUALSIASI, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
	    	StatoUpdate statoServizioUpdaten = new StatoUpdate();
	    	statoServizioUpdaten.setStato("pubblicato_produzione");
	    	statoServizioUpdaten.setCommento("pubblicato in produzione");
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdaten, null);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");     
	    
    }
    
    public void cambioStatoFinoA(String statoFinale) {
        List<StatoUpdate> sequenzaStati = new ArrayList<>();

        // Creazione e impostazione degli oggetti StatoUpdate
        StatoUpdate stato1 = new StatoUpdate();
        stato1.setStato("richiesto_collaudo");
        stato1.setCommento("richiesta di collaudo");
        sequenzaStati.add(stato1);

        StatoUpdate stato2 = new StatoUpdate();
        stato2.setStato("autorizzato_collaudo");
        stato2.setCommento("autorizzato collaudo");
        sequenzaStati.add(stato2);

        StatoUpdate stato3 = new StatoUpdate();
        stato3.setStato("in_configurazione_collaudo");
        stato3.setCommento("in configurazione collaudo");
        sequenzaStati.add(stato3);

        StatoUpdate stato4 = new StatoUpdate();
        stato4.setStato("pubblicato_collaudo");
        stato4.setCommento("pubblicato in collaudo");
        sequenzaStati.add(stato4);

        StatoUpdate stato5 = new StatoUpdate();
        stato5.setStato("richiesto_produzione");
        stato5.setCommento("richiesto in produzione");
        sequenzaStati.add(stato5);

        StatoUpdate stato6 = new StatoUpdate();
        stato6.setStato("autorizzato_produzione");
        stato6.setCommento("autorizzato in produzione");
        sequenzaStati.add(stato6);

        StatoUpdate stato7 = new StatoUpdate();
        stato7.setStato("in_configurazione_produzione");
        stato7.setCommento("in configurazione in produzione");
        sequenzaStati.add(stato7);

        StatoUpdate stato8 = new StatoUpdate();
        stato8.setStato("pubblicato_produzione");
        stato8.setCommento("pubblicato in produzione");
        sequenzaStati.add(stato8);

        // Itera sulla sequenza degli stati e applica ciascuno finché non raggiungi lo stato finale
        for (StatoUpdate statoUpdate : sequenzaStati) {
            serviziController.updateStatoServizio(idServizio, statoUpdate, null);
            entityManager.flush();
            entityManager.clear();
            // Termina il ciclo quando raggiungi lo stato finale desiderato
            if (statoUpdate.getStato().equals(statoFinale)) {
                break;
            }
        }
        entityManager.flush();
        entityManager.clear();
    }
    
	private InfoProfilo getInfoProfilo(String idUtente) {
		return this.utenteService.runTransaction(() -> {
			UtenteEntity utente = this.utenteService.findByPrincipal(idUtente).orElseThrow(() -> new NotFoundException("Utente "+idUtente+" non trovato"));
			
			if(utente.getOrganizzazione()!=null) {
				utente.getOrganizzazione().getSoggetti().stream().forEach(s -> {s.getNome();});
			}
			
			utente.getClassi().stream().forEach( e-> {e.getNome();});
	
			return new InfoProfilo(idUtente, utente, List.of());
		});
	}
    
    public void cambioStatoARichiestoInCollaudo() {
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        StatoUpdate statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("richiesto_collaudo");
	    statoServizioUpdate.setCommento("richiesta di collaudo");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    }
    
    public void setStato(UUID idServizio, String nomeStato, String commento) {
    	StatoUpdate statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato(nomeStato);
	    statoServizioUpdate.setCommento(commento);
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    }

    public void setIdServizio(UUID id) {
        this.idServizio = id;
    }
    
    public void setIdOrganizazione(UUID id) {
    	this.idOrganizzazione = id;
    }
    
    ResponseEntity<Organizzazione> response;
    ResponseEntity<Soggetto> createdSoggetto;
    ResponseEntity<Utente> responseUtente;
    ResponseEntity<Gruppo> responseGruppo;
    DocumentoCreate immagine = new DocumentoCreate();
    
    public Dominio getDominio(VisibilitaServizioEnum value) {
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setEsterna(false);

        response = organizzazioniController.createOrganizzazione(organizzazione);
        this.setIdOrganizazione(response.getBody().getIdOrganizzazione());
        assertNotNull(response.getBody().getIdOrganizzazione());
        
        info = CommonUtils.getInfoProfilo(UTENTE_QUALSIASI, utenteService);
        ID_UTENTE_QUALSIASI = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_DOMINIO, utenteService);
        ID_UTENTE_REFERENTE_DOMINIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_SERVIZIO, utenteService);
        ID_UTENTE_REFERENTE_SERVIZIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO_DOMINIO, utenteService);
        ID_UTENTE_REFERENTE_TECNICO_DOMINIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO_SERVIZIO, utenteService);
        ID_UTENTE_REFERENTE_TECNICO_SERVIZIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_RICHIEDENTE_SERVIZIO, utenteService);
        ID_UTENTE_RICHIEDENTE_SERVIZIO = UUID.fromString(info.utente.getIdUtente());
        
        //associo l'utente all'Organizzazione
        UtenteUpdate upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_REFERENTE_SERVIZIO);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("referente");
        upUtente.setCognome("servizio");
        upUtente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);

        utentiController.updateUtente(ID_UTENTE_REFERENTE_SERVIZIO, upUtente);
        
        upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_REFERENTE_DOMINIO);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("referente");
        upUtente.setCognome("dominio");
        upUtente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);

        utentiController.updateUtente(ID_UTENTE_REFERENTE_DOMINIO, upUtente);
        
        upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_RICHIEDENTE_SERVIZIO);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_servizio");

        utentiController.updateUtente(ID_UTENTE_RICHIEDENTE_SERVIZIO, upUtente);
        
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("nome_soggetto");
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setAderente(true);
        soggettoCreate.setReferente(true);

        createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        gruppoCreate.setNome(NOME_GRUPPO);
        responseGruppo = gruppiController.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, responseGruppo.getStatusCode());

        DominioCreate dominio = CommonUtils.getDominioCreate();
        if(value!=null) {
        	
        	VisibilitaDominioEnum valueDominio = null;
        	
        	switch(value) {
			case PRIVATO: valueDominio = VisibilitaDominioEnum.PRIVATO;
				break;
			case PUBBLICO: valueDominio = VisibilitaDominioEnum.PUBBLICO;
				break;
			case RISERVATO: valueDominio = VisibilitaDominioEnum.RISERVATO;
				break;
			case COMPONENTE: throw new InternalException("Impossibile impostare la visibilita componente per un dominio");
			default:
				break;}

        	dominio.setVisibilita(valueDominio);
        }
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominio);
        entityManager.flush();
        entityManager.clear();
        //creo il referente dominio
        ReferenteCreate ref = new ReferenteCreate();
        ref.setIdUtente(ID_UTENTE_REFERENTE_DOMINIO);
        ref.setTipo(TipoReferenteEnum.REFERENTE);
        dominiController.createReferenteDominio(createdDominio.getBody().getIdDominio(), ref);
        entityManager.flush();
        entityManager.clear();
        //creo il referente tecnico dominio
        ref = new ReferenteCreate();
        ref.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        ref.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        dominiController.createReferenteDominio(createdDominio.getBody().getIdDominio(), ref);
        entityManager.flush();
        entityManager.clear();
        return createdDominio.getBody();
    }
    
    public Servizio getServizio(Dominio dominio, VisibilitaServizioEnum value) {
    	 ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	 if(value != null) {
    		 servizioCreate.setVisibilita(value);
    	 }
    	 
         servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

         servizioCreate.setIdDominio(dominio.getIdDominio());

         if (immagine.getContent() != null) {
             servizioCreate.setImmagine(immagine);
         }
         
         List<ReferenteCreate> referenti = new ArrayList<>();
         
         ReferenteCreate referente = new ReferenteCreate();
         referente.setTipo(TipoReferenteEnum.REFERENTE);
         referente.setIdUtente(ID_UTENTE_REFERENTE_SERVIZIO);
         referenti.add(referente);
         
         referente = new ReferenteCreate();
         referente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
         referente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_SERVIZIO);
         referenti.add(referente);
         
         //NOTA BENE: I REFERENTI DOMINIO (NON TECNICI) DOVRANNO AVERE IL RUOLO REFERENTE SERVIZIO
         referente = new ReferenteCreate();
         referente.setTipo(TipoReferenteEnum.REFERENTE);
         referente.setIdUtente(ID_UTENTE_REFERENTE_DOMINIO);
         referenti.add(referente);
         
         servizioCreate.setReferenti(referenti);
         
         CommonUtils.getSessionUtente(UTENTE_RICHIEDENTE_SERVIZIO, securityContext, authentication, utenteService);
         
         ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
         Servizio servizio = createdServizio.getBody();

         this.setIdServizio(servizio.getIdServizio());
         CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
         entityManager.flush();
         entityManager.clear();
         return servizio;
    }

    public API getAPI() {
    	APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(idServizio);
        apiCreate.setRuolo(RuoloAPIEnum.DOMINIO);
        
        APIDatiAmbienteCreate apiDatiAmbienteCreate = new APIDatiAmbienteCreate();
        apiDatiAmbienteCreate.setProtocollo(ProtocolloEnum.REST);
        
        DocumentoCreate documento = new DocumentoCreate();
        documento.setContentType("application/yaml");
        documento.setContent(Base64.encodeBase64String(CommonUtils.openApiSpec.getBytes()));
        documento.setFilename("openapi.yaml");
        
        apiDatiAmbienteCreate.setSpecifica(documento);
        
        APIDatiErogazione apiDatiErogazione = new APIDatiErogazione();
        apiDatiErogazione.setNomeGateway("APIGateway");
        apiDatiErogazione.setVersioneGateway(1);
        apiDatiErogazione.setUrlPrefix("http://");
        apiDatiErogazione.setUrl("testurl.com/test");
        
        apiDatiAmbienteCreate.setDatiErogazione(apiDatiErogazione);
        
        apiCreate.setConfigurazioneCollaudo(apiDatiAmbienteCreate);
        apiCreate.setConfigurazioneProduzione(apiDatiAmbienteCreate);
        
        
        
        List<AuthTypeApiResource> gruppiAuthType = new ArrayList<AuthTypeApiResource>();
        
        AuthTypeApiResource authType = new AuthTypeApiResource();
        authType.setProfilo("MODI_P1");
        
        List<String> risorse = new ArrayList<String>();
        risorse.add("risorsa1");
        authType.setResources(risorse);
        
        List<AuthTypeApiResourceProprietaCustom> proprietaCustom = new ArrayList<AuthTypeApiResourceProprietaCustom>();
        
        AuthTypeApiResourceProprietaCustom autResource = new AuthTypeApiResourceProprietaCustom();
        autResource.setNome("custom resorce");
        autResource.setValore("56");
        
        proprietaCustom.add(autResource);
        
        gruppiAuthType.add(authType);
        
        apiCreate.setGruppiAuthType(gruppiAuthType);
        
        DocumentoCreate doc = new DocumentoCreate();
        doc.setFilename("SpecificaAPI.json");
        doc.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        
        ResponseEntity<API> response = apiController.createApi(apiCreate);
        entityManager.flush();
        entityManager.clear();
        return response.getBody();
    }

}
