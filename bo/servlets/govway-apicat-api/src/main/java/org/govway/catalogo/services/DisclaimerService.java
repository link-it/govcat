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
import org.govway.catalogo.servlets.model.ClientRichiesto;
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
 * profilo (codice_interno) dei client richiesti dall'adesione:
 * <ol>
 *   <li>{stato}.{codice_interno}.{nome_dominio} (piu' specifico)</li>
 *   <li>{stato}.{codice_interno}</li>
 *   <li>{stato}</li>
 *   <li>default (fallback)</li>
 * </ol>
 *
 * Se l'adesione ha piu' profili, vengono restituiti i disclaimer di tutti i profili
 * che risultano mappati nello YAML, senza duplicati.
 *
 * Tutti i valori sono normalizzati in lowercase per il confronto.
 */
@Service
public class DisclaimerService {

	private static final String DEFAULT_KEY = "default";
	private static final String HARDCODED_FALLBACK_IT = "Procedendo con l'adesione, l'ente accetta i termini e le condizioni del servizio.";
	private static final String HARDCODED_FALLBACK_EN = "By proceeding with this subscription, the organization accepts the terms and conditions of the service.";

	private final Logger logger = LoggerFactory.getLogger(DisclaimerService.class);

	@Value("${disclaimers.external.path:/var/govcat/conf}")
	private String externalPath;

	@Autowired
	private AdesioneAuthorization adesioneAuthorization;

	private final Map<String, Map<String, String>> cache = new ConcurrentHashMap<>();

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
	public List<String> resolveDisclaimers(AdesioneEntity adesione, String languageCode) {
		try {
			String lang = (languageCode != null) ? languageCode.toLowerCase() : "it";
			Map<String, String> disclaimers = cache.getOrDefault(lang, cache.get("it"));
			if (disclaimers == null || disclaimers.isEmpty()) {
				return List.of(getHardcodedFallback(lang));
			}

			String stato = normalize(adesione.getStato());
			String dominio = extractDominio(adesione);
			List<String> profili = extractProfili(adesione);

			// LinkedHashSet per mantenere l'ordine e evitare duplicati
			Set<String> result = new LinkedHashSet<>();

			for (String profilo : profili) {
				// Risoluzione gerarchica: dal piu' specifico al meno specifico
				if (dominio != null) {
					addIfPresent(disclaimers, stato + "." + profilo + "." + dominio, result);
				}
				addIfPresent(disclaimers, stato + "." + profilo, result);
			}

			// Disclaimer per stato (indipendente dal profilo)
			addIfPresent(disclaimers, stato, result);

			// Se nessun disclaimer specifico trovato, usa il default dal file
			if (result.isEmpty()) {
				String defaultDisclaimer = disclaimers.get(DEFAULT_KEY);
				if (defaultDisclaimer != null && !defaultDisclaimer.isBlank()) {
					result.add(defaultDisclaimer.trim());
				} else {
					result.add(getHardcodedFallback(lang));
				}
			}

			return Collections.unmodifiableList(new ArrayList<>(result));

		} catch (Exception e) {
			this.logger.error("Errore nella risoluzione dei disclaimer: " + e.getMessage(), e);
			String lang = (languageCode != null) ? languageCode.toLowerCase() : "it";
			return List.of(getHardcodedFallback(lang));
		}
	}

	private void addIfPresent(Map<String, String> disclaimers, String key, Set<String> result) {
		String value = disclaimers.get(key);
		if (value != null && !value.isBlank()) {
			result.add(value.trim());
		}
	}

	private List<String> extractProfili(AdesioneEntity adesione) {
		try {
			List<ClientRichiesto> clientRichiesti = this.adesioneAuthorization.getClientRichiesti(adesione.getServizio());
			return clientRichiesti.stream()
					.map(ClientRichiesto::getProfilo)
					.filter(p -> p != null && !p.isBlank())
					.map(this::normalize)
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

	private String getHardcodedFallback(String lang) {
		return "en".equals(lang) ? HARDCODED_FALLBACK_EN : HARDCODED_FALLBACK_IT;
	}

	@SuppressWarnings("unchecked")
	private void loadLanguage(String lang) {
		String fileName = "disclaimers_" + lang + ".yml";
		try {
			Map<String, String> disclaimers = new ConcurrentHashMap<>();

			// Carica prima dal classpath (default)
			try (InputStream is = getClass().getClassLoader().getResourceAsStream(fileName)) {
				if (is != null) {
					Map<String, Object> loaded = new Yaml().load(is);
					if (loaded != null) {
						loaded.forEach((k, v) -> disclaimers.put(normalize(k), v != null ? v.toString() : ""));
					}
				}
			}

			// Sovrascrive con il file esterno, se presente
			Path externalFile = Paths.get(externalPath, fileName);
			if (Files.isReadable(externalFile)) {
				try (InputStream is = Files.newInputStream(externalFile)) {
					Map<String, Object> loaded = new Yaml().load(is);
					if (loaded != null) {
						loaded.forEach((k, v) -> disclaimers.put(normalize(k), v != null ? v.toString() : ""));
					}
				}
				this.logger.debug("Caricati disclaimer esterni per lingua '{}' da: {}", lang, externalFile);
			}

			cache.put(lang, disclaimers);
			this.logger.debug("Disclaimer per lingua '{}' caricati: {} chiavi", lang, disclaimers.size());

		} catch (Exception e) {
			this.logger.error("Errore nel caricamento dei disclaimer per lingua '{}': {}", lang, e.getMessage(), e);
		}
	}
}
