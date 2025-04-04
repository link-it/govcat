/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.codec.binary.Base64;
import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.ClasseUtenteAuthorization;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.controllers.ClassiUtenteController;
import org.govway.catalogo.controllers.ClientController;
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
import org.govway.catalogo.exception.RichiestaNonValidaSemanticamenteException;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.API;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteUpdate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.Adesione;
import org.govway.catalogo.servlets.model.AdesioneClientUpdate;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.AdesioneErogazioneUpdate;
import org.govway.catalogo.servlets.model.AdesioneIdClient;
import org.govway.catalogo.servlets.model.AdesioneUpdate;
import org.govway.catalogo.servlets.model.AdesioniCambioStatoResponse;
import org.govway.catalogo.servlets.model.AllegatoMessaggio;
import org.govway.catalogo.servlets.model.AllegatoMessaggioCreate;
import org.govway.catalogo.servlets.model.AmbienteEnum;
import org.govway.catalogo.servlets.model.ApiUpdate;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.AuthTypeApiResourceProprietaCustom;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.AuthTypeHttps;
import org.govway.catalogo.servlets.model.AuthTypeHttpsCreate;
import org.govway.catalogo.servlets.model.Campo;
import org.govway.catalogo.servlets.model.CertificatoClientFornito;
import org.govway.catalogo.servlets.model.CertificatoClientFornitoCreate;
import org.govway.catalogo.servlets.model.Client;
import org.govway.catalogo.servlets.model.ClientCreate;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.DatiCustomAdesioneUpdate;
import org.govway.catalogo.servlets.model.DatiSpecificiClient;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.DocumentoUpdateNew;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.EntitaComplessaError;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.ItemAdesione;
import org.govway.catalogo.servlets.model.ItemComunicazione;
import org.govway.catalogo.servlets.model.ItemMessaggio;
import org.govway.catalogo.servlets.model.MessaggioCreate;
import org.govway.catalogo.servlets.model.MessaggioUpdate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.PagedModelItemAdesione;
import org.govway.catalogo.servlets.model.PagedModelItemClientAdesione;
import org.govway.catalogo.servlets.model.PagedModelItemComunicazione;
import org.govway.catalogo.servlets.model.PagedModelItemConfigurazioneAdesione;
import org.govway.catalogo.servlets.model.PagedModelItemErogazioneAdesione;
import org.govway.catalogo.servlets.model.PagedModelItemMessaggio;
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
import org.govway.catalogo.servlets.model.StatoClientEnum;
import org.govway.catalogo.servlets.model.StatoUpdate;
import org.govway.catalogo.servlets.model.StatoUtenteEnum;
import org.govway.catalogo.servlets.model.TipoAdesioneClientUpdateEnum;
import org.govway.catalogo.servlets.model.TipoCertificatoEnum;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteUpdate;
import org.govway.catalogo.servlets.model.VisibilitaDominioEnum;
import org.govway.catalogo.servlets.model.VisibilitaServizioEnum;
import org.govway.catalogo.servlets.model.DocumentoUpdate.TipoDocumentoEnum;
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
public class AdesioniTest {
	@Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private ClasseUtenteAuthorization authorization;

    @Mock
    private CoreAuthorization coreAuthorization;

    @Autowired
    UtenteService utenteService;

    @Autowired
    ClasseUtenteService classeUtenteService;

    @Autowired
    private OrganizzazioniController organizzazioniController;

    @Autowired
    private ClassiUtenteController controller;

    @Autowired
    private SoggettiController soggettiController;
    
    @Autowired
    private UtentiController utentiController;
    
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
    
    private static final String UTENTE_GESTORE = "gestore";
    private static final String UTENTE_RICHIEDENTE_ADESIONE = "utente_richiedente_adesione";
    
    private static final String STATO_PUBBLICATO_IN_COLLAUDO = "pubblicato_collaudo";
    
    private static UUID ID_UTENTE_GESTORE;
    private static UUID ID_UTENTE_RICHIEDENTE_ADESIONE;
    
    private static final String PROFILO = "MODI_P1";
    
    private UUID idSoggetto;
    private UUID idServizio;
    private UUID idOrganizzazione;

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
        
        InfoProfilo info = CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        ID_UTENTE_GESTORE = info.utente.getIdUtente();
        
        info = CommonUtils.getInfoProfilo(UTENTE_RICHIEDENTE_ADESIONE, utenteService);
        ID_UTENTE_RICHIEDENTE_ADESIONE = info.utente.getIdUtente();
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_ADESIONE, utenteService);
        ID_UTENTE_REFERENTE_ADESIONE = info.utente.getIdUtente();
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO_ADESIONE, utenteService);
        ID_UTENTE_REFERENTE_TECNICO_ADESIONE = info.utente.getIdUtente();
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_SERVIZIO, utenteService);
        ID_UTENTE_REFERENTE_SERVIZIO = info.utente.getIdUtente();
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO_SERVIZIO, utenteService);
        ID_UTENTE_REFERENTE_TECNICO_SERVIZIO = info.utente.getIdUtente();
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_DOMINIO, utenteService);
        ID_UTENTE_REFERENTE_DOMINIO = info.utente.getIdUtente();
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO_DOMINIO, utenteService);
        ID_UTENTE_REFERENTE_TECNICO_DOMINIO = info.utente.getIdUtente();

    }

    @AfterEach
    private void tearDown() {
        SecurityContextHolder.clearContext();
    }
    
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
        //soggettoCreate.setSkipCollaudo(true);
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
        authType.setProfilo(PROFILO);
        
        List<String> risorse = new ArrayList<String>();
        risorse.add("risorsa1");
        authType.setResources(risorse);
        
        List<AuthTypeApiResourceProprietaCustom> proprietaCustom = new ArrayList<AuthTypeApiResourceProprietaCustom>();
        
        AuthTypeApiResourceProprietaCustom autResource = new AuthTypeApiResourceProprietaCustom();
        autResource.setNome("custom resorce");
        autResource.setValore("56");
        
        proprietaCustom.add(autResource);
        
        gruppiAuthType.add(authType);
        
        //apiErogazione.setGruppiAuthType(gruppiAuthType);
        
        //apiCreate.setDatiErogazione(apiErogazione);
        
        apiCreate.setGruppiAuthType(gruppiAuthType);
        
        DocumentoCreate doc = new DocumentoCreate();
        doc.setFilename("SpecificaAPI.json");
        doc.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        
        
        //apiCreate.setSpecifica(doc);
        
        ResponseEntity<API> response = apiController.createApi(apiCreate);
        
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
    void testCreateAdesioneSuccess() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	// Creo l'Adesione
    	Adesione adesione = this.getAdesione();
    	
    	assertNotNull(adesione);
    }
    
    @Test
    void testCreateAdesioneNonConsentita() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	Exception exception = assertThrows(BadRequestException.class, () -> {
    		this.getAdesione();
        });
        String expectedMessage = "Servizio ["+ servizio.getNome() +"/"+ servizio.getVersione() +"] non in stato in cui è consentita l'adesione";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }
    
    @Test
    void testCreateAdesioneNotAuthorized() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
    	
    	Exception exception = assertThrows(NotAuthorizedException.class, () -> {
    		this.getAdesione();
        });
    	String expectedMessage = "Utente non abilitato";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }
    
    @Test
    void testCreateAdesioneUtenteAnonimo() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	this.tearDown();
    	
    	Exception exception = assertThrows(NullPointerException.class, () -> {
    		this.getAdesione();
        });
    }
    
    @Test
    void testCreateAdesioneNonMultiadesione() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	// Creo l'Adesione
    	Adesione adesione = this.getAdesione();
    	
    	assertNotNull(adesione);
    	
    	Exception exception = assertThrows(ConflictException.class, () -> {
    		this.getAdesione();
        });
    	String expectedMessage = "Adesione del soggetto ["+adesione.getSoggetto().getNome()+"] al servizio ["+ adesione.getServizio().getNome() +"/"+ adesione.getServizio().getVersione() +"] esiste gia e servizio non multiadesione";
        assertTrue(exception.getMessage().contains(expectedMessage));
    }
    
    @Test
    void testCreateAllegatoMessaggioAdesioneSuccess() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	// Creo l'Adesione
    	Adesione adesione = this.getAdesione();
    	
    	assertNotNull(adesione);
    	
    	MessaggioCreate messaggio = new MessaggioCreate();
    	
    	messaggio.setOggetto("Oggetti di Prova");
    	messaggio.setTesto("Ecco un esempio di testo");
    	
    	ResponseEntity<ItemMessaggio> itemMessaggio = adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggio);
    	
    	AllegatoMessaggioCreate allegatoMessaggio = new AllegatoMessaggioCreate();
    	allegatoMessaggio.setContent(Base64.encodeBase64String("contenuto di test".getBytes()));
    	allegatoMessaggio.setDescrizione("questa è la descrizione di test");
    	allegatoMessaggio.setFilename("nomeallegato.pdf");
    	allegatoMessaggio.setContentType("application/pdf");
    	
    	ResponseEntity<AllegatoMessaggio> response = adesioniController.createAllegatoMessaggioAdesione(adesione.getIdAdesione(), itemMessaggio.getBody().getIdMessaggio(), allegatoMessaggio);
    	assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
    
    @Test
    void testCreateAllegatoMessaggioErroreMessaggioNonTrovato() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	// Creo l'Adesione
    	Adesione adesione = this.getAdesione();
    	
    	assertNotNull(adesione);
    	
    	AllegatoMessaggioCreate allegatoMessaggio = new AllegatoMessaggioCreate();
    	allegatoMessaggio.setContent(Base64.encodeBase64String("contenuto di test".getBytes()));
    	allegatoMessaggio.setDescrizione("questa è la descrizione di test");
    	allegatoMessaggio.setFilename("nomeallegato.pdf");
    	allegatoMessaggio.setContentType("application/pdf");
    	UUID random = UUID.randomUUID();
    	assertThrows(NotFoundException.class, () -> {
    		adesioniController.createAllegatoMessaggioAdesione(adesione.getIdAdesione(), random, allegatoMessaggio);
        });
    }
    
    @Test
    void testCreateAllegatoMessaggioAdesioneNotAuthorized() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	// Creo l'Adesione
    	Adesione adesione = this.getAdesione();
    	
    	assertNotNull(adesione);
    	
    	MessaggioCreate messaggio = new MessaggioCreate();
    	
    	messaggio.setOggetto("Oggetti di Prova");
    	messaggio.setTesto("Ecco un esempio di testo");
    	
    	ResponseEntity<ItemMessaggio> itemMessaggio = adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggio);
    	
    	AllegatoMessaggioCreate allegatoMessaggio = new AllegatoMessaggioCreate();
    	allegatoMessaggio.setContent(Base64.encodeBase64String("contenuto di test".getBytes()));
    	allegatoMessaggio.setDescrizione("questa è la descrizione di test");
    	allegatoMessaggio.setFilename("nomeallegato.pdf");
    	allegatoMessaggio.setContentType("application/pdf");
    	
    	CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, () -> {
    		adesioniController.createAllegatoMessaggioAdesione(adesione.getIdAdesione(), itemMessaggio.getBody().getIdMessaggio(), allegatoMessaggio);
        });
    }
    
    @Test
    void testCreateAllegatoMessaggioAdesioneUtenteAnonimo() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	// Creo l'Adesione
    	Adesione adesione = this.getAdesione();
    	
    	assertNotNull(adesione);
    	
    	MessaggioCreate messaggio = new MessaggioCreate();
    	
    	messaggio.setOggetto("Oggetti di Prova");
    	messaggio.setTesto("Ecco un esempio di testo");
    	
    	ResponseEntity<ItemMessaggio> itemMessaggio = adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggio);
    	
    	AllegatoMessaggioCreate allegatoMessaggio = new AllegatoMessaggioCreate();
    	allegatoMessaggio.setContent(Base64.encodeBase64String("contenuto di test".getBytes()));
    	allegatoMessaggio.setDescrizione("questa è la descrizione di test");
    	allegatoMessaggio.setFilename("nomeallegato.pdf");
    	allegatoMessaggio.setContentType("application/pdf");
    	
    	this.tearDown();
    	
    	assertThrows(NotAuthorizedException.class, () -> {
    		adesioniController.createAllegatoMessaggioAdesione(adesione.getIdAdesione(), itemMessaggio.getBody().getIdMessaggio(), allegatoMessaggio);
        });
    }
    
    @Test
    void testCreateMessaggioAdesioneSuccess() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	// Creo l'Adesione
    	Adesione adesione = this.getAdesione();
    	
    	assertNotNull(adesione);
    	
    	MessaggioCreate messaggio = new MessaggioCreate();
    	
    	messaggio.setOggetto("Oggetti di Prova");
    	messaggio.setTesto("Ecco un esempio di testo");
    	
    	ResponseEntity<ItemMessaggio> response = adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggio);
    	
    	assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
    
    @Test
    void testCreateMessaggioAdesioneNotAuthorized() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	// Creo l'Adesione
    	Adesione adesione = this.getAdesione();
    	
    	assertNotNull(adesione);
    	
    	MessaggioCreate messaggio = new MessaggioCreate();
    	
    	messaggio.setOggetto("Oggetti di Prova");
    	messaggio.setTesto("Ecco un esempio di testo");
    	
    	CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, () -> {
    		adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggio);
        });
    }
    
    @Test
    void testCreateMessaggioAdesioneUtenteAnonimo() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	// Creo l'Adesione
    	Adesione adesione = this.getAdesione();
    	
    	assertNotNull(adesione);
    	
    	MessaggioCreate messaggio = new MessaggioCreate();
    	
    	messaggio.setOggetto("Oggetti di Prova");
    	messaggio.setTesto("Ecco un esempio di testo");
    	
    	this.tearDown();
    	
    	assertThrows(NotAuthorizedException.class, () -> {
    		adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggio);
        });
    }
    
    @Test
    void testCreateReferenteAdesioneSuccess() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	// Creo l'Adesione
    	Adesione adesione = this.getAdesione();
    	
    	assertNotNull(adesione);
    	
    	UtenteUpdate upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_RICHIEDENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_adesione");

        utentiController.updateUtente(ID_UTENTE_RICHIEDENTE_ADESIONE, upUtente);
    	
    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setIdUtente(ID_UTENTE_RICHIEDENTE_ADESIONE);
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	
    	ResponseEntity<Referente> response = adesioniController.createReferenteAdesione(adesione.getIdAdesione(), referente, null);
    	
    	assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }
    
    @Test
    void testCreateReferenteAdesioneNotAuthorized() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	// Creo l'Adesione
    	Adesione adesione = this.getAdesione();
    	
    	assertNotNull(adesione);
    	
    	UtenteUpdate upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_RICHIEDENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_adesione");

        utentiController.updateUtente(ID_UTENTE_RICHIEDENTE_ADESIONE, upUtente);
    	
    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setIdUtente(ID_UTENTE_RICHIEDENTE_ADESIONE);
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	
    	CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, () -> {
    		adesioniController.createReferenteAdesione(adesione.getIdAdesione(), referente, null);
        });
    }
    
    @Test
    void testCreateReferenteAdesioneUtenteAnonimo() { 
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();

    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);

    	// Creo l'Adesione
    	Adesione adesione = this.getAdesione();
    	
    	assertNotNull(adesione);
    	
    	UtenteUpdate upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_RICHIEDENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_adesione");

        utentiController.updateUtente(ID_UTENTE_RICHIEDENTE_ADESIONE, upUtente);
    	
    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setIdUtente(ID_UTENTE_RICHIEDENTE_ADESIONE);
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	
    	this.tearDown();    	
    	
    	assertThrows(NotAuthorizedException.class, () -> {
    		adesioniController.createReferenteAdesione(adesione.getIdAdesione(), referente, null);
        });
    }
    
    @Test
    void testDeleteAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        // Creo API
    	this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Act
        ResponseEntity<Void> response = adesioniController.deleteAdesione(adesione.getIdAdesione());

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void testDeleteAdesioneNotAuthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        // Creo API
    	this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, () -> {
        	adesioniController.deleteAdesione(adesione.getIdAdesione());
        });
    }
    
    @Test
    void testDeleteAdesioneUtenteAnonimo() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        // Creo API
    	this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        this.tearDown();        
        
        assertThrows(NotAuthorizedException.class, () -> {
        	adesioniController.deleteAdesione(adesione.getIdAdesione());
        });
    }
    
    @Test
    void testDeleteReferenteAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        UtenteUpdate upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_RICHIEDENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_adesione");

        utentiController.updateUtente(ID_UTENTE_RICHIEDENTE_ADESIONE, upUtente);
        
        ReferenteCreate referente = new ReferenteCreate();
        referente.setIdUtente(ID_UTENTE_RICHIEDENTE_ADESIONE);
        referente.setTipo(TipoReferenteEnum.REFERENTE);
        adesioniController.createReferenteAdesione(adesione.getIdAdesione(), referente, null);

        // Act
        ResponseEntity<Void> response = adesioniController.deleteReferenteAdesione(
        		adesione.getIdAdesione(), ID_UTENTE_RICHIEDENTE_ADESIONE, TipoReferenteEnum.REFERENTE, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void testDeleteReferenteAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        UtenteUpdate upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_RICHIEDENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_adesione");

        utentiController.updateUtente(ID_UTENTE_RICHIEDENTE_ADESIONE, upUtente);
        
        ReferenteCreate referente = new ReferenteCreate();
        referente.setIdUtente(ID_UTENTE_RICHIEDENTE_ADESIONE);
        referente.setTipo(TipoReferenteEnum.REFERENTE);
        adesioniController.createReferenteAdesione(adesione.getIdAdesione(), referente, null);

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.deleteReferenteAdesione(
            adesione.getIdAdesione(), ID_UTENTE_RICHIEDENTE_ADESIONE, TipoReferenteEnum.REFERENTE, null));
    }
    
    @Test
    void testDeleteReferenteAdesioneNotFound() {
        // Setup
        UUID randomId = UUID.randomUUID();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.deleteReferenteAdesione(
            randomId, UUID.randomUUID(), TipoReferenteEnum.REFERENTE, null));
    }

    @Test
    void testDownloadAllegatoMessaggioAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        MessaggioCreate messaggio = new MessaggioCreate();
        messaggio.setOggetto("Oggetto Test");
        messaggio.setTesto("Testo del messaggio");
        ResponseEntity<ItemMessaggio> itemMessaggio = adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggio);

        AllegatoMessaggioCreate allegato = new AllegatoMessaggioCreate();
        allegato.setFilename("test.pdf");
        allegato.setContentType("application/pdf");
        allegato.setContent(Base64.encodeBase64String("contenuto di test".getBytes()));
        ResponseEntity<AllegatoMessaggio> allegatoCreato = adesioniController.createAllegatoMessaggioAdesione(
            adesione.getIdAdesione(), itemMessaggio.getBody().getIdMessaggio(), allegato);

        // Act
        ResponseEntity<Resource> response = adesioniController.downloadAllegatoMessaggioAdesione(
            adesione.getIdAdesione(), itemMessaggio.getBody().getIdMessaggio(), UUID.fromString(allegatoCreato.getBody().getUuid()));

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getHeaders().getContentDisposition().getFilename().contains("test.pdf"));
    }

    @Test
    void testDownloadAllegatoMessaggioAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        MessaggioCreate messaggio = new MessaggioCreate();
        messaggio.setOggetto("Oggetto Test");
        messaggio.setTesto("Testo del messaggio");
        ResponseEntity<ItemMessaggio> itemMessaggio = adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggio);

        AllegatoMessaggioCreate allegato = new AllegatoMessaggioCreate();
        allegato.setFilename("test.pdf");
        allegato.setContentType("application/pdf");
        allegato.setContent(Base64.encodeBase64String("contenuto di test".getBytes()));
        ResponseEntity<AllegatoMessaggio> allegatoCreato = adesioniController.createAllegatoMessaggioAdesione(
            adesione.getIdAdesione(), itemMessaggio.getBody().getIdMessaggio(), allegato);

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.downloadAllegatoMessaggioAdesione(
            adesione.getIdAdesione(), itemMessaggio.getBody().getIdMessaggio(), UUID.fromString(allegatoCreato.getBody().getUuid())));
    }

    @Test
    void testDownloadAllegatoMessaggioAdesioneNotFound() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        UUID randomId = UUID.randomUUID();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.downloadAllegatoMessaggioAdesione(
            adesione.getIdAdesione(), randomId, randomId));
    }

    @Test
    void testExportAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesioneFull();
        this.cambioStatoAdesioneFinoA(adesione.getIdAdesione(), STATO_PUBBLICATO_IN_COLLAUDO);

        // Act
        ResponseEntity<Resource> response = adesioniController.exportAdesione(adesione.getIdAdesione());

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getHeaders().getContentDisposition().getFilename().contains("adesione-" + adesione.getIdAdesione()));
    }
    
    @Test
    void testExportAdesioneErrore() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        assertThrows(BadRequestException.class, ()-> adesioniController.exportAdesione(adesione.getIdAdesione()));
    }

    @Test
    void testExportAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.exportAdesione(adesione.getIdAdesione()));
    }

    @Test
    void testGetAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Act
        ResponseEntity<Adesione> response = adesioniController.getAdesione(adesione.getIdAdesione());

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(adesione.getIdAdesione(), response.getBody().getIdAdesione());
    }

    @Test
    void testGetAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.getAdesione(adesione.getIdAdesione()));
    }

    @Test
    void testGetAdesioneNotFound() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());

        UUID randomId = UUID.randomUUID();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.getAdesione(randomId));
    }

    @Test
    void testListErogazioniCollaudoAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Act
        ResponseEntity<PagedModelItemErogazioneAdesione> response = adesioniController.listErogazioniCollaudoAdesione(adesione.getIdAdesione());

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testListErogazioniCollaudoAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.listErogazioniCollaudoAdesione(adesione.getIdAdesione()));
    }

    @Test
    void testListErogazioniCollaudoAdesioneNotFound() {
        // Setup
        UUID randomId = UUID.randomUUID();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.listErogazioniCollaudoAdesione(randomId));
    }

    @Test
    void testListErogazioniProduzioneAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_produzione", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Act
        ResponseEntity<PagedModelItemErogazioneAdesione> response = adesioniController.listErogazioniProduzioneAdesione(adesione.getIdAdesione());

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testListErogazioniProduzioneAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_produzione", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.listErogazioniProduzioneAdesione(adesione.getIdAdesione()));
    }

    @Test
    void testListErogazioniProduzioneAdesioneNotFound() {
        // Setup
        UUID randomId = UUID.randomUUID();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.listErogazioniProduzioneAdesione(randomId));
    }

    @Test
    void testListComunicazioniAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Act
        ResponseEntity<PagedModelItemComunicazione> response = adesioniController.listComunicazioniAdesione(adesione.getIdAdesione(), 0, 10, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testListComunicazioniAdesioneSortedNameDesc() {
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        List<String> sort = new ArrayList<>();
        sort.add("testo,desc");
        
        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test");
        messaggioCreate.setTesto("a Testo del Messaggio");
        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
        
        messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test 2");
        messaggioCreate.setTesto("z Il testo del Messaggio");
        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
        
        // Invocazione del metodo con sort
        ResponseEntity<PagedModelItemComunicazione> response = adesioniController.listComunicazioniAdesione(adesione.getIdAdesione(), 0, 10, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());
        //System.out.println(response);
        // Verifica che il messaggio sia presente nell'elenco
        List<ItemComunicazione> comunicazioni = response.getBody().getContent();
        assertTrue(comunicazioni.stream().anyMatch(s -> s.getTesto().equals("z Il testo del Messaggio")));
    }
    
    @Test
    void testListComunicazioniAdesioneSortedNameAsc() {
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();
        
        List<String> sort = new ArrayList<>();
        sort.add("testo,asc");

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test");
        messaggioCreate.setTesto("a Testo del Messaggio");
        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
        
        messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test 2");
        messaggioCreate.setTesto("z Il testo del Messaggio");
        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
        
        // Invocazione del metodo con sort
        ResponseEntity<PagedModelItemComunicazione> response = adesioniController.listComunicazioniAdesione(adesione.getIdAdesione(), 0, 10, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il messaggio sia presente nell'elenco
        List<ItemComunicazione> comunicazioni = response.getBody().getContent();
        assertTrue(comunicazioni.stream().anyMatch(s -> s.getTesto().equals("a Testo del Messaggio")));
    }
    
    @Test
    void testListComunicazioniAdesioneMultiSorted() {
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();
        
        List<String> sort = new ArrayList<>();
        sort.add("testo,asc");
        sort.add("oggetto,asc");

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test");
        messaggioCreate.setTesto("a Testo del Messaggio");
        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
        
        messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test 2");
        messaggioCreate.setTesto("z Il testo del Messaggio");
        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
        
        // Invocazione del metodo con sort
        ResponseEntity<PagedModelItemComunicazione> response = adesioniController.listComunicazioniAdesione(adesione.getIdAdesione(), 0, 10, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il messaggio sia presente nell'elenco
        List<ItemComunicazione> comunicazioni = response.getBody().getContent();
        assertTrue(comunicazioni.stream().anyMatch(s -> s.getTesto().equals("a Testo del Messaggio")));
    }
    
    @Test
    void testListComunicazioniAdesioneMultiPage() {
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 40;
        
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();
    	for(int num = 0; num < numeroTotaleDiElementi; num++) {
	        MessaggioCreate messaggioCreate = new MessaggioCreate();
	        messaggioCreate.setOggetto("Oggetto di Test"+num);
	        messaggioCreate.setTesto("a Testo del Messaggio"+num);
	        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
    	}
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
        	
        	ResponseEntity<PagedModelItemComunicazione> response = adesioniController.listComunicazioniAdesione(adesione.getIdAdesione(), n, numeroElementiPerPagina, null);

            // Verifica del successo
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().getContent().isEmpty());
        }
    }

    @Test
    void testListComunicazioniAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.listComunicazioniAdesione(adesione.getIdAdesione(), 0, 10, null));
    }

    @Test
    void testListComunicazioniAdesioneNotFound() {
        // Setup
        UUID randomId = UUID.randomUUID();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.listComunicazioniAdesione(randomId, 0, 10, null));
    }

    @Test
    void testListAdesioniSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());

        AdesioneCreate adesione = new AdesioneCreate();
        adesione.setIdServizio(idServizio);
        adesione.setIdSoggetto(idSoggetto);
        
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("nome_soggetto2");
        soggettoCreate.setIdOrganizzazione(idOrganizzazione);
        soggettoCreate.setAderente(true);
        soggettoCreate.setReferente(true);

        ResponseEntity<Soggetto> soggetto = soggettiController.createSoggetto(soggettoCreate);
        
        adesione = new AdesioneCreate();
        adesione.setIdServizio(idServizio);
        adesione.setIdSoggetto(soggetto.getBody().getIdSoggetto());
        
        adesioniController.createAdesione(adesione);
        
        // Act
        ResponseEntity<PagedModelItemAdesione> response = adesioniController.listAdesioni(
            null, null, null, null, dominio.getIdDominio(), servizio.getIdServizio(),
            null, null, null, null, false, null, null, 0, 10, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        List<ItemAdesione> listAdesione = response.getBody().getContent();
        
        assertFalse(listAdesione.isEmpty());
    }
 
    @Test
    void testListAdesioneSortedNameDesc() {
    	// Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());

        AdesioneCreate adesione = new AdesioneCreate();
        adesione.setIdServizio(idServizio);
        adesione.setIdSoggetto(idSoggetto);
        
        ResponseEntity<Adesione> adesioneResponse = adesioniController.createAdesione(adesione);
        
        adesioneResponse.getBody().getDataCreazione();
        
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("nome_soggetto2");
        soggettoCreate.setIdOrganizzazione(idOrganizzazione);
        soggettoCreate.setAderente(true);
        soggettoCreate.setReferente(true);

        ResponseEntity<Soggetto> soggetto = soggettiController.createSoggetto(soggettoCreate);
        
        adesione = new AdesioneCreate();
        adesione.setIdServizio(idServizio);
        adesione.setIdSoggetto(soggetto.getBody().getIdSoggetto());
        
        adesioneResponse = adesioniController.createAdesione(adesione);
        
        OffsetDateTime val2 = adesioneResponse.getBody().getDataCreazione();
        
        List<String> sort = new ArrayList<>();
        sort.add("dataCreazione,desc");
        
        ResponseEntity<PagedModelItemAdesione> response = adesioniController.listAdesioni(
                null, null, null, null, dominio.getIdDominio(), servizio.getIdServizio(),
                null, null, null, null, false, null, null, 0, 10, sort);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        List<ItemAdesione> listAdesione = response.getBody().getContent();

        assertFalse(listAdesione.isEmpty());
        
        assertEquals(val2, listAdesione.get(0).getDataCreazione());
    }
    
    @Test
    void testListAdesioneSortedNameAsc() {
    	// Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());

        AdesioneCreate adesione = new AdesioneCreate();
        adesione.setIdServizio(idServizio);
        adesione.setIdSoggetto(idSoggetto);
        
        ResponseEntity<Adesione> adesioneResponse = adesioniController.createAdesione(adesione);
        
        OffsetDateTime val = adesioneResponse.getBody().getDataCreazione();
        
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("nome_soggetto2");
        soggettoCreate.setIdOrganizzazione(idOrganizzazione);
        soggettoCreate.setAderente(true);
        soggettoCreate.setReferente(true);

        ResponseEntity<Soggetto> soggetto = soggettiController.createSoggetto(soggettoCreate);
        
        adesione = new AdesioneCreate();
        adesione.setIdServizio(idServizio);
        adesione.setIdSoggetto(soggetto.getBody().getIdSoggetto());
        
        adesioneResponse = adesioniController.createAdesione(adesione);
        
        adesioneResponse.getBody().getDataCreazione();
        
        List<String> sort = new ArrayList<>();
        sort.add("dataCreazione,asc");

        ResponseEntity<PagedModelItemAdesione> response = adesioniController.listAdesioni(
                null, null, null, null, dominio.getIdDominio(), servizio.getIdServizio(),
                null, null, null, null, false, null, null, 0, 10, sort);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        List<ItemAdesione> listAdesione = response.getBody().getContent();

        assertFalse(listAdesione.isEmpty());

        assertEquals(val, listAdesione.get(0).getDataCreazione());
    }
    
    @Test
    void testListAdesioneMultiSorted() {
    	// Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());

        AdesioneCreate adesione = new AdesioneCreate();
        adesione.setIdServizio(idServizio);
        adesione.setIdSoggetto(idSoggetto);
        
        ResponseEntity<Adesione> adesioneResponse = adesioniController.createAdesione(adesione);
        
        OffsetDateTime val = adesioneResponse.getBody().getDataCreazione();
        
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("nome_soggetto2");
        soggettoCreate.setIdOrganizzazione(idOrganizzazione);
        soggettoCreate.setAderente(true);
        soggettoCreate.setReferente(true);

        ResponseEntity<Soggetto> soggetto = soggettiController.createSoggetto(soggettoCreate);
        
        adesione = new AdesioneCreate();
        adesione.setIdServizio(idServizio);
        adesione.setIdSoggetto(soggetto.getBody().getIdSoggetto());
        
        adesioneResponse = adesioniController.createAdesione(adesione);
        
        adesioneResponse.getBody().getDataCreazione();
        
        List<String> sort = new ArrayList<>();
        sort.add("dataCreazione,asc");
        sort.add("dataUltimaModifica,asc");

        ResponseEntity<PagedModelItemAdesione> response = adesioniController.listAdesioni(
                null, null, null, null, dominio.getIdDominio(), servizio.getIdServizio(),
                null, null, null, null, false, null, null, 0, 10, sort);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        List<ItemAdesione> listAdesione = response.getBody().getContent();

        assertFalse(listAdesione.isEmpty());

        assertEquals(val, listAdesione.get(0).getDataCreazione());
    }
    
    @Test
    void testListAdesioneMultiPage() {
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 40;
        
    	// Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());

        AdesioneCreate adesione = new AdesioneCreate();
        adesione.setIdServizio(idServizio);
        adesione.setIdSoggetto(idSoggetto);
        
        adesioniController.createAdesione(adesione);
        
    	for(int num = 0; num < numeroTotaleDiElementi; num++) {
    		SoggettoCreate soggettoCreate = new SoggettoCreate();
            soggettoCreate.setNome("nome_soggetto2"+num);
            soggettoCreate.setIdOrganizzazione(idOrganizzazione);
            soggettoCreate.setAderente(true);
            soggettoCreate.setReferente(true);

            ResponseEntity<Soggetto> soggetto = soggettiController.createSoggetto(soggettoCreate);
            
            adesione = new AdesioneCreate();
            adesione.setIdServizio(idServizio);
            adesione.setIdSoggetto(soggetto.getBody().getIdSoggetto());
            
            adesioniController.createAdesione(adesione);
    	}
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
        	
        	ResponseEntity<PagedModelItemAdesione> response = adesioniController.listAdesioni(
                    null, null, null, null, dominio.getIdDominio(), servizio.getIdServizio(),
                    null, null, null, null, false, null, null, n, numeroElementiPerPagina, null);

            // Verifica del successo
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().getContent().isEmpty());
        }
    }

    @Test
    void testListAdesioniUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());

        AdesioneCreate adesione = new AdesioneCreate();
        adesione.setIdServizio(idServizio);
        adesione.setIdSoggetto(idSoggetto);
        
        adesioniController.createAdesione(adesione);
        
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("nome_soggetto2");
        soggettoCreate.setIdOrganizzazione(idOrganizzazione);
        soggettoCreate.setAderente(true);
        soggettoCreate.setReferente(true);

        ResponseEntity<Soggetto> soggetto = soggettiController.createSoggetto(soggettoCreate);
        
        adesione = new AdesioneCreate();
        adesione.setIdServizio(idServizio);
        adesione.setIdSoggetto(soggetto.getBody().getIdSoggetto());
        
        adesioniController.createAdesione(adesione);
        
        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> adesioniController.listAdesioni(
                null, null, null, null, dominio.getIdDominio(), servizio.getIdServizio(),
                null, null, null, null, false, null, null, 0, 10, null));
    }

    @Test
    void testListClientCollaudoAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Act
        ResponseEntity<PagedModelItemClientAdesione> response = adesioniController.listClientCollaudoAdesione(adesione.getIdAdesione());

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testListClientCollaudoAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.listClientCollaudoAdesione(adesione.getIdAdesione()));
    }

    @Test
    void testListClientProduzioneAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_produzione", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Act
        ResponseEntity<PagedModelItemClientAdesione> response = adesioniController.listClientProduzioneAdesione(adesione.getIdAdesione());

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testListClientProduzioneAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_produzione", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.listClientProduzioneAdesione(adesione.getIdAdesione()));
    }

    @Test
    void testListMessaggiAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Act
        ResponseEntity<PagedModelItemMessaggio> response = adesioniController.listMessaggiAdesione(adesione.getIdAdesione(), null, 0, 10, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testListMessaggiAdesioneSortedNameDesc() {
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        List<String> sort = new ArrayList<>();
        sort.add("testo,desc");
        
        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test");
        messaggioCreate.setTesto("a Testo del Messaggio");
        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
        
        messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test 2");
        messaggioCreate.setTesto("z Il testo del Messaggio");
        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
        
        // Invocazione del metodo con sort
        ResponseEntity<PagedModelItemMessaggio> response = adesioniController.listMessaggiAdesione(adesione.getIdAdesione(), null, 0, 10, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());
        //System.out.println(response);
        // Verifica che il messaggio sia presente nell'elenco
        List<ItemMessaggio> comunicazioni = response.getBody().getContent();
        assertTrue(comunicazioni.stream().anyMatch(s -> s.getTesto().equals("a Testo del Messaggio")));
        assertEquals("z Il testo del Messaggio", comunicazioni.get(0).getTesto());
    }
    
    @Test
    void testListMessaggiAdesioneSortedNameAsc() {
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();
        
        List<String> sort = new ArrayList<>();
        sort.add("testo,asc");

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test");
        messaggioCreate.setTesto("a Testo del Messaggio");
        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
        
        messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test 2");
        messaggioCreate.setTesto("z Il testo del Messaggio");
        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
        
        // Invocazione del metodo con sort
        ResponseEntity<PagedModelItemMessaggio> response = adesioniController.listMessaggiAdesione(adesione.getIdAdesione(), null, 0, 10, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il messaggio sia presente nell'elenco
        List<ItemMessaggio> comunicazioni = response.getBody().getContent();
        assertTrue(comunicazioni.stream().anyMatch(s -> s.getTesto().equals("z Il testo del Messaggio")));
        assertEquals("a Testo del Messaggio", comunicazioni.get(1).getTesto());
    }
    
    @Test
    void testListMessaggiAdesioneMultiSorted() {
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();
        
        List<String> sort = new ArrayList<>();
        sort.add("testo,asc");
        sort.add("oggetto,asc");

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test");
        messaggioCreate.setTesto("a Testo del Messaggio");
        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
        
        messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test 2");
        messaggioCreate.setTesto("z Il testo del Messaggio");
        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
        
        // Invocazione del metodo con sort
        ResponseEntity<PagedModelItemMessaggio> response = adesioniController.listMessaggiAdesione(adesione.getIdAdesione(), null, 0, 10, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il messaggio sia presente nell'elenco
        List<ItemMessaggio> comunicazioni = response.getBody().getContent();
        assertTrue(comunicazioni.stream().anyMatch(s -> s.getTesto().equals("a Testo del Messaggio")));
        assertEquals("a Testo del Messaggio", comunicazioni.get(1).getTesto());
    }
    
    @Test
    void testListMessaggiAdesioneMultiPage() {
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 40;
        
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();
    	for(int num = 0; num < numeroTotaleDiElementi; num++) {
	        MessaggioCreate messaggioCreate = new MessaggioCreate();
	        messaggioCreate.setOggetto("Oggetto di Test"+num);
	        messaggioCreate.setTesto("a Testo del Messaggio"+num);
	        adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);
    	}
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
        	
        	ResponseEntity<PagedModelItemMessaggio> response = adesioniController.listMessaggiAdesione(adesione.getIdAdesione(), null, n, numeroElementiPerPagina, null);

            // Verifica del successo
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().getContent().isEmpty());
        }
    }

    @Test
    void testListMessaggiAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.listMessaggiAdesione(adesione.getIdAdesione(), null, 0, 10, null));
    }

    @Test
    void testListReferentiAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Act
        ResponseEntity<PagedModelReferente> response = adesioniController.listReferentiAdesione(adesione.getIdAdesione(), null, null, 0, 10, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
     
    @Test
    void testListReferentiAdesioneSortedNameDesc() {
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setPrincipal(UTENTE_GESTORE+2);
        utenteCreate.setIdOrganizzazione(idOrganizzazione);
        utentiController.createUtente(utenteCreate);
        
        InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_GESTORE+2, utenteService);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(info.utente.getIdUtente());
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);
    	
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        List<String> sort = new ArrayList<>();
        sort.add("tipo,desc");
        
        // Invocazione del metodo con sort
        ResponseEntity<PagedModelReferente> response = adesioniController.listReferentiAdesione(adesione.getBody().getIdAdesione(), null, null, 0, 10, sort);
        
        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());
        //System.out.println(response);
        // Verifica che il messaggio sia presente nell'elenco
        List<Referente> referente = response.getBody().getContent();
        assertTrue(referente.stream().anyMatch(s -> s.getUtente().getPrincipal().equals(UTENTE_GESTORE)));
        assertEquals(UTENTE_GESTORE+2, referente.get(0).getUtente().getPrincipal());
    }
    
    @Test
    void testListReferentiAdesioneSortedNameAsc() {
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setPrincipal(UTENTE_GESTORE+2);
        utenteCreate.setIdOrganizzazione(idOrganizzazione);
        utentiController.createUtente(utenteCreate);
        
        InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_GESTORE+2, utenteService);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(info.utente.getIdUtente());
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
    	
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        List<String> sort = new ArrayList<>();
        sort.add("referente,asc");

        ResponseEntity<PagedModelReferente> response = adesioniController.listReferentiAdesione(adesione.getBody().getIdAdesione(), null, null, 0, 10, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il messaggio sia presente nell'elenco
        List<Referente> referente = response.getBody().getContent();
        assertTrue(referente.stream().anyMatch(s -> s.getUtente().getPrincipal().equals(UTENTE_GESTORE+2)));
        assertEquals(UTENTE_GESTORE, referente.get(0).getUtente().getPrincipal());
    }
    
    @Test
    void testListReferentiAdesioneMultiSorted() {
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setPrincipal(UTENTE_GESTORE+2);
        utenteCreate.setIdOrganizzazione(idOrganizzazione);
        utentiController.createUtente(utenteCreate);
        
        InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_GESTORE+2, utenteService);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(info.utente.getIdUtente());
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
    	
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        List<String> sort = new ArrayList<>();
        sort.add("tipo,asc");
        sort.add("id,asc");
        
        // Invocazione del metodo con sort
        ResponseEntity<PagedModelReferente> response = adesioniController.listReferentiAdesione(adesione.getBody().getIdAdesione(), null, null, 0, 10, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il messaggio sia presente nell'elenco
        List<Referente> referente = response.getBody().getContent();
        assertTrue(referente.stream().anyMatch(s -> s.getUtente().getPrincipal().equals(UTENTE_GESTORE+2)));
    }
    
    @Test
    void testListReferentiAdesioneMultiPage() {
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 40;
        
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        for(int num = 0; num < numeroTotaleDiElementi; num++) {
        	UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
            utenteCreate.setPrincipal(UTENTE_GESTORE+num);
            utenteCreate.setIdOrganizzazione(idOrganizzazione);
            utentiController.createUtente(utenteCreate);
        	
            InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_GESTORE+num, utenteService);
            
        	newReferente = new ReferenteCreate();
            newReferente.setIdUtente(info.utente.getIdUtente());
            newReferente.setTipo(TipoReferenteEnum.REFERENTE);
            
            listaReferenti.add(newReferente);
    	}
    	
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
    	
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
        	
        	ResponseEntity<PagedModelReferente> response = adesioniController.listReferentiAdesione(adesione.getBody().getIdAdesione(), null, null, n, numeroElementiPerPagina, null);

            // Verifica del successo
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().getContent().isEmpty());
        }
    }

    @Test
    void testListReferentiAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.listReferentiAdesione(adesione.getIdAdesione(), null, null, 0, 10, null));
    }

    @Test
    void testUpdateAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        AdesioneUpdate adesioneUpdate = new AdesioneUpdate();

        // Act
        ResponseEntity<Adesione> response = adesioniController.updateAdesione(adesione.getIdAdesione(), adesioneUpdate, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
    
    private API aggiornaCollaudo(UUID idAPI) {
    	ApiUpdate apiUpdate = new ApiUpdate();
    	DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setContentType("application/pdf");
        documento.setContent(Base64.encodeBase64String("contenuto modificato".getBytes()));
        documento.setFilename("allegato_modificato.pdf");
        APIDatiAmbienteUpdate apiDatiAmbienteUpdate = new APIDatiAmbienteUpdate();
        apiDatiAmbienteUpdate.setSpecifica(documento);
        apiDatiAmbienteUpdate.setProtocollo(ProtocolloEnum.REST);
        APIDatiErogazione apiDatiErogazione = new APIDatiErogazione();
        apiDatiErogazione.setNomeGateway("APIGateway");
        apiDatiErogazione.setVersioneGateway(1);
        apiDatiErogazione.setUrlPrefix("http://");
        apiDatiErogazione.setUrl("testurl.com/test");
        apiDatiAmbienteUpdate.setDatiErogazione(apiDatiErogazione);
        apiUpdate.setConfigurazioneCollaudo(null);
        //apiUpdate.setConfigurazioneCollaudo(apiDatiAmbienteUpdate);
    	ResponseEntity<API> api = apiController.updateApi(idAPI, apiUpdate);
    	return api.getBody();
    }
    
    private void cambioStatoAdesioneFinoA(UUID idAdesione, String statoFinale) {
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
        for (int i = 0; i < sequenzaStati.size(); i++) {
        	StatoUpdate stato = sequenzaStati.get(i);
        	try {	
        		adesioniController.updateStatoAdesione(idAdesione, stato, null);
        		//adesioniController.updateStatoAdesione(idAdesione, statoUpdate);
        		
    	    } catch (UpdateEntitaComplessaNonValidaSemanticamenteException e) {
    	        List<EntitaComplessaError> errori = e.getErrori();
    	        for (EntitaComplessaError errore : errori) {
    	            System.out.println("Errore:");
    	            System.out.println("Sottotipo: " + errore.getSottotipo());

    	            // Se 'dato' è un oggetto complesso, puoi accedere ai suoi attributi se disponibili
    	            ConfigurazioneClasseDato dato = errore.getDato();
    	            if (dato != null) {
    	                System.out.println("Dato: " + dato.getValue());
    	            }

    	            // Stampa i parametri se presenti
    	            Map<String, String> params = errore.getParams();
    	            if (params != null && !params.isEmpty()) {
    	                System.out.println("Parametri:");
    	                for (Map.Entry<String, String> entry : params.entrySet()) {
    	                    System.out.println("  " + entry.getKey() + ": " + entry.getValue());
    	                }
    	            }

    	            // Stampa i campi se presenti
    	            List<Campo> campi = errore.getCampi();
    	            if (campi != null && !campi.isEmpty()) {
    	                System.out.println("Campi:");
    	                for (Campo campo : campi) {
    	                    System.out.println("  Nome Campo: " + campo.getNomeCampo());
    	                }
    	            }
    	        }
    	        fail("Si è verificata un'eccezione: " + e.getMessage());
    	        
    	    } catch (Exception e) {
    	        e.printStackTrace();
    	        fail("Si è verificata un'eccezione inattesa: " + e.getMessage());
    	    }
			
            // Termina il ciclo quando raggiungi lo stato finale desiderato
            if (stato.getStato().equals(statoFinale)) {
                break;
            }
        }
    }
    
    private UUID idAdesione;
    
    private void setIdServizio(UUID id) {
        this.idServizio = id;
    }
    
    private void setIdOrganizazione(UUID id) {
    	this.idOrganizzazione = id;
    }
    
    private void setIdAdesione(UUID id) {
    	this.idAdesione = id;
    }
    
    ResponseEntity<Organizzazione> response;
    ResponseEntity<Soggetto> createdSoggetto;
    ResponseEntity<Utente> responseUtente;
    ResponseEntity<Gruppo> responseGruppo;
    DocumentoCreate immagine = new DocumentoCreate();

	private static final String UTENTE_REFERENTE_ADESIONE = "utente_referente_adesione";
	private static final String UTENTE_REFERENTE_TECNICO_ADESIONE = "utente_referente_tecnico_adesione";
	
	private static final String UTENTE_REFERENTE_SERVIZIO = "utente_referente__servizio";
	private static final String UTENTE_REFERENTE_TECNICO_SERVIZIO = "utente_referente_tecnico__servizio";
	private static final String UTENTE_REFERENTE_DOMINIO = "utente_referente__dominio";
	private static final String UTENTE_REFERENTE_TECNICO_DOMINIO = "utente_referente_tecnico__dominio";
	
	private static UUID ID_UTENTE_REFERENTE_ADESIONE;
	private static UUID ID_UTENTE_REFERENTE_TECNICO_ADESIONE;
	private static UUID ID_UTENTE_REFERENTE_SERVIZIO;
	private static UUID ID_UTENTE_REFERENTE_TECNICO_SERVIZIO;
	private static UUID ID_UTENTE_REFERENTE_DOMINIO;
	private static UUID ID_UTENTE_REFERENTE_TECNICO_DOMINIO;
	
	private static final String NOME_GRUPPO = "Gruppo xyz";
	
    private Dominio getDominioFull(VisibilitaDominioEnum value) {
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setEsterna(false);

        response = organizzazioniController.createOrganizzazione(organizzazione);
        this.setIdOrganizazione(response.getBody().getIdOrganizzazione());
        assertNotNull(response.getBody().getIdOrganizzazione());
        
        
        
        //associo l'utente all'Organizzazione
        UtenteUpdate upUtente = new UtenteUpdate();
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
        upUtente.setPrincipal(UTENTE_GESTORE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("gestore");
        upUtente.setRuolo(RuoloUtenteEnum.GESTORE);

        utentiController.updateUtente(ID_UTENTE_GESTORE, upUtente);
        
        upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_REFERENTE_SERVIZIO);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("referente_servizio");
        upUtente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);

        utentiController.updateUtente(ID_UTENTE_REFERENTE_SERVIZIO, upUtente);
        
        
        upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_RICHIEDENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_adesione");

        utentiController.updateUtente(ID_UTENTE_RICHIEDENTE_ADESIONE, upUtente);
        
        upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_REFERENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("referente_adesione");

        utentiController.updateUtente(ID_UTENTE_REFERENTE_ADESIONE, upUtente);
        
        upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_REFERENTE_TECNICO_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("referente_tecnico_adesione");

        utentiController.updateUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE, upUtente);
		
        
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("nome_soggetto");
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setAderente(true);
        soggettoCreate.setReferente(true);

        createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        idSoggetto = createdSoggetto.getBody().getIdSoggetto();
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        gruppoCreate.setNome(NOME_GRUPPO);
        responseGruppo = gruppiController.createGruppo(gruppoCreate);
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
        ref.setIdUtente(ID_UTENTE_REFERENTE_DOMINIO);
        ref.setTipo(TipoReferenteEnum.REFERENTE);
        dominiController.createReferenteDominio(createdDominio.getBody().getIdDominio(), ref);
        
        //creo il referente tecnico dominio
        ref = new ReferenteCreate();
        ref.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        ref.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        dominiController.createReferenteDominio(createdDominio.getBody().getIdDominio(), ref);
        return createdDominio.getBody();
    }
    
    private Servizio getServizioFull(Dominio dominio, VisibilitaServizioEnum value) {
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

         ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
         
         Servizio servizio = createdServizio.getBody();

         this.setIdServizio(servizio.getIdServizio());
         
         return servizio;
    }
    
    private API getAPIFull() {
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
        authType.setProfilo(PROFILO);
        
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
        
        return response.getBody();
    }
    
    private Adesione getAdesioneFull() {
    	List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);
    	
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);

        this.setIdAdesione(adesione.getBody().getIdAdesione());
        
        //creo il client per il collaudo
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);

        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);
        
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem");
        //String encodedContent = Base64.encodeBase64String(pemCert.getBytes(StandardCharsets.UTF_8));
        documento.setContent(pemCert);

        documento.setContentType("application/x-pem-file");
        
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
    	
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        //clientCreate.setTipoClient(TipoAdesioneClientUpdateEnum.NUOVO);
        
        
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        UUID idClient = clientResponse.getBody().getIdClient();
        //clientController.updateClientStato(null, null);
        
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        
        adesioniController.saveClientCollaudoAdesione(idAdesione, PROFILO, adesioneIdClient, null);
        
        
        //creo il client per la produzione
        clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.PRODUZIONE);

        dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);
        
        certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        
        documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.cer");
        documento.setContent(pemCert);
        documento.setContentType("application/cert");
        
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
    	
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        
        
        clientResponse = clientController.createClient(clientCreate);
        idClient = clientResponse.getBody().getIdClient();
        
        adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        
        adesioniController.saveClientProduzioneAdesione(idAdesione, PROFILO, adesioneIdClient, null);
        
        
        return adesione.getBody();
    }
    
    private void tornaAStato(UUID idServizio, String nomeStatoPartenza, String nomeStatoArrivo) {
    	List<StatoUpdate> sequenzaStati = new ArrayList<>();
    	
    	StatoUpdate stato1 = new StatoUpdate();
        stato1.setStato("pubblicato_produzione");
        stato1.setCommento("pubblicato in produzione");
        sequenzaStati.add(stato1);

        StatoUpdate stato2 = new StatoUpdate();
        stato2.setStato("in_configurazione_produzione");
        stato2.setCommento("in configurazione in produzione");
        sequenzaStati.add(stato2);
        
        StatoUpdate stato3 = new StatoUpdate();
        stato3.setStato("autorizzato_produzione");
        stato3.setCommento("autorizzato in produzione");
        sequenzaStati.add(stato3);
        
        StatoUpdate stato4 = new StatoUpdate();
        stato4.setStato("richiesto_produzione");
        stato4.setCommento("richiesto in produzione");
        sequenzaStati.add(stato4);
        
        StatoUpdate stato5 = new StatoUpdate();
        stato5.setStato("pubblicato_collaudo");
        stato5.setCommento("pubblicato in collaudo");
        sequenzaStati.add(stato5);
        
        StatoUpdate stato6 = new StatoUpdate();
        stato6.setStato("in_configurazione_collaudo");
        stato6.setCommento("in configurazione collaudo");
        sequenzaStati.add(stato6);
        
        StatoUpdate stato7 = new StatoUpdate();
        stato7.setStato("autorizzato_collaudo");
        stato7.setCommento("autorizzato collaudo");
        sequenzaStati.add(stato7);

        StatoUpdate stato8 = new StatoUpdate();
        stato8.setStato("richiesto_collaudo");
        stato8.setCommento("richiesta di collaudo");
        sequenzaStati.add(stato8);
        
        StatoUpdate stato9 = new StatoUpdate();
        stato9.setStato("bozza");
        stato9.setCommento("bozza");
        sequenzaStati.add(stato9);

        boolean statoPartenza = false;
        for (StatoUpdate statoUpdate : sequenzaStati) {
        	if(statoPartenza) {
        		serviziController.updateStatoServizio(idServizio, statoUpdate);
	            if (statoUpdate.getStato().equals(nomeStatoArrivo)) {
	                break;
	            }
        	}
        	if(statoUpdate.getStato().equals(nomeStatoPartenza)) {
        		statoPartenza = true;
        	}
        }
    }
    
    private Servizio servizio;
    private ReferenteCreate newReferente;
    
    private ResponseEntity<Adesione> getInizializza() {
    	Dominio dominio = this.getDominioFull(null);
        servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
    	List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
    	
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(servizio.getIdServizio());
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreate);

        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        //Produzione
        ClientCreate clientCreateP = new ClientCreate();
        clientCreateP.setIdSoggetto(idSoggetto);
        clientCreateP.setNome("ClientTestP");
        clientCreateP.setAmbiente(AmbienteEnum.PRODUZIONE);
        clientCreateP.setDatiSpecifici(dati);
        clientCreateP.setDescrizione("descrizione");
        clientCreateP.setIndirizzoIp("1.1.1.1");
        clientCreateP.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreateP);
        return adesione;
    }
    
    @Test
    void testCreateReferenteAdesione() {
    	ResponseEntity<Adesione> adesione = this.getInizializza();

        AdesioneIdClient adesioneIdClientP = new AdesioneIdClient();
        adesioneIdClientP.setNome("ClientTestP");
        adesioneIdClientP.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClientP.setIdSoggetto(idSoggetto);
        adesioneIdClientP.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClientP, null);
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "pubblicato_produzione");
        this.tornaAStato(servizio.getIdServizio(),"pubblicato_collaudo", "bozza");
        //apiController.deleteAPI(api.getIdApi());
        //serviziController.deleteServizio(servizio.getIdServizio());
        adesioniController.deleteClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        adesioniController.deleteClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        adesioniController.createReferenteAdesione(adesione.getBody().getIdAdesione(), newReferente, true);
    }
    
    @Test
    void testCreateReferenteAdesioneErrore() {
    	ResponseEntity<Adesione> adesione = this.getInizializza();

        AdesioneIdClient adesioneIdClientP = new AdesioneIdClient();
        adesioneIdClientP.setNome("ClientTestP");
        adesioneIdClientP.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClientP.setIdSoggetto(idSoggetto);
        adesioneIdClientP.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClientP, null);
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "pubblicato_produzione");
        this.tornaAStato(servizio.getIdServizio(),"pubblicato_collaudo", "bozza");
        
        final ReferenteCreate finalReferente = new ReferenteCreate();
        finalReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        finalReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        adesioniController.deleteClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        adesioniController.deleteClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, ()->adesioniController.createReferenteAdesione(adesione.getBody().getIdAdesione(), finalReferente, null));
    }
    
    @Test
    void testDeleteReferenteAdesione() {
    	Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        API api = this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
    	List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
    	
        listaReferenti.add(newReferente);
        
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(servizio.getIdServizio());
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreate);

        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        //Produzione
        ClientCreate clientCreateP = new ClientCreate();
        clientCreateP.setIdSoggetto(idSoggetto);
        clientCreateP.setNome("ClientTestP");
        clientCreateP.setAmbiente(AmbienteEnum.PRODUZIONE);
        clientCreateP.setDatiSpecifici(dati);
        clientCreateP.setDescrizione("descrizione");
        clientCreateP.setIndirizzoIp("1.1.1.1");
        clientCreateP.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreateP);

        AdesioneIdClient adesioneIdClientP = new AdesioneIdClient();
        adesioneIdClientP.setNome("ClientTestP");
        adesioneIdClientP.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClientP.setIdSoggetto(idSoggetto);
        adesioneIdClientP.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClientP, null);
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "pubblicato_produzione");
        this.tornaAStato(servizio.getIdServizio(),"pubblicato_collaudo", "bozza");
        adesioniController.deleteClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        adesioniController.deleteClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        adesioniController.deleteReferenteAdesione(adesione.getBody().getIdAdesione(), ID_UTENTE_REFERENTE_TECNICO_ADESIONE, TipoReferenteEnum.REFERENTE_TECNICO, true);
    }
    
    @Test
    void testDeleteReferenteAdesioneErrore() {
    	Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        API api = this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
    	List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
    	
        listaReferenti.add(newReferente);
        
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(servizio.getIdServizio());
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreate);

        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        //Produzione
        ClientCreate clientCreateP = new ClientCreate();
        clientCreateP.setIdSoggetto(idSoggetto);
        clientCreateP.setNome("ClientTestP");
        clientCreateP.setAmbiente(AmbienteEnum.PRODUZIONE);
        clientCreateP.setDatiSpecifici(dati);
        clientCreateP.setDescrizione("descrizione");
        clientCreateP.setIndirizzoIp("1.1.1.1");
        clientCreateP.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreateP);

        AdesioneIdClient adesioneIdClientP = new AdesioneIdClient();
        adesioneIdClientP.setNome("ClientTestP");
        adesioneIdClientP.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClientP.setIdSoggetto(idSoggetto);
        adesioneIdClientP.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClientP, null);
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "pubblicato_produzione");
        this.tornaAStato(servizio.getIdServizio(),"pubblicato_collaudo", "bozza");
        
        adesioniController.deleteClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        adesioniController.deleteClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.deleteReferenteAdesione(adesione.getBody().getIdAdesione(), ID_UTENTE_REFERENTE_TECNICO_ADESIONE, TipoReferenteEnum.REFERENTE_TECNICO, null));
    }

    private String pemCert = "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURhekNDQWxPZ0F3SUJBZ0lFSGZ2NzR6QU5CZ2txaGtpRzl3MEJBUXNGQURCbU1Rc3dDUVlEVlFRR0V3SkoNClZERU9NQXdHQTFVRUNCTUZTWFJoYkhreERUQUxCZ05WQkFjVEJGQnBjMkV4RFRBTEJnTlZCQW9UQkZSbGMzUXgNCkRUQUxCZ05WQkFzVEJGUmxjM1F4R2pBWUJnTlZCQU1URVVWNFlXMXdiR1ZEYkdsbGJuUXlTRk5OTUI0WERUSTANCk1EUXdPREE1TWpReE1Wb1hEVFEwTURRd016QTVNalF4TVZvd1pqRUxNQWtHQTFVRUJoTUNTVlF4RGpBTUJnTlYNCkJBZ1RCVWwwWVd4NU1RMHdDd1lEVlFRSEV3UlFhWE5oTVEwd0N3WURWUVFLRXdSVVpYTjBNUTB3Q3dZRFZRUUwNCkV3UlVaWE4wTVJvd0dBWURWUVFERXhGRmVHRnRjR3hsUTJ4cFpXNTBNa2hUVFRDQ0FTSXdEUVlKS29aSWh2Y04NCkFRRUJCUUFEZ2dFUEFEQ0NBUW9DZ2dFQkFLMmNVQ29CcWptUTR4OWZoYlJDbk0rYmJ5ZjJwSWxSa3NRUVB5clcNCmlmWUVvaCtxZ1NROVYzS05uNWJpaTBSeWMzaDd3VGNJY2tCY2ZnczhKTGk1SHhHM2t4V1p2Z2xXL1NIOEEyVHUNClFYdkJwajlLNnd6UzB4RUduenFxaHlwVXJIL1lMRGZYandnVmZ1TS9IeEU1MjNGcFM3dGUwQXcwV2Jac1pxeTYNCmhNcWxLZk8wek52UTR1Rk5ML3NHV1pNN29kaDRPcGhaSUdOZDd0VnBnVkdQNDNDZUZvZnAyeGRxcmk5Ry9IMjINCmNQa2p4dFpoVFpuZk9RejFkNHVYRjZsU3M1dUV6RGI3ZGxKOERoZTJROUtTa0ZnRDZVME83UnZyNnpibEd4dUENCjVDdTRQSFNkeko0Y0RhZkJ4RDlrclJzYjI5cXFjK2g3alpwSzh2NkhoU2N4M2VjQ0F3RUFBYU1oTUI4d0hRWUQNClZSME9CQllFRkljWmh6UlZmYVRER1MwTm44cmRJU3FGbDhOK01BMEdDU3FHU0liM0RRRUJDd1VBQTRJQkFRQXYNCitYWFNiWWVDY1VmY2hhRkNzay9sc3hLZ0gwcFhyTlRoZXptOGd3YUpOem9KOVJQU2RnenJtSzYwOWl5M1RvaGcNClhpc040elorRkx3NVBTby9HNmU1OU5SZEdmTS93UFIwUGoyN2d0dWhITWpBeU8vY3FldWQ3S1lvZWxpTEZPRWwNCldyTWo2QmlxaGZQZmMzU3FqakZVWWtoR2s2eXZFeDREWGVPNnlmNSszczJMbTIwSTM3YU9ZblhBNVdmTGJwY1QNCnp2RWhGSk02Q3d6Q0VwbmI3M3E3ekc4ODJZTjcxL3RRS1VhS2dpV0ZPeDVvQ2dCMFZGNERlejd0ZFJYNHpZRlMNCmFKeUdIQ3F6NVZvR29CSHV1K0dpZERlRkdZZTRvZTA4cFpZWjFHS1dROG05RmlhYTlSQnJNNTNFclFidzNpWncNCnVqby9UMm9MSis3NWFTb3VCamFUCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K";

    @Test
    void testCertificatoNonValido() {
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem");
        documento.setContent(Base64.encodeBase64String(pemCert.getBytes()));
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        assertThrows(RichiestaNonValidaSemanticamenteException.class, () -> clientController.createClient(clientCreate));
    }
    
    @Test
    void testDeleteClientCollaudoAdesione() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreate);

        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        //Fine creazione e configurazione Adesione
        //----------------------------------------
        
        //(1) Porto l'Adesione nello stato Richiesto in Collaudo
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "pubblicato_collaudo");
        
        //(2) Disconnetto (cancello) il Client dall'Adesione
        adesioniController.deleteClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
    }
    
    @Test
    void testDeleteClientCollaudoAdesioneErrore() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreate);

        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        //Fine creazione e configurazione Adesione
        //----------------------------------------
        
        //(1) Porto l'Adesione nello stato Richiesto in Collaudo
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "pubblicato_collaudo");
        
        //(2) Disconnetto (cancello) il Client dall'Adesione
        assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.deleteClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, null));
    }
    
    @Test
    void testDeleteClientProduzioneAdesione() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_produzione", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreate);

        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        //Produzione
        ClientCreate clientCreateP = new ClientCreate();
        clientCreateP.setIdSoggetto(idSoggetto);
        clientCreateP.setNome("ClientTestP");
        clientCreateP.setAmbiente(AmbienteEnum.PRODUZIONE);
        clientCreateP.setDatiSpecifici(dati);
        clientCreateP.setDescrizione("descrizione");
        clientCreateP.setIndirizzoIp("1.1.1.1");
        clientCreateP.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreateP);

        AdesioneIdClient adesioneIdClientP = new AdesioneIdClient();
        adesioneIdClientP.setNome("ClientTestP");
        adesioneIdClientP.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClientP.setIdSoggetto(idSoggetto);
        adesioneIdClientP.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClientP, null);
        //Fine creazione e configurazione Adesione
        //----------------------------------------
        
        //(1) Porto l'Adesione nello stato Richiesto in Collaudo
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "pubblicato_produzione");
        
        //(2) Disconnetto (cancello) il Client dall'Adesione
        adesioniController.deleteClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
    }
    
    @Test
    void testDeleteClientProduzioneAdesioneErrore() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_produzione", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        //Collaudo
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreate);

        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        //Produzione
        ClientCreate clientCreateP = new ClientCreate();
        clientCreateP.setIdSoggetto(idSoggetto);
        clientCreateP.setNome("ClientTestP");
        clientCreateP.setAmbiente(AmbienteEnum.PRODUZIONE);
        clientCreateP.setDatiSpecifici(dati);
        clientCreateP.setDescrizione("descrizione");
        clientCreateP.setIndirizzoIp("1.1.1.1");
        clientCreateP.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreateP);

        AdesioneIdClient adesioneIdClientP = new AdesioneIdClient();
        adesioneIdClientP.setNome("ClientTestP");
        adesioneIdClientP.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClientP.setIdSoggetto(idSoggetto);
        adesioneIdClientP.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClientP, null);
        //Fine creazione e configurazione Adesione
        //----------------------------------------
        
        //(1) Porto l'Adesione nello stato Richiesto in Collaudo
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "pubblicato_produzione");
        
        //(2) Disconnetto (cancello) il Client dall'Adesione
        assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.deleteClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, null));
    }

    @Test
    void testSaveClientCollaudoAdesione() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreate);

        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "pubblicato_collaudo");
        adesioniController.deleteClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        //adesioniController.deleteReferenteAdesione(adesione.getBody().getIdAdesione(), UTENTE_REFERENTE_ADESIONE, TipoReferenteEnum.REFERENTE, null);
        //adesioniController.deleteReferenteAdesione(adesione.getBody().getIdAdesione(), UTENTE_REFERENTE_TECNICO_DOMINIO, TipoReferenteEnum.REFERENTE_TECNICO, null);
        //adesioniController.deleteReferenteAdesione(adesione.getBody().getIdAdesione(), UTENTE_REFERENTE_TECNICO_ADESIONE, TipoReferenteEnum.REFERENTE_TECNICO, null);
        //this.tornaAStato(servizio.getIdServizio(), "pubblicato_collaudo", "bozza");
        //serviziController.deleteServizio(servizio.getIdServizio());
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
    }
    
    @Test
    void testSaveClientProduzioneAdesione() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.PRODUZIONE);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreate);

        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
    }
    
    @Test
    void testUpdateErogazioneCollaudoAdesione() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        API api = this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "richiesto_collaudo");
        
        //Disconnetto (cancello) il Client dall'Adesione
        adesioniController.deleteClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        
        //a questo punto l'operazione con la force a false dovrebbe fallire
        
        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = api.getIdApi();
        
        adesioniController.saveErogazioneCollaudoAdesione(adesione.getBody().getIdAdesione(), idErogazione, adesioneErogazioneUpdate, true);
    }
    
    @Test
    void testUpdateErogazioneCollaudoAdesioneErrore() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        API api = this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreate);

        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "richiesto_collaudo");
        
        //Disconnetto (cancello) il Client dall'Adesione
        adesioniController.deleteClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        
        //a questo punto l'operazione con la force a false dovrebbe fallire
        
        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = api.getIdApi();
        
        assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.saveErogazioneCollaudoAdesione(adesione.getBody().getIdAdesione(), idErogazione, adesioneErogazioneUpdate, null));
    }
    
    @Test
    void testUpdateErogazioneProduzioneAdesione() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        API api = this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        
        //Produzione
        ClientCreate clientCreateP = new ClientCreate();
        clientCreateP.setIdSoggetto(idSoggetto);
        clientCreateP.setNome("ClientTestP");
        clientCreateP.setAmbiente(AmbienteEnum.PRODUZIONE);
        clientCreateP.setDatiSpecifici(dati);
        clientCreateP.setDescrizione("descrizione");
        clientCreateP.setIndirizzoIp("1.1.1.1");
        clientCreateP.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreateP);

        AdesioneIdClient adesioneIdClientP = new AdesioneIdClient();
        adesioneIdClientP.setNome("ClientTestP");
        adesioneIdClientP.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClientP.setIdSoggetto(idSoggetto);
        adesioneIdClientP.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClientP, null);
        
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "richiesto_collaudo");
        
        //Disconnetto (cancello) il Client dall'Adesione
        adesioniController.deleteClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        
        //a questo punto l'operazione con la force a false dovrebbe fallire
        
        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = api.getIdApi();
        
        adesioniController.saveErogazioneProduzioneAdesione(adesione.getBody().getIdAdesione(), idErogazione, adesioneErogazioneUpdate, true);
    }
    
    @Test
    void testUpdateErogazioneProduzioneAdesioneErrore() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        API api = this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        
        //Produzione
        ClientCreate clientCreateP = new ClientCreate();
        clientCreateP.setIdSoggetto(idSoggetto);
        clientCreateP.setNome("ClientTestP");
        clientCreateP.setAmbiente(AmbienteEnum.PRODUZIONE);
        clientCreateP.setDatiSpecifici(dati);
        clientCreateP.setDescrizione("descrizione");
        clientCreateP.setIndirizzoIp("1.1.1.1");
        clientCreateP.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreateP);

        AdesioneIdClient adesioneIdClientP = new AdesioneIdClient();
        adesioneIdClientP.setNome("ClientTestP");
        adesioneIdClientP.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClientP.setIdSoggetto(idSoggetto);
        adesioneIdClientP.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClientP, null);
        
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "richiesto_collaudo");
        
        //Disconnetto (cancello) il Client dall'Adesione
        adesioniController.deleteClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        adesioniController.deleteClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        
        //a questo punto l'operazione con la force a false dovrebbe fallire
        
        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = api.getIdApi();
        
        assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.saveErogazioneProduzioneAdesione(adesione.getBody().getIdAdesione(), idErogazione, adesioneErogazioneUpdate, null));
    }
    
    @Test
    void testConfigurazioneCustomCollaudoAdesione() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "richiesto_collaudo");
        
        //Disconnetto (cancello) il Client dall'Adesione
        adesioniController.deleteClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        DatiCustomAdesioneUpdate datiCustom = new DatiCustomAdesioneUpdate();
        
        adesioniController.saveConfigurazioneCustomCollaudoAdesione(adesione.getBody().getIdAdesione(), datiCustom, true);
    }
    
    @Test
    void testConfigurazioneCustomCollaudoAdesioneErrore() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "richiesto_collaudo");
        
        //Disconnetto (cancello) il Client dall'Adesione
        adesioniController.deleteClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        DatiCustomAdesioneUpdate datiCustom = new DatiCustomAdesioneUpdate();
        
        assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.saveConfigurazioneCustomCollaudoAdesione(adesione.getBody().getIdAdesione(), datiCustom, null));
    }
    
    @Test
    void testConfigurazioneCustomProduzioneAdesione() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        
        //Produzione
        ClientCreate clientCreateP = new ClientCreate();
        clientCreateP.setIdSoggetto(idSoggetto);
        clientCreateP.setNome("ClientTestP");
        clientCreateP.setAmbiente(AmbienteEnum.PRODUZIONE);
        clientCreateP.setDatiSpecifici(dati);
        clientCreateP.setDescrizione("descrizione");
        clientCreateP.setIndirizzoIp("1.1.1.1");
        clientCreateP.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreateP);

        AdesioneIdClient adesioneIdClientP = new AdesioneIdClient();
        adesioneIdClientP.setNome("ClientTestP");
        adesioneIdClientP.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClientP.setIdSoggetto(idSoggetto);
        adesioneIdClientP.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClientP, null);
        
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "richiesto_collaudo");
        
        //Disconnetto (cancello) il Client dall'Adesione
        adesioniController.deleteClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        DatiCustomAdesioneUpdate datiCustom = new DatiCustomAdesioneUpdate();
        
        adesioniController.saveConfigurazioneCustomProduzioneAdesione(adesione.getBody().getIdAdesione(), datiCustom, true);
    }
    
    @Test
    void testConfigurazioneCustomProduzioneAdesioneErrore() {
    	// Setup
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPIFull();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        //Creo e configuro l'Adesione
        //------------------------------------
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);

        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);

        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        
        //Produzione
        ClientCreate clientCreateP = new ClientCreate();
        clientCreateP.setIdSoggetto(idSoggetto);
        clientCreateP.setNome("ClientTestP");
        clientCreateP.setAmbiente(AmbienteEnum.PRODUZIONE);
        clientCreateP.setDatiSpecifici(dati);
        clientCreateP.setDescrizione("descrizione");
        clientCreateP.setIndirizzoIp("1.1.1.1");
        clientCreateP.setStato(StatoClientEnum.CONFIGURATO);
        clientController.createClient(clientCreateP);

        AdesioneIdClient adesioneIdClientP = new AdesioneIdClient();
        adesioneIdClientP.setNome("ClientTestP");
        adesioneIdClientP.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClientP.setIdSoggetto(idSoggetto);
        adesioneIdClientP.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClientP, null);
        
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), "richiesto_collaudo");
        
        //Disconnetto (cancello) il Client dall'Adesione
        adesioniController.deleteClientProduzioneAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        adesioniController.deleteClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, true);
        DatiCustomAdesioneUpdate datiCustom = new DatiCustomAdesioneUpdate();
        
        assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.saveConfigurazioneCustomProduzioneAdesione(adesione.getBody().getIdAdesione(), datiCustom, null));
    }
       
    @Test
    void testUpdateAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        AdesioneUpdate adesioneUpdate = new AdesioneUpdate();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.updateAdesione(adesione.getIdAdesione(), adesioneUpdate, null));
    }
    
    @Test
    void testUpdateAdesioneNotFound() {
        // Setup
        UUID randomId = UUID.randomUUID();
        AdesioneUpdate adesioneUpdate = new AdesioneUpdate();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.updateAdesione(randomId, adesioneUpdate, null));
    }
    @Autowired
    ClientController clientController;
    @Test
    void testSaveClientCollaudoAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_RICHIEDENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);

        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        UUID idAdesione = adesione.getBody().getIdAdesione();
        
        //creo il client per il collaudo
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);

        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);
        
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.cer");
        documento.setContent(pemCert);
        documento.setContentType("application/cert");
        
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
    	
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        
        adesioniController.saveClientCollaudoAdesione(idAdesione, PROFILO, adesioneIdClient, null);
        
        // Act
        ResponseEntity<Adesione> response = adesioniController.saveClientCollaudoAdesione(idAdesione, PROFILO, adesioneIdClient, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
    
    @Test
    void testSaveClientCollaudoAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        AdesioneClientUpdate adesioneClientUpdate = new AdesioneClientUpdate();
        adesioneClientUpdate.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.saveClientCollaudoAdesione(adesione.getIdAdesione(), "ProfiloTest", adesioneClientUpdate, null));
    }
    
    @Test
    void testSaveErogazioneCollaudoAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        API api = this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = api.getIdApi();

        // Act
        ResponseEntity<Adesione> response = adesioniController.saveErogazioneCollaudoAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
    
    @Test
    void testSaveErogazioneCollaudoAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        API api = this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = api.getIdApi();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.saveErogazioneCollaudoAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, null));
    }
    
    @Test
    void testSaveErogazioneProduzioneAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        API api = this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_produzione", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();
        
        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = api.getIdApi();
        
        // Act
        ResponseEntity<Adesione> response = adesioniController.saveErogazioneProduzioneAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
    
    @Test
    void testSaveErogazioneProduzioneAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        API api = this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_produzione", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = api.getIdApi();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.saveErogazioneProduzioneAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, null));
    }
    
    @Test
    void testUpdateStatoAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_RICHIEDENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);

        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        UUID idAdesione = adesione.getBody().getIdAdesione();
        
        //creo il client per il collaudo
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);

        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);
        
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.cer");
        documento.setContent(pemCert);
        documento.setContentType("application/cert");
        
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
    	
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        
        adesioniController.saveClientCollaudoAdesione(idAdesione, PROFILO, adesioneIdClient, null);

        StatoUpdate stato = new StatoUpdate();
    	stato.setStato("richiesto_collaudo");
    	stato.setCommento("richiesta di collaudo");

        // Act
        ResponseEntity<Adesione> response = adesioniController.updateStatoAdesione(idAdesione, stato, null);
    	
        // Assert
    	assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("richiesto_collaudo", response.getBody().getStato());
    }
    
    @Test
    void testUpdateStatoAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        StatoUpdate statoUpdate = new StatoUpdate();
        statoUpdate.setStato("NUOVO_STATO");

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.updateStatoAdesione(adesione.getIdAdesione(), statoUpdate, null));
    }
    
    @Test
    void testDeleteMessaggioAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test");
        messaggioCreate.setTesto("Testo del Messaggio");
        ResponseEntity<ItemMessaggio> messaggio = adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);

        // Act
        ResponseEntity<Void> response = adesioniController.deleteMessaggioAdesione(adesione.getIdAdesione(), messaggio.getBody().getIdMessaggio());

        // Assert
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }
    
    @Test
    void testDeleteMessaggioAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test");
        messaggioCreate.setTesto("Testo del Messaggio");
        ResponseEntity<ItemMessaggio> messaggio = adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.deleteMessaggioAdesione(adesione.getIdAdesione(), messaggio.getBody().getIdMessaggio()));
    }
    
    @Test
    void testDeleteMessaggioAdesioneNotFound() {
        // Setup
        UUID randomIdAdesione = UUID.randomUUID();
        UUID randomIdMessaggio = UUID.randomUUID();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.deleteMessaggioAdesione(randomIdAdesione, randomIdMessaggio));
    }
    
    @Test
    void testUpdateMessaggioAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test");
        messaggioCreate.setTesto("Testo del Messaggio");
        ResponseEntity<ItemMessaggio> messaggio = adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);

        MessaggioUpdate messaggioUpdate = new MessaggioUpdate();
        messaggioUpdate.setOggetto("Oggetto Aggiornato");
        messaggioUpdate.setTesto("Testo Aggiornato");

        // Act
        ResponseEntity<ItemMessaggio> response = adesioniController.updateMessaggioAdesione(adesione.getIdAdesione(), messaggio.getBody().getIdMessaggio(), messaggioUpdate);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Oggetto Aggiornato", response.getBody().getOggetto());
    }
    
    @Test
    void testUpdateMessaggioAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        MessaggioCreate messaggioCreate = new MessaggioCreate();
        messaggioCreate.setOggetto("Oggetto di Test");
        messaggioCreate.setTesto("Testo del Messaggio");
        ResponseEntity<ItemMessaggio> messaggio = adesioniController.createMessaggioAdesione(adesione.getIdAdesione(), messaggioCreate);

        MessaggioUpdate messaggioUpdate = new MessaggioUpdate();
        messaggioUpdate.setOggetto("Oggetto Aggiornato");
        messaggioUpdate.setTesto("Testo Aggiornato");

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.updateMessaggioAdesione(
            adesione.getIdAdesione(), messaggio.getBody().getIdMessaggio(), messaggioUpdate));
    }
    
    @Test
    void testUpdateMessaggioAdesioneNotFound() {
        // Setup
        UUID randomIdAdesione = UUID.randomUUID();
        UUID randomIdMessaggio = UUID.randomUUID();

        MessaggioUpdate messaggioUpdate = new MessaggioUpdate();
        messaggioUpdate.setOggetto("Oggetto Aggiornato");
        messaggioUpdate.setTesto("Testo Aggiornato");

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.updateMessaggioAdesione(
            randomIdAdesione, randomIdMessaggio, messaggioUpdate));
    }
    
    @Test
    void testDownloadClientCProduzioneAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_produzione", serviziController, servizio.getIdServizio());
        
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_RICHIEDENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);

        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        UUID idAdesione = adesione.getBody().getIdAdesione();
        
        //creo il client per il collaudo
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.PRODUZIONE);

        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);
        
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.cer");
        documento.setContent(pemCert);
        documento.setContentType("application/cert");
        
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
    	
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        //System.out.println(clientResponse.getBody());
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        
        adesioniController.saveClientProduzioneAdesione(idAdesione, PROFILO, adesioneIdClient, null);

        DatiSpecificiClient datiSpecificiClient = clientResponse.getBody().getDatiSpecifici();
        
        AuthTypeHttps val = (AuthTypeHttps) datiSpecificiClient;
        CertificatoClientFornito certificatoClientFornito = (CertificatoClientFornito) val.getCertificatoAutenticazione();
        
        UUID idAllegato = certificatoClientFornito.getCertificato().getUuid();
        
        // Act
        ResponseEntity<Resource> response = adesioniController.downloadClientCProduzioneAdesione(adesione.getBody().getIdAdesione(), idAllegato);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("attachment; filename=certificato.cer", response.getHeaders().getFirst("Content-Disposition"));
    }
	
    @Test
    void testDownloadClientCProduzioneAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_produzione", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        UUID idAllegato = UUID.randomUUID();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.downloadClientCProduzioneAdesione(adesione.getIdAdesione(), idAllegato));
    }

    @Test
    void testDownloadClientCProduzioneAdesioneNotFound() {
        // Setup
        UUID randomIdAdesione = UUID.randomUUID();
        UUID randomIdAllegato = UUID.randomUUID();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.downloadClientCProduzioneAdesione(randomIdAdesione, randomIdAllegato));
    }
    
    @Test
    void testDeleteClientCollaudoAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_RICHIEDENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);

        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        UUID idAdesione = adesione.getBody().getIdAdesione();
        
        //creo il client per il collaudo
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);

        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);
        
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.cer");
        documento.setContent(pemCert);
        documento.setContentType("application/cert");
        
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
    	
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        
        adesioniController.saveClientCollaudoAdesione(idAdesione, PROFILO, adesioneIdClient, null);

        // Act
        ResponseEntity<Adesione> response = adesioniController.deleteClientCollaudoAdesione(idAdesione, PROFILO, null); //TODO lamantia

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testDeleteClientCollaudoAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        String profilo = PROFILO;

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.deleteClientCollaudoAdesione(adesione.getIdAdesione(), profilo, null)); //TODO lamantia
    }

    @Test
    void testDeleteClientCollaudoAdesioneNotFound() {
        // Setup
        UUID randomIdAdesione = UUID.randomUUID();
        String profilo = "ProfiloNonEsistente";

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.deleteClientCollaudoAdesione(randomIdAdesione, profilo, null)); //TODO lamantia
    }
    
    @Test
    void testDeleteClientProduzioneAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_produzione", serviziController, servizio.getIdServizio());
        
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_RICHIEDENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);

        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        UUID idAdesione = adesione.getBody().getIdAdesione();
        
        //creo il client per la produzione
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.PRODUZIONE);

        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);
        
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.cer");
        documento.setContent(pemCert);
        documento.setContentType("application/cert");
        
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
    	
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        
        adesioniController.saveClientProduzioneAdesione(idAdesione, PROFILO, adesioneIdClient, null);

        String profilo = PROFILO;

        // Act
        ResponseEntity<Adesione> response = adesioniController.deleteClientProduzioneAdesione(idAdesione, profilo, null); //TODO lamantia

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testDeleteClientProduzioneAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_produzione", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        String profilo = PROFILO;

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.deleteClientProduzioneAdesione(adesione.getIdAdesione(), profilo, null)); //TODO lamantia
    }

    @Test
    void testDeleteClientProduzioneAdesioneNotFound() {
        // Setup
        UUID randomIdAdesione = UUID.randomUUID();
        String profilo = "ProfiloNonEsistente";

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.deleteClientProduzioneAdesione(randomIdAdesione, profilo, null)); //TODO lamantia
    }
    
    @Test
    void testListConfigurazioniCollaudoAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        
        //per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, servizio.getIdServizio());

        Adesione adesione = this.getAdesione();

        // Act
        ResponseEntity<PagedModelItemConfigurazioneAdesione> response = adesioniController.listConfigurazioniCollaudoAdesione(adesione.getIdAdesione());

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testListConfigurazioniCollaudoAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        //per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
        Adesione adesione = this.getAdesione();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.listConfigurazioniCollaudoAdesione(adesione.getIdAdesione()));
    }

    @Test
    void testListConfigurazioniProduzioneAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        
        //per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
        
        Adesione adesione = this.getAdesione();

        // Act
        ResponseEntity<PagedModelItemConfigurazioneAdesione> response = adesioniController.listConfigurazioniProduzioneAdesione(adesione.getIdAdesione());

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testListConfigurazioniProduzioneAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
      //per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
        Adesione adesione = this.getAdesione();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.listConfigurazioniProduzioneAdesione(adesione.getIdAdesione()));
    }

    @Test
    void testSaveConfigurazioneCustomCollaudoAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        
        //per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
        
    	Adesione adesione = this.getAdesione();

        DatiCustomAdesioneUpdate datiCustomUpdate = new DatiCustomAdesioneUpdate();

        // Act
        ResponseEntity<Adesione> response = adesioniController.saveConfigurazioneCustomCollaudoAdesione(adesione.getIdAdesione(), datiCustomUpdate, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testSaveConfigurazioneCustomCollaudoAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        //per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
        Adesione adesione = this.getAdesione();

        DatiCustomAdesioneUpdate datiCustomUpdate = new DatiCustomAdesioneUpdate();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.saveConfigurazioneCustomCollaudoAdesione(adesione.getIdAdesione(), datiCustomUpdate, null));
    }

    @Test
    void testSaveConfigurazioneCustomCollaudoAdesioneNotFound() {
        // Setup
        UUID randomIdAdesione = UUID.randomUUID();

        DatiCustomAdesioneUpdate datiCustomUpdate = new DatiCustomAdesioneUpdate();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.saveConfigurazioneCustomCollaudoAdesione(randomIdAdesione, datiCustomUpdate, null));
    }
    
    @Test
    void testSaveConfigurazioneCustomProduzioneAdesioneSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        //per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
        Adesione adesione = this.getAdesione();

        DatiCustomAdesioneUpdate datiCustomUpdate = new DatiCustomAdesioneUpdate();

        // Act
        ResponseEntity<Adesione> response = adesioniController.saveConfigurazioneCustomProduzioneAdesione(adesione.getIdAdesione(), datiCustomUpdate, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testSaveConfigurazioneCustomProduzioneAdesioneUnauthorized() {
        // Setup
        Dominio dominio = this.getDominio(null);
        this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        
        //per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
        
        Adesione adesione = this.getAdesione();

        DatiCustomAdesioneUpdate datiCustomUpdate = new DatiCustomAdesioneUpdate();

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.saveConfigurazioneCustomProduzioneAdesione(adesione.getIdAdesione(), datiCustomUpdate, null));
    }

    @Test
    void testSaveConfigurazioneCustomProduzioneAdesioneNotFound() {
        // Setup
        UUID randomIdAdesione = UUID.randomUUID();

        DatiCustomAdesioneUpdate datiCustomUpdate = new DatiCustomAdesioneUpdate();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.saveConfigurazioneCustomProduzioneAdesione(randomIdAdesione, datiCustomUpdate, null));
    }

    /*
     * Caso d'uso per force update:
 
		1) si parte con un servizio con una singola API con un profilo (es. MTLS), si manda il servizio in configurato in collaudo (in_configurazione_collaudo?)
		2) si crea una adesione per quel servizio, si configura il client per il profilo indicato dalla API (es. MTLS), si manda l'adesione in configurata in collaudo
		3) si aggiunge un'altra API, con un diverso profilo (es. PDND) al servizio
		 
		In questo momento l'adesione si trova configurata in collaudo ma, essendo stato aggiunto un altro profilo, non è completamente configurata. Si trova quindi in uno stato di inconsistenza in cui tutte le operazioni di scrittura (ad eccezione di quella che risolverebbe l'inconsistenza) falliscono a causa di un errore di validazione.
		 
		4) verificare che qualsiasi operazione (update adesione, add/delete referenti, add / delete di client, erogazioni, configurazioni) su quella adesione fallisca con errore di validazione
		5) verificare che le stesse operazioni, richiamate col parametro force impostato a true, abbiano successo
		6) configurare il client PDND per l'adesione
		7) verificare che le operazioni ora vadano di nuovo a buon fine anche senza il force=true
		 
		8) ripetere il processo dal punto 1 per la produzione
     */
    private API apiV = null;
    //Punti 1), 2), 3)
    private Adesione getAPICasoUsoForceUpdate() {
    	// 1) creo il servizio con singola API e lo mando nello stato pubblicato in collaudo
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        apiV = this.getAPIFull();
        CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, servizio.getIdServizio());
        
        // 2) creo l'adesione a quel servizio e la mando nello stato pubblicato in collaudo
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), STATO_PUBBLICATO_IN_COLLAUDO);
        
        // 3) aggiungo un'altra api con diverso profilo al servizio
        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setNome("API 2");
        apiCreate.setIdServizio(idServizio);
        apiCreate.setRuolo(RuoloAPIEnum.DOMINIO);
        APIDatiAmbienteCreate apiDatiAmbienteCreate = new APIDatiAmbienteCreate();
        apiDatiAmbienteCreate.setProtocollo(ProtocolloEnum.REST);
        DocumentoCreate documentoOpenAPI = new DocumentoCreate();
        documentoOpenAPI.setContentType("application/yaml");
        documentoOpenAPI.setContent(Base64.encodeBase64String(CommonUtils.openApiSpec.getBytes()));
        documentoOpenAPI.setFilename("openapi.yaml");
        apiDatiAmbienteCreate.setSpecifica(documentoOpenAPI);
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

        authType.setProfilo("INTERNO_HTTPS");
        
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
        ResponseEntity<API> api = apiController.createApi(apiCreate);
        return adesione.getBody();
    }
    
    // inizio con il punto 4) verificare che qualsiasi operazione (update adesione, add/delete referenti, add / delete di client, erogazioni, configurazioni) su quella adesione fallisca con errore di validazione
    
    @Test
    void testCasoUsoForceUpdate_UpdateAdesioneErrore() {
    	Adesione adesione = this.getAPICasoUsoForceUpdate();

        AdesioneUpdate adesioneUpdate = new AdesioneUpdate();

        assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.updateAdesione(adesione.getIdAdesione(), adesioneUpdate, null));

    }
    
    @Test
    void testCasoUsoForceUpdateCreateReferenteAdesioneErrore() {
    	Adesione adesione = this.getAPICasoUsoForceUpdate();
    	
    	UtenteCreate nuovoUtente = CommonUtils.getUtenteCreate();
    	nuovoUtente.setPrincipal(UTENTE_REFERENTE_TECNICO_ADESIONE+2);
    	
    	utentiController.createUtente(nuovoUtente);
    	
    	ReferenteCreate referenteNew = new ReferenteCreate();
    	referenteNew.setIdUtente(UUID.randomUUID());
    	referenteNew.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.createReferenteAdesione(adesione.getIdAdesione(), referenteNew, null));
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteReferenteAdesioneErrore() {
    	Adesione adesione = this.getAPICasoUsoForceUpdate();
    	
    	ReferenteCreate referenteNew = new ReferenteCreate();
    	referenteNew.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
    	referenteNew.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.deleteReferenteAdesione(adesione.getIdAdesione(), ID_UTENTE_REFERENTE_TECNICO_ADESIONE, TipoReferenteEnum.REFERENTE_TECNICO, null));
    }
    
    private Adesione adesione;
    private AdesioneIdClient adesioneIdClient;
    private UUID idClient;
    private ClientCreate clientCreate;
    private AuthTypeHttpsCreate dati;
    private CertificatoClientFornitoCreate certificato;
    private DocumentoUpdateNew documento;
    private ResponseEntity<Client> clientResponse;
    
    private void inizializzaTest() {
    	adesione = this.getAPICasoUsoForceUpdate();
    	
    	//creo il client per il collaudo
        clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest2");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);

        dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);
        
        certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        
        documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem");
        documento.setContent(pemCert);

        documento.setContentType("application/x-pem-file");
        
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
    	
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        
        clientResponse = clientController.createClient(clientCreate);
        idClient = clientResponse.getBody().getIdClient();
        
        adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
    }
    
    @Test
    void testCasoUsoForceUpdateSaveClientCollaudoAdesioneErrore() {
    	this.inizializzaTest();
        
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.saveClientCollaudoAdesione(adesione.getIdAdesione(), PROFILO, adesioneIdClient, null));
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteClientCollaudoAdesioneErrore() {
    	this.inizializzaTest();
        
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.deleteClientCollaudoAdesione(adesione.getIdAdesione(), PROFILO, null));
    }
    
    @Test
    void testCasoUsoForceUpdateSaveErogazioneCollaudoAdesioneErrore() {
    	this.inizializzaTest();

        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = apiV.getIdApi();
        
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.saveErogazioneCollaudoAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, null));
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteErogazioneCollaudoAdesioneErrore() {
    	this.inizializzaTest();

        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = apiV.getIdApi();
        adesioniController.saveErogazioneCollaudoAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, true);
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.deleteErogazioneCollaudoAdesione(adesione.getIdAdesione(), idErogazione, null));
    }
    
    @Test
    void testCasoUsoForceUpdateSaveConfigurazioneCustomCollaudoAdesioneErrore() {
    	this.inizializzaTest();

        DatiCustomAdesioneUpdate datiCustom = new DatiCustomAdesioneUpdate();
        
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.saveConfigurazioneCustomCollaudoAdesione(adesione.getIdAdesione(), datiCustom, null));
    }
    
    // 8) ripetere il processo dal punto 1 per la produzione
    
    private void inizializzaTestCasoProduzione() {
    	//creo il client per la produzione
        clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.PRODUZIONE);

        dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);
        
        certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        
        documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.cer");
        documento.setContent(pemCert);
        documento.setContentType("application/cert");
        
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
    	
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
            
        clientResponse = clientController.createClient(clientCreate);
        idClient = clientResponse.getBody().getIdClient();
        
        adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
    }
    
    @Test
    void testCasoUsoForceUpdateSaveClientProduzioneAdesioneErrore() {
    	this.inizializzaTest();
        
        this.inizializzaTestCasoProduzione();
        
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.saveClientProduzioneAdesione(adesione.getIdAdesione(), PROFILO, adesioneIdClient, null));
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteClientProduzioneAdesioneErrore() {
    	this.inizializzaTest();

    	this.inizializzaTestCasoProduzione();
               
    	adesioniController.saveClientProduzioneAdesione(adesione.getIdAdesione(), PROFILO, adesioneIdClient, true);
        
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.deleteClientProduzioneAdesione(adesione.getIdAdesione(), PROFILO, null));
    }
    
    @Test
    void testCasoUsoForceUpdateSaveErogazioneProduzioneAdesioneErrore() {
    	this.inizializzaTest();
        
    	this.inizializzaTestCasoProduzione();
    	
        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = apiV.getIdApi();
        
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.saveErogazioneProduzioneAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, null));
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteErogazioneProduzioneAdesioneErrore() {
    	this.inizializzaTest();
        
    	this.inizializzaTestCasoProduzione();
    	
        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = apiV.getIdApi();
        adesioniController.saveErogazioneProduzioneAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, true);
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.deleteErogazioneProduzioneAdesione(adesione.getIdAdesione(), idErogazione, null));
    }
    
    @Test
    void testCasoUsoForceUpdatesaveConfigurazioneCustomProduzioneAdesioneErrore() {
    	this.inizializzaTest();
        
    	this.inizializzaTestCasoProduzione();
    	
        DatiCustomAdesioneUpdate datiCustom = new DatiCustomAdesioneUpdate();
        
    	assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class, () -> adesioniController.saveConfigurazioneCustomProduzioneAdesione(adesione.getIdAdesione(), datiCustom, null));
    }
    
    //punto 5) verificare che le stesse operazioni, richiamate col parametro force impostato a true, abbiano successo
    @Test
    void testCasoUsoForceUpdate_UpdateAdesione() {
    	Adesione adesione = this.getAPICasoUsoForceUpdate();

        AdesioneUpdate adesioneUpdate = new AdesioneUpdate();

        adesioniController.updateAdesione(adesione.getIdAdesione(), adesioneUpdate, true);

    }
    
    @Test
    void testCasoUsoForceUpdateCreateReferenteAdesione() {
    	Adesione adesione = this.getAPICasoUsoForceUpdate();
    	
    	UtenteCreate nuovoUtente = CommonUtils.getUtenteCreate();
    	nuovoUtente.setPrincipal(UTENTE_REFERENTE_TECNICO_ADESIONE+2);
    	
    	utentiController.createUtente(nuovoUtente);
    	
    	InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO_ADESIONE+2, utenteService);
    	
    	ReferenteCreate referenteNew = new ReferenteCreate();
    	referenteNew.setIdUtente(info.utente.getIdUtente());
    	referenteNew.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
    	adesioniController.createReferenteAdesione(adesione.getIdAdesione(), referenteNew, true);
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteReferenteAdesione() {
    	Adesione adesione = this.getAPICasoUsoForceUpdate();
    	
    	ReferenteCreate referenteNew = new ReferenteCreate();
    	referenteNew.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
    	referenteNew.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
    	adesioniController.deleteReferenteAdesione(adesione.getIdAdesione(), ID_UTENTE_REFERENTE_TECNICO_ADESIONE, TipoReferenteEnum.REFERENTE_TECNICO, true);
    }
    
    @Test
    void testCasoUsoForceUpdateSaveClientCollaudoAdesione() {
    	this.inizializzaTest();
        
    	adesioniController.saveClientCollaudoAdesione(adesione.getIdAdesione(), PROFILO, adesioneIdClient, true);
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteClientCollaudoAdesione() {
    	this.inizializzaTest();
        
    	adesioniController.deleteClientCollaudoAdesione(adesione.getIdAdesione(), PROFILO, true);
    }
    
    @Test
    void testCasoUsoForceUpdateSaveErogazioneCollaudoAdesione() {
    	this.inizializzaTest();

        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = apiV.getIdApi();
        
    	adesioniController.saveErogazioneCollaudoAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, true);
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteErogazioneCollaudoAdesione() {
    	this.inizializzaTest();

        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = apiV.getIdApi();
        adesioniController.saveErogazioneCollaudoAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, true);
    	adesioniController.deleteErogazioneCollaudoAdesione(adesione.getIdAdesione(), idErogazione, true);
    }
    
    @Test
    void testCasoUsoForceUpdateSaveConfigurazioneCustomCollaudoAdesione() {
    	this.inizializzaTest();

        DatiCustomAdesioneUpdate datiCustom = new DatiCustomAdesioneUpdate();
        
    	adesioniController.saveConfigurazioneCustomCollaudoAdesione(adesione.getIdAdesione(), datiCustom, true);
    }
    
    // 8) ripetere il processo dal punto 1 per la produzione
    
    @Test
    void testCasoUsoForceUpdateSaveClientProduzioneAdesione() {
    	this.inizializzaTest();
        
    	this.inizializzaTestCasoProduzione();
        
    	adesioniController.saveClientProduzioneAdesione(adesione.getIdAdesione(), PROFILO, adesioneIdClient, true);
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteClientProduzioneAdesione() {
    	this.inizializzaTest();
        
    	this.inizializzaTestCasoProduzione();
        
    	adesioniController.saveClientProduzioneAdesione(adesione.getIdAdesione(), PROFILO, adesioneIdClient, true);
        
    	adesioniController.deleteClientProduzioneAdesione(adesione.getIdAdesione(), PROFILO, true);
    }
    
    @Test
    void testCasoUsoForceUpdateSaveErogazioneProduzioneAdesione() {
    	this.inizializzaTest();
        
    	this.inizializzaTestCasoProduzione();
    	
        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = apiV.getIdApi();
        
    	adesioniController.saveErogazioneProduzioneAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, true);
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteErogazioneProduzioneAdesione() {
    	this.inizializzaTest();
        
    	this.inizializzaTestCasoProduzione();
    	
        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = apiV.getIdApi();
        adesioniController.saveErogazioneProduzioneAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, true);
    	adesioniController.deleteErogazioneProduzioneAdesione(adesione.getIdAdesione(), idErogazione, true);
    }
    
    @Test
    void testCasoUsoForceUpdatesaveConfigurazioneCustomProduzioneAdesione() {
    	this.inizializzaTest();
        
    	this.inizializzaTestCasoProduzione();
    	
        DatiCustomAdesioneUpdate datiCustom = new DatiCustomAdesioneUpdate();
        
    	adesioniController.saveConfigurazioneCustomProduzioneAdesione(adesione.getIdAdesione(), datiCustom, true);
    }
    
    // 6) e 7) configurare il client PDND per l'adesione e verificare che le operazioni ora vadano di nuovo a buon fine anche senza il force=true
    
    private Adesione getAPICasoUsoForceUpdateConStessoProfilo() {
        Dominio dominio = this.getDominioFull(null);
        Servizio servizio = this.getServizioFull(dominio, VisibilitaServizioEnum.PUBBLICO);
        apiV = this.getAPIFull();
        CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, servizio.getIdServizio());

        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        listaReferenti.add(newReferente);
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);
        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);    
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem"); 
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        adesioniController.saveClientCollaudoAdesione(adesione.getBody().getIdAdesione(), PROFILO, adesioneIdClient, null);
        this.cambioStatoAdesioneFinoA(adesione.getBody().getIdAdesione(), STATO_PUBBLICATO_IN_COLLAUDO);

        APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setNome("API 2");
        apiCreate.setIdServizio(idServizio);
        apiCreate.setRuolo(RuoloAPIEnum.DOMINIO);
        APIDatiAmbienteCreate apiDatiAmbienteCreate = new APIDatiAmbienteCreate();
        apiDatiAmbienteCreate.setProtocollo(ProtocolloEnum.REST);
        DocumentoCreate documentoOpenAPI = new DocumentoCreate();
        documentoOpenAPI.setContentType("application/yaml");
        documentoOpenAPI.setContent(Base64.encodeBase64String(CommonUtils.openApiSpec.getBytes()));
        documentoOpenAPI.setFilename("openapi.yaml");
        apiDatiAmbienteCreate.setSpecifica(documentoOpenAPI);
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

        authType.setProfilo(PROFILO);
        
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
        ResponseEntity<API> api = apiController.createApi(apiCreate);
        return adesione.getBody();
    }
    
    @Test
    void testCasoUsoForceUpdate_UpdateAdesioneConStessoProfilo() {
    	Adesione adesione = this.getAPICasoUsoForceUpdateConStessoProfilo();

        AdesioneUpdate adesioneUpdate = new AdesioneUpdate();

        adesioniController.updateAdesione(adesione.getIdAdesione(), adesioneUpdate, null);

    }
    
    @Test
    void testCasoUsoForceUpdateCreateReferenteAdesioneConStessoProfilo() {
    	Adesione adesione = this.getAPICasoUsoForceUpdateConStessoProfilo();
    	
    	UtenteCreate nuovoUtente = CommonUtils.getUtenteCreate();
    	nuovoUtente.setPrincipal(UTENTE_REFERENTE_TECNICO_ADESIONE+2);
    	
    	utentiController.createUtente(nuovoUtente);
    	
    	InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO_ADESIONE+2, utenteService);
    	
    	ReferenteCreate referenteNew = new ReferenteCreate();
    	referenteNew.setIdUtente(info.utente.getIdUtente());
    	referenteNew.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
    	adesioniController.createReferenteAdesione(adesione.getIdAdesione(), referenteNew, null);
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteReferenteAdesioneConStessoProfilo() {
    	Adesione adesione = this.getAPICasoUsoForceUpdateConStessoProfilo();
    	
    	ReferenteCreate referenteNew = new ReferenteCreate();
    	referenteNew.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_ADESIONE);
    	referenteNew.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
    	adesioniController.deleteReferenteAdesione(adesione.getIdAdesione(), ID_UTENTE_REFERENTE_TECNICO_ADESIONE, TipoReferenteEnum.REFERENTE_TECNICO, null);
    }
    
    private void inizializzaTestConStessoProfilo() {
    	adesione = this.getAPICasoUsoForceUpdateConStessoProfilo();
    	
    	//creo il client per il collaudo
        clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest2");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);

        dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);
        
        certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        
        documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem");
        documento.setContent(pemCert);

        documento.setContentType("application/x-pem-file");
        
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
    	
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        
        clientResponse = clientController.createClient(clientCreate);
        idClient = clientResponse.getBody().getIdClient();
        
        adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest2");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
    }
    
    @Test
    void testCasoUsoForceUpdateSaveClientCollaudoAdesioneConStessoProfilo() {
    	this.inizializzaTestConStessoProfilo();
        
    	adesioniController.saveClientCollaudoAdesione(adesione.getIdAdesione(), PROFILO, adesioneIdClient, null);
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteClientCollaudoAdesioneConStessoProfilo() {
    	this.inizializzaTestConStessoProfilo();
        
        adesioniController.saveClientCollaudoAdesione(adesione.getIdAdesione(), PROFILO, adesioneIdClient, null);
    	
    	try {	
        	adesioniController.deleteClientCollaudoAdesione(adesione.getIdAdesione(), PROFILO, true);
	    } catch (UpdateEntitaComplessaNonValidaSemanticamenteException e) {
	        List<EntitaComplessaError> errori = e.getErrori();
	        for (EntitaComplessaError errore : errori) {
	            System.out.println("Errore:");
	            System.out.println("Sottotipo: " + errore.getSottotipo());

	            // Se 'dato' è un oggetto complesso, puoi accedere ai suoi attributi se disponibili
	            ConfigurazioneClasseDato dato = errore.getDato();
	            if (dato != null) {
	                System.out.println("Dato: " + dato.getValue());
	            }

	            // Stampa i parametri se presenti
	            Map<String, String> params = errore.getParams();
	            if (params != null && !params.isEmpty()) {
	                System.out.println("Parametri:");
	                for (Map.Entry<String, String> entry : params.entrySet()) {
	                    System.out.println("  " + entry.getKey() + ": " + entry.getValue());
	                }
	            }

	            // Stampa i campi se presenti
	            List<Campo> campi = errore.getCampi();
	            if (campi != null && !campi.isEmpty()) {
	                System.out.println("Campi:");
	                for (Campo campo : campi) {
	                    System.out.println("  Nome Campo: " + campo.getNomeCampo());
	                }
	            }
	            System.out.println("-------------");
	        }
	        fail("Si è verificata un'eccezione: " + e.getMessage());
	    } catch (Exception e) {
	        e.printStackTrace();
	        fail("Si è verificata un'eccezione inattesa: " + e.getMessage());
	    }
    }
    
    @Test
    void testCasoUsoForceUpdateSaveErogazioneCollaudoAdesioneConStessoProfilo() {
    	this.inizializzaTestConStessoProfilo();

        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = apiV.getIdApi();
        
    	adesioniController.saveErogazioneCollaudoAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, null);
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteErogazioneCollaudoAdesioneConStessoProfilo() {
    	this.inizializzaTestConStessoProfilo();

        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = apiV.getIdApi();
        adesioniController.saveErogazioneCollaudoAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, true);
    	adesioniController.deleteErogazioneCollaudoAdesione(adesione.getIdAdesione(), idErogazione, null);
    }
    
    @Test
    void testCasoUsoForceUpdateSaveConfigurazioneCustomCollaudoAdesioneConStessoProfilo() {
    	this.inizializzaTestConStessoProfilo();

        DatiCustomAdesioneUpdate datiCustom = new DatiCustomAdesioneUpdate();
        
    	adesioniController.saveConfigurazioneCustomCollaudoAdesione(adesione.getIdAdesione(), datiCustom, null);
    }
    
    @Test
    void testCasoUsoForceUpdateSaveClientProduzioneAdesioneConStessoProfilo() {
    	this.inizializzaTestConStessoProfilo();
        
        this.inizializzaTestCasoProduzione();
        
    	adesioniController.saveClientProduzioneAdesione(adesione.getIdAdesione(), PROFILO, adesioneIdClient, null);
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteClientProduzioneAdesioneConStessoProfilo() {
    	this.inizializzaTestConStessoProfilo();

    	this.inizializzaTestCasoProduzione();
               
    	adesioniController.saveClientProduzioneAdesione(adesione.getIdAdesione(), PROFILO, adesioneIdClient, true);
        
    	adesioniController.deleteClientProduzioneAdesione(adesione.getIdAdesione(), PROFILO, null);
    }
    
    @Test
    void testCasoUsoForceUpdateSaveErogazioneProduzioneAdesioneConStessoProfilo() {
    	this.inizializzaTestConStessoProfilo();
        
    	this.inizializzaTestCasoProduzione();
    	
        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = apiV.getIdApi();
        
    	adesioniController.saveErogazioneProduzioneAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, null);
    }
    
    @Test
    void testCasoUsoForceUpdateDeleteErogazioneProduzioneAdesioneConStessoProfilo() {
    	this.inizializzaTestConStessoProfilo();
        
    	this.inizializzaTestCasoProduzione();
    	
        AdesioneErogazioneUpdate adesioneErogazioneUpdate = new AdesioneErogazioneUpdate();
        adesioneErogazioneUpdate.setUrl("http://urltest.com/");
        UUID idErogazione = apiV.getIdApi();
        adesioniController.saveErogazioneProduzioneAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate, true);
    	adesioniController.deleteErogazioneProduzioneAdesione(adesione.getIdAdesione(), idErogazione, null);
    }
    
    @Test
    void testCasoUsoForceUpdatesaveConfigurazioneCustomProduzioneAdesioneConStessoProfilo() {
    	this.inizializzaTestConStessoProfilo();
        
    	this.inizializzaTestCasoProduzione();
    	
        DatiCustomAdesioneUpdate datiCustom = new DatiCustomAdesioneUpdate();
        
    	adesioniController.saveConfigurazioneCustomProduzioneAdesione(adesione.getIdAdesione(), datiCustom, null);
    }
    
    private Servizio getServizioMultiAdesione(Dominio dominio, VisibilitaServizioEnum value) {
    	ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	if(value != null) {
    		servizioCreate.setVisibilita(value);
    	}
    	servizioCreate.setMultiAdesione(true);
    	servizioCreate.setIdSoggettoInterno(idSoggetto);

    	servizioCreate.setIdDominio(dominio.getIdDominio());

    	List<ReferenteCreate> referenti = new ArrayList<>();

    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	referente.setIdUtente(ID_UTENTE_GESTORE);
    	referenti.add(referente);

    	servizioCreate.setReferenti(referenti);

    	ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);

    	ServizioUpdate upServizio = new ServizioUpdate();
    	upServizio.setDatiGenerici(null);
    	upServizio.setIdentificativo(null);

    	Servizio servizio = createdServizio.getBody();

    	idServizio = servizio.getIdServizio();

    	return servizio;
   }
    
    private UUID creaNuovaAdesione(List<ReferenteCreate> listaReferenti, boolean firstTime) {
    	UUID result = null;
    	AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        nuovaAdesione.setIdLogico("a");
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        
        result = adesione.getBody().getIdAdesione();
        if(firstTime) {
        //creo il client per il collaudo
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);

        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);
        
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.cer");
        documento.setContent(pemCert);
        documento.setContentType("application/cert");
        
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
    	
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        }
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        
        adesioniController.saveClientCollaudoAdesione(result, PROFILO, adesioneIdClient, null);

    	return result;
    }
    
    @Test
    void testUpdateStatoAdesioniSuccess() {
        // Setup
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizioMultiAdesione(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(ID_UTENTE_RICHIEDENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);

        UUID idAdesione = this.creaNuovaAdesione(listaReferenti,true);
        UUID idAdesione2 = this.creaNuovaAdesione(listaReferenti,false);
        UUID idAdesione3 = this.creaNuovaAdesione(listaReferenti,false);
        UUID idAdesione4 = this.creaNuovaAdesione(listaReferenti,false);
        UUID idAdesione5 = this.creaNuovaAdesione(listaReferenti,false);
        UUID idAdesione6 = this.creaNuovaAdesione(listaReferenti,false);
        
        StatoUpdate stato = new StatoUpdate();
    	stato.setStato("richiesto_collaudo");
    	stato.setCommento("richiesta di collaudo");

    	List<UUID> ids = new ArrayList<UUID>();
    	ids.add(idAdesione);
    	ids.add(idAdesione2);
    	ids.add(idAdesione3);
    	ids.add(idAdesione4);
    	ids.add(idAdesione5);
    	ids.add(idAdesione6);
    	/*
        // Act
        ResponseEntity<AdesioniCambioStatoResponse> response = adesioniController.updateStatoAdesioni(stato,
    			null, null, null, null,
    			null, null, null,
    			null, null, null,
    			ids, null,
    			0, 10, null);
    	
        // Assert
    	assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        //assertEquals("richiesto_collaudo", response.getBody().getStato());
         */
    }
     
}
