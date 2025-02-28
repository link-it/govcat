package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.controllers.ClientController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.core.dao.repositories.ClientRepository;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.core.services.ClientService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.AmbienteEnum;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.AuthTypeHttpBasicCreate;
import org.govway.catalogo.servlets.model.AuthTypeHttpsCreate;
import org.govway.catalogo.servlets.model.CertificatoClientFornitoCreate;
import org.govway.catalogo.servlets.model.Client;
import org.govway.catalogo.servlets.model.ClientCreate;
import org.govway.catalogo.servlets.model.ClientUpdate;
import org.govway.catalogo.servlets.model.DatiSpecificiClientCreate;
import org.govway.catalogo.servlets.model.Documento;
import org.govway.catalogo.servlets.model.DocumentoUpdateNew;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.PagedModelItemClient;
import org.govway.catalogo.servlets.model.RateLimiting;
import org.govway.catalogo.servlets.model.RateLimitingPeriodoEnum;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.StatoClientEnum;
import org.govway.catalogo.servlets.model.StatoClientUpdate;
import org.govway.catalogo.servlets.model.TipoCertificatoEnum;
import org.govway.catalogo.servlets.model.DocumentoUpdate.TipoDocumentoEnum;
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
public class ClientTest {

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private CoreAuthorization coreAuthorization;

    @Mock
    private ClientRepository clientRepository;

    @Autowired
    private ClientService clientService;

    @Autowired
    private ClientController clientController;

    @Autowired
    private UtenteService utenteService;

    @Autowired
    private OrganizzazioniController organizzazioniController;

    @Autowired
    private SoggettiController soggettiController;

    @Autowired
    private APIController apiController;

    @Autowired
    private AdesioniController adesioniController;

    private static final String UTENTE_GESTORE = "gestore";
    private static final String CLIENT_NOME = "Nome";

    @BeforeEach
    public void setUp() {
    	MockitoAnnotations.initMocks(this);

    	when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);

    	when(coreAuthorization.isAnounymous()).thenReturn(true);

    	SecurityContextHolder.setContext(this.securityContext);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void testCreateClientSuccess() {
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController
                .createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        SoggettoCreate sog = CommonUtils.getSoggettoCreate();
        sog.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(sog);

        assertNotNull(responseSoggetto.getBody());

        ClientCreate client = CommonUtils.getClientCreate();
        client.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Client> responseClient = clientController.createClient(client);

        assertNotNull(responseClient.getBody());
        assertEquals(HttpStatus.OK, responseClient.getStatusCode());
        assertEquals(CommonUtils.CLIENT_NOME, responseClient.getBody().getNome());
    }
    /*
    @Test
    public void testCreateClientNotAuthorized() {
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController
                .createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        SoggettoCreate sog = CommonUtils.getSoggettoCreate();
        sog.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(sog);

        assertNotNull(responseSoggetto.getBody());

        ClientCreate client = CommonUtils.getClientCreate();
        client.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
        
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
        	clientController.createClient(client);
        });
    }
	*/
    @Test
    public void testCreateClientConflict() {
        OrganizzazioneCreate organizzazioneCreate = CommonUtils.getOrganizzazioneCreate();
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(organizzazioneCreate);
        assertNotNull(responseOrganizzazione.getBody());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        ClientCreate clientCreate = CommonUtils.getClientCreate();
        clientCreate.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
        clientController.createClient(clientCreate);

        ConflictException exception = org.junit.jupiter.api.Assertions.assertThrows(ConflictException.class, () -> {
            clientController.createClient(clientCreate);
        });

        assertEquals("Client [" + clientCreate.getNome() + "/" + responseSoggetto.getBody().getNome() + "/" + clientCreate.getAmbiente() + "] esiste gia", exception.getMessage());
    }

    @Test
    public void testDeleteClientSuccess() {
        OrganizzazioneCreate organizzazioneCreate = CommonUtils.getOrganizzazioneCreate();
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(organizzazioneCreate);
        assertNotNull(responseOrganizzazione.getBody());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        ClientCreate clientCreate = CommonUtils.getClientCreate();
        clientCreate.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Client> responseClient = clientController.createClient(clientCreate);
        assertNotNull(responseClient.getBody());

        ResponseEntity<Void> responseDelete = clientController.deleteClient(responseClient.getBody().getIdClient());

        assertEquals(HttpStatus.OK, responseDelete.getStatusCode());
    }

    @Test
    public void testDeleteClientNotFound() {
        UUID idClientNonEsistente = UUID.randomUUID();

        NotFoundException exception = org.junit.jupiter.api.Assertions.assertThrows(NotFoundException.class, () -> {
            clientController.deleteClient(idClientNonEsistente);
        });

        assertEquals("Client [" + idClientNonEsistente + "] non trovato", exception.getMessage());
    }

    @Test
    public void testGetClientSuccess() {
        OrganizzazioneCreate organizzazioneCreate = CommonUtils.getOrganizzazioneCreate();
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(organizzazioneCreate);
        assertNotNull(responseOrganizzazione.getBody());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        ClientCreate clientCreate = CommonUtils.getClientCreate();
        clientCreate.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Client> responseClient = clientController.createClient(clientCreate);
        assertNotNull(responseClient.getBody());

        ResponseEntity<Client> responseGetClient = clientController.getClient(responseClient.getBody().getIdClient());

        assertNotNull(responseGetClient.getBody());
        assertEquals(HttpStatus.OK, responseGetClient.getStatusCode());
        assertEquals(clientCreate.getNome(), responseGetClient.getBody().getNome());
    }

    @Test
    public void testGetClientNotFound() {
        UUID idClientNonEsistente = UUID.randomUUID();

        NotFoundException exception = org.junit.jupiter.api.Assertions.assertThrows(NotFoundException.class, () -> {
            clientController.getClient(idClientNonEsistente);
        });

        assertEquals("Client [" + idClientNonEsistente + "] non trovato", exception.getMessage());
    }

    @Test
    public void testUpdateClientSuccess() {
        OrganizzazioneCreate organizzazioneCreate = CommonUtils.getOrganizzazioneCreate();
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(organizzazioneCreate);
        assertNotNull(responseOrganizzazione.getBody());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        ClientCreate clientCreate = CommonUtils.getClientCreate();
        clientCreate.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Client> responseClient = clientController.createClient(clientCreate);
        assertNotNull(responseClient.getBody());

        ClientUpdate clientUpdate = new ClientUpdate();
        clientUpdate.setNome("UpdatedClient");
        clientUpdate.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
        clientUpdate.setAmbiente(AmbienteEnum.COLLAUDO);
        clientUpdate.setIndirizzoIp("1.1.1.1");
        clientUpdate.setDescrizione("test");
        AuthTypeHttpBasicCreate d = new AuthTypeHttpBasicCreate();
        d.setAuthType(AuthTypeEnum.HTTP_BASIC);
        d.setFinalita(UUID.randomUUID());
        d.setIndirizzoIp("1.1.1.1");
        RateLimiting r = new RateLimiting();
        r.setPeriodo(RateLimitingPeriodoEnum.GIORNO);
        r.setQuota(0);
        d.setRateLimiting(r);
        clientUpdate.setDatiSpecifici(d);

        ResponseEntity<Client> responseUpdate = clientController.updateClient(responseClient.getBody().getIdClient(), clientUpdate);

        assertNotNull(responseUpdate.getBody());
        assertEquals("UpdatedClient", responseUpdate.getBody().getNome());
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());
    }

    @Test
    public void testUpdateClientNotFound() {
        UUID idClientNonEsistente = UUID.randomUUID();

        ClientUpdate clientUpdate = new ClientUpdate();
        clientUpdate.setNome("NonExistentClient");
        clientUpdate.setIdSoggetto(UUID.randomUUID());
        clientUpdate.setAmbiente(AmbienteEnum.COLLAUDO);
        clientUpdate.setIndirizzoIp("1.1.1.1");
        clientUpdate.setDescrizione("test");
        DatiSpecificiClientCreate d = new DatiSpecificiClientCreate();
        d.setAuthType(AuthTypeEnum.HTTP_BASIC);
        d.setFinalita(UUID.randomUUID());
        d.setIndirizzoIp("1.1.1.1");
        RateLimiting r = new RateLimiting();
        r.setPeriodo(RateLimitingPeriodoEnum.GIORNO);
        r.setQuota(0);
        d.setRateLimiting(r);
        clientUpdate.setDatiSpecifici(d);

        NotFoundException exception = org.junit.jupiter.api.Assertions.assertThrows(NotFoundException.class, () -> {
            clientController.updateClient(idClientNonEsistente, clientUpdate);
        });

        assertEquals("Client [" + idClientNonEsistente + "] non trovato", exception.getMessage());
    }
    
    @Test
    public void testDownloadAllegatoClientNotFoundAllegato() {
        OrganizzazioneCreate organizzazioneCreate = CommonUtils.getOrganizzazioneCreate();
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(organizzazioneCreate);
        assertNotNull(responseOrganizzazione.getBody());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        ClientCreate clientCreate = CommonUtils.getClientCreate();
        clientCreate.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Client> responseClient = clientController.createClient(clientCreate);
        assertNotNull(responseClient.getBody());

        UUID idAllegatoNonEsistente = UUID.randomUUID();

        NotFoundException exception = org.junit.jupiter.api.Assertions.assertThrows(NotFoundException.class, () -> {
            clientController.downloadAllegatoClient(responseClient.getBody().getIdClient(), idAllegatoNonEsistente);
        });

        assertEquals("Allegato [" + idAllegatoNonEsistente + "] non trovato", exception.getMessage());
    }
    
    @Test
    void testUpdateClientStatoSuccess() {
        // Creazione dell'organizzazione necessaria
        OrganizzazioneCreate organizzazioneCreate = CommonUtils.getOrganizzazioneCreate();
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(organizzazioneCreate);
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione del soggetto associato all'organizzazione
        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        // Creazione del client
        ClientCreate clientCreate = CommonUtils.getClientCreate();
        clientCreate.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Client> responseClient = clientController.createClient(clientCreate);
        assertNotNull(responseClient.getBody());

        // Aggiornamento dello stato del client
        StatoClientUpdate statoClientUpdate = new StatoClientUpdate();
        statoClientUpdate.setStato(StatoClientEnum.NUOVO);

        ResponseEntity<Client> responseUpdate = clientController.updateClientStato(responseClient.getBody().getIdClient(), statoClientUpdate);

        // Asserzioni
        assertNotNull(responseUpdate.getBody());
        assertEquals(StatoClientEnum.NUOVO, responseUpdate.getBody().getStato());
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());
    }

    @Test
    void testUpdateClientStatoNotFound() {
        UUID idClientNonEsistente = UUID.randomUUID();

        // Preparazione dell'aggiornamento dello stato
        StatoClientUpdate statoClientUpdate = new StatoClientUpdate();
        statoClientUpdate.setStato(StatoClientEnum.CONFIGURATO);

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            clientController.updateClientStato(idClientNonEsistente, statoClientUpdate);
        });

        // Asserzioni
        assertEquals("Client [" + idClientNonEsistente + "] non trovato", exception.getMessage());
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    @Test
    public void testListClientSuccess() {
        OrganizzazioneCreate organizzazioneCreate = CommonUtils.getOrganizzazioneCreate();
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(organizzazioneCreate);
        assertNotNull(responseOrganizzazione.getBody());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        ClientCreate clientCreate = CommonUtils.getClientCreate();
        clientCreate.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
        clientController.createClient(clientCreate);

        ResponseEntity<PagedModelItemClient> response = clientController.listClient(
            responseSoggetto.getBody().getIdSoggetto(),
            null, null, null, null, null, null, null, 0, 10, List.of("nome"));

        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    public void testListClientEmpty() {
        ResponseEntity<PagedModelItemClient> response = clientController.listClient(
            UUID.randomUUID(), null, null, null, null, null, null, null, 0, 10, List.of("nome"));

        assertNotNull(response.getBody());
        assertTrue(response.getBody().getContent().isEmpty());
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    public void testListClientWithFilters() {
        OrganizzazioneCreate organizzazioneCreate = CommonUtils.getOrganizzazioneCreate();
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(organizzazioneCreate);
        assertNotNull(responseOrganizzazione.getBody());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        ClientCreate clientCreate = CommonUtils.getClientCreate();
        clientCreate.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
        clientCreate.setNome("NomeClient");
        clientController.createClient(clientCreate);

        ResponseEntity<PagedModelItemClient> response = clientController.listClient(
            responseSoggetto.getBody().getIdSoggetto(), "NomeClient", null, null, null, null, null, null, 0, 10, List.of("nome"));

        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());
        assertEquals("NomeClient", response.getBody().getContent().get(0).getNome());
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    
    
    @Test
    public void testListClientSuccess2() {
        // Creazione dell'organizzazione necessaria
        OrganizzazioneCreate organizzazioneCreate = CommonUtils.getOrganizzazioneCreate();
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(organizzazioneCreate);
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione del soggetto associato all'organizzazione
        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        // Creazione del client
        ClientCreate clientCreate = CommonUtils.getClientCreate();
        clientCreate.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Client> responseClient = clientController.createClient(clientCreate);
        assertNotNull(responseClient.getBody());

        // Chiamata alla listClient
        ResponseEntity<PagedModelItemClient> responseList = clientController.listClient(
            responseSoggetto.getBody().getIdSoggetto(),
            clientCreate.getNome(),
            responseOrganizzazione.getBody().getIdOrganizzazione(),
            clientCreate.getAmbiente(),
            null,
            StatoClientEnum.NUOVO,
            responseClient.getBody().getIdClient(),
            null,
            0,
            10,
            List.of("nome")
        );

        // Asserzioni
        assertNotNull(responseList.getBody());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertFalse(responseList.getBody().getContent().isEmpty());
        assertEquals(clientCreate.getNome(), responseList.getBody().getContent().get(0).getNome());
    }

    @Test
    public void testListClientNotFound() {
        UUID idSoggettoNonEsistente = UUID.randomUUID();

        ResponseEntity<PagedModelItemClient> responseList = clientController.listClient(
            idSoggettoNonEsistente,
            null,
            null,
            null,
            null,
            StatoClientEnum.NUOVO,
            null,
            null,
            0,
            10,
            List.of("nome")
        );

        assertNotNull(responseList.getBody());
        assertTrue(responseList.getBody().getContent().isEmpty());
    }

    private String pemCert = "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURhekNDQWxPZ0F3SUJBZ0lFSGZ2NzR6QU5CZ2txaGtpRzl3MEJBUXNGQURCbU1Rc3dDUVlEVlFRR0V3SkoNClZERU9NQXdHQTFVRUNCTUZTWFJoYkhreERUQUxCZ05WQkFjVEJGQnBjMkV4RFRBTEJnTlZCQW9UQkZSbGMzUXgNCkRUQUxCZ05WQkFzVEJGUmxjM1F4R2pBWUJnTlZCQU1URVVWNFlXMXdiR1ZEYkdsbGJuUXlTRk5OTUI0WERUSTANCk1EUXdPREE1TWpReE1Wb1hEVFEwTURRd016QTVNalF4TVZvd1pqRUxNQWtHQTFVRUJoTUNTVlF4RGpBTUJnTlYNCkJBZ1RCVWwwWVd4NU1RMHdDd1lEVlFRSEV3UlFhWE5oTVEwd0N3WURWUVFLRXdSVVpYTjBNUTB3Q3dZRFZRUUwNCkV3UlVaWE4wTVJvd0dBWURWUVFERXhGRmVHRnRjR3hsUTJ4cFpXNTBNa2hUVFRDQ0FTSXdEUVlKS29aSWh2Y04NCkFRRUJCUUFEZ2dFUEFEQ0NBUW9DZ2dFQkFLMmNVQ29CcWptUTR4OWZoYlJDbk0rYmJ5ZjJwSWxSa3NRUVB5clcNCmlmWUVvaCtxZ1NROVYzS05uNWJpaTBSeWMzaDd3VGNJY2tCY2ZnczhKTGk1SHhHM2t4V1p2Z2xXL1NIOEEyVHUNClFYdkJwajlLNnd6UzB4RUduenFxaHlwVXJIL1lMRGZYandnVmZ1TS9IeEU1MjNGcFM3dGUwQXcwV2Jac1pxeTYNCmhNcWxLZk8wek52UTR1Rk5ML3NHV1pNN29kaDRPcGhaSUdOZDd0VnBnVkdQNDNDZUZvZnAyeGRxcmk5Ry9IMjINCmNQa2p4dFpoVFpuZk9RejFkNHVYRjZsU3M1dUV6RGI3ZGxKOERoZTJROUtTa0ZnRDZVME83UnZyNnpibEd4dUENCjVDdTRQSFNkeko0Y0RhZkJ4RDlrclJzYjI5cXFjK2g3alpwSzh2NkhoU2N4M2VjQ0F3RUFBYU1oTUI4d0hRWUQNClZSME9CQllFRkljWmh6UlZmYVRER1MwTm44cmRJU3FGbDhOK01BMEdDU3FHU0liM0RRRUJDd1VBQTRJQkFRQXYNCitYWFNiWWVDY1VmY2hhRkNzay9sc3hLZ0gwcFhyTlRoZXptOGd3YUpOem9KOVJQU2RnenJtSzYwOWl5M1RvaGcNClhpc040elorRkx3NVBTby9HNmU1OU5SZEdmTS93UFIwUGoyN2d0dWhITWpBeU8vY3FldWQ3S1lvZWxpTEZPRWwNCldyTWo2QmlxaGZQZmMzU3FqakZVWWtoR2s2eXZFeDREWGVPNnlmNSszczJMbTIwSTM3YU9ZblhBNVdmTGJwY1QNCnp2RWhGSk02Q3d6Q0VwbmI3M3E3ekc4ODJZTjcxL3RRS1VhS2dpV0ZPeDVvQ2dCMFZGNERlejd0ZFJYNHpZRlMNCmFKeUdIQ3F6NVZvR29CSHV1K0dpZERlRkdZZTRvZTA4cFpZWjFHS1dROG05RmlhYTlSQnJNNTNFclFidzNpWncNCnVqby9UMm9MSis3NWFTb3VCamFUCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K";
    /*
    @Test
    public void testDownloadAllegatoClientSuccess() {
        // Creazione dell'organizzazione necessaria
        OrganizzazioneCreate organizzazioneCreate = CommonUtils.getOrganizzazioneCreate();
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(organizzazioneCreate);
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione del soggetto associato all'organizzazione
        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        // Creazione del client
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
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
        
        // Download dell'allegato
        ResponseEntity<Resource> responseDownload = clientController.downloadAllegatoClient(clientResponse.getBody().getIdClient(), clientResponse.getBody().getDatiSpecifici().getFinalita());

        // Asserzioni
        assertNotNull(responseDownload.getBody());
        assertEquals(HttpStatus.OK, responseDownload.getStatusCode());
    }
*/
    @Test
    public void testDownloadAllegatoClientNotFound() {
        // Creazione dell'organizzazione necessaria
        OrganizzazioneCreate organizzazioneCreate = CommonUtils.getOrganizzazioneCreate();
        ResponseEntity<Organizzazione> responseOrganizzazione = organizzazioniController.createOrganizzazione(organizzazioneCreate);
        assertNotNull(responseOrganizzazione.getBody());

        // Creazione del soggetto associato all'organizzazione
        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(responseOrganizzazione.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> responseSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertNotNull(responseSoggetto.getBody());

        // Creazione del client
        ClientCreate clientCreate = CommonUtils.getClientCreate();
        clientCreate.setIdSoggetto(responseSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Client> responseClient = clientController.createClient(clientCreate);
        assertNotNull(responseClient.getBody());

        // ID di allegato inesistente
        UUID idAllegatoNonEsistente = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            clientController.downloadAllegatoClient(responseClient.getBody().getIdClient(), idAllegatoNonEsistente);
        });

        // Asserzioni
        assertEquals("Allegato [" + idAllegatoNonEsistente + "] non trovato", exception.getMessage());
    }

}

