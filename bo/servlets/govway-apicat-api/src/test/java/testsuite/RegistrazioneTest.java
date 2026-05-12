/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.RegistrazioneController;
import org.govway.catalogo.core.dao.repositories.RegistrazioneUtenteRepository;
import org.govway.catalogo.core.orm.entity.RegistrazioneUtenteEntity;
import org.govway.catalogo.core.orm.entity.RegistrazioneUtenteEntity.StatoRegistrazione;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteOrganizzazioneEntity;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.RegistrazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneUtente;
import org.govway.catalogo.servlets.model.CodiceInviato;
import org.govway.catalogo.servlets.model.EsitoRegistrazioneEnum;
import org.govway.catalogo.servlets.model.Idm;
import org.govway.catalogo.servlets.model.ItemOrganizzazione;
import org.govway.catalogo.servlets.model.ModificaEmailRequest;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.PagedModelItemOrganizzazione;
import org.govway.catalogo.servlets.model.RisultatoRegistrazione;
import org.govway.catalogo.servlets.model.RisultatoVerifica;
import org.govway.catalogo.servlets.model.SelezionaOrganizzazioneRequest;
import org.govway.catalogo.servlets.model.StatoRegistrazioneEnum;
import org.govway.catalogo.servlets.model.VerificaCodiceRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.groovy.template.GroovyTemplateAutoConfiguration;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

/**
 * Test per il flusso di registrazione al primo login con verifica email.
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class RegistrazioneTest {

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Autowired
    private RegistrazioneController controller;

    @Autowired
    private RegistrazioneService registrazioneService;

    @Autowired
    private UtenteService utenteService;

    @Autowired
    private RegistrazioneUtenteRepository registrazioneRepository;

    @Autowired
    private OrganizzazioniController organizzazioniController;

    @Autowired
    private OrganizzazioneService organizzazioneService;

    @Autowired
    private Configurazione configurazione;

    @MockBean
    private RequestUtils requestUtils;

    @MockBean
    private JavaMailSender mailSender;

    private static final String TEST_PRINCIPAL = "TSTNEW80A01H501Z";
    private static final String TEST_EMAIL_JWT = "test.new@example.com";
    private static final String TEST_EMAIL_AZIENDALE = "test.new@azienda.com";
    private static final String TEST_NOME = "TestNome";
    private static final String TEST_COGNOME = "TestCognome";

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);
        SecurityContextHolder.setContext(this.securityContext);

        // Setup mock per l'invio email MIME multipart
        when(this.mailSender.createMimeMessage()).thenReturn(new jakarta.mail.internet.MimeMessage((jakarta.mail.Session) null));

        // Abilita la feature di verifica email al primo login
        if (this.configurazione.getUtente() == null) {
            this.configurazione.setUtente(new ConfigurazioneUtente());
        }
        this.configurazione.getUtente().setFirstloginVerificaEmailAbilitata(true);
        this.configurazione.getUtente().setAutoabilitazioneAbilitata(true);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /**
     * Configura il mock per simulare un utente JWT non registrato.
     */
    private void setupMockForUnregisteredUser(String principal, String email, String nome, String cognome) {
        InfoProfilo infoProfilo = new InfoProfilo(principal, null, List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfilo);
        when(this.requestUtils.getPrincipal(false)).thenReturn(infoProfilo);

        Idm idm = new Idm();
        idm.setNome(nome);
        idm.setCognome(cognome);
        idm.setEmail(email);
        when(this.requestUtils.getIdm()).thenReturn(idm);
    }

    // ==================== Test getStatoRegistrazione ====================

    @Test
    public void testGetStatoRegistrazione_UtenteNonRegistrato() {
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        ResponseEntity<org.govway.catalogo.servlets.model.StatoRegistrazione> response =
            controller.getStatoRegistrazione();

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(StatoRegistrazioneEnum.IN_ATTESA_CONFERMA, response.getBody().getStato());
        assertEquals(TEST_EMAIL_JWT, response.getBody().getEmailJwt());
        assertEquals(TEST_NOME, response.getBody().getNome());
        assertEquals(TEST_COGNOME, response.getBody().getCognome());
    }

    @Test
    public void testGetStatoRegistrazione_FeatureDisabilitata() {
        this.configurazione.getUtente().setFirstloginVerificaEmailAbilitata(false);
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.getStatoRegistrazione();
        });

        assertEquals("REG.400.NOT.ENABLED", exception.getMessage());
    }

    @Test
    public void testGetStatoRegistrazione_UtenteNonAutenticato() {
        when(this.requestUtils.getPrincipal(false)).thenReturn(null);

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.getStatoRegistrazione();
        });

        assertEquals("AUT.403", exception.getMessage());
    }

    // ==================== Test confermaEmailJwt ====================

    @Test
    public void testConfermaEmailJwt_NuovoUtente() {
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        ResponseEntity<RisultatoRegistrazione> response = controller.confermaEmailJwt();

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(EsitoRegistrazioneEnum.NUOVO_UTENTE, response.getBody().getEsito());
        assertNotNull(response.getBody().getProfilo());

        // Verifica che l'utente sia stato creato nel database
        assertTrue(this.utenteService.findByPrincipal(TEST_PRINCIPAL).isPresent());
    }

    @Test
    public void testConfermaEmailJwt_FeatureDisabilitata() {
        this.configurazione.getUtente().setFirstloginVerificaEmailAbilitata(false);
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.confermaEmailJwt();
        });

        assertEquals("REG.400.NOT.ENABLED", exception.getMessage());
    }

    // ==================== Test modificaEmail ====================

    @Test
    public void testModificaEmail_Success() {
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        ModificaEmailRequest request = new ModificaEmailRequest();
        request.setEmail(TEST_EMAIL_AZIENDALE);

        ResponseEntity<org.govway.catalogo.servlets.model.StatoRegistrazione> response =
            controller.modificaEmail(request);

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(StatoRegistrazioneEnum.IN_ATTESA_CONFERMA, response.getBody().getStato());

        // Verifica che la registrazione sia stata aggiornata
        Optional<RegistrazioneUtenteEntity> reg = registrazioneRepository.findByPrincipal(TEST_PRINCIPAL);
        assertTrue(reg.isPresent());
        assertEquals(TEST_EMAIL_AZIENDALE, reg.get().getEmailProposta());
    }

    // ==================== Test inviaCodiceVerifica ====================

    @Test
    public void testInviaCodiceVerifica_Success() {
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        // Prima crea la registrazione
        controller.getStatoRegistrazione();

        ResponseEntity<CodiceInviato> response = controller.inviaCodiceVerifica();

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody().getMessaggio());
        assertTrue(response.getBody().getScadenzaSecondi() > 0);

        // Verifica che il codice sia stato salvato
        Optional<RegistrazioneUtenteEntity> reg = registrazioneRepository.findByPrincipal(TEST_PRINCIPAL);
        assertTrue(reg.isPresent());
        assertNotNull(reg.get().getCodiceVerifica());
        assertNotNull(reg.get().getCodiceVerificaScadenza());
    }

    // ==================== Test verificaCodice ====================

    @Test
    public void testVerificaCodice_CodiceCorretto() {
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        // Prepara una registrazione con codice valido
        RegistrazioneUtenteEntity reg = new RegistrazioneUtenteEntity();
        reg.setPrincipal(TEST_PRINCIPAL);
        reg.setNome(TEST_NOME);
        reg.setCognome(TEST_COGNOME);
        reg.setEmailJwt(TEST_EMAIL_JWT);
        reg.setCodiceVerifica("ABC123");
        reg.setCodiceVerificaScadenza(new Date(System.currentTimeMillis() + 300000));
        reg.setStato(StatoRegistrazione.EMAIL_SENT);
        reg.setTentativiVerifica(0);
        reg.setTentativiTotali(1);
        reg.setDataCreazione(new Date());
        registrazioneRepository.save(reg);

        VerificaCodiceRequest request = new VerificaCodiceRequest();
        request.setCodice("ABC123");

        ResponseEntity<RisultatoVerifica> response = controller.verificaCodice(request);

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEsito());
        assertEquals("Email verificata con successo", response.getBody().getMessaggio());
    }

    @Test
    public void testVerificaCodice_CodiceErrato() {
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        // Prepara una registrazione con codice valido
        RegistrazioneUtenteEntity reg = new RegistrazioneUtenteEntity();
        reg.setPrincipal(TEST_PRINCIPAL);
        reg.setNome(TEST_NOME);
        reg.setCognome(TEST_COGNOME);
        reg.setEmailJwt(TEST_EMAIL_JWT);
        reg.setCodiceVerifica("ABC123");
        reg.setCodiceVerificaScadenza(new Date(System.currentTimeMillis() + 300000));
        reg.setStato(StatoRegistrazione.EMAIL_SENT);
        reg.setTentativiVerifica(0);
        reg.setTentativiTotali(1);
        reg.setDataCreazione(new Date());
        registrazioneRepository.save(reg);

        VerificaCodiceRequest request = new VerificaCodiceRequest();
        request.setCodice("WRONG1");

        ResponseEntity<RisultatoVerifica> response = controller.verificaCodice(request);

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(false, response.getBody().isEsito());
        assertTrue(response.getBody().getMessaggio().contains("Codice errato"));
    }

    @Test
    public void testVerificaCodice_NessunCodiceInviato() {
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        // Crea registrazione senza codice
        RegistrazioneUtenteEntity reg = new RegistrazioneUtenteEntity();
        reg.setPrincipal(TEST_PRINCIPAL);
        reg.setNome(TEST_NOME);
        reg.setCognome(TEST_COGNOME);
        reg.setEmailJwt(TEST_EMAIL_JWT);
        reg.setStato(StatoRegistrazione.PENDING);
        reg.setTentativiVerifica(0);
        reg.setTentativiTotali(0);
        reg.setDataCreazione(new Date());
        registrazioneRepository.save(reg);

        VerificaCodiceRequest request = new VerificaCodiceRequest();
        request.setCodice("ABC123");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.verificaCodice(request);
        });

        assertEquals("REG.400.NO.CODE", exception.getMessage());
    }

    @Test
    public void testVerificaCodice_NessunaRegistrazione() {
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        VerificaCodiceRequest request = new VerificaCodiceRequest();
        request.setCodice("ABC123");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.verificaCodice(request);
        });

        assertEquals("REG.400.NO.REGISTRATION", exception.getMessage());
    }

    // ==================== Test completaRegistrazione ====================

    @Test
    public void testCompletaRegistrazione_EmailVerificata() {
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        // Prepara una registrazione con email verificata
        RegistrazioneUtenteEntity reg = new RegistrazioneUtenteEntity();
        reg.setPrincipal(TEST_PRINCIPAL);
        reg.setNome(TEST_NOME);
        reg.setCognome(TEST_COGNOME);
        reg.setEmailJwt(TEST_EMAIL_JWT);
        reg.setEmailProposta(TEST_EMAIL_AZIENDALE);
        reg.setStato(StatoRegistrazione.VERIFIED);
        reg.setTentativiVerifica(1);
        reg.setTentativiTotali(1);
        reg.setDataCreazione(new Date());
        registrazioneRepository.save(reg);

        ResponseEntity<RisultatoRegistrazione> response = controller.completaRegistrazione();

        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(EsitoRegistrazioneEnum.NUOVO_UTENTE, response.getBody().getEsito());
        assertNotNull(response.getBody().getProfilo());

        // Verifica che l'utente sia stato creato con l'email aziendale
        assertTrue(this.utenteService.findByPrincipal(TEST_PRINCIPAL).isPresent());
    }

    @Test
    public void testCompletaRegistrazione_EmailNonVerificata() {
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        // Prepara una registrazione senza email verificata
        RegistrazioneUtenteEntity reg = new RegistrazioneUtenteEntity();
        reg.setPrincipal(TEST_PRINCIPAL);
        reg.setNome(TEST_NOME);
        reg.setCognome(TEST_COGNOME);
        reg.setEmailJwt(TEST_EMAIL_JWT);
        reg.setStato(StatoRegistrazione.PENDING);
        reg.setTentativiVerifica(0);
        reg.setTentativiTotali(0);
        reg.setDataCreazione(new Date());
        registrazioneRepository.save(reg);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.completaRegistrazione();
        });

        assertEquals("REG.400.NOT.VERIFIED", exception.getMessage());
    }

    // ==================== Test flusso completo ====================

    @Test
    public void testFlussoCompleto_ConfermaEmailJwtDiretta() {
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        // Step 1: Ottieni stato registrazione
        ResponseEntity<org.govway.catalogo.servlets.model.StatoRegistrazione> statoResponse =
            controller.getStatoRegistrazione();
        assertEquals(StatoRegistrazioneEnum.IN_ATTESA_CONFERMA, statoResponse.getBody().getStato());

        // Step 2: Conferma email JWT direttamente (senza verifica)
        ResponseEntity<RisultatoRegistrazione> risultato = controller.confermaEmailJwt();
        assertEquals(EsitoRegistrazioneEnum.NUOVO_UTENTE, risultato.getBody().getEsito());
        assertNotNull(risultato.getBody().getProfilo());

        // Verifica finale
        assertTrue(this.utenteService.findByPrincipal(TEST_PRINCIPAL).isPresent());
    }

    // ==================== Test selezione organizzazione ====================

    /**
     * Crea direttamente un'organizzazione di test tramite il service, bypassando
     * l'authorization del controller (il chiamante in registrazione non è autorizzato
     * a creare organizzazioni).
     */
    private UUID setupOrganizzazioneDiTest() {
        return creaOrganizzazione("OrgTestReg_" + System.nanoTime());
    }

    private UUID creaOrganizzazione(String nome) {
        OrganizzazioneEntity org = new OrganizzazioneEntity();
        org.setIdOrganizzazione(UUID.randomUUID().toString());
        org.setNome(nome);
        org.setDescrizione("Organizzazione di test per RegistrazioneTest");
        org.setCodiceEnte("CODE" + (System.nanoTime() % 1000000));
        org.setCodiceFiscaleSoggetto("CF" + (System.nanoTime() % 10000000));
        org.setReferente(true);
        org.setAderente(false);
        org.setEsterna(false);
        this.organizzazioneService.save(org);
        return UUID.fromString(org.getIdOrganizzazione());
    }

    @Test
    public void testSelezionaOrganizzazione_NuovaSelezione() {
        UUID idOrg = setupOrganizzazioneDiTest();
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        SelezionaOrganizzazioneRequest req = new SelezionaOrganizzazioneRequest();
        req.setIdOrganizzazione(idOrg);

        ResponseEntity<org.govway.catalogo.servlets.model.StatoRegistrazione> resp =
            controller.selezionaOrganizzazioneRegistrazione(req);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody().getOrganizzazioneRichiesta());
        assertEquals(idOrg, resp.getBody().getOrganizzazioneRichiesta().getIdOrganizzazione());

        // Verifica persistenza
        Optional<RegistrazioneUtenteEntity> reg = registrazioneRepository.findByPrincipal(TEST_PRINCIPAL);
        assertTrue(reg.isPresent());
        assertNotNull(reg.get().getOrganizzazioneRichiesta());
        assertEquals(idOrg.toString(), reg.get().getOrganizzazioneRichiesta().getIdOrganizzazione());
    }

    @Test
    public void testSelezionaOrganizzazione_OrgInesistente() {
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        SelezionaOrganizzazioneRequest req = new SelezionaOrganizzazioneRequest();
        req.setIdOrganizzazione(UUID.randomUUID());

        NotFoundException ex = assertThrows(NotFoundException.class, () -> {
            controller.selezionaOrganizzazioneRegistrazione(req);
        });
        assertEquals("REG.404.ORG.NOT.FOUND", ex.getMessage());
    }

    @Test
    public void testRimuoviOrganizzazione_Success() {
        UUID idOrg = setupOrganizzazioneDiTest();
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        // Prima seleziono
        SelezionaOrganizzazioneRequest req = new SelezionaOrganizzazioneRequest();
        req.setIdOrganizzazione(idOrg);
        controller.selezionaOrganizzazioneRegistrazione(req);

        // Poi rimuovo
        ResponseEntity<org.govway.catalogo.servlets.model.StatoRegistrazione> resp =
            controller.rimuoviOrganizzazioneRegistrazione();

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNull(resp.getBody().getOrganizzazioneRichiesta());

        Optional<RegistrazioneUtenteEntity> reg = registrazioneRepository.findByPrincipal(TEST_PRINCIPAL);
        assertTrue(reg.isPresent());
        assertNull(reg.get().getOrganizzazioneRichiesta());
    }

    @Test
    public void testListOrganizzazioniRegistrazione_Success() {
        setupOrganizzazioneDiTest();
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        ResponseEntity<PagedModelItemOrganizzazione> resp =
            controller.listOrganizzazioniRegistrazione(null, null, 0, 10, null);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody());
        assertTrue(resp.getBody().getContent().size() >= 1);
        // Almeno l'organizzazione appena creata è presente
        boolean trovata = resp.getBody().getContent().stream()
            .anyMatch((ItemOrganizzazione o) -> o.getNome() != null);
        assertTrue(trovata);
    }

    // ==================== Test completaRegistrazione con organizzazione ====================

    @Test
    public void testCompletaRegistrazione_NuovoUtenteConOrganizzazione_PendingUpdate() {
        UUID idOrg = setupOrganizzazioneDiTest();
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        // Seleziona organizzazione e prepara registrazione verificata
        SelezionaOrganizzazioneRequest sel = new SelezionaOrganizzazioneRequest();
        sel.setIdOrganizzazione(idOrg);
        controller.selezionaOrganizzazioneRegistrazione(sel);

        Optional<RegistrazioneUtenteEntity> regOpt = registrazioneRepository.findByPrincipal(TEST_PRINCIPAL);
        assertTrue(regOpt.isPresent());
        RegistrazioneUtenteEntity reg = regOpt.get();
        reg.setEmailProposta(TEST_EMAIL_AZIENDALE);
        reg.setStato(StatoRegistrazione.VERIFIED);
        registrazioneRepository.save(reg);

        ResponseEntity<RisultatoRegistrazione> resp = controller.completaRegistrazione();

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(EsitoRegistrazioneEnum.NUOVO_UTENTE, resp.getBody().getEsito());

        // L'utente nuovo deve essere in PENDING_UPDATE con organizzazione_pending valorizzata
        Optional<UtenteEntity> utenteOpt = this.utenteService.findByPrincipal(TEST_PRINCIPAL);
        assertTrue(utenteOpt.isPresent());
        UtenteEntity utente = utenteOpt.get();
        assertEquals(UtenteEntity.Stato.PENDING_UPDATE, utente.getStato());
        assertNotNull(utente.getOrganizzazionePending());
        assertEquals(idOrg.toString(), utente.getOrganizzazionePending().getIdOrganizzazione());
        assertNull(utente.getOrganizzazionePartenza());
    }

    @Test
    public void testCompletaRegistrazione_SenzaOrganizzazione_ComportamentoInvariato() {
        setupMockForUnregisteredUser(TEST_PRINCIPAL, TEST_EMAIL_JWT, TEST_NOME, TEST_COGNOME);

        // Registrazione verificata senza org scelta
        RegistrazioneUtenteEntity reg = new RegistrazioneUtenteEntity();
        reg.setPrincipal(TEST_PRINCIPAL);
        reg.setNome(TEST_NOME);
        reg.setCognome(TEST_COGNOME);
        reg.setEmailJwt(TEST_EMAIL_JWT);
        reg.setEmailProposta(TEST_EMAIL_AZIENDALE);
        reg.setStato(StatoRegistrazione.VERIFIED);
        reg.setTentativiVerifica(1);
        reg.setTentativiTotali(1);
        reg.setDataCreazione(new Date());
        registrazioneRepository.save(reg);

        ResponseEntity<RisultatoRegistrazione> resp = controller.completaRegistrazione();

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        // Con autoabilitazione=true (setUp) e senza org, l'utente è ABILITATO senza org_pending
        Optional<UtenteEntity> utenteOpt = this.utenteService.findByPrincipal(TEST_PRINCIPAL);
        assertTrue(utenteOpt.isPresent());
        UtenteEntity utente = utenteOpt.get();
        assertEquals(UtenteEntity.Stato.ABILITATO, utente.getStato());
        assertNull(utente.getOrganizzazionePending());
    }

    @Test
    public void testCompletaRegistrazione_EmailEsistenteConOrganizzazione_RichiestaCambio() {
        UUID idOrg = setupOrganizzazioneDiTest();

        // Crea un utente esistente con quella email aziendale (path PRINCIPAL_AGGIORNATO)
        String emailEsistente = "esistente." + System.nanoTime() + "@azienda.com";
        UtenteEntity preEsistente = new UtenteEntity();
        preEsistente.setIdUtente(UUID.randomUUID().toString());
        preEsistente.setPrincipal("oldprincipal_" + System.nanoTime());
        preEsistente.setNome("Pre");
        preEsistente.setCognome("Esistente");
        preEsistente.setEmailAziendale(emailEsistente);
        preEsistente.setTelefonoAziendale("00-000000");
        preEsistente.setStato(UtenteEntity.Stato.ABILITATO);
        this.utenteService.save(preEsistente);

        setupMockForUnregisteredUser(TEST_PRINCIPAL, emailEsistente, TEST_NOME, TEST_COGNOME);

        // Selezione org + verified
        SelezionaOrganizzazioneRequest sel = new SelezionaOrganizzazioneRequest();
        sel.setIdOrganizzazione(idOrg);
        controller.selezionaOrganizzazioneRegistrazione(sel);

        RegistrazioneUtenteEntity reg = registrazioneRepository.findByPrincipal(TEST_PRINCIPAL).get();
        reg.setEmailProposta(emailEsistente);
        reg.setStato(StatoRegistrazione.VERIFIED);
        registrazioneRepository.save(reg);

        ResponseEntity<RisultatoRegistrazione> resp = controller.completaRegistrazione();

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(EsitoRegistrazioneEnum.PRINCIPAL_AGGIORNATO, resp.getBody().getEsito());

        // L'utente preesistente ora ha principal aggiornato e org_pending verso la nuova org
        UtenteEntity utenteRefreshed = this.utenteService.findByPrincipal(TEST_PRINCIPAL).get();
        assertEquals(UtenteEntity.Stato.PENDING_UPDATE, utenteRefreshed.getStato());
        assertNotNull(utenteRefreshed.getOrganizzazionePending());
        assertEquals(idOrg.toString(), utenteRefreshed.getOrganizzazionePending().getIdOrganizzazione());
        assertNull(utenteRefreshed.getOrganizzazionePartenza());
    }

    @Test
    public void testCompletaRegistrazione_EmailEsistente_GiaAssociato_BadRequest() {
        UUID idOrg = setupOrganizzazioneDiTest();
        OrganizzazioneEntity org = this.organizzazioneService.find(idOrg).get();

        // Crea utente preesistente già associato all'org
        String emailEsistente = "assoc." + System.nanoTime() + "@azienda.com";
        UtenteEntity preEsistente = new UtenteEntity();
        preEsistente.setIdUtente(UUID.randomUUID().toString());
        preEsistente.setPrincipal("oldassoc_" + System.nanoTime());
        preEsistente.setNome("Pre");
        preEsistente.setCognome("Assoc");
        preEsistente.setEmailAziendale(emailEsistente);
        preEsistente.setTelefonoAziendale("00-000000");
        preEsistente.setStato(UtenteEntity.Stato.ABILITATO);
        this.utenteService.save(preEsistente);

        UtenteOrganizzazioneEntity assoc = new UtenteOrganizzazioneEntity();
        assoc.setUtente(preEsistente);
        assoc.setOrganizzazione(org);
        preEsistente.getUtenteOrganizzazioni().add(assoc);
        this.utenteService.save(preEsistente);

        setupMockForUnregisteredUser(TEST_PRINCIPAL, emailEsistente, TEST_NOME, TEST_COGNOME);

        SelezionaOrganizzazioneRequest sel = new SelezionaOrganizzazioneRequest();
        sel.setIdOrganizzazione(idOrg);
        controller.selezionaOrganizzazioneRegistrazione(sel);

        RegistrazioneUtenteEntity reg = registrazioneRepository.findByPrincipal(TEST_PRINCIPAL).get();
        reg.setEmailProposta(emailEsistente);
        reg.setStato(StatoRegistrazione.VERIFIED);
        registrazioneRepository.save(reg);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            controller.completaRegistrazione();
        });
        assertEquals("REG.400.ORG.ALREADY.ASSOCIATED", ex.getMessage());
    }

    @Test
    public void testCompletaRegistrazione_EmailEsistente_PendingAltraOrg_Conflict() {
        UUID idOrgRichiesta = setupOrganizzazioneDiTest();

        // Crea seconda org direttamente via service
        UUID idOrgAltra = creaOrganizzazione("OrgAltraTest_" + System.nanoTime());
        OrganizzazioneEntity orgAltra = this.organizzazioneService.find(idOrgAltra).get();

        // Utente preesistente già in PENDING_UPDATE per idOrgAltra
        String emailEsistente = "pending." + System.nanoTime() + "@azienda.com";
        UtenteEntity preEsistente = new UtenteEntity();
        preEsistente.setIdUtente(UUID.randomUUID().toString());
        preEsistente.setPrincipal("oldpend_" + System.nanoTime());
        preEsistente.setNome("Pre");
        preEsistente.setCognome("Pending");
        preEsistente.setEmailAziendale(emailEsistente);
        preEsistente.setTelefonoAziendale("00-000000");
        preEsistente.setStato(UtenteEntity.Stato.PENDING_UPDATE);
        preEsistente.setOrganizzazionePending(orgAltra);
        this.utenteService.save(preEsistente);

        setupMockForUnregisteredUser(TEST_PRINCIPAL, emailEsistente, TEST_NOME, TEST_COGNOME);

        SelezionaOrganizzazioneRequest sel = new SelezionaOrganizzazioneRequest();
        sel.setIdOrganizzazione(idOrgRichiesta);
        controller.selezionaOrganizzazioneRegistrazione(sel);

        RegistrazioneUtenteEntity reg = registrazioneRepository.findByPrincipal(TEST_PRINCIPAL).get();
        reg.setEmailProposta(emailEsistente);
        reg.setStato(StatoRegistrazione.VERIFIED);
        registrazioneRepository.save(reg);

        ConflictException ex = assertThrows(ConflictException.class, () -> {
            controller.completaRegistrazione();
        });
        assertEquals("REG.409.ALREADY.PENDING.OTHER.ORG", ex.getMessage());
    }
}
