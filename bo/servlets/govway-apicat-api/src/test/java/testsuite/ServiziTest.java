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
import java.util.Random;
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
import org.govway.catalogo.servlets.model.Adesione;
import org.govway.catalogo.servlets.model.AdesioneCreate;
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
import org.govway.catalogo.servlets.model.TargetComunicazioneEnum;
import org.govway.catalogo.servlets.model.Grant;
import org.govway.catalogo.servlets.model.GrantType;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.IdentificativoServizioUpdate;
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
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.TipoServizio;
import org.govway.catalogo.servlets.model.TipologiaAllegatoEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteUpdate;
import org.govway.catalogo.servlets.model.VisibilitaAllegatoEnum;
import org.govway.catalogo.servlets.model.VisibilitaDominioEnum;
import org.govway.catalogo.servlets.model.VisibilitaServizioEnum;
import org.junit.jupiter.api.TestInstance;
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

    @PersistenceContext
    private EntityManager entityManager;
	
	private static final String UTENTE_GESTORE = "gestore";
	
	private static UUID ID_UTENTE_GESTORE;
	
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
        
        InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_GESTORE, utenteService);
        ID_UTENTE_GESTORE = UUID.fromString(info.utente.getIdUtente());
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
    	referente.setIdUtente(ID_UTENTE_GESTORE);
    	referenti.add(referente);

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
    	referente.setIdUtente(ID_UTENTE_GESTORE);
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
        	referente.setIdUtente(ID_UTENTE_GESTORE);
        	referenti.add(referente);

        	servizioCreate.setReferenti(referenti);

        	serviziController.createServizio(servizioCreate);
    	}
    }
    
    @Test
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
        assertTrue(exception.getMessage().contains("SRV.409"));  // Error code check
    }

    @Test
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

        assertTrue(exception.getMessage().contains("API.400.DUPLICATE"));  // Error code check
    }

    @Test
    void testCreateReferenteServizioAutorizzazioneFallita() {
        Servizio servizio = this.getServizio();

        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(UUID.randomUUID());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
            serviziController.createReferenteServizio(servizio.getIdServizio(), null, referenteCreate);
        });

    }
    
    @Test
    void testCreateReferenteServizioUtenteAnonimo() {
        Servizio servizio = this.getServizio();

        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(UUID.randomUUID());

        this.tearDown();

        assertThrows(NotAuthorizedException.class, () -> {
            serviziController.createReferenteServizio(servizio.getIdServizio(), null, referenteCreate);
        });

    }

    @Test
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

        assertTrue(exception.getMessage().contains("DOC.404"));  // Error code check
    }

    @Test
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
    void testDownloadAllegatoServizioNotFound() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        UUID idAllegatoNonEsistente = UUID.randomUUID();

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.downloadAllegatoServizio(idServizio, idAllegatoNonEsistente);
        });

        assertTrue(exception.getMessage().contains("DOC"));  // Error code check
    }

    @Test
    void testListComunicazioniServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        StatoUpdate stato = new StatoUpdate();
        stato.setStato("bozza");
        stato.setCommento("commento prova");
        /*
         //TODO:
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
        assertEquals(2, comunicazioni.size());

        ItemComunicazione messaggioC = comunicazioni.stream()
            .filter(c -> c.getTipo().equals(TipoComunicazione.MESSAGGIO))
            .findFirst().orElse(null);
        assertNotNull(messaggioC);
        assertEquals(messaggio.getOggetto(), messaggioC.getOggetto());
        assertEquals(messaggio.getTesto(), messaggioC.getTesto());
        */
    }

    @Test
    void testListComunicazioniServizioNotFound() {
        UUID idServizioNonEsistente = UUID.randomUUID();

        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.listComunicazioniServizio(idServizioNonEsistente, 0, 10, null);
        });

        assertTrue(exception.getMessage().startsWith("SRV") || exception.getMessage().startsWith("COM"));  // Error code check
    }

    @Test
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
    void testListReferentiServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        ResponseEntity<PagedModelReferente> response = serviziController.listReferentiServizio(idServizio, null, null, 0, 10, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        List<Referente> referenti = response.getBody().getContent();
        assertEquals(1, referenti.size());
    }

    @Test
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
        identificativo.setAdesioneDisabilitata(false);
        identificativo.setMultiAdesione(true);
        identificativo.setTipo(TipoServizio.API);
        identificativo.setPackage(false);
        servizioUpdate.setIdentificativo(identificativo);

        DatiGenericiServizioUpdate datiGenerici = new DatiGenericiServizioUpdate();
        datiGenerici.setDescrizione("Nuova descrizione");
        datiGenerici.setDescrizioneSintetica("stessa descrizione");
        servizioUpdate.setDatiGenerici(datiGenerici);

        ResponseEntity<Servizio> response = serviziController.updateServizio(idServizio, null, servizioUpdate);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Nuovo Nome", response.getBody().getNome());
        assertEquals("2", response.getBody().getVersione());
        assertEquals("Nuova descrizione", response.getBody().getDescrizione());
    }

    @Test
    void testUpdateServizioNotFound() {
        UUID idServizioNonEsistente = UUID.randomUUID();

        ServizioUpdate servizioUpdate = new ServizioUpdate();
        IdentificativoServizioUpdate identificativo = new IdentificativoServizioUpdate();
        identificativo.setNome("Nuovo Nome");
        identificativo.setVersione("2");
        identificativo.setIdDominio(UUID.randomUUID());
        identificativo.setIdSoggettoInterno(UUID.randomUUID());
        identificativo.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
        identificativo.setAdesioneDisabilitata(false);
        identificativo.setMultiAdesione(true);
        identificativo.setPackage(false);
        identificativo.setTipo(TipoServizio.API);
        servizioUpdate.setIdentificativo(identificativo);

        DatiGenericiServizioUpdate datiGenerici = new DatiGenericiServizioUpdate();
        datiGenerici.setDescrizione("Nuova descrizione");
        datiGenerici.setDescrizioneSintetica("stessa descrizione");
        servizioUpdate.setDatiGenerici(datiGenerici);

        assertThrows(NotFoundException.class, () -> {
            serviziController.updateServizio(idServizioNonEsistente, null, servizioUpdate);
        });
    }

    @Test
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

		referente.setIdUtente(ID_UTENTE_GESTORE);
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
	    identificativo.setAdesioneDisabilitata(false);
	    identificativo.setMultiAdesione(true);
	    identificativo.setTipo(TipoServizio.GENERICO);
	    servizioUpdate.setIdentificativo(identificativo);
	    
	    // Test per conflitto di identificativo
	    assertThrows(ConflictException.class, () -> {
	        serviziController.updateServizio(servizio2.getBody().getIdServizio(), null, servizioUpdate);
	    });
	}

    @Test
    void testUpdateStatoServizioSuccess() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        // Creazione di un aggiornamento di stato
        StatoUpdate statoServizioUpdate = new StatoUpdate();
        statoServizioUpdate.setStato("bozza");
        /*
         //TODO:
        // Invocazione del metodo updateStatoServizio
        ResponseEntity<Servizio> response = serviziController.updateStatoServizio(idServizio, statoServizioUpdate);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("IN_PROGRESS", response.getBody().getStato());
        */
    }

    @Test
    void testUpdateStatoServizioNotFound() {
        UUID idServizioNonEsistente = UUID.randomUUID();

        // Creazione di un aggiornamento di stato
        StatoUpdate statoServizioUpdate = new StatoUpdate();
        statoServizioUpdate.setStato("bozza");

        // Test per servizio non trovato
        assertThrows(NotFoundException.class, () -> {
            serviziController.updateStatoServizio(idServizioNonEsistente, statoServizioUpdate, null);
        });
    }

    @Test
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
            serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
        });

    }
    
    @Test
    void testUpdateStatoServizioUtenteAnonimo() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        // Creazione di un aggiornamento di stato
        StatoUpdate statoServizioUpdate = new StatoUpdate();
        statoServizioUpdate.setStato("richiesto_collaudo");

        this.tearDown();

        // Test per autorizzazione fallita
        Exception exception = assertThrows(NotAuthorizedException.class, () -> {
            serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
        });

    }

    @Test
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
        //System.out.println(servizi);
        assertTrue(servizi.stream().anyMatch(s -> s.getIdServizio().equals(servizio.getIdServizio())));
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
    void testDeleteMessaggioServizioNotFound() {
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();
        UUID idMessaggioNonEsistente = UUID.randomUUID();

        // Test per messaggio non trovato
        Exception exception = assertThrows(NotFoundException.class, () -> {
            serviziController.deleteMessaggioServizio(idServizio, idMessaggioNonEsistente);
        });

        assertTrue(exception.getMessage().contains("DOC.404"));  // Error code check
	}

	@Test
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

        assertTrue(exception.getMessage().startsWith("GRP") || exception.getMessage().contains("409"));  // Error code check
	}

	@Test
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
	public void testListGruppiServizioNotFound() {
	    // UUID del servizio inesistente
	    UUID idServizioNonEsistente = UUID.randomUUID();

	    // Test per servizio non trovato
	    assertThrows(NotFoundException.class, () -> {
	        serviziController.listGruppiServizio(idServizioNonEsistente);
	    });
	}

	@Test
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
	public void testGetGrantServizioNotFound() {
	    // UUID del servizio inesistente
	    UUID idServizioNonEsistente = UUID.randomUUID();

	    // Test per servizio non trovato
	    assertThrows(NotFoundException.class, () -> {
	        serviziController.getGrantServizio(idServizioNonEsistente);
	    });
	}
	
	@Test
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

        assertTrue(exception.getMessage().startsWith("SRV"));  // Error code check
	}

	@Test
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

        assertTrue(exception.getMessage().startsWith("CAT") || exception.getMessage().startsWith("TAX"));  // Error code check
	}

	@Test
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
        assertTrue(exception.getMessage().startsWith("CAT") || exception.getMessage().contains("409"));  // Error code check
	}

	@Test
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
	public void testListCategorieServizioNotFound() {
	    // UUID di un servizio inesistente
	    UUID idServizioNonEsistente = UUID.randomUUID();

	    // Test per servizio non trovato
	    assertThrows(NotFoundException.class, () -> {
	        serviziController.listCategorieServizio(idServizioNonEsistente);
	    });
	}

	@Test
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
	void testListComunicazioniServizio_Success() {
		Servizio servizio = this.getServizio();
		
		MessaggioCreate messaggio = new MessaggioCreate();
        messaggio.setTesto("Testo del messaggio");
        messaggio.setOggetto("Oggetto Test");
        
        serviziController.createMessaggioServizio(servizio.getIdServizio(), messaggio);
        entityManager.flush();
        entityManager.clear();
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
	void testListComponentiPackageNotFound() {
	    UUID idPackageNonEsistente = UUID.randomUUID();
	    Pageable pageable = PageRequest.of(0, 10);

	    Exception exception = assertThrows(NotFoundException.class, () -> {
	        serviziController.listComponentiPackage(idPackageNonEsistente, pageable);
	    });
        assertTrue(exception.getMessage().contains("SRV.409"));  // Error code check
	}

	@Test
	void testListComponentiPackageAuthorizationFailed() {
	    UUID idPackage = UUID.randomUUID();
	    Pageable pageable = PageRequest.of(0, 10);

	    CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

	    assertThrows(NotAuthorizedException.class, () -> {
	        serviziController.listComponentiPackage(idPackage, pageable);
	    });
	}

	@Test
	void testListComponentiPackageUtenteAnonimo() {
	    UUID idPackage = UUID.randomUUID();
	    Pageable pageable = PageRequest.of(0, 10);

	    this.tearDown();

	    assertThrows(NotAuthorizedException.class, () -> {
	        serviziController.listComponentiPackage(idPackage, pageable);
	    });
	}

	@Test
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
    	referente.setIdUtente(ID_UTENTE_GESTORE);
    	referenti.add(referente);

    	servizioCreate.setReferenti(referenti);

    	ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);

	    UUID idPackage = createdServizio.getBody().getIdServizio();
	    
	    serviziController.associaComponentePackage(idPackage, idServizio);
	    ResponseEntity<Void> response = serviziController.deleteComponentePackage(idPackage, idServizio);
	    
	    assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
	}
	
	@Test
	void testDeleteComponentePackageAssociazioneNotFound() {
		Servizio servizio = this.getServizio();
		UUID idServizio = servizio.getIdServizio();
		
	    UUID idPackage = idServizio;
	    
	    Exception exception = assertThrows(NotFoundException.class, () -> {
	    	serviziController.deleteComponentePackage(idPackage, idPackage);
	    });
	    assertTrue(exception.getMessage().contains("SRV"));  // Error code check
	}
	
	@Test
	void testAssociaComponentePackageNotFound2() {
		Servizio servizio = this.getServizio();
		UUID idServizio = servizio.getIdServizio();

	    UUID idPackage = UUID.randomUUID();


	    Exception exception = assertThrows(NotFoundException.class, () -> {
	    	serviziController.associaComponentePackage(idPackage, idServizio);
	    });

        assertTrue(exception.getMessage().contains("SRV"));  // Error code check
	}

	@Test
	void testCreateMessaggioServizioWithTargetPubblica() {
		Servizio servizio = this.getServizio();
		UUID idServizio = servizio.getIdServizio();

		MessaggioCreate messaggio = new MessaggioCreate();
		messaggio.setOggetto("Test Target Pubblica");
		messaggio.setTesto("Messaggio con target pubblica");
		messaggio.setTarget(TargetComunicazioneEnum.PUBBLICA);
		messaggio.setIncludiTecnici(true);

		ResponseEntity<ItemMessaggio> response = serviziController.createMessaggioServizio(idServizio, messaggio);

		assertNotNull(response.getBody());
		assertEquals(HttpStatus.OK, response.getStatusCode());
		assertEquals("Test Target Pubblica", response.getBody().getOggetto());
	}

	@Test
	void testCreateMessaggioServizioWithTargetSoloReferenti() {
		Servizio servizio = this.getServizio();
		UUID idServizio = servizio.getIdServizio();

		MessaggioCreate messaggio = new MessaggioCreate();
		messaggio.setOggetto("Test Target Solo Referenti");
		messaggio.setTesto("Messaggio con target solo referenti");
		messaggio.setTarget(TargetComunicazioneEnum.SOLO_REFERENTI);
		messaggio.setIncludiTecnici(true);

		ResponseEntity<ItemMessaggio> response = serviziController.createMessaggioServizio(idServizio, messaggio);

		assertNotNull(response.getBody());
		assertEquals(HttpStatus.OK, response.getStatusCode());
		assertEquals("Test Target Solo Referenti", response.getBody().getOggetto());
	}

	@Test
	void testCreateMessaggioServizioWithTargetSoloAderenti() {
		Servizio servizio = this.getServizio();
		UUID idServizio = servizio.getIdServizio();

		MessaggioCreate messaggio = new MessaggioCreate();
		messaggio.setOggetto("Test Target Solo Aderenti");
		messaggio.setTesto("Messaggio con target solo aderenti");
		messaggio.setTarget(TargetComunicazioneEnum.SOLO_ADERENTI);
		messaggio.setIncludiTecnici(false);

		ResponseEntity<ItemMessaggio> response = serviziController.createMessaggioServizio(idServizio, messaggio);

		assertNotNull(response.getBody());
		assertEquals(HttpStatus.OK, response.getStatusCode());
		assertEquals("Test Target Solo Aderenti", response.getBody().getOggetto());
	}

	@Test
	void testCreateMessaggioServizioWithTargetSoloReferentiSenzaTecnici() {
		Servizio servizio = this.getServizio();
		UUID idServizio = servizio.getIdServizio();

		MessaggioCreate messaggio = new MessaggioCreate();
		messaggio.setOggetto("Test Solo Referenti Senza Tecnici");
		messaggio.setTesto("Messaggio con target solo referenti senza tecnici");
		messaggio.setTarget(TargetComunicazioneEnum.SOLO_REFERENTI);
		messaggio.setIncludiTecnici(false);

		ResponseEntity<ItemMessaggio> response = serviziController.createMessaggioServizio(idServizio, messaggio);

		assertNotNull(response.getBody());
		assertEquals(HttpStatus.OK, response.getStatusCode());
		assertEquals("Test Solo Referenti Senza Tecnici", response.getBody().getOggetto());
	}

	@Test
	void testCreateMessaggioServizioWithTargetDefault() {
		Servizio servizio = this.getServizio();
		UUID idServizio = servizio.getIdServizio();

		// Messaggio senza target specificato (deve usare il default PUBBLICA)
		MessaggioCreate messaggio = new MessaggioCreate();
		messaggio.setOggetto("Test Target Default");
		messaggio.setTesto("Messaggio senza target specificato");

		ResponseEntity<ItemMessaggio> response = serviziController.createMessaggioServizio(idServizio, messaggio);

		assertNotNull(response.getBody());
		assertEquals(HttpStatus.OK, response.getStatusCode());
		assertEquals("Test Target Default", response.getBody().getOggetto());
	}
}

