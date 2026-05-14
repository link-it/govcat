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

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.govway.catalogo.authorization.AdesioneAuthorization;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.servlets.model.AdesioneDisclaimer;
import org.govway.catalogo.servlets.model.ClientRichiesto;
import org.govway.catalogo.servlets.model.DisclaimerContestoEnum;
import org.govway.catalogo.servlets.model.DisclaimerSeverityEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.yaml.snakeyaml.Yaml;

import jakarta.annotation.PostConstruct;

/**
 * Servizio per la risoluzione gerarchica dei disclaimer delle adesioni.
 *
 * I disclaimer sono caricati da file YAML (disclaimers_{lingua}.yml) con supporto
 * per override da path esterno. La risoluzione avviene gerarchicamente per ciascun
 * profilo (codice_interno) dei client richiesti dall'adesione. Per ogni livello
 * vengono cercate anche le varianti con suffisso ".collaudo" e ".produzione":
 * <ol>
 *   <li>{stato}.{codice_interno}.{nome_dominio}[.{ambiente}] (piu' specifico)</li>
 *   <li>{stato}.{codice_interno}[.{ambiente}]</li>
 *   <li>{stato}[.{ambiente}]</li>
 *   <li>default (fallback)</li>
 * </ol>
 *
 * Il contesto del disclaimer e' derivato dal suffisso della chiave matched:
 * ".collaudo" -> COLLAUDO, ".produzione" -> PRODUZIONE, altrimenti GENERALE.
 *
 * I valori YAML possono essere stringhe (severity = INFO di default) oppure oggetti
 * strutturati con campi "severity" e "testo".
 *
 * Tutte le chiavi sono normalizzate in lowercase per il confronto.
 */
@Service
public class DisclaimerService {

	private static final String DEFAULT_KEY = "default";
	private static final String SUFFIX_COLLAUDO = ".collaudo";
	private static final String SUFFIX_PRODUZIONE = ".produzione";
	private static final String HARDCODED_FALLBACK_IT = "Procedendo con l'adesione, l'ente accetta i termini e le condizioni del servizio.";
	private static final String HARDCODED_FALLBACK_EN = "By proceeding with this subscription, the organization accepts the terms and conditions of the service.";

	private final Logger logger = LoggerFactory.getLogger(DisclaimerService.class);

	@Value("${disclaimers.external.path:/var/govcat/conf}")
	private String externalPath;

	@Autowired
	private AdesioneAuthorization adesioneAuthorization;

	private final Map<String, Map<String, DisclaimerEntry>> cache = new ConcurrentHashMap<>();

	@PostConstruct
	public void init() {
		reload();
	}

	@Scheduled(fixedDelayString = "${disclaimers.reload.interval:300000}")
	public void reload() {
		loadLanguage("it");
		loadLanguage("en");
	}

	/**
	 * Risolve i disclaimer per una data adesione e lingua.
	 * Non lancia mai eccezioni: restituisce sempre almeno il disclaimer di fallback.
	 */
	public List<AdesioneDisclaimer> resolveDisclaimers(AdesioneEntity adesione, String languageCode) {
		try {
			String lang = (languageCode != null) ? languageCode.toLowerCase() : "it";
			Map<String, DisclaimerEntry> disclaimers = cache.getOrDefault(lang, cache.get("it"));
			if (disclaimers == null || disclaimers.isEmpty()) {
				return List.of(buildHardcodedFallback(lang));
			}

			String stato = normalize(adesione.getStato());
			String dominio = extractDominio(adesione);
			// I profili sono restituiti con il case originale (coerente con quanto
			// presente in ClientAdesioneEntity.profilo restituito da listClient*Adesione)
			List<String> profili = extractProfili(adesione);

			// LinkedHashSet di chiavi gia' consumate per evitare duplicati
			Set<String> matchedKeys = new LinkedHashSet<>();
			List<AdesioneDisclaimer> result = new ArrayList<>();

			for (String profilo : profili) {
				String profiloNormalizzato = normalize(profilo);
				if (dominio != null) {
					String baseKey = stato + "." + profiloNormalizzato + "." + dominio;
					tryAllContexts(disclaimers, baseKey, profilo, matchedKeys, result);
				}
				String baseKey = stato + "." + profiloNormalizzato;
				tryAllContexts(disclaimers, baseKey, profilo, matchedKeys, result);
			}

			// Disclaimer per livello stato (chiavi che non contengono il profilo -> profilo=null)
			tryAllContexts(disclaimers, stato, null, matchedKeys, result);

			// Se nessun disclaimer specifico trovato, usa il default (profilo=null)
			if (result.isEmpty()) {
				DisclaimerEntry defaultEntry = disclaimers.get(DEFAULT_KEY);
				if (defaultEntry != null && defaultEntry.testo != null && !defaultEntry.testo.isBlank()) {
					result.add(buildDisclaimer(defaultEntry.testo, DisclaimerContestoEnum.GENERALE, defaultEntry.severity, null));
				} else {
					result.add(buildHardcodedFallback(lang));
				}
			}

			return Collections.unmodifiableList(result);

		} catch (Exception e) {
			this.logger.error("Errore nella risoluzione dei disclaimer: " + e.getMessage(), e);
			String lang = (languageCode != null) ? languageCode.toLowerCase() : "it";
			return List.of(buildHardcodedFallback(lang));
		}
	}

	/**
	 * Per una chiave base, tenta il match su tre varianti: base, base+.collaudo, base+.produzione.
	 * Aggiunge al risultato tutti i match trovati, evitando duplicati tramite matchedKeys.
	 *
	 * @param profilo valore originale del profilo associato alla chiave base (null se la chiave
	 *                non contiene il segmento profilo, es. per il livello "stato" puro)
	 */
	private void tryAllContexts(Map<String, DisclaimerEntry> disclaimers, String baseKey,
			String profilo, Set<String> matchedKeys, List<AdesioneDisclaimer> result) {
		tryAddKey(disclaimers, baseKey, DisclaimerContestoEnum.GENERALE, profilo, matchedKeys, result);
		tryAddKey(disclaimers, baseKey + SUFFIX_COLLAUDO, DisclaimerContestoEnum.COLLAUDO, profilo, matchedKeys, result);
		tryAddKey(disclaimers, baseKey + SUFFIX_PRODUZIONE, DisclaimerContestoEnum.PRODUZIONE, profilo, matchedKeys, result);
	}

	private void tryAddKey(Map<String, DisclaimerEntry> disclaimers, String key,
			DisclaimerContestoEnum contesto, String profilo, Set<String> matchedKeys, List<AdesioneDisclaimer> result) {
		if (matchedKeys.contains(key)) {
			return;
		}
		DisclaimerEntry entry = disclaimers.get(key);
		if (entry != null && entry.testo != null && !entry.testo.isBlank()) {
			matchedKeys.add(key);
			result.add(buildDisclaimer(entry.testo, contesto, entry.severity, profilo));
		}
	}

	private AdesioneDisclaimer buildDisclaimer(String testo, DisclaimerContestoEnum contesto,
			DisclaimerSeverityEnum severity, String profilo) {
		AdesioneDisclaimer d = new AdesioneDisclaimer();
		d.setDisclaimer(testo.trim());
		d.setContesto(contesto);
		d.setSeverity(severity != null ? severity : DisclaimerSeverityEnum.INFO);
		d.setProfilo(profilo);
		return d;
	}

	private AdesioneDisclaimer buildHardcodedFallback(String lang) {
		String testo = "en".equals(lang) ? HARDCODED_FALLBACK_EN : HARDCODED_FALLBACK_IT;
		return buildDisclaimer(testo, DisclaimerContestoEnum.GENERALE, DisclaimerSeverityEnum.INFO, null);
	}

	/**
	 * Estrae i profili client richiesti per l'adesione. I valori sono restituiti con il
	 * case originale (come memorizzati nel DB) per consentire al FE di fare matching diretto
	 * tra il campo profilo del disclaimer e il profilo degli elementi restituiti dagli
	 * endpoint listClient*Adesione.
	 */
	private List<String> extractProfili(AdesioneEntity adesione) {
		try {
			List<ClientRichiesto> clientRichiesti = this.adesioneAuthorization.getClientRichiesti(adesione.getServizio());
			return clientRichiesti.stream()
					.map(ClientRichiesto::getProfilo)
					.filter(p -> p != null && !p.isBlank())
					.distinct()
					.toList();
		} catch (Exception e) {
			this.logger.warn("Impossibile recuperare i profili client richiesti per l'adesione {}: {}",
					adesione.getIdAdesione(), e.getMessage());
			return List.of();
		}
	}

	private String extractDominio(AdesioneEntity adesione) {
		if (adesione.getServizio() == null || adesione.getServizio().getDominio() == null) {
			return null;
		}
		String nome = adesione.getServizio().getDominio().getNome();
		return (nome != null && !nome.isBlank()) ? normalize(nome) : null;
	}

	private String normalize(String value) {
		return (value != null) ? value.toLowerCase().trim() : null;
	}

	@SuppressWarnings("unchecked")
	private void loadLanguage(String lang) {
		String fileName = "disclaimers_" + lang + ".yml";
		try {
			Map<String, DisclaimerEntry> disclaimers = new ConcurrentHashMap<>();

			// Carica prima dal classpath (default)
			try (InputStream is = getClass().getClassLoader().getResourceAsStream(fileName)) {
				if (is != null) {
					Map<String, Object> loaded = new Yaml().load(is);
					mergeLoaded(loaded, disclaimers);
				}
			}

			// Sovrascrive con il file esterno, se presente
			Path externalFile = Paths.get(externalPath, fileName);
			if (Files.isReadable(externalFile)) {
				try (InputStream is = Files.newInputStream(externalFile)) {
					Map<String, Object> loaded = new Yaml().load(is);
					mergeLoaded(loaded, disclaimers);
				}
				this.logger.debug("Caricati disclaimer esterni per lingua '{}' da: {}", lang, externalFile);
			}

			cache.put(lang, disclaimers);
			this.logger.debug("Disclaimer per lingua '{}' caricati: {} chiavi", lang, disclaimers.size());

		} catch (Exception e) {
			this.logger.error("Errore nel caricamento dei disclaimer per lingua '{}': {}", lang, e.getMessage(), e);
		}
	}

	private void mergeLoaded(Map<String, Object> loaded, Map<String, DisclaimerEntry> target) {
		if (loaded == null) {
			return;
		}
		loaded.forEach((k, v) -> {
			DisclaimerEntry entry = parseEntry(v);
			if (entry != null) {
				target.put(normalize(k), entry);
			}
		});
	}

	@SuppressWarnings("unchecked")
	private DisclaimerEntry parseEntry(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof String s) {
			return new DisclaimerEntry(s, DisclaimerSeverityEnum.INFO);
		}
		if (value instanceof Map<?, ?> map) {
			Object testoObj = ((Map<String, Object>) map).get("testo");
			Object severityObj = ((Map<String, Object>) map).get("severity");
			String testo = (testoObj != null) ? testoObj.toString() : "";
			DisclaimerSeverityEnum severity = parseSeverity(severityObj);
			return new DisclaimerEntry(testo, severity);
		}
		// Formato non riconosciuto: usa toString e severity default
		return new DisclaimerEntry(value.toString(), DisclaimerSeverityEnum.INFO);
	}

	private DisclaimerSeverityEnum parseSeverity(Object severityObj) {
		if (severityObj == null) {
			return DisclaimerSeverityEnum.INFO;
		}
		String s = severityObj.toString().trim().toUpperCase();
		try {
			return DisclaimerSeverityEnum.valueOf(s);
		} catch (IllegalArgumentException e) {
			this.logger.warn("Severity non riconosciuta '{}', uso INFO come default", s);
			return DisclaimerSeverityEnum.INFO;
		}
	}

	/**
	 * Rappresentazione interna di una voce disclaimer caricata dal YAML.
	 * Package-private per consentire l'accesso dai test.
	 */
	static final class DisclaimerEntry {
		final String testo;
		final DisclaimerSeverityEnum severity;

		DisclaimerEntry(String testo, DisclaimerSeverityEnum severity) {
			this.testo = testo;
			this.severity = severity;
		}
	}
}
