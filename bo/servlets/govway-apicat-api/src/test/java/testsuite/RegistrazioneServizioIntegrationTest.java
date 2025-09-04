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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
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
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.API;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.Allegato;
import org.govway.catalogo.servlets.model.AllegatoItemCreate;
import org.govway.catalogo.servlets.model.AmbienteEnum;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.AuthTypeHttpsPdndCreate;
import org.govway.catalogo.servlets.model.CertificatoClientCreate;
import org.govway.catalogo.servlets.model.ClientCreate;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.EntitaComplessaError;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.ItemMessaggio;
import org.govway.catalogo.servlets.model.ListItemGruppo;
import org.govway.catalogo.servlets.model.MessaggioCreate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.PagedModelAllegato;
import org.govway.catalogo.servlets.model.PagedModelItemMessaggio;
import org.govway.catalogo.servlets.model.PagedModelItemNotifica;
import org.govway.catalogo.servlets.model.PagedModelItemServizio;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.Referente;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.StatoClientEnum;
import org.govway.catalogo.servlets.model.StatoUpdate;
import org.govway.catalogo.servlets.model.TipoCertificatoEnum;
import org.govway.catalogo.servlets.model.TipoNotificaEnum;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.TipologiaAllegatoEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.VisibilitaAllegatoEnum;
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
public class RegistrazioneServizioIntegrationTest {

    private static final String UTENTE_REFERENTE_SERVIZIO = "cesare";
    private static final String UTENTE_REFERENTE_TECNICO = "colombo";
    private static final String UTENTE_GESTORE = "gestore";
    private static final String UTENTE_REFERENTE_DOMINIO = "referente_dominio";
    private static final String UTENTE_NON_REGISTRATO = "utente_non_registrato";
    private static final String NOME_GRUPPO = "Mari";
    private static final String UTENTE_ADERENTE = "magno";
    
    private static UUID ID_UTENTE_REFERENTE_SERVIZIO;
    private static UUID ID_UTENTE_REFERENTE_TECNICO;
    private static UUID ID_UTENTE_GESTORE;
    private static UUID ID_UTENTE_REFERENTE_DOMINIO;
    private static UUID ID_UTENTE_NON_REGISTRATO;
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

    private UUID idServizio;
    
    private UUID idOrganizzazione;

    private UUID idAPI;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);  // Inizializza i mock con JUnit 5
        SecurityContextHolder.setContext(securityContext);
        
        InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_GESTORE, utenteService);
        ID_UTENTE_GESTORE = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_DOMINIO, utenteService);
        ID_UTENTE_REFERENTE_DOMINIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_SERVIZIO, utenteService);
        ID_UTENTE_REFERENTE_SERVIZIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO, utenteService);
        ID_UTENTE_REFERENTE_TECNICO = UUID.fromString(info.utente.getIdUtente());
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
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

    ResponseEntity<Organizzazione> response;
    ResponseEntity<Soggetto> createdSoggetto;
    ResponseEntity<Utente> responseUtente;
    ResponseEntity<Gruppo> responseGruppo;
    DocumentoCreate immagine = new DocumentoCreate();

    @Test
    void testAssociazioneDominioASoggettoNonReferente() {
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);

        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setEsterna(false);

        response = organizzazioniController.createOrganizzazione(organizzazione);
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome(UTENTE_REFERENTE_DOMINIO);
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        
        createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.GESTORE);
        responseUtente = utentiController.createUtente(utente);

        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        gruppoCreate.setNome(NOME_GRUPPO);
        responseGruppo = gruppiController.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, responseGruppo.getStatusCode());

        DominioCreate dominio = CommonUtils.getDominioCreate();
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());

        assertThrows(BadRequestException.class, ()-> dominiController.createDominio(dominio));
    }
    
    @Test
    public void testRegistrazioneServizioReferenteSuccess() {
        Dominio dominio = this.getDominio();

        //SCENARIO REGISTRAZIONE DI UN SERVIZIO
        
        // Step 1: Aprire sessione autenticata con utente referente servizio (cesare)
        this.testUtenteReferenteServizio(dominio);

        // Step 16: sessione autenticata con utente referente tecnico (colombo)
        this.testReferenteTecnico();

        // Step 23
        this.testUtenteReferenteServizioSecondaParte();

        // Step 29
        this.testUtenteReferenteDominio();

        // Step 36
        this.testUtenteGestore();

        // Step 46
        this.testUtenteReferenteServizioTerzaParte();
        
    }

    public Dominio getDominio() {
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);

        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setEsterna(false);

        response = organizzazioniController.createOrganizzazione(organizzazione);
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome(UTENTE_REFERENTE_DOMINIO);
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setReferente(true);

        createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.GESTORE);
        responseUtente = utentiController.createUtente(utente);

        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        gruppoCreate.setNome(NOME_GRUPPO);
        responseGruppo = gruppiController.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, responseGruppo.getStatusCode());

        DominioCreate dominio = CommonUtils.getDominioCreate();
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());

        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominio);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        return createdDominio.getBody();
    }

    public ReferenteCreate setReferenteTecnico() {
        ReferenteCreate referente = new ReferenteCreate();
        referente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        referente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO);
        return referente;
    }

    MessaggioCreate messaggioComunicazione;

    public void testUtenteReferenteServizio(Dominio dominio) {
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);

        // Step 3: Creare un servizio
        ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
        servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());
        servizioCreate.setIdDominio(dominio.getIdDominio());

        if (immagine.getContent() != null) {
            servizioCreate.setImmagine(immagine);
        }

        ReferenteCreate referente = new ReferenteCreate();
        referente.setTipo(TipoReferenteEnum.REFERENTE);
        referente.setIdUtente(responseUtente.getBody().getIdUtente());

        List<ReferenteCreate> referenti = new ArrayList<>();
        referenti.add(referente);
        servizioCreate.setReferenti(referenti);

        ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
        Servizio servizio = createdServizio.getBody();

        assertNotNull(servizio);
        this.setIdServizio(servizio.getIdServizio());
        assertEquals(CommonUtils.NOME_SERVIZIO, servizio.getNome());

        // Step 6: Aggiungi Gruppo "Mari" al Servizio
        UUID idGruppo = responseGruppo.getBody().getIdGruppo();
        serviziController.addGruppoServizio(idServizio, idGruppo);

        // Step 7: Verificare che il gruppo sia stato associato al servizio
        ResponseEntity<ListItemGruppo> responseGruppiServizio = serviziController.listGruppiServizio(idServizio);
        assertEquals(HttpStatus.OK, responseGruppiServizio.getStatusCode());
        assertTrue(responseGruppiServizio.getBody().getContent().stream()
                .anyMatch(g -> g.getIdGruppo().equals(idGruppo) && g.getNome().equals(NOME_GRUPPO)));

        // Step 8: Aggiungi Referente per il Servizio
        ReferenteCreate referenteDaAggiungere = new ReferenteCreate();
        referenteDaAggiungere.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        referenteDaAggiungere.setIdUtente(ID_UTENTE_REFERENTE_TECNICO);
        ResponseEntity<Referente> createdReferente2 = serviziController.createReferenteServizio(idServizio, null, referenteDaAggiungere);
        assertEquals(HttpStatus.OK, createdReferente2.getStatusCode());
        assertNotNull(createdReferente2.getBody());

        // Step 9: Aggiungere un allegato al Servizio
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto di test".getBytes()));
        allegatoCreate.setDescrizione("questa è la descrizione di test");
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setFilename("nomeallegato.pdf");

        List<AllegatoItemCreate> lista = new ArrayList<>();
        lista.add(allegatoCreate);
        ResponseEntity<List<Allegato>> responseListAllegato = serviziController.createAllegatoServizio(createdServizio.getBody().getIdServizio(), lista);
        assertEquals(HttpStatus.OK, responseListAllegato.getStatusCode());
        assertTrue(responseListAllegato.getBody().stream().anyMatch(g -> g.getFilename().equals("nomeallegato.pdf")));

        // Step 10: Aggiungi Comunicazione e verifica la presenza
        messaggioComunicazione = new MessaggioCreate();
        messaggioComunicazione.setOggetto("Oggetto Comunicazione");
        messaggioComunicazione.setTesto("Questo è il testo di Test comunicazione");
        ResponseEntity<ItemMessaggio> comunicazione = serviziController.createMessaggioServizio(idServizio, messaggioComunicazione);
        assertNotNull(comunicazione.getBody().getData());
        assertEquals(messaggioComunicazione.getTesto(), comunicazione.getBody().getTesto());

        // Verifica presenza del messaggio
        ResponseEntity<PagedModelItemMessaggio> listMessaggi = serviziController.listMessaggiServizio(idServizio, null, 0, 10, null);
        List<ItemMessaggio> messaggi = listMessaggi.getBody().getContent();
        assertEquals(messaggioComunicazione.getTesto(), messaggi.get(0).getTesto());
    }

    @Test
    public void testUtenteAnonimo() {
        // Logout
        SecurityContextHolder.clearContext();

        // Verifica che un utente anonimo non riceva nulla
        assertThrows(NotAuthorizedException.class, () -> {
        	serviziController.listServizi(null, null, null, null, null, null, null, null, false, true, null, null, null, null, null, null, null, 0, 10, null);
        });
    }
    
    private ResponseEntity<API> getAPI() {
    	APICreate apiCreate = CommonUtils.getAPICreate();
        
        apiCreate.setIdServizio(idServizio);
        
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
        
        this.setIdAPI(responseApi.getBody().getIdApi());
        
        return responseApi;
    }

    public void testReferenteTecnico() {
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO, securityContext, authentication, utenteService);

        serviziController.getGrantServizio(idServizio);

        ResponseEntity<PagedModelItemNotifica> notifiche = notificheController.listNotifiche(null, null, null, null, null, null, idServizio, null, 0, 10, null);
        notifiche.getBody().getContent();

        ResponseEntity<PagedModelItemMessaggio> messaggi = serviziController.listMessaggiServizio(idServizio, null, 0, 10, null);
        List<ItemMessaggio> listMessaggi = messaggi.getBody().getContent();

        assertEquals(messaggioComunicazione.getOggetto(), listMessaggi.get(0).getOggetto());
        assertEquals(messaggioComunicazione.getTesto(), listMessaggi.get(0).getTesto());

        // Step API creation
        this.getAPI();

        // Allegato creation
        AllegatoItemCreate allegatoCreate = new AllegatoItemCreate();
        allegatoCreate.setFilename("allegato_test.pdf");
        allegatoCreate.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        allegatoCreate.setTipologia(TipologiaAllegatoEnum.GENERICO);
        allegatoCreate.setVisibilita(VisibilitaAllegatoEnum.PUBBLICO);
        
        

        List<AllegatoItemCreate> allegati = new ArrayList<>();
        allegati.add(allegatoCreate);

        ResponseEntity<List<Allegato>> responseAllegato = apiController.createAllegatoAPI(idAPI, allegati);
        ResponseEntity<PagedModelAllegato> listAllegati = apiController.listAllegatiApi(idAPI, null, null, null, null, 0, 10, null);

        assertEquals(allegatoCreate.getFilename(), listAllegati.getBody().getContent().get(0).getFilename());

        // Messaggio creation
        messaggioComunicazione = new MessaggioCreate();
        messaggioComunicazione.setOggetto("Configurazione completata");
        messaggioComunicazione.setTesto("Configurazione completata come richiesto");
        ResponseEntity<ItemMessaggio> comunicazione = serviziController.createMessaggioServizio(idServizio, messaggioComunicazione);
        assertNotNull(comunicazione.getBody().getData());
        assertEquals(messaggioComunicazione.getTesto(), comunicazione.getBody().getTesto());
    }

    public void testUtenteReferenteServizioSecondaParte() {
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        //Verificare la presenza della notifica inviata dal referente tecnico
        ResponseEntity<PagedModelItemMessaggio> messaggi = serviziController.listMessaggiServizio(idServizio, null, 0, 10, null);
        List<ItemMessaggio> listMessaggi = messaggi.getBody().getContent();
        System.out.println(messaggioComunicazione.getTesto());
        assertEquals(messaggioComunicazione.getOggetto(), listMessaggi.get(0).getOggetto());
        assertEquals(messaggioComunicazione.getTesto(), listMessaggi.get(0).getTesto());
        
        //verificare la presenza dell'API creata dal referente tecnico
        boolean api = apiController.listAPI(idServizio, null, null, null, null, null, 0, 10, null).getBody().getContent().stream()
        .anyMatch(v -> v.getNome().equals(CommonUtils.NOME_API) && v.getVersione().equals(CommonUtils.VERSIONE_API));
        assertTrue(api);
        
        //cambio di stato in Richiesta configurazione in collaudo
        StatoUpdate statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("richiesto_collaudo");
	    statoServizioUpdate.setCommento("richiesta di collaudo");
	    
	    try {
	    	serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    	//System.out.println("STATO SERVIZIO: " + servizio.getBody().getStato());
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
	    //ResponseEntity<Resource> specificaAPI = apiController.downloadSpecificaAPI(idAPI, true);
    }
    
    public void testUtenteReferenteDominio() {
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
        
        //verificare la presenza della notifica del cambio di stato da parte del referente servizio
        ResponseEntity<PagedModelItemNotifica> notifiche = notificheController.listNotifiche(null, TipoNotificaEnum.CAMBIO_STATO, null, null, null, null, idServizio, null, 0, 10, null);
        notifiche.getBody().getContent();
        
        //scaricare il descrittore dal dettaglio della API
        ResponseEntity<Resource> specificaAPI = apiController.downloadSpecificaAPI(idAPI, AmbienteEnum.COLLAUDO, null, false, null);
        
        try {
        //assertEquals("SpecificaAPI.json", specificaAPI.getBody().getFilename());
        	InputStream inputStream = specificaAPI.getBody().getInputStream();
        	StringBuilder resultStringBuilder = new StringBuilder();
        	try (BufferedReader br = new BufferedReader(new InputStreamReader(inputStream))) {
        	    String line;
        	    while ((line = br.readLine()) != null) {
        	        resultStringBuilder.append(line).append("\n");
        	    }
        	}
        	String result = resultStringBuilder.toString().strip();  // Contenuto come Stringa

        	assertEquals(CommonUtils.openApiSpec.toString().strip(),result);
        } catch (IOException e) {
			e.printStackTrace();
		}
        
        //Scegliere l’ambiente di Collaudo e quindi premere il pulsante “matita” per procedere con l’immissione dei dati di configurazione PDND
        ClientCreate client = new ClientCreate();
        client.setIdSoggetto(createdSoggetto.getBody().getIdSoggetto());
    	client.setNome("Client TEST");
    	client.setAmbiente(AmbienteEnum.COLLAUDO);
    	client.setStato(StatoClientEnum.NUOVO);
    	AuthTypeHttpsPdndCreate authType = new AuthTypeHttpsPdndCreate();
        authType.setAuthType(AuthTypeEnum.HTTPS_PDND);
        authType.setClientId("Costa");
        CertificatoClientCreate cl = new CertificatoClientCreate();
        cl.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        authType.setCertificatoAutenticazione(cl);
        
        //DatiSpecificiClientCreate dati = new DatiSpecificiClientCreate();
        //dati.setFinalita(idAPI);
        //dati.setAuthType(AuthTypeEnum.HTTPS_PDND);
        client.setDatiSpecifici(authType);
    	//ResponseEntity<Client> responseClient = clientController.createClient(client);
    	
    	//AuthTypeHttpsPdndCreate pdnd = new AuthTypeHttpsPdndCreate();
    	//CertificatoClientFornitoCreate certificatoAutenticazione = new CertificatoClientFornitoCreate();
    	//certificatoAutenticazione.setTipoCertificato(TipoCertificatoEnum.FORNITO);
    	//pdnd.setCertificatoAutenticazione(certificatoAutenticazione);
    	//pdnd.setAuthType(AuthTypeEnum.HTTPS_PDND);
        //APICreate api2 = new APICreate();
        //ProprietaCustom proprietaCustomItem = new ProprietaCustom();
        //proprietaCustomItem.setProprieta(null);
        //api2.addProprietaCustomItem(proprietaCustomItem);
        
        
        StatoUpdate statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("autorizzato_collaudo");
	    statoServizioUpdate.setCommento("autorizzato in collaudo");
	    
	    ResponseEntity<Servizio> response = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    assertEquals("autorizzato_collaudo", response.getBody().getStato());
        
    }
    
    public void testUtenteGestore() {
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        List<String> stato = new ArrayList<String>();
        stato.add("autorizzato_collaudo");
        ResponseEntity<PagedModelItemServizio> listServizi = serviziController.listServizi(null, null, null, null, idAPI, stato, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null);
        //System.out.println("NOME SERVIZIO: " + listServizi.getBody().getContent().get(0).getNome());
        assertEquals(CommonUtils.NOME_SERVIZIO, listServizi.getBody().getContent().get(0).getNome());
        
        StatoUpdate statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("in_configurazione_collaudo");
	    statoServizioUpdate.setCommento("in configurazione collaudo");
	    
	    ResponseEntity<Servizio> response = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    assertEquals("in_configurazione_collaudo", response.getBody().getStato());
	    
	    statoServizioUpdate = new StatoUpdate();
	    statoServizioUpdate.setStato("pubblicato_collaudo");
	    statoServizioUpdate.setCommento("pubblicato in collaudo");
	    
	    response = serviziController.updateStatoServizio(idServizio, statoServizioUpdate, null);
	    assertEquals("pubblicato_collaudo", response.getBody().getStato());
    }

    public void testUtenteReferenteServizioTerzaParte() {
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        ResponseEntity<API> api = apiController.getAPI(idAPI);
        assertEquals(CommonUtils.NOME_API, api.getBody().getNome());
//        assertEquals(CommonUtils.PROTOCOLLO_API, api.getBody().getProtocollo());
  
    }
    
}
