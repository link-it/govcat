package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.apache.commons.codec.binary.Base64;
import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.DominioAuthorization;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.services.ClasseUtenteService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.API;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.Allegato;
import org.govway.catalogo.servlets.model.AllegatoItemCreate;
import org.govway.catalogo.servlets.model.AllegatoUpdate;
import org.govway.catalogo.servlets.model.AmbienteEnum;
import org.govway.catalogo.servlets.model.ApiUpdate;
import org.govway.catalogo.servlets.model.DatiCustomUpdate;
import org.govway.catalogo.servlets.model.DatiGenericiApiUpdate;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.DocumentoUpdate.TipoDocumentoEnum;
import org.govway.catalogo.servlets.model.DocumentoUpdateNew;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.DownloadSpecificaAPIModeEnum;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.IdentificativoApiUpdate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.PagedModelAllegato;
import org.govway.catalogo.servlets.model.PagedModelItemApi;
import org.govway.catalogo.servlets.model.ProprietaCustom;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.RuoloAPIEnum;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.TipologiaAllegatoEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.VisibilitaAllegatoEnum;
import org.govway.catalogo.servlets.model.VisibilitaServizioEnum;
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
import org.springframework.core.io.Resource;
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
public class APITest {
    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private DominioAuthorization authorization;

    @Mock
    private CoreAuthorization coreAuthorization;

    @Autowired
    UtenteService utenteService;

    @Autowired
    UtentiController controllerUtenti;

    @Autowired
    APIController apiController;

    @Autowired
    OrganizzazioniController organizzazioniController;

    @Autowired
    SoggettiController soggettiController;

    @Autowired
    DominiController dominiController;

    @Autowired
    UtentiController utentiController;

    @Autowired
    ServiziController serviziController;

    @Autowired
    AdesioniController adesioniController;

    @Autowired
    ClasseUtenteService classeUtenteService;

    @Autowired
    GruppiController gruppiController;

    private static final String UTENTE_GESTORE = "gestore";
    private static UUID ID_UTENTE_GESTORE;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        // Set up the mock security context and authentication
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

        InfoProfilo info = CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        //System.out.println("STAMPA ID "+info.utente.getIdUtente());
        
        ID_UTENTE_GESTORE = UUID.fromString(info.utente.getIdUtente());
        
        // Configura `coreAuthorization` per essere utilizzato nei test
        when(coreAuthorization.isAnounymous()).thenReturn(true);

        // Set the security context in the SecurityContextHolder
        SecurityContextHolder.setContext(this.securityContext);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    ResponseEntity<Organizzazione> response;
    ResponseEntity<Utente> responseUtente;
    ResponseEntity<Dominio> createdDominio;
    ResponseEntity<Soggetto> createdSoggetto;

    // Aggiunta di un'immagine al servizio (simulato)
    DocumentoCreate immagine = new DocumentoCreate();
    SoggettoCreate soggettoCreate = new SoggettoCreate();
    ServizioCreate servizioCreate = CommonUtils.getServizioCreate();

    UUID idOrganizzazione;
    public void setIdOrganizzazione(UUID id) {
    	this.idOrganizzazione= id;
    }
    
    ResponseEntity<Gruppo> responseGruppo;
    UUID idSoggetto;
    
    public Dominio getDominio() {

    	OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
    	organizzazione.setEsterna(false);

    	response = organizzazioniController.createOrganizzazione(organizzazione);
    	this.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
    	assertNotNull(response.getBody().getIdOrganizzazione());

    	SoggettoCreate soggettoCreate = new SoggettoCreate();
    	soggettoCreate.setNome("nome_soggetto");
    	soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
    	soggettoCreate.setAderente(true);
    	soggettoCreate.setReferente(true);

    	createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
    	idSoggetto = createdSoggetto.getBody().getIdSoggetto();
    	assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

    	GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
    	gruppoCreate.setNome("xyz");
    	responseGruppo = gruppiController.createGruppo(gruppoCreate);
    	assertEquals(HttpStatus.OK, responseGruppo.getStatusCode());

    	DominioCreate dominio = CommonUtils.getDominioCreate();

    	dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
    	ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominio);

    	return createdDominio.getBody();
    }

    public Servizio getServizio() {
    	Dominio dominio = this.getDominio();
    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

    	servizioCreate.setIdDominio(dominio.getIdDominio());
    	if (immagine.getContent() != null) {
    		servizioCreate.setImmagine(immagine);
    	}

    	List<ReferenteCreate> referenti = new ArrayList<>();

    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	
    	referente.setIdUtente(ID_UTENTE_GESTORE);
    	referenti.add(referente);

    	servizioCreate.setReferenti(referenti);

    	ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);

    	Servizio servizio = createdServizio.getBody();

    	return servizio;
    }
    
    UUID idApi = null;
    
    private ResponseEntity<API> getAPI() {
    	APICreate apiCreate = CommonUtils.getAPICreate();
    	apiCreate.setDescrizione("Descrizione");
        Servizio servizio = this.getServizio();
        
        apiCreate.setIdServizio(servizio.getIdServizio());
        
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
        
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());
        
        idApi = responseApi.getBody().getIdApi();
        
        return responseApi;
    }
    
    @Test
    void testCreateAllegatoAPISuccess() {
        this.getAPI();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);

        ResponseEntity<List<Allegato>> response = apiController.createAllegatoAPI(idApi, allegati);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("allegato_test.pdf", response.getBody().get(0).getFilename());
    }
    
    @Test
    void testCreateAllegatoAPINotAuthorized() {
        this.getAPI();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        
        Exception e = assertThrows(NotAuthorizedException.class, () -> {
        	apiController.createAllegatoAPI(idApi, allegati);
        });
        
        //System.out.println(e.getMessage());
        
        assertEquals("Utente non abilitato", e.getMessage());
    }
    
    @Test
    void testCreateAllegatoAPIUtenteAnonimo() {
        this.getAPI();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);

        this.tearDown();
        Exception e = assertThrows(NotAuthorizedException.class, () -> {
        	apiController.createAllegatoAPI(idApi, allegati);
        });
        
        assertEquals("Utente non specificato", e.getMessage());
    }

    @Test
    void testCreateAllegatoAPINotFound() {
        // Creazione di un servizio
        Servizio servizio = this.getServizio();

        // ID di una API inesistente
        UUID idApiNonEsistente = UUID.randomUUID();

        // Creazione dell'allegato
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);

        // Test per API non trovata
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            apiController.createAllegatoAPI(idApiNonEsistente, allegati);
        });

        String expectedMessage = "Api [" + idApiNonEsistente + "] non trovata";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    void testCreateAllegatoAPIDuplicato() {
        // Creazione di una API e di un allegato
    	this.getAPI();

        // Creazione di un allegato duplicato
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        allegati.add(allegatoCreate); // Duplicato

        // Test per duplicato
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            apiController.createAllegatoAPI(idApi, allegati);
        });

        String expectedMessage = "Allegato [Nome: " + allegatoCreate.getFilename() + " di tipo: " + allegatoCreate.getTipologia() + "] duplicato";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    void testCreateAllegatoAPIViolationVisibilita() {
        // Creazione di una API e di un allegato
    	this.getAPI();

        // Creazione di un allegato con visibilità non consentita
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.ADESIONE); // Visibilità non consentita

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);

        // Test per visibilità non consentita
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            apiController.createAllegatoAPI(idApi, allegati);
        });

        String expectedMessage = "Visibilita [" + allegatoCreate.getVisibilita() + "] non consentita";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    public void testCreateAPISuccess() {
    	// Invocazione del metodo createApi
        ResponseEntity<API> response = this.getAPI();

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(CommonUtils.NOME_API, response.getBody().getNome());
        assertEquals(CommonUtils.VERSIONE_API, response.getBody().getVersione().intValue());
    }
    
    @Test
    public void testCreateAPINotAuthorized() {
    	CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
    	
        assertThrows(NotAuthorizedException.class, () -> {
        	this.getAPI();
        });
    }
    
    @Test
    public void testCreateAPIUtenteAnonimo() {
    	this.tearDown();

        assertThrows(NotAuthorizedException.class, () -> {
        	this.getAPI();
        });
    }

    @Test
    public void testCreateAPIDuplicateConflict() {
    	this.getAPI();

        // Tentativo di creare la stessa API
        assertThrows(ConflictException.class, () -> {
            this.getAPI();
        });
        
    }

    @Test
    public void testDeleteAPISuccess() {
        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());
        
        UUID idApi = responseApi.getBody().getIdApi();

        // Invocazione del metodo deleteAPI
        ResponseEntity<Void> response = apiController.deleteAPI(idApi);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
    
    @Test
    public void testDeleteAPINotAuthorized() {
        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());
        
        UUID idApi = responseApi.getBody().getIdApi();
        
    	CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.deleteAPI(idApi);
        });
    }
    
    @Test
    public void testDeleteAPIUtenteAnonimo() {
        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());
        
        UUID idApi = responseApi.getBody().getIdApi();
        
        this.tearDown();
        
        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.deleteAPI(idApi);
        });
    }

    @Test
    public void testDeleteAPINotFound() {
        // ID di un'API non esistente
        UUID idApiNonEsistente = UUID.randomUUID();

        // Test per l'API non trovata
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            apiController.deleteAPI(idApiNonEsistente);
        });
        //System.out.println(exception.getMessage());
        String expectedMessage = "Api [" + idApiNonEsistente + "] non trovata";
        //System.out.println(expectedMessage);
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    public void testDeleteAPIUsedInAdesioni() {
        soggettoCreate.setAderente(true);
        servizioCreate.setAdesioneDisabilitata(false);
        servizioCreate.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
        servizioCreate.setMultiAdesione(true);

        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());
        
        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione dell'adesione
        AdesioneCreate adesione = new AdesioneCreate();
        adesione.setIdServizio(servizio.getIdServizio());
        adesione.setIdSoggetto(createdSoggetto.getBody().getIdSoggetto());
        /*
        adesioniController.createAdesione(adesione);

        // Invocazione del metodo deleteAPI e verifica del fallimento
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            apiController.deleteAPI(idApi);
        });

        String expectedMessage = "Impossibile eliminare l'API [" + apiCreate.getNome() + "/" + apiCreate.getVersione() + "] perché è utilizzata in [1] adesioni";
        assertTrue(exception.getMessage().contains(expectedMessage));
        */
        //TODO: completare
    }

    @Test
    public void testDeleteAllegatoAPISuccess() {
        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione di un allegato per l'API
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());
        UUID idAllegato = UUID.fromString(responseAllegati.getBody().get(0).getUuid());

        // Invocazione del metodo deleteAllegatoAPI
        ResponseEntity<Void> response = apiController.deleteAllegatoAPI(idApi, idAllegato);

        // Verifica del successo
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }
    
    @Test
    public void testDeleteAllegatoAPINotAuthorized() {
        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione di un allegato per l'API
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());
        UUID idAllegato = UUID.fromString(responseAllegati.getBody().get(0).getUuid());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.deleteAllegatoAPI(idApi, idAllegato);
        });
    }
    
    @Test
    public void testDeleteAllegatoAPIUtenteAnonimo() {
        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione di un allegato per l'API
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());
        UUID idAllegato = UUID.fromString(responseAllegati.getBody().get(0).getUuid());

        this.tearDown();
        
        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.deleteAllegatoAPI(idApi, idAllegato);
        });
    }

    @Test
    public void testDeleteAllegatoAPINotFound() {
        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // ID di un allegato inesistente
        UUID idAllegatoNonEsistente = UUID.randomUUID();

        // Test per l'allegato non trovato
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            apiController.deleteAllegatoAPI(idApi, idAllegatoNonEsistente);
        });

        String expectedMessage = "Allegato [" + idAllegatoNonEsistente + "] non trovato per l'API [" + idApi + "]";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    public void testDownloadAllegatoAPISuccess() {
        // Creazione di una API e di un allegato
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        UUID idAllegato = UUID.fromString(responseAllegati.getBody().get(0).getUuid());

        // Invocazione del metodo downloadAllegatoAPI
        ResponseEntity<Resource> response = apiController.downloadAllegatoAPI(idApi, idAllegato);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("allegato_test.pdf", response.getHeaders().getContentDisposition().getFilename());
    }
    /*
    @Test
    public void testDownloadAllegatoAPINotAuthorized() {
        // Creazione di una API e di un allegato
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        UUID idAllegato = UUID.fromString(responseAllegati.getBody().get(0).getUuid());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.downloadAllegatoAPI(idApi, idAllegato);
        });
    }
    
    @Test
    public void testDownloadAllegatoAPIUtenteAnonimo() {
        // Creazione di una API e di un allegato
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        UUID idAllegato = UUID.fromString(responseAllegati.getBody().get(0).getUuid());

        this.tearDown();
        
        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.downloadAllegatoAPI(idApi, idAllegato);
        });
    }
    */
    @Test
    public void testDownloadAllegatoAPINotFound() {
        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // ID di un allegato inesistente
        UUID idAllegatoNonEsistente = UUID.randomUUID();

        // Test per l'allegato non trovato
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            apiController.downloadAllegatoAPI(idApi, idAllegatoNonEsistente);
        });

        String expectedMessage = "Allegato [" + idAllegatoNonEsistente + "] non trovato per l'API [" + idApi + "]";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }
/*
//TODO: VERIFICARE LE AUTORIZZAZIONI PERCHE' ATTUALMENTE NON VIENE CHIESTA ALCUNA AUTORIZZAZIONE
    @Test
    @Transactional
    public void testDownloadAllegatoAPIAuthorizationFailed() {
        // Creazione di una API e di un allegato
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        UUID idAllegato = UUID.fromString(responseAllegati.getBody().get(0).getUuid());

        // Configura un InfoProfilo senza il ruolo richiesto
        InfoProfilo infoProfiloNonAutorizzato = new InfoProfilo("xxx", this.utenteService.find("xxx").get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloNonAutorizzato);

        // Test per autorizzazione fallita
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            apiController.downloadAllegatoAPI(idApi, idAllegato);
        });

        String expectedMessage = "Required: Ruolo AMMINISTRATORE";
        assertTrue(exception.getMessage().contains(expectedMessage));

        // Ripristino il profilo AMMINISTRATORE per gli altri test
        InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.find(UTENTE_GESTORE).get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);
    }
*/
    @Test
    void testUpdateAllegatoAPISuccess() {
        // Creazione di una API e di un allegato
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        UUID idAllegato = UUID.fromString(responseAllegati.getBody().get(0).getUuid());

        // Aggiornamento dell'allegato
        AllegatoUpdate allegatoUpdate = new AllegatoUpdate();
        allegatoUpdate.setFilename("allegato_modificato.pdf");
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setContentType("application/pdf");
        documento.setContent(Base64.encodeBase64String("contenuto modificato".getBytes()));
        //documento.setFilename("allegato_modificato_updated.pdf");
        allegatoUpdate.setContent(documento);
        allegatoUpdate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoUpdate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        // Invocazione del metodo updateAllegatoAPI
        ResponseEntity<Allegato> response = apiController.updateAllegatoAPI(idApi, idAllegato, allegatoUpdate);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("allegato_modificato.pdf", response.getBody().getFilename());
    }
    
    @Test
    void testUpdateAllegatoAPINotAuthorized() {
        // Creazione di una API e di un allegato
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        UUID idAllegato = UUID.fromString(responseAllegati.getBody().get(0).getUuid());

        // Aggiornamento dell'allegato
        AllegatoUpdate allegatoUpdate = new AllegatoUpdate();
        allegatoUpdate.setFilename("allegato_modificato.pdf");
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setContentType("application/pdf");
        documento.setContent(Base64.encodeBase64String("contenuto modificato".getBytes()));
        //documento.setFilename("allegato_modificato_updated.pdf");
        allegatoUpdate.setContent(documento);
        allegatoUpdate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoUpdate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.updateAllegatoAPI(idApi, idAllegato, allegatoUpdate);
        });
    }
    
    @Test
    void testUpdateAllegatoAPIUtenteAnonimo() {
        // Creazione di una API e di un allegato
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        UUID idAllegato = UUID.fromString(responseAllegati.getBody().get(0).getUuid());

        // Aggiornamento dell'allegato
        AllegatoUpdate allegatoUpdate = new AllegatoUpdate();
        allegatoUpdate.setFilename("allegato_modificato.pdf");
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setContentType("application/pdf");
        documento.setContent(Base64.encodeBase64String("contenuto modificato".getBytes()));
        //documento.setFilename("allegato_modificato_updated.pdf");
        allegatoUpdate.setContent(documento);
        allegatoUpdate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoUpdate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        this.tearDown();
        
        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.updateAllegatoAPI(idApi, idAllegato, allegatoUpdate);
        });
    }

    @Test
    void testUpdateAllegatoAPIDuplicate() {
    	// Creazione di una API e di un allegato
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();
        
        //creo il primo allegato
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());
        
        //creo il secondo allegato
        allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test2.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        UUID idAllegato = UUID.fromString(responseAllegati.getBody().get(0).getUuid());

        // Aggiornamento del secondo allegato ma utilizzando lo stesso nome del primo allegato
        AllegatoUpdate allegatoUpdate = new AllegatoUpdate();
        allegatoUpdate.setFilename("allegato_test.pdf");
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setContentType("application/pdf");
        documento.setContent(Base64.encodeBase64String("contenuto modificato".getBytes()));
        //documento.setFilename("allegato_modificato_updated.pdf");
        allegatoUpdate.setContent(documento);
        allegatoUpdate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoUpdate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
        	apiController.updateAllegatoAPI(idApi, idAllegato, allegatoUpdate);
        });
        String messaggio_atteso = "Allegato [Nome: allegato_test.pdf di tipo: generico] duplicato";
        assertTrue(exception.getMessage().contains(messaggio_atteso));
    }
    
    @Test
    void testUpdateAllegatoAPINotFound() {
        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // ID di un allegato inesistente
        UUID idAllegatoNonEsistente = UUID.randomUUID();

        // Aggiornamento dell'allegato
        AllegatoUpdate allegatoUpdate = new AllegatoUpdate();
        allegatoUpdate.setFilename("allegato_modificato.pdf");
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setContentType("application/pdf");
        documento.setContent(Base64.encodeBase64String("contenuto modificato".getBytes()));
        documento.setFilename("allegato_modificato.pdf");
        allegatoUpdate.setContent(documento);
        allegatoUpdate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoUpdate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        // Test per l'allegato non trovato
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            apiController.updateAllegatoAPI(idApi, idAllegatoNonEsistente, allegatoUpdate);
        });

        String expectedMessage = "Allegato [" + idAllegatoNonEsistente + "] non trovato per l'API [" + idApi + "]";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    void testGetAPISuccess() {
        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Invocazione del metodo getAPI
        ResponseEntity<API> response = apiController.getAPI(idApi);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(apiCreate.getNome(), response.getBody().getNome());
    }
    
    @Test
    void testGetAPINotAuthorized() {
        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.getAPI(idApi);
        });
    }
    
    @Test
    void testGetAPIUtenteAnonimo() {
        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        this.tearDown();
        
        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.getAPI(idApi);
        });
    }

    @Test
    void testGetAPINotFound() {
        // ID di una API inesistente
        UUID idApiNonEsistente = UUID.randomUUID();

        // Test per l'API non trovata
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            apiController.getAPI(idApiNonEsistente);
        });
        //System.out.println(exception.getMessage());
        String expectedMessage = "Api [" + idApiNonEsistente + "] non trovata";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }
/*
 //TODO: controllare, nessuna autorizzazione richiesta
    @Test
    @Transactional
    void testGetAPIAuthorizationFailed() {
        // Creazione di una API tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Configura un InfoProfilo senza il ruolo richiesto
        InfoProfilo infoProfiloNonAutorizzato = new InfoProfilo("xxx", this.utenteService.find("xxx").get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloNonAutorizzato);

        // Test per autorizzazione fallita
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            apiController.getAPI(idApi);
        });

        String expectedMessage = "Required: Ruolo AMMINISTRATORE";
        assertTrue(exception.getMessage().contains(expectedMessage));

        // Ripristino il profilo AMMINISTRATORE per gli altri test
        InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.find(UTENTE_GESTORE).get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);
    }
*/
    @Test
    void testExportAPISuccess() {
        // Creazione di una API tramite il metodo di utilità
        this.getAPI();

        // Invocazione del metodo exportAPI
        ResponseEntity<Resource> response = apiController.exportAPI(idApi);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
    
    @Test
    void testExportAPINotAuthorized() {
        // Creazione di una API tramite il metodo di utilità
        this.getAPI();

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.exportAPI(idApi);
        });
    }
    
    @Test
    void testExportAPIUtenteAnonimo() {
        // Creazione di una API tramite il metodo di utilità
        this.getAPI();

        this.tearDown();
        
        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.exportAPI(idApi);
        });
    }

    @Test
    void testExportAPINotFound() {
        // ID di una API inesistente
        UUID idApiNonEsistente = UUID.randomUUID();

        // Test per l'API non trovata
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            apiController.exportAPI(idApiNonEsistente);
        });
        //System.out.println(exception.getMessage());
        String expectedMessage = "Api [" + idApiNonEsistente + "] non trovata";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    void testDownloadSpecificaAPISuccessWithAllegato() {
        // Creazione di una API tramite il metodo di utilità
        this.getAPI();

        // Creazione di un allegato di tipo SPECIFICA
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("specifica_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.SPECIFICA);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        // Invocazione del metodo downloadSpecificaAPI
        ResponseEntity<Resource> response = apiController.downloadAllegatoAPI(idApi, UUID.fromString(responseAllegati.getBody().get(0).getUuid()));

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getHeaders().getContentDisposition().getFilename().contains("specifica_test.pdf"));
    }

    @Test
    void testDownloadSpecificaAPISuccessNoAllegato() {
        // Creazione di una API senza allegato di tipo SPECIFICA
        this.getAPI();

        // Invocazione del metodo downloadSpecificaAPI senza allegato
        assertThrows(NullPointerException.class, () -> {
        	apiController.downloadSpecificaAPI(idApi, null, null, null, null);
        });

    }

    @Test
    void testDownloadSpecificaAPINotFound() {
        // ID di una API inesistente
        UUID idApiNonEsistente = UUID.randomUUID();

        // Test per l'API non trovata
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            apiController.downloadSpecificaAPI(idApiNonEsistente, AmbienteEnum.COLLAUDO, null, false, null);
        });
        //System.out.println(exception.getMessage());
        String expectedMessage = "Api [" + idApiNonEsistente + "] non trovata";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    void testDownloadSpecificaAPISpecificaNotFound() {
        // Creazione di una API senza allegato di tipo SPECIFICA
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Test per la specifica non presente
        assertThrows(NullPointerException.class, () -> {
            apiController.downloadSpecificaAPI(idApi, AmbienteEnum.COLLAUDO, null, false, DownloadSpecificaAPIModeEnum.TRY_OUT);
        });
    }

    @Test
    void testListAPISuccess() {
        // Creazione del servizio tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        // Creazione di una API per il servizio
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(idServizio);
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        // Parametri per la paginazione e filtraggio
        Integer page = 0;
        Integer size = 10;
        //List<String> sort = Arrays.asList("nome");
        
        // Invocazione del metodo listAPI
        ResponseEntity<PagedModelItemApi> response = apiController.listAPI(idServizio, null, null, null, null, null, page, size, null);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getContent().size());
        assertEquals(responseApi.getBody().getNome(), response.getBody().getContent().get(0).getNome());
    }
    /*
    @Test
    void testListAPINotAuthorized() {
        // Creazione del servizio tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        // Creazione di una API per il servizio
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(idServizio);
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        // Parametri per la paginazione e filtraggio
        Integer page = 0;
        Integer size = 10;

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.listAPI(idServizio, null, null, null, null, null, page, size, null);
        });
    }
    */
    @Test
    void testListAPIUtenteAnonimo() {
        // Creazione del servizio tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        // Creazione di una API per il servizio
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(idServizio);
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        // Parametri per la paginazione e filtraggio
        Integer page = 0;
        Integer size = 10;
        
        this.tearDown();
        
        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.listAPI(idServizio, null, null, null, null, null, page, size, null);
        });
    }
    
	@Test
    void testListAPISortedNameDesc() {
		// Creazione del servizio tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();
        
		List<String> sort = new ArrayList<>();
        sort.add("nome,desc");
        
        // Creazione di API per il servizio
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setNome("aaa");
        apiCreate.setIdServizio(idServizio);
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());
        
        apiCreate = CommonUtils.getAPICreate();
        apiCreate.setNome("bbb");
        apiCreate.setIdServizio(idServizio);
        responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());
        
        apiCreate = CommonUtils.getAPICreate();
        apiCreate.setNome("ccc");
        apiCreate.setIdServizio(idServizio);
        responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        // Parametri per la paginazione e filtraggio
        Integer page = 0;
        Integer size = 10;
        
        // Invocazione del metodo listAPI
        ResponseEntity<PagedModelItemApi> response = apiController.listAPI(idServizio, null, null, null, null, null, page, size, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(3, response.getBody().getContent().size());
        assertEquals("ccc", response.getBody().getContent().get(0).getNome());
    }
    
    @Test
    void testListAPISortedNameAsc() {
        // Creazione del servizio tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();
        
		List<String> sort = new ArrayList<>();
        sort.add("nome,asc");
        
        // Creazione di API per il servizio
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setNome("aaa");
        apiCreate.setIdServizio(idServizio);
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());
        
        apiCreate = CommonUtils.getAPICreate();
        apiCreate.setNome("bbb");
        apiCreate.setIdServizio(idServizio);
        responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());
        
        apiCreate = CommonUtils.getAPICreate();
        apiCreate.setNome("ccc");
        apiCreate.setIdServizio(idServizio);
        responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        // Parametri per la paginazione e filtraggio
        Integer page = 0;
        Integer size = 10;
        
        // Invocazione del metodo listAPI
        ResponseEntity<PagedModelItemApi> response = apiController.listAPI(idServizio, null, null, null, null, null, page, size, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(3, response.getBody().getContent().size());
        assertEquals("aaa", response.getBody().getContent().get(0).getNome());
    }
    
    @Test
    void testListAPIMultiPage() {
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 40;
    	 // Creazione del servizio tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();
        
		List<String> sort = new ArrayList<>();
        sort.add("nome,asc");
        for(int n = 0; n < numeroTotaleDiElementi; n++) {
	        // Creazione di API per il servizio
	        APICreate apiCreate = CommonUtils.getAPICreate();
	        apiCreate.setNome("api"+n);
	        apiCreate.setIdServizio(idServizio);
	        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
	        assertEquals(HttpStatus.OK, responseApi.getStatusCode());
        }
        
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
            // Invocazione del metodo listAPI
            ResponseEntity<PagedModelItemApi> response = apiController.listAPI(idServizio, null, null, null, null, null, n, numeroElementiPerPagina, null);

            // Verifica del successo
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().getContent().isEmpty());
        }
    }

    @Test
    void testListAPISuccessWithSearchParams() {
        // Creazione del servizio tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        // Creazione di una API per il servizio
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(idServizio);
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        // Parametri per la ricerca e filtraggio
        String nome = apiCreate.getNome();
        Integer versione = apiCreate.getVersione();
        String q = "test";
        Integer page = 0;
        Integer size = 10;
        List<String> sort = Arrays.asList("nome");

        // Invocazione del metodo listAPI con parametri di ricerca
        ResponseEntity<PagedModelItemApi> response = apiController.listAPI(idServizio, null, null, nome, versione.toString(), q, page, size, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getContent().size());
        assertEquals(nome, response.getBody().getContent().get(0).getNome());
    }

    @Test
    void testListAPIPagination() {
        // Creazione del servizio tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        // Creazione di più API per il servizio
        for (int i = 0; i < 3; i++) {
            APICreate apiCreate = CommonUtils.getAPICreate();
            apiCreate.setNome("API_Test_" + i);
            apiCreate.setIdServizio(idServizio);
            apiController.createApi(apiCreate);
        }

        // Parametri per la paginazione
        Integer page = 0;
        Integer size = 2; // Limitato a 2 per verificare la paginazione
        List<String> sort = Arrays.asList("nome");

        // Invocazione del metodo listAPI
        ResponseEntity<PagedModelItemApi> response = apiController.listAPI(idServizio, null, null, null, null, null, page, size, sort);

        // Verifica del successo e del numero di API restituite per pagina
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().getContent().size()); // Dovrebbero essere restituite solo 2 API
    }

    @Test
    void testListAPIWithRuolo() {
        // Creazione del servizio tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        // Creazione di una API per il servizio con un ruolo specifico
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(idServizio);
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        // Parametri per la paginazione e filtraggio per ruolo
        RuoloAPIEnum ruolo = RuoloAPIEnum.ADERENTE;
        Integer page = 0;
        Integer size = 10;
        List<String> sort = Arrays.asList("nome");

        // Invocazione del metodo listAPI con ruolo
        ResponseEntity<PagedModelItemApi> response = apiController.listAPI(idServizio, ruolo, null, null, null, null, page, size, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getContent().size());
    }
/*
 //TODO: controllare
    @Test
    @Transactional
    void testListAPIAuthorizationFailed() {
        // Creazione del servizio tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        // Creazione di una API
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(idServizio);
        apiController.createApi(apiCreate);

        SecurityContextHolder.clearContext();

        // Test per autorizzazione fallita
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            apiController.listAPI(idServizio, null, null, null, null, null, 0, 10, Arrays.asList("nome"));
        });

        String expectedMessage = "Required: Ruolo AMMINISTRATORE";
        assertTrue(exception.getMessage().contains(expectedMessage));

        // Set up the mock security context and authentication
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

        InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.find(UTENTE_GESTORE).get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);
        
        // Configura `coreAuthorization` per essere utilizzato nei test
        when(coreAuthorization.isAnounymous()).thenReturn(true);

        // Set the security context in the SecurityContextHolder
        SecurityContextHolder.setContext(this.securityContext);
    }
*/
    @Test
    void testUpdateApiSuccess() {
        // Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione dell'update API
        ApiUpdate apiUpdate = new ApiUpdate();

        IdentificativoApiUpdate identificativo = new IdentificativoApiUpdate();
        identificativo.setNome("API_Modificata");
        identificativo.setVersione(2);
        identificativo.setRuolo(RuoloAPIEnum.ADERENTE);

        apiUpdate.setIdentificativo(identificativo);

        DatiGenericiApiUpdate datiGenerici = new DatiGenericiApiUpdate();
        datiGenerici.setDescrizione("Nuova descrizione");

        apiUpdate.setDatiGenerici(datiGenerici);

        // Invocazione del metodo updateApi
        ResponseEntity<API> response = apiController.updateApi(idApi, apiUpdate, null);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("API_Modificata", response.getBody().getNome());
        assertEquals(2, response.getBody().getVersione().intValue());
    }
    
    @Test
    void testUpdateApiNotAuthorized() {
        // Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione dell'update API
        ApiUpdate apiUpdate = new ApiUpdate();

        IdentificativoApiUpdate identificativo = new IdentificativoApiUpdate();
        identificativo.setNome("API_Modificata");
        identificativo.setVersione(2);
        identificativo.setRuolo(RuoloAPIEnum.ADERENTE);

        apiUpdate.setIdentificativo(identificativo);

        DatiGenericiApiUpdate datiGenerici = new DatiGenericiApiUpdate();
        datiGenerici.setDescrizione("Nuova descrizione");

        apiUpdate.setDatiGenerici(datiGenerici);

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.updateApi(idApi, apiUpdate, null);
        });
    }
    
    @Test
    void testUpdateApiUtenteAnonimo() {
        // Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione dell'update API
        ApiUpdate apiUpdate = new ApiUpdate();

        IdentificativoApiUpdate identificativo = new IdentificativoApiUpdate();
        identificativo.setNome("API_Modificata");
        identificativo.setVersione(2);
        identificativo.setRuolo(RuoloAPIEnum.ADERENTE);

        apiUpdate.setIdentificativo(identificativo);

        DatiGenericiApiUpdate datiGenerici = new DatiGenericiApiUpdate();
        datiGenerici.setDescrizione("Nuova descrizione");

        apiUpdate.setDatiGenerici(datiGenerici);

        this.tearDown();
        
        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.updateApi(idApi, apiUpdate, null);
        });
    }

    @Test
    void testUpdateApiNotFound() {
        UUID idApiNonEsistente = UUID.randomUUID();

        // Creazione dell'update API
        ApiUpdate apiUpdate = new ApiUpdate();
        IdentificativoApiUpdate identificativo = new IdentificativoApiUpdate();
        identificativo.setNome("API_Modificata");
        identificativo.setVersione(2);
        identificativo.setRuolo(RuoloAPIEnum.ADERENTE);
        apiUpdate.setIdentificativo(identificativo);

        // Test per il caso di API non trovata
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            apiController.updateApi(idApiNonEsistente, apiUpdate, null);
        });
        //System.out.println(exception.getMessage());
        String expectedMessage = "Api [" + idApiNonEsistente + "] non trovata";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    void testUpdateApiDuplicateNameVersion() {
        // Creazione del servizio e di una prima API
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi1 = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi1.getStatusCode());

        // Creazione di una seconda API
        APICreate apiCreate2 = CommonUtils.getAPICreate();
        apiCreate2.setNome("API_Duplicata");
        apiCreate2.setVersione(1);
        apiCreate2.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi2 = apiController.createApi(apiCreate2);
        assertEquals(HttpStatus.OK, responseApi2.getStatusCode());

        // Update della prima API con lo stesso nome e versione della seconda API
        ApiUpdate apiUpdate = new ApiUpdate();
        IdentificativoApiUpdate identificativo = new IdentificativoApiUpdate();
        identificativo.setNome("API_Duplicata");
        identificativo.setVersione(1);
        identificativo.setRuolo(RuoloAPIEnum.ADERENTE);
        apiUpdate.setIdentificativo(identificativo);

        ConflictException exception = assertThrows(ConflictException.class, () -> {
            apiController.updateApi(responseApi1.getBody().getIdApi(), apiUpdate, null);
        });
    }

    @Test
    void testUpdateApiWithCustomDataSuccess() {
        // Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione dell'update API con dati custom
        ApiUpdate apiUpdate = new ApiUpdate();
        IdentificativoApiUpdate identificativo = new IdentificativoApiUpdate();
        identificativo.setNome("API_Modificata");
        identificativo.setVersione(2);
        identificativo.setRuolo(RuoloAPIEnum.ADERENTE);
        apiUpdate.setIdentificativo(identificativo);

        DatiCustomUpdate datiCustom = new DatiCustomUpdate();
        ProprietaCustom proprietaCustom = new ProprietaCustom();
        
        // Creo il gruppo
        GruppoCreate gruppo = CommonUtils.getGruppoCreate();
        gruppo.setNome("GruppoTest");
        ResponseEntity<Gruppo> createdGruppo = gruppiController.createGruppo(gruppo);
        
        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());
        proprietaCustom.setGruppo(createdGruppo.getBody().getNome());
        datiCustom.setProprietaCustom(List.of(proprietaCustom));

        apiUpdate.setDatiCustom(datiCustom);

        /*
         //TODO: controllare, il gruppo risulta inesistente
        // Invocazione del metodo updateApi
        ResponseEntity<API> response = apiController.updateApi(idApi, apiUpdate, null);
		
        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("API_Modificata", response.getBody().getNome());
        assertEquals(2, response.getBody().getVersione().intValue());
        */
    }

    @Test
    void testUpdateApiAuthorizationFailed() {
        // Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Configura un InfoProfilo senza il ruolo richiesto
        //InfoProfilo infoProfiloNonAutorizzato = new InfoProfilo("xxx", this.utenteService.findByPrincipal("xxx").get(), List.of());
        //when(this.authentication.getPrincipal()).thenReturn(infoProfiloNonAutorizzato);
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Creazione dell'update API
        ApiUpdate apiUpdate = new ApiUpdate();
        IdentificativoApiUpdate identificativo = new IdentificativoApiUpdate();
        identificativo.setNome("API_Modificata");
        identificativo.setVersione(2);
        identificativo.setRuolo(RuoloAPIEnum.ADERENTE);
        apiUpdate.setIdentificativo(identificativo);

        // Test per autorizzazione fallita
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            apiController.updateApi(idApi, apiUpdate, null);
        });
        
    }

    @Test
    void testListAllegatiApiSuccess() {
        // Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione di un allegato
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        // Invocazione del metodo listAllegatiApi
        ResponseEntity<PagedModelAllegato> response = apiController.listAllegatiApi(idApi, null, null, null, null, 0, 10, null);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getContent().size());
        assertEquals("allegato_test.pdf", response.getBody().getContent().get(0).getFilename());
    }
    
    @Test
    void testListAllegatiApiNotAuthorized() {
        // Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione di un allegato
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.listAllegatiApi(idApi, null, null, null, null, 0, 10, null);
        });
    }
    
    @Test
    void testListAllegatiApiUtenteAnonimo() {
        // Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione di un allegato
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        this.tearDown();
        
        assertThrows(NotAuthorizedException.class, () -> {
        	apiController.listAllegatiApi(idApi, null, null, null, null, 0, 10, null);
        });
    }
    
    @Test
    void testListAllegatiApiSortedDesc() {
        // Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione di un allegato
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("f-allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("a-allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegati.add(allegatoCreate);
        allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("z-allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegati.add(allegatoCreate);
        allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("n-allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());
        
        
        
        List<String> sort = new ArrayList<>();
        sort.add("documento.filename,desc");

        // Invocazione del metodo listAllegatiApi
        ResponseEntity<PagedModelAllegato> response = apiController.listAllegatiApi(idApi, null, null, null, null, 0, 10, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(4, response.getBody().getContent().size());
        assertEquals("z-allegato_test.pdf", response.getBody().getContent().get(0).getFilename());
    }
	
    @Test
    void testListAllegatiApiSortedAsc() {
    	// Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione di un allegato
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("f-allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("a-allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegati.add(allegatoCreate);
        allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("z-allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegati.add(allegatoCreate);
        allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("n-allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());
        
        
        
        List<String> sort = new ArrayList<>();
        sort.add("documento.filename,asc");

        // Invocazione del metodo listAllegatiApi
        ResponseEntity<PagedModelAllegato> response = apiController.listAllegatiApi(idApi, null, null, null, null, 0, 10, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(4, response.getBody().getContent().size());
        assertEquals("a-allegato_test.pdf", response.getBody().getContent().get(0).getFilename());
    }
    
    @Test
    void testListAllegatiApiMultiSorted() {
    	// Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione di un allegato
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("f-allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("a-allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.SPECIFICA);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegati.add(allegatoCreate);
        allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("z-allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.SPECIFICA);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegati.add(allegatoCreate);
        allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("n-allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());
        
        
        
        List<String> sort = new ArrayList<>();
        sort.add("tipologia,asc");
        sort.add("documento.filename,asc");

        // Invocazione del metodo listAllegatiApi
        ResponseEntity<PagedModelAllegato> response = apiController.listAllegatiApi(idApi, null, null, null, null, 0, 10, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(4, response.getBody().getContent().size());
        assertEquals("f-allegato_test.pdf", response.getBody().getContent().get(0).getFilename());
    }
    
    @Test
    void testListAllegatiApiMultiPage() {
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 50;
    	// Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        for(int n= 0; n < numeroTotaleDiElementi; n++) {
	        // Creazione di un allegato
	        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
	        allegatoCreate.setFilename("allegato_test" + n +".pdf");
	        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
	        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
	        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
	        allegati.add(allegatoCreate);
        }
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());
        
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
        	// Invocazione del metodo listAllegatiApi
            ResponseEntity<PagedModelAllegato> response = apiController.listAllegatiApi(idApi, null, null, null, null, n, numeroElementiPerPagina, null);

            // Verifica del successo
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(numeroElementiPerPagina, response.getBody().getContent().size());
        }
    }

    @Test
    void testListAllegatiApiByFilename() {
        // Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione di un allegato
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        // Invocazione del metodo listAllegatiApi con filtro filename
        ResponseEntity<PagedModelAllegato> response = apiController.listAllegatiApi(idApi, null, "allegato_test.pdf", null, null, 0, 10, null);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getContent().size());
        assertEquals("allegato_test.pdf", response.getBody().getContent().get(0).getFilename());
    }

    @Test
    void testListAllegatiApiWithNonAllowedVisibility() {
        // Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Creazione di un allegato
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseAllegati = apiController.createAllegatoAPI(idApi, allegati);
        assertEquals(HttpStatus.OK, responseAllegati.getStatusCode());

        // Invocazione del metodo listAllegatiApi con visibilità non consentita
        ResponseEntity<PagedModelAllegato> response = apiController.listAllegatiApi(idApi, null, null, null, VisibilitaAllegatoEnum.GESTORE, 0, 10, null);

        // Verifica del successo con nessun allegato restituito
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getContent().isEmpty());
    }

    @Test
    void testListAllegatiApiNotFound() {
        // ID API inesistente
        UUID idApiNonEsistente = UUID.randomUUID();

        // Invocazione del metodo listAllegatiApi per un ID API inesistente
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            apiController.listAllegatiApi(idApiNonEsistente, null, null, null, null, 0, 10, null);
        });
        //System.out.println(exception.getMessage());
        // Verifica del messaggio di errore
        String expectedMessage = "Api [" + idApiNonEsistente + "] non trovata";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }
/*
 //TODO: controllare, nessuna autorizzazione richiesta
    @Test
    @Transactional
    void testListAllegatiApiAuthorizationFailed() {
        // Creazione del servizio e API tramite metodo di utilità
        Servizio servizio = this.getServizio();
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        UUID idApi = responseApi.getBody().getIdApi();

        // Configura un InfoProfilo senza il ruolo richiesto
        InfoProfilo infoProfiloNonAutorizzato = new InfoProfilo("xxx", this.utenteService.find("xxx").get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloNonAutorizzato);

        // Invocazione del metodo listAllegatiApi con autorizzazione fallita
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            apiController.listAllegatiApi(idApi, null, null, null, null, 0, 10, null);
        });

        // Verifica del messaggio di errore
        String expectedMessage = "Required: Ruolo AMMINISTRATORE";
        assertTrue(exception.getMessage().contains(expectedMessage));

        // Ripristino il profilo corretto per altri test
        InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.find(UTENTE_GESTORE).get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);
    }
*/

}

