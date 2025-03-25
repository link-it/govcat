package testsuite;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ProfiliController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.*;
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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class ProfiliTest {

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Autowired
    private UtenteService utenteService;

    @Autowired
    private ProfiliController controller;

    @Autowired
    private OrganizzazioniController organizzazioniController;

    @Autowired
    private DominiController dominiController;

    @Autowired
    private SoggettiController soggettiController;

    private static final String UTENTE_GESTORE = "gestore";

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

        InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.findByPrincipal(UTENTE_GESTORE).get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);

        SecurityContextHolder.setContext(this.securityContext);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void testCreateProfiloSuccess() throws Exception {

        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();

        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        assertEquals(HttpStatus.OK, responseProfilo.getStatusCode());
        assertEquals(CommonUtils.CODICE_INTERNO, responseProfilo.getBody().getCodiceInterno());
    }

    @Test
    public void testCreateProfiloConflict() throws Exception {

        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();

        controller.createProfilo(profiloCreate);

        ConflictException exception = assertThrows(ConflictException.class, () -> {
            controller.createProfilo(profiloCreate);
        });

        assertEquals("Profilo [" + CommonUtils.CODICE_INTERNO + "] esiste già", exception.getMessage());
    }

    @Test
    public void testCreateProfiloUnauthorized() throws Exception {

        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createProfilo(profiloCreate);
        });

        assertEquals("Utente non abilitato", exception.getMessage());
    }

    @Test
    public void testCreateProfiloUtenteAnonimo() throws Exception {

        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();

        this.tearDown();

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createProfilo(profiloCreate);
        });

        assertEquals("Utente non specificato", exception.getMessage());
    }

    @Test
    public void testGetProfiloSuccess() throws Exception {

        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();

        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Profilo> responseDelete = controller.getProfilo(responseProfilo.getBody().getIdProfilo());
        assertEquals(HttpStatus.OK, responseDelete.getStatusCode());
        assertEquals(CommonUtils.CODICE_INTERNO, responseProfilo.getBody().getCodiceInterno());
    }

    @Test
    public void testGetProfiloNotFound() throws Exception {

        UUID idProfilo = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.getProfilo(idProfilo);
        });

        assertEquals("Profilo [" + idProfilo + "] non trovato", exception.getMessage());
    }

    @Test
    public void testDeleteProfiloSuccess() throws Exception {

        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();

        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Void> responseDelete = controller.deleteProfilo(responseProfilo.getBody().getIdProfilo());
        assertEquals(HttpStatus.OK, responseDelete.getStatusCode());
    }

    @Test
    public void testDeleteProfiloNotFound() throws Exception {

        UUID idProfilo = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.deleteProfilo(idProfilo);
        });

        assertEquals("Profilo [" + idProfilo + "] non trovato", exception.getMessage());
    }

    @Test
    public void testUpdateProfiloSuccess() throws Exception {

        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();

        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ProfiloUpdate profiloUpdate = new ProfiloUpdate();
        profiloUpdate.setAuthType(AuthTypeEnum.HTTPS);
        profiloUpdate.setProfiloGovway(CommonUtils.PROFILO_GOVWAY);
        profiloUpdate.setCanaleDefault(CommonUtils.CANALE_DEFAULT);
        String newLabel = "mTLS";
        profiloUpdate.setEtichetta(newLabel);
        profiloUpdate.setCodiceInterno(CommonUtils.CODICE_INTERNO);
        profiloUpdate.setIdTokenPolicy(UUID.randomUUID());


        ResponseEntity<Profilo> responseUpdate = controller.updateProfilo(responseProfilo.getBody().getIdProfilo(), profiloUpdate);
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());
        assertEquals(newLabel, responseUpdate.getBody().getEtichetta());
        assertEquals(AuthTypeEnum.HTTPS, responseUpdate.getBody().getAuthType());
    }

    @Test
    public void testUpdateProfiloNotFound() throws Exception {

        UUID idProfilo = UUID.randomUUID();

        ProfiloUpdate profiloUpdate = new ProfiloUpdate();
        profiloUpdate.setAuthType(AuthTypeEnum.HTTPS);
        profiloUpdate.setProfiloGovway(CommonUtils.PROFILO_GOVWAY);
        profiloUpdate.setCanaleDefault(CommonUtils.CANALE_DEFAULT);
        String newLabel = "mTLS";
        profiloUpdate.setEtichetta(newLabel);
        profiloUpdate.setCodiceInterno(CommonUtils.CODICE_INTERNO);
        profiloUpdate.setIdTokenPolicy(UUID.randomUUID());

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.updateProfilo(idProfilo, profiloUpdate);
        });

        assertEquals("Profilo [" + idProfilo + "] non trovato", exception.getMessage());
    }

    @Test
    public void testListProfiliSuccessNoFilters() {

        ProfiloCreate profiloCreate1 = CommonUtils.getProfiloCreate();
        controller.createProfilo(profiloCreate1);

        ProfiloCreate profiloCreate2 = CommonUtils.getProfiloCreate();
        profiloCreate2.setCodiceInterno("INTERNO_HTTPS");
        controller.createProfilo(profiloCreate2);

        ResponseEntity<PagedModelItemProfilo> responseList = controller.listProfili(null, 0, 10, null);

        assertNotNull(responseList.getBody());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertEquals(2, responseList.getBody().getContent().size());
    }

    @Test
    public void testListProfiliSuccessWithFilters() {

        ProfiloCreate profiloCreate1 = CommonUtils.getProfiloCreate();
        controller.createProfilo(profiloCreate1);

        ProfiloCreate profiloCreate2 = CommonUtils.getProfiloCreate();
        profiloCreate2.setCodiceInterno("INTERNO_HTTPS");
        controller.createProfilo(profiloCreate2);

        ResponseEntity<PagedModelItemProfilo> responseList = controller.listProfili(CommonUtils.ETICHETTA, 0, 10, null);

        assertNotNull(responseList.getBody());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertEquals(2, responseList.getBody().getContent().size());

        ResponseEntity<PagedModelItemProfilo> responseList2 = controller.listProfili("HTTPS", 0, 10, null);

        assertNotNull(responseList2.getBody());
        assertEquals(HttpStatus.OK, responseList2.getStatusCode());
        assertEquals(1, responseList2.getBody().getContent().size());
    }

    @Test
    public void testListProfiliSuccessSortedCodiceInternoDesc() {

        ProfiloCreate profiloCreate1 = CommonUtils.getProfiloCreate();
        String codiceInterno1 = profiloCreate1.getCodiceInterno() + "A";
        profiloCreate1.setCodiceInterno(codiceInterno1);
        controller.createProfilo(profiloCreate1);

        ProfiloCreate profiloCreate2 = CommonUtils.getProfiloCreate();
        String codiceInterno2 = profiloCreate1.getCodiceInterno() + "B";
        profiloCreate2.setCodiceInterno(codiceInterno2);
        controller.createProfilo(profiloCreate2);

        List<String> sort = new ArrayList<>();
        sort.add("codiceInterno,desc");
        ResponseEntity<PagedModelItemProfilo> responseList = controller.listProfili(null, 0, 10, sort);

        assertNotNull(responseList.getBody());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertEquals(2, responseList.getBody().getContent().size());
        assertEquals(codiceInterno2, responseList.getBody().getContent().get(0).getCodiceInterno());
        assertEquals(codiceInterno1, responseList.getBody().getContent().get(1).getCodiceInterno());
    }

    @Test
    public void testListProfiliSuccessSortedCodiceInternoAsc() {

        ProfiloCreate profiloCreate1 = CommonUtils.getProfiloCreate();
        String codiceInterno1 = profiloCreate1.getCodiceInterno() + "A";
        profiloCreate1.setCodiceInterno(codiceInterno1);
        controller.createProfilo(profiloCreate1);

        ProfiloCreate profiloCreate2 = CommonUtils.getProfiloCreate();
        String codiceInterno2 = profiloCreate1.getCodiceInterno() + "B";
        profiloCreate2.setCodiceInterno(codiceInterno2);
        controller.createProfilo(profiloCreate2);

        List<String> sort = new ArrayList<>();
        sort.add("codiceInterno,asc");
        ResponseEntity<PagedModelItemProfilo> responseList = controller.listProfili(null, 0, 10, sort);

        assertNotNull(responseList.getBody());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertEquals(2, responseList.getBody().getContent().size());
        assertEquals(codiceInterno1, responseList.getBody().getContent().get(0).getCodiceInterno());
        assertEquals(codiceInterno2, responseList.getBody().getContent().get(1).getCodiceInterno());
    }
    @Test
    public void testListProfiliMultiPage() {

        int numeroElementiPerPagina = 10;
        int numeroTotaleDiElementi = 50;
        int numeroPagine = numeroTotaleDiElementi / numeroElementiPerPagina;
        for (int i = 0; i < numeroTotaleDiElementi; i++) {
            ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
            profiloCreate.setCodiceInterno("INTERNO_" + i);
            controller.createProfilo(profiloCreate);
        }

        for(int n = 0; n < numeroPagine; n++) {
            ResponseEntity<PagedModelItemProfilo> responseList = controller.listProfili(null, n, numeroElementiPerPagina, null);
            // Verifica del successo
            assertEquals(HttpStatus.OK, responseList.getStatusCode());
            assertNotNull(responseList.getBody());
            assertFalse(responseList.getBody().getContent().isEmpty());
            assertEquals(numeroElementiPerPagina, responseList.getBody().getContent().size());
            assertEquals(numeroTotaleDiElementi, responseList.getBody().getPage().getTotalElements());
            assertEquals(numeroElementiPerPagina, responseList.getBody().getPage().getSize());
            assertEquals(numeroPagine, responseList.getBody().getPage().getTotalPages());
        }
    }

    @Test
    public void testListProfiliUnauthorized() {

        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        controller.createProfilo(profiloCreate);

        this.tearDown();

        assertThrows(NotAuthorizedException.class, () -> {
            controller.listProfili(null, 0, 10, null);
        });
    }

    @Test
    public void testAddDominioProfiloSuccess() {
        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = CommonUtils.getDominioCreate();
        dominioCreate.setSkipCollaudo(true);
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());


        ResponseEntity<Dominio> responseAdd = controller.addDominioProfilo(responseProfilo.getBody().getIdProfilo(), createdDominio.getBody().getIdDominio());
        assertEquals(HttpStatus.OK, responseAdd.getStatusCode());
        assertEquals(CommonUtils.NOME_DOMINIO, responseAdd.getBody().getNome());
    }

    @Test
    public void testAddDominioProfiloNotFoundProfilo() {
        UUID idProfilo = UUID.randomUUID();

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = CommonUtils.getDominioCreate();
        dominioCreate.setSkipCollaudo(true);
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.addDominioProfilo(idProfilo, createdDominio.getBody().getIdDominio());
        });

        assertEquals("Profilo [" + idProfilo + "] non trovato", exception.getMessage());
    }

    @Test
    public void testAddDominioProfiloNotFoundDominio() {
        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        UUID idDominio = UUID.randomUUID();


        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.addDominioProfilo(responseProfilo.getBody().getIdProfilo(), idDominio);
        });

        assertEquals("Dominio [" + idDominio + "] non trovato", exception.getMessage());
    }

    @Test
    public void testAddDominioProfiloUnauthorized() {
        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = CommonUtils.getDominioCreate();
        dominioCreate.setSkipCollaudo(true);
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.addDominioProfilo(responseProfilo.getBody().getIdProfilo(), createdDominio.getBody().getIdDominio());
        });

        assertEquals("Una associazione tra Dominio e Profilo può essere creata solo con Ruolo " + UtenteEntity.Ruolo.AMMINISTRATORE, exception.getMessage());
    }

    @Test
    public void testAddSoggettoProfiloSuccess() {
        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());


        ResponseEntity<Soggetto> responseAdd = controller.addSoggettoProfilo(responseProfilo.getBody().getIdProfilo(), createdSoggetto.getBody().getIdSoggetto());
        assertEquals(HttpStatus.OK, responseAdd.getStatusCode());
        assertEquals(CommonUtils.NOME_SOGGETTO, responseAdd.getBody().getNome());
    }

    @Test
    public void testAddSoggettoProfiloNotFoundProfilo() {
        UUID idProfilo = UUID.randomUUID();

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.addSoggettoProfilo(idProfilo, createdSoggetto.getBody().getIdSoggetto());
        });

        assertEquals("Profilo [" + idProfilo + "] non trovato", exception.getMessage());
    }

    @Test
    public void testAddSoggettoProfiloNotFoundSoggetto() {
        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        UUID idSoggetto = UUID.randomUUID();


        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.addSoggettoProfilo(responseProfilo.getBody().getIdProfilo(), idSoggetto);
        });

        assertEquals("Soggetto [" + idSoggetto + "] non trovato", exception.getMessage());
    }

    @Test
    public void testAddSoggettoProfiloUnauthorized() {
        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.addSoggettoProfilo(responseProfilo.getBody().getIdProfilo(), createdSoggetto.getBody().getIdSoggetto());
        });

        assertEquals("Una associazione tra Soggetto e Profilo può essere creata solo con Ruolo " + UtenteEntity.Ruolo.AMMINISTRATORE, exception.getMessage());
    }

    @Test
    public void testDeleteDominioProfiloSuccess() {
        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = CommonUtils.getDominioCreate();
        dominioCreate.setSkipCollaudo(true);
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        ResponseEntity<Dominio> responseAdd = controller.addDominioProfilo(responseProfilo.getBody().getIdProfilo(), createdDominio.getBody().getIdDominio());
        assertEquals(HttpStatus.OK, responseAdd.getStatusCode());


        ResponseEntity<Void> responseDelete = controller.deleteDominioProfilo(responseProfilo.getBody().getIdProfilo(), createdDominio.getBody().getIdDominio());
        assertEquals(HttpStatus.OK, responseDelete.getStatusCode());

    }

    @Test
    public void testDeleteDominioProfiloNotFound() {
        UUID idProfilo = UUID.randomUUID();
        UUID idDominio = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.deleteDominioProfilo(idProfilo, idDominio);
        });

        assertEquals("Associazione tra Profilo ["+idProfilo+"] e Dominio ["+idDominio+"] non trovata", exception.getMessage());
    }


    @Test
    public void testDeleteDominioProfiloUnauthorized() {
        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = CommonUtils.getDominioCreate();
        dominioCreate.setSkipCollaudo(true);
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        ResponseEntity<Dominio> responseAdd = controller.addDominioProfilo(responseProfilo.getBody().getIdProfilo(), createdDominio.getBody().getIdDominio());
        assertEquals(HttpStatus.OK, responseAdd.getStatusCode());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.deleteDominioProfilo(responseProfilo.getBody().getIdProfilo(), createdDominio.getBody().getIdDominio());
        });

        assertEquals("Una associazione tra Dominio e Profilo può essere eliminata solo con Ruolo " + UtenteEntity.Ruolo.AMMINISTRATORE, exception.getMessage());
    }

    @Test
    public void testDeleteSoggettoProfiloSuccess() {
        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        ResponseEntity<Soggetto> responseAdd = controller.addSoggettoProfilo(responseProfilo.getBody().getIdProfilo(), createdSoggetto.getBody().getIdSoggetto());
        assertEquals(HttpStatus.OK, responseAdd.getStatusCode());


        ResponseEntity<Void> responseDelete = controller.deleteSoggettoProfilo(responseProfilo.getBody().getIdProfilo(), createdSoggetto.getBody().getIdSoggetto());
        assertEquals(HttpStatus.OK, responseDelete.getStatusCode());

    }

    @Test
    public void testDeleteSoggettoProfiloNotFound() {
        UUID idProfilo = UUID.randomUUID();
        UUID idSoggetto = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.deleteSoggettoProfilo(idProfilo, idSoggetto);
        });

        assertEquals("Associazione tra Profilo ["+idProfilo+"] e Soggetto ["+idSoggetto+"] non trovata", exception.getMessage());
    }


    @Test
    public void testDeleteSoggettoProfiloUnauthorized() {
        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        ResponseEntity<Soggetto> responseAdd = controller.addSoggettoProfilo(responseProfilo.getBody().getIdProfilo(), createdSoggetto.getBody().getIdSoggetto());
        assertEquals(HttpStatus.OK, responseAdd.getStatusCode());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.deleteSoggettoProfilo(responseProfilo.getBody().getIdProfilo(), createdSoggetto.getBody().getIdSoggetto());
        });

        assertEquals("Una associazione tra Soggetto e Profilo può essere eliminata solo con Ruolo " + UtenteEntity.Ruolo.AMMINISTRATORE, exception.getMessage());
    }

    @Test
    public void testListDominiProfiloSuccessNoFilters() {

        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = CommonUtils.getDominioCreate();
        dominioCreate.setSkipCollaudo(true);
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        DominioCreate dominioCreate2 = CommonUtils.getDominioCreate();
        dominioCreate2.setSkipCollaudo(true);
        dominioCreate2.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        dominioCreate2.setNome("Dominio 2");
        ResponseEntity<Dominio> createdDominio2 = dominiController.createDominio(dominioCreate2);
        assertEquals(HttpStatus.OK, createdDominio2.getStatusCode());

        ResponseEntity<Dominio> responseAdd = controller.addDominioProfilo(responseProfilo.getBody().getIdProfilo(), createdDominio.getBody().getIdDominio());
        assertEquals(HttpStatus.OK, responseAdd.getStatusCode());

        ResponseEntity<Dominio> responseAdd2 = controller.addDominioProfilo(responseProfilo.getBody().getIdProfilo(), createdDominio2.getBody().getIdDominio());
        assertEquals(HttpStatus.OK, responseAdd2.getStatusCode());

        ResponseEntity<PagedModelItemDominio> responseList = controller.listDominiProfilo(null, null, 0, 10, null);

        assertNotNull(responseList.getBody());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertEquals(2, responseList.getBody().getContent().size());
    }

    @Test
    public void testListDominiProfiloSuccessWithFilters() {

        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = CommonUtils.getDominioCreate();
        dominioCreate.setSkipCollaudo(true);
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        DominioCreate dominioCreate2 = CommonUtils.getDominioCreate();
        dominioCreate2.setSkipCollaudo(true);
        dominioCreate2.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        dominioCreate2.setNome("Dominio 2");
        ResponseEntity<Dominio> createdDominio2 = dominiController.createDominio(dominioCreate2);
        assertEquals(HttpStatus.OK, createdDominio2.getStatusCode());

        ResponseEntity<Dominio> responseAdd = controller.addDominioProfilo(responseProfilo.getBody().getIdProfilo(), createdDominio.getBody().getIdDominio());
        assertEquals(HttpStatus.OK, responseAdd.getStatusCode());

        ResponseEntity<Dominio> responseAdd2 = controller.addDominioProfilo(responseProfilo.getBody().getIdProfilo(), createdDominio2.getBody().getIdDominio());
        assertEquals(HttpStatus.OK, responseAdd2.getStatusCode());

        ResponseEntity<PagedModelItemDominio> responseList = controller.listDominiProfilo(null, "Dominio 2", 0, 10, null);

        assertNotNull(responseList.getBody());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertEquals(1, responseList.getBody().getContent().size());

        ResponseEntity<PagedModelItemDominio> responseList2 = controller.listDominiProfilo(responseProfilo.getBody().getIdProfilo(), null, 0, 10, null);

        assertNotNull(responseList2.getBody());
        assertEquals(HttpStatus.OK, responseList2.getStatusCode());
        assertEquals(2, responseList2.getBody().getContent().size());
    }

    @Test
    public void testListDominiProfiloUnauthorized() {

        this.tearDown();

        assertThrows(NotAuthorizedException.class, () -> {
            controller.listDominiProfilo(null, null, 0, 10, null);
        });
    }

    @Test
    public void testListSoggettiProfiloSuccessNoFilters() {

        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        SoggettoCreate soggettoCreate2 = CommonUtils.getSoggettoCreate();
        soggettoCreate2.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate2.setSkipCollaudo(true);
        soggettoCreate2.setNome("Soggetto 2");
        ResponseEntity<Soggetto> createdSoggetto2 = soggettiController.createSoggetto(soggettoCreate2);
        assertEquals(HttpStatus.OK, createdSoggetto2.getStatusCode());


        ResponseEntity<Soggetto> responseAdd = controller.addSoggettoProfilo(responseProfilo.getBody().getIdProfilo(), createdSoggetto.getBody().getIdSoggetto());
        assertEquals(HttpStatus.OK, responseAdd.getStatusCode());

        ResponseEntity<Soggetto> responseAdd2 = controller.addSoggettoProfilo(responseProfilo.getBody().getIdProfilo(), createdSoggetto2.getBody().getIdSoggetto());
        assertEquals(HttpStatus.OK, responseAdd2.getStatusCode());

        ResponseEntity<PagedModelItemSoggetto> responseList = controller.listSoggettiProfilo(null, null, 0, 10, null);

        assertNotNull(responseList.getBody());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertEquals(2, responseList.getBody().getContent().size());
    }

    @Test
    public void testListSoggettiProfiloSuccessWithFilters() {

        ProfiloCreate profiloCreate = CommonUtils.getProfiloCreate();
        ResponseEntity<Profilo> responseProfilo = controller.createProfilo(profiloCreate);
        assertNotNull(responseProfilo.getBody());

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = CommonUtils.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setSkipCollaudo(true);
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        SoggettoCreate soggettoCreate2 = CommonUtils.getSoggettoCreate();
        soggettoCreate2.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate2.setSkipCollaudo(true);
        soggettoCreate2.setNome("Soggetto 2");
        ResponseEntity<Soggetto> createdSoggetto2 = soggettiController.createSoggetto(soggettoCreate2);
        assertEquals(HttpStatus.OK, createdSoggetto2.getStatusCode());


        ResponseEntity<Soggetto> responseAdd = controller.addSoggettoProfilo(responseProfilo.getBody().getIdProfilo(), createdSoggetto.getBody().getIdSoggetto());
        assertEquals(HttpStatus.OK, responseAdd.getStatusCode());

        ResponseEntity<Soggetto> responseAdd2 = controller.addSoggettoProfilo(responseProfilo.getBody().getIdProfilo(), createdSoggetto2.getBody().getIdSoggetto());
        assertEquals(HttpStatus.OK, responseAdd2.getStatusCode());

        ResponseEntity<PagedModelItemSoggetto> responseList = controller.listSoggettiProfilo(responseProfilo.getBody().getIdProfilo(), null, 0, 10, null);
        assertNotNull(responseList.getBody());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertEquals(2, responseList.getBody().getContent().size());

        ResponseEntity<PagedModelItemSoggetto> responseList2 = controller.listSoggettiProfilo(null, "Soggetto 2", 0, 10, null);
        assertNotNull(responseList2.getBody());
        assertEquals(HttpStatus.OK, responseList2.getStatusCode());
        assertEquals(1, responseList2.getBody().getContent().size());
    }

    @Test
    public void testListSoggettiProfiloUnauthorized() {

        this.tearDown();

        assertThrows(NotAuthorizedException.class, () -> {
            controller.listSoggettiProfilo(null, null, 0, 10, null);
        });
    }
}
