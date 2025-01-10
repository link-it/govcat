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
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.controllers.ClientController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.core.dao.repositories.ClientRepository;
import org.govway.catalogo.core.services.ClientService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.AmbienteEnum;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.AuthTypeHttpBasicCreate;
import org.govway.catalogo.servlets.model.Client;
import org.govway.catalogo.servlets.model.ClientCreate;
import org.govway.catalogo.servlets.model.ClientUpdate;
import org.govway.catalogo.servlets.model.DatiSpecificiClientCreate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.RateLimiting;
import org.govway.catalogo.servlets.model.RateLimitingPeriodoEnum;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.StatoClientEnum;
import org.govway.catalogo.servlets.model.StatoClientUpdate;
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

}

