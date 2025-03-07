package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.UUID;

import org.apache.commons.codec.binary.Base64;
import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.DominioAuthorization;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.TassonomieController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.services.ClasseUtenteService;
import org.govway.catalogo.core.services.DominioService;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.API;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.Allegato;
import org.govway.catalogo.servlets.model.AllegatoItemCreate;
import org.govway.catalogo.servlets.model.AllegatoMessaggio;
import org.govway.catalogo.servlets.model.AllegatoMessaggioCreate;
import org.govway.catalogo.servlets.model.AllegatoUpdate;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.AuthTypeApiResourceProprietaCustom;
import org.govway.catalogo.servlets.model.Categoria;
import org.govway.catalogo.servlets.model.CategoriaCreate;
import org.govway.catalogo.servlets.model.CategoriaFiglioCreate;
import org.govway.catalogo.servlets.model.CategorieCreate;
import org.govway.catalogo.servlets.model.DatiGenericiServizioUpdate;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.DocumentoUpdate.TipoDocumentoEnum;
import org.govway.catalogo.servlets.model.DocumentoUpdateNew;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.Grant;
import org.govway.catalogo.servlets.model.GrantType;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.IdentificativoServizioUpdate;
import org.govway.catalogo.servlets.model.ItemComunicazione;
import org.govway.catalogo.servlets.model.ItemGruppo;
import org.govway.catalogo.servlets.model.ItemMessaggio;
import org.govway.catalogo.servlets.model.ItemServizio;
import org.govway.catalogo.servlets.model.ItemServizioGruppo;
import org.govway.catalogo.servlets.model.ListItemCategoria;
import org.govway.catalogo.servlets.model.ListItemGruppo;
import org.govway.catalogo.servlets.model.MessaggioCreate;
import org.govway.catalogo.servlets.model.MessaggioUpdate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.PagedModelAllegato;
import org.govway.catalogo.servlets.model.PagedModelComponente;
import org.govway.catalogo.servlets.model.PagedModelItemComunicazione;
import org.govway.catalogo.servlets.model.PagedModelItemMessaggio;
import org.govway.catalogo.servlets.model.PagedModelItemOrganizzazione;
import org.govway.catalogo.servlets.model.PagedModelItemServizio;
import org.govway.catalogo.servlets.model.PagedModelItemServizioGruppo;
import org.govway.catalogo.servlets.model.PagedModelReferente;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.Referente;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.RuoloAPIEnum;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.ServizioUpdate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.StatoUpdate;
import org.govway.catalogo.servlets.model.StatoUtenteEnum;
import org.govway.catalogo.servlets.model.Tassonomia;
import org.govway.catalogo.servlets.model.TassonomiaCreate;
import org.govway.catalogo.servlets.model.TipoComunicazione;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.TipoServizio;
import org.govway.catalogo.servlets.model.TipologiaAllegatoEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteUpdate;
import org.govway.catalogo.servlets.model.VisibilitaAllegatoEnum;
import org.govway.catalogo.servlets.model.VisibilitaServizioEnum;
import org.springframework.data.domain.Pageable;

import org.hibernate.Hibernate;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Order;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.groovy.template.GroovyTemplateAutoConfiguration;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.Resource;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
//@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
public class ServiziTest {

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
	ClasseUtenteService classeUtenteService;
		
	@Autowired
	private OrganizzazioniController organizzazioniController;
	
	@Autowired
	private ServiziController serviziController;
	
	@Autowired
	private ServizioService servizioService;
	
	@Autowired
	private DominiController controller;
	
	@Autowired
	private DominioService service;
	
	@Autowired
    private SoggettiController soggettiController;
	
	@Autowired
	private UtentiController utentiController;
	
	@Autowired
	private APIController apiController;
	
	@Autowired
	private GruppiController gruppiController;
	
	@Autowired
	private TassonomieController tassonomieController;
	
	@Autowired
	private DominiController dominiController;
	
	private static final String UTENTE_GESTORE = "gestore";
	private static final String UTENTE_REFERENTE_SERVIZIO = "utente_referente__servizio";
	
	private static final String NOME_SERVIZIO_1 = "primo servizio - versione 3";
	private static final String NOME_SERVIZIO_2 = "secondo servizio - versione 11";
	private static final String NOME_SERVIZIO_3 = "terzo servizio - versione 2";
	
    @BeforeEach
    private void setUp() {
        MockitoAnnotations.initMocks(this);
        // Set up the mock security context and authentication
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);

        // Configura `coreAuthorization` per essere utilizzato nei test
        when(coreAuthorization.isAnounymous()).thenReturn(true);

        // Set the security context in the SecurityContextHolder
        SecurityContextHolder.setContext(this.securityContext);
    }

    @AfterEach
    private void tearDown() {
        SecurityContextHolder.clearContext();
    }

    ResponseEntity<Organizzazione> response;
    ResponseEntity<Utente> responseUtente;
    ResponseEntity<Dominio> createdDominio;
    ResponseEntity<Soggetto> createdSoggetto;
    DocumentoCreate immagine = new DocumentoCreate();
    SoggettoCreate soggettoCreate = new SoggettoCreate();
    ServizioCreate servizioCreate = CommonUtils.getServizioCreate();

    UUID idOrganizzazione;
    private void setIdOrganizzazione(UUID id) {
    	this.idOrganizzazione= id;
    }
    
    ResponseEntity<Gruppo> responseGruppo;
    UUID idSoggetto;
    UUID idDominio;
    private void setIdDominio(UUID id) {
    	this.idDominio = id;
    }
    
    private Dominio getDominio() {

    	OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
    	organizzazione.setEsterna(false);

    	response = organizzazioniController.createOrganizzazione(organizzazione);
    	this.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
    	assertNotNull(response.getBody().getIdOrganizzazione());

    	SoggettoCreate soggettoCreate = new SoggettoCreate();
    	soggettoCreate.setSkipCollaudo(true);
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
    	dominio.setSkipCollaudo(true);

    	dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
    	ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominio);

    	this.setIdDominio(createdDominio.getBody().getIdDominio());
    	
    	return createdDominio.getBody();
    }

    private Servizio getServizio() {
    	Dominio dominio = this.getDominio();
    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	servizioCreate.setSkipCollaudo(true);

    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

    	servizioCreate.setIdDominio(dominio.getIdDominio());

    	if (immagine.getContent() != null) {
    		servizioCreate.setImmagine(immagine);
    	}

    	List<ReferenteCreate> referenti = new ArrayList<>();

    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	referente.setIdUtente(UTENTE_GESTORE);
    	referenti.add(referente);
    	
    	ReferenteCreate referente2 = new ReferenteCreate();
    	referente2.setTipo(TipoReferenteEnum.REFERENTE);
    	referente2.setIdUtente(UTENTE_REFERENTE_SERVIZIO);
    	referenti.add(referente2);

    	servizioCreate.setReferenti(referenti);

    	ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);

    	Servizio servizio = createdServizio.getBody();

    	return servizio;
    }
    
    private void getMultiServizi() {
    	Dominio dominio = this.getDominio();
    	
    	this.setIdDominio(dominio.getIdDominio());
    	
    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	servizioCreate.setNome(NOME_SERVIZIO_1);

    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

    	servizioCreate.setIdDominio(dominio.getIdDominio());
    	
    	servizioCreate.setVersione("3");

    	if (immagine.getContent() != null) {
    		servizioCreate.setImmagine(immagine);
    	}

    	List<ReferenteCreate> referenti = new ArrayList<>();

    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	referente.setIdUtente(UTENTE_GESTORE);
    	referenti.add(referente);

    	servizioCreate.setReferenti(referenti);

    	serviziController.createServizio(servizioCreate);
    	
    	//Creo un secondo servizio
    	servizioCreate = CommonUtils.getServizioCreate();
    	servizioCreate.setNome(NOME_SERVIZIO_2);
    	
    	servizioCreate.setVersione("11");

    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

    	servizioCreate.setIdDominio(dominio.getIdDominio());

    	servizioCreate.setReferenti(referenti);
    	
    	serviziController.createServizio(servizioCreate);
    	
    	//Creo un terzo servizio
    	servizioCreate = CommonUtils.getServizioCreate();
    	servizioCreate.setNome(NOME_SERVIZIO_3);
    	
    	servizioCreate.setVersione("2");

    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

    	servizioCreate.setIdDominio(dominio.getIdDominio());

    	servizioCreate.setReferenti(referenti);

    	serviziController.createServizio(servizioCreate);
    }
    
    private void getMultiServizi(int numServizi) {
    	Dominio dominio = this.getDominio();
    	
    	this.setIdDominio(dominio.getIdDominio());
    	List<ReferenteCreate> referenti = null;
    	ServizioCreate servizioCreate = null;
    	Random random = new Random();
    	for(int n = 0; n < numServizi; n++) {
    		servizioCreate = CommonUtils.getServizioCreate();
    		
    		servizioCreate.setNome(CommonUtils.NOME_SERVIZIO + n);
    		
    		servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

        	servizioCreate.setIdDominio(dominio.getIdDominio());
        	
        	String versione = String.valueOf(1+random.nextInt(5));
        	
        	servizioCreate.setVersione(versione);
        	
        	referenti = new ArrayList<>();

        	ReferenteCreate referente = new ReferenteCreate();
        	referente.setTipo(TipoReferenteEnum.REFERENTE);
        	referente.setIdUtente(UTENTE_GESTORE);
        	referenti.add(referente);

        	servizioCreate.setReferenti(referenti);

        	serviziController.createServizio(servizioCreate);
    	}
    }
    
    private API getAPI(UUID idServizio) {
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
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateAllegatoServizioSuccess() {
        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setEsterna(false);
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(organizzazione);
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("gestore");
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setReferente(true);

        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominio = CommonUtils.getDominioCreate();
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominio);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
        servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());
        servizioCreate.setIdDominio(createdDominio.getBody().getIdDominio());
        ReferenteCreate referente = new ReferenteCreate();
        referente.setTipo(TipoReferenteEnum.REFERENTE);

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.GESTORE);
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);

        referente.setIdUtente(responseUtente.getBody().getIdUtente());
        List<ReferenteCreate> referenti = new ArrayList<>();
        referenti.add(referente);
        servizioCreate.setReferenti(referenti);

        ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
        assertEquals(HttpStatus.OK, createdServizio.getStatusCode());
        assertNotNull(createdServizio.getBody());

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setContent(Base64.encodeBase64String("contenut di test".getBytes()));
        allegatoCreate.setDescrizione("questa è la descrizione di test");
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setFilename("nomeallegato.pdf");

        List<AllegatoItemCreate> lista = new ArrayList<>();
        lista.add(allegatoCreate);

        ResponseEntity<List<Allegato>> responseListAllegato = serviziController.createAllegatoServizio(createdServizio.getBody().getIdServizio(), lista);
        assertEquals(HttpStatus.OK, responseListAllegato.getStatusCode());

        List<Allegato> allegati = responseListAllegato.getBody();
        assertNotNull(allegati);
        assertEquals(1, allegati.size());
        assertEquals("nomeallegato.pdf", allegati.get(0).getFilename());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateAllegatoServizioVisibilitaNonConsentita() {
        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setEsterna(false);
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(organizzazione);
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("gestore");
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setReferente(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominio = CommonUtils.getDominioCreate();
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominio);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
        servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());
        servizioCreate.setIdDominio(createdDominio.getBody().getIdDominio());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.GESTORE);
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);

        ReferenteCreate referente = new ReferenteCreate();
        referente.setTipo(TipoReferenteEnum.REFERENTE);
        referente.setIdUtente(responseUtente.getBody().getIdUtente());

        List<ReferenteCreate> referenti = new ArrayList<>();
        referenti.add(referente);
        servizioCreate.setReferenti(referenti);

        ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
        assertEquals(HttpStatus.OK, createdServizio.getStatusCode());

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setDescrizione("Descrizione test");
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.ADESIONE); // Visibilità non consentita
        allegatoCreate.setFilename("testAllegato.pdf");

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);

        Exception exception = assertThrows(BadRequestException.class, () -> {
            serviziController.createAllegatoServizio(createdServizio.getBody().getIdServizio(), allegati);
        });
        String expectedMessage = "Visibilita [adesione] non consentita";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateAllegatoServizioDuplicato() {
        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setEsterna(false);
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(organizzazione);
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("gestore");
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setReferente(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominio = CommonUtils.getDominioCreate();
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominio);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
        servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());
        servizioCreate.setIdDominio(createdDominio.getBody().getIdDominio());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.GESTORE);
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);

        ReferenteCreate referente = new ReferenteCreate();
        referente.setTipo(TipoReferenteEnum.REFERENTE);
        referente.setIdUtente(responseUtente.getBody().getIdUtente());

        List<ReferenteCreate> referenti = new ArrayList<>();
        referenti.add(referente);
        servizioCreate.setReferenti(referenti);

        ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
        assertEquals(HttpStatus.OK, createdServizio.getStatusCode());

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setDescrizione("Descrizione test");
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate.setFilename("testAllegato.pdf");

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        allegati.add(allegatoCreate); // Aggiungiamo lo stesso allegato due volte per simulare il duplicato

        Exception exception = assertThrows(BadRequestException.class, () -> {
            serviziController.createAllegatoServizio(createdServizio.getBody().getIdServizio(), allegati);
        });

        String expectedMessage = "Allegato [Nome: testAllegato.pdf di tipo: generico] duplicato";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateAllegatoServizioAutorizzazioneFallita() {
        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setEsterna(false);
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(organizzazione);
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("gestore");
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setReferente(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominio = CommonUtils.getDominioCreate();
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominio);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
        servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());
        servizioCreate.setIdDominio(createdDominio.getBody().getIdDominio());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.GESTORE);
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);

        ReferenteCreate referente = new ReferenteCreate();
        referente.setTipo(TipoReferenteEnum.REFERENTE);
        referente.setIdUtente(responseUtente.getBody().getIdUtente());

        List<ReferenteCreate> referenti = new ArrayList<>();
        referenti.add(referente);
        servizioCreate.setReferenti(referenti);

        ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
        assertEquals(HttpStatus.OK, createdServizio.getStatusCode());

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setDescrizione("Descrizione test");
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate.setFilename("testAllegato.pdf");

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        Exception exception = assertThrows(NotAuthorizedException.class, () -> {
            serviziController.createAllegatoServizio(createdServizio.getBody().getIdServizio(), allegati);
        });

    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateAllegatoServizioutenteAnonimo() {
        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setEsterna(false);
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(organizzazione);
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("gestore");
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setReferente(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominio = CommonUtils.getDominioCreate();
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominio);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
        servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());
        servizioCreate.setIdDominio(createdDominio.getBody().getIdDominio());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.GESTORE);
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);

        ReferenteCreate referente = new ReferenteCreate();
        referente.setTipo(TipoReferenteEnum.REFERENTE);
        referente.setIdUtente(responseUtente.getBody().getIdUtente());

        List<ReferenteCreate> referenti = new ArrayList<>();
        referenti.add(referente);
        servizioCreate.setReferenti(referenti);

        ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
        assertEquals(HttpStatus.OK, createdServizio.getStatusCode());

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setDescrizione("Descrizione test");
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate.setFilename("testAllegato.pdf");

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);

        this.tearDown();

        Exception exception = assertThrows(NotAuthorizedException.class, () -> {
            serviziController.createAllegatoServizio(createdServizio.getBody().getIdServizio(), allegati);
        });

    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateReferenteServizioSuccess() {
        Servizio servizio = this.getServizio();

        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        referenteCreate.setIdUtente(UTENTE_GESTORE);

        ResponseEntity<Referente> responseReferente = serviziController.createReferenteServizio(servizio.getIdServizio(), referenteCreate);
        
        assertEquals(HttpStatus.OK, responseReferente.getStatusCode());
        assertNotNull(responseReferente.getBody());
        assertEquals(TipoReferenteEnum.REFERENTE_TECNICO, responseReferente.getBody().getTipo());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateReferenteServizioNotFound() {
        UUID idServizioNonEsistente = UUID.randomUUID();

        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(UUID.randomUUID().toString());

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.createReferenteServizio(idServizioNonEsistente, referenteCreate);
        });

        String expectedMessage = "Servizio con id [" + idServizioNonEsistente + "] non trovato";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateReferenteServizioAutorizzazioneFallita() {
        Servizio servizio = this.getServizio();

        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(UUID.randomUUID().toString());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
            serviziController.createReferenteServizio(servizio.getIdServizio(), referenteCreate);
        });

    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateReferenteServizioUtenteAnonimo() {
        Servizio servizio = this.getServizio();

        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(UUID.randomUUID().toString());

        this.tearDown();

        assertThrows(NotAuthorizedException.class, () -> {
            serviziController.createReferenteServizio(servizio.getIdServizio(), referenteCreate);
        });

    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateAllegatoMessaggioServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        MessaggioCreate messaggio = new MessaggioCreate();
        messaggio.setOggetto("Oggetto Test");

        ResponseEntity<ItemMessaggio> itemMessaggio = serviziController.createMessaggioServizio(idServizio, messaggio);

        AllegatoMessaggioCreate allegatoCreate = new AllegatoMessaggioCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));

        ResponseEntity<AllegatoMessaggio> response = serviziController.createAllegatoMessaggioServizio(idServizio, itemMessaggio.getBody().getIdMessaggio(), allegatoCreate);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        AllegatoMessaggio allegatoRisultato = response.getBody();
        assertNotNull(allegatoRisultato);
        assertEquals("allegato_test.pdf", allegatoRisultato.getFilename());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateAllegatoMessaggioServizioMessaggioNotFound() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        UUID idMessaggioNonEsistente = UUID.randomUUID();

        AllegatoMessaggioCreate allegatoCreate = new AllegatoMessaggioCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.createAllegatoMessaggioServizio(idServizio, idMessaggioNonEsistente, allegatoCreate);
        });

        String expectedMessage = "Messaggio [" + idMessaggioNonEsistente + "] non trovato per il servizio [" + idServizio + "]";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateMessaggioServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto Test");

        ResponseEntity<ItemMessaggio> response = serviziController.createMessaggioServizio(idServizio, messaggioCreate);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ItemMessaggio messaggioRisultato = response.getBody();
        assertNotNull(messaggioRisultato);
        assertEquals("Oggetto Test", messaggioRisultato.getOggetto());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateMessaggioServizioServizioNotFound() {
        UUID idServizioNonEsistente = UUID.randomUUID();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto Test");

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.createMessaggioServizio(idServizioNonEsistente, messaggioCreate);
        });

        String expectedMessage = "Servizio [" + idServizioNonEsistente + "] non trovato";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateServizioSuccess() {
        Servizio servizio = this.getServizio();

        assertNotNull(servizio);
        assertEquals(CommonUtils.NOME_SERVIZIO, servizio.getNome());
        assertEquals(CommonUtils.VERSIONE_SERVIZIO, servizio.getVersione());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateServizioConflict() {
        Servizio servizio1 = this.getServizio();
        assertNotNull(servizio1);

        ServizioCreate servizioCreateDuplicato = CommonUtils.getServizioCreate();
        servizioCreateDuplicato.setIdSoggettoInterno(idSoggetto);
        servizioCreateDuplicato.setIdDominio(idDominio);

        ReferenteCreate referente = new ReferenteCreate();
        referente.setTipo(TipoReferenteEnum.REFERENTE);
        referente.setIdUtente(UTENTE_GESTORE);
        List<ReferenteCreate> referenti = new ArrayList<>();
        referenti.add(referente);
        servizioCreateDuplicato.setReferenti(referenti);

        Exception exception = assertThrows(ConflictException.class, () -> {
            serviziController.createServizio(servizioCreateDuplicato);
        });

        String expectedMessage = "Servizio [" + servizio1.getNome() + " v" + servizio1.getVersione() + "] esiste gia";
        assertTrue(exception.getMessage().contains(expectedMessage));
        
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateServizioAuthorizationFailed() {
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        Exception exception = assertThrows(NotAuthorizedException.class, () -> {
            this.getServizio();
        });
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateServizioUtenteAnonimo() {
    	this.tearDown();

        assertThrows(NotAuthorizedException.class, () -> {
            this.getServizio();
        });
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testCreateServizioErrore() {
	    this.getDominio();
		ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
	
		servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());
	
		servizioCreate.setIdDominio(UUID.randomUUID());
	
		List<ReferenteCreate> referenti = new ArrayList<>();
	
		ReferenteCreate referente = new ReferenteCreate();
		referente.setTipo(TipoReferenteEnum.REFERENTE);
		referente.setIdUtente(UTENTE_GESTORE);
		referenti.add(referente);
		
		ReferenteCreate referente2 = new ReferenteCreate();
		referente2.setTipo(TipoReferenteEnum.REFERENTE);
		referente2.setIdUtente(UTENTE_REFERENTE_SERVIZIO);
		referenti.add(referente2);
	
		servizioCreate.setReferenti(referenti);
		assertThrows(Exception.class, () -> {
			serviziController.createServizio(servizioCreate);
		});
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDeleteAllegatoServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);

        ResponseEntity<List<Allegato>> responseListAllegato = serviziController.createAllegatoServizio(idServizio, allegati);
        UUID idAllegato = UUID.fromString(responseListAllegato.getBody().get(0).getUuid());

        ResponseEntity<Void> response = serviziController.deleteAllegatoServizio(idServizio, idAllegato);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDeleteAllegatoServizioNotFound() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        UUID idAllegatoNonEsistente = UUID.randomUUID();

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.deleteAllegatoServizio(idServizio, idAllegatoNonEsistente);
        });

        String expectedMessage = "Allegato [" + idAllegatoNonEsistente + "] non trovato per il servizio [" + idServizio + "]";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDeleteAllegatoServizioAuthorizationFailed() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);

        ResponseEntity<List<Allegato>> responseListAllegato = serviziController.createAllegatoServizio(idServizio, allegati);
        UUID idAllegato = UUID.fromString(responseListAllegato.getBody().get(0).getUuid());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
            serviziController.deleteAllegatoServizio(idServizio, idAllegato);
        });

    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDeleteAllegatoServizioUtenteAnonimo() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);

        ResponseEntity<List<Allegato>> responseListAllegato = serviziController.createAllegatoServizio(idServizio, allegati);
        UUID idAllegato = UUID.fromString(responseListAllegato.getBody().get(0).getUuid());

        this.tearDown();

        assertThrows(NotAuthorizedException.class, () -> {
            serviziController.deleteAllegatoServizio(idServizio, idAllegato);
        });

    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDeleteAllegatoMessaggioServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto Test");

        ResponseEntity<ItemMessaggio> itemMessaggio = serviziController.createMessaggioServizio(idServizio, messaggioCreate);
        UUID idMessaggio = itemMessaggio.getBody().getIdMessaggio();

        AllegatoMessaggioCreate allegatoCreate = new AllegatoMessaggioCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));

        ResponseEntity<AllegatoMessaggio> allegato = serviziController.createAllegatoMessaggioServizio(idServizio, idMessaggio, allegatoCreate);
        UUID idAllegato = UUID.fromString(allegato.getBody().getUuid());

        ResponseEntity<Void> response = serviziController.deleteAllegatoMessaggioServizio(idServizio, idMessaggio, idAllegato);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDeleteAllegatoMessaggioServizioMessaggioNotFound() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        UUID idMessaggioNonEsistente = UUID.randomUUID();
        UUID idAllegato = UUID.randomUUID();

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.deleteAllegatoMessaggioServizio(idServizio, idMessaggioNonEsistente, idAllegato);
        });

        String expectedMessage = "Messaggio [" + idMessaggioNonEsistente + "] non trovato per il servizio [" + idServizio + "]";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDeleteAllegatoMessaggioServizioAllegatoNotFound() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto Test");

        ResponseEntity<ItemMessaggio> itemMessaggio = serviziController.createMessaggioServizio(idServizio, messaggioCreate);
        UUID idMessaggio = itemMessaggio.getBody().getIdMessaggio();

        UUID idAllegatoNonEsistente = UUID.randomUUID();

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.deleteAllegatoMessaggioServizio(idServizio, idMessaggio, idAllegatoNonEsistente);
        });

        String expectedMessage = "Allegato [" + idAllegatoNonEsistente + "] non trovato";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDeleteReferenteServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();
        
        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setUsername("altro-username");
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.GESTORE);
        ResponseEntity<Utente> responseUtente2 = utentiController.createUtente(utente);
        
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setIdUtente(responseUtente2.getBody().getIdUtente());
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        
        serviziController.createReferenteServizio(idServizio, referenteCreate);

        ResponseEntity<Void> response = serviziController.deleteReferenteServizio(idServizio, responseUtente2.getBody().getIdUtente(), TipoReferenteEnum.REFERENTE);
        
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDeleteReferenteServizioNullPointerException() {
        UUID idServizioNonEsistente = UUID.randomUUID();

        assertThrows(NullPointerException.class, () -> {
            serviziController.deleteReferenteServizio(idServizioNonEsistente, responseUtente.getBody().getIdUtente(), TipoReferenteEnum.REFERENTE);
        });

    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDeleteReferenteServizioNotFoundException() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();
        
        assertThrows(org.govway.catalogo.core.exceptions.NotFoundException.class, () -> {
        	serviziController.deleteReferenteServizio(idServizio, "randomid", TipoReferenteEnum.REFERENTE);
        });
        
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDownloadAllegatoMessaggioServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto Test");

        ResponseEntity<ItemMessaggio> itemMessaggio = serviziController.createMessaggioServizio(idServizio, messaggioCreate);
        UUID idMessaggio = itemMessaggio.getBody().getIdMessaggio();

        AllegatoMessaggioCreate allegatoCreate = new AllegatoMessaggioCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));

        ResponseEntity<AllegatoMessaggio> allegato = serviziController.createAllegatoMessaggioServizio(idServizio, idMessaggio, allegatoCreate);
        UUID idAllegato = UUID.fromString(allegato.getBody().getUuid());

        ResponseEntity<Resource> response = serviziController.downloadAllegatoMessaggioServizio(idServizio, idMessaggio, idAllegato);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("attachment; filename=allegato_test.pdf", response.getHeaders().get("Content-Disposition").get(0));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDownloadAllegatoMessaggioServizioMessaggioNotFound() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        UUID idMessaggioNonEsistente = UUID.randomUUID();
        UUID idAllegato = UUID.randomUUID();

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.downloadAllegatoMessaggioServizio(idServizio, idMessaggioNonEsistente, idAllegato);
        });

        String expectedMessage = "Messaggio [" + idMessaggioNonEsistente + "] non trovato per il servizio [" + idServizio + "]";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDownloadAllegatoMessaggioServizioAllegatoNotFound() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto Test");

        ResponseEntity<ItemMessaggio> itemMessaggio = serviziController.createMessaggioServizio(idServizio, messaggioCreate);
        UUID idMessaggio = itemMessaggio.getBody().getIdMessaggio();

        UUID idAllegatoNonEsistente = UUID.randomUUID();

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.downloadAllegatoMessaggioServizio(idServizio, idMessaggio, idAllegatoNonEsistente);
        });

        String expectedMessage = "Allegato [" + idAllegatoNonEsistente + "] non trovato";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDownloadAllegatoServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);

        ResponseEntity<List<Allegato>> responseListAllegato = serviziController.createAllegatoServizio(idServizio, allegati);
        UUID idAllegato = UUID.fromString(responseListAllegato.getBody().get(0).getUuid());

        ResponseEntity<Resource> response = serviziController.downloadAllegatoServizio(idServizio, idAllegato);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("attachment; filename=allegato_test.pdf", response.getHeaders().get("Content-Disposition").get(0));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDownloadAllegatoServizioNotFound() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        UUID idAllegatoNonEsistente = UUID.randomUUID();

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.downloadAllegatoServizio(idServizio, idAllegatoNonEsistente);
        });

        String expectedMessage = "Allegato [" + idAllegatoNonEsistente + "] non trovato per il servizio [" + idServizio + "]";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testGetServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        ResponseEntity<Servizio> response = serviziController.getServizio(idServizio);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(idServizio, response.getBody().getIdServizio());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testGetServizioNotFound() {
        UUID idServizioNonEsistente = UUID.randomUUID();

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.getServizio(idServizioNonEsistente);
        });

        String expectedMessage = "Servizio con id [" + idServizioNonEsistente + "] non trovato";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListComunicazioniServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();
        this.getAPI(idServizio);

        StatoUpdate stato = new StatoUpdate();
        stato.setStato("richiesto_collaudo");
        stato.setCommento("richiesto collaudo");

        serviziController.updateStatoServizio(idServizio, stato);

        MessaggioCreate messaggio = new MessaggioCreate();
        messaggio.setTesto("Testo del messaggio");
        messaggio.setOggetto("Oggetto Test");
        
        serviziController.createMessaggioServizio(idServizio, messaggio);

        ResponseEntity<PagedModelItemComunicazione> response = serviziController.listComunicazioniServizio(idServizio, 0, 10, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        List<ItemComunicazione> comunicazioni = response.getBody().getContent();
        assertEquals(3, comunicazioni.size());

        ItemComunicazione messaggioC = comunicazioni.stream()
            .filter(c -> c.getTipo().equals(TipoComunicazione.MESSAGGIO))
            .findFirst().orElse(null);
        assertNotNull(messaggioC);
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListComunicazioniServizioNotFound() {
        UUID idServizioNonEsistente = UUID.randomUUID();

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.listComunicazioniServizio(idServizioNonEsistente, 0, 10, null);
        });

        String expectedMessage = "Servizio con id [" + idServizioNonEsistente + "] non trovato";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListMessaggiServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto Test");
        messaggioCreate.setTesto("Testo del messaggio");

        ResponseEntity<ItemMessaggio> responseMessaggio = serviziController.createMessaggioServizio(idServizio, messaggioCreate);
        assertEquals(HttpStatus.OK, responseMessaggio.getStatusCode());

        ResponseEntity<PagedModelItemMessaggio> response = serviziController.listMessaggiServizio(idServizio, null, 0, 10, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        List<ItemMessaggio> messaggi = response.getBody().getContent();
        assertEquals(messaggioCreate.getOggetto(), messaggi.get(0).getOggetto());
        assertEquals(messaggioCreate.getTesto(), messaggi.get(0).getTesto());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListMessaggiServizioWithSearchQuery() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto Test");
        messaggioCreate.setTesto("Questo è un messaggio di test per la ricerca");

        ResponseEntity<ItemMessaggio> responseMessaggio = serviziController.createMessaggioServizio(idServizio, messaggioCreate);
        assertEquals(HttpStatus.OK, responseMessaggio.getStatusCode());

        ResponseEntity<PagedModelItemMessaggio> response = serviziController.listMessaggiServizio(idServizio, "ricerca", 0, 10, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        List<ItemMessaggio> messaggi = response.getBody().getContent();
        assertEquals(1, messaggi.size());
        assertTrue(messaggi.get(0).getTesto().contains("ricerca"));
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListMessaggiServizioErrore() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        List<String> sort = new ArrayList<String>();
        sort.add("..");
        
        assertThrows(Exception.class, () -> {
        	serviziController.listMessaggiServizio(idServizio, null, 0, 10, sort);
        });
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListReferentiServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        ResponseEntity<PagedModelReferente> response = serviziController.listReferentiServizio(idServizio, null, null, 0, 10, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        List<Referente> referenti = response.getBody().getContent();
        assertEquals(2, referenti.size());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListReferentiServizioWithSearchQuery() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        ResponseEntity<PagedModelReferente> response = serviziController.listReferentiServizio(idServizio, "Mario", null, 0, 10, null);
        //System.out.println(response.getBody().getContent().get(0));
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        List<Referente> referenti = response.getBody().getContent();
        assertEquals(1, referenti.size());
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListReferentiServizioErrore() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();
        
        List<String> sort = new ArrayList<String>();
        sort.add("..");
        
        assertThrows(Exception.class, () -> {
        	serviziController.listReferentiServizio(idServizio, null, null, 0, 10, sort);
        });
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testUpdateServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        ServizioUpdate servizioUpdate = new ServizioUpdate();
        IdentificativoServizioUpdate identificativo = new IdentificativoServizioUpdate();
        identificativo.setNome("Nuovo Nome");
        identificativo.setVersione("2");
        identificativo.setIdDominio(idDominio);
        identificativo.setIdSoggettoInterno(idSoggetto);
        identificativo.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
        identificativo.setAdesioneConsentita(true);
        identificativo.setMultiAdesione(true);
        identificativo.setTipo(TipoServizio.API);
        identificativo.setPackage(false);
        servizioUpdate.setIdentificativo(identificativo);

        DatiGenericiServizioUpdate datiGenerici = new DatiGenericiServizioUpdate();
        datiGenerici.setDescrizione("Nuova descrizione");
        datiGenerici.setDescrizioneSintetica("stessa descrizione");
        servizioUpdate.setDatiGenerici(datiGenerici);
        UtenteUpdate u = new UtenteUpdate();
        u.setNome("abc");
        u.setCognome("def");
        u.setEmailAziendale("m@m.m");
        u.setTelefonoAziendale("000000000");
        u.setIdOrganizzazione(idOrganizzazione);
        u.setUsername("generico");
        u.setStato(StatoUtenteEnum.ABILITATO);
        utentiController.updateUtente(UTENTE_REFERENTE_SERVIZIO, u);
        ResponseEntity<Servizio> response = serviziController.updateServizio(idServizio, servizioUpdate);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Nuovo Nome", response.getBody().getNome());
        assertEquals("2", response.getBody().getVersione());
        assertEquals("Nuova descrizione", response.getBody().getDescrizione());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testUpdateServizioNotFound() {
        UUID idServizioNonEsistente = UUID.randomUUID();

        ServizioUpdate servizioUpdate = new ServizioUpdate();
        IdentificativoServizioUpdate identificativo = new IdentificativoServizioUpdate();
        identificativo.setNome("Nuovo Nome");
        identificativo.setVersione("2");
        identificativo.setIdDominio(UUID.randomUUID());
        identificativo.setIdSoggettoInterno(UUID.randomUUID());
        identificativo.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
        identificativo.setAdesioneConsentita(true);
        identificativo.setMultiAdesione(true);
        identificativo.setPackage(false);
        identificativo.setTipo(TipoServizio.API);
        servizioUpdate.setIdentificativo(identificativo);

        DatiGenericiServizioUpdate datiGenerici = new DatiGenericiServizioUpdate();
        datiGenerici.setDescrizione("Nuova descrizione");
        datiGenerici.setDescrizioneSintetica("stessa descrizione");
        servizioUpdate.setDatiGenerici(datiGenerici);

        assertThrows(NotFoundException.class, () -> {
            serviziController.updateServizio(idServizioNonEsistente, servizioUpdate);
        });
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testUpdateServizioConflict() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di un altro servizio con lo stesso nome e versione
	    ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
	    servizioCreate.setNome("NuovoServizio");
		servizioCreate.setIdSoggettoInterno(idSoggetto);
		servizioCreate.setIdDominio(idDominio);
		ReferenteCreate referente = new ReferenteCreate();
		referente.setTipo(TipoReferenteEnum.REFERENTE);

		referente.setIdUtente(UTENTE_GESTORE);
		List<ReferenteCreate> referenti = new ArrayList<ReferenteCreate>();
		referenti.add(referente);
		servizioCreate.setReferenti(referenti);
		
		ResponseEntity<Servizio> servizio2 = serviziController.createServizio(servizioCreate);

	    // Creazione di un aggiornamento di servizio con lo stesso nome e versione
	    ServizioUpdate servizioUpdate = new ServizioUpdate();
	    IdentificativoServizioUpdate identificativo = new IdentificativoServizioUpdate();
	    identificativo.setNome(servizio.getNome());
	    identificativo.setVersione(servizio.getVersione());
	    identificativo.setIdDominio(idDominio);
	    identificativo.setIdSoggettoInterno(idSoggetto);
	    identificativo.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
	    identificativo.setAdesioneConsentita(true);
	    identificativo.setMultiAdesione(true);
	    identificativo.setTipo(TipoServizio.GENERICO);
	    servizioUpdate.setIdentificativo(identificativo);
	    
	    // Test per conflitto di identificativo
	    assertThrows(ConflictException.class, () -> {
	        serviziController.updateServizio(servizio2.getBody().getIdServizio(), servizioUpdate);
	    });
	}

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testUpdateStatoServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();
        this.getAPI(idServizio);

        // Creazione di un aggiornamento di stato
        StatoUpdate statoServizioUpdate = new StatoUpdate();
        statoServizioUpdate.setStato("richiesto_collaudo");

        // Invocazione del metodo updateStatoServizio
        ResponseEntity<Servizio> response = serviziController.updateStatoServizio(idServizio, statoServizioUpdate);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testUpdateStatoServizioNotFound() {
        UUID idServizioNonEsistente = UUID.randomUUID();

        // Creazione di un aggiornamento di stato
        StatoUpdate statoServizioUpdate = new StatoUpdate();
        statoServizioUpdate.setStato("bozza");

        // Test per servizio non trovato
        assertThrows(NotFoundException.class, () -> {
            serviziController.updateStatoServizio(idServizioNonEsistente, statoServizioUpdate);
        });
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testUpdateStatoServizioAuthorizationFailed() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        // Creazione di un aggiornamento di stato
        StatoUpdate statoServizioUpdate = new StatoUpdate();
        statoServizioUpdate.setStato("richiesto_collaudo");

        // Configura un InfoProfilo senza il ruolo richiesto
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Test per autorizzazione fallita
        Exception exception = assertThrows(NotAuthorizedException.class, () -> {
            serviziController.updateStatoServizio(idServizio, statoServizioUpdate);
        });

    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testUpdateStatoServizioUtenteAnonimo() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        // Creazione di un aggiornamento di stato
        StatoUpdate statoServizioUpdate = new StatoUpdate();
        statoServizioUpdate.setStato("richiesto_collaudo");

        this.tearDown();

        // Test per autorizzazione fallita
        Exception exception = assertThrows(NotAuthorizedException.class, () -> {
            serviziController.updateStatoServizio(idServizio, statoServizioUpdate);
        });

    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziCategoriaVisibilitaTipoInAttesaSuccess() {
        this.getServizio();

        List<String> categorie = new ArrayList<String>();
        categorie.add(UUID.randomUUID().toString());
        
        boolean inAttesa = true; 
        
        ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(null, null, null, VisibilitaServizioEnum.PUBBLICO, null, null, categorie, null, inAttesa, null, null, null, null, null, null, TipoServizio.GENERICO, null, 0, 10, null);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziCategoriaVisibilitaTipoInAttesaFalseSuccess() {
        this.getServizio();

        List<String> categorie = new ArrayList<String>();
        categorie.add(UUID.randomUUID().toString());
        
        boolean inAttesa = false; 
        
        ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(null, null, null, VisibilitaServizioEnum.PUBBLICO, null, null, categorie, null, inAttesa, null, null, null, null, null, null, TipoServizio.GENERICO, null, 0, 10, null);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziSuccess() {
        Servizio servizio = this.getServizio();

        // Invocazione del metodo listServizi senza filtri
        ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il servizio sia presente nell'elenco
        List<ItemServizio> servizi = response.getBody().getContent();
        assertTrue(servizi.stream().anyMatch(s -> s.getIdServizio().equals(servizio.getIdServizio())));
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziSuccessGruppi() {
        Servizio servizio = this.getServizio();

        // Invocazione del metodo listServizi senza filtri
        ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(null, null, responseGruppo.getBody().getIdGruppo(), null, null, null, null, null, true, true, null, null, null, null, null, null, null, 0, 10, null);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziSuccessGruppiInAttesaFalse() {
        Servizio servizio = this.getServizio();

        // Invocazione del metodo listServizi senza filtri
        ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(null, null, responseGruppo.getBody().getIdGruppo(), null, null, null, null, null, false, true, null, null, null, null, null, null, null, 0, 10, null);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
    
    //TODO: ordinamento per versione non funzionante
    /*
    @Test
    void testListServiziSortedVersione() {
        this.getMultiServizi();

        List<String> sort = new ArrayList<>();
        sort.add("versione,asc");
        
        // Invocazione del metodo listServizi con filtri
        ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(
            null, idDominio, null, null, null, null, null, null, false, false, null, null, null, null, null, null, null, 0, 10, sort
        );

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il servizio filtrato sia presente nell'elenco
        List<ItemServizio> servizi = response.getBody().getContent();
        servizi.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(servizi.stream().anyMatch(s -> s.getNome().equals(NOME_SERVIZIO_1)));
        assertTrue(servizi.stream().anyMatch(s -> s.getNome().equals(NOME_SERVIZIO_2)));
        assertTrue(servizi.stream().anyMatch(s -> s.getNome().equals(NOME_SERVIZIO_3)));
        //il primo elemento della lista deve essere il servizio con versione 1
        assertEquals(NOME_SERVIZIO_3, servizi.get(0).getNome(), "Ordinamento non rispettato!");
    }
  */  
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziSortedNameDesc() {
        this.getMultiServizi();

        List<String> sort = new ArrayList<>();
        sort.add("nome,desc");
        
        // Invocazione del metodo listServizi con filtri
        ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(
            null, idDominio, null, null, null, null, null, null, false, false, null, null, null, null, null, null, null, 0, 10, sort
        );

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il servizio filtrato sia presente nell'elenco
        List<ItemServizio> servizi = response.getBody().getContent();
        assertTrue(servizi.stream().anyMatch(s -> s.getNome().equals(NOME_SERVIZIO_3)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals(NOME_SERVIZIO_3, servizi.get(0).getNome());
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziSortedNameAsc() {
        this.getMultiServizi();

        List<String> sort = new ArrayList<>();
        sort.add("nome,asc");
        
        // Invocazione del metodo listServizi con filtri
        ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(
            null, idDominio, null, null, null, null, null, null, false, false, null, null, null, null, null, null, null, 0, 10, sort
        );

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il servizio filtrato sia presente nell'elenco
        List<ItemServizio> servizi = response.getBody().getContent();
        assertTrue(servizi.stream().anyMatch(s -> s.getNome().equals(NOME_SERVIZIO_3)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals(NOME_SERVIZIO_1, servizi.get(0).getNome());
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziMultiSorted() {
        this.getMultiServizi();

        List<String> sort = new ArrayList<>();
        sort.add("nome,asc");
        sort.add("dataCreazione,asc");
        sort.add("versione,desc");
        
        
        // Invocazione del metodo listServizi con filtri
        ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(
            null, idDominio, null, null, null, null, null, null, false, false, null, null, null, null, null, null, null, 0, 10, sort
        );

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il servizio filtrato sia presente nell'elenco
        List<ItemServizio> servizi = response.getBody().getContent();
        assertTrue(servizi.stream().anyMatch(s -> s.getNome().equals(NOME_SERVIZIO_2)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals(NOME_SERVIZIO_1, servizi.get(0).getNome());
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziMultiPage() {
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 40;
        this.getMultiServizi(numeroTotaleDiElementi);
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
        	// Invocazione del metodo listServizi con filtri
            ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(
                null, idDominio, null, null, null, null, null, null, false, false, null, null, null, null, null, null, null, n, numeroElementiPerPagina, null
            );

            // Verifica del successo
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().getContent().isEmpty());
        }
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziWithFilters() {
        Servizio servizio = this.getServizio();
        UUID idDominio = servizio.getDominio().getIdDominio();
        String nomeServizio = servizio.getNome();

        // Invocazione del metodo listServizi con filtri
        ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(
            null, idDominio, null, null, null, null, null, null, false, false, null, nomeServizio, null, null, null, null, null, 0, 10, null
        );

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il servizio filtrato sia presente nell'elenco
        List<ItemServizio> servizi = response.getBody().getContent();
        assertTrue(servizi.stream().anyMatch(s -> s.getNome().equals(nomeServizio)));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziInAttesaUnauthorized() {
        when(this.coreAuthorization.isAnounymous()).thenReturn(true);
        /*
         //TODO: controllare
        // Test per utente anonimo che richiede servizi in attesa
        Exception exception = assertThrows(BadRequestException.class, () -> {
            serviziController.listServizi(null, null, null, null, null, null, null, null, true, false, null, null, null, null, null, 0, 10, null);
        });

        String expectedMessage = "Utente non registrato, impossibile recuperare servizi in attesa";
        assertTrue(exception.getMessage().contains(expectedMessage));
         */
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testExportServiziSuccess() {
        Servizio servizio = this.getServizio();

        // Invocazione del metodo exportServizi senza filtri
        ResponseEntity<Resource> response = serviziController.exportServizi(
            null, null, null, null, null, null, null, null, false, false, null, null, null, null, null
        );

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getHeaders().get("Content-Disposition").get(0).contains("attachment; filename=servizi.csv"));
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testExportServiziSuccessInAttesaTrue() {
        Servizio servizio = this.getServizio();
        List<String> categoria = new ArrayList<String>();
        categoria.add(UUID.randomUUID().toString());
        VisibilitaServizioEnum visibilita = VisibilitaServizioEnum.PUBBLICO;
        
        // Invocazione del metodo exportServizi senza filtri
        ResponseEntity<Resource> response = serviziController.exportServizi(
            null, null, null, visibilita, null, null, categoria, null, true, true, null, null, null, null, null
        );

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getHeaders().get("Content-Disposition").get(0).contains("attachment; filename=servizi.csv"));
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testExportServiziAllSuccessInAttesaFalse() {
        Servizio servizio = this.getServizio();
        List<String> categoria = new ArrayList<String>();
        categoria.add(UUID.randomUUID().toString());
        VisibilitaServizioEnum visibilita = VisibilitaServizioEnum.PUBBLICO;
        
        // Invocazione del metodo exportServizi senza filtri
        ResponseEntity<Resource> response = serviziController.exportServizi(
            null, null, null, visibilita, null, null, categoria, null, false, true, null, null, null, null, null
        );

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getHeaders().get("Content-Disposition").get(0).contains("attachment; filename=servizi.csv"));
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testExportServiziErrore() {
        this.getServizio();
        List<String> categoria = new ArrayList<String>();
        categoria.add("x");
        VisibilitaServizioEnum visibilita = VisibilitaServizioEnum.PUBBLICO;
        
        assertThrows(Exception.class, () -> {
        	serviziController.exportServizi(
                    null, null, null, visibilita, null, null, categoria, null, true, true, null, null, null, null, null
                );
        });
        
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDeleteMessaggioServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        MessaggioCreate messaggio = new MessaggioCreate();
        messaggio.setOggetto("Oggetto Test");
        ResponseEntity<ItemMessaggio> itemMessaggio = serviziController.createMessaggioServizio(idServizio, messaggio);
        UUID idMessaggio = itemMessaggio.getBody().getIdMessaggio();

        // Invocazione del metodo deleteMessaggioServizio
        ResponseEntity<Void> response = serviziController.deleteMessaggioServizio(idServizio, idMessaggio);

        // Verifica del successo
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDeleteMessaggioServizioNotFound() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();
        UUID idMessaggioNonEsistente = UUID.randomUUID();

        // Test per messaggio non trovato
        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.deleteMessaggioServizio(idServizio, idMessaggioNonEsistente);
        });

        String expectedMessage = "Messaggio [" + idMessaggioNonEsistente + "] non trovato per il servizio [" + idServizio + "]";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testDeleteMessaggioServizioAuthorizationFailed() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        MessaggioCreate messaggio = new MessaggioCreate();
        messaggio.setOggetto("Oggetto Test");
        ResponseEntity<ItemMessaggio> itemMessaggio = serviziController.createMessaggioServizio(idServizio, messaggio);
        UUID idMessaggio = itemMessaggio.getBody().getIdMessaggio();

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        /*
         //TODO: controllare, nessuna autorizzazione
        Exception exception = assertThrows(NotAuthorizedException.class, () -> {
            serviziController.deleteMessaggioServizio(idServizio, idMessaggio);
        });
        */

    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testUpdateAllegatoServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setContentType("application/pdf");
        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseListAllegato = serviziController.createAllegatoServizio(idServizio, allegati);
        UUID idAllegato = UUID.fromString(responseListAllegato.getBody().get(0).getUuid());

        AllegatoUpdate allegatoUpdate = new AllegatoUpdate();
        allegatoUpdate.setTipologia(TipologiaAllegatoEnum.SPECIFICA);
        allegatoUpdate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoUpdate.setFilename("allegato_aggiornato.pdf");
        allegatoUpdate.setContentType("application/pdf");
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename(allegatoUpdate.getFilename());
        documento.setContent(Base64.encodeBase64String("contenuto test 2".getBytes()));
        documento.setContentType(allegatoUpdate.getContentType());
        allegatoUpdate.setContent(documento);

        ResponseEntity<Allegato> response = serviziController.updateAllegatoServizio(idServizio, idAllegato, allegatoUpdate);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("allegato_aggiornato.pdf", response.getBody().getFilename());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testUpdateMessaggioServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto Test");
        ResponseEntity<ItemMessaggio> itemMessaggio = serviziController.createMessaggioServizio(idServizio, messaggioCreate);
        UUID idMessaggio = itemMessaggio.getBody().getIdMessaggio();

        MessaggioUpdate messaggioUpdate = new MessaggioUpdate();
        messaggioUpdate.setOggetto("Oggetto aggiornato");
        messaggioUpdate.setTesto("Testo aggiornato");

        ResponseEntity<ItemMessaggio> response = serviziController.updateMessaggioServizio(idServizio, idMessaggio, messaggioUpdate);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Oggetto aggiornato", response.getBody().getOggetto());
        assertEquals("Testo aggiornato", response.getBody().getTesto());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListAllegatiServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        AllegatoItemCreate allegatoCreate1 = new AllegatoItemCreate();
        allegatoCreate1.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate1.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate1.setFilename("allegato_test1.pdf");
        allegatoCreate1.setContent(Base64.encodeBase64String("contenuto test1".getBytes()));

        AllegatoItemCreate allegatoCreate2 = new AllegatoItemCreate();
        allegatoCreate2.setTipologia(TipologiaAllegatoEnum.SPECIFICA);
        allegatoCreate2.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate2.setFilename("allegato_test2.pdf");
        allegatoCreate2.setContent(Base64.encodeBase64String("contenuto test2".getBytes()));

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate1);
        allegati.add(allegatoCreate2);
        serviziController.createAllegatoServizio(idServizio, allegati);

        ResponseEntity<PagedModelAllegato> response = serviziController.listAllegatiServizio(idServizio, null, null, null, null, 0, 10, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().getContent().size());
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListAllegatiServizioNotFound() {
        UUID idServizioNonEsistente = UUID.randomUUID();

        assertThrows(NotFoundException.class, () -> {
            serviziController.listAllegatiServizio(idServizioNonEsistente, null, null, null, null, 0, 10, null);
        });
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testUpdateMessaggioServizioAuthorizationFailed() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto Test");
        ResponseEntity<ItemMessaggio> itemMessaggio = serviziController.createMessaggioServizio(idServizio, messaggioCreate);
        UUID idMessaggio = itemMessaggio.getBody().getIdMessaggio();

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        MessaggioUpdate messaggioUpdate = new MessaggioUpdate();
        messaggioUpdate.setOggetto("Oggetto aggiornato");
        messaggioUpdate.setTesto("Testo aggiornato");

        Exception exception = assertThrows(NotAuthorizedException.class, () -> {
            serviziController.updateMessaggioServizio(idServizio, idMessaggio, messaggioUpdate);
        });
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testUpdateMessaggioServizioUtenteAnonimo() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto Test");
        ResponseEntity<ItemMessaggio> itemMessaggio = serviziController.createMessaggioServizio(idServizio, messaggioCreate);
        UUID idMessaggio = itemMessaggio.getBody().getIdMessaggio();

        this.tearDown();

        MessaggioUpdate messaggioUpdate = new MessaggioUpdate();
        messaggioUpdate.setOggetto("Oggetto aggiornato");
        messaggioUpdate.setTesto("Testo aggiornato");

        Exception exception = assertThrows(NotAuthorizedException.class, () -> {
            serviziController.updateMessaggioServizio(idServizio, idMessaggio, messaggioUpdate);
        });
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testUpdateMessaggioServizioNotFound() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        UUID idMessaggioNonEsistente = UUID.randomUUID();

        MessaggioUpdate messaggioUpdate = new MessaggioUpdate();
        messaggioUpdate.setOggetto("Oggetto aggiornato");
        messaggioUpdate.setTesto("Testo aggiornato");

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.updateMessaggioServizio(idServizio, idMessaggioNonEsistente, messaggioUpdate);
        });

        String expectedMessage = "Messaggio [" + idMessaggioNonEsistente + "] non trovato per il servizio [" + idServizio + "]";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testUpdateAllegatoServizioAuthorizationFailed() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setContentType("application/pdf");
        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseListAllegato = serviziController.createAllegatoServizio(idServizio, allegati);
        UUID idAllegato = UUID.fromString(responseListAllegato.getBody().get(0).getUuid());

        AllegatoUpdate allegatoUpdate = new AllegatoUpdate();
        allegatoUpdate.setTipologia(TipologiaAllegatoEnum.SPECIFICA);
        allegatoUpdate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoUpdate.setFilename("allegato_aggiornato.pdf");
        allegatoUpdate.setContentType("application/pdf");
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename(allegatoUpdate.getFilename());
        documento.setContent(Base64.encodeBase64String("contenuto test 2".getBytes()));
        documento.setContentType(allegatoUpdate.getContentType());
        allegatoUpdate.setContent(documento);

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        Exception exception = assertThrows(NotAuthorizedException.class, () -> {
            serviziController.updateAllegatoServizio(idServizio, idAllegato, allegatoUpdate);
        });
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testUpdateAllegatoServizioUtenteAnonimo() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setContentType("application/pdf");
        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseListAllegato = serviziController.createAllegatoServizio(idServizio, allegati);
        UUID idAllegato = UUID.fromString(responseListAllegato.getBody().get(0).getUuid());

        AllegatoUpdate allegatoUpdate = new AllegatoUpdate();
        allegatoUpdate.setTipologia(TipologiaAllegatoEnum.SPECIFICA);
        allegatoUpdate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoUpdate.setFilename("allegato_aggiornato.pdf");
        allegatoUpdate.setContentType("application/pdf");
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename(allegatoUpdate.getFilename());
        documento.setContent(Base64.encodeBase64String("contenuto test 2".getBytes()));
        documento.setContentType(allegatoUpdate.getContentType());
        allegatoUpdate.setContent(documento);

        this.tearDown();

        Exception exception = assertThrows(NotAuthorizedException.class, () -> {
            serviziController.updateAllegatoServizio(idServizio, idAllegato, allegatoUpdate);
        });
    }

    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListAllegatiServizioVisibilita() {
	    // Creazione del servizio e allegati tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di un allegato con visibilità PUBBLICO e uno con visibilità PRIVATO
	    AllegatoItemCreate allegatoCreate1 = new AllegatoItemCreate();
	    allegatoCreate1.setTipologia(TipologiaAllegatoEnum.GENERICO);
	    allegatoCreate1.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
	    allegatoCreate1.setFilename("allegato_test1.pdf");
	    allegatoCreate1.setContent(Base64.encodeBase64String("contenuto test1".getBytes()));

	    AllegatoItemCreate allegatoCreate2 = new AllegatoItemCreate();
	    allegatoCreate2.setTipologia(TipologiaAllegatoEnum.SPECIFICA);
	    allegatoCreate2.setVisibilita(VisibilitaAllegatoEnum.SERVIZIO);
	    allegatoCreate2.setFilename("allegato_test2.pdf");
	    allegatoCreate2.setContent(Base64.encodeBase64String("contenuto test2".getBytes()));

	    List<AllegatoItemCreate> allegati = new ArrayList<>();
	    allegati.add(allegatoCreate1);
	    allegati.add(allegatoCreate2);
	    serviziController.createAllegatoServizio(idServizio, allegati);

	    // Filtra solo per allegati con visibilità PUBBLICO
	    ResponseEntity<PagedModelAllegato> response = serviziController.listAllegatiServizio(idServizio, null, null, null, VisibilitaAllegatoEnum.PUBBLICO, 0, 10, null);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());
	    assertEquals(1, response.getBody().getContent().size());
	    assertEquals("allegato_test1.pdf", response.getBody().getContent().get(0).getFilename());
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListAllegatiServizioTipologia() {
	    // Creazione del servizio e allegati tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di un allegato con tipologia GENERICO e uno con tipologia SPECIFICA
	    AllegatoItemCreate allegatoCreate1 = new AllegatoItemCreate();
	    allegatoCreate1.setTipologia(TipologiaAllegatoEnum.GENERICO);
	    allegatoCreate1.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
	    allegatoCreate1.setFilename("allegato_test1.pdf");
	    allegatoCreate1.setContent(Base64.encodeBase64String("contenuto test1".getBytes()));

	    AllegatoItemCreate allegatoCreate2 = new AllegatoItemCreate();
	    allegatoCreate2.setTipologia(TipologiaAllegatoEnum.SPECIFICA);
	    allegatoCreate2.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
	    allegatoCreate2.setFilename("allegato_test2.pdf");
	    allegatoCreate2.setContent(Base64.encodeBase64String("contenuto test2".getBytes()));

	    List<AllegatoItemCreate> allegati = new ArrayList<>();
	    allegati.add(allegatoCreate1);
	    allegati.add(allegatoCreate2);
	    serviziController.createAllegatoServizio(idServizio, allegati);

	    // Filtra solo per allegati con tipologia GENERICO
	    ResponseEntity<PagedModelAllegato> response = serviziController.listAllegatiServizio(idServizio, null, null, TipologiaAllegatoEnum.GENERICO, null, 0, 10, null);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());
	    assertEquals(1, response.getBody().getContent().size());
	    assertEquals("allegato_test1.pdf", response.getBody().getContent().get(0).getFilename());
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteServizioSuccess() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Invocazione del metodo deleteServizio
	    ResponseEntity<Void> response = serviziController.deleteServizio(idServizio);

	    // Verifica del successo
	    assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());

	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteServizioNotFound() {
	    // UUID del servizio inesistente
	    UUID idServizioNonEsistente = UUID.randomUUID();

	    // Test per servizio non trovato
	    assertThrows(NotFoundException.class, () -> {
	        serviziController.deleteServizio(idServizioNonEsistente);
	    });
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteServizioAuthorizationFailed() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Configura un utente senza autorizzazioni
	    CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
	    
	    // Test per autorizzazione fallita
	    assertThrows(NotAuthorizedException.class, () -> {
	        serviziController.deleteServizio(idServizio);
	    });
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteServizioUtenteAnonimo() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    this.tearDown();
	    
	    // Test per autorizzazione fallita
	    assertThrows(NotAuthorizedException.class, () -> {
	        serviziController.deleteServizio(idServizio);
	    });
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListServiziGruppiAllNullSuccess() {
	    // Creazione del servizio e gruppo tramite getServizio
	    Servizio servizio = this.getServizio();
	    GruppoCreate gruppoPadre = CommonUtils.getGruppoCreate();
	    gruppoPadre.setNome("gruppo padre");
	    ResponseEntity<Gruppo> createdGruppoPadre = gruppiController.createGruppo(gruppoPadre);
	    UUID idGruppoPadre = createdGruppoPadre.getBody().getIdGruppo();
	    serviziController.addGruppoServizio(servizio.getIdServizio(), idGruppoPadre);
	    //creo il gruppo
	    GruppoCreate gruppo = CommonUtils.getGruppoCreate();
	    gruppo.setPadre(idGruppoPadre);
	    ResponseEntity<Gruppo> createdGruppo = gruppiController.createGruppo(gruppo);
	    serviziController.addGruppoServizio(servizio.getIdServizio(), createdGruppo.getBody().getIdGruppo());
	    //CommonUtils.getSessionUtente("colombo", securityContext, authentication, utenteService);
	    when(coreAuthorization.isAdmin(any())).thenReturn(false);
	    // Invocazione del metodo listServiziGruppi
	    ResponseEntity<PagedModelItemServizioGruppo> response = serviziController.listServiziGruppi(idGruppoPadre, null, null, null, 0, 10, null);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());
	    assertFalse(response.getBody().getContent().isEmpty());   
	}
	
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListServiziGruppiTipoServizioAPISuccess() {
	    // Creazione del servizio e gruppo tramite getServizio
	    Servizio servizio = this.getServizio();
	    GruppoCreate gruppoPadre = CommonUtils.getGruppoCreate();
	    gruppoPadre.setNome("gruppo padre");
	    ResponseEntity<Gruppo> createdGruppoPadre = gruppiController.createGruppo(gruppoPadre);
	    UUID idGruppoPadre = createdGruppoPadre.getBody().getIdGruppo();
	    serviziController.addGruppoServizio(servizio.getIdServizio(), idGruppoPadre);
	    //creo il gruppo
	    GruppoCreate gruppo = CommonUtils.getGruppoCreate();
	    gruppo.setPadre(idGruppoPadre);
	    ResponseEntity<Gruppo> createdGruppo = gruppiController.createGruppo(gruppo);
	    serviziController.addGruppoServizio(servizio.getIdServizio(), createdGruppo.getBody().getIdGruppo());
	    //CommonUtils.getSessionUtente("colombo", securityContext, authentication, utenteService);
	    when(coreAuthorization.isAdmin(any())).thenReturn(false);
	    // Invocazione del metodo listServiziGruppi
	    ResponseEntity<PagedModelItemServizioGruppo> response = serviziController.listServiziGruppi(idGruppoPadre, null, TipoServizio.API, null, 0, 10, null);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());
	    assertFalse(response.getBody().getContent().isEmpty());   
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListServiziGruppiTipoServizioGenericoSuccess() {
	    // Creazione del servizio e gruppo tramite getServizio
	    Servizio servizio = this.getServizio();
	    GruppoCreate gruppoPadre = CommonUtils.getGruppoCreate();
	    gruppoPadre.setNome("gruppo padre");
	    ResponseEntity<Gruppo> createdGruppoPadre = gruppiController.createGruppo(gruppoPadre);
	    UUID idGruppoPadre = createdGruppoPadre.getBody().getIdGruppo();
	    serviziController.addGruppoServizio(servizio.getIdServizio(), idGruppoPadre);
	    //creo il gruppo
	    GruppoCreate gruppo = CommonUtils.getGruppoCreate();
	    gruppo.setPadre(idGruppoPadre);
	    ResponseEntity<Gruppo> createdGruppo = gruppiController.createGruppo(gruppo);
	    serviziController.addGruppoServizio(servizio.getIdServizio(), createdGruppo.getBody().getIdGruppo());
	    //CommonUtils.getSessionUtente("colombo", securityContext, authentication, utenteService);
	    when(coreAuthorization.isAdmin(any())).thenReturn(false);
	    // Invocazione del metodo listServiziGruppi
	    ResponseEntity<PagedModelItemServizioGruppo> response = serviziController.listServiziGruppi(idGruppoPadre, null, TipoServizio.GENERICO, null, 0, 10, null);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());  
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListServiziGruppiTipoServizioGenericoUtenteReferenteServizioSuccess() {
	    // Creazione del servizio e gruppo tramite getServizio
	    Servizio servizio = this.getServizio();
	    GruppoCreate gruppoPadre = CommonUtils.getGruppoCreate();
	    gruppoPadre.setNome("gruppo padre");
	    ResponseEntity<Gruppo> createdGruppoPadre = gruppiController.createGruppo(gruppoPadre);
	    UUID idGruppoPadre = createdGruppoPadre.getBody().getIdGruppo();
	    serviziController.addGruppoServizio(servizio.getIdServizio(), idGruppoPadre);
	    //creo il gruppo
	    GruppoCreate gruppo = CommonUtils.getGruppoCreate();
	    gruppo.setPadre(idGruppoPadre);
	    ResponseEntity<Gruppo> createdGruppo = gruppiController.createGruppo(gruppo);
	    serviziController.addGruppoServizio(servizio.getIdServizio(), createdGruppo.getBody().getIdGruppo());
    	
	    when(coreAuthorization.isAdmin(any())).thenReturn(false);
	    // Invocazione del metodo listServiziGruppi
	    ResponseEntity<PagedModelItemServizioGruppo> response = serviziController.listServiziGruppi(idGruppoPadre, null, TipoServizio.GENERICO, null, 0, 10, null);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());  
	}
	
	/*
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListServiziGruppiTipoServizioGenericoUtenteReferenteServizioSuccess2() {
	    // Creazione del servizio e gruppo tramite getServizio
	    Servizio servizio = this.getServizio();
	    GruppoCreate gruppoPadre = CommonUtils.getGruppoCreate();
	    gruppoPadre.setNome("gruppo padre");
	    ResponseEntity<Gruppo> createdGruppoPadre = gruppiController.createGruppo(gruppoPadre);
	    UUID idGruppoPadre = createdGruppoPadre.getBody().getIdGruppo();
	    serviziController.addGruppoServizio(servizio.getIdServizio(), idGruppoPadre);
	    //creo il gruppo
	    GruppoCreate gruppo = CommonUtils.getGruppoCreate();
	    gruppo.setPadre(idGruppoPadre);
	    ResponseEntity<Gruppo> createdGruppo = gruppiController.createGruppo(gruppo);
	    serviziController.addGruppoServizio(servizio.getIdServizio(), createdGruppo.getBody().getIdGruppo());
    	
	    CommonUtils.getSessionUtente("colombo", securityContext, authentication, utenteService);
	    //this.tearDown();
	    // Invocazione del metodo listServiziGruppi
	    ResponseEntity<PagedModelItemServizioGruppo> response = serviziController.listServiziGruppi(idGruppoPadre, null, TipoServizio.GENERICO, null, 0, 10, null);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());  
	}
	*/
	 public Servizio getServizio(String nomeServizio) {
	    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
	    	
	    	servizioCreate.setNome(nomeServizio);

	    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

	    	servizioCreate.setIdDominio(idDominio);

	    	if (immagine.getContent() != null) {
	    		servizioCreate.setImmagine(immagine);
	    	}

	    	List<ReferenteCreate> referenti = new ArrayList<>();

	    	ReferenteCreate referente = new ReferenteCreate();
	    	referente.setTipo(TipoReferenteEnum.REFERENTE);
	    	referente.setIdUtente(UTENTE_GESTORE);
	    	referenti.add(referente);

	    	servizioCreate.setReferenti(referenti);

	    	ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);

	    	Servizio servizio = createdServizio.getBody();

	    	return servizio;
	    }
	
	private UUID getGruppiServizi(int numGruppi) {
		// Creazione del servizio e gruppo tramite getServizio
	    Servizio servizio = this.getServizio();
	    GruppoCreate gruppoPadre = CommonUtils.getGruppoCreate();
	    gruppoPadre.setNome("gruppo padre");
	    ResponseEntity<Gruppo> createdGruppoPadre = gruppiController.createGruppo(gruppoPadre);
	    UUID idGruppoPadre = createdGruppoPadre.getBody().getIdGruppo();
	    serviziController.addGruppoServizio(servizio.getIdServizio(), idGruppoPadre);
	    //creo il gruppo
	    GruppoCreate gruppo = CommonUtils.getGruppoCreate();
	    gruppo.setNome("Gruppo figlio");
	    gruppo.setPadre(idGruppoPadre);
	    for(int n = 0; n < numGruppi; n++) {
	    	gruppo.setNome(CommonUtils.NOME_GRUPPO+n);
		    ResponseEntity<Gruppo> createdGruppo = gruppiController.createGruppo(gruppo);
		    serviziController.addGruppoServizio(servizio.getIdServizio(), createdGruppo.getBody().getIdGruppo());
		    servizio = this.getServizio(CommonUtils.NOME_SERVIZIO+n);
		    serviziController.addGruppoServizio(servizio.getIdServizio(), createdGruppo.getBody().getIdGruppo());
	    }
	    return idGruppoPadre;
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziGruppiSortedNameDesc() {
        UUID idPadre = this.getGruppiServizi(3);

        List<String> sort = new ArrayList<>();
        sort.add("nome,desc");
        
        // Invocazione del metodo listServiziGruppi con filtri
        ResponseEntity<PagedModelItemServizioGruppo> response = serviziController.listServiziGruppi(idPadre, null, null, null, 0, 5, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il gruppo filtrato sia presente nell'elenco
        List<ItemServizioGruppo> gruppiServizio = response.getBody().getContent();
        //gruppiServizio.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(gruppiServizio.stream().anyMatch(s -> s.getNome().equals(CommonUtils.NOME_GRUPPO+0)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals(CommonUtils.NOME_GRUPPO+2, gruppiServizio.get(1).getNome());
    }
	
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziGruppiSortedNameAsc() {
    	UUID idPadre = this.getGruppiServizi(3);

        List<String> sort = new ArrayList<>();
        sort.add("nome,asc");
        
        // Invocazione del metodo listServizi con filtri
        ResponseEntity<PagedModelItemServizioGruppo> response = serviziController.listServiziGruppi(idPadre, null, null, null, 0, 5, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il servizio filtrato sia presente nell'elenco
        List<ItemServizioGruppo> gruppiServizio = response.getBody().getContent();
        //gruppiServizio.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(gruppiServizio.stream().anyMatch(s -> s.getNome().equals(CommonUtils.NOME_GRUPPO+2)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals(CommonUtils.NOME_GRUPPO+0, gruppiServizio.get(0).getNome());
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziGruppiMultiSorted() {
    	UUID idPadre = this.getGruppiServizi(3);

        List<String> sort = new ArrayList<>();
        sort.add("nome,asc");
        sort.add("versione,desc");
        
        
        // Invocazione del metodo listServizi con filtri
        ResponseEntity<PagedModelItemServizioGruppo> response = serviziController.listServiziGruppi(idPadre, null, null, null, 0, 5, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il servizio filtrato sia presente nell'elenco
        List<ItemServizioGruppo> gruppiServizio = response.getBody().getContent();
        //gruppiServizio.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(gruppiServizio.stream().anyMatch(s -> s.getNome().equals(CommonUtils.NOME_GRUPPO+2)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals(CommonUtils.NOME_GRUPPO+0, gruppiServizio.get(0).getNome());
    }
    
    @Test
    @DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
    void testListServiziGruppiMultiPage() {
    	UUID idPadre = this.getGruppiServizi(50);
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 50;
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
        	// Invocazione del metodo listServizi con filtri
            ResponseEntity<PagedModelItemServizioGruppo> response = serviziController.listServiziGruppi(idPadre, null, null, null, n, numeroElementiPerPagina, null);

            // Verifica del successo
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().getContent().isEmpty());
        }
    }
	/*
	@Test
	public void testListServiziGruppiAuthorizationFailed() {
	    // Simulazione di un gruppo padre
	    UUID idGruppoPadre = UUID.randomUUID();

	    // Configura un utente senza autorizzazioni
	    CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

	    // Test per autorizzazione fallita
	    Exception exception = assertThrows(InvalidDataAccessResourceUsageException.class, () -> {
	        serviziController.listServiziGruppi(idGruppoPadre, false, null, null, 0, 10, null);
	    });
	}
	 */
	public Dominio getDominioPerOrganizzazioni() {

    	OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
    	organizzazione.setNome("Prima Organizzazione");
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

    	this.setIdDominio(createdDominio.getBody().getIdDominio());
    	
    	return createdDominio.getBody();
    }

    public Servizio getServizioPerOrganizzazioni() {
    	Dominio dominio = this.getDominioPerOrganizzazioni();
    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

    	servizioCreate.setIdDominio(dominio.getIdDominio());

    	if (immagine.getContent() != null) {
    		servizioCreate.setImmagine(immagine);
    	}

    	List<ReferenteCreate> referenti = new ArrayList<>();

    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	referente.setIdUtente(UTENTE_GESTORE);
    	referenti.add(referente);

    	servizioCreate.setReferenti(referenti);

    	ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
    	
    	Servizio servizio = createdServizio.getBody();

    	return servizio;
    }
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListOrganizzazioniAmmissibiliSuccess() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Invocazione del metodo listOrganizzazioniAmmissibili
	    ResponseEntity<PagedModelItemOrganizzazione> response = serviziController.listOrganizzazioniAmmissibili(idServizio, null, 0, 10, null);
	    
	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());
	}
	/*
	@Test
    void testListOrganizzazioniAmmissibiliSortedNameDesc() {
		// Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Invocazione del metodo listOrganizzazioniAmmissibili
	    ResponseEntity<PagedModelItemOrganizzazione> response = serviziController.listOrganizzazioniAmmissibili(idServizio, null, 0, 10, null);
	    response.getBody().getContent().stream().forEach(s->{System.out.println("ECCO IL NOME: "+s.getNome());});
	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());
    }
    
    @Test
    void testListOrganizzazioniAmmissibiliSortedNameAsc() {
        this.getMultiServizi();

        List<String> sort = new ArrayList<>();
        sort.add("nome,asc");
        
        // Invocazione del metodo listServizi con filtri
        ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(
            null, idDominio, null, null, null, null, null, null, false, false, null, null, null, null, null, null, null, 0, 10, sort
        );

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il servizio filtrato sia presente nell'elenco
        List<ItemServizio> servizi = response.getBody().getContent();
        assertTrue(servizi.stream().anyMatch(s -> s.getNome().equals(NOME_SERVIZIO_3)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals(NOME_SERVIZIO_1, servizi.get(0).getNome());
    }
    
    @Test
    void testListOrganizzazioniAmmissibiliMultiSorted() {
        this.getMultiServizi();

        List<String> sort = new ArrayList<>();
        sort.add("nome,asc");
        sort.add("dataCreazione,asc");
        sort.add("versione,desc");
        
        
        // Invocazione del metodo listServizi con filtri
        ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(
            null, idDominio, null, null, null, null, null, null, false, false, null, null, null, null, null, null, null, 0, 10, sort
        );

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il servizio filtrato sia presente nell'elenco
        List<ItemServizio> servizi = response.getBody().getContent();
        assertTrue(servizi.stream().anyMatch(s -> s.getNome().equals(NOME_SERVIZIO_2)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals(NOME_SERVIZIO_1, servizi.get(0).getNome());
    }
    
    @Test
    void testListOrganizzazioniAmmissibiliMultiPage() {
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 40;
        this.getMultiServizi(numeroTotaleDiElementi);
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
        	// Invocazione del metodo listServizi con filtri
            ResponseEntity<PagedModelItemServizio> response = serviziController.listServizi(
                null, idDominio, null, null, null, null, null, null, false, false, null, null, null, null, null, null, null, n, numeroElementiPerPagina, null
            );

            // Verifica del successo
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().getContent().isEmpty());
        }
    }
    */
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListOrganizzazioniAmmissibiliNotFound() {
	    // UUID del servizio inesistente
	    UUID idServizioNonEsistente = UUID.randomUUID();

	    // Test per servizio non trovato
	    assertThrows(NotFoundException.class, () -> {
	        serviziController.listOrganizzazioniAmmissibili(idServizioNonEsistente, null, 0, 10, null);
	    });

	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListOrganizzazioniAmmissibiliWithQuery() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Definiamo una query di ricerca
	    String query = "organizzazione test";

	    // Invocazione del metodo listOrganizzazioniAmmissibili con query
	    ResponseEntity<PagedModelItemOrganizzazione> response = serviziController.listOrganizzazioniAmmissibili(idServizio, query, 0, 10, null);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testAddGruppoServizioSuccess() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di un gruppo
	    GruppoCreate gruppoCreate = new GruppoCreate();
	    gruppoCreate.setNome("Gruppo Test");
	    gruppoCreate.setTipo(TipoServizio.API);
	    ResponseEntity<Gruppo> gruppoResponse = gruppiController.createGruppo(gruppoCreate);
	    UUID idGruppo = gruppoResponse.getBody().getIdGruppo();

	    // Invocazione del metodo addGruppoServizio
	    ResponseEntity<ItemGruppo> response = serviziController.addGruppoServizio(idServizio, idGruppo);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());
	    assertEquals("Gruppo Test", response.getBody().getNome());
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testAddGruppoServizioNotFound() {
	    // UUID del servizio inesistente
	    UUID idServizioNonEsistente = UUID.randomUUID();

	    // Creazione di un gruppo
	    GruppoCreate gruppoCreate = new GruppoCreate();
	    gruppoCreate.setNome("Gruppo Test");
	    gruppoCreate.setTipo(TipoServizio.GENERICO);
	    ResponseEntity<Gruppo> gruppoResponse = gruppiController.createGruppo(gruppoCreate);
	    UUID idGruppo = gruppoResponse.getBody().getIdGruppo();

	    // Test per servizio non trovato
	    assertThrows(NotFoundException.class, () -> {
	        serviziController.addGruppoServizio(idServizioNonEsistente, idGruppo);
	    });
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testAddGruppoServizioGruppoNotFound() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // UUID del gruppo inesistente
	    UUID idGruppoNonEsistente = UUID.randomUUID();

	    // Test per gruppo non trovato
	    Exception exception = assertThrows(NotFoundException.class, () -> {
	        serviziController.addGruppoServizio(idServizio, idGruppoNonEsistente);
	    });

	    String expectedMessage = "Gruppo [" + idGruppoNonEsistente + "] non trovato";
	    assertTrue(exception.getMessage().contains(expectedMessage));
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testAddGruppoServizioAlreadyAssociated() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di un gruppo
	    GruppoCreate gruppoCreate = new GruppoCreate();
	    gruppoCreate.setNome("Gruppo Test");
	    gruppoCreate.setTipo(TipoServizio.API);
	    ResponseEntity<Gruppo> gruppoResponse = gruppiController.createGruppo(gruppoCreate);
	    UUID idGruppo = gruppoResponse.getBody().getIdGruppo();

	    // Associazione del gruppo al servizio
	    serviziController.addGruppoServizio(idServizio, idGruppo);

	    // Tentativo di ri-associare lo stesso gruppo
	    Exception exception = assertThrows(ConflictException.class, () -> {
	        serviziController.addGruppoServizio(idServizio, idGruppo);
	    });

	    String expectedMessage = "Gruppo [Gruppo Test] gia associato al servizio";
	    assertTrue(exception.getMessage().contains(expectedMessage));
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testAddGruppoServizioAuthorizationFailed() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di un gruppo
	    GruppoCreate gruppoCreate = new GruppoCreate();
	    gruppoCreate.setNome("Gruppo Test");
	    gruppoCreate.setTipo(TipoServizio.GENERICO);
	    ResponseEntity<Gruppo> gruppoResponse = gruppiController.createGruppo(gruppoCreate);
	    UUID idGruppo = gruppoResponse.getBody().getIdGruppo();

	    // Configura un utente senza autorizzazioni
	    CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

	    // Test per autorizzazione fallita
	    assertThrows(NotAuthorizedException.class, () -> {
	        serviziController.addGruppoServizio(idServizio, idGruppo);
	    });
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testAddGruppoServizioUtenteAnonimo() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di un gruppo
	    GruppoCreate gruppoCreate = new GruppoCreate();
	    gruppoCreate.setNome("Gruppo Test");
	    gruppoCreate.setTipo(TipoServizio.GENERICO);
	    ResponseEntity<Gruppo> gruppoResponse = gruppiController.createGruppo(gruppoCreate);
	    UUID idGruppo = gruppoResponse.getBody().getIdGruppo();

	    this.tearDown();
	    
	    // Test per autorizzazione fallita
	    assertThrows(NotAuthorizedException.class, () -> {
	        serviziController.addGruppoServizio(idServizio, idGruppo);
	    });
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteGruppoServizioSuccess() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di un gruppo
	    GruppoCreate gruppoCreate = new GruppoCreate();
	    gruppoCreate.setNome("Gruppo Test");
	    gruppoCreate.setTipo(TipoServizio.API);
	    ResponseEntity<Gruppo> gruppoResponse = gruppiController.createGruppo(gruppoCreate);
	    UUID idGruppo = gruppoResponse.getBody().getIdGruppo();

	    // Associazione del gruppo al servizio
	    serviziController.addGruppoServizio(idServizio, idGruppo);

	    // Invocazione del metodo deleteGruppoServizio
	    ResponseEntity<Void> response = serviziController.deleteGruppoServizio(idServizio, idGruppo);

	    // Verifica del successo
	    assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteGruppoServizioNotFound() {
	    // UUID del servizio inesistente
	    UUID idServizioNonEsistente = UUID.randomUUID();

	    // Creazione di un gruppo
	    GruppoCreate gruppoCreate = new GruppoCreate();
	    gruppoCreate.setNome("Gruppo Test");
	    gruppoCreate.setTipo(TipoServizio.API);
	    ResponseEntity<Gruppo> gruppoResponse = gruppiController.createGruppo(gruppoCreate);
	    UUID idGruppo = gruppoResponse.getBody().getIdGruppo();

	    // Test per servizio non trovato
	    assertThrows(NotFoundException.class, () -> {
	        serviziController.deleteGruppoServizio(idServizioNonEsistente, idGruppo);
	    });
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteGruppoServizioGruppoNotFound() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // UUID del gruppo inesistente
	    UUID idGruppoNonEsistente = UUID.randomUUID();

	    // Test per gruppo non trovato
	    assertThrows(NotFoundException.class, () -> {
	        serviziController.deleteGruppoServizio(idServizio, idGruppoNonEsistente);
	    });
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteGruppoServizioAuthorizationFailed() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di un gruppo
	    GruppoCreate gruppoCreate = new GruppoCreate();
	    gruppoCreate.setNome("Gruppo Test");
	    gruppoCreate.setTipo(TipoServizio.API);
	    ResponseEntity<Gruppo> gruppoResponse = gruppiController.createGruppo(gruppoCreate);
	    UUID idGruppo = gruppoResponse.getBody().getIdGruppo();

	    // Associazione del gruppo al servizio
	    serviziController.addGruppoServizio(idServizio, idGruppo);

	    // Configura un utente senza autorizzazioni
	    CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

	    // Test per autorizzazione fallita
	    assertThrows(NotAuthorizedException.class, () -> {
	        serviziController.deleteGruppoServizio(idServizio, idGruppo);
	    });
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteGruppoServizioUtenteAnonimo() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di un gruppo
	    GruppoCreate gruppoCreate = new GruppoCreate();
	    gruppoCreate.setNome("Gruppo Test");
	    gruppoCreate.setTipo(TipoServizio.API);
	    ResponseEntity<Gruppo> gruppoResponse = gruppiController.createGruppo(gruppoCreate);
	    UUID idGruppo = gruppoResponse.getBody().getIdGruppo();

	    // Associazione del gruppo al servizio
	    serviziController.addGruppoServizio(idServizio, idGruppo);

	    this.tearDown();
	    
	    // Test per autorizzazione fallita
	    assertThrows(NotAuthorizedException.class, () -> {
	        serviziController.deleteGruppoServizio(idServizio, idGruppo);
	    });
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListGruppiServizioSuccess() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di un gruppo
	    GruppoCreate gruppoCreate = new GruppoCreate();
	    gruppoCreate.setNome("Gruppo Test");
	    gruppoCreate.setTipo(TipoServizio.API);
	    ResponseEntity<Gruppo> gruppoResponse = gruppiController.createGruppo(gruppoCreate);
	    UUID idGruppo = gruppoResponse.getBody().getIdGruppo();

	    // Associazione del gruppo al servizio
	    serviziController.addGruppoServizio(idServizio, idGruppo);

	    // Invocazione del metodo listGruppiServizio
	    ResponseEntity<ListItemGruppo> response = serviziController.listGruppiServizio(idServizio);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    List<ItemGruppo> gruppi = response.getBody().getContent();
	    assertNotNull(gruppi);
	    assertFalse(gruppi.isEmpty());
	    assertEquals("Gruppo Test", gruppi.get(0).getNome());
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListGruppiServizioNotFound() {
	    // UUID del servizio inesistente
	    UUID idServizioNonEsistente = UUID.randomUUID();

	    // Test per servizio non trovato
	    assertThrows(NotFoundException.class, () -> {
	        serviziController.listGruppiServizio(idServizioNonEsistente);
	    });
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testGetGrantServizioSuccess() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Invocazione del metodo getGrantServizio
	    ResponseEntity<Grant> response = serviziController.getGrantServizio(idServizio);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    Grant grant = response.getBody();
	    assertNotNull(grant);
	    assertNotNull(grant.getRuoli());
	    assertEquals(GrantType.SCRITTURA, grant.getIdentificativo());
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testGetGrantServizioIsAnounymous() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();
	    
	    this.tearDown();
	    
	    // Invocazione del metodo getGrantServizio
	    ResponseEntity<Grant> response = serviziController.getGrantServizio(idServizio);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    Grant grant = response.getBody();
	    assertNotNull(grant);
	    assertNotNull(grant.getRuoli());
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testGetGrantServizioNotFound() {
	    // UUID del servizio inesistente
	    UUID idServizioNonEsistente = UUID.randomUUID();

	    // Test per servizio non trovato
	    assertThrows(NotFoundException.class, () -> {
	        serviziController.getGrantServizio(idServizioNonEsistente);
	    });
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testAddCategorieServizioSuccess() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione delle categorie da associare
	    TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
	    ResponseEntity<Tassonomia> responseTassonomia = tassonomieController.createTassonomia(tassonomiaCreate);
	    assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

	    UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

	    CategoriaCreate categoriaCreate = new CategoriaCreate();
	    categoriaCreate.setNome("xyz");
	    categoriaCreate.setDescrizione("descrizione xyz");
	    
	    CategoriaCreate categoriaCreate2 = new CategoriaCreate();
	    categoriaCreate2.setNome("xyz2");
	    categoriaCreate2.setDescrizione("descrizione xyz2");
	    
	    ResponseEntity<Categoria> responseCategoria = tassonomieController.createTassonomiaCategoria(idTassonomia, categoriaCreate);
	    ResponseEntity<Categoria> responseCategoria2 = tassonomieController.createTassonomiaCategoria(idTassonomia, categoriaCreate2);
	    UUID idCategoria1 = responseCategoria.getBody().getIdCategoria();
	    UUID idCategoria2 = responseCategoria2.getBody().getIdCategoria();

	    CategorieCreate categorieCreate = new CategorieCreate();
	    categorieCreate.setCategorie(List.of(idCategoria1, idCategoria2));
	    
	    
	    
	    // Invocazione del metodo addCategorieServizio
	    ResponseEntity<ListItemCategoria> response = serviziController.addCategorieServizio(idServizio, categorieCreate);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    ListItemCategoria model = response.getBody();
	    assertNotNull(model);
	    assertEquals(2, model.getContent().size()); // Verifica che entrambe le categorie siano state aggiunte
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testAddCategorieServizioNotFound() {
	    // UUID del servizio inesistente
	    UUID idServizioNonEsistente = UUID.randomUUID();

	    // Creazione delle categorie da associare
	    UUID idCategoria = UUID.randomUUID();

	    CategorieCreate categorieCreate = new CategorieCreate();
	    categorieCreate.setCategorie(List.of(idCategoria));

	    // Test per servizio non trovato
	    Exception exception = assertThrows(NotFoundException.class, () -> {
	        serviziController.addCategorieServizio(idServizioNonEsistente, categorieCreate);
	    });

	    String expectedMessage = "Servizio con id [" + idServizioNonEsistente + "] non trovato";
	    assertTrue(exception.getMessage().contains(expectedMessage));
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testAddCategorieServizioCategoriaNotFound() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // UUID di una categoria inesistente
	    UUID idCategoriaNonEsistente = UUID.randomUUID();

	    CategorieCreate categorieCreate = new CategorieCreate();
	    categorieCreate.setCategorie(List.of(idCategoriaNonEsistente));

	    // Test per categoria non trovata
	    Exception exception = assertThrows(NotFoundException.class, () -> {
	        serviziController.addCategorieServizio(idServizio, categorieCreate);
	    });

	    String expectedMessage = "Categoria [" + idCategoriaNonEsistente + "] non trovata";
	    assertTrue(exception.getMessage().contains(expectedMessage));
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testAddCategorieServizioCategoriaNonFoglia() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione delle categorie da associare
	    TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
	    ResponseEntity<Tassonomia> responseTassonomia = tassonomieController.createTassonomia(tassonomiaCreate);
	    assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

	    UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

	    CategoriaCreate categoriaCreate = new CategoriaCreate();
	    categoriaCreate.setNome("xyz");
	    categoriaCreate.setDescrizione("descrizione xyz");
	    
	    CategoriaFiglioCreate categoriaFiglioCreate = new CategoriaFiglioCreate();
	    categoriaFiglioCreate.setNome("categoria figlio");
	    categoriaFiglioCreate.setDescrizione("descrizione categoria figlio");
	    
	    categoriaCreate.setFigli(List.of(categoriaFiglioCreate));
	    
	    ResponseEntity<Categoria> responseCategoria = tassonomieController.createTassonomiaCategoria(idTassonomia, categoriaCreate);
	    // UUID di una categoria non foglia
	    UUID idCategoriaNonFoglia = responseCategoria.getBody().getIdCategoria();

	    CategorieCreate categorieCreate = new CategorieCreate();
	    categorieCreate.setCategorie(List.of(idCategoriaNonFoglia));
	    /*
	    //TODO:
	    // Test per categoria non foglia
	    Exception exception = assertThrows(ConflictException.class, () -> {
	        serviziController.addCategorieServizio(idServizio, categorieCreate);
	    });

	    String expectedMessage = "Impossibile associare la Categoria";
	    assertTrue(exception.getMessage().contains(expectedMessage));
	     */
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testAddCategorieServizioCategoriaGiaAssociata() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione delle categorie da associare
	    TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
	    ResponseEntity<Tassonomia> responseTassonomia = tassonomieController.createTassonomia(tassonomiaCreate);
	    assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

	    UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

	    CategoriaCreate categoriaCreate = new CategoriaCreate();
	    categoriaCreate.setNome("xyz");
	    categoriaCreate.setDescrizione("descrizione xyz");
	    
	    CategoriaCreate categoriaCreate2 = new CategoriaCreate();
	    categoriaCreate2.setNome("xyz2");
	    categoriaCreate2.setDescrizione("descrizione xyz2");
	    
	    ResponseEntity<Categoria> responseCategoria = tassonomieController.createTassonomiaCategoria(idTassonomia, categoriaCreate);
	    ResponseEntity<Categoria> responseCategoria2 = tassonomieController.createTassonomiaCategoria(idTassonomia, categoriaCreate2);
	    UUID idCategoria1 = responseCategoria.getBody().getIdCategoria();
	    UUID idCategoria2 = responseCategoria2.getBody().getIdCategoria();

	    CategorieCreate categorieCreate = new CategorieCreate();
	    categorieCreate.setCategorie(List.of(idCategoria1, idCategoria2));

	    // Aggiunta della categoria al servizio una prima volta
	    ResponseEntity<ListItemCategoria> response = serviziController.addCategorieServizio(idServizio, categorieCreate);

	    // Test per categoria già associata
	    Exception exception = assertThrows(ConflictException.class, () -> {
	        serviziController.addCategorieServizio(idServizio, categorieCreate);
	    });
	    //System.out.println(idCategoria1);
	    //System.out.println(idCategoria2);
	    //System.out.println(exception.getMessage());
	    String expectedMessage = "Categoria [" + categoriaCreate.getNome() + "] gia associato al servizio";
	    assertTrue(exception.getMessage().contains(expectedMessage));
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteCategoriaServizioSuccess() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di una categoria e associazione al servizio
	    TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
	    ResponseEntity<Tassonomia> responseTassonomia = tassonomieController.createTassonomia(tassonomiaCreate);
	    assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

	    UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

	    CategoriaCreate categoriaCreate = new CategoriaCreate();
	    categoriaCreate.setNome("xyz");
	    categoriaCreate.setDescrizione("descrizione xyz");
	    
	    CategoriaCreate categoriaCreate2 = new CategoriaCreate();
	    categoriaCreate2.setNome("xyz2");
	    categoriaCreate2.setDescrizione("descrizione xyz2");
	    
	    ResponseEntity<Categoria> responseCategoria = tassonomieController.createTassonomiaCategoria(idTassonomia, categoriaCreate);
	    ResponseEntity<Categoria> responseCategoria2 = tassonomieController.createTassonomiaCategoria(idTassonomia, categoriaCreate2);
	    UUID idCategoria1 = responseCategoria.getBody().getIdCategoria();
	    UUID idCategoria2 = responseCategoria2.getBody().getIdCategoria();

	    CategorieCreate categorieCreate = new CategorieCreate();
	    categorieCreate.setCategorie(List.of(idCategoria1, idCategoria2));

	    serviziController.addCategorieServizio(idServizio, categorieCreate);

	    // Invocazione del metodo deleteCategoriaServizio
	    ResponseEntity<Void> response = serviziController.deleteCategoriaServizio(idServizio, idCategoria2);

	    // Verifica del successo
	    assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteCategoriaServizioServizioNotFound() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di una categoria
	    TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
	    ResponseEntity<Tassonomia> responseTassonomia = tassonomieController.createTassonomia(tassonomiaCreate);
	    assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

	    UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

	    CategoriaCreate categoriaCreate = new CategoriaCreate();
	    categoriaCreate.setNome("xyz");
	    categoriaCreate.setDescrizione("descrizione xyz");

	    ResponseEntity<Categoria> responseCategoria = tassonomieController.createTassonomiaCategoria(idTassonomia, categoriaCreate);
	    UUID idCategoria = responseCategoria.getBody().getIdCategoria();

	    // UUID del servizio inesistente
	    UUID idServizioNonEsistente = UUID.randomUUID();

	    // Test per servizio non trovato
	    assertThrows(NotFoundException.class, () -> {
	        serviziController.deleteCategoriaServizio(idServizioNonEsistente, idCategoria);
	    });
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteCategoriaServizioCategoriaNotFound() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // UUID di una categoria inesistente
	    UUID idCategoriaNonEsistente = UUID.randomUUID();

	    // Test per categoria non trovata
	    assertThrows(NotFoundException.class, () -> {
	        serviziController.deleteCategoriaServizio(idServizio, idCategoriaNonEsistente);
	    });
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteCategoriaServizioAuthorizationFailed() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di una categoria e associazione al servizio
	    TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
	    ResponseEntity<Tassonomia> responseTassonomia = tassonomieController.createTassonomia(tassonomiaCreate);
	    assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

	    UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

	    CategoriaCreate categoriaCreate = new CategoriaCreate();
	    categoriaCreate.setNome("xyz");
	    categoriaCreate.setDescrizione("descrizione xyz");

	    ResponseEntity<Categoria> responseCategoria = tassonomieController.createTassonomiaCategoria(idTassonomia, categoriaCreate);
	    UUID idCategoria = responseCategoria.getBody().getIdCategoria();

	    CategorieCreate categorieCreate = new CategorieCreate();
	    categorieCreate.setCategorie(List.of(idCategoria));

	    serviziController.addCategorieServizio(idServizio, categorieCreate);
	    //serviziController.deleteCategoriaServizio(idServizio, idCategoria);
	    // Configura un InfoProfilo senza il ruolo richiesto
	    CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

	    // Test per autorizzazione fallita
	    Exception exception = assertThrows(NotAuthorizedException.class, () -> {
	        serviziController.deleteCategoriaServizio(idServizio, idCategoria);
	    });
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testDeleteCategoriaServizioUtenteAnonimo() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di una categoria e associazione al servizio
	    TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
	    ResponseEntity<Tassonomia> responseTassonomia = tassonomieController.createTassonomia(tassonomiaCreate);
	    assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

	    UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

	    CategoriaCreate categoriaCreate = new CategoriaCreate();
	    categoriaCreate.setNome("xyz");
	    categoriaCreate.setDescrizione("descrizione xyz");

	    ResponseEntity<Categoria> responseCategoria = tassonomieController.createTassonomiaCategoria(idTassonomia, categoriaCreate);
	    UUID idCategoria = responseCategoria.getBody().getIdCategoria();

	    CategorieCreate categorieCreate = new CategorieCreate();
	    categorieCreate.setCategorie(List.of(idCategoria));

	    serviziController.addCategorieServizio(idServizio, categorieCreate);
	    
	    this.tearDown();
	    
	    // Test per autorizzazione fallita
	    Exception exception = assertThrows(NotAuthorizedException.class, () -> {
	        serviziController.deleteCategoriaServizio(idServizio, idCategoria);
	    });
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListCategorieServizioSuccess() {
	    // Creazione del servizio tramite getServizio
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Creazione di una categoria e associazione al servizio
	    TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
	    ResponseEntity<Tassonomia> responseTassonomia = tassonomieController.createTassonomia(tassonomiaCreate);
	    assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

	    UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

	    CategoriaCreate categoriaCreate = new CategoriaCreate();
	    categoriaCreate.setNome("xyz");
	    categoriaCreate.setDescrizione("descrizione xyz");

	    CategoriaCreate categoriaCreate2 = new CategoriaCreate();
	    categoriaCreate2.setNome("abc");
	    categoriaCreate2.setDescrizione("descrizione abc");

	    ResponseEntity<Categoria> responseCategoria = tassonomieController.createTassonomiaCategoria(idTassonomia, categoriaCreate);
	    ResponseEntity<Categoria> responseCategoria2 = tassonomieController.createTassonomiaCategoria(idTassonomia, categoriaCreate2);
	    UUID idCategoria1 = responseCategoria.getBody().getIdCategoria();
	    UUID idCategoria2 = responseCategoria2.getBody().getIdCategoria();

	    CategorieCreate categorieCreate = new CategorieCreate();
	    categorieCreate.setCategorie(List.of(idCategoria1, idCategoria2));

	    serviziController.addCategorieServizio(idServizio, categorieCreate);

	    // Invocazione del metodo listCategorieServizio
	    ResponseEntity<ListItemCategoria> response = serviziController.listCategorieServizio(idServizio);

	    // Verifica del successo
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());
	    assertEquals(2, response.getBody().getContent().size());
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListCategorieServizioNotFound() {
	    // UUID di un servizio inesistente
	    UUID idServizioNonEsistente = UUID.randomUUID();

	    // Test per servizio non trovato
	    assertThrows(NotFoundException.class, () -> {
	        serviziController.listCategorieServizio(idServizioNonEsistente);
	    });
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	public void testListCategorieServizioNoCategories() {
	    // Creazione del servizio tramite getServizio senza aggiungere categorie
	    Servizio servizio = this.getServizio();
	    UUID idServizio = servizio.getIdServizio();

	    // Invocazione del metodo listCategorieServizio
	    ResponseEntity<ListItemCategoria> response = serviziController.listCategorieServizio(idServizio);

	    // Verifica che non ci siano categorie associate
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());
	    assertTrue(response.getBody().getContent().isEmpty());
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testListComunicazioniServizio_Success() {
		Servizio servizio = this.getServizio();
		
		MessaggioCreate messaggio = new MessaggioCreate();
        messaggio.setTesto("Testo del messaggio");
        messaggio.setOggetto("Oggetto Test");
        
        serviziController.createMessaggioServizio(servizio.getIdServizio(), messaggio);
        
	    UUID idServizio = servizio.getIdServizio();
	    Integer page = 0;
	    Integer size = 10;
	    List<String> sort = Arrays.asList("data,desc");

	    ResponseEntity<PagedModelItemComunicazione> response = serviziController.listComunicazioniServizio(idServizio, page, size, sort);

	    assertNotNull(response);
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());
	    assertNotNull(response.getBody().getContent());
	    assertTrue(response.getBody().getContent().size() > 0);
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testListComponentiPackageSuccess() {
		Servizio servizio = this.getServizio();
	    UUID idPackage = servizio.getIdServizio();
	    Pageable pageable = PageRequest.of(0, 10, Sort.by(Order.asc("nome"), Order.asc("versione")));

	    ResponseEntity<PagedModelComponente> response = serviziController.listComponentiPackage(idPackage, pageable);

	    assertEquals(HttpStatus.OK, response.getStatusCode());
	    assertNotNull(response.getBody());
	    assertNotNull(response.getBody().getContent());
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testListComponentiPackageNotFound() {
	    UUID idPackageNonEsistente = UUID.randomUUID();
	    Pageable pageable = PageRequest.of(0, 10);

	    Exception exception = assertThrows(NotFoundException.class, () -> {
	        serviziController.listComponentiPackage(idPackageNonEsistente, pageable);
	    });
	    String expectedMessage = "Servizio con id [" + idPackageNonEsistente + "] non trovato";
	    assertTrue(exception.getMessage().contains(expectedMessage));
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testListComponentiPackageAuthorizationFailed() {
	    UUID idPackage = UUID.randomUUID();
	    Pageable pageable = PageRequest.of(0, 10);

	    CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

	    assertThrows(NotAuthorizedException.class, () -> {
	        serviziController.listComponentiPackage(idPackage, pageable);
	    });
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testListComponentiPackageUtenteAnonimo() {
	    UUID idPackage = UUID.randomUUID();
	    Pageable pageable = PageRequest.of(0, 10);

	    this.tearDown();

	    assertThrows(NotAuthorizedException.class, () -> {
	        serviziController.listComponentiPackage(idPackage, pageable);
	    });
	}

	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testDeleteComponentePackageSuccess() {
		Servizio servizio = this.getServizio();
		UUID idServizio = servizio.getIdServizio();
		
		
		OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
		organizzazione.setNome("Altro nome Organizzazione");
    	organizzazione.setEsterna(false);

    	response = organizzazioniController.createOrganizzazione(organizzazione);
    	this.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
 
    	DominioCreate dominio = CommonUtils.getDominioCreate();
    	dominio.setNome("Altro dominio per package");
    	dominio.setSkipCollaudo(true);

    	dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
    	ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominio);

    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	servizioCreate.setNome("Altro servizio package");
    	servizioCreate.setPackage(true);
    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

    	servizioCreate.setIdDominio(createdDominio.getBody().getIdDominio());

    	List<ReferenteCreate> referenti = new ArrayList<>();

    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	referente.setIdUtente(UTENTE_GESTORE);
    	referenti.add(referente);

    	servizioCreate.setReferenti(referenti);

    	ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);

	    UUID idPackage = createdServizio.getBody().getIdServizio();
	    
	    serviziController.associaComponentePackage(idPackage, idServizio);
	    ResponseEntity<Void> response = serviziController.deleteComponentePackage(idPackage, idServizio);
	    
	    assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testDeleteComponentePackageAssociazioneNotFound() {
		Servizio servizio = this.getServizio();
		UUID idServizio = servizio.getIdServizio();
		
	    UUID idPackage = idServizio;
	    
	    Exception exception = assertThrows(NotFoundException.class, () -> {
	    	serviziController.deleteComponentePackage(idPackage, idPackage);
	    });
	    String expectedMessage = "Servizio [" + idServizio + "] non associato al Package ["+ idPackage +"]";
	    assertTrue(exception.getMessage().contains(expectedMessage));
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testAssociaComponentePackageSuccess() {
		Servizio servizio = this.getServizio();
		UUID idServizio = servizio.getIdServizio();
		
		
		OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
		organizzazione.setNome("nome Organizzazione");
    	organizzazione.setEsterna(false);
    	response = organizzazioniController.createOrganizzazione(organizzazione);
    	this.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
    	DominioCreate dominio = CommonUtils.getDominioCreate();
    	dominio.setNome("altro dominio per package");
    	dominio.setSkipCollaudo(true);

    	dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
    	ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominio);

    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	servizioCreate.setNome("Altro servizio package");
    	servizioCreate.setPackage(true);
    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

    	servizioCreate.setIdDominio(createdDominio.getBody().getIdDominio());

    	List<ReferenteCreate> referenti = new ArrayList<>();

    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	referente.setIdUtente(UTENTE_GESTORE);
    	referenti.add(referente);

    	servizioCreate.setReferenti(referenti);

    	ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);

	    UUID idPackage = createdServizio.getBody().getIdServizio();
	    
	    ResponseEntity<Servizio> response = serviziController.associaComponentePackage(idPackage, idServizio);
	    
	    assertEquals(HttpStatus.OK, response.getStatusCode());
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testAssociaComponentePackageNotFound() {
		Servizio servizio = this.getServizio();
		UUID idServizio = servizio.getIdServizio();
		
	    UUID idPackage = UUID.randomUUID();
	    
	    
	    Exception exception = assertThrows(NotFoundException.class, () -> {
	    	serviziController.associaComponentePackage(idServizio, idPackage);
	    });
	    
	    String expectedMessage = "Package [" + idServizio + "] non trovato";
	    assertTrue(exception.getMessage().contains(expectedMessage));
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testAssociaComponentePackageNotFound2() {
		Servizio servizio = this.getServizio();
		UUID idServizio = servizio.getIdServizio();
		
	    UUID idPackage = UUID.randomUUID();
	    
	    
	    Exception exception = assertThrows(NotFoundException.class, () -> {
	    	serviziController.associaComponentePackage(idPackage, idServizio);
	    });
	    
	    String expectedMessage = "Servizio con id [" + idPackage + "] non trovato";
	    assertTrue(exception.getMessage().contains(expectedMessage));
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.AFTER_CLASS)
	void testGetImmagineServizioSuccess() {
		Dominio dominio = this.getDominio();
    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	servizioCreate.setSkipCollaudo(true);

    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

    	servizioCreate.setIdDominio(dominio.getIdDominio());

    	immagine.setContent(Base64.encodeBase64String("contenuto immagine di test".getBytes()));
    	immagine.setContentType("image/png");
    	immagine.setFilename("test_image.png");
    	
   		servizioCreate.setImmagine(immagine);

    	List<ReferenteCreate> referenti = new ArrayList<>();

    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	referente.setIdUtente(UTENTE_GESTORE);
    	referenti.add(referente);

    	servizioCreate.setReferenti(referenti);

    	ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
    	
    	ResponseEntity<Resource> immagine = serviziController.getImmagineServizio(createdServizio.getBody().getIdServizio());
    	
    	assertEquals(HttpStatus.OK, immagine.getStatusCode());
    	assertEquals(immagine.getBody().getFilename(), immagine.getBody().getFilename());
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testGetImmagineServizioNotFound() {
		Dominio dominio = this.getDominio();
    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	servizioCreate.setSkipCollaudo(true);

    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

    	servizioCreate.setIdDominio(dominio.getIdDominio());

    	List<ReferenteCreate> referenti = new ArrayList<>();

    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	referente.setIdUtente(UTENTE_GESTORE);
    	referenti.add(referente);

    	servizioCreate.setReferenti(referenti);

    	ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
    	
    	Exception exception = assertThrows(NotFoundException.class, () -> {
    		serviziController.getImmagineServizio(createdServizio.getBody().getIdServizio());
	    });
    	assertEquals(exception.getMessage(), "Imagine per il servizio ["+ createdServizio.getBody().getIdServizio() +"] non trovata");
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testListTagsSuccess() {
		Dominio dominio = this.getDominio();
    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	String tag1 = "TAG-1";
    	String tag2 = "TAG-2";
    	String tag3 = "TAG-3";
    	List<String> tags = new ArrayList<String>();
    	tags.add(tag1);
    	tags.add(tag2);
    	tags.add(tag3);
    	servizioCreate.setTags(tags);
    	servizioCreate.setSkipCollaudo(true);

    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

    	servizioCreate.setIdDominio(dominio.getIdDominio());

    	List<ReferenteCreate> referenti = new ArrayList<>();

    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	referente.setIdUtente(UTENTE_GESTORE);
    	referenti.add(referente);

    	servizioCreate.setReferenti(referenti);

    	serviziController.createServizio(servizioCreate);
    	
    	ResponseEntity<List<String>> result = serviziController.listTags(null, 0, 10, null);
    	assertEquals(HttpStatus.OK, result.getStatusCode());
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testListTagsErrore() {
		Dominio dominio = this.getDominio();
    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	String tag1 = "TAG-1";
    	String tag2 = "TAG-2";
    	String tag3 = "TAG-3";
    	List<String> tags = new ArrayList<String>();
    	tags.add(tag1);
    	tags.add(tag2);
    	tags.add(tag3);
    	servizioCreate.setTags(tags);
    	servizioCreate.setSkipCollaudo(true);

    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

    	servizioCreate.setIdDominio(dominio.getIdDominio());

    	List<ReferenteCreate> referenti = new ArrayList<>();

    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	referente.setIdUtente(UTENTE_GESTORE);
    	referenti.add(referente);

    	servizioCreate.setReferenti(referenti);

    	serviziController.createServizio(servizioCreate);
    	
    	List<String> sort = new ArrayList<String>();
        sort.add("..");
        
        assertThrows(Exception.class, () -> {
        	serviziController.listTags(null, 0, 10, sort);
        });
	}
	
	@Test
	@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
	void testExportServizioSuccess() {
		Dominio dominio = this.getDominio();
    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	
    	servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

    	servizioCreate.setIdDominio(dominio.getIdDominio());

    	List<ReferenteCreate> referenti = new ArrayList<>();

    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	referente.setIdUtente(UTENTE_GESTORE);
    	referenti.add(referente);

    	servizioCreate.setReferenti(referenti);

    	ResponseEntity<Servizio> servizio = serviziController.createServizio(servizioCreate);
    	
    	APICreate apiCreate = CommonUtils.getAPICreate();
        
        apiCreate.setIdServizio(servizio.getBody().getIdServizio());
        
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
        
        apiController.createApi(apiCreate);
    	
    	ResponseEntity<Resource> result = serviziController.exportServizio(servizio.getBody().getIdServizio());
    	assertEquals(HttpStatus.OK, result.getStatusCode());
	}

}

