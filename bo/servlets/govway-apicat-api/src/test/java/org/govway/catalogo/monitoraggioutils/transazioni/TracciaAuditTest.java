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
package org.govway.catalogo.monitoraggioutils.transazioni;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;

import org.govway.catalogo.servlets.monitor.model.ItemTransazioneAudit;
import org.govway.catalogo.servlets.monitor.model.TransazioneAudit;
import org.junit.jupiter.api.Test;

/**
 * Lettura delle informazioni di audit dalla traccia restituita dal dettaglio della transazione di GovWay (Issue 404).
 */
class TracciaAuditTest {

	private static String traccia(String proprieta) {
		return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
				+ "<traccia xmlns=\"http://www.openspcoop2.org/core/tracciamento\" tipo=\"Richiesta\">"
				+ "<id-transazione>e3d3917b-d114-11f1-ae08-0050b6eb86b8</id-transazione>"
				+ "<busta><servizio tipo=\"modipa\" versione=\"1\">TestPDNDRestAudit</servizio><azione>PUT_pet</azione>"
				+ "<protocollo identificativo=\"modipa\">"
				+ "<proprieta nome=\"ProfiloInterazione\" valore=\"crud\"/>"
				+ "<proprieta nome=\"ProfiloSicurezzaMessaggio\" valore=\"IDAR01\"/>"
				+ proprieta
				+ "</protocollo></busta></traccia>";
	}

	private static final String AUDIT = "<proprieta nome=\"ProfiloSicurezzaAudit\" valore=\"AUDIT_REST_02\"/>"
			+ "<proprieta nome=\"ProfiloSicurezzaAudit-SchemaDati\" valore=\"Linee Guida ModI\"/>"
			+ "<proprieta nome=\"ProfiloSicurezzaMessaggioAudit-Kid\" valore=\"UC01SXvYS1kBhjZi2EsnOGHztBCidb2Iv58DdmYrOa0\"/>"
			+ "<proprieta nome=\"ProfiloSicurezzaMessaggioAudit-IssuedAt\" valore=\"2026-10-26_09:13:19.000\"/>"
			+ "<proprieta nome=\"ProfiloSicurezzaMessaggioAudit-Expiration\" valore=\"2026-10-26_09:14:19.000\"/>"
			+ "<proprieta nome=\"ProfiloSicurezzaMessaggioAudit-NotBefore\" valore=\"2026-10-26_09:13:19.000\"/>"
			+ "<proprieta nome=\"ProfiloSicurezzaMessaggioAudit-Audience\" valore=\"http://PROVA/govway/rest/in/ENTE/TestPDNDRest/v1\"/>"
			+ "<proprieta nome=\"ProfiloSicurezzaMessaggioAudit-MessageId\" valore=\"e3d39179-d114-11f1-ae08-0050b6eb86b8\"/>"
			+ "<proprieta nome=\"ProfiloSicurezzaMessaggioAudit-userID\" valore=\"andrea\"/>"
			+ "<proprieta nome=\"ProfiloSicurezzaMessaggioAudit-userLocation\" valore=\"pisa\"/>"
			+ "<proprieta nome=\"ProfiloSicurezzaMessaggioAudit-LoA\" valore=\"3\"/>"
			+ "<proprieta nome=\"ProfiloSicurezzaMessaggioAudit-Issuer\" valore=\"96e8a16f-b726-4792-99f6-36778fe483a0\"/>"
			+ "<proprieta nome=\"ProfiloSicurezzaMessaggioAudit-PurposeId\" valore=\"8ab11d8c-5091-4a89-9527-f7c3791aa6d2\"/>";

	@Test
	void lista_soloPatternEDatiOperatore() throws IOException {
		ItemTransazioneAudit audit = TracciaAudit.parse(traccia(AUDIT)).toItemTransazioneAudit();

		assertEquals("AUDIT_REST_02", audit.getPattern());
		assertEquals("andrea", audit.getUserId());
		assertEquals("pisa", audit.getUserLocation());
		assertEquals("3", audit.getLoa());
	}

	@Test
	void dettaglio_tuttiIClaimModI() throws IOException {
		TransazioneAudit audit = TracciaAudit.parse(traccia(AUDIT)).toTransazioneAudit();

		assertEquals("AUDIT_REST_02", audit.getPattern());
		assertEquals("Linee Guida ModI", audit.getSchemaDati());
		assertEquals("andrea", audit.getUserId());
		assertEquals("pisa", audit.getUserLocation());
		assertEquals("3", audit.getLoa());
		assertEquals("8ab11d8c-5091-4a89-9527-f7c3791aa6d2", audit.getPurposeId());
		assertEquals("96e8a16f-b726-4792-99f6-36778fe483a0", audit.getIssuer());
		assertEquals("http://PROVA/govway/rest/in/ENTE/TestPDNDRest/v1", audit.getAudience());
		assertEquals("e3d39179-d114-11f1-ae08-0050b6eb86b8", audit.getMessageId());
		assertEquals("UC01SXvYS1kBhjZi2EsnOGHztBCidb2Iv58DdmYrOa0", audit.getKid());
		assertEquals("2026-10-26T09:13:19.000", audit.getIssuedAt());
		assertEquals("2026-10-26T09:13:19.000", audit.getNotBefore());
		assertEquals("2026-10-26T09:14:19.000", audit.getExpiration());
		// le proprieta` non di audit (ProfiloInterazione, ProfiloSicurezzaMessaggio) non sono riportate
		assertNull(audit.getAltreProprieta());
	}

	@Test
	void dettaglio_claimNonPrevistiInAltreProprieta() throws IOException {
		TransazioneAudit audit = TracciaAudit.parse(traccia(AUDIT
				+ "<proprieta nome=\"ProfiloSicurezzaMessaggioAudit-codiceEnte\" valore=\"E001\"/>")).toTransazioneAudit();

		assertNotNull(audit.getAltreProprieta());
		assertEquals(1, audit.getAltreProprieta().size());
		assertEquals("ProfiloSicurezzaMessaggioAudit-codiceEnte", audit.getAltreProprieta().get(0).getNome());
		assertEquals("E001", audit.getAltreProprieta().get(0).getValore());
	}

	@Test
	void tracciaSenzaAudit() throws IOException {
		assertNull(TracciaAudit.parse(traccia("")));
		assertNull(TracciaAudit.parse(null));
		assertNull(TracciaAudit.parse(" "));
	}

	@Test
	void tracciaNonValida() {
		assertThrows(IOException.class, () -> TracciaAudit.parse("<traccia>"));
	}

	@Test
	void tracciaConDoctypeRifiutata() {
		String xxe = "<?xml version=\"1.0\"?><!DOCTYPE traccia [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]>"
				+ "<traccia><proprieta nome=\"ProfiloSicurezzaAudit\" valore=\"&xxe;\"/></traccia>";
		assertThrows(IOException.class, () -> TracciaAudit.parse(xxe));
	}

	@Test
	void dataNonRiconosciutaInvariata() {
		assertEquals("26/10/2026 09:13", TracciaAudit.toData("26/10/2026 09:13"));
		assertEquals("2026-10-26T09:13:19", TracciaAudit.toData("2026-10-26_09:13:19"));
		assertNull(TracciaAudit.toData(null));
	}
}
