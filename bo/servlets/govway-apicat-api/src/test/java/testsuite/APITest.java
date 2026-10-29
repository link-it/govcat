package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
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
import org.govway.catalogo.controllers.ToolsController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.services.ClasseUtenteService;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.monitoraggioutils.FiltriUtils;
import org.govway.catalogo.servlets.model.API;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.AuthTypeApiResourceProprietaCustom;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.ConfigurazioneCompatibilitaApiEnum;
import org.govway.catalogo.servlets.model.ConfigurazioneCustomProprietaList;
import org.govway.catalogo.servlets.model.ConfigurazioneProfilo;
import org.govway.catalogo.servlets.model.ConfigurazioneProfiloCustomProprietaText;
import org.govway.catalogo.servlets.model.ConfigurazioneRiferimentoProprietaCustom;
import org.govway.catalogo.servlets.model.ConfigurazioneTipoDominioEnum;
import org.govway.catalogo.servlets.model.RateLimiting;
import org.govway.catalogo.servlets.model.RateLimitingPeriodoEnum;
import org.govway.catalogo.servlets.model.Ruolo;
import org.govway.catalogo.servlets.model.TipoConfigurazioneCustomProprieta;
import org.govway.catalogo.servlets.model.TipoSoggettoGateway;
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
import org.govway.catalogo.servlets.model.DatiSpecificaApiUpdate;
import org.govway.catalogo.servlets.model.DatiGenericiApiUpdate;
import org.govway.catalogo.servlets.model.DocumentoApiInline;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.DocumentoUpdate;
import org.govway.catalogo.servlets.model.DocumentoUpdate.TipoDocumentoEnum;
import org.govway.catalogo.servlets.model.DocumentoUpdateNew;
import org.govway.catalogo.servlets.model.DocumentoUpdateId;
import org.govway.catalogo.servlets.model.APIDatiAmbienteUpdate;
import org.govway.catalogo.servlets.model.ProtocolloDettaglioEnum;
import org.govway.catalogo.assembler.ApiDettaglioAssembler;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.DownloadSpecificaAPIModeEnum;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.IdentificativoApiUpdate;
import org.govway.catalogo.servlets.model.ListaRisorseApiRichiesta;
import org.govway.catalogo.servlets.model.ServizioWsdl;
import org.govway.catalogo.servlets.model.TipoApiRisorsaEnum;
import org.govway.catalogo.servlets.model.UrlInvocazioneAPI;
import org.govway.catalogo.servlets.model.UrlInvocazioneAggiuntivaRisolta;
import org.govway.catalogo.servlets.model.IdentificativoServizioUpdate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.PagedModelAllegato;
import org.govway.catalogo.servlets.model.PagedModelItemApi;
import org.govway.catalogo.servlets.model.ProprietaCustom;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.RuoloAPIEnum;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.ServizioUpdate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.StatoUtenteEnum;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.TipoServizio;
import org.govway.catalogo.servlets.model.TipologiaAllegatoEnum;
import org.govway.catalogo.servlets.model.UrlInvocazioneAPI;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.VisibilitaAllegatoEnum;
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
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
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
import org.springframework.test.util.AopTestUtils;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
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
    ServizioService servizioService;

    @Autowired
    GruppiController gruppiController;

    @Autowired
    ApiDettaglioAssembler apiDettaglioAssembler;

    @Autowired
    ToolsController toolsController;

    @PersistenceContext
    private EntityManager entityManager;

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
    	organizzazione.setIntermediata(false);

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
    	servizioCreate.setIdSoggettoErogatore(createdSoggetto.getBody().getIdSoggetto());

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

    /**
     * Crea un ulteriore soggetto referente nella stessa organizzazione, utilizzabile come ente
     * erogatore alternativo per i servizi intermediati.
     */
    private UUID creaSoggetto(String nome) {
    	SoggettoCreate soggetto = new SoggettoCreate();
    	soggetto.setNome(nome);
    	soggetto.setIdOrganizzazione(this.idOrganizzazione);
    	soggetto.setAderente(true);
    	soggetto.setReferente(true);

    	ResponseEntity<Soggetto> created = soggettiController.createSoggetto(soggetto);
    	assertEquals(HttpStatus.OK, created.getStatusCode());
    	return created.getBody().getIdSoggetto();
    }

    private Servizio creaServizio(String nome, UUID idDominio, boolean intermediato, UUID idSoggettoErogatore) {
    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	servizioCreate.setNome(nome);
    	servizioCreate.setIdDominio(idDominio);
    	servizioCreate.setFruizione(intermediato);
    	servizioCreate.setIdSoggettoErogatore(idSoggettoErogatore);

    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	referente.setIdUtente(ID_UTENTE_GESTORE);
    	servizioCreate.setReferenti(List.of(referente));

    	ResponseEntity<Servizio> created = serviziController.createServizio(servizioCreate);
    	assertEquals(HttpStatus.OK, created.getStatusCode());
    	return created.getBody();
    }

    private ResponseEntity<API> creaApi(String nome, Integer versione, Servizio servizio) {
    	APICreate apiCreate = CommonUtils.getAPICreate();
    	apiCreate.setNome(nome);
    	apiCreate.setVersione(versione);
    	apiCreate.setIdServizio(servizio.getIdServizio());
    	return apiController.createApi(apiCreate);
    }

    private ApiUpdate getApiUpdate(String nome, Integer versione) {
    	ApiUpdate apiUpdate = new ApiUpdate();
    	IdentificativoApiUpdate identificativo = new IdentificativoApiUpdate();
    	identificativo.setNome(nome);
    	identificativo.setVersione(versione);
    	identificativo.setRuolo(RuoloAPIEnum.ADERENTE);
    	apiUpdate.setIdentificativo(identificativo);
    	return apiUpdate;
    }

    private ServizioUpdate getServizioUpdate(Servizio servizio, UUID idDominio, boolean intermediato, UUID idSoggettoErogatore) {
    	IdentificativoServizioUpdate identificativo = new IdentificativoServizioUpdate();
    	identificativo.setNome(servizio.getNome());
    	identificativo.setVersione(servizio.getVersione());
    	identificativo.setTipo(TipoServizio.API);
    	identificativo.setIdDominio(idDominio);
    	identificativo.setFruizione(intermediato);
    	identificativo.setIdSoggettoErogatore(idSoggettoErogatore);
    	identificativo.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
    	identificativo.setAdesioneDisabilitata(false);
    	identificativo.setMultiAdesione(true);
    	identificativo.setPackage(false);

    	ServizioUpdate servizioUpdate = new ServizioUpdate();
    	servizioUpdate.setIdentificativo(identificativo);
    	return servizioUpdate;
    }

    @Test
    void testGetAPICoordinatoreVedeQualsiasiApi() {
    	// RIPRODUZIONE: il coordinatore ha visibilita` su tutti i servizi al pari del gestore.
    	// Deve quindi poter aprire anche il dettaglio delle API di quel servizio, altrimenti
    	// la scheda del servizio e` accessibile ma quella delle sue API risponde 404.

    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_coordinatore", dominio.getIdDominio(), false, null);
    	UUID idApi = creaApi("API_COORD", 1, servizio).getBody().getIdApi();

    	// Utente con ruolo COORDINATORE, senza alcun legame con il servizio o il dominio.
    	String principalCoordinatore = "utente_coordinatore_api";
    	UtenteCreate coordinatore = CommonUtils.getUtenteCreate();
    	coordinatore.setPrincipal(principalCoordinatore);
    	coordinatore.setRuolo(RuoloUtenteEnum.COORDINATORE);
    	CommonUtils.setOrganizzazione(coordinatore, idOrganizzazione);
    	coordinatore.setStato(StatoUtenteEnum.ABILITATO);
    	utentiController.createUtente(coordinatore);

    	CommonUtils.getSessionUtente(principalCoordinatore, securityContext, authentication, utenteService);

    	ResponseEntity<Servizio> servizioResponse = serviziController.getServizio(servizio.getIdServizio());
    	assertEquals(HttpStatus.OK, servizioResponse.getStatusCode());

    	ResponseEntity<API> apiResponse = apiController.getAPI(idApi);
    	assertEquals(HttpStatus.OK, apiResponse.getStatusCode());
    	assertNotNull(apiResponse.getBody());
    	assertEquals(idApi, apiResponse.getBody().getIdApi());
    }

    @Test
    void testCreateApiDuplicataNonIntermediatoConflitto() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio1 = creaServizio("servizio_non_intermediato_1", dominio.getIdDominio(), false, null);
    	Servizio servizio2 = creaServizio("servizio_non_intermediato_2", dominio.getIdDominio(), false, null);

    	assertEquals(HttpStatus.OK, creaApi("API_X", 1, servizio1).getStatusCode());

    	assertThrows(ConflictException.class, () -> creaApi("API_X", 1, servizio2));
    }

    @Test
    void testCreateApiIntermediatoStessoErogatoreConflitto() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio1 = creaServizio("servizio_intermediato_1", dominio.getIdDominio(), true, this.idSoggetto);
    	Servizio servizio2 = creaServizio("servizio_intermediato_2", dominio.getIdDominio(), true, this.idSoggetto);

    	assertEquals(HttpStatus.OK, creaApi("API_X", 1, servizio1).getStatusCode());

    	assertThrows(ConflictException.class, () -> creaApi("API_X", 1, servizio2));
    }

    @Test
    void testCreateApiIntermediatoErogatoriDiversiConsentito() {
    	Dominio dominio = this.getDominio();
    	UUID idSoggettoErogatoreAlternativo = creaSoggetto("nome_soggetto_erogatore");

    	Servizio servizio1 = creaServizio("servizio_intermediato_1", dominio.getIdDominio(), true, this.idSoggetto);
    	Servizio servizio2 = creaServizio("servizio_intermediato_2", dominio.getIdDominio(), true, idSoggettoErogatoreAlternativo);

    	assertEquals(HttpStatus.OK, creaApi("API_X", 1, servizio1).getStatusCode());
    	assertEquals(HttpStatus.OK, creaApi("API_X", 1, servizio2).getStatusCode());
    }

    @Test
    void testCreateApiIntermediatoENonIntermediatoConsentito() {
    	Dominio dominio = this.getDominio();
    	Servizio servizioNonIntermediato = creaServizio("servizio_non_intermediato", dominio.getIdDominio(), false, null);
    	Servizio servizioIntermediato = creaServizio("servizio_intermediato", dominio.getIdDominio(), true, this.idSoggetto);

    	assertEquals(HttpStatus.OK, creaApi("API_X", 1, servizioNonIntermediato).getStatusCode());
    	assertEquals(HttpStatus.OK, creaApi("API_X", 1, servizioIntermediato).getStatusCode());
    }

    @Test
    void testUpdateApiIntermediatoErogatoriDiversiConsentito() {
    	Dominio dominio = this.getDominio();
    	UUID idSoggettoErogatoreAlternativo = creaSoggetto("nome_soggetto_erogatore");

    	Servizio servizio1 = creaServizio("servizio_intermediato_1", dominio.getIdDominio(), true, this.idSoggetto);
    	Servizio servizio2 = creaServizio("servizio_intermediato_2", dominio.getIdDominio(), true, idSoggettoErogatoreAlternativo);

    	assertEquals(HttpStatus.OK, creaApi("API_X", 1, servizio1).getStatusCode());
    	ResponseEntity<API> api2 = creaApi("API_Y", 1, servizio2);
    	assertEquals(HttpStatus.OK, api2.getStatusCode());

    	ResponseEntity<API> aggiornata = apiController.updateApi(api2.getBody().getIdApi(), getApiUpdate("API_X", 1), null);
    	assertEquals(HttpStatus.OK, aggiornata.getStatusCode());
    	assertEquals("API_X", aggiornata.getBody().getNome());
    }

    @Test
    void testUpdateApiIntermediatoStessoErogatoreConflitto() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio1 = creaServizio("servizio_intermediato_1", dominio.getIdDominio(), true, this.idSoggetto);
    	Servizio servizio2 = creaServizio("servizio_intermediato_2", dominio.getIdDominio(), true, this.idSoggetto);

    	assertEquals(HttpStatus.OK, creaApi("API_X", 1, servizio1).getStatusCode());
    	ResponseEntity<API> api2 = creaApi("API_Y", 1, servizio2);
    	assertEquals(HttpStatus.OK, api2.getStatusCode());

    	assertThrows(ConflictException.class, () -> apiController.updateApi(api2.getBody().getIdApi(), getApiUpdate("API_X", 1), null));
    }

    @Test
    void testUpdateServizioRimozioneIntermediazioneConflitto() {
    	Dominio dominio = this.getDominio();
    	Servizio servizioNonIntermediato = creaServizio("servizio_non_intermediato", dominio.getIdDominio(), false, null);
    	Servizio servizioIntermediato = creaServizio("servizio_intermediato", dominio.getIdDominio(), true, this.idSoggetto);

    	assertEquals(HttpStatus.OK, creaApi("API_X", 1, servizioNonIntermediato).getStatusCode());
    	assertEquals(HttpStatus.OK, creaApi("API_X", 1, servizioIntermediato).getStatusCode());

    	// Togliendo l'intermediazione l'API si sposterebbe nel namespace del servizio non
    	// intermediato, dove API_X/1 e` gia` presente
    	ServizioUpdate servizioUpdate = getServizioUpdate(servizioIntermediato, dominio.getIdDominio(), false, null);

    	assertThrows(ConflictException.class, () -> serviziController.updateServizio(servizioIntermediato.getIdServizio(), null, servizioUpdate));
    }

    @Test
    void testUpdateServizioSenzaCambioNamespaceConsentito() {
    	Dominio dominio = this.getDominio();
    	Servizio servizioNonIntermediato = creaServizio("servizio_non_intermediato", dominio.getIdDominio(), false, null);
    	Servizio servizioIntermediato = creaServizio("servizio_intermediato", dominio.getIdDominio(), true, this.idSoggetto);

    	assertEquals(HttpStatus.OK, creaApi("API_X", 1, servizioNonIntermediato).getStatusCode());
    	assertEquals(HttpStatus.OK, creaApi("API_X", 1, servizioIntermediato).getStatusCode());

    	// Namespace invariato: le api del servizio non devono entrare in conflitto con se stesse
    	ServizioUpdate servizioUpdate = getServizioUpdate(servizioIntermediato, dominio.getIdDominio(), true, this.idSoggetto);
    	servizioUpdate.getIdentificativo().setNome("servizio_intermediato_rinominato");

    	ResponseEntity<Servizio> aggiornato = serviziController.updateServizio(servizioIntermediato.getIdServizio(), null, servizioUpdate);
    	assertEquals(HttpStatus.OK, aggiornato.getStatusCode());
    	assertEquals("servizio_intermediato_rinominato", aggiornato.getBody().getNome());
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
        
        assertEquals("UT.403", e.getMessage());
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
        
        assertEquals("AUT.403", e.getMessage());
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

        assertTrue(exception.getMessage().startsWith("API."));  // Error code check
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

        assertTrue(exception.getMessage().startsWith("DOC") || exception.getMessage().startsWith("API"));  // Error code check
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
        assertTrue(exception.getMessage().startsWith("API."));  // Error code check
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
        assertTrue(exception.getMessage().startsWith("API."));  // Error code check
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

    private APIDatiAmbienteCreate getApiDatiAmbienteCreate(String nomeGateway, Integer versioneGateway, String urlPrefix) {
        APIDatiAmbienteCreate apiDatiAmbienteCreate = new APIDatiAmbienteCreate();
        apiDatiAmbienteCreate.setProtocollo(ProtocolloEnum.REST);

        DocumentoCreate documento = new DocumentoCreate();
        documento.setContentType("application/yaml");
        documento.setContent(Base64.encodeBase64String(CommonUtils.openApiSpec.getBytes()));
        documento.setFilename("openapi.yaml");
        apiDatiAmbienteCreate.setSpecifica(documento);

        APIDatiErogazione apiDatiErogazione = new APIDatiErogazione();
        apiDatiErogazione.setNomeGateway(nomeGateway);
        apiDatiErogazione.setVersioneGateway(versioneGateway);
        apiDatiErogazione.setUrlPrefix(urlPrefix);
        apiDatiErogazione.setUrl("testurl.com/test");
        apiDatiAmbienteCreate.setDatiErogazione(apiDatiErogazione);

        return apiDatiAmbienteCreate;
    }

    @Test
    void testGetUrlInvocazioneAPISuccess() {
        // Creazione di una API tramite il metodo di utilità: entrambi gli ambienti hanno la stessa
        // configurazione (nome gateway "APIGateway", versione 1, prefisso "http://") e il template
        // di default "#prefix#/#canale##nome#/v#versione#".
        this.getAPI();

        ResponseEntity<UrlInvocazioneAPI> response = apiController.getUrlInvocazioneAPI(idApi, AmbienteEnum.COLLAUDO);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("http://APIGateway/v1", response.getBody().getUrlInvocazione());
    }

    @Test
    void testGetUrlInvocazioneAPIAmbientiDistinti() {
        // Configurazioni di collaudo e produzione differenti, per verificare che l'ambiente
        // richiesto venga effettivamente rispettato.
        Servizio servizio = this.getServizio();

        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(servizio.getIdServizio());
        apiCreate.setConfigurazioneCollaudo(getApiDatiAmbienteCreate("GatewayCollaudo", 1, "http://collaudo.example.it"));
        apiCreate.setConfigurazioneProduzione(getApiDatiAmbienteCreate("GatewayProduzione", 2, "https://produzione.example.it"));

        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());
        UUID idApiAmbienti = responseApi.getBody().getIdApi();

        ResponseEntity<UrlInvocazioneAPI> collaudo = apiController.getUrlInvocazioneAPI(idApiAmbienti, AmbienteEnum.COLLAUDO);
        assertEquals(HttpStatus.OK, collaudo.getStatusCode());
        assertEquals("http://collaudo.example.it/GatewayCollaudo/v1", collaudo.getBody().getUrlInvocazione());

        ResponseEntity<UrlInvocazioneAPI> produzione = apiController.getUrlInvocazioneAPI(idApiAmbienti, AmbienteEnum.PRODUZIONE);
        assertEquals(HttpStatus.OK, produzione.getStatusCode());
        assertEquals("https://produzione.example.it/GatewayProduzione/v2", produzione.getBody().getUrlInvocazione());
    }

    @Test
    void testGetUrlInvocazioneAPINotFound() {
        // ID di una API inesistente
        UUID idApiNonEsistente = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            apiController.getUrlInvocazioneAPI(idApiNonEsistente, AmbienteEnum.COLLAUDO);
        });
        assertTrue(exception.getMessage().startsWith("API."));  // Error code check
    }

    @Test
    void testGetUrlInvocazioneAPINotAuthorized() {
        this.getAPI();

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
            apiController.getUrlInvocazioneAPI(idApi, AmbienteEnum.COLLAUDO);
        });
    }

    @Test
    void testGetUrlInvocazioneAPIUtenteAnonimo() {
        this.getAPI();

        this.tearDown();

        assertThrows(NotAuthorizedException.class, () -> {
            apiController.getUrlInvocazioneAPI(idApi, AmbienteEnum.COLLAUDO);
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

    @Test
    void testListAPISuccessWithNomeGatewayQuery() {
        // Creazione del servizio tramite il metodo di utilità
        Servizio servizio = this.getServizio();
        UUID idServizio = servizio.getIdServizio();

        // Creazione di una API per il servizio
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(idServizio);

        APIDatiAmbienteCreate apiDatiAmbienteCreateCollaudo = new APIDatiAmbienteCreate();
        apiDatiAmbienteCreateCollaudo.setProtocollo(ProtocolloEnum.REST);
        APIDatiErogazione apiDatiErogazioneCollaudo = new APIDatiErogazione();
        apiDatiErogazioneCollaudo.setNomeGateway("APIGatewayColl");
        apiDatiErogazioneCollaudo.setVersioneGateway(1);
        apiDatiErogazioneCollaudo.setUrlPrefix("http://");
        apiDatiErogazioneCollaudo.setUrl("testurl.com/test");
        apiDatiAmbienteCreateCollaudo.setDatiErogazione(apiDatiErogazioneCollaudo);
        apiCreate.setConfigurazioneCollaudo(apiDatiAmbienteCreateCollaudo);

        APIDatiAmbienteCreate apiDatiAmbienteCreateProduzione = new APIDatiAmbienteCreate();
        apiDatiAmbienteCreateProduzione.setProtocollo(ProtocolloEnum.REST);
        APIDatiErogazione apiDatiErogazioneProduzione = new APIDatiErogazione();
        apiDatiErogazioneProduzione.setNomeGateway("APIGatewayProd");
        apiDatiErogazioneProduzione.setVersioneGateway(1);
        apiDatiErogazioneProduzione.setUrlPrefix("http://");
        apiDatiErogazioneProduzione.setUrl("testurl.com/test");
        apiDatiAmbienteCreateProduzione.setDatiErogazione(apiDatiErogazioneProduzione);
        apiCreate.setConfigurazioneProduzione(apiDatiAmbienteCreateProduzione);

        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());

        // Parametri per la paginazione e filtraggio
        Integer page = 0;
        Integer size = 10;
        //List<String> sort = Arrays.asList("nome");

        // Invocazione del metodo listAPI
        ResponseEntity<PagedModelItemApi> response = apiController.listAPI(idServizio, null, null, null, null, "APIGateway", page, size, null);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getContent().size());
        assertEquals(responseApi.getBody().getNome(), response.getBody().getContent().get(0).getNome());

        // Invocazione del metodo listAPI
        ResponseEntity<PagedModelItemApi> response2 = apiController.listAPI(idServizio, null, null, null, null, "APIGatewayColl", page, size, null);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response2.getStatusCode());
        assertNotNull(response2.getBody());
        assertEquals(1, response2.getBody().getContent().size());
        assertEquals(responseApi.getBody().getNome(), response2.getBody().getContent().get(0).getNome());

        // Invocazione del metodo listAPI
        ResponseEntity<PagedModelItemApi> response3 = apiController.listAPI(idServizio, null, null, null, null, "APIGatewayProd", page, size, null);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response3.getStatusCode());
        assertNotNull(response3.getBody());
        assertEquals(1, response3.getBody().getContent().size());
        assertEquals(responseApi.getBody().getNome(), response3.getBody().getContent().get(0).getNome());
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
        assertTrue(exception.getMessage().startsWith("API."));  // Error code check
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
        assertTrue(exception.getMessage().startsWith("API."));  // Error code check
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


    // ==================== Issue 354: profili API per profilo GovWay ed erogazione/fruizione ====================

    private static final String GRUPPO_PROFILO_GOVWAY = "ProfiloGovwayTest";
    private static final String PROPRIETA_PROFILO_GOVWAY = "profilo_govway";

    @Autowired
    private Configurazione configurazione;

    @Autowired
    private FiltriUtils filtriUtils;

    private ConfigurazioneProfilo getProfiloConfigurazione(String codice) {
    	return this.configurazione.getServizio().getApi().getProfili().stream()
    			.filter(p -> p.getCodiceInterno().equals(codice))
    			.findAny()
    			.orElseThrow();
    }

    private ConfigurazioneCustomProprietaList abilitaOverrideProfiloGovway() {
    	ConfigurazioneProfiloCustomProprietaText proprieta = new ConfigurazioneProfiloCustomProprietaText();
    	proprieta.setNome(PROPRIETA_PROFILO_GOVWAY);
    	proprieta.setEtichetta("Profilo di interoperabilità");
    	proprieta.setTipo(TipoConfigurazioneCustomProprieta.TEXT);
    	proprieta.setRequired(false);

    	ConfigurazioneCustomProprietaList gruppo = new ConfigurazioneCustomProprietaList();
    	gruppo.setNomeGruppo(GRUPPO_PROFILO_GOVWAY);
    	gruppo.setLabelGruppo("Profilo GovWay");
    	gruppo.setClasseDato(ConfigurazioneClasseDato.GENERICO);
    	gruppo.setRuoliAbilitati(List.of(Ruolo.GESTORE));
    	gruppo.setProprieta(List.of(proprieta));
    	this.configurazione.getServizio().getApi().getProprietaCustom().add(gruppo);

    	ConfigurazioneRiferimentoProprietaCustom riferimento = new ConfigurazioneRiferimentoProprietaCustom();
    	riferimento.setNomeGruppo(GRUPPO_PROFILO_GOVWAY);
    	riferimento.setNomeProprieta(PROPRIETA_PROFILO_GOVWAY);
    	this.configurazione.getServizio().getApi().setProprietaProfiloGovway(riferimento);
    	return gruppo;
    }

    private void disabilitaOverrideProfiloGovway(ConfigurazioneCustomProprietaList gruppo) {
    	this.configurazione.getServizio().getApi().getProprietaCustom().remove(gruppo);
    	this.configurazione.getServizio().getApi().setProprietaProfiloGovway(null);
    }

    private List<ProprietaCustom> getOverrideProfiloGovway(String valore) {
    	AuthTypeApiResourceProprietaCustom proprieta = new AuthTypeApiResourceProprietaCustom();
    	proprieta.setNome(PROPRIETA_PROFILO_GOVWAY);
    	proprieta.setValore(valore);
    	ProprietaCustom gruppo = new ProprietaCustom();
    	gruppo.setGruppo(GRUPPO_PROFILO_GOVWAY);
    	gruppo.setProprieta(List.of(proprieta));
    	return List.of(gruppo);
    }

    private ApiUpdate getApiUpdateOverrideProfiloGovway(String valore) {
    	DatiCustomUpdate datiCustom = new DatiCustomUpdate();
    	datiCustom.setProprietaCustom(getOverrideProfiloGovway(valore));
    	ApiUpdate apiUpdate = new ApiUpdate();
    	apiUpdate.setDatiCustom(datiCustom);
    	return apiUpdate;
    }

    private UUID creaSoggetto(String nome, TipoSoggettoGateway tipoGateway) {
    	SoggettoCreate soggetto = new SoggettoCreate();
    	soggetto.setNome(nome);
    	soggetto.setIdOrganizzazione(this.idOrganizzazione);
    	soggetto.setAderente(true);
    	soggetto.setReferente(true);
    	soggetto.setTipoGateway(tipoGateway);

    	ResponseEntity<Soggetto> created = soggettiController.createSoggetto(soggetto);
    	assertEquals(HttpStatus.OK, created.getStatusCode());
    	return created.getBody().getIdSoggetto();
    }

    private APICreate getApiCreateDominio(String nome, Servizio servizio, String profilo) {
    	APICreate apiCreate = CommonUtils.getAPICreate();
    	apiCreate.setNome(nome);
    	apiCreate.setIdServizio(servizio.getIdServizio());
    	apiCreate.setRuolo(RuoloAPIEnum.DOMINIO);

    	APIDatiAmbienteCreate datiAmbiente = new APIDatiAmbienteCreate();
    	datiAmbiente.setProtocollo(ProtocolloEnum.REST);
    	apiCreate.setConfigurazioneCollaudo(datiAmbiente);

    	AuthTypeApiResource authType = new AuthTypeApiResource();
    	authType.setProfilo(profilo);
    	authType.setResources(List.of("risorsa1"));
    	apiCreate.setGruppiAuthType(List.of(authType));
    	return apiCreate;
    }

    @Test
    void testCreateApiProfiloSoloFruizioniSuErogazioneRifiutato() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);

    	assertThrows(BadRequestException.class, () -> apiController.createApi(getApiCreateDominio("API_X", servizio, "MTLS_FRUIZIONI")));
    }

    @Test
    void testCreateApiProfiloSoloFruizioniSuFruizioneConsentito() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_fruizione", dominio.getIdDominio(), true, this.idSoggetto);

    	ResponseEntity<API> response = apiController.createApi(getApiCreateDominio("API_X", servizio, "MTLS_FRUIZIONI"));
    	assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void testCreateApiProfiloSoloErogazioniSuFruizioneRifiutato() {
    	ConfigurazioneProfilo profilo = getProfiloConfigurazione("INTERNO_HTTPS");
    	try {
    		profilo.setTipoDominio(ConfigurazioneTipoDominioEnum.INTERNO);

    		Dominio dominio = this.getDominio();
    		Servizio erogazione = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);
    		Servizio fruizione = creaServizio("servizio_fruizione", dominio.getIdDominio(), true, this.idSoggetto);

    		assertEquals(HttpStatus.OK, apiController.createApi(getApiCreateDominio("API_X", erogazione, "INTERNO_HTTPS")).getStatusCode());
    		assertThrows(BadRequestException.class, () -> apiController.createApi(getApiCreateDominio("API_Y", fruizione, "INTERNO_HTTPS")));
    	} finally {
    		profilo.setTipoDominio(null);
    	}
    }

    private APICreate getApiCreateDominioSoloProduzione(String nome, Servizio servizio, String profilo) {
    	APICreate apiCreate = getApiCreateDominio(nome, servizio, profilo);
    	apiCreate.setConfigurazioneProduzione(apiCreate.getConfigurazioneCollaudo());
    	apiCreate.setConfigurazioneCollaudo(null);
    	return apiCreate;
    }

    // Issue 412: API in bozza con la sola configurazione di produzione e gruppi di autenticazione
    @Test
    void testCreateApiSoloProduzioneConGruppiAuthType() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);

    	ResponseEntity<API> response = apiController.createApi(getApiCreateDominioSoloProduzione("API_X", servizio, "INTERNO_HTTPS"));
    	assertEquals(HttpStatus.OK, response.getStatusCode());
    	assertNull(response.getBody().getConfigurazioneCollaudo());
    	assertNotNull(response.getBody().getConfigurazioneProduzione());
    }

    // Issue 412: senza collaudo la compatibilita` del profilo e` verificata sul protocollo di produzione
    @Test
    void testCreateApiSoloProduzioneProfiloIncompatibileRifiutato() {
    	ConfigurazioneProfilo profilo = getProfiloConfigurazione("INTERNO_HTTPS");
    	ConfigurazioneCompatibilitaApiEnum compatibilitaOriginale = profilo.getCompatibilita();
    	try {
    		profilo.setCompatibilita(ConfigurazioneCompatibilitaApiEnum.SOAP);

    		Dominio dominio = this.getDominio();
    		Servizio servizio = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);

    		BadRequestException e = assertThrows(BadRequestException.class,
    				() -> apiController.createApi(getApiCreateDominioSoloProduzione("API_X", servizio, "INTERNO_HTTPS")));
    		assertEquals(ErrorCode.VAL_422, e.getErrorCode());
    	} finally {
    		profilo.setCompatibilita(compatibilitaOriginale);
    	}
    }

    // Issue 412: gruppi di autenticazione senza alcuna configurazione: 400 esplicito invece di 500
    @Test
    void testCreateApiSenzaConfigurazioniConGruppiAuthTypeRifiutato() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);

    	APICreate apiCreate = getApiCreateDominio("API_X", servizio, "INTERNO_HTTPS");
    	apiCreate.setConfigurazioneCollaudo(null);

    	BadRequestException e = assertThrows(BadRequestException.class, () -> apiController.createApi(apiCreate));
    	assertEquals(ErrorCode.VAL_400_REQUIRED, e.getErrorCode());
    	assertEquals("configurazione_collaudo", e.getParameters().get("campo"));
    }

    @Test
    void testCreateApiProfiloGovwayIncompatibileConDefaultRifiutato() {
    	ConfigurazioneProfilo profilo = getProfiloConfigurazione("MODI_P1");
    	try {
    		profilo.setProfiloGovway("ModIPA");

    		// soggetto referente senza tipo gateway: vale soggetto.profilo_gateway_default (APIGateway)
    		Dominio dominio = this.getDominio();
    		Servizio servizio = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);

    		BadRequestException e = assertThrows(BadRequestException.class,
    				() -> apiController.createApi(getApiCreateDominio("API_X", servizio, "MODI_P1")));
    		assertEquals(ErrorCode.VAL_422_PROFILO_GOVWAY, e.getErrorCode());
    		assertEquals("MODI_P1", e.getParameters().get("profilo"));
    		assertEquals("ModIPA", e.getParameters().get("profiloGovwayProfilo"));
    		assertEquals("APIGateway", e.getParameters().get("profiloGovwayApi"));
    	} finally {
    		profilo.setProfiloGovway(null);
    	}
    }

    @Test
    void testCreateApiProfiloGovwayFruizioneUsaEnteErogatore() {
    	ConfigurazioneProfilo profilo = getProfiloConfigurazione("MODI_P1");
    	try {
    		// ModI e` equivalente a ModIPA
    		profilo.setProfiloGovway("ModI");

    		Dominio dominio = this.getDominio();
    		UUID idErogatoreModI = creaSoggetto("soggetto_erogatore_modi", TipoSoggettoGateway.MOD_IPA);
    		Servizio fruizione = creaServizio("servizio_fruizione", dominio.getIdDominio(), true, idErogatoreModI);
    		Servizio erogazione = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);

    		// fruizione: conta il tipo gateway dell'ente erogatore (ModIPA)
    		assertEquals(HttpStatus.OK, apiController.createApi(getApiCreateDominio("API_X", fruizione, "MODI_P1")).getStatusCode());
    		// erogazione: conta il soggetto referente del dominio (default APIGateway)
    		assertThrows(BadRequestException.class, () -> apiController.createApi(getApiCreateDominio("API_Y", erogazione, "MODI_P1")));
    	} finally {
    		profilo.setProfiloGovway(null);
    	}
    }

    @Test
    void testCreateApiErogataDaAderenteNonVerificaProfiloGovway() {
    	ConfigurazioneProfilo profilo = getProfiloConfigurazione("MODI_P1");
    	try {
    		profilo.setProfiloGovway("ModIPA");

    		Dominio dominio = this.getDominio();
    		Servizio servizio = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);
    		APICreate apiCreate = getApiCreateDominio("API_X", servizio, "MODI_P1");
    		apiCreate.setRuolo(RuoloAPIEnum.ADERENTE);

    		assertEquals(HttpStatus.OK, apiController.createApi(apiCreate).getStatusCode());
    	} finally {
    		profilo.setProfiloGovway(null);
    	}
    }

    @Test
    void testUpdateApiProfiloGovwayNonBloccaModificheNonCorrelate() {
    	ConfigurazioneProfilo profilo = getProfiloConfigurazione("MODI_P1");
    	try {
    		Dominio dominio = this.getDominio();
    		Servizio servizio = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);
    		UUID idApi = apiController.createApi(getApiCreateDominio("API_X", servizio, "MODI_P1")).getBody().getIdApi();

    		// vincolo introdotto dopo la creazione dell'API: l'API esistente diventa incompatibile
    		profilo.setProfiloGovway("ModIPA");

    		DatiGenericiApiUpdate datiGenerici = new DatiGenericiApiUpdate();
    		datiGenerici.setDescrizione("descrizione aggiornata");
    		ApiUpdate apiUpdate = new ApiUpdate();
    		apiUpdate.setDatiGenerici(datiGenerici);

    		assertEquals(HttpStatus.OK, apiController.updateApi(idApi, apiUpdate, null).getStatusCode());
    	} finally {
    		profilo.setProfiloGovway(null);
    	}
    }

    @Test
    void testOverrideProfiloGovwayGestore() {
    	ConfigurazioneProfilo profilo = getProfiloConfigurazione("MODI_P1");
    	ConfigurazioneCustomProprietaList gruppo = abilitaOverrideProfiloGovway();
    	try {
    		profilo.setProfiloGovway("ModIPA");

    		Dominio dominio = this.getDominio();
    		Servizio servizio = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);

    		// la ridefinizione del gestore prevale sul tipo gateway del soggetto (APIGateway)
    		APICreate apiCreate = getApiCreateDominio("API_X", servizio, "MODI_P1");
    		apiCreate.setProprietaCustom(getOverrideProfiloGovway("ModIPA"));
    		ResponseEntity<API> response = apiController.createApi(apiCreate);
    		assertEquals(HttpStatus.OK, response.getStatusCode());
    		UUID idApi = response.getBody().getIdApi();

    		assertTrue(response.getBody().getProprietaCustom().stream().anyMatch(pc -> pc.getGruppo().equals(GRUPPO_PROFILO_GOVWAY)));

    		this.entityManager.flush();
    		this.entityManager.clear();

    		// il monitoraggio usa la ridefinizione
    		assertEquals("ModIPA", this.filtriUtils.getProfilo(servizio.getIdServizio(), idApi));

    		// modificare solo la ridefinizione rivalida i profili gia` associati all'API
    		BadRequestException e = assertThrows(BadRequestException.class,
    				() -> apiController.updateApi(idApi, getApiUpdateOverrideProfiloGovway("APIGateway"), null));
    		assertEquals(ErrorCode.VAL_422_PROFILO_GOVWAY, e.getErrorCode());
    	} finally {
    		profilo.setProfiloGovway(null);
    		disabilitaOverrideProfiloGovway(gruppo);
    	}
    }

    @Test
    void testOverrideProfiloGovwayValoreNonValido() {
    	ConfigurazioneCustomProprietaList gruppo = abilitaOverrideProfiloGovway();
    	try {
    		Dominio dominio = this.getDominio();
    		Servizio servizio = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);

    		APICreate apiCreate = getApiCreateDominio("API_X", servizio, "MODI_P1");
    		apiCreate.setProprietaCustom(getOverrideProfiloGovway("ProfiloInesistente"));

    		BadRequestException e = assertThrows(BadRequestException.class, () -> apiController.createApi(apiCreate));
    		assertEquals(ErrorCode.VAL_400_PROFILO_GOVWAY, e.getErrorCode());
    		assertEquals("ProfiloInesistente", e.getParameters().get("valore"));
    		assertNotNull(e.getParameters().get("valoriAmmessi"));
    	} finally {
    		disabilitaOverrideProfiloGovway(gruppo);
    	}
    }

    @Test
    void testOverrideProfiloGovwayRiservatoAlGestore() {
    	ConfigurazioneCustomProprietaList gruppo = abilitaOverrideProfiloGovway();
    	try {
    		Dominio dominio = this.getDominio();
    		Servizio servizio = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);

    		APICreate apiCreate = getApiCreateDominio("API_X", servizio, "MODI_P1");
    		apiCreate.setProprietaCustom(getOverrideProfiloGovway("ModIPA"));
    		UUID idApi = apiController.createApi(apiCreate).getBody().getIdApi();

    		// utente non gestore con visibilita` sulle API
    		String principalCoordinatore = "utente_coordinatore_profilo_govway";
    		UtenteCreate coordinatore = CommonUtils.getUtenteCreate();
    		coordinatore.setPrincipal(principalCoordinatore);
    		coordinatore.setRuolo(RuoloUtenteEnum.COORDINATORE);
    		CommonUtils.setOrganizzazione(coordinatore, idOrganizzazione);
    		coordinatore.setStato(StatoUtenteEnum.ABILITATO);
    		utentiController.createUtente(coordinatore);

    		CommonUtils.getSessionUtente(principalCoordinatore, securityContext, authentication, utenteService);

    		// il gruppo e` leggibile (la console lo usa per filtrare i profili)
    		ResponseEntity<API> api = apiController.getAPI(idApi);
    		assertEquals(HttpStatus.OK, api.getStatusCode());
    		assertTrue(api.getBody().getProprietaCustom().stream().anyMatch(pc -> pc.getGruppo().equals(GRUPPO_PROFILO_GOVWAY)));

    		// e non e` modificabile
    		NotAuthorizedException e = assertThrows(NotAuthorizedException.class,
    				() -> apiController.updateApi(idApi, getApiUpdateOverrideProfiloGovway("APIGateway"), null));
    		assertEquals(ErrorCode.AUT_403_GRUPPO_RISERVATO_GESTORE, e.getErrorCode());
    		assertEquals(GRUPPO_PROFILO_GOVWAY, e.getParameters().get("gruppo"));
    	} finally {
    		disabilitaOverrideProfiloGovway(gruppo);
    	}
    }

    // ==================== Proprieta` custom e ruoli_abilitati ====================

    private static final String GRUPPO_RUOLI_ABILITATI = "GruppoRuoliAbilitatiTest";
    private static final String PROPRIETA_RUOLI_ABILITATI = "proprieta_ruoli_abilitati";

    private ConfigurazioneCustomProprietaList aggiungiGruppoRuoliAbilitati(List<Ruolo> ruoliAbilitati) {
    	ConfigurazioneProfiloCustomProprietaText proprieta = new ConfigurazioneProfiloCustomProprietaText();
    	proprieta.setNome(PROPRIETA_RUOLI_ABILITATI);
    	proprieta.setEtichetta("Proprieta` ruoli abilitati");
    	proprieta.setTipo(TipoConfigurazioneCustomProprieta.TEXT);
    	proprieta.setRequired(false);

    	ConfigurazioneCustomProprietaList gruppo = new ConfigurazioneCustomProprietaList();
    	gruppo.setNomeGruppo(GRUPPO_RUOLI_ABILITATI);
    	gruppo.setLabelGruppo("Gruppo ruoli abilitati");
    	gruppo.setClasseDato(ConfigurazioneClasseDato.GENERICO);
    	gruppo.setRuoliAbilitati(ruoliAbilitati);
    	gruppo.setProprieta(List.of(proprieta));
    	this.configurazione.getServizio().getApi().getProprietaCustom().add(gruppo);
    	return gruppo;
    }

    private List<ProprietaCustom> getProprietaCustomRuoliAbilitati(String valore) {
    	AuthTypeApiResourceProprietaCustom proprieta = new AuthTypeApiResourceProprietaCustom();
    	proprieta.setNome(PROPRIETA_RUOLI_ABILITATI);
    	proprieta.setValore(valore);
    	ProprietaCustom gruppo = new ProprietaCustom();
    	gruppo.setGruppo(GRUPPO_RUOLI_ABILITATI);
    	gruppo.setProprieta(List.of(proprieta));
    	return List.of(gruppo);
    }

    private ApiUpdate getApiUpdateRuoliAbilitati(String valore) {
    	DatiCustomUpdate datiCustom = new DatiCustomUpdate();
    	datiCustom.setProprietaCustom(getProprietaCustomRuoliAbilitati(valore));
    	ApiUpdate apiUpdate = new ApiUpdate();
    	apiUpdate.setDatiCustom(datiCustom);
    	return apiUpdate;
    }

    /**
     * Un gruppo di proprieta` custom non e` scrivibile da chi non ha uno dei ruoli abilitati del gruppo,
     * ne' in creazione ne' in modifica dell'API; la force del gestore salta il controllo.
     * L'utente in sessione e` gestore, referente e richiedente del servizio, ma non referente tecnico.
     */
    @Test
    void testProprietaCustomRuoliAbilitatiNonScrivibile() {
    	ConfigurazioneCustomProprietaList gruppo = aggiungiGruppoRuoliAbilitati(List.of(Ruolo.REFERENTE_TECNICO));
    	try {
    		Dominio dominio = this.getDominio();
    		Servizio servizio = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);

    		APICreate apiCreate = getApiCreateDominio("API_X", servizio, "MODI_P1");
    		apiCreate.setProprietaCustom(getProprietaCustomRuoliAbilitati("valore"));
    		NotAuthorizedException eCreate = assertThrows(NotAuthorizedException.class, () -> apiController.createApi(apiCreate));
    		assertEquals(ErrorCode.AUT_403_GRUPPO_RUOLI_ABILITATI, eCreate.getErrorCode());
    		assertEquals(GRUPPO_RUOLI_ABILITATI, eCreate.getParameters().get("gruppo"));

    		apiCreate.setProprietaCustom(null);
    		UUID idApi = apiController.createApi(apiCreate).getBody().getIdApi();

    		NotAuthorizedException eUpdate = assertThrows(NotAuthorizedException.class,
    				() -> apiController.updateApi(idApi, getApiUpdateRuoliAbilitati("valore"), null));
    		assertEquals(ErrorCode.AUT_403_GRUPPO_RUOLI_ABILITATI, eUpdate.getErrorCode());
    		assertEquals(GRUPPO_RUOLI_ABILITATI, eUpdate.getParameters().get("gruppo"));

    		ResponseEntity<API> forzata = apiController.updateApi(idApi, getApiUpdateRuoliAbilitati("forzato"), true);
    		assertEquals(HttpStatus.OK, forzata.getStatusCode());
    		assertTrue(forzata.getBody().getProprietaCustom().stream()
    				.anyMatch(pc -> pc.getGruppo().equals(GRUPPO_RUOLI_ABILITATI)
    						&& pc.getProprieta().stream().anyMatch(p -> p.getValore().equals("forzato"))));
    	} finally {
    		this.configurazione.getServizio().getApi().getProprietaCustom().remove(gruppo);
    	}
    }

    /**
     * Un gruppo di proprieta` custom e` scrivibile da chi ha uno dei ruoli abilitati del gruppo.
     */
    @Test
    void testProprietaCustomRuoliAbilitatiScrivibile() {
    	ConfigurazioneCustomProprietaList gruppo = aggiungiGruppoRuoliAbilitati(List.of(Ruolo.REFERENTE));
    	try {
    		Dominio dominio = this.getDominio();
    		Servizio servizio = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);

    		APICreate apiCreate = getApiCreateDominio("API_X", servizio, "MODI_P1");
    		apiCreate.setProprietaCustom(getProprietaCustomRuoliAbilitati("valore"));
    		UUID idApi = apiController.createApi(apiCreate).getBody().getIdApi();

    		ResponseEntity<API> api = apiController.updateApi(idApi, getApiUpdateRuoliAbilitati("modificato"), null);
    		assertEquals(HttpStatus.OK, api.getStatusCode());
    		assertTrue(api.getBody().getProprietaCustom().stream()
    				.anyMatch(pc -> pc.getGruppo().equals(GRUPPO_RUOLI_ABILITATI)
    						&& pc.getProprieta().stream().anyMatch(p -> p.getValore().equals("modificato"))));
    	} finally {
    		this.configurazione.getServizio().getApi().getProprietaCustom().remove(gruppo);
    	}
    }

    // ==================== Proprieta` custom al cambio dei profili di autenticazione ====================

    private static final String GRUPPO_CUSTOM = "esempioAltreProprietaUtente2";

    private List<ProprietaCustom> getProprietaCustom(String valore) {
    	AuthTypeApiResourceProprietaCustom proprieta = new AuthTypeApiResourceProprietaCustom();
    	proprieta.setNome("altraInfo2");
    	proprieta.setValore(valore);
    	ProprietaCustom gruppo = new ProprietaCustom();
    	gruppo.setGruppo(GRUPPO_CUSTOM);
    	gruppo.setProprieta(List.of(proprieta));
    	return List.of(gruppo);
    }

    private ApiUpdate getApiUpdateProfilo(String profilo, String risorsa) {
    	AuthTypeApiResource authType = new AuthTypeApiResource();
    	authType.setProfilo(profilo);
    	authType.setResources(List.of(risorsa));
    	DatiSpecificaApiUpdate datiSpecifica = new DatiSpecificaApiUpdate();
    	datiSpecifica.setGruppiAuthType(List.of(authType));
    	ApiUpdate apiUpdate = new ApiUpdate();
    	apiUpdate.setDatiSpecifica(datiSpecifica);
    	return apiUpdate;
    }

    private UUID creaApiConProprietaCustom(List<ProprietaCustom> proprietaCustom) {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_erogazione", dominio.getIdDominio(), false, null);
    	APICreate apiCreate = getApiCreateDominio("API_X", servizio, "MODI_P1");
    	apiCreate.setProprietaCustom(proprietaCustom);
    	ResponseEntity<API> response = apiController.createApi(apiCreate);
    	assertEquals(HttpStatus.OK, response.getStatusCode());

    	// la modifica avviene in una richiesta successiva: estensioni ricaricate dal DB
    	this.entityManager.flush();
    	this.entityManager.clear();
    	return response.getBody().getIdApi();
    }

    private List<String> getGruppiProprietaCustom(UUID idApi) {
    	this.entityManager.flush();
    	this.entityManager.clear();
    	List<ProprietaCustom> proprietaCustom = apiController.getAPI(idApi).getBody().getProprietaCustom();
    	return proprietaCustom == null ? List.of() : proprietaCustom.stream().map(ProprietaCustom::getGruppo).toList();
    }

    @Test
    void testUpdateApiCambioProfiloRimuoveProprietaCustom() {
    	UUID idApi = creaApiConProprietaCustom(getProprietaCustom("valore"));

    	assertEquals(HttpStatus.OK, apiController.updateApi(idApi, getApiUpdateProfilo("MODI_P2", "risorsa1"), null).getStatusCode());

    	assertTrue(getGruppiProprietaCustom(idApi).isEmpty());
    }

    @Test
    void testUpdateApiStessiProfiliMantieneProprietaCustom() {
    	UUID idApi = creaApiConProprietaCustom(getProprietaCustom("valore"));

    	// cambiano solo le risorse: i profili restano gli stessi
    	assertEquals(HttpStatus.OK, apiController.updateApi(idApi, getApiUpdateProfilo("MODI_P1", "risorsa2"), null).getStatusCode());

    	assertEquals(List.of(GRUPPO_CUSTOM), getGruppiProprietaCustom(idApi));
    }

    @Test
    void testUpdateApiCambioProfiloMantieneDatiCustomDellaRichiesta() {
    	UUID idApi = creaApiConProprietaCustom(getProprietaCustom("valore"));

    	ApiUpdate apiUpdate = getApiUpdateProfilo("MODI_P2", "risorsa1");
    	DatiCustomUpdate datiCustom = new DatiCustomUpdate();
    	datiCustom.setProprietaCustom(getProprietaCustom("nuovo valore"));
    	apiUpdate.setDatiCustom(datiCustom);
    	assertEquals(HttpStatus.OK, apiController.updateApi(idApi, apiUpdate, null).getStatusCode());

    	this.entityManager.flush();
    	this.entityManager.clear();
    	List<ProprietaCustom> proprietaCustom = apiController.getAPI(idApi).getBody().getProprietaCustom();
    	assertEquals(1, proprietaCustom.size());
    	assertEquals("nuovo valore", proprietaCustom.get(0).getProprieta().get(0).getValore());
    }

    @Test
    void testUpdateApiCambioProfiloMantieneOverrideProfiloGovway() {
    	ConfigurazioneCustomProprietaList gruppo = abilitaOverrideProfiloGovway();
    	try {
    		List<ProprietaCustom> proprietaCustom = new ArrayList<>(getProprietaCustom("valore"));
    		proprietaCustom.addAll(getOverrideProfiloGovway("ModIPA"));
    		UUID idApi = creaApiConProprietaCustom(proprietaCustom);

    		assertEquals(HttpStatus.OK, apiController.updateApi(idApi, getApiUpdateProfilo("MODI_P2", "risorsa1"), null).getStatusCode());

    		assertEquals(List.of(GRUPPO_PROFILO_GOVWAY), getGruppiProprietaCustom(idApi));
    	} finally {
    		disabilitaOverrideProfiloGovway(gruppo);
    	}
    }

    // ==================== Descrizione e note modificabili in ogni stato ====================

    private static final String STATO_PUBBLICATO_PRODUZIONE = "pubblicato_produzione";

    /**
     * API con proprieta` custom in un servizio pubblicato in produzione senza la configurazione di
     * produzione (dato obbligatorio dello stato), con sessione di un coordinatore: senza ruolo
     * abilitato allo stato successivo per lui tutti i dati sono in sola lettura.
     */
    private UUID creaApiPubblicataConDatiMancanti(String principalCoordinatore) {
    	UUID idApi = creaApiConProprietaCustom(getProprietaCustom("valore"));

    	ServizioEntity servizio = this.servizioService.find(apiController.getAPI(idApi).getBody().getServizio().getIdServizio()).get();
    	servizio.setStato(STATO_PUBBLICATO_PRODUZIONE);
    	this.servizioService.save(servizio);
    	this.entityManager.flush();
    	this.entityManager.clear();

    	UtenteCreate coordinatore = CommonUtils.getUtenteCreate();
    	coordinatore.setPrincipal(principalCoordinatore);
    	coordinatore.setRuolo(RuoloUtenteEnum.COORDINATORE);
    	CommonUtils.setOrganizzazione(coordinatore, idOrganizzazione);
    	coordinatore.setStato(StatoUtenteEnum.ABILITATO);
    	utentiController.createUtente(coordinatore);
    	CommonUtils.getSessionUtente(principalCoordinatore, securityContext, authentication, utenteService);

    	return idApi;
    }

    /** Richiesta come la invia la console con i campi bloccati: gli altri dati reinviati invariati. */
    private ApiUpdate getApiUpdateDescrizioneNote(API api, String descrizione, String note) {
    	ApiUpdate apiUpdate = getApiUpdateProfilo(api.getGruppiAuthType().get(0).getProfilo(), api.getGruppiAuthType().get(0).getResources().get(0));
    	apiUpdate.getDatiSpecifica().getGruppiAuthType().get(0).setNote(note);

    	IdentificativoApiUpdate identificativo = new IdentificativoApiUpdate();
    	identificativo.setNome(api.getNome());
    	identificativo.setVersione(api.getVersione());
    	identificativo.setRuolo(api.getRuolo());
    	apiUpdate.setIdentificativo(identificativo);

    	DatiGenericiApiUpdate datiGenerici = new DatiGenericiApiUpdate();
    	datiGenerici.setDescrizione(descrizione);
    	datiGenerici.setCodiceAsset(api.getCodiceAsset());
    	apiUpdate.setDatiGenerici(datiGenerici);

    	DatiCustomUpdate datiCustom = new DatiCustomUpdate();
    	datiCustom.setProprietaCustom(api.getProprietaCustom());
    	apiUpdate.setDatiCustom(datiCustom);
    	return apiUpdate;
    }

    @Test
    void testUpdateApiDescrizioneNoteInStatoPubblicatoConDatiMancanti() {
    	UUID idApi = creaApiPubblicataConDatiMancanti("utente_coordinatore_descrizione_note");
    	API api = apiController.getAPI(idApi).getBody();

    	ResponseEntity<API> response = apiController.updateApi(idApi, getApiUpdateDescrizioneNote(api, "nuova descrizione", "nuove note"), null);
    	assertEquals(HttpStatus.OK, response.getStatusCode());

    	this.entityManager.flush();
    	this.entityManager.clear();
    	API aggiornata = apiController.getAPI(idApi).getBody();
    	assertEquals("nuova descrizione", aggiornata.getDescrizione());
    	assertEquals("nuove note", aggiornata.getGruppiAuthType().get(0).getNote());
    	assertEquals(api.getGruppiAuthType().get(0).getResources(), aggiornata.getGruppiAuthType().get(0).getResources());
    	assertEquals(List.of(GRUPPO_CUSTOM), aggiornata.getProprietaCustom().stream().map(ProprietaCustom::getGruppo).toList());
    }

    @Test
    void testUpdateApiDescrizioneNoteConAltreModificheValidaLoStato() {
    	UUID idApi = creaApiPubblicataConDatiMancanti("utente_coordinatore_descrizione_note_risorse");
    	API api = apiController.getAPI(idApi).getBody();

    	// insieme alle note cambiano le risorse: restano i controlli dello stato
    	ApiUpdate apiUpdate = getApiUpdateDescrizioneNote(api, "nuova descrizione", "nuove note");
    	apiUpdate.getDatiSpecifica().getGruppiAuthType().get(0).setResources(List.of("risorsa2"));
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> apiController.updateApi(idApi, apiUpdate, null));
    }

    @Test
    void testUpdateApiDescrizioneConCodiceAssetValidaLoStato() {
    	UUID idApi = creaApiPubblicataConDatiMancanti("utente_coordinatore_descrizione_codice_asset");
    	API api = apiController.getAPI(idApi).getBody();

    	// insieme alla descrizione cambia il codice asset: restano i controlli dello stato
    	ApiUpdate apiUpdate = getApiUpdateDescrizioneNote(api, "nuova descrizione", null);
    	apiUpdate.getDatiGenerici().setCodiceAsset("nuovo codice asset");
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> apiController.updateApi(idApi, apiUpdate, null));
    }

    // ==================== SPECIFICHE SWAGGER 2.0 ====================

    private void setSupportoSwagger2(boolean abilitato) {
    	// Il bean e` condiviso tra i test del contesto: va sempre ripristinato a false
    	Object target = AopTestUtils.getUltimateTargetObject(this.apiDettaglioAssembler);
    	ReflectionTestUtils.setField(target, "supportaSwagger2", abilitato);
    }

    private APIDatiErogazione getDatiErogazioneTest() {
    	APIDatiErogazione apiDatiErogazione = new APIDatiErogazione();
    	apiDatiErogazione.setNomeGateway("APIGateway");
    	apiDatiErogazione.setVersioneGateway(1);
    	apiDatiErogazione.setUrlPrefix("http://");
    	apiDatiErogazione.setUrl("testurl.com/test");
    	return apiDatiErogazione;
    }

    private APICreate getAPICreateConSpecifica(String specifica) {
    	APICreate apiCreate = CommonUtils.getAPICreate();
    	apiCreate.setIdServizio(this.getServizio().getIdServizio());

    	DocumentoCreate documento = new DocumentoCreate();
    	documento.setContentType("application/yaml");
    	documento.setContent(Base64.encodeBase64String(specifica.getBytes()));
    	documento.setFilename("specifica.yaml");

    	APIDatiAmbienteCreate apiDatiAmbienteCreate = new APIDatiAmbienteCreate();
    	apiDatiAmbienteCreate.setProtocollo(ProtocolloEnum.REST);
    	apiDatiAmbienteCreate.setSpecifica(documento);
    	apiDatiAmbienteCreate.setDatiErogazione(getDatiErogazioneTest());

    	apiCreate.setConfigurazioneCollaudo(apiDatiAmbienteCreate);
    	return apiCreate;
    }

    private ApiUpdate getApiUpdateCollaudo(DocumentoUpdate specifica) {
    	APIDatiAmbienteUpdate collaudo = new APIDatiAmbienteUpdate();
    	collaudo.setProtocollo(ProtocolloEnum.REST);
    	collaudo.setSpecifica(specifica);
    	collaudo.setDatiErogazione(getDatiErogazioneTest());

    	ApiUpdate apiUpdate = new ApiUpdate();
    	apiUpdate.setConfigurazioneCollaudo(collaudo);
    	return apiUpdate;
    }

    private DocumentoUpdateNew getSpecificaNuova(String specifica) {
    	DocumentoUpdateNew documento = new DocumentoUpdateNew();
    	documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
    	documento.setContentType("application/yaml");
    	documento.setContent(Base64.encodeBase64String(specifica.getBytes()));
    	documento.setFilename("specifica.yaml");
    	return documento;
    }

    @Test
    void testCreateApiSwagger2Disabilitato() {
    	APICreate apiCreate = getAPICreateConSpecifica(CommonUtils.swagger2Spec);

    	BadRequestException exception = assertThrows(BadRequestException.class, () -> apiController.createApi(apiCreate));
    	assertEquals(ErrorCode.DOC_400_SWAGGER2, exception.getErrorCode());
    }

    @Test
    void testCreateApiSwagger2Abilitato() {
    	setSupportoSwagger2(true);
    	try {
    		ResponseEntity<API> api = apiController.createApi(getAPICreateConSpecifica(CommonUtils.swagger2Spec));

    		assertEquals(HttpStatus.OK, api.getStatusCode());
    		assertEquals(ProtocolloDettaglioEnum.SWAGGER_2, api.getBody().getConfigurazioneCollaudo().getProtocolloDettaglio());
    	} finally {
    		setSupportoSwagger2(false);
    	}
    }

    @Test
    void testCreateApiOpenapiSwagger2Disabilitato() {
    	// OpenAPI 3 non e` influenzato dalla property
    	ResponseEntity<API> api = apiController.createApi(getAPICreateConSpecifica(CommonUtils.openApiSpec));

    	assertEquals(HttpStatus.OK, api.getStatusCode());
    	assertEquals(ProtocolloDettaglioEnum.OPENAPI_3, api.getBody().getConfigurazioneCollaudo().getProtocolloDettaglio());
    }

    /**
     * Un'API salvata con specifica Swagger 2.0 (es. prima della 2.3.1 o con la property abilitata) resta
     * aggiornabile con la property disabilitata finche' il contenuto della specifica non cambia; un nuovo
     * contenuto Swagger 2.0 viene rifiutato, mentre la conversione in OpenAPI 3 e` sempre consentita.
     */
    @Test
    void testUpdateApiSwagger2PreesistenteDisabilitato() {
    	ResponseEntity<API> api;
    	setSupportoSwagger2(true);
    	try {
    		api = apiController.createApi(getAPICreateConSpecifica(CommonUtils.swagger2Spec));
    	} finally {
    		setSupportoSwagger2(false);
    	}
    	UUID idApiSwagger = api.getBody().getIdApi();

    	// Specifica invariata (il frontend la reinvia come riferimento uuid): aggiornamento consentito
    	DocumentoUpdateId specificaInvariata = new DocumentoUpdateId();
    	specificaInvariata.setTipoDocumento(TipoDocumentoEnum.UUID);
    	specificaInvariata.setUuid(api.getBody().getConfigurazioneCollaudo().getSpecifica().getUuid());

    	ResponseEntity<API> aggiornata = apiController.updateApi(idApiSwagger, getApiUpdateCollaudo(specificaInvariata), null);
    	assertEquals(HttpStatus.OK, aggiornata.getStatusCode());
    	assertEquals(ProtocolloDettaglioEnum.SWAGGER_2, aggiornata.getBody().getConfigurazioneCollaudo().getProtocolloDettaglio());

    	// Stesso contenuto ricaricato come nuovo documento: consentito
    	aggiornata = apiController.updateApi(idApiSwagger, getApiUpdateCollaudo(getSpecificaNuova(CommonUtils.swagger2Spec)), null);
    	assertEquals(ProtocolloDettaglioEnum.SWAGGER_2, aggiornata.getBody().getConfigurazioneCollaudo().getProtocolloDettaglio());

    	// Conversione in OpenAPI 3: consentita
    	aggiornata = apiController.updateApi(idApiSwagger, getApiUpdateCollaudo(getSpecificaNuova(CommonUtils.openApiSpec)), null);
    	assertEquals(ProtocolloDettaglioEnum.OPENAPI_3, aggiornata.getBody().getConfigurazioneCollaudo().getProtocolloDettaglio());

    	// Nuovo contenuto Swagger 2.0: rifiutato
    	ApiUpdate nuovaSwagger = getApiUpdateCollaudo(getSpecificaNuova(CommonUtils.swagger2Spec.replace("/hello", "/saluto")));
    	BadRequestException exception = assertThrows(BadRequestException.class, () -> apiController.updateApi(idApiSwagger, nuovaSwagger, null));
    	assertEquals(ErrorCode.DOC_400_SWAGGER2, exception.getErrorCode());
    }

    /**
     * Crea una API con le URL di invocazione indicate associate alle specifiche dei due ambienti.
     * Gli identificativi disponibili sono quelli della configurazione di test
     * (collaudo: gw_esterno, gw_dedicato; produzione: gw_esterno) piu` "default".
     */
    private UUID creaApiConUrlInvocazione(String nome, Servizio servizio, List<String> collaudo, List<String> produzione) {
    	APICreate apiCreate = CommonUtils.getAPICreate();
    	apiCreate.setNome(nome);
    	apiCreate.setVersione(1);
    	apiCreate.setIdServizio(servizio.getIdServizio());

    	APIDatiAmbienteCreate datiCollaudo = getApiDatiAmbienteCreate("GatewayCollaudo", 1, "http://collaudo.example.it");
    	datiCollaudo.setUrlInvocazione(collaudo);
    	apiCreate.setConfigurazioneCollaudo(datiCollaudo);

    	APIDatiAmbienteCreate datiProduzione = getApiDatiAmbienteCreate("GatewayProduzione", 2, "https://produzione.example.it");
    	datiProduzione.setUrlInvocazione(produzione);
    	apiCreate.setConfigurazioneProduzione(datiProduzione);

    	return apiController.createApi(apiCreate).getBody().getIdApi();
    }

    private ApiUpdate getApiUpdateUrlInvocazione(List<String> urlProduzione) {
    	APIDatiAmbienteUpdate produzione = new APIDatiAmbienteUpdate();
    	produzione.setProtocollo(ProtocolloEnum.REST);
    	produzione.setDatiErogazione(getDatiErogazioneTest());
    	produzione.setUrlInvocazione(urlProduzione);

    	ApiUpdate apiUpdate = new ApiUpdate();
    	apiUpdate.setConfigurazioneProduzione(produzione);
    	return apiUpdate;
    }

    @Test
    void testUrlInvocazioneApiConPiuUrlAssociate() {
    	// Issue 351: le URL disponibili sono censite in configurazione e associate alla singola
    	// specifica; quella predefinita resta la prima e le altre ne ereditano il path.
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_url_invocazione", dominio.getIdDominio(), false, null);
    	UUID idApi = creaApiConUrlInvocazione("API_URL_SEL", servizio, null, List.of("default", "gw_esterno"));

    	ResponseEntity<UrlInvocazioneAPI> produzione = apiController.getUrlInvocazioneAPI(idApi, AmbienteEnum.PRODUZIONE);
    	assertEquals(HttpStatus.OK, produzione.getStatusCode());

    	String predefinita = produzione.getBody().getUrlInvocazione();
    	assertTrue(predefinita.startsWith("https://produzione.example.it/"));

    	assertEquals(1, produzione.getBody().getUrlInvocazioneAggiuntive().size());
    	UrlInvocazioneAggiuntivaRisolta aggiuntiva = produzione.getBody().getUrlInvocazioneAggiuntive().get(0);
    	assertEquals("gw_esterno", aggiuntiva.getIdentificativo());
    	assertEquals("Rete internet", aggiuntiva.getEtichetta());
    	assertEquals(predefinita.replace("https://produzione.example.it", "https://api-ext.comuneesempio.it"),
    			aggiuntiva.getUrlInvocazione());
    }

    @Test
    void testUrlInvocazioneApiSenzaSelezioneUsaLaPredefinita() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_url_senza_selezione", dominio.getIdDominio(), false, null);
    	UUID idApi = creaApi("API_URL_DEFAULT", 1, servizio).getBody().getIdApi();

    	ResponseEntity<UrlInvocazioneAPI> response = apiController.getUrlInvocazioneAPI(idApi, AmbienteEnum.PRODUZIONE);

    	assertEquals(HttpStatus.OK, response.getStatusCode());
    	assertNotNull(response.getBody().getUrlInvocazione());
    	assertNull(response.getBody().getUrlInvocazioneAggiuntive());
    	assertNull(apiController.getAPI(idApi).getBody().getConfigurazioneProduzione());
    }

    @Test
    void testUrlInvocazioneSeparataPerAmbiente() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_url_due_ambienti", dominio.getIdDominio(), false, null);
    	UUID idApi = creaApiConUrlInvocazione("API_URL_AMBIENTI", servizio, List.of("gw_dedicato"), List.of("default"));

    	API api = apiController.getAPI(idApi).getBody();
    	assertEquals(List.of("gw_dedicato"), api.getConfigurazioneCollaudo().getUrlInvocazione());
    	assertEquals(List.of("default"), api.getConfigurazioneProduzione().getUrlInvocazione());

    	// Collaudo: solo il gateway dedicato, con il prefisso e il template che ha in configurazione
    	ResponseEntity<UrlInvocazioneAPI> collaudo = apiController.getUrlInvocazioneAPI(idApi, AmbienteEnum.COLLAUDO);
    	assertTrue(collaudo.getBody().getUrlInvocazione().startsWith("https://apistage-ded.comuneesempio.it/dedicato/"));
    	assertNull(collaudo.getBody().getUrlInvocazioneAggiuntive());

    	// Produzione: solo la predefinita
    	ResponseEntity<UrlInvocazioneAPI> produzione = apiController.getUrlInvocazioneAPI(idApi, AmbienteEnum.PRODUZIONE);
    	assertTrue(produzione.getBody().getUrlInvocazione().startsWith("https://produzione.example.it/"));
    	assertNull(produzione.getBody().getUrlInvocazioneAggiuntive());
    }

    @Test
    void testUpdateApiSenzaUrlInvocazioneNonAzzeraLaSelezione() {
    	// Un client che non invia il campo non deve cancellare la selezione salvata
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_url_update", dominio.getIdDominio(), false, null);
    	UUID idApi = creaApiConUrlInvocazione("API_URL_UPDATE", servizio, null, List.of("default", "gw_esterno"));

    	ResponseEntity<API> aggiornata = apiController.updateApi(idApi, getApiUpdateUrlInvocazione(null), null);

    	assertEquals(HttpStatus.OK, aggiornata.getStatusCode());
    	assertEquals(List.of("default", "gw_esterno"), aggiornata.getBody().getConfigurazioneProduzione().getUrlInvocazione());
    }

    @Test
    void testUpdateApiConListaVuotaTornaAllaPredefinita() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_url_azzera", dominio.getIdDominio(), false, null);
    	UUID idApi = creaApiConUrlInvocazione("API_URL_AZZERA", servizio, null, List.of("default", "gw_esterno"));

    	ResponseEntity<API> aggiornata = apiController.updateApi(idApi, getApiUpdateUrlInvocazione(new ArrayList<>()), null);

    	assertEquals(HttpStatus.OK, aggiornata.getStatusCode());
    	assertNull(aggiornata.getBody().getConfigurazioneProduzione().getUrlInvocazione());
    	assertNull(apiController.getUrlInvocazioneAPI(idApi, AmbienteEnum.PRODUZIONE).getBody().getUrlInvocazioneAggiuntive());
    }

    @Test
    void testUpdateApiSostituisceLaSelezione() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_url_sostituzione", dominio.getIdDominio(), false, null);
    	UUID idApi = creaApiConUrlInvocazione("API_URL_SOSTITUZIONE", servizio, null, List.of("default"));

    	ResponseEntity<API> aggiornata = apiController.updateApi(idApi, getApiUpdateUrlInvocazione(List.of("gw_esterno")), null);

    	assertEquals(List.of("gw_esterno"), aggiornata.getBody().getConfigurazioneProduzione().getUrlInvocazione());
    	// Deselezionata la predefinita, resta esposto il solo gateway scelto
    	UrlInvocazioneAPI urlInvocazione = apiController.getUrlInvocazioneAPI(idApi, AmbienteEnum.PRODUZIONE).getBody();
    	assertTrue(urlInvocazione.getUrlInvocazione().startsWith("https://api-ext.comuneesempio.it/"));
    	assertNull(urlInvocazione.getUrlInvocazioneAggiuntive());
    }

    @Test
    void testCreateApiUrlInvocazioneNonCensita() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_url_sconosciuta", dominio.getIdDominio(), false, null);

    	BadRequestException exception = assertThrows(BadRequestException.class,
    			() -> creaApiConUrlInvocazione("API_URL_SCONOSCIUTA", servizio, null, List.of("gw_inesistente")));

    	assertEquals(ErrorCode.API_400_URL_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void testCreateApiUrlInvocazioneDiUnAltroAmbiente() {
    	// gw_dedicato e` censito per il solo collaudo: in produzione non e` selezionabile
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_url_altro_ambiente", dominio.getIdDominio(), false, null);

    	BadRequestException exception = assertThrows(BadRequestException.class,
    			() -> creaApiConUrlInvocazione("API_URL_ALTRO_AMBIENTE", servizio, null, List.of("gw_dedicato")));

    	assertEquals(ErrorCode.API_400_URL_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void testCreateApiUrlInvocazioneDuplicata() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_url_duplicata", dominio.getIdDominio(), false, null);

    	BadRequestException exception = assertThrows(BadRequestException.class,
    			() -> creaApiConUrlInvocazione("API_URL_DUPLICATA", servizio, null, List.of("gw_esterno", "gw_esterno")));

    	assertEquals(ErrorCode.API_400_URL_DUPLICATE, exception.getErrorCode());
    }

    private String leggiSpecifica(ResponseEntity<Resource> response) throws IOException {
    	return new String(response.getBody().getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    }

    @Test
    void testDownloadSpecificaDichiaraTutteLeUrlAssociate() throws IOException {
    	// Issue 351: aprendo la specifica (try-out o visualizzazione) il documento OpenAPI 3
    	// dichiara in servers tutte le URL associate, cosi` il viewer ne propone la scelta.
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_url_specifica", dominio.getIdDominio(), false, null);
    	UUID idApi = creaApiConUrlInvocazione("API_URL_SPECIFICA", servizio, null, List.of("default", "gw_esterno"));

    	String predefinita = apiController.getUrlInvocazioneAPI(idApi, AmbienteEnum.PRODUZIONE).getBody().getUrlInvocazione();
    	String esterna = apiController.getUrlInvocazioneAPI(idApi, AmbienteEnum.PRODUZIONE).getBody()
    			.getUrlInvocazioneAggiuntive().get(0).getUrlInvocazione();

    	for(DownloadSpecificaAPIModeEnum mode: List.of(DownloadSpecificaAPIModeEnum.VISUALIZZAZIONE, DownloadSpecificaAPIModeEnum.TRY_OUT)) {
    		String specifica = leggiSpecifica(apiController.downloadSpecificaAPI(idApi, AmbienteEnum.PRODUZIONE, null, false, mode));

    		assertTrue(specifica.contains(predefinita), "URL predefinita assente con mode " + mode);
    		assertTrue(specifica.contains(esterna), "URL del gateway assente con mode " + mode);
    		assertTrue(specifica.contains("Rete internet"), "etichetta assente con mode " + mode);
    		// Il server dichiarato nel documento originale e` stato sostituito
    		assertFalse(specifica.contains("http://localhost:8080"));
    	}

    	// DOWNLOAD: la specifica resta quella caricata, senza riscritture
    	String originale = leggiSpecifica(apiController.downloadSpecificaAPI(idApi, AmbienteEnum.PRODUZIONE, null, false, DownloadSpecificaAPIModeEnum.DOWNLOAD));
    	assertTrue(originale.contains("http://localhost:8080"));
    	assertFalse(originale.contains(esterna));
    }

    @Test
    void testDownloadSpecificaSenzaSelezioneDichiaraLaSolaPredefinita() throws IOException {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_url_specifica_default", dominio.getIdDominio(), false, null);
    	UUID idApi = creaApiConUrlInvocazione("API_URL_SPEC_DEFAULT", servizio, null, null);

    	String predefinita = apiController.getUrlInvocazioneAPI(idApi, AmbienteEnum.PRODUZIONE).getBody().getUrlInvocazione();
    	String specifica = leggiSpecifica(apiController.downloadSpecificaAPI(idApi, AmbienteEnum.PRODUZIONE, null, false, DownloadSpecificaAPIModeEnum.VISUALIZZAZIONE));

    	assertTrue(specifica.contains(predefinita));
    	// Etichetta della URL predefinita configurata in etichetta_default
    	assertTrue(specifica.contains("Gateway predefinito"));
    }

    @Test
    void testOperazioniWsdlRiportanoLeUrlAssociate() {
    	// Issue 351: la modale della specifica SOAP mostra le URL associate alla specifica.
    	// L'endpoint e` di ToolsController ma il dato sotto test e` l'associazione dell'API.
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_url_wsdl", dominio.getIdDominio(), false, null);

    	APICreate apiCreate = CommonUtils.getAPICreate();
    	apiCreate.setNome("API_URL_WSDL");
    	apiCreate.setVersione(1);
    	apiCreate.setIdServizio(servizio.getIdServizio());

    	DocumentoCreate documento = new DocumentoCreate();
    	documento.setContentType("application/wsdl+xml");
    	documento.setContent(Base64.encodeBase64String(CommonUtils.wsdlSpec.getBytes()));
    	documento.setFilename("servizio.wsdl");

    	APIDatiAmbienteCreate produzione = new APIDatiAmbienteCreate();
    	produzione.setProtocollo(ProtocolloEnum.SOAP);
    	produzione.setSpecifica(documento);
    	produzione.setDatiErogazione(getDatiErogazioneTest());
    	produzione.setUrlInvocazione(List.of("default", "gw_esterno"));
    	apiCreate.setConfigurazioneProduzione(produzione);

    	UUID idApi = apiController.createApi(apiCreate).getBody().getIdApi();

    	DocumentoApiInline documentoRichiesta = new DocumentoApiInline();
    	documentoRichiesta.setType(TipoApiRisorsaEnum.INLINE);
    	documentoRichiesta.setContentType("application/wsdl+xml");
    	documentoRichiesta.setDocument(Base64.encodeBase64String(CommonUtils.wsdlSpec.getBytes()));

    	ListaRisorseApiRichiesta richiesta = new ListaRisorseApiRichiesta();
    	richiesta.setApiType(ProtocolloEnum.SOAP);
    	richiesta.setDocument(documentoRichiesta);
    	richiesta.setIdApi(idApi);
    	richiesta.setAmbiente(AmbienteEnum.PRODUZIONE);

    	List<ServizioWsdl> operazioni = toolsController.listaOperazioniWsdl(richiesta).getBody();

    	assertNotNull(operazioni);
    	assertFalse(operazioni.isEmpty());
    	ServizioWsdl primo = operazioni.get(0);
    	assertNotNull(primo.getUrlInvocazione());
    	assertEquals(1, primo.getUrlInvocazioneAggiuntive().size());
    	assertEquals("gw_esterno", primo.getUrlInvocazioneAggiuntive().get(0).getIdentificativo());
    	assertEquals("Rete internet", primo.getUrlInvocazioneAggiuntive().get(0).getEtichetta());
    	assertTrue(primo.getUrlInvocazioneAggiuntive().get(0).getUrlInvocazione()
    			.startsWith("https://api-ext.comuneesempio.it/"));
    }

    @Test
    void testDeleteApiConUrlInvocazione() {
    	// La cancellazione dell'API deve rimuovere anche le associazioni (vincolo di integrita`)
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_url_delete", dominio.getIdDominio(), false, null);
    	UUID idApi = creaApiConUrlInvocazione("API_URL_DELETE", servizio, List.of("gw_esterno"), List.of("default", "gw_esterno"));

    	assertEquals(HttpStatus.OK, apiController.deleteAPI(idApi).getStatusCode());
    	assertThrows(NotFoundException.class, () -> apiController.getAPI(idApi));
    }

    // ==================== Rate limiting (Issue 402) ====================

    private static RateLimiting rateLimiting(int quota, RateLimitingPeriodoEnum periodo) {
    	RateLimiting rl = new RateLimiting();
    	rl.setQuota(quota);
    	rl.setPeriodo(periodo);
    	return rl;
    }

    private APICreate getApiCreateRateLimiting(String nome, Servizio servizio, String profilo, List<RateLimiting> collaudo) {
    	APICreate apiCreate = getApiCreateDominio(nome, servizio, profilo);
    	apiCreate.getConfigurazioneCollaudo().setRateLimiting(collaudo);
    	return apiCreate;
    }

    private ApiUpdate getApiUpdateRateLimiting(List<RateLimiting> collaudo) {
    	APIDatiAmbienteUpdate datiCollaudo = new APIDatiAmbienteUpdate();
    	datiCollaudo.setProtocollo(ProtocolloEnum.REST);
    	datiCollaudo.setDatiErogazione(getDatiErogazioneTest());
    	datiCollaudo.setRateLimiting(collaudo);

    	ApiUpdate apiUpdate = new ApiUpdate();
    	apiUpdate.setConfigurazioneCollaudo(datiCollaudo);
    	return apiUpdate;
    }

    @Test
    void testRateLimitingApiCreazioneEAggiornamento() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_rate_limiting", dominio.getIdDominio(), false, null);

    	UUID idApi = apiController.createApi(getApiCreateRateLimiting("API_RL", servizio, "MODI_P1",
    			List.of(rateLimiting(300, RateLimitingPeriodoEnum.GIORNO), rateLimiting(20, RateLimitingPeriodoEnum.ORA)))).getBody().getIdApi();
    	entityManager.flush();
    	entityManager.clear();

    	// Quote ordinate per periodo, dal piu` breve al piu` lungo
    	API api = apiController.getAPI(idApi).getBody();
    	assertEquals(List.of(rateLimiting(20, RateLimitingPeriodoEnum.ORA), rateLimiting(300, RateLimitingPeriodoEnum.GIORNO)),
    			api.getConfigurazioneCollaudo().getRateLimiting());

    	// Sostituzione integrale: quota giornaliera aggiornata, oraria rimossa, al minuto aggiunta
    	apiController.updateApi(idApi, getApiUpdateRateLimiting(List.of(rateLimiting(5, RateLimitingPeriodoEnum.MINUTO), rateLimiting(500, RateLimitingPeriodoEnum.GIORNO))), null);
    	entityManager.flush();
    	entityManager.clear();
    	assertEquals(List.of(rateLimiting(5, RateLimitingPeriodoEnum.MINUTO), rateLimiting(500, RateLimitingPeriodoEnum.GIORNO)),
    			apiController.getAPI(idApi).getBody().getConfigurazioneCollaudo().getRateLimiting());

    	// Lista assente: quote invariate
    	apiController.updateApi(idApi, getApiUpdateRateLimiting(null), null);
    	entityManager.flush();
    	entityManager.clear();
    	assertEquals(2, apiController.getAPI(idApi).getBody().getConfigurazioneCollaudo().getRateLimiting().size());

    	// Lista vuota: nessun rate limiting
    	apiController.updateApi(idApi, getApiUpdateRateLimiting(List.of()), null);
    	entityManager.flush();
    	entityManager.clear();
    	assertNull(apiController.getAPI(idApi).getBody().getConfigurazioneCollaudo().getRateLimiting());
    }

    @Test
    void testRateLimitingApiValidazione() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_rate_limiting", dominio.getIdDominio(), false, null);

    	BadRequestException e = assertThrows(BadRequestException.class, () -> apiController.createApi(getApiCreateRateLimiting("API_RL", servizio, "MODI_P1",
    			List.of(rateLimiting(300, RateLimitingPeriodoEnum.GIORNO), rateLimiting(100, RateLimitingPeriodoEnum.GIORNO)))));
    	assertEquals(ErrorCode.API_400_RATE_LIMITING_DUPLICATE, e.getErrorCode());

    	e = assertThrows(BadRequestException.class, () -> apiController.createApi(getApiCreateRateLimiting("API_RL", servizio, "MODI_P1",
    			List.of(rateLimiting(0, RateLimitingPeriodoEnum.GIORNO)))));
    	assertEquals(ErrorCode.VAL_400_RATE_LIMITING_QUOTA, e.getErrorCode());
    }

    @Test
    void testRateLimitingApiErogataAderenteRifiutato() {
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_rate_limiting", dominio.getIdDominio(), false, null);

    	APICreate apiCreate = CommonUtils.getAPICreate();
    	apiCreate.setIdServizio(servizio.getIdServizio());
    	APIDatiAmbienteCreate datiCollaudo = new APIDatiAmbienteCreate();
    	datiCollaudo.setProtocollo(ProtocolloEnum.REST);
    	datiCollaudo.setRateLimiting(List.of(rateLimiting(300, RateLimitingPeriodoEnum.GIORNO)));
    	apiCreate.setConfigurazioneCollaudo(datiCollaudo);

    	BadRequestException e = assertThrows(BadRequestException.class, () -> apiController.createApi(apiCreate));
    	assertEquals(ErrorCode.API_400_RATE_LIMITING_RUOLO, e.getErrorCode());
    }

    @Test
    void testRateLimitingApiPdndSoloGiornaliero() {
    	// Un profilo e` PDND se ha pdnd_type in configurazione, come per il menu` PDND della console
    	ConfigurazioneProfilo profiloPdnd = getProfiloConfigurazione("PDND");
    	try {
    		profiloPdnd.setPdndType("eservice");

    		Dominio dominio = this.getDominio();
    		Servizio servizio = creaServizio("servizio_rate_limiting", dominio.getIdDominio(), false, null);

    		BadRequestException e = assertThrows(BadRequestException.class, () -> apiController.createApi(getApiCreateRateLimiting("API_PDND", servizio, "PDND",
    				List.of(rateLimiting(20, RateLimitingPeriodoEnum.ORA)))));
    		assertEquals(ErrorCode.API_400_RATE_LIMITING_PDND, e.getErrorCode());

    		assertEquals(HttpStatus.OK, apiController.createApi(getApiCreateRateLimiting("API_PDND", servizio, "PDND",
    				List.of(rateLimiting(300, RateLimitingPeriodoEnum.GIORNO)))).getStatusCode());

    		// La verifica e` sullo stato finale: passare a un profilo PDND con quote non giornaliere e` rifiutato
    		UUID idApi = apiController.createApi(getApiCreateRateLimiting("API_MODI", servizio, "MODI_P1",
    				List.of(rateLimiting(20, RateLimitingPeriodoEnum.ORA)))).getBody().getIdApi();
    		entityManager.flush();
    		entityManager.clear();
    		e = assertThrows(BadRequestException.class, () -> apiController.updateApi(idApi, getApiUpdateProfilo("PDND", "risorsa1"), null));
    		assertEquals(ErrorCode.API_400_RATE_LIMITING_PDND, e.getErrorCode());
    	} finally {
    		profiloPdnd.setPdndType(null);
    	}
    }

    @Test
    void testRateLimitingApiProfiloSenzaPdndTypeNonVincolato() {
    	// Senza pdnd_type il profilo non e` PDND, anche se l'auth_type e` pdnd: periodo libero
    	Dominio dominio = this.getDominio();
    	Servizio servizio = creaServizio("servizio_rate_limiting", dominio.getIdDominio(), false, null);

    	assertEquals(HttpStatus.OK, apiController.createApi(getApiCreateRateLimiting("API_PDND", servizio, "PDND",
    			List.of(rateLimiting(20, RateLimitingPeriodoEnum.ORA)))).getStatusCode());
    }
}
