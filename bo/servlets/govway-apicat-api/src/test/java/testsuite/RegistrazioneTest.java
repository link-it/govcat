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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.controllers.RegistrazioneController;
import org.govway.catalogo.core.dao.repositories.RegistrazioneUtenteRepository;
import org.govway.catalogo.core.orm.entity.RegistrazioneUtenteEntity;
import org.govway.catalogo.core.orm.entity.RegistrazioneUtenteEntity.StatoRegistrazione;
import org.govway.catalogo.core.services.RegistrazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneUtente;
import org.govway.catalogo.servlets.model.CodiceInviato;
import org.govway.catalogo.servlets.model.EsitoRegistrazioneEnum;
import org.govway.catalogo.servlets.model.Idm;
import org.govway.catalogo.servlets.model.ModificaEmailRequest;
import org.govway.catalogo.servlets.model.RisultatoRegistrazione;
import org.govway.catalogo.servlets.model.RisultatoVerifica;
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
}
