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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.OrganizzazioneAuthorization;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.core.dao.repositories.OrganizzazioneRepository;
import org.govway.catalogo.core.dao.repositories.SoggettoRepository;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.ItemOrganizzazione;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.OrganizzazioneUpdate;
import org.govway.catalogo.servlets.model.PagedModelItemOrganizzazione;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
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
public class OrganizzazioniTest {

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private OrganizzazioneAuthorization authorization;

    @Mock
    private CoreAuthorization coreAuthorization;

    @Autowired
    OrganizzazioneRepository org;

    @Autowired
    SoggettoRepository sog;

    @Autowired
    private SoggettoService soggettoService;

    @Autowired
    private SoggettiController soggettiController;

    @Autowired
    OrganizzazioneService serv;

    @Autowired
    UtenteService utenteService;

    @Autowired
    private OrganizzazioniController controller;

    private UUID organizzazioneId;

    private static final String UTENTE_GESTORE = "gestore";

    private static final String NOME_ORGANIZZAZIONE = "Nome Organizzazione TEST";
    private static final String DESCRIZIONE = "Questa è una descrizione di test";
    private static final String CODICE_ENTE = "xdfg686hsahgdjg";
    private static final String CODICE_FISCALE_SOGGETTO = "adljdalkhf132801";
    private static final String ID_TIPO_UTENTE = "xyz";
    private static final Boolean REFERENTE = true;
    private static final Boolean ADERENTE = false;
    private static final Boolean ESTERNA = true;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);

        when(coreAuthorization.isAnounymous()).thenReturn(true);
        SecurityContextHolder.setContext(this.securityContext);
        organizzazioneId = UUID.randomUUID();
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    public ResponseEntity<Organizzazione> getResponse() {
        OrganizzazioneCreate organizzazioneCreate = new OrganizzazioneCreate();
        organizzazioneCreate.setNome(NOME_ORGANIZZAZIONE);
        organizzazioneCreate.setDescrizione(DESCRIZIONE);
        organizzazioneCreate.setCodiceEnte(CODICE_ENTE);
        organizzazioneCreate.setCodiceFiscaleSoggetto(CODICE_FISCALE_SOGGETTO);
        organizzazioneCreate.setIdTipoUtente(ID_TIPO_UTENTE);
        organizzazioneCreate.setReferente(REFERENTE);
        organizzazioneCreate.setAderente(ADERENTE);
        organizzazioneCreate.setEsterna(ESTERNA);

        return controller.createOrganizzazione(organizzazioneCreate);
    }

    @Test
    public void testCreateOrganizzazioneSuccess() {
        ResponseEntity<Organizzazione> response = this.getResponse();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Organizzazione organizzazione = response.getBody();
        assertNotNull(organizzazione);
        assertEquals(NOME_ORGANIZZAZIONE, organizzazione.getNome());
        assertEquals(DESCRIZIONE, organizzazione.getDescrizione());
        assertEquals(CODICE_ENTE, organizzazione.getCodiceEnte());
        assertEquals(CODICE_FISCALE_SOGGETTO, organizzazione.getCodiceFiscaleSoggetto());
        assertEquals(ID_TIPO_UTENTE, organizzazione.getIdTipoUtente());
        assertEquals(REFERENTE, organizzazione.isReferente());
        assertEquals(ADERENTE, organizzazione.isAderente());
        assertEquals(ESTERNA, organizzazione.isEsterna());
        //System.out.println(organizzazione.getUtenteRichiedente());
        //System.out.println(organizzazione.getDataCreazione());
        assertNotNull(organizzazione.getDataCreazione());
        assertEquals(UTENTE_GESTORE, organizzazione.getUtenteRichiedente().getPrincipal());
    }

    @Test
    public void testCreateOrganizzazioneConflict() {
        ResponseEntity<Organizzazione> firstResponse = this.getResponse();
        assertEquals(HttpStatus.OK, firstResponse.getStatusCode());

        ConflictException exception = assertThrows(ConflictException.class, () -> {
            this.getResponse();
        });

        assertEquals("Organization [" + NOME_ORGANIZZAZIONE + "] esiste gia", exception.getMessage());
    }

    @Test
    public void testCreateOrganizzazioneUnauthorized() {
        OrganizzazioneCreate organizzazioneCreate = new OrganizzazioneCreate();
        organizzazioneCreate.setNome(NOME_ORGANIZZAZIONE);
        organizzazioneCreate.setDescrizione(DESCRIZIONE);
        organizzazioneCreate.setCodiceEnte(CODICE_ENTE);
        organizzazioneCreate.setCodiceFiscaleSoggetto(CODICE_FISCALE_SOGGETTO);
        organizzazioneCreate.setIdTipoUtente(ID_TIPO_UTENTE);
        organizzazioneCreate.setReferente(REFERENTE);
        organizzazioneCreate.setAderente(ADERENTE);
        organizzazioneCreate.setEsterna(ESTERNA);

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createOrganizzazione(organizzazioneCreate);
        });

        assertEquals("Utente non abilitato", exception.getMessage());
    }
    
    @Test
    public void testCreateOrganizzazioneUtenteAnonimo() {
        OrganizzazioneCreate organizzazioneCreate = new OrganizzazioneCreate();
        organizzazioneCreate.setNome(NOME_ORGANIZZAZIONE);
        organizzazioneCreate.setDescrizione(DESCRIZIONE);
        organizzazioneCreate.setCodiceEnte(CODICE_ENTE);
        organizzazioneCreate.setCodiceFiscaleSoggetto(CODICE_FISCALE_SOGGETTO);
        organizzazioneCreate.setIdTipoUtente(ID_TIPO_UTENTE);
        organizzazioneCreate.setReferente(REFERENTE);
        organizzazioneCreate.setAderente(ADERENTE);
        organizzazioneCreate.setEsterna(ESTERNA);

        this.tearDown();
        
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createOrganizzazione(organizzazioneCreate);
        });

        assertEquals("Utente non specificato", exception.getMessage());
    }
/*
    @Test
    @Transactional
    public void testDeleteOrganizzazioneSuccess() throws Exception {
        ResponseEntity<Organizzazione> createResponse = this.getResponse();
        assertEquals(HttpStatus.OK, createResponse.getStatusCode());
        Organizzazione organizzazione = createResponse.getBody();
        assertNotNull(organizzazione);
        UUID id = organizzazione.getIdOrganizzazione();
        Set<SoggettoEntity> soggetti = serv.find(id).get().getSoggetti();
        Hibernate.initialize(soggetti.getClass()); // Inizializza la collezione Lazy
        Iterator<SoggettoEntity> iterator = soggetti.iterator();
        while (iterator.hasNext()) {
            SoggettoEntity sogEnt = iterator.next();
            System.out.println("ID Soggetto: " + sogEnt.getIdSoggetto());
            soggettoService.delete(sogEnt);
        }
        controller.deleteOrganizzazione(id);
    }
*/
    @Test
    public void testDeleteOrganizzazioneBadRequest() {
        ResponseEntity<Organizzazione> createResponse = this.getResponse();
        assertEquals(HttpStatus.OK, createResponse.getStatusCode());
        Organizzazione organizzazione = createResponse.getBody();
        assertNotNull(organizzazione);
        UUID id = organizzazione.getIdOrganizzazione();

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.deleteOrganizzazione(id);
        });

        assertEquals("Impossibile eliminare l'organizzazione [" + organizzazione.getNome() + "]. Presenti [1] soggetti associati", exception.getMessage());
    }

    @Test
    public void testDeleteOrganizzazioneNotFound() {
        UUID nonExistentId = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.deleteOrganizzazione(nonExistentId);
        });

        assertEquals("Organization [" + nonExistentId + "] non trovata", exception.getMessage());
    }

    @Test
    public void testDeleteOrganizzazioneUnauthorized() {
        ResponseEntity<Organizzazione> createResponse = this.getResponse();
        assertEquals(HttpStatus.OK, createResponse.getStatusCode());
        Organizzazione organizzazione = createResponse.getBody();
        assertNotNull(organizzazione);
        UUID id = organizzazione.getIdOrganizzazione();

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.deleteOrganizzazione(id);
        });
        assertEquals("Utente non abilitato", exception.getMessage());
    }
    
    @Test
    public void testDeleteOrganizzazioneUtenteAnonimo() {
        ResponseEntity<Organizzazione> createResponse = this.getResponse();
        assertEquals(HttpStatus.OK, createResponse.getStatusCode());
        Organizzazione organizzazione = createResponse.getBody();
        assertNotNull(organizzazione);
        UUID id = organizzazione.getIdOrganizzazione();

        this.tearDown();
        
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.deleteOrganizzazione(id);
        });
        assertEquals("Utente non specificato", exception.getMessage());
    }

    @Test
    public void testGetOrganizzazioneSuccess() {
        ResponseEntity<Organizzazione> response = controller.getOrganizzazione(getResponse().getBody().getIdOrganizzazione());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Organizzazione organizzazione = response.getBody();
        assertNotNull(organizzazione);
        assertEquals(NOME_ORGANIZZAZIONE, organizzazione.getNome());
        assertEquals(DESCRIZIONE, organizzazione.getDescrizione());
        assertEquals(CODICE_ENTE, organizzazione.getCodiceEnte());
        assertEquals(CODICE_FISCALE_SOGGETTO, organizzazione.getCodiceFiscaleSoggetto());
        assertEquals(ID_TIPO_UTENTE, organizzazione.getIdTipoUtente());
        assertEquals(REFERENTE, organizzazione.isReferente());
        assertEquals(ADERENTE, organizzazione.isAderente());
        assertEquals(ESTERNA, organizzazione.isEsterna());
    }

    @Test
    public void testUpdateOrganizzazioneSuccess() {
        ResponseEntity<Organizzazione> createResponse = this.getResponse();
        assertEquals(HttpStatus.OK, createResponse.getStatusCode());
        Organizzazione organizzazione = createResponse.getBody();
        assertNotNull(organizzazione);
        UUID id = organizzazione.getIdOrganizzazione();

        OrganizzazioneUpdate organizzazioneUpdate = new OrganizzazioneUpdate();
        organizzazioneUpdate.setNome("Nome Organizzazione Aggiornato");
        organizzazioneUpdate.setDescrizione("Descrizione Aggiornata");
        organizzazioneUpdate.setCodiceEnte("NuovoCodiceEnte");
        organizzazioneUpdate.setCodiceFiscaleSoggetto("NuovoCodiceFiscaleSoggetto");
        organizzazioneUpdate.setIdTipoUtente("NuovoTipoUtente");
        organizzazioneUpdate.setReferente(false);
        organizzazioneUpdate.setAderente(true);
        organizzazioneUpdate.setEsterna(false);

        ResponseEntity<Organizzazione> updateResponse = controller.updateOrganizzazione(id, organizzazioneUpdate);
        assertEquals(HttpStatus.OK, updateResponse.getStatusCode());

        Organizzazione organizzazioneAggiornata = updateResponse.getBody();
        assertNotNull(organizzazioneAggiornata);
        assertEquals("Nome Organizzazione Aggiornato", organizzazioneAggiornata.getNome());
        assertEquals("Descrizione Aggiornata", organizzazioneAggiornata.getDescrizione());
        assertEquals("NuovoCodiceEnte", organizzazioneAggiornata.getCodiceEnte());
        assertEquals("NuovoCodiceFiscaleSoggetto", organizzazioneAggiornata.getCodiceFiscaleSoggetto());
        assertEquals("NuovoTipoUtente", organizzazioneAggiornata.getIdTipoUtente());
        assertEquals(false, organizzazioneAggiornata.isReferente());
        assertEquals(true, organizzazioneAggiornata.isAderente());
        assertEquals(false, organizzazioneAggiornata.isEsterna());
        //System.out.println(organizzazioneAggiornata.getDataUltimoAggiornamento());
        assertNotNull(organizzazioneAggiornata.getDataUltimoAggiornamento());
        assertNotNull(organizzazioneAggiornata.getUtenteUltimoAggiornamento());
        assertEquals(UTENTE_GESTORE, organizzazioneAggiornata.getUtenteRichiedente().getPrincipal());
    }

    @Test
    public void testListOrganizzazioniSuccess() {
        OrganizzazioneCreate organizzazioneCreate1 = new OrganizzazioneCreate();
        organizzazioneCreate1.setNome("Organizzazione TEST 1");
        organizzazioneCreate1.setDescrizione("Descrizione TEST 1");

        OrganizzazioneCreate organizzazioneCreate2 = new OrganizzazioneCreate();
        organizzazioneCreate2.setNome("Organizzazione TEST 2");
        organizzazioneCreate2.setDescrizione("Descrizione TEST 2");

        controller.createOrganizzazione(organizzazioneCreate1);
        controller.createOrganizzazione(organizzazioneCreate2);

        List<String> sort = Arrays.asList("nome,asc");
        ResponseEntity<PagedModelItemOrganizzazione> response = controller.listOrganizzazioni(
            null, null, null, null, null, null, null, null, null, null, 0, 10, sort);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        PagedModelItemOrganizzazione pagedModel = response.getBody();
        assertNotNull(pagedModel);

        List<ItemOrganizzazione> organizzazioni = new ArrayList<>(pagedModel.getContent());
        assertEquals(2, organizzazioni.size());

        ItemOrganizzazione org1 = organizzazioni.get(0);
        ItemOrganizzazione org2 = organizzazioni.get(1);

        assertEquals("Organizzazione TEST 1", org1.getNome());
        assertEquals("Organizzazione TEST 2", org2.getNome());
    }
 
    @Test
    void testListOrganizzazioniSortedNameDesc() {
    	for(int n = 0; n < 3; n++) {
	    	OrganizzazioneCreate organizzazioneCreate = new OrganizzazioneCreate();
	        organizzazioneCreate.setNome("Organizzazione TEST"+n);
	        organizzazioneCreate.setDescrizione("Descrizione TEST"+n);
	
	        controller.createOrganizzazione(organizzazioneCreate);
    	}

        List<String> sort = new ArrayList<>();
        sort.add("nome,desc");
        
        // Invocazione del metodo listOrganizzazioni con filtri
        ResponseEntity<PagedModelItemOrganizzazione> response = controller.listOrganizzazioni(
                null, null, null, null, null, null, null, null, null, null, 0, 10, sort);
        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il gruppo filtrato sia presente nell'elenco
        List<ItemOrganizzazione> listOrganizzazioni = response.getBody().getContent();
        //listOrganizzazioni.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(listOrganizzazioni.stream().anyMatch(s -> s.getNome().equals("Organizzazione TEST"+0)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals("Organizzazione TEST"+2, listOrganizzazioni.get(0).getNome());
    }
	
    @Test
    void testListOrganizzazioniSortedNameAsc() {
    	for(int n = 0; n < 3; n++) {
	    	OrganizzazioneCreate organizzazioneCreate = new OrganizzazioneCreate();
	        organizzazioneCreate.setNome("Organizzazione TEST"+n);
	        organizzazioneCreate.setDescrizione("Descrizione TEST"+n);
	
	        controller.createOrganizzazione(organizzazioneCreate);
    	}

        List<String> sort = new ArrayList<>();
        sort.add("nome,asc");
        
        // Invocazione del metodo listOrganizzazioni con filtri
        ResponseEntity<PagedModelItemOrganizzazione> response = controller.listOrganizzazioni(
                null, null, null, null, null, null, null, null, null, null, 0, 10, sort);
        // Verifica del successo
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getContent().isEmpty());

        // Verifica che il gruppo filtrato sia presente nell'elenco
        List<ItemOrganizzazione> listOrganizzazioni = response.getBody().getContent();
        //listOrganizzazioni.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(listOrganizzazioni.stream().anyMatch(s -> s.getNome().equals("Organizzazione TEST"+2)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals("Organizzazione TEST"+0, listOrganizzazioni.get(0).getNome());
    }
    
    @Test
    void testListOrganizzazioniMultiPage() {
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 50;
    	for(int n = 0; n < numeroTotaleDiElementi; n++) {
	    	OrganizzazioneCreate organizzazioneCreate = new OrganizzazioneCreate();
	        organizzazioneCreate.setNome("Organizzazione TEST"+n);
	        organizzazioneCreate.setDescrizione("Descrizione TEST"+n);
	
	        controller.createOrganizzazione(organizzazioneCreate);
    	}
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
        	ResponseEntity<PagedModelItemOrganizzazione> response = controller.listOrganizzazioni(
                    null, null, null, null, null, null, null, null, null, null, n, numeroElementiPerPagina, null);

            // Verifica del successo
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().getContent().isEmpty());
        }
    }

    @Test
    void testListOrganizzazioniEmpty() {
        // Parametri per il metodo listOrganizzazioni
        Boolean param1 = null;
        Boolean param2 = null;
        Boolean param3 = null;
        Boolean param4 = null;
        String param5 = null;
        String param6 = null;
        String param7 = null;
        UUID param8 = null;
        String param9 = null;
        String param10 = null;
        Integer page = 0;
        Integer size = 10;
        List<String> sort = Arrays.asList("nome,asc");

        // Recupera la lista delle organizzazioni senza aver creato alcuna organizzazione
        ResponseEntity<PagedModelItemOrganizzazione> response = controller.listOrganizzazioni(
            param1, param2, param3, param4, param5, param6, param7, param8, param9, param10, page, size, sort);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        // Estrai il corpo della risposta
        PagedModelItemOrganizzazione pagedModel = response.getBody();
        assertNotNull(pagedModel);

        // Verifica che la lista sia vuota
        List<ItemOrganizzazione> organizzazioni = new ArrayList<>(pagedModel.getContent());
        assertTrue(organizzazioni.isEmpty());
    }

    @Test
    void testListOrganizzazioniUtenteNonLoggato() {
        // Configura un mock di SecurityContext
        SecurityContext securityContext = Mockito.mock(SecurityContext.class);

        // Configura il contesto di sicurezza per restituire null quando viene chiamato getAuthentication
        Mockito.when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        // Parametri per il metodo listOrganizzazioni
        Boolean param1 = null;
        Boolean param2 = null;
        Boolean param3 = null;
        Boolean param4 = null;
        String param5 = null;
        String param6 = null;
        String param7 = null;
        UUID param8 = null;
        String param9 = null;
        String param10 = null;
        Integer page = 0;
        Integer size = 10;
        List<String> sort = Arrays.asList("nome,asc");

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.listOrganizzazioni(param1, param2, param3, param4, param5, param6, param7, param8, param9, param10, page, size, sort);
        });

        // Verifica che l'eccezione sia stata lanciata
        assertNotNull(exception);

        // Ripristina il contesto di sicurezza per gli altri test
        SecurityContextHolder.clearContext();

        // Ripristina il profilo autorizzato per gli altri test
        InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.findByPrincipal(UTENTE_GESTORE).get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);
    }

}
