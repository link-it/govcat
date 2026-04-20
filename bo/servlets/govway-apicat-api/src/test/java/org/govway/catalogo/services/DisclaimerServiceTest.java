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
package org.govway.catalogo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.govway.catalogo.authorization.AdesioneAuthorization;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.servlets.model.AdesioneDisclaimer;
import org.govway.catalogo.servlets.model.ClientRichiesto;
import org.govway.catalogo.servlets.model.DisclaimerContestoEnum;
import org.govway.catalogo.servlets.model.DisclaimerSeverityEnum;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class DisclaimerServiceTest {

	@Mock
	private AdesioneAuthorization adesioneAuthorization;

	@InjectMocks
	private DisclaimerService service;

	@BeforeEach
	void setUp() {
		ReflectionTestUtils.setField(service, "externalPath", "/nonexistent/path");
		seedCache("it", new HashMap<>());
		seedCache("en", new HashMap<>());
	}

	// ----------------------------------------------------------------------
	// Helpers
	// ----------------------------------------------------------------------

	private void seedCache(String lang, Map<String, DisclaimerService.DisclaimerEntry> entries) {
		@SuppressWarnings("unchecked")
		Map<String, Map<String, DisclaimerService.DisclaimerEntry>> cache =
				(Map<String, Map<String, DisclaimerService.DisclaimerEntry>>) ReflectionTestUtils.getField(service, "cache");
		assertNotNull(cache, "Il campo cache non deve essere null");
		cache.put(lang, new ConcurrentHashMap<>(entries));
	}

	private Map<String, DisclaimerService.DisclaimerEntry> entries(Object... pairs) {
		Map<String, DisclaimerService.DisclaimerEntry> map = new HashMap<>();
		for (int i = 0; i < pairs.length; i += 2) {
			String key = (String) pairs[i];
			DisclaimerService.DisclaimerEntry entry = (DisclaimerService.DisclaimerEntry) pairs[i + 1];
			map.put(key, entry);
		}
		return map;
	}

	private DisclaimerService.DisclaimerEntry entry(String testo, DisclaimerSeverityEnum severity) {
		return new DisclaimerService.DisclaimerEntry(testo, severity);
	}

	private DisclaimerService.DisclaimerEntry entryInfo(String testo) {
		return entry(testo, DisclaimerSeverityEnum.INFO);
	}

	private AdesioneEntity buildAdesione(String stato, String nomeDominio) {
		AdesioneEntity adesione = new AdesioneEntity();
		adesione.setIdAdesione("test-id");
		adesione.setStato(stato);
		if (nomeDominio != null) {
			ServizioEntity servizio = new ServizioEntity();
			DominioEntity dominio = new DominioEntity();
			dominio.setNome(nomeDominio);
			servizio.setDominio(dominio);
			adesione.setServizio(servizio);
		}
		return adesione;
	}

	private void mockProfili(String... profili) {
		List<ClientRichiesto> list = new ArrayList<>();
		for (String p : profili) {
			ClientRichiesto cr = new ClientRichiesto();
			cr.setProfilo(p);
			list.add(cr);
		}
		when(this.adesioneAuthorization.getClientRichiesti(any())).thenReturn(list);
	}

	// ----------------------------------------------------------------------
	// Fallback
	// ----------------------------------------------------------------------

	@Test
	@DisplayName("Cache vuota -> fallback hardcoded in italiano")
	void fallbackHardcodedIt() {
		// Cache vuota: il service esce col fallback hardcoded senza invocare getClientRichiesti
		AdesioneEntity adesione = buildAdesione("bozza", null);

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		AdesioneDisclaimer d = result.get(0);
		assertEquals(DisclaimerContestoEnum.GENERALE, d.getContesto());
		assertEquals(DisclaimerSeverityEnum.INFO, d.getSeverity());
		assertTrue(d.getDisclaimer().toLowerCase().contains("adesione"));
	}

	@Test
	@DisplayName("Cache vuota per 'en' -> fallback hardcoded in inglese")
	void fallbackHardcodedEn() {
		AdesioneEntity adesione = buildAdesione("bozza", null);

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "en");

		assertEquals(1, result.size());
		assertTrue(result.get(0).getDisclaimer().toLowerCase().contains("subscription"));
	}

	@Test
	@DisplayName("Solo default in cache -> restituisce il default")
	void soloDefaultReturnsDefault() {
		seedCache("it", entries("default", entryInfo("testo di default")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "Test");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("testo di default", result.get(0).getDisclaimer());
		assertEquals(DisclaimerContestoEnum.GENERALE, result.get(0).getContesto());
	}

	@Test
	@DisplayName("Lingua sconosciuta -> fallback a 'it'")
	void linguaSconosciutaFallbackIt() {
		seedCache("it", entries("default", entryInfo("testo IT")));
		mockProfili();
		AdesioneEntity adesione = buildAdesione("bozza", null);

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "fr");

		assertEquals(1, result.size());
		assertEquals("testo IT", result.get(0).getDisclaimer());
	}

	@Test
	@DisplayName("Lingua null -> fallback a 'it'")
	void linguaNullFallbackIt() {
		seedCache("it", entries("default", entryInfo("testo IT")));
		mockProfili();
		AdesioneEntity adesione = buildAdesione("bozza", null);

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, null);

		assertEquals(1, result.size());
		assertEquals("testo IT", result.get(0).getDisclaimer());
	}

	// ----------------------------------------------------------------------
	// Risoluzione gerarchica
	// ----------------------------------------------------------------------

	@Test
	@DisplayName("Match su livello stato")
	void matchSuStato() {
		seedCache("it", entries(
				"default", entryInfo("DEFAULT"),
				"bozza", entryInfo("BOZZA")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "Test");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("BOZZA", result.get(0).getDisclaimer());
	}

	@Test
	@DisplayName("Match su livello stato.profilo")
	void matchSuStatoProfilo() {
		seedCache("it", entries(
				"default", entryInfo("DEFAULT"),
				"bozza.pdnd", entryInfo("BOZZA.PDND")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "Test");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("BOZZA.PDND", result.get(0).getDisclaimer());
	}

	@Test
	@DisplayName("Match su livello stato.profilo.dominio")
	void matchSuStatoProfiloDominio() {
		seedCache("it", entries(
				"default", entryInfo("DEFAULT"),
				"bozza.pdnd.pdnd", entryInfo("BOZZA.PDND.PDND")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("BOZZA.PDND.PDND", result.get(0).getDisclaimer());
	}

	@Test
	@DisplayName("Match su tutti i livelli: accumulo di tutti i disclaimer")
	void matchTuttiLivelli() {
		seedCache("it", entries(
				"default", entryInfo("DEFAULT"),
				"bozza", entryInfo("STATO"),
				"bozza.pdnd", entryInfo("PROFILO"),
				"bozza.pdnd.pdnd", entryInfo("SPECIFICO")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(3, result.size());
		assertEquals("SPECIFICO", result.get(0).getDisclaimer());
		assertEquals("PROFILO", result.get(1).getDisclaimer());
		assertEquals("STATO", result.get(2).getDisclaimer());
	}

	@Test
	@DisplayName("Keys normalizzate in lowercase")
	void keysNormalizzateLowercase() {
		seedCache("it", entries("bozza.pdnd.pdnd", entryInfo("OK")));
		// stato, profilo e dominio in vari casi
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("BOZZA", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("OK", result.get(0).getDisclaimer());
	}

	// ----------------------------------------------------------------------
	// Contesto (suffissi .collaudo / .produzione)
	// ----------------------------------------------------------------------

	@Test
	@DisplayName("Chiave con suffisso .collaudo -> contesto COLLAUDO")
	void contestoCollaudo() {
		seedCache("it", entries("bozza.pdnd.pdnd.collaudo", entryInfo("COLLAUDO")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals(DisclaimerContestoEnum.COLLAUDO, result.get(0).getContesto());
	}

	@Test
	@DisplayName("Chiave con suffisso .produzione -> contesto PRODUZIONE")
	void contestoProduzione() {
		seedCache("it", entries("bozza.pdnd.pdnd.produzione", entryInfo("PRODUZIONE")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals(DisclaimerContestoEnum.PRODUZIONE, result.get(0).getContesto());
	}

	@Test
	@DisplayName("Tre varianti per la stessa base: generale + collaudo + produzione")
	void treContestiPerStessaBase() {
		seedCache("it", entries(
				"bozza.pdnd.pdnd", entryInfo("GEN"),
				"bozza.pdnd.pdnd.collaudo", entryInfo("COL"),
				"bozza.pdnd.pdnd.produzione", entryInfo("PROD")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(3, result.size());
		assertEquals(DisclaimerContestoEnum.GENERALE, result.get(0).getContesto());
		assertEquals(DisclaimerContestoEnum.COLLAUDO, result.get(1).getContesto());
		assertEquals(DisclaimerContestoEnum.PRODUZIONE, result.get(2).getContesto());
	}

	@Test
	@DisplayName("Suffisso contesto applicato anche al livello stato")
	void contestoSuLivelloStato() {
		seedCache("it", entries("bozza.collaudo", entryInfo("STATO_COLLAUDO")));
		mockProfili();
		AdesioneEntity adesione = buildAdesione("bozza", null);

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("STATO_COLLAUDO", result.get(0).getDisclaimer());
		assertEquals(DisclaimerContestoEnum.COLLAUDO, result.get(0).getContesto());
	}

	// ----------------------------------------------------------------------
	// Severity
	// ----------------------------------------------------------------------

	@Test
	@DisplayName("Severity WARNING esplicita viene propagata")
	void severityWarning() {
		seedCache("it", entries("bozza", entry("TEXT", DisclaimerSeverityEnum.WARNING)));
		mockProfili();
		AdesioneEntity adesione = buildAdesione("bozza", null);

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(DisclaimerSeverityEnum.WARNING, result.get(0).getSeverity());
	}

	@Test
	@DisplayName("Severity ERROR esplicita viene propagata")
	void severityError() {
		seedCache("it", entries("bozza", entry("TEXT", DisclaimerSeverityEnum.ERROR)));
		mockProfili();
		AdesioneEntity adesione = buildAdesione("bozza", null);

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(DisclaimerSeverityEnum.ERROR, result.get(0).getSeverity());
	}

	@Test
	@DisplayName("Severity null -> default INFO")
	void severityNullDefault() {
		seedCache("it", entries("bozza", entry("TEXT", null)));
		mockProfili();
		AdesioneEntity adesione = buildAdesione("bozza", null);

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(DisclaimerSeverityEnum.INFO, result.get(0).getSeverity());
	}

	// ----------------------------------------------------------------------
	// Campo profilo
	// ----------------------------------------------------------------------

	@Test
	@DisplayName("Match su {stato}.{profilo} -> profilo valorizzato con il case originale")
	void profiloValorizzatoCaseOriginale() {
		seedCache("it", entries("bozza.pdnd", entryInfo("PROFILO")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		// Il profilo nella risposta mantiene il case originale (PDND, non pdnd)
		assertEquals("PDND", result.get(0).getProfilo());
	}

	@Test
	@DisplayName("Match su {stato} puro -> profilo null")
	void profiloNullSuMatchStato() {
		seedCache("it", entries("bozza", entryInfo("STATO")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertNull(result.get(0).getProfilo(),
				"Il match su livello stato puro non deve valorizzare il profilo");
	}

	@Test
	@DisplayName("Match su {stato}.{profilo}.{dominio} -> profilo valorizzato")
	void profiloValorizzatoSuLivelloSpecifico() {
		seedCache("it", entries("bozza.pdnd.pdnd", entryInfo("SPECIFICO")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("PDND", result.get(0).getProfilo());
	}

	@Test
	@DisplayName("Disclaimer di default -> profilo null")
	void profiloNullSuDefault() {
		seedCache("it", entries("default", entryInfo("DEFAULT")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertNull(result.get(0).getProfilo());
	}

	@Test
	@DisplayName("Fallback hardcoded -> profilo null")
	void profiloNullSuHardcoded() {
		AdesioneEntity adesione = buildAdesione("bozza", null);

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertNull(result.get(0).getProfilo());
	}

	@Test
	@DisplayName("Match con suffisso .collaudo e profilo -> entrambi valorizzati")
	void profiloEContestoInsieme() {
		seedCache("it", entries("bozza.pdnd.collaudo", entryInfo("PDND_COLLAUDO")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals(DisclaimerContestoEnum.COLLAUDO, result.get(0).getContesto());
		assertEquals("PDND", result.get(0).getProfilo());
	}

	@Test
	@DisplayName("Contesto generale con profilo (bozza.pdnd) -> profilo non null")
	void contestoGeneraleConProfiloNonNull() {
		// Opzione 1: profilo e' popolato anche quando contesto=GENERALE se la chiave
		// contiene il segmento profilo
		seedCache("it", entries("bozza.pdnd", entryInfo("GEN_PDND")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", null);

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals(DisclaimerContestoEnum.GENERALE, result.get(0).getContesto());
		assertEquals("PDND", result.get(0).getProfilo());
	}

	@Test
	@DisplayName("Chiavi YAML lowercase con profilo mock in mixed case -> match OK e profilo originale")
	void matchCaseInsensitiveProfiloOriginale() {
		// Chiave nella cache e' lowercase (come dopo la normalize al loading)
		seedCache("it", entries("bozza.modi_p1", entryInfo("MODI")));
		// Il profilo restituito dall'autorizzazione puo' essere in qualsiasi case
		mockProfili("MODI_P1");
		AdesioneEntity adesione = buildAdesione("bozza", null);

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		// Match avvenuto (grazie alla normalize sul lookup), profilo col case originale
		assertEquals("MODI_P1", result.get(0).getProfilo());
	}

	// ----------------------------------------------------------------------
	// Multi-profilo
	// ----------------------------------------------------------------------

	@Test
	@DisplayName("Due profili diversi -> due disclaimer distinti")
	void dueProfiliDueDisclaimer() {
		seedCache("it", entries(
				"bozza.pdnd", entryInfo("PDND"),
				"bozza.modi_p1", entryInfo("MODI")));
		mockProfili("PDND", "MODI_P1");
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(2, result.size());
		List<String> texts = result.stream().map(AdesioneDisclaimer::getDisclaimer).toList();
		assertTrue(texts.contains("PDND"));
		assertTrue(texts.contains("MODI"));
	}

	@Test
	@DisplayName("Due profili, ma solo uno mappato -> un solo disclaimer")
	void dueProfiliUnoSoloMappato() {
		seedCache("it", entries("bozza.pdnd", entryInfo("SOLO_PDND")));
		mockProfili("PDND", "MODI_P1");
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("SOLO_PDND", result.get(0).getDisclaimer());
	}

	@Test
	@DisplayName("Due profili che puntano alla stessa chiave -> deduplicato")
	void stessaChiavePerDueProfiliDeduplicata() {
		// Se per qualche motivo due profili diversi risolvono alla stessa chiave (es. match
		// del solo livello stato), il risultato non deve contenere duplicati
		seedCache("it", entries("bozza", entryInfo("UNICO")));
		mockProfili("PDND", "MODI_P1");
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("UNICO", result.get(0).getDisclaimer());
	}

	// ----------------------------------------------------------------------
	// Edge cases
	// ----------------------------------------------------------------------

	@Test
	@DisplayName("Nessun profilo configurato -> solo match sul livello stato")
	void nessunProfilo() {
		seedCache("it", entries(
				"bozza", entryInfo("STATO"),
				"bozza.pdnd", entryInfo("NON_DEVE_APPARIRE")));
		mockProfili();
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("STATO", result.get(0).getDisclaimer());
	}

	@Test
	@DisplayName("Dominio null -> salta il livello stato.profilo.dominio")
	void dominioNullSaltaPrimoLivello() {
		seedCache("it", entries(
				"bozza.pdnd", entryInfo("PROFILO"),
				"bozza.pdnd.pdnd", entryInfo("NON_DEVE_APPARIRE")));
		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", null);

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("PROFILO", result.get(0).getDisclaimer());
	}

	@Test
	@DisplayName("Eccezione in estrazione profili -> non fallisce, usa il livello stato")
	void eccezioneInEstrazioneProfili() {
		seedCache("it", entries("bozza", entryInfo("STATO")));
		when(this.adesioneAuthorization.getClientRichiesti(any()))
				.thenThrow(new RuntimeException("errore simulato"));
		AdesioneEntity adesione = buildAdesione("bozza", "PDND");

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("STATO", result.get(0).getDisclaimer());
	}

	@Test
	@DisplayName("Entry con testo vuoto non viene restituita")
	void entryConTestoVuotoIgnorata() {
		seedCache("it", entries(
				"bozza", entryInfo("   "),
				"default", entryInfo("DEFAULT")));
		mockProfili();
		AdesioneEntity adesione = buildAdesione("bozza", null);

		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("DEFAULT", result.get(0).getDisclaimer());
	}

	// ----------------------------------------------------------------------
	// Caricamento da file YAML (integrazione parsing)
	// ----------------------------------------------------------------------

	@Test
	@DisplayName("Caricamento da file YAML esterno: stringa semplice -> INFO")
	void loadYamlStringaSempliceInfo(@TempDir Path tempDir) throws IOException {
		String yaml = String.join("\n",
				"default: |",
				"  Testo default",
				"bozza: Una stringa semplice");
		Files.writeString(tempDir.resolve("disclaimers_it.yml"), yaml);

		ReflectionTestUtils.setField(service, "externalPath", tempDir.toString());
		service.reload();

		mockProfili();
		AdesioneEntity adesione = buildAdesione("bozza", null);
		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals("Una stringa semplice", result.get(0).getDisclaimer());
		assertEquals(DisclaimerSeverityEnum.INFO, result.get(0).getSeverity());
	}

	@Test
	@DisplayName("Caricamento da file YAML esterno: oggetto strutturato")
	void loadYamlOggettoStrutturato(@TempDir Path tempDir) throws IOException {
		String yaml = String.join("\n",
				"bozza.pdnd:",
				"  severity: WARNING",
				"  testo: |",
				"    ## Testo markdown",
				"    riga 2");
		Files.writeString(tempDir.resolve("disclaimers_it.yml"), yaml);

		ReflectionTestUtils.setField(service, "externalPath", tempDir.toString());
		service.reload();

		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "qualsiasi");
		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		// Il classpath contiene altre chiavi (es. "bozza"); qui verifichiamo che tra i
		// risultati ci sia il disclaimer strutturato della chiave "bozza.pdnd" caricato
		// dal file esterno di test, con la severity e il testo attesi.
		AdesioneDisclaimer strutturato = result.stream()
				.filter(d -> d.getDisclaimer().contains("## Testo markdown"))
				.findFirst()
				.orElse(null);
		assertNotNull(strutturato, "Il disclaimer strutturato caricato dal YAML esterno deve essere presente");
		assertEquals(DisclaimerSeverityEnum.WARNING, strutturato.getSeverity());
		assertTrue(strutturato.getDisclaimer().contains("riga 2"));
	}

	@Test
	@DisplayName("Caricamento da file YAML: severity invalida -> fallback INFO")
	void loadYamlSeverityInvalida(@TempDir Path tempDir) throws IOException {
		String yaml = String.join("\n",
				"bozza:",
				"  severity: XYZ_NON_ESISTE",
				"  testo: Testo");
		Files.writeString(tempDir.resolve("disclaimers_it.yml"), yaml);

		ReflectionTestUtils.setField(service, "externalPath", tempDir.toString());
		service.reload();

		mockProfili();
		AdesioneEntity adesione = buildAdesione("bozza", null);
		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertEquals(1, result.size());
		assertEquals(DisclaimerSeverityEnum.INFO, result.get(0).getSeverity());
	}

	@Test
	@DisplayName("Caricamento da file YAML: chiave quotata con spazi nel dominio")
	void loadYamlChiaveConSpazi(@TempDir Path tempDir) throws IOException {
		String yaml = String.join("\n",
				"\"bozza.pdnd.dominio con spazi\": |",
				"  Testo dominio con spazi");
		Files.writeString(tempDir.resolve("disclaimers_it.yml"), yaml);

		ReflectionTestUtils.setField(service, "externalPath", tempDir.toString());
		service.reload();

		mockProfili("PDND");
		AdesioneEntity adesione = buildAdesione("bozza", "Dominio Con Spazi");
		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertTrue(result.stream().anyMatch(d -> d.getDisclaimer().contains("Testo dominio con spazi")),
				"Dovrebbe risolvere la chiave con spazi dopo normalizzazione");
	}

	@Test
	@DisplayName("File YAML esterno inesistente non causa errori (solo classpath)")
	void fileEsternoInesistenteNonFallisce(@TempDir Path tempDir) {
		ReflectionTestUtils.setField(service, "externalPath", tempDir.resolve("inesistente").toString());

		// Non deve lanciare eccezioni
		service.reload();

		mockProfili();
		AdesioneEntity adesione = buildAdesione("qualsiasi", null);
		List<AdesioneDisclaimer> result = service.resolveDisclaimers(adesione, "it");

		assertNotNull(result);
		assertTrue(result.size() >= 1, "Ci deve essere almeno il fallback hardcoded o il default da classpath");
	}
}
