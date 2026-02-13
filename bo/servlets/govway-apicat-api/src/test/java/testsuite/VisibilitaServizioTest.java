package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.codec.binary.Base64;
import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.controllers.ClassiUtenteController;
import org.govway.catalogo.controllers.ClientController;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.controllers.NotificheController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.dao.repositories.OrganizzazioneRepository;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.servlets.model.API;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.Adesione;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.AuthTypeApiResourceProprietaCustom;
import org.govway.catalogo.servlets.model.ClasseUtente;
import org.govway.catalogo.servlets.model.ClasseUtenteCreate;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.PagedModelItemServizio;
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
public class VisibilitaServizioTest {
	private static final String UTENTE_QUALSIASI = "Mr.xx";
	private static final String UTENTE_RICHIEDENTE_SERVIZIO = "utente_richiedente_servizio";
	private static final String UTENTE_REFERENTE_SERVIZIO = "utente_referente_servizio";
	private static final String UTENTE_REFERENTE_TECNICO_SERVIZIO = "utente_referente_tecnico_servizio";
	private static final String UTENTE_REFERENTE_DOMINIO = "utente_referente_dominio";
	private static final String UTENTE_REFERENTE_TECNICO_DOMINIO = "utente_referente_tecnico_dominio";
	private static final String UTENTE_QUALSIASI_APPARTENENTE_CLASSE_UTENTI = "utente_qualsiasi_appartenente_classe_utenti";
    private static final String UTENTE_GESTORE = "gestore";
    
    private static UUID ID_UTENTE_QUALSIASI;
	private static UUID ID_UTENTE_RICHIEDENTE_SERVIZIO;
	private static UUID ID_UTENTE_REFERENTE_SERVIZIO;
	private static UUID ID_UTENTE_REFERENTE_TECNICO_SERVIZIO;
	private static UUID ID_UTENTE_REFERENTE_DOMINIO;
	private static UUID ID_UTENTE_REFERENTE_TECNICO_DOMINIO;
	private static UUID ID_UTENTE_QUALSIASI_APPARTENENTE_CLASSE_UTENTI;
    private static UUID ID_UTENTE_GESTORE;
    
    private static final String NOME_GRUPPO = "Gruppo xyz";
    
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
    private NotificheController notificheController;

    @Autowired
    private ClientController clientController;
    
    @Autowired
    private OrganizzazioneRepository organizzazioneRepository;
    
    @Autowired
    private OrganizzazioneService organizzazioneService;
    
    @Autowired
    private AdesioniController adesioniController;
    
    @Autowired
    private ClassiUtenteController classiUtenteController;

    @PersistenceContext
    private EntityManager entityManager;

    private UUID idServizio;
    
    private UUID idOrganizzazione;

    private UUID idAPI;

    private InfoProfilo info;
    
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
    //@Order(1)
    public void testVisibilitaPubblica() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO, false);
    	// Creo API
    	API api = this.getAPI();
    	
    	this.checkVisibilitaPubblica(dominio);     
    }
    
    @Test
    public void testVisibilitaPrivata() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PRIVATO, false);
    	// Creo API
    	API api = this.getAPI();
    	
    	this.checkVisibilitaPrivata(dominio);
    }
    
    @Test
    public void testVisibilitaRiservata() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.RISERVATO, true);
    	// Creo API
    	API api = this.getAPI();
    	
    	//this.setClasseUtente();
    	
    	this.checkVisibilitaRiservata(dominio);
    }
    
    @Test
    public void testVisibilitaPubblicaEreditataDalDominio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(VisibilitaServizioEnum.PUBBLICO);
    	// Creo un servizio
    	Servizio servizio = this.getServizio(dominio, null, false);
    	// Creo API
    	API api = this.getAPI();
    	
    	this.checkVisibilitaPubblica(dominio);
    }
    
    @Test
    public void testVisibilitaPrivataEreditataDalDominio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(VisibilitaServizioEnum.PRIVATO);
    	// Creo un servizio
    	Servizio servizio = this.getServizio(dominio, null, false);
    	// Creo API
    	API api = this.getAPI();
    	
    	this.checkVisibilitaPrivata(dominio);
    }
    
    @Test
    public void testVisibilitaRiservataEreditataDalDominio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(VisibilitaServizioEnum.RISERVATO);
    	// Creo un servizio
    	Servizio servizio = this.getServizio(dominio, null, true);
    	// Creo API
    	API api = this.getAPI();
    	
    	this.checkVisibilitaRiservata(dominio);
    }

    public void setIdServizio(UUID id) {
        this.idServizio = id;
    }
    
    public void setIdAPI(UUID id) {
    	this.idAPI = id;
    }
    
    public void setIdOrganizazione(UUID id) {
        this.idOrganizzazione = id;
    }
    
    /*
    HashMap<String, UUID> idUtente = new HashMap<String, UUID>();
    public void setIdUtente(String chiave, UUID id) {
    	idUtente.put(chiave, id);
    }
    public UUID getIdUtente(String chiave) {
    	return idUtente.get(chiave);
    }
    */
    
    public void cambioStato() {
    	StatoUpdate statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("richiesto_collaudo");
	    statoServizioUpdate.setCommento("richiesta di collaudo");
    	serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);	  
	    statoServizioUpdate.setStato("autorizzato_collaudo");
	    statoServizioUpdate.setCommento("autorizzato collaudo");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    statoServizioUpdate.setStato("in_configurazione_collaudo");
	    statoServizioUpdate.setCommento("in configurazione collaudo");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    statoServizioUpdate.setStato("pubblicato_collaudo");
	    statoServizioUpdate.setCommento("pubblicato in collaudo");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
        entityManager.flush();
        entityManager.clear();
    }
    
    ResponseEntity<Organizzazione> response;
    ResponseEntity<Soggetto> createdSoggetto;
    ResponseEntity<Utente> responseUtente;
    ResponseEntity<Gruppo> responseGruppo;
    DocumentoCreate immagine = new DocumentoCreate();
    
    public void creaUtenti() {
    	UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setPrincipal(UTENTE_QUALSIASI);
        utente.setNome("Mr.");
        utente.setCognome("xx");
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        responseUtente = utentiController.createUtente(utente);
        
        //utente = CommonUtils.getUtenteCreate();
        //utente.setUsername(UTENTE_RICHIEDENTE_SERVIZIO);
        //utente.setNome("Utente");
        //utente.setCognome("Richiedente_servizio");
        //utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        //responseUtente = utentiController.createUtente(utente);
        
        info = CommonUtils.getInfoProfilo(UTENTE_RICHIEDENTE_SERVIZIO, utenteService);
        ID_UTENTE_RICHIEDENTE_SERVIZIO = UUID.fromString(info.utente.getIdUtente());
        
        UtenteUpdate utenteUpdate = new UtenteUpdate();
        utenteUpdate.setPrincipal(UTENTE_RICHIEDENTE_SERVIZIO);
        utenteUpdate.setNome("Utente");
        utenteUpdate.setCognome("Richiedente_servizio");
        utenteUpdate.setEmailAziendale("xyz@xyz.it");
        utenteUpdate.setTelefonoAziendale("0000000");
        utenteUpdate.setStato(StatoUtenteEnum.ABILITATO);
        utenteUpdate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utentiController.updateUtente(ID_UTENTE_RICHIEDENTE_SERVIZIO, utenteUpdate);
          
        utente = CommonUtils.getUtenteCreate();
        utente.setPrincipal(UTENTE_REFERENTE_SERVIZIO);
        utente.setNome("Utente");
        utente.setCognome("Referente_servizio");
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        responseUtente = utentiController.createUtente(utente);
        
        utente = CommonUtils.getUtenteCreate();
        utente.setPrincipal(UTENTE_REFERENTE_TECNICO_SERVIZIO);
        utente.setNome("Utente");
        utente.setCognome("Referente_tecnico_servizio");
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        responseUtente = utentiController.createUtente(utente);
        
        //NOTA BENE: I REFERENTI DOMINIO (NON TECNICI) DOVRANNO AVERE IL RUOLO REFERENTE SERVIZIO
        utente = CommonUtils.getUtenteCreate();
        utente.setPrincipal(UTENTE_REFERENTE_DOMINIO);
        utente.setNome("Utente");
        utente.setCognome("Referente_dominio");
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        responseUtente = utentiController.createUtente(utente);
        
        utente = CommonUtils.getUtenteCreate();
        utente.setPrincipal(UTENTE_REFERENTE_TECNICO_DOMINIO);
        utente.setNome("Utente");
        utente.setCognome("Referente_tecnico_dominio");
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        responseUtente = utentiController.createUtente(utente);
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_DOMINIO, utenteService);
        ID_UTENTE_REFERENTE_DOMINIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_SERVIZIO, utenteService);
        ID_UTENTE_REFERENTE_SERVIZIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO_DOMINIO, utenteService);
        ID_UTENTE_REFERENTE_TECNICO_DOMINIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO_SERVIZIO, utenteService);
        ID_UTENTE_REFERENTE_TECNICO_SERVIZIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_QUALSIASI, utenteService);
        ID_UTENTE_QUALSIASI = UUID.fromString(info.utente.getIdUtente());
    }
    
    public Dominio getDominio(VisibilitaServizioEnum value) {
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setEsterna(false);

        response = organizzazioniController.createOrganizzazione(organizzazione);
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("nome_soggetto");
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setAderente(true);
        soggettoCreate.setReferente(true);

        createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        this.creaUtenti();

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
			case COMPONENTE: throw new RuntimeException("Impossibile impostare la visibilita componente per un dominio");
			default:
				break;}
        	
			dominio.setVisibilita(valueDominio);
        }
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        
        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominio);
        entityManager.flush();
        entityManager.clear();
        return createdDominio.getBody();
    }
    
    public Servizio getServizio(Dominio dominio, VisibilitaServizioEnum value, boolean conClasseUtente) {
    	 ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	 if(value != null) {
    		 servizioCreate.setVisibilita(value);
    	 }
         servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());
         servizioCreate.setIdDominio(dominio.getIdDominio());
         UUID idClasseUtente = null;
         if(conClasseUtente) {
        	 idClasseUtente = this.setClasseUtente().getIdClasseUtente();
        	 List<UUID> listClassi = new ArrayList<UUID>();
        	 listClassi.add(idClasseUtente);
        	 servizioCreate.setClassi(listClassi);
         }

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

         ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
         Servizio servizio = createdServizio.getBody();

         this.setIdServizio(servizio.getIdServizio());
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
        
        ResponseEntity<API> response = apiController.createApi(apiCreate);
        entityManager.flush();
        entityManager.clear();
        return response.getBody();
    }
    
    public void checkVisibilitaPubblica(Dominio dominio) {
    	ReferenteCreate referenteDominio = new ReferenteCreate();
        referenteDominio.setIdUtente(ID_UTENTE_REFERENTE_DOMINIO);
        referenteDominio.setTipo(TipoReferenteEnum.REFERENTE);
        dominiController.createReferenteDominio(dominio.getIdDominio(), referenteDominio);
        referenteDominio = new ReferenteCreate();
        referenteDominio.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        referenteDominio.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        dominiController.createReferenteDominio(dominio.getIdDominio(), referenteDominio);
    	
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
        ResponseEntity<PagedModelItemServizio> listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //Visibile ad un Utente GESTORE in stato BOZZA
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
        //System.out.println(listServizi.getBody().getContent().get(0));

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
        listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //Visibile ad un Utente Referente Servizio in stato BOZZA
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
        //System.out.println(listServizi.getBody().getContent().get(0));

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
        listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //Visibile ad un Utente Referente Tecnico Servizio in stato BOZZA
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
        //System.out.println(listServizi.getBody().getContent().get(0));

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
        listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //Visibile ad un Utente Referente Dominio in stato BOZZA
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
        //System.out.println(listServizi.getBody().getContent().get(0));

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
        listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //Visibile ad un Utente Referente Tecnico Dominio in stato BOZZA
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
        //System.out.println(listServizi.getBody().getContent().get(0));
        
        //effettuo i passaggi di Stato fino ad arrivare al COLLAUDO
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
        this.cambioStato();
        
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(createdSoggetto.getBody().getIdSoggetto());
        ReferenteCreate referente = new ReferenteCreate();
        referente.setTipo(TipoReferenteEnum.REFERENTE);
        referente.setIdUtente(ID_UTENTE_RICHIEDENTE_SERVIZIO);
        List<ReferenteCreate> referenti = new ArrayList<>();
        referenti.add(referente);
        nuovaAdesione.setReferenti(referenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);

        CommonUtils.getSessionUtente(UTENTE_RICHIEDENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //Visibile ad un Utente Richiedente Servizio quando in stato COLLAUDO
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
        //System.out.println(listServizi.getBody().getContent().get(0));

        CommonUtils.getSessionUtente(UTENTE_QUALSIASI, securityContext, authentication, utenteService);
    	
        listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //Visibile ad un utente qualsiasi quando in stato COLLAUDO
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
        //System.out.println(listServizi.getBody().getContent().get(0));
    }
    
    public void checkVisibilitaPrivata(Dominio dominio) {
    	ReferenteCreate referenteDominio = new ReferenteCreate();
        referenteDominio.setIdUtente(ID_UTENTE_REFERENTE_DOMINIO);
        referenteDominio.setTipo(TipoReferenteEnum.REFERENTE);
        dominiController.createReferenteDominio(dominio.getIdDominio(), referenteDominio);
        referenteDominio = new ReferenteCreate();
        referenteDominio.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        referenteDominio.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        dominiController.createReferenteDominio(dominio.getIdDominio(), referenteDominio);
    	
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
        ResponseEntity<PagedModelItemServizio> listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //Visibile ad un Utente GESTORE in stato BOZZA
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
        //System.out.println(listServizi.getBody().getContent().get(0));

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
        listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //Visibile ad un Utente Referente Servizio in stato BOZZA
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
        //System.out.println(listServizi.getBody().getContent().get(0));

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
        listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //Visibile ad un Utente Referente Tecnico Servizio in stato BOZZA
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
        //System.out.println(listServizi.getBody().getContent().get(0));

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
        listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //Visibile ad un Utente Referente Dominio in stato BOZZA
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
        //System.out.println(listServizi.getBody().getContent().get(0));

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
        listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //Visibile ad un Utente Referente Tecnico Dominio in stato BOZZA
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
        //System.out.println(listServizi.getBody().getContent().get(0));
        
        //effettuo i passaggi di Stato fino ad arrivare al COLLAUDO
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
        this.cambioStato();
        
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(createdSoggetto.getBody().getIdSoggetto());
        ReferenteCreate referente = new ReferenteCreate();
        referente.setTipo(TipoReferenteEnum.REFERENTE);
        referente.setIdUtente(ID_UTENTE_RICHIEDENTE_SERVIZIO);
        List<ReferenteCreate> referenti = new ArrayList<>();
        referenti.add(referente);
        nuovaAdesione.setReferenti(referenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);

        CommonUtils.getSessionUtente(UTENTE_RICHIEDENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //Visibile ad un Utente Richiedente Servizio quando in stato COLLAUDO
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
        //System.out.println(listServizi.getBody().getContent().get(0));

        CommonUtils.getSessionUtente(UTENTE_QUALSIASI, securityContext, authentication, utenteService);
    	
        listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //NON Visibile ad un utente qualsiasi
        assertTrue(listServizi.getBody().getContent().isEmpty());
    }
    
    public void checkVisibilitaRiservata(Dominio dominio) {
    	this.checkVisibilitaPrivata(dominio);

        CommonUtils.getSessionUtente(UTENTE_QUALSIASI_APPARTENENTE_CLASSE_UTENTI, securityContext, authentication, utenteService);
    	
        ResponseEntity<PagedModelItemServizio> listServizi = serviziController.listServizi(null, dominio.getIdDominio(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        
        assertNotNull(listServizi.getBody().getContent().get(0));
        assertTrue(listServizi.getBody().getContent().stream().anyMatch(o -> o.getNome().equals(CommonUtils.NOME_SERVIZIO)));
    }
    
    public ClasseUtente setClasseUtente() {
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        ClasseUtenteCreate classe = new ClasseUtenteCreate();
        classe.setNome("Classe_di_Test");
        classe.setDescrizione("Classe di test");
        ResponseEntity<ClasseUtente> cu = classiUtenteController.createClasseUtente(classe);
        
        //ReferenteClasseUtenteCreate rc = new ReferenteClasseUtenteCreate();
        //rc.setIdUtente(UTENTE_QUALSIASI_APPARTENENTE_CLASSE_UTENTI);
        //rc.setTipo(TipoReferenteClasseUtenteEnum.ASSOCIATO);
        //classiUtenteController.createReferenteClasseUtente(cu.getBody().getIdClasseUtente(), rc);
        
        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setPrincipal(UTENTE_QUALSIASI_APPARTENENTE_CLASSE_UTENTI);
        List<UUID> classiUtente = new ArrayList<UUID>();
        classiUtente.add(cu.getBody().getIdClasseUtente());
        utente.setClassiUtente(classiUtente);
        utente.setNome("Utente");
        utente.setCognome("Qualsiasi_appartenente_classe_utenti");
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utentiController.createUtente(utente);
        
        return cu.getBody();
    }
}
