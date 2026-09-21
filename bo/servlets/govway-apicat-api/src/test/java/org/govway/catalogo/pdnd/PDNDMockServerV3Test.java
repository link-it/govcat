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
package org.govway.catalogo.pdnd;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.UUID;

import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.pdnd.controllers.PDNDMockServerV3;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Agreement;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.AgreementState;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.EServiceEvent;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Purpose;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.PurposeVersionState;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Tenant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * Verifica che le risposte simulate dell'API PDND v3 siano leggibili nei modelli generati:
 * un errore di battitura nei file json del mock si manifesterebbe altrimenti solo a runtime.
 */
class PDNDMockServerV3Test {

	private static final UUID ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
	private static final UUID ID_NON_TROVATO = UUID.fromString("eeeee404-0000-0000-0000-000000000000");
	private static final UUID AGREEMENT_ATTIVO = UUID.fromString("55555555-5555-5555-5555-555555555555");
	private static final UUID AGREEMENT_IN_ATTESA = UUID.fromString("d5555555-5555-5555-5555-555555555555");
	private static final UUID PURPOSE_ATTIVA = UUID.fromString("66666666-6666-6666-6666-666666666666");
	private static final UUID PURPOSE_IN_ATTESA = UUID.fromString("e6666666-6666-6666-6666-666666666666");

	@ParameterizedTest
	@ValueSource(strings = {"collaudo", "produzione"})
	void leRisposteSimulateSonoLeggibili(String ambiente) {
		PDNDMockServerV3 server = new PDNDMockServerV3(ambiente);

		assertNotNull(server.getStatus().getBody().getStatus());

		assertNotNull(server.getTenant(ID).getBody().getId());
		assertNotNull(server.getTenant(ID).getBody().getExternalId().getValue());
		assertNotNull(server.getTenant(ID).getBody().getKind());
		assertFalse(server.getTenants(0, 50, "c_h501", null).getBody().getResults().isEmpty());

		assertNotNull(server.getEService(ID).getBody().getProducerId());
		assertFalse(server.getEServices(0, 50, null, null, null, null, null, null, null, null)
				.getBody().getResults().isEmpty());

		assertNotNull(server.getEServiceDescriptor(ID, ID).getBody().getState());
		assertFalse(server.getEServiceDescriptors(ID, 0, 50, null).getBody().getResults().isEmpty());
		assertFalse(server.getEServiceDescriptorDocuments(ID, ID, 0, 50).getBody().getResults().isEmpty());

		assertNotNull(server.getEServiceDescriptorCertifiedAttributes(ID, ID, 0, 50).getBody()
				.getResults().get(0).getAttribute().getCode());
		assertFalse(server.getEServiceDescriptorDeclaredAttributes(ID, ID, 0, 50).getBody().getResults().isEmpty());
		assertFalse(server.getEServiceDescriptorVerifiedAttributes(ID, ID, 0, 50).getBody().getResults().isEmpty());

		assertNotNull(server.getAgreement(ID).getBody().getState());
		assertFalse(server.getAgreements(0, 50, null, null, null, null, null).getBody().getResults().isEmpty());
		assertFalse(server.getAgreementPurposes(ID, 50, 0).getBody().getResults().isEmpty());

		assertNotNull(server.getPurpose(ID).getBody().getCurrentVersion().getDailyCalls());
		assertNotNull(server.getPurposeAgreement(ID).getBody().getId());

		assertNotNull(server.getClient(ID).getBody().getConsumerId());
		assertNotNull(server.getJWKByKid("kid").getBody().getJwk().getKty());

		assertNotNull(server.getCertifiedAttribute(ID).getBody().getCode());
		assertNotNull(server.getDeclaredAttribute(ID).getBody().getName());
		assertNotNull(server.getVerifiedAttribute(ID).getBody().getName());
	}

	@Test
	void leCollezioniSimulateContengonoUnaSolaPagina() {
		PDNDMockServerV3 server = new PDNDMockServerV3("collaudo");

		// due accordi simulati: uno attivo e uno in attesa di approvazione
		assertEquals(2, server.getAgreements(0, 50, null, null, null, null, null).getBody().getResults().size());
		assertEquals(null, server.getAgreements(50, 50, null, null, null, null, null).getBody().getResults());
	}

	@Test
	void laListaAccordiContieneUnFruitoreInAttesaDiApprovazione() {
		PDNDMockServerV3 server = new PDNDMockServerV3("collaudo");

		// consente di provare l'approvazione dell'accordo dalla lista dei fruitori
		assertTrue(server.getAgreements(0, 50, null, null, null, null, null).getBody().getResults().stream()
				.anyMatch(a -> AgreementState.PENDING.equals(a.getState())));
	}

	@Test
	void leOrganizzazioniSonoDistinguibiliPerIdentificativo() {
		PDNDMockServerV3 server = new PDNDMockServerV3("collaudo");

		UUID altroTenant = UUID.fromString("d2222222-2222-2222-2222-222222222222");

		Tenant erogatore = server.getTenant(ID).getBody();
		Tenant fruitore = server.getTenant(altroTenant).getBody();

		assertEquals(altroTenant, fruitore.getId());
		assertNotEquals(erogatore.getName(), fruitore.getName());
		assertNotEquals(erogatore.getExternalId().getValue(), fruitore.getExternalId().getValue());
	}

	@Test
	void ilMockDegliEventiRiprendeDallUltimoEventoRicevuto() {
		PDNDMockServerV3 server = new PDNDMockServerV3("collaudo");

		List<EServiceEvent> tutti = server.getEServicesEvents(50, null, null).getBody().getEvents();
		assertTrue(tutti.size() > 1, "servono piu' eventi simulati per verificare la ripresa");

		List<EServiceEvent> successivi = server.getEServicesEvents(50, null, tutti.get(0).getId())
				.getBody().getEvents();

		assertEquals(tutti.size() - 1, successivi.size());
		assertEquals(tutti.get(1).getId(), successivi.get(0).getId());
	}

	@Test
	void ilRegistroAttributiSimulatoContienePiuCodici() {
		PDNDMockServerV3 server = new PDNDMockServerV3("collaudo");

		// consente di verificare la risoluzione di un codice nel registro
		assertTrue(server.getCertifiedAttributes(0, 50).getBody().getResults().size() > 1);
	}

	@Test
	void unaFinalitaSimulataEInAttesaDiApprovazione() {
		PDNDMockServerV3 server = new PDNDMockServerV3("collaudo");

		// consente di provare lo sblocco della finalita' oltre soglia
		assertTrue(server.getAgreementPurposes(ID, 50, 0).getBody().getResults().stream()
				.anyMatch(p -> p.getWaitingForApprovalVersion() != null));
	}

	@Test
	void gliOggettiSimulatiSonoDistinguibiliPerIdentificativo() {
		PDNDMockServerV3 server = new PDNDMockServerV3("collaudo");

		assertEquals(AgreementState.PENDING, server.getAgreement(AGREEMENT_IN_ATTESA).getBody().getState());
		assertEquals(AgreementState.ACTIVE, server.getAgreement(AGREEMENT_ATTIVO).getBody().getState());

		assertNotNull(server.getPurpose(PURPOSE_IN_ATTESA).getBody().getWaitingForApprovalVersion());
		assertEquals(null, server.getPurpose(PURPOSE_ATTIVA).getBody().getWaitingForApprovalVersion());
	}

	@Test
	void unIdentificativoSconosciutoOttieneLOggettoDiDefault() {
		PDNDMockServerV3 server = new PDNDMockServerV3("collaudo");

		// il mock resta utilizzabile con identificativi qualsiasi, come prima
		assertNotNull(server.getAgreement(ID).getBody().getId());
		assertNotNull(server.getPurpose(ID).getBody().getId());
	}

	@Test
	void lApprovazioneRestituisceLAccordoAttivoSenzaAlterareIDatiSimulati() {
		PDNDMockServerV3 server = new PDNDMockServerV3("collaudo");

		assertEquals(AgreementState.ACTIVE, server.approveAgreement(AGREEMENT_IN_ATTESA).getBody().getState());

		// la risposta approvata e' una copia: l'accordo simulato resta in attesa
		assertEquals(AgreementState.PENDING, server.getAgreement(AGREEMENT_IN_ATTESA).getBody().getState());
	}

	@Test
	void lApprovazioneDiUnaFinalitaAttivaLaVersioneInAttesa() {
		PDNDMockServerV3 server = new PDNDMockServerV3("collaudo");

		Integer richieste = server.getPurpose(PURPOSE_IN_ATTESA).getBody().getWaitingForApprovalVersion().getDailyCalls();

		Purpose approvata = server.approvePurpose(PURPOSE_IN_ATTESA).getBody();

		assertEquals(null, approvata.getWaitingForApprovalVersion());
		assertEquals(PurposeVersionState.ACTIVE, approvata.getCurrentVersion().getState());
		assertEquals(richieste, approvata.getCurrentVersion().getDailyCalls());

		// anche qui i dati simulati non cambiano
		assertNotNull(server.getPurpose(PURPOSE_IN_ATTESA).getBody().getWaitingForApprovalVersion());
	}

	@Test
	void lAccordoDiUnaFinalitaEQuelloDelSuoFruitore() {
		PDNDMockServerV3 server = new PDNDMockServerV3("collaudo");

		Purpose finalita = server.getPurpose(PURPOSE_ATTIVA).getBody();
		Agreement accordo = server.getPurposeAgreement(PURPOSE_ATTIVA).getBody();

		assertEquals(finalita.getConsumerId(), accordo.getConsumerId());
		assertEquals(finalita.getEserviceId(), accordo.getEserviceId());
	}

	@Test
	void gliIdentificativiConvenzionaliSimulanoGliErrori() {
		PDNDMockServerV3 server = new PDNDMockServerV3("collaudo");

		assertThrows(NotFoundException.class, () -> server.getAgreement(ID_NON_TROVATO));
		assertThrows(BadRequestException.class,
				() -> server.getAgreement(UUID.fromString("eeeee400-0000-0000-0000-000000000000")));
	}
}
