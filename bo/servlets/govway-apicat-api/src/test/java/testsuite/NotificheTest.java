package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.codec.binary.Base64;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
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

    private static final String UTENTE_GESTORE = "gestore";
    private static final String UTENTE_REFERENTE_TECNICO = "barbarossa";

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
        upUtente.setUsername(UTENTE_GESTORE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("referente");
        upUtente.setCognome("dominio");
        upUtente.setRuolo(RuoloUtenteEnum.GESTORE);

        utentiController.updateUtente(UTENTE_GESTORE, upUtente);
        
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
        ref.setIdUtente(UTENTE_GESTORE);
        ref.setTipo(TipoReferenteEnum.REFERENTE);
        dominiController.createReferenteDominio(createdDominio.getBody().getIdDominio(), ref);

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
         referente.setIdUtente(UTENTE_GESTORE);
         referenti.add(referente);
         
         ReferenteCreate referente2 = new ReferenteCreate();
 		 referente2.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
 		 referente2.setIdUtente(utenteService.find(UTENTE_REFERENTE_TECNICO).get().getIdUtente());
         referenti.add(referente2);
 		 
         servizioCreate.setReferenti(referenti);

         ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
         
         ServizioUpdate upServizio = new ServizioUpdate();
         upServizio.setDatiGenerici(null);
         upServizio.setIdentificativo(null);
         
         Servizio servizio = createdServizio.getBody();

         idServizio = servizio.getIdServizio();
         
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
        
        return response.getBody();
    }
    
    private Adesione getAdesione() {
    	List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_GESTORE);
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
        String idMittente = null;
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
        String idMittente = null;
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
        
        assertEquals("Notifica [" + idNotifica + "] non trovata", exception.getMessage());
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

        assertEquals("Utente non abilitato", exception.getMessage());
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

        assertEquals("Notifica[" + idNotifica + "] non trovata", exception.getMessage());
    }
}
