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
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.codec.binary.Base64;
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
import org.govway.catalogo.servlets.model.API;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.Adesione;
import org.govway.catalogo.servlets.model.AdesioneClientUpdate;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.AdesioneErogazioneUpdate;
import org.govway.catalogo.servlets.model.AdesioneIdClient;
import org.govway.catalogo.servlets.model.AdesioneUpdate;
import org.govway.catalogo.servlets.model.AllegatoMessaggio;
import org.govway.catalogo.servlets.model.AllegatoMessaggioCreate;
import org.govway.catalogo.servlets.model.AmbienteEnum;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.AuthTypeApiResourceProprietaCustom;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.AuthTypeHttps;
import org.govway.catalogo.servlets.model.AuthTypeHttpsCreate;
import org.govway.catalogo.servlets.model.CertificatoClientFornito;
import org.govway.catalogo.servlets.model.CertificatoClientFornitoCreate;
import org.govway.catalogo.servlets.model.Client;
import org.govway.catalogo.servlets.model.ClientCreate;
import org.govway.catalogo.servlets.model.DatiCustomAdesioneUpdate;
import org.govway.catalogo.servlets.model.DatiSpecificiClient;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.DocumentoUpdateNew;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
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
    private static final String PROFILO = "MODI_P1";
    
    private UUID idSoggetto;
    private UUID idServizio;
    private UUID idOrganizzazione;

    @BeforeEach
    public void setUp() {
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
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }
    
    public Dominio getDominio(VisibilitaDominioEnum value) {
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
    
    public Servizio getServizio(Dominio dominio, VisibilitaServizioEnum value) {
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
         
         servizioCreate.setReferenti(referenti);

         ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
         
         ServizioUpdate upServizio = new ServizioUpdate();
         upServizio.setDatiGenerici(null);
         upServizio.setIdentificativo(null);
         
         Servizio servizio = createdServizio.getBody();

         idServizio = servizio.getIdServizio();
         
         return servizio;
    }
    
    public API getAPI() {
    	APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(idServizio);
        apiCreate.setRuolo(RuoloAPIEnum.DOMINIO);
        
        APIDatiAmbienteCreate apiDatiAmbienteCreate = new APIDatiAmbienteCreate();
        apiDatiAmbienteCreate.setProtocollo(ProtocolloEnum.REST);
        
        DocumentoCreate documento = new DocumentoCreate();
        documento.setContentType("application/pdf");
        documento.setContent(Base64.encodeBase64String("contenuto".getBytes()));
        documento.setFilename("allegato_modificato.pdf");
        
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
    
    public Adesione getAdesione() {
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
        upUtente.setUsername(UTENTE_RICHIEDENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_adesione");

        utentiController.updateUtente(UTENTE_RICHIEDENTE_ADESIONE, upUtente);
    	
    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setIdUtente(UTENTE_RICHIEDENTE_ADESIONE);
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	
    	ResponseEntity<Referente> response = adesioniController.createReferenteAdesione(adesione.getIdAdesione(), referente);
    	
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
        upUtente.setUsername(UTENTE_RICHIEDENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_adesione");

        utentiController.updateUtente(UTENTE_RICHIEDENTE_ADESIONE, upUtente);
    	
    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setIdUtente(UTENTE_RICHIEDENTE_ADESIONE);
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	
    	CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, () -> {
    		adesioniController.createReferenteAdesione(adesione.getIdAdesione(), referente);
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
        upUtente.setUsername(UTENTE_RICHIEDENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_adesione");

        utentiController.updateUtente(UTENTE_RICHIEDENTE_ADESIONE, upUtente);
    	
    	ReferenteCreate referente = new ReferenteCreate();
    	referente.setIdUtente(UTENTE_RICHIEDENTE_ADESIONE);
    	referente.setTipo(TipoReferenteEnum.REFERENTE);
    	
    	this.tearDown();    	
    	
    	assertThrows(NotAuthorizedException.class, () -> {
    		adesioniController.createReferenteAdesione(adesione.getIdAdesione(), referente);
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
        upUtente.setUsername(UTENTE_RICHIEDENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_adesione");

        utentiController.updateUtente(UTENTE_RICHIEDENTE_ADESIONE, upUtente);
        
        ReferenteCreate referente = new ReferenteCreate();
        referente.setIdUtente(UTENTE_RICHIEDENTE_ADESIONE);
        referente.setTipo(TipoReferenteEnum.REFERENTE);
        adesioniController.createReferenteAdesione(adesione.getIdAdesione(), referente);

        // Act
        ResponseEntity<Void> response = adesioniController.deleteReferenteAdesione(
            adesione.getIdAdesione(), UTENTE_RICHIEDENTE_ADESIONE, TipoReferenteEnum.REFERENTE);

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
        upUtente.setUsername(UTENTE_RICHIEDENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_adesione");

        utentiController.updateUtente(UTENTE_RICHIEDENTE_ADESIONE, upUtente);
        
        ReferenteCreate referente = new ReferenteCreate();
        referente.setIdUtente(UTENTE_RICHIEDENTE_ADESIONE);
        referente.setTipo(TipoReferenteEnum.REFERENTE);
        adesioniController.createReferenteAdesione(adesione.getIdAdesione(), referente);

        // Cambio utente per testare unauthorized
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Act & Assert
        assertThrows(NotAuthorizedException.class, () -> adesioniController.deleteReferenteAdesione(
            adesione.getIdAdesione(), UTENTE_RICHIEDENTE_ADESIONE, TipoReferenteEnum.REFERENTE));
    }
    
    @Test
    void testDeleteReferenteAdesioneNotFound() {
        // Setup
        UUID randomId = UUID.randomUUID();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.deleteReferenteAdesione(
            randomId, "utente_non_esistente", TipoReferenteEnum.REFERENTE));
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
        Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        Adesione adesione = this.getAdesione();

        // Act
        ResponseEntity<Resource> response = adesioniController.exportAdesione(adesione.getIdAdesione());

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getHeaders().getContentDisposition().getFilename().contains("adesione-" + adesione.getIdAdesione()));
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
            null, null, null, null, false, null, 0, 10, null);

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
                null, null, null, null, false, null, 0, 10, sort);

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
                null, null, null, null, false, null, 0, 10, sort);

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
                null, null, null, null, false, null, 0, 10, sort);

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
                    null, null, null, null, false, null, n, numeroElementiPerPagina, null);

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
                null, null, null, null, false, null, 0, 10, null));
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
        newReferente.setIdUtente(UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setUsername(UTENTE_GESTORE+2);
        utenteCreate.setIdOrganizzazione(idOrganizzazione);
        utentiController.createUtente(utenteCreate);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_GESTORE+2);
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
        assertTrue(referente.stream().anyMatch(s -> s.getUtente().getUsername().equals(UTENTE_GESTORE)));
        assertEquals(UTENTE_GESTORE+2, referente.get(0).getUtente().getUsername());
    }
    
    @Test
    void testListReferentiAdesioneSortedNameAsc() {
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setUsername(UTENTE_GESTORE+2);
        utenteCreate.setIdOrganizzazione(idOrganizzazione);
        utentiController.createUtente(utenteCreate);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_GESTORE+2);
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
        assertTrue(referente.stream().anyMatch(s -> s.getUtente().getUsername().equals(UTENTE_GESTORE+2)));
        assertEquals(UTENTE_GESTORE, referente.get(0).getUtente().getUsername());
    }
    
    @Test
    void testListReferentiAdesioneMultiSorted() {
    	Dominio dominio = this.getDominio(null);
        Servizio servizio = this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
        this.getAPI();
        CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, servizio.getIdServizio());
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        utenteCreate.setUsername(UTENTE_GESTORE+2);
        utenteCreate.setIdOrganizzazione(idOrganizzazione);
        utentiController.createUtente(utenteCreate);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_GESTORE+2);
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
        assertTrue(referente.stream().anyMatch(s -> s.getUtente().getUsername().equals(UTENTE_GESTORE+2)));
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
        newReferente.setIdUtente(UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        for(int num = 0; num < numeroTotaleDiElementi; num++) {
        	UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
            utenteCreate.setUsername(UTENTE_GESTORE+num);
            utenteCreate.setIdOrganizzazione(idOrganizzazione);
            utentiController.createUtente(utenteCreate);
        	
        	newReferente = new ReferenteCreate();
            newReferente.setIdUtente(UTENTE_GESTORE+num);
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
        ResponseEntity<Adesione> response = adesioniController.updateAdesione(adesione.getIdAdesione(), adesioneUpdate);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
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
        assertThrows(NotAuthorizedException.class, () -> adesioniController.updateAdesione(adesione.getIdAdesione(), adesioneUpdate));
    }
    
    @Test
    void testUpdateAdesioneNotFound() {
        // Setup
        UUID randomId = UUID.randomUUID();
        AdesioneUpdate adesioneUpdate = new AdesioneUpdate();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.updateAdesione(randomId, adesioneUpdate));
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
        newReferente.setIdUtente(UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_RICHIEDENTE_ADESIONE);
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
        documento.setContent(Base64.encodeBase64String("certificato test".getBytes()));
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
        
        adesioniController.saveClientCollaudoAdesione(idAdesione, "MODI_P1", adesioneIdClient);
        
        // Act
        ResponseEntity<Adesione> response = adesioniController.saveClientCollaudoAdesione(idAdesione, PROFILO, adesioneIdClient);

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
        assertThrows(NotAuthorizedException.class, () -> adesioniController.saveClientCollaudoAdesione(adesione.getIdAdesione(), "ProfiloTest", adesioneClientUpdate));
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
        ResponseEntity<Adesione> response = adesioniController.saveErogazioneCollaudoAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate);

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
        assertThrows(NotAuthorizedException.class, () -> adesioniController.saveErogazioneCollaudoAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate));
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
        ResponseEntity<Adesione> response = adesioniController.saveErogazioneProduzioneAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate);

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
        assertThrows(NotAuthorizedException.class, () -> adesioniController.saveErogazioneProduzioneAdesione(adesione.getIdAdesione(), idErogazione, adesioneErogazioneUpdate));
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
        newReferente.setIdUtente(UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_RICHIEDENTE_ADESIONE);
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
        documento.setContent(Base64.encodeBase64String("certificato test".getBytes()));
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
        
        adesioniController.saveClientCollaudoAdesione(idAdesione, "MODI_P1", adesioneIdClient);

        StatoUpdate stato = new StatoUpdate();
    	stato.setStato("richiesto_collaudo");
    	stato.setCommento("richiesta di collaudo");

        // Act
        ResponseEntity<Adesione> response = adesioniController.updateStatoAdesione(idAdesione, stato);
    	
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
        assertThrows(NotAuthorizedException.class, () -> adesioniController.updateStatoAdesione(adesione.getIdAdesione(), statoUpdate));
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
        newReferente.setIdUtente(UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_RICHIEDENTE_ADESIONE);
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
        documento.setContent(Base64.encodeBase64String("certificato test".getBytes()));
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
        
        adesioniController.saveClientProduzioneAdesione(idAdesione, "MODI_P1", adesioneIdClient);
        /*
        MessaggioCreate msg = new MessaggioCreate();
        msg.setOggetto("test di prova");
        msg.setTesto("questo e' un test di prova");
        ResponseEntity<ItemMessaggio> messaggio = adesioniController.createMessaggioAdesione(adesione.getBody().getIdAdesione(), msg);
        
        AllegatoMessaggioCreate allegatoMessaggio = new AllegatoMessaggioCreate();
        allegatoMessaggio.setDescrizione("file di prova");
        allegatoMessaggio.setFilename("fileprova.pdf");
        allegatoMessaggio.setContent(Base64.encodeBase64String("certificato test".getBytes()));
        allegatoMessaggio.setContentType("application/pdf");
        ResponseEntity<AllegatoMessaggio> allegato = adesioniController.createAllegatoMessaggioAdesione(adesione.getBody().getIdAdesione(), messaggio.getBody().getIdMessaggio(), allegatoMessaggio);
        */
        //UUID idAllegato = UUID.fromString(allegato.getBody().getUuid());
        DatiSpecificiClient datiSpecificiClient = clientResponse.getBody().getDatiSpecifici();
        //System.out.println(datiSpecificiClient);
        AuthTypeHttps val = (AuthTypeHttps) datiSpecificiClient;
        CertificatoClientFornito certificatoClientFornito = (CertificatoClientFornito) val.getCertificatoAutenticazione();
        //System.out.println(val.getCertificatoAutenticazione());
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
        newReferente.setIdUtente(UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_RICHIEDENTE_ADESIONE);
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
        documento.setContent(Base64.encodeBase64String("certificato test".getBytes()));
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
        
        adesioniController.saveClientCollaudoAdesione(idAdesione, "MODI_P1", adesioneIdClient);

        // Act
        ResponseEntity<Adesione> response = adesioniController.deleteClientCollaudoAdesione(idAdesione, PROFILO);

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
        assertThrows(NotAuthorizedException.class, () -> adesioniController.deleteClientCollaudoAdesione(adesione.getIdAdesione(), profilo));
    }

    @Test
    void testDeleteClientCollaudoAdesioneNotFound() {
        // Setup
        UUID randomIdAdesione = UUID.randomUUID();
        String profilo = "ProfiloNonEsistente";

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.deleteClientCollaudoAdesione(randomIdAdesione, profilo));
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
        newReferente.setIdUtente(UTENTE_GESTORE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_RICHIEDENTE_ADESIONE);
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
        documento.setContent(Base64.encodeBase64String("certificato test".getBytes()));
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
        
        adesioniController.saveClientProduzioneAdesione(idAdesione, "MODI_P1", adesioneIdClient);

        String profilo = PROFILO;

        // Act
        ResponseEntity<Adesione> response = adesioniController.deleteClientProduzioneAdesione(idAdesione, profilo);

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
        assertThrows(NotAuthorizedException.class, () -> adesioniController.deleteClientProduzioneAdesione(adesione.getIdAdesione(), profilo));
    }

    @Test
    void testDeleteClientProduzioneAdesioneNotFound() {
        // Setup
        UUID randomIdAdesione = UUID.randomUUID();
        String profilo = "ProfiloNonEsistente";

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.deleteClientProduzioneAdesione(randomIdAdesione, profilo));
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
        ResponseEntity<Adesione> response = adesioniController.saveConfigurazioneCustomCollaudoAdesione(adesione.getIdAdesione(), datiCustomUpdate);

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
        assertThrows(NotAuthorizedException.class, () -> adesioniController.saveConfigurazioneCustomCollaudoAdesione(adesione.getIdAdesione(), datiCustomUpdate));
    }

    @Test
    void testSaveConfigurazioneCustomCollaudoAdesioneNotFound() {
        // Setup
        UUID randomIdAdesione = UUID.randomUUID();

        DatiCustomAdesioneUpdate datiCustomUpdate = new DatiCustomAdesioneUpdate();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.saveConfigurazioneCustomCollaudoAdesione(randomIdAdesione, datiCustomUpdate));
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
        ResponseEntity<Adesione> response = adesioniController.saveConfigurazioneCustomProduzioneAdesione(adesione.getIdAdesione(), datiCustomUpdate);

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
        assertThrows(NotAuthorizedException.class, () -> adesioniController.saveConfigurazioneCustomProduzioneAdesione(adesione.getIdAdesione(), datiCustomUpdate));
    }

    @Test
    void testSaveConfigurazioneCustomProduzioneAdesioneNotFound() {
        // Setup
        UUID randomIdAdesione = UUID.randomUUID();

        DatiCustomAdesioneUpdate datiCustomUpdate = new DatiCustomAdesioneUpdate();

        // Act & Assert
        assertThrows(NotFoundException.class, () -> adesioniController.saveConfigurazioneCustomProduzioneAdesione(randomIdAdesione, datiCustomUpdate));
    }  
}
