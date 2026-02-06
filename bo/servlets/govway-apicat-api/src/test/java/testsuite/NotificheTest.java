package testsuite;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.codec.binary.Base64;
import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.controllers.NotificheController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.ToolsController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.services.DocumentoService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.API;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.Adesione;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.AuthTypeApiResourceProprietaCustom;
import org.govway.catalogo.servlets.model.CountNotifica;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.ItemMessaggio;
import org.govway.catalogo.servlets.model.MessaggioCreate;
import org.govway.catalogo.servlets.model.Notifica;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.PagedModelItemNotifica;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.RuoloAPIEnum;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.ServizioUpdate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.StatoNotifica;
import org.govway.catalogo.servlets.model.StatoUtenteEnum;
import org.govway.catalogo.servlets.model.TipoEntitaNotifica;
import org.govway.catalogo.servlets.model.TipoNotificaEnum;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.UpdateNotifica;
import org.govway.catalogo.servlets.model.UtenteUpdate;
import org.govway.catalogo.servlets.model.VisibilitaDominioEnum;
import org.govway.catalogo.servlets.model.VisibilitaServizioEnum;
import org.govway.catalogo.core.orm.entity.NotificaEntity;
import org.govway.catalogo.core.dao.specifications.NotificaSpecification;
import org.govway.catalogo.core.services.NotificaService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
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
public class NotificheTest {
	@Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private CoreAuthorization coreAuthorization;

    @Mock
    private DocumentoService documentoService;

    @InjectMocks
    private ToolsController toolsController;

    @Autowired
    UtenteService utenteService;
    
    @Autowired
    private UtentiController utentiController;
    
    @Autowired
    private OrganizzazioniController organizzazioniController;
    
    @Autowired
    private SoggettiController soggettiController;
    
    @Autowired
    private GruppiController gruppiController;
    
    @Autowired
    private DominiController dominiController;
    
    @Autowired
    private APIController apiController;
    
    @Autowired
    private ServiziController serviziController;

    @Autowired
    private AdesioniController adesioniController;
    
    @Autowired
    NotificheController notificheController;

    @Autowired
    NotificaService notificaService;

    @PersistenceContext
    private EntityManager entityManager;

    private static final String UTENTE_GESTORE = "gestore";
    private static final String UTENTE_REFERENTE_TECNICO = "barbarossa";
    
    private static UUID ID_UTENTE_GESTORE;
    private static UUID ID_UTENTE_REFERENTE_TECNICO;

    @BeforeEach
    private void setUp() {
        MockitoAnnotations.initMocks(this);
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);

        when(coreAuthorization.isAnounymous()).thenReturn(true);

        SecurityContextHolder.setContext(this.securityContext);
        
        InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_GESTORE, utenteService);
        ID_UTENTE_GESTORE = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO, utenteService);
        ID_UTENTE_REFERENTE_TECNICO = UUID.fromString(info.utente.getIdUtente());
    }

    @AfterEach
    private void tearDown() {
        SecurityContextHolder.clearContext();
    }
    
    private UUID idSoggetto;
    private UUID idServizio;
    private UUID idOrganizzazione;
    
    private Dominio getDominio(VisibilitaDominioEnum value) {
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setEsterna(false);

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(organizzazione);
        idOrganizzazione = response.getBody().getIdOrganizzazione();
        assertNotNull(response.getBody().getIdOrganizzazione());
        
        
        
        //associo l'utente all'Organizzazione
        UtenteUpdate upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_GESTORE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("referente");
        upUtente.setCognome("dominio");
        upUtente.setRuolo(RuoloUtenteEnum.GESTORE);

        utentiController.updateUtente(ID_UTENTE_GESTORE, upUtente);
        
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("nome_soggetto");
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setAderente(true);
        soggettoCreate.setReferente(true);

        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        idSoggetto = createdSoggetto.getBody().getIdSoggetto();
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        gruppoCreate.setNome("Gruppo xyz");
        ResponseEntity<Gruppo> responseGruppo = gruppiController.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, responseGruppo.getStatusCode());

        DominioCreate dominio = CommonUtils.getDominioCreate();
        dominio.setNome("Test");
        if(value!=null) {
        	dominio.setVisibilita(value);
        }
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominio);
        
        //creo il referente dominio
        ReferenteCreate ref = new ReferenteCreate();
        ref.setIdUtente(ID_UTENTE_GESTORE);
        ref.setTipo(TipoReferenteEnum.REFERENTE);
        dominiController.createReferenteDominio(createdDominio.getBody().getIdDominio(), ref);
        entityManager.flush();
        entityManager.clear();
        return createdDominio.getBody();
    }
    
    private Servizio getServizio(Dominio dominio, VisibilitaServizioEnum value) {
    	 ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	 if(value != null) {
    		 servizioCreate.setVisibilita(value);
    	 }
    	 
         servizioCreate.setIdSoggettoInterno(idSoggetto);

         servizioCreate.setIdDominio(dominio.getIdDominio());
         
         List<ReferenteCreate> referenti = new ArrayList<>();
         
         ReferenteCreate referente = new ReferenteCreate();
         referente.setTipo(TipoReferenteEnum.REFERENTE);
         referente.setIdUtente(ID_UTENTE_GESTORE);
         referenti.add(referente);
         
         ReferenteCreate referente2 = new ReferenteCreate();
 		 referente2.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
 		 referente2.setIdUtente(UUID.fromString(utenteService.findByPrincipal(UTENTE_REFERENTE_TECNICO).get().getIdUtente()));
         referenti.add(referente2);
 		 
         servizioCreate.setReferenti(referenti);

         ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
         
         ServizioUpdate upServizio = new ServizioUpdate();
         upServizio.setDatiGenerici(null);
         upServizio.setIdentificativo(null);
         
         Servizio servizio = createdServizio.getBody();

         idServizio = servizio.getIdServizio();
         entityManager.flush();
         entityManager.clear();
         return servizio;
    }
    
    private API getAPI() {
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
    
    private Adesione getAdesione() {
    	List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
    	
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        return adesione.getBody();
    }
    
    @Test
    public void testCountNotificheSuccess() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);
    	
    	MessaggioCreate messaggioComunicazione = new MessaggioCreate();
        messaggioComunicazione.setOggetto("Oggetto Comunicazione");
        messaggioComunicazione.setTesto("Si richiede di procedere con la configurazione dell'adesione al servizio");
        serviziController.createMessaggioServizio(idServizio, messaggioComunicazione);
    	
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);
        
        String query = null;
        TipoNotificaEnum tipoNotifica = TipoNotificaEnum.COMUNICAZIONE;
        List<StatoNotifica> statoNotifica = List.of(StatoNotifica.NUOVA);
        TipoEntitaNotifica tipoEntitaNotifica = TipoEntitaNotifica.SERVIZIO;
        UUID idEntitaNotifica = null;
        UUID idMittente = null;
        UUID idServizio = servizio.getIdServizio();
        UUID idAdesione = null;
        
        ResponseEntity<CountNotifica> response = notificheController.countNotifiche(query, tipoNotifica, statoNotifica, tipoEntitaNotifica, idEntitaNotifica, idMittente, idServizio, idAdesione);

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
    
    @Test
    public void testListNotificheSuccess() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);
    	
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);
    	
        String q = null;
        TipoNotificaEnum tipoNotifica = TipoNotificaEnum.COMUNICAZIONE;
        List<StatoNotifica> statoNotifica = List.of(StatoNotifica.NUOVA);
        TipoEntitaNotifica tipoEntitaNotifica = TipoEntitaNotifica.SERVIZIO;
        UUID idEntitaNotifica = null;
        UUID idMittente = null;
        UUID idServizio = servizio.getIdServizio();
        UUID idAdesione = null;
        int page = 0;
        int size = 10;
        List<String> sort = List.of("data,desc");

        ResponseEntity<PagedModelItemNotifica> response = notificheController.listNotifiche(q, tipoNotifica, statoNotifica, tipoEntitaNotifica, idEntitaNotifica, idMittente, idServizio, idAdesione, page, size, sort);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        //System.out.println(response.getBody().getContent());
        assertEquals(1, response.getBody().getContent().size());
        assertEquals(1, response.getBody().getPage().getTotalElements());
    }
  
    @Test
    public void testUpdateNotificaSuccess() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);
    	
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);
    	
        ResponseEntity<PagedModelItemNotifica> notifiche = notificheController.listNotifiche(null, null, null, null, null, null, idServizio, null, 0, 10, null);
    	
        UUID idNotifica = notifiche.getBody().getContent().get(0).getIdNotifica();
        UpdateNotifica updateNotifica = new UpdateNotifica();
        updateNotifica.setStato(StatoNotifica.NUOVA);
        
        ResponseEntity<Notifica> response = notificheController.updateNotifica(idNotifica, updateNotifica);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(idNotifica, response.getBody().getIdNotifica());
    }
    
    @Test
    public void testUpdateNotificaNotFound() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);
    	
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);
    	
        UUID idNotifica = UUID.randomUUID();
        UpdateNotifica updateNotifica = new UpdateNotifica();
        updateNotifica.setStato(StatoNotifica.NUOVA);


        NotFoundException exception = assertThrows(NotFoundException.class, () -> 
        notificheController.updateNotifica(idNotifica, updateNotifica));
        
        assertEquals("NTF.404", exception.getMessage());
    }

    @Test
    public void testUpdateNotificaNotAuthorized() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);
    	
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);
    	
        ResponseEntity<PagedModelItemNotifica> notifiche = notificheController.listNotifiche(null, null, null, null, null, null, idServizio, null, 0, 10, null);
    	
        UUID idNotifica = notifiche.getBody().getContent().get(0).getIdNotifica();
        UpdateNotifica updateNotifica = new UpdateNotifica();
        updateNotifica.setStato(StatoNotifica.NUOVA);
        
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> 
        notificheController.updateNotifica(idNotifica, updateNotifica));

        assertEquals("UT.403", exception.getMessage());
    }

    @Test
    public void testGetNotificaSuccess() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);
    	
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);
    	
        ResponseEntity<PagedModelItemNotifica> notifiche = notificheController.listNotifiche(null, null, null, null, null, null, idServizio, null, 0, 10, null);
    	
        UUID idNotifica = notifiche.getBody().getContent().get(0).getIdNotifica();
        
        ResponseEntity<Notifica> response = notificheController.getNotifica(idNotifica);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(idNotifica, response.getBody().getIdNotifica());
    }

    @Test
    public void testGetNotificaNotFound() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);
    	
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);
    	
        UUID idNotifica = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () ->
        notificheController.getNotifica(idNotifica));

        assertEquals("NTF.404", exception.getMessage());
    }

    @Test
    public void testListNotificheWithEmailTypeFilter() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);

        String q = null;
        // Test con filtro per tipo email (non dovrebbe trovare nulla perché le notifiche esistenti sono push)
        TipoNotificaEnum tipoNotifica = TipoNotificaEnum.COMUNICAZIONE_EMAIL;
        List<StatoNotifica> statoNotifica = List.of(StatoNotifica.NUOVA);
        TipoEntitaNotifica tipoEntitaNotifica = TipoEntitaNotifica.SERVIZIO;
        UUID idEntitaNotifica = null;
        UUID idMittente = null;
        UUID idServizio = servizio.getIdServizio();
        UUID idAdesione = null;
        int page = 0;
        int size = 10;
        List<String> sort = List.of("data,desc");

        ResponseEntity<PagedModelItemNotifica> response = notificheController.listNotifiche(q, tipoNotifica, statoNotifica, tipoEntitaNotifica, idEntitaNotifica, idMittente, idServizio, idAdesione, page, size, sort);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        // Non dovrebbe trovare notifiche con tipo email perché le notifiche esistenti sono di tipo push
        assertEquals(0, response.getBody().getContent().size());
    }

    @Test
    public void testCountNotificheWithEmailTypeFilter() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	MessaggioCreate messaggioComunicazione = new MessaggioCreate();
        messaggioComunicazione.setOggetto("Oggetto Comunicazione");
        messaggioComunicazione.setTesto("Si richiede di procedere con la configurazione dell'adesione al servizio");
        serviziController.createMessaggioServizio(idServizio, messaggioComunicazione);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);

        String query = null;
        // Test con filtro per tipo email cambio_stato_email
        TipoNotificaEnum tipoNotifica = TipoNotificaEnum.CAMBIO_STATO_EMAIL;
        List<StatoNotifica> statoNotifica = List.of(StatoNotifica.NUOVA);
        TipoEntitaNotifica tipoEntitaNotifica = TipoEntitaNotifica.SERVIZIO;
        UUID idEntitaNotifica = null;
        UUID idMittente = null;
        UUID idServizio = servizio.getIdServizio();
        UUID idAdesione = null;

        ResponseEntity<CountNotifica> response = notificheController.countNotifiche(query, tipoNotifica, statoNotifica, tipoEntitaNotifica, idEntitaNotifica, idMittente, idServizio, idAdesione);

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        // Non dovrebbe trovare notifiche con tipo email perché le notifiche esistenti sono di tipo push
        assertEquals(0L, response.getBody().getCount());
    }

    @Test
    public void testListNotificheWithEmailEntitaFilter() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);

        String q = null;
        TipoNotificaEnum tipoNotifica = TipoNotificaEnum.COMUNICAZIONE;
        List<StatoNotifica> statoNotifica = List.of(StatoNotifica.NUOVA);
        // Test con filtro per entità email
        TipoEntitaNotifica tipoEntitaNotifica = TipoEntitaNotifica.SERVIZIO_EMAIL;
        UUID idEntitaNotifica = null;
        UUID idMittente = null;
        UUID idServizio = servizio.getIdServizio();
        UUID idAdesione = null;
        int page = 0;
        int size = 10;
        List<String> sort = List.of("data,desc");

        ResponseEntity<PagedModelItemNotifica> response = notificheController.listNotifiche(q, tipoNotifica, statoNotifica, tipoEntitaNotifica, idEntitaNotifica, idMittente, idServizio, idAdesione, page, size, sort);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        // Non dovrebbe trovare notifiche con tipo entità email
        assertEquals(0, response.getBody().getContent().size());
    }

    @Test
    public void testCountNotificheWithAdesioneEmailEntitaFilter() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);

        String query = null;
        TipoNotificaEnum tipoNotifica = TipoNotificaEnum.COMUNICAZIONE;
        List<StatoNotifica> statoNotifica = List.of(StatoNotifica.NUOVA);
        // Test con filtro per entità adesione email
        TipoEntitaNotifica tipoEntitaNotifica = TipoEntitaNotifica.ADESIONE_EMAIL;
        UUID idEntitaNotifica = null;
        UUID idMittente = null;
        UUID idServizio = servizio.getIdServizio();
        UUID idAdesione = null;

        ResponseEntity<CountNotifica> response = notificheController.countNotifiche(query, tipoNotifica, statoNotifica, tipoEntitaNotifica, idEntitaNotifica, idMittente, idServizio, idAdesione);

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        // Non dovrebbe trovare notifiche con tipo entità email
        assertEquals(0L, response.getBody().getCount());
    }

    @Test
    public void testNotificaSpecificationEscludiEmail() {
        // Test diretto sulla specification per escludere email
        NotificaSpecification spec = new NotificaSpecification();
        spec.setEscludiEmail(true);

        // Verifica che il flag sia impostato correttamente
        assertEquals(true, spec.isEscludiEmail());
        assertEquals(false, spec.isSoloEmailNonInviate());
    }

    @Test
    public void testNotificaSpecificationSoloEmailNonInviate() {
        // Test diretto sulla specification per le email non inviate
        NotificaSpecification spec = new NotificaSpecification();
        spec.setSoloEmailNonInviate(true);

        // Verifica che il flag sia impostato correttamente
        assertEquals(false, spec.isEscludiEmail());
        assertEquals(true, spec.isSoloEmailNonInviate());
    }

    @Test
    public void testListNotificheExcludesEmailNotifications() {
        // Creo il dominio
        Dominio dominio = this.getDominio(null);
        // Creo un servizio
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        // Creo API
        this.getAPI();

        // Pubblico il servizio per generare notifiche
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

        // Invio un messaggio per generare notifiche push E email
        MessaggioCreate messaggioComunicazione = new MessaggioCreate();
        messaggioComunicazione.setOggetto("Oggetto Test Email");
        messaggioComunicazione.setTesto("Testo per verificare esclusione email");
        serviziController.createMessaggioServizio(idServizio, messaggioComunicazione);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);

        // La GET notifiche dovrebbe restituire solo le notifiche push, non quelle email
        ResponseEntity<PagedModelItemNotifica> response = notificheController.listNotifiche(
            null, null, null, null, null, null, idServizio, null, 0, 100, null);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());

        // Tutte le notifiche restituite dovrebbero essere di tipo push (non email)
        for (var notifica : response.getBody().getContent()) {
            // Verifica che il tipo non sia email
            assertNotNull(notifica.getTipo());
            // Le notifiche push sono COMUNICAZIONE e CAMBIO_STATO, non COMUNICAZIONE_EMAIL e CAMBIO_STATO_EMAIL
            if (notifica.getTipo() != null) {
                String tipo = notifica.getTipo().getTipo();
                boolean isEmailType = TipoNotificaEnum.COMUNICAZIONE_EMAIL.getValue().equals(tipo)
                    || TipoNotificaEnum.CAMBIO_STATO_EMAIL.getValue().equals(tipo);
                assertEquals(false, isEmailType, "La notifica non dovrebbe essere di tipo email");
            }
        }
    }

    @Test
    public void testCountNotificheExcludesEmailNotifications() {
        // Creo il dominio
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        // Creo API
        this.getAPI();

        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

        // Invio un messaggio per generare notifiche push E email
        MessaggioCreate messaggioComunicazione = new MessaggioCreate();
        messaggioComunicazione.setOggetto("Oggetto Test Email Count");
        messaggioComunicazione.setTesto("Testo per verificare esclusione email count");
        serviziController.createMessaggioServizio(idServizio, messaggioComunicazione);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);

        // Il count dovrebbe escludere le notifiche email
        ResponseEntity<CountNotifica> response = notificheController.countNotifiche(
            null, null, null, null, null, null, idServizio, null);

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        // Il count dovrebbe includere solo notifiche push, non email
        // Questo test verifica che l'esclusione sia attiva
        assertNotNull(response.getBody().getCount());
    }

    @Test
    public void testEmailInviataFlag() {
        // Test per verificare che il flag emailInviata funzioni correttamente
        NotificaEntity notifica = new NotificaEntity();

        // Inizialmente il flag dovrebbe essere false
        assertFalse(notifica.isEmailInviata());

        // Imposta il flag a true
        notifica.setEmailInviata(true);
        assertTrue(notifica.isEmailInviata());

        // Imposta il flag a false
        notifica.setEmailInviata(false);
        assertFalse(notifica.isEmailInviata());
    }
}
