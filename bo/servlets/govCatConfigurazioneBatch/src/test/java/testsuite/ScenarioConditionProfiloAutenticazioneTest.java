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

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.junit.jupiter.api.Test;

import configuratore.ScenariEnum;
import configuratore.ScenarioCondition;

/**
 * Chiave profiloAutenticazione delle condizioni: permette di selezionare uno scenario a partire dal
 * codice interno del profilo dell'API, non dal solo tipo di client. Serve ai profili che
 * condividono l'auth_type con altri (es. OAUTH_CC e PDND, entrambi con auth_type pdnd e quindi
 * entrambi PdndClient).
 */
class ScenarioConditionProfiloAutenticazioneTest {

	private static ScenarioCondition parse(Properties props, String nome) {
		return ScenarioCondition.parse(ScenarioCondition.parsePropery(props), nome);
	}

	@Test
	void profiloAutenticazioneSelezionaIlSingoloProfilo() {
		Properties props = new Properties();
		props.put("cond.profilo", "PdndClient");
		props.put("cond.profiloAutenticazione", "OAUTH_CC");

		ScenarioCondition cond = parse(props, "cond");

		assertTrue(cond.check("PdndClient", "OAUTH_CC", Map.of()));
		// stesso tipo di client, profilo di autenticazione diverso
		assertFalse(cond.check("PdndClient", "PDND", Map.of()));
		assertFalse(cond.check("PdndClient", null, Map.of()));
		// stesso profilo di autenticazione, tipo di client diverso
		assertFalse(cond.check("HttpsClient", "OAUTH_CC", Map.of()));
	}

	@Test
	void condizioneSenzaProfiloAutenticazioneRestaComePrima() {
		Properties props = new Properties();
		props.put("cond.profilo", "PdndClient");

		ScenarioCondition cond = parse(props, "cond");

		assertTrue(cond.check("PdndClient", "OAUTH_CC", Map.of()));
		assertTrue(cond.check("PdndClient", null, Map.of()));
		assertFalse(cond.check("OauthClientCredentialsClient", "OAUTH_CC", Map.of()));
	}

	@Test
	void profiloAutenticazionePropagatoAlleSottocondizioni() {
		Properties props = new Properties();
		props.put("cond.or", "condA,condB");
		props.put("condA.profiloAutenticazione", "OAUTH_CC");
		props.put("condB.profiloAutenticazione", "OAUTH_CC_MMG");

		ScenarioCondition cond = parse(props, "cond");

		assertTrue(cond.check("PdndClient", "OAUTH_CC", Map.of()));
		assertTrue(cond.check("PdndClient", "OAUTH_CC_MMG", Map.of()));
		assertFalse(cond.check("PdndClient", "PDND", Map.of()));
	}

	@Test
	void profiloAutenticazioneConviveConLeEstensioni() {
		Properties props = new Properties();
		props.put("cond.profiloAutenticazione", "OAUTH_CC");
		props.put("cond.gruppo.proprieta", "valore");

		ScenarioCondition cond = parse(props, "cond");

		assertTrue(cond.check("PdndClient", "OAUTH_CC", Map.of("gruppo.proprieta", "valore")));
		assertFalse(cond.check("PdndClient", "OAUTH_CC", Map.of("gruppo.proprieta", "altro")));
		assertFalse(cond.check("PdndClient", "PDND", Map.of("gruppo.proprieta", "valore")));
	}

	/**
	 * A parità di condizioni soddisfatte prevale l'ultimo scenario dell'enumerazione, quindi
	 * quelli selezionati da un singolo profilo di autenticazione devono stare dopo quelli
	 * generici sul tipo di client, che altrimenti li oscurerebbero.
	 */
	@Test
	void scenariPerProfiloDichiaratiDopoQuelliGenerici() {
		List<ScenariEnum> ordine = List.of(ScenariEnum.values());

		assertTrue(ordine.indexOf(ScenariEnum.OAUTH_CC_TOKEN_POLICY) > ordine.indexOf(ScenariEnum.PDND),
				"oauthCCTokenPolicy deve vincere su pdnd, che matcha lo stesso PdndClient: " + ordine);
		assertTrue(ordine.indexOf(ScenariEnum.MTLS_FRUIZIONI_PDND) > ordine.indexOf(ScenariEnum.MTLS),
				"mtlsFruizioniPdnd deve vincere su mtls, che matcha lo stesso HttpsClient: " + ordine);
	}
}
