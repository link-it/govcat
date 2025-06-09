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

import static org.assertj.core.api.Assertions.fail;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.apache.commons.codec.binary.Base64;
import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.controllers.ClientController;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.controllers.NotificheController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.dao.repositories.OrganizzazioneRepository;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.Adesione;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.AuthTypeApiResourceProprietaCustom;
import org.govway.catalogo.servlets.model.Campo;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.EntitaComplessaError;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.ItemMessaggio;
import org.govway.catalogo.servlets.model.ItemNotifica;
import org.govway.catalogo.servlets.model.MessaggioCreate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.OrganizzazioneUpdate;
import org.govway.catalogo.servlets.model.PagedModelItemMessaggio;
import org.govway.catalogo.servlets.model.PagedModelItemNotifica;
import org.govway.catalogo.servlets.model.PagedModelReferente;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.Referente;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
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
public class AdesioneServizioIntegrationTest {

    private static final String UTENTE_REFERENTE_SERVIZIO = "cesare";
    private static final String UTENTE_REFERENTE_TECNICO = "barbarossa";
    private static final String UTENTE_GESTORE = "gestore";
    private static final String UTENTE_REFERENTE_DOMINIO = "referente_dominio";
    private static final String NOME_GRUPPO = "Mari";
    private static final String UTENTE_ADERENTE = "magno";
    
    private static UUID ID_UTENTE_REFERENTE_SERVIZIO;
    private static UUID ID_UTENTE_REFERENTE_TECNICO;
    private static UUID ID_UTENTE_GESTORE;
    private static UUID ID_UTENTE_REFERENTE_DOMINIO;
    private static UUID ID_UTENTE_ADERENTE;
    
    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Autowired
    private UtenteService utenteService;

    @Autowired
    private ServiziController serviziController;

    @Autowired
    private AdesioniController adesioniController;

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
    private JdbcTemplate jdbcTemplate;
    
    @Autowired
    private OrganizzazioneRepository organizzazioneRepository;
    
    @Autowired
    private OrganizzazioneService organizzazioneService;

    private UUID idServizio;
    
    private UUID idOrganizzazione;

    @BeforeEach
    private void setUp() {
        MockitoAnnotations.initMocks(this);  // Inizializza i mock con JUnit 5
        SecurityContextHolder.setContext(securityContext);
        
        InfoProfilo info = CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        ID_UTENTE_GESTORE = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_DOMINIO, utenteService);
        ID_UTENTE_REFERENTE_DOMINIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_SERVIZIO, utenteService);
        ID_UTENTE_REFERENTE_SERVIZIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO, utenteService);
        ID_UTENTE_REFERENTE_TECNICO = UUID.fromString(info.utente.getIdUtente());
    }

    @AfterEach
    private void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setIdServizio(UUID id) {
        this.idServizio = id;
    }
    
    private void setIdOrganizazione(UUID id) {
        this.idOrganizzazione = id;
    }
    

    @Test
    void testAdesioneServizioSuccess() {
        // Step 1
        this.testUtenteAderente();

        // Step 6
        this.testUtenteReferenteTecnico();

        // Step 17
        this.testReferenteServizio();

    }

    ResponseEntity<Organizzazione> response;
    ResponseEntity<Soggetto> createdSoggetto;
    ResponseEntity<Utente> responseUtente;
    ResponseEntity<Gruppo> responseGruppo;
    
    DocumentoCreate immagine = new DocumentoCreate();
    
    private void cambioStato() {
    	StatoUpdate statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("richiesto_collaudo");
	    statoServizioUpdate.setCommento("richiesta di collaudo");
	    
	    try {
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
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
	  
	    statoServizioUpdate.setStato("autorizzato_collaudo");
	    statoServizioUpdate.setCommento("autorizzato collaudo");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    statoServizioUpdate.setStato("in_configurazione_collaudo");
	    statoServizioUpdate.setCommento("in configurazione collaudo");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    statoServizioUpdate.setStato("pubblicato_collaudo");
	    statoServizioUpdate.setCommento("pubblicato in collaudo");
	    serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
    }

    private void setNuovaAdesione() {
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        //CREO L'ORGANIZZAZIONE Viaggiar
        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setNome("Viaggiar");
        organizzazione.setEsterna(false);
        organizzazione.setCodiceFiscaleSoggetto(NOME_GRUPPO);

        response = organizzazioniController.createOrganizzazione(organizzazione);
        /*
        OrganizzazioneUpdate organizzazioneUpdate = new OrganizzazioneUpdate();
        organizzazioneUpdate.setIdSoggettoDefault(ID_UTENTE_REFERENTE_SERVIZIO);
        organizzazioneUpdate.setNome("NomeOrganizzazione");
        organizzazioniController.updateOrganizzazione(response.getBody().getIdOrganizzazione(), organizzazioneUpdate);
        */
        UtenteUpdate utenteUpdate = new UtenteUpdate();
        utenteUpdate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utenteUpdate.setNome("Cesare");
        utenteUpdate.setCognome("Rossi");
        utenteUpdate.setEmailAziendale("qualsiais@mail.com");
        utenteUpdate.setPrincipal(UTENTE_REFERENTE_SERVIZIO);
        utenteUpdate.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
        utenteUpdate.setStato(StatoUtenteEnum.ABILITATO);
        utenteUpdate.setTelefonoAziendale("0000000000");
        utentiController.updateUtente(ID_UTENTE_REFERENTE_SERVIZIO, utenteUpdate);
        this.setIdOrganizazione(response.getBody().getIdOrganizzazione());
        assertNotNull(response.getBody().getIdOrganizzazione());
        
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setSkipCollaudo(true);
        soggettoCreate.setNome(UTENTE_ADERENTE);
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setAderente(true);
    	soggettoCreate.setReferente(true);

        createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());
        
        DominioCreate dominio = CommonUtils.getDominioCreate();
        dominio.setSkipCollaudo(true);
        dominio.setNome("Test");
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());

        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominio);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());
        
        //CREO IL SERVIZIO jonio-v. 1
        ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
        servizioCreate.setSkipCollaudo(true);
        servizioCreate.setNome("jonio");
		servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());
		servizioCreate.setIdDominio(createdDominio.getBody().getIdDominio());
		servizioCreate.setAdesioneDisabilitata(false);
		servizioCreate.setMultiAdesione(false);
		servizioCreate.setVersione("1");
		if(immagine.getContent()!=null)
			servizioCreate.setImmagine(immagine);
		ReferenteCreate referente = new ReferenteCreate();
		referente.setTipo(TipoReferenteEnum.REFERENTE);
		referente.setIdUtente(ID_UTENTE_GESTORE);
		ReferenteCreate referente2 = new ReferenteCreate();
		referente2.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
		referente2.setIdUtente(ID_UTENTE_REFERENTE_TECNICO);
		ReferenteCreate referente3 = new ReferenteCreate();
		referente3.setTipo(TipoReferenteEnum.REFERENTE);
		referente3.setIdUtente(ID_UTENTE_REFERENTE_SERVIZIO);
		//referente.setIdUtente(responseUtente.getBody().getIdUtente());
		//ReferenteCreate referenteTecnico = this.setReferenteTecnico();
		List<ReferenteCreate> referenti = new ArrayList<ReferenteCreate>();
		referenti.add(referente);
		referenti.add(referente2);
		referenti.add(referente3);
		servizioCreate.setReferenti(referenti);

        ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
        
        assertNotNull(createdServizio.getBody().getIdServizio());
             
        this.setIdServizio(createdServizio.getBody().getIdServizio());
        
        // Step API creation
        APICreate apiCreate = CommonUtils.getAPICreate();
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
        doc.setFilename("SpecificaAPI.yaml");
        doc.setContent(Base64.encodeBase64String(CommonUtils.openApiSpec.getBytes()));

        //apiCreate.setSpecifica(doc);
        
        apiCreate.setIdServizio(createdServizio.getBody().getIdServizio());

        apiController.createApi(apiCreate);
        
        //CREO L'ADESIONE
        SoggettoCreate soggetto = new SoggettoCreate();
        soggetto.setIdOrganizzazione(idOrganizzazione);
        soggetto.setNome("Test");
        soggetto.setAderente(true);
        
        ResponseEntity<Soggetto> soggettoCreato = soggettiController.createSoggetto(soggetto);

        /*
        ReferenteCreate referenteDaAggiungere = new ReferenteCreate();
        referenteDaAggiungere.setTipo(TipoReferenteEnum.REFERENTE);
        referenteDaAggiungere.setIdUtente(UTENTE_ADERENTE);
        ResponseEntity<Referente> createdReferente2 = serviziController.createReferenteServizio(idServizio, referenteDaAggiungere);
         */
        
        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setPrincipal(UTENTE_ADERENTE);
        utente.setNome(UTENTE_ADERENTE);
        utente.setRuolo(RuoloUtenteEnum.GESTORE);
        utente.setIdOrganizzazione(idOrganizzazione);

        responseUtente = utentiController.createUtente(utente);
        assertNotNull(responseUtente.getBody().getIdUtente());
        
        List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(responseUtente.getBody().getIdUtente());
        
        //ResponseEntity<PagedModelReferente> s = serviziController.listReferentiServizio(idServizio, UTENTE_ADERENTE, TipoReferenteEnum.REFERENTE, 0, 10, null);
        //List<Referente> listReferenti = s.getBody().getContent();
        //assertEquals(UTENTE_ADERENTE, listReferenti.get(0).getUtente().getNome());
        
        this.cambioStato();
        
        long idOrg = organizzazioneService.findByNome("Viaggiar").get().getId();
        
        OrganizzazioneEntity organizzazioneEntity = organizzazioneRepository.findById(idOrg).orElseThrow();
        organizzazioneEntity.getUtenti();
             
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(soggettoCreato.getBody().getIdSoggetto());
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);
        setIdAdesione(adesione.getBody().getIdAdesione());
    }
    
    UUID idAdesione;
    private void setIdAdesione(UUID id) {
    	idAdesione = id;
    }
    
    private void getDominioServizio() {
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setNome("Viaggiar");
        organizzazione.setEsterna(false);
        organizzazione.setCodiceFiscaleSoggetto(NOME_GRUPPO);

        response = organizzazioniController.createOrganizzazione(organizzazione);
        this.setIdOrganizazione(response.getBody().getIdOrganizzazione());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome(UTENTE_ADERENTE);
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());

        createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        UtenteCreate utente2 = CommonUtils.getUtenteCreate();
        utente2.setPrincipal(UTENTE_ADERENTE);
        utente2.setNome(UTENTE_ADERENTE);
        utente2.setRuolo(RuoloUtenteEnum.GESTORE);
        utente2.setIdOrganizzazione(response.getBody().getIdOrganizzazione());

        responseUtente = utentiController.createUtente(utente2);
        assertNotNull(responseUtente.getBody().getIdUtente());

        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        gruppoCreate.setNome(NOME_GRUPPO);
        responseGruppo = gruppiController.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, responseGruppo.getStatusCode());

        DominioCreate dominio = CommonUtils.getDominioCreate();
        dominio.setSkipCollaudo(true);
        dominio.setNome("Test");
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());

        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominio);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
        servizioCreate.setSkipCollaudo(true);
		servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());
		servizioCreate.setIdDominio(createdDominio.getBody().getIdDominio());
		servizioCreate.setMultiAdesione(false);
		if(immagine.getContent()!=null)
			servizioCreate.setImmagine(immagine);
		ReferenteCreate referente = new ReferenteCreate();
		referente.setTipo(TipoReferenteEnum.REFERENTE);
		referente.setIdUtente(ID_UTENTE_GESTORE);
		ReferenteCreate referente2 = new ReferenteCreate();
		referente2.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
		referente2.setIdUtente(ID_UTENTE_REFERENTE_TECNICO);
		ReferenteCreate referente3 = new ReferenteCreate();
		referente3.setTipo(TipoReferenteEnum.REFERENTE);
		referente3.setIdUtente(ID_UTENTE_REFERENTE_SERVIZIO);
		referente.setIdUtente(responseUtente.getBody().getIdUtente());
		//ReferenteCreate referenteTecnico = this.setReferenteTecnico();
		List<ReferenteCreate> referenti = new ArrayList<ReferenteCreate>();
		referenti.add(referente);
		referenti.add(referente2);
		referenti.add(referente3);
		servizioCreate.setReferenti(referenti);

        ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
        Servizio servizio = createdServizio.getBody();
        
        
        // Step API creation
        APICreate apiCreate = CommonUtils.getAPICreate();
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
        
        apiCreate.setGruppiAuthType(gruppiAuthType);
        
        DocumentoCreate doc = new DocumentoCreate();
        doc.setFilename("SpecificaAPI.json");
        doc.setContent(Base64.encodeBase64String("contenuto test".getBytes()));

        //apiCreate.setSpecifica(doc);
        
        apiCreate.setIdServizio(createdServizio.getBody().getIdServizio());

        apiController.createApi(apiCreate);
        
        assertNotNull(servizio);
        this.setIdServizio(servizio.getIdServizio());
    }

    MessaggioCreate messaggioComunicazione;

    private void testUtenteAderente() {
    	this.setNuovaAdesione();
        //this.getDominioServizio();

    	CommonUtils.getSessionUtente(UTENTE_ADERENTE, securityContext, authentication, utenteService);
        
        SoggettoCreate soggetto = new SoggettoCreate();
        soggetto.setIdOrganizzazione(idOrganizzazione);
        soggetto.setNome("nometest");
        soggetto.setAderente(true);
        
        soggettiController.createSoggetto(soggetto);

        InfoProfilo info = CommonUtils.getSessionUtente(UTENTE_ADERENTE, securityContext, authentication, utenteService);
        ID_UTENTE_ADERENTE = UUID.fromString(info.utente.getIdUtente());
        
        ReferenteCreate referenteDaAggiungere = new ReferenteCreate();
        referenteDaAggiungere.setTipo(TipoReferenteEnum.REFERENTE);
        referenteDaAggiungere.setIdUtente(ID_UTENTE_ADERENTE);
        serviziController.createReferenteServizio(idServizio, null, referenteDaAggiungere);

        ResponseEntity<PagedModelReferente> s = serviziController.listReferentiServizio(idServizio, UTENTE_ADERENTE, TipoReferenteEnum.REFERENTE, 0, 10, null);
        List<Referente> listReferenti = s.getBody().getContent();
        assertEquals(UTENTE_ADERENTE, listReferenti.get(0).getUtente().getNome());
        
        messaggioComunicazione = new MessaggioCreate();
        messaggioComunicazione.setOggetto("Oggetto Comunicazione");
        messaggioComunicazione.setTesto("Si richiede di procedere con la configurazione dell'adesione al servizio");
        ResponseEntity<ItemMessaggio> comunicazione = serviziController.createMessaggioServizio(idServizio, messaggioComunicazione);
        assertNotNull(comunicazione.getBody().getData());
        assertEquals(messaggioComunicazione.getTesto(), comunicazione.getBody().getTesto());
    }

    private void testUtenteReferenteTecnico() {

    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);

        ResponseEntity<PagedModelItemNotifica> notifiche = notificheController.listNotifiche(null, null, null, null, null, null, idServizio, null, 0, 10, null);
        List<ItemNotifica> listNotifiche = notifiche.getBody().getContent();
        assertEquals(UTENTE_ADERENTE, listNotifiche.get(0).getMittente().getNome());

        ResponseEntity<PagedModelItemMessaggio> listMessaggi = serviziController.listMessaggiServizio(idServizio, null, 0, 10, null);
        List<ItemMessaggio> messaggi = listMessaggi.getBody().getContent();
        assertEquals(messaggioComunicazione.getTesto(), messaggi.get(0).getTesto());

        messaggioComunicazione = new MessaggioCreate();
        messaggioComunicazione.setOggetto("Oggetto Comunicazione");
        messaggioComunicazione.setTesto("Configurazione effettuata");
        ResponseEntity<ItemMessaggio> comunicazione = serviziController.createMessaggioServizio(idServizio, messaggioComunicazione);
        assertNotNull(comunicazione.getBody().getData());
        assertEquals(messaggioComunicazione.getTesto(), comunicazione.getBody().getTesto());
        
        //STEP 8: Accedere al dettaglio dell'adesione (verifico che sia presente l'Utente Aderente alla lista dei referenti al servizio)
        ResponseEntity<PagedModelReferente> listRef = serviziController.listReferentiServizio(idServizio, null, null, 0, 10, null);
        List<Referente> listReferente = listRef.getBody().getContent();
        Optional<Referente> referenteTrovato = listReferente.stream()
                .filter(referente -> referente.getUtente().getIdUtente().equals(ID_UTENTE_ADERENTE))
                .findFirst();
        assertTrue(referenteTrovato.isPresent());
        
        ///////////////////////////////
        
        //InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.findByPrincipal(UTENTE_GESTORE).get(), List.of());
		//when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);
		//when(this.securityContext.getAuthentication()).thenReturn(this.authentication);
		
        CommonUtils.getSessionUtente(UTENTE_ADERENTE, securityContext, authentication, utenteService);
        
        //InfoProfilo infoProfiloReferente2 = new InfoProfilo(UTENTE_ADERENTE, this.utenteService.findByPrincipal(UTENTE_ADERENTE).get(), List.of());
        //when(this.authentication.getPrincipal()).thenReturn(infoProfiloReferente2);
        //when(this.securityContext.getAuthentication()).thenReturn(this.authentication);
		
		StatoUpdate statoServizioUpdate = new StatoUpdate();
		statoServizioUpdate.setStato("richiesto_collaudo");
	    statoServizioUpdate.setCommento("richiesta di collaudo");
	    //try {
	    	//adesioniController.updateStatoAdesione(idAdesione, statoServizioUpdate);
	    	/*
	    } catch (UpdateEntitaComplessaNonValidaSemanticamenteException e) {
	    	// Stampa il messaggio dell'eccezione
            System.err.println("Errore: " + e.getMessage());

            // Stampa lo stack trace completo
            System.err.println("Stack Trace: ");
            Arrays.stream(e.getStackTrace()).forEach(System.err::println);
            System.out.println("");
            System.out.println("ERRORI:");
            System.out.println("");
            List<EntitaComplessaError> errori = e.getErrori();
            errori.stream().forEach(v -> {
            	v.getCampi().forEach(s -> {
            		System.err.println("Nome Campo: " + s.getNomeCampo());
            		});
            	});
            
            // Opzionale: Se vuoi stampare anche la causa dell'eccezione
            Throwable cause = e.getCause();
            if (cause != null) {
                System.err.println("Causa: " + cause.getMessage());
                Arrays.stream(cause.getStackTrace()).forEach(System.err::println);
            }
	    }
	    */
		/*
		 * try {
		 * 
		 * } catch (UpdateEntitaComplessaNonValidaSemanticamenteException e) {
		 * List<EntitaComplessaError> errori = e.getErrori(); for (EntitaComplessaError
		 * errore : errori) { System.out.println("Errore:");
		 * System.out.println("Sottotipo: " + errore.getSottotipo());
		 * 
		 * // Se 'dato' è un oggetto complesso, puoi accedere ai suoi attributi se
		 * disponibili ConfigurazioneClasseDato dato = errore.getDato(); if (dato !=
		 * null) { System.out.println("Dato: " + dato.getValue()); }
		 * 
		 * // Stampa i parametri se presenti //Map<String, String> params =
		 * errore.getParams(); //if (params != null && !params.isEmpty()) { //
		 * System.out.println("Parametri:"); //for (Map.Entry<String, String> entry :
		 * params.entrySet()) { // System.out.println("  " + entry.getKey() + ": " +
		 * entry.getValue()); // } }
		 * 
		 * // Stampa i campi se presenti // List<Campo> campi = errore.getCampi(); // if
		 * (campi != null && !campi.isEmpty()) { // System.out.println("Campi:"); //for
		 * (Campo campo : campi) { // System.out.println("  Nome Campo: " +
		 * campo.getNomeCampo()); //} //} System.out.println("-------------"); }
		 * fail("Si è verificata un'eccezione: " + e.getMessage()); } catch (Exception
		 * e) { e.printStackTrace(); fail("Si è verificata un'eccezione inattesa: " +
		 * e.getMessage()); }
		 */


    }

    private void testReferenteServizio() {
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);

        ResponseEntity<PagedModelItemNotifica> notifiche = notificheController.listNotifiche(null, null, null, null, null, null, idServizio, null, 0, 10, null);
        List<ItemNotifica> listNotifiche = notifiche.getBody().getContent();
        assertTrue(listNotifiche.stream().anyMatch(v -> v.getMittente().getNome().equals(UTENTE_ADERENTE)));

        ResponseEntity<PagedModelItemMessaggio> listMessaggi = serviziController.listMessaggiServizio(idServizio, null, 0, 10, null);
        List<ItemMessaggio> messaggi = listMessaggi.getBody().getContent();
        assertEquals(messaggioComunicazione.getTesto(), messaggi.get(0).getTesto());

        ResponseEntity<PagedModelReferente> s = serviziController.listReferentiServizio(idServizio, UTENTE_ADERENTE, TipoReferenteEnum.REFERENTE, 0, 10, null);
        List<Referente> r = s.getBody().getContent();
        assertEquals(UTENTE_ADERENTE, r.get(0).getUtente().getNome());
    }

}

