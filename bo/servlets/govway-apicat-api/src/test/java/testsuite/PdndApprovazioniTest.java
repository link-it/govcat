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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.pdnd.controllers.IPDNDClient;
import org.govway.catalogo.pdnd.controllers.PDNDClientFactory;
import org.govway.catalogo.pdnd.controllers.PDNDController;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.RuoloPdndEnum;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.pdnd.model.Agreement;
import org.govway.catalogo.servlets.pdnd.model.AgreementState;
import org.govway.catalogo.servlets.pdnd.model.AmbienteEnum;
import org.govway.catalogo.servlets.pdnd.model.Purpose;
import org.govway.catalogo.servlets.pdnd.model.PurposeState;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

/**
 * Verifica le operazioni di scrittura verso la PDND esposte da GovCat: sono consentite ai
 * soli utenti con ruolo PDND amministratore.
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class PdndApprovazioniTest {

    private static final String UTENTE_GESTORE = "gestore";
    private static final UUID AGREEMENT_ID = UUID.fromString("55555555-5555-5555-5555-555555555555");
    private static final UUID PURPOSE_ID = UUID.fromString("66666666-6666-6666-6666-666666666666");

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    /** Il client verso la PDND e' simulato: i test verificano l'autorizzazione, non l'integrazione. */
    @MockitoBean
    private PDNDClientFactory clientFactory;

    @Autowired
    private PDNDController controller;

    @Autowired
    private UtentiController utentiController;

    @Autowired
    private OrganizzazioniController organizzazioniController;

    @Autowired
    private UtenteService utenteService;

    private IPDNDClient client;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        SecurityContextHolder.setContext(this.securityContext);
        CommonUtils.getSessionUtente(UTENTE_GESTORE, this.securityContext, this.authentication, this.utenteService);

        this.client = mock(IPDNDClient.class);
        when(this.clientFactory.getClientCollaudo()).thenReturn(this.client);
        when(this.clientFactory.getClientProduzione()).thenReturn(this.client);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void approveAgreementSenzaRuoloPdndNonConsentito() {
        // l'utente gestore dei test non ha ruolo PDND
        NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
                () -> this.controller.approveAgreement(AmbienteEnum.COLLAUDO, AGREEMENT_ID));

        assertEquals("AUT.403.RUOLO.PDND", ex.getMessage());
        verify(this.client, never()).approveAgreement(AGREEMENT_ID);
    }

    @Test
    public void approvePurposeSenzaRuoloPdndNonConsentito() {
        NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
                () -> this.controller.approvePurpose(AmbienteEnum.COLLAUDO, PURPOSE_ID));

        assertEquals("AUT.403.RUOLO.PDND", ex.getMessage());
        verify(this.client, never()).approvePurpose(PURPOSE_ID);
    }

    @Test
    public void approveAgreementConRuoloPdndAdmin() {
        autenticaUtenteConRuoloPdndAdmin("pdnd.admin.agreement");

        Agreement approvato = new Agreement();
        approvato.setId(AGREEMENT_ID);
        approvato.setState(AgreementState.ACTIVE);
        when(this.client.approveAgreement(AGREEMENT_ID)).thenReturn(ResponseEntity.ok(approvato));

        ResponseEntity<Agreement> response = this.controller.approveAgreement(AmbienteEnum.COLLAUDO, AGREEMENT_ID);

        assertEquals(AgreementState.ACTIVE, response.getBody().getState());
        verify(this.client).approveAgreement(AGREEMENT_ID);
    }

    @Test
    public void approvePurposeConRuoloPdndAdmin() {
        autenticaUtenteConRuoloPdndAdmin("pdnd.admin.purpose");

        Purpose approvata = new Purpose();
        approvata.setId(PURPOSE_ID);
        approvata.setState(PurposeState.ACTIVE);
        when(this.client.approvePurpose(PURPOSE_ID)).thenReturn(ResponseEntity.ok(approvata));

        ResponseEntity<Purpose> response = this.controller.approvePurpose(AmbienteEnum.PRODUZIONE, PURPOSE_ID);

        assertEquals(PurposeState.ACTIVE, response.getBody().getState());
        verify(this.client).approvePurpose(PURPOSE_ID);
    }

    /**
     * Crea un utente con ruolo PDND amministratore e lo imposta come utente di sessione.
     */
    private void autenticaUtenteConRuoloPdndAdmin(String principal) {
        Organizzazione org = this.organizzazioniController
                .createOrganizzazione(CommonUtils.getOrganizzazioneCreate()).getBody();

        UtenteCreate utenteCreate = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utenteCreate, org.getIdOrganizzazione());
        utenteCreate.setPrincipal(principal);
        utenteCreate.setRuoloPdnd(RuoloPdndEnum.ADMIN);
        this.utentiController.createUtente(utenteCreate);

        CommonUtils.getSessionUtente(principal, this.securityContext, this.authentication, this.utenteService);
    }
}
