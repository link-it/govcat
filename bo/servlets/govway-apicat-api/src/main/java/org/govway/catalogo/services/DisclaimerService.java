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
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.servlets.model.AdesioneDisclaimer;
import org.govway.catalogo.servlets.model.ClientRichiesto;
import org.govway.catalogo.servlets.model.DisclaimerContestoEnum;
import org.govway.catalogo.servlets.model.DisclaimerSeverityEnum;
import org.govway.catalogo.servlets.model.ServizioDisclaimer;
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
 * Le stesse regole valgono per i disclaimer dei servizi, le cui chiavi sono
 * distinte da quelle delle adesioni tramite il prefisso "servizio." (es.
 * "servizio.{stato}.{codice_interno}"). Per i servizi non e' previsto alcun
 * fallback: se nessuna chiave corrisponde, la lista restituita e' vuota.
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
	private static final String PREFIX_SERVIZIO = "servizio.";
	private static final String SUFFIX_COLLAUDO = ".collaudo";
	private static final String SUFFIX_PRODUZIONE = ".produzione";
	private static final String HARDCODED_FALLBACK_IT = "Procedendo con l'adesione, l'ente accetta i termini e le condizioni del servizio.";
	private static final String HARDCODED_FALLBACK_EN = "By proceeding with this subscription, the organization accepts the terms and conditions of the service.";

	private final Logger logger = LoggerFactory.getLogger(DisclaimerService.class);

	@Value("${disclaimers.external.path:/var/govcat/conf}")
	private String externalPath;

	@Autowired
	private AdesioneAuthorization adesioneAuthorization;

	// Ogni chiave puo' mappare una LISTA di disclaimer: cosi' uno stesso
	// (stato, profilo, contesto) puo' produrre piu' voci distinte, es. un
	// disclaimer ambientale + uno legato a un gruppo di custom properties
	// (nome_gruppo). L'ordine della lista e' preservato nella risposta.
	private final Map<String, Map<String, List<DisclaimerEntry>>> cache = new ConcurrentHashMap<>();

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
		String lang = normalizeLang(languageCode);
		try {
			Map<String, List<DisclaimerEntry>> disclaimers = cache.getOrDefault(lang, cache.get("it"));
			if (disclaimers == null || disclaimers.isEmpty()) {
				return List.of(buildHardcodedFallback(lang));
			}

			List<ResolvedDisclaimer> resolved = resolveGerarchia(disclaimers, "",
					normalize(adesione.getStato()), adesione.getServizio());

			// Se nessun disclaimer specifico trovato, usa il default (profilo=null)
			if (resolved.isEmpty()) {
				resolved = resolveDefault(disclaimers);
			}

			List<AdesioneDisclaimer> result = new ArrayList<>();
			for (ResolvedDisclaimer entry : resolved) {
				result.add(buildDisclaimer(entry.testo, entry.contesto, entry.severity, entry.profilo, entry.nomeGruppo));
			}

			if (result.isEmpty()) {
				result.add(buildHardcodedFallback(lang));
			}

			return Collections.unmodifiableList(result);

		} catch (Exception e) {
			this.logger.error("Errore nella risoluzione dei disclaimer: " + e.getMessage(), e);
			return List.of(buildHardcodedFallback(lang));
		}
	}

	/**
	 * Risolve i disclaimer per un dato servizio e lingua. Usa lo stesso file di
	 * configurazione delle adesioni, limitatamente alle chiavi con prefisso "servizio.".
	 *
	 * A differenza delle adesioni non e' previsto alcun fallback: se nessuna chiave
	 * "servizio.*" corrisponde, la lista restituita e' vuota. Non lancia mai eccezioni.
	 */
	public List<ServizioDisclaimer> resolveDisclaimersServizio(ServizioEntity servizio, String languageCode) {
		try {
			String lang = normalizeLang(languageCode);
			Map<String, List<DisclaimerEntry>> disclaimers = cache.getOrDefault(lang, cache.get("it"));
			if (disclaimers == null || disclaimers.isEmpty()) {
				return List.of();
			}

			List<ResolvedDisclaimer> resolved = resolveGerarchia(disclaimers, PREFIX_SERVIZIO,
					normalize(servizio.getStato()), servizio);

			List<ServizioDisclaimer> result = new ArrayList<>();
			for (ResolvedDisclaimer entry : resolved) {
				result.add(buildDisclaimerServizio(entry));
			}

			return Collections.unmodifiableList(result);

		} catch (Exception e) {
			this.logger.error("Errore nella risoluzione dei disclaimer del servizio: " + e.getMessage(), e);
			return List.of();
		}
	}

	/**
	 * Risoluzione gerarchica delle chiavi, dal livello piu' specifico al piu' generico,
	 * a partire dal prefisso indicato ("" per le adesioni, "servizio." per i servizi).
	 *
	 * @param servizio servizio di riferimento, da cui sono derivati dominio e profili
	 *                 dei client richiesti (per le adesioni e' il servizio aderito)
	 */
	private List<ResolvedDisclaimer> resolveGerarchia(Map<String, List<DisclaimerEntry>> disclaimers,
			String prefix, String stato, ServizioEntity servizio) {

		String dominio = extractDominio(servizio);
		// I profili sono restituiti con il case originale (coerente con quanto
		// presente in ClientAdesioneEntity.profilo restituito da listClient*Adesione)
		List<String> profili = extractProfili(servizio);

		// LinkedHashSet di chiavi gia' consumate per evitare duplicati
		Set<String> matchedKeys = new LinkedHashSet<>();
		List<ResolvedDisclaimer> result = new ArrayList<>();

		for (String profilo : profili) {
			String profiloNormalizzato = normalize(profilo);
			if (dominio != null) {
				String baseKey = prefix + stato + "." + profiloNormalizzato + "." + dominio;
				tryAllContexts(disclaimers, baseKey, profilo, matchedKeys, result);
			}
			String baseKey = prefix + stato + "." + profiloNormalizzato;
			tryAllContexts(disclaimers, baseKey, profilo, matchedKeys, result);
		}

		// Disclaimer per livello stato (chiavi che non contengono il profilo -> profilo=null)
		tryAllContexts(disclaimers, prefix + stato, null, matchedKeys, result);

		return result;
	}

	/** Voci della chiave di default, usate solo dalle adesioni (profilo=null). */
	private List<ResolvedDisclaimer> resolveDefault(Map<String, List<DisclaimerEntry>> disclaimers) {
		List<ResolvedDisclaimer> result = new ArrayList<>();
		List<DisclaimerEntry> defaultEntries = disclaimers.get(DEFAULT_KEY);
		if (defaultEntries != null) {
			for (DisclaimerEntry defaultEntry : defaultEntries) {
				if (defaultEntry.testo != null && !defaultEntry.testo.isBlank()) {
					result.add(new ResolvedDisclaimer(defaultEntry.testo, DisclaimerContestoEnum.GENERALE,
							defaultEntry.severity, null, defaultEntry.nomeGruppo));
				}
			}
		}
		return result;
	}

	private String normalizeLang(String languageCode) {
		return (languageCode != null) ? languageCode.toLowerCase() : "it";
	}

	/**
	 * Per una chiave base, tenta il match su tre varianti: base, base+.collaudo, base+.produzione.
	 * Aggiunge al risultato tutti i match trovati, evitando duplicati tramite matchedKeys.
	 *
	 * @param profilo valore originale del profilo associato alla chiave base (null se la chiave
	 *                non contiene il segmento profilo, es. per il livello "stato" puro)
	 */
	private void tryAllContexts(Map<String, List<DisclaimerEntry>> disclaimers, String baseKey,
			String profilo, Set<String> matchedKeys, List<ResolvedDisclaimer> result) {
		tryAddKey(disclaimers, baseKey, DisclaimerContestoEnum.GENERALE, profilo, matchedKeys, result);
		tryAddKey(disclaimers, baseKey + SUFFIX_COLLAUDO, DisclaimerContestoEnum.COLLAUDO, profilo, matchedKeys, result);
		tryAddKey(disclaimers, baseKey + SUFFIX_PRODUZIONE, DisclaimerContestoEnum.PRODUZIONE, profilo, matchedKeys, result);
	}

	private void tryAddKey(Map<String, List<DisclaimerEntry>> disclaimers, String key,
			DisclaimerContestoEnum contesto, String profilo, Set<String> matchedKeys, List<ResolvedDisclaimer> result) {
		if (matchedKeys.contains(key)) {
			return;
		}
		List<DisclaimerEntry> entries = disclaimers.get(key);
		if (entries == null) {
			return;
		}
		// La chiave si considera "consumata" se ha almeno una voce con testo
		// valido; tutte le voci valide della lista vengono aggiunte, preservando
		// l'ordine di dichiarazione nello yaml.
		boolean matched = false;
		for (DisclaimerEntry entry : entries) {
			if (entry.testo != null && !entry.testo.isBlank()) {
				result.add(new ResolvedDisclaimer(entry.testo, contesto, entry.severity, profilo, entry.nomeGruppo));
				matched = true;
			}
		}
		if (matched) {
			matchedKeys.add(key);
		}
	}

	private AdesioneDisclaimer buildDisclaimer(String testo, DisclaimerContestoEnum contesto,
			DisclaimerSeverityEnum severity, String profilo, String nomeGruppo) {
		AdesioneDisclaimer d = new AdesioneDisclaimer();
		d.setDisclaimer(testo.trim());
		d.setContesto(contesto);
		d.setSeverity(severity != null ? severity : DisclaimerSeverityEnum.INFO);
		d.setProfilo(profilo);
		d.setNomeGruppo(nomeGruppo);
		return d;
	}

	private ServizioDisclaimer buildDisclaimerServizio(ResolvedDisclaimer resolved) {
		ServizioDisclaimer d = new ServizioDisclaimer();
		d.setDisclaimer(resolved.testo.trim());
		d.setContesto(resolved.contesto);
		d.setSeverity(resolved.severity != null ? resolved.severity : DisclaimerSeverityEnum.INFO);
		d.setProfilo(resolved.profilo);
		d.setNomeGruppo(resolved.nomeGruppo);
		return d;
	}

	private AdesioneDisclaimer buildHardcodedFallback(String lang) {
		String testo = "en".equals(lang) ? HARDCODED_FALLBACK_EN : HARDCODED_FALLBACK_IT;
		return buildDisclaimer(testo, DisclaimerContestoEnum.GENERALE, DisclaimerSeverityEnum.INFO, null, null);
	}

	/**
	 * Estrae i profili client richiesti per il servizio. I valori sono restituiti con il
	 * case originale (come memorizzati nel DB) per consentire al FE di fare matching diretto
	 * tra il campo profilo del disclaimer e il profilo degli elementi restituiti dagli
	 * endpoint listClient*Adesione.
	 */
	private List<String> extractProfili(ServizioEntity servizio) {
		try {
			List<ClientRichiesto> clientRichiesti = this.adesioneAuthorization.getClientRichiesti(servizio);
			return clientRichiesti.stream()
					.map(ClientRichiesto::getProfilo)
					.filter(p -> p != null && !p.isBlank())
					.distinct()
					.toList();
		} catch (Exception e) {
			this.logger.warn("Impossibile recuperare i profili client richiesti per il servizio {}: {}",
					(servizio != null) ? servizio.getIdServizio() : null, e.getMessage());
			return List.of();
		}
	}

	private String extractDominio(ServizioEntity servizio) {
		if (servizio == null || servizio.getDominio() == null) {
			return null;
		}
		String nome = servizio.getDominio().getNome();
		return (nome != null && !nome.isBlank()) ? normalize(nome) : null;
	}

	private String normalize(String value) {
		return (value != null) ? value.toLowerCase().trim() : null;
	}

	@SuppressWarnings("unchecked")
	private void loadLanguage(String lang) {
		String fileName = "disclaimers_" + lang + ".yml";
		try {
			Map<String, List<DisclaimerEntry>> disclaimers = new ConcurrentHashMap<>();

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

	private void mergeLoaded(Map<String, Object> loaded, Map<String, List<DisclaimerEntry>> target) {
		if (loaded == null) {
			return;
		}
		// Override per chiave: l'eventuale file esterno SOSTITUISCE l'intera lista
		// di voci della chiave omonima (coerente col comportamento precedente).
		loaded.forEach((k, v) -> {
			List<DisclaimerEntry> entries = parseEntries(v);
			if (!entries.isEmpty()) {
				target.put(normalize(k), entries);
			}
		});
	}

	/**
	 * Converte il valore YAML di una chiave in una lista di voci disclaimer.
	 * Sono accettati: stringa semplice, oggetto strutturato, oppure una lista
	 * di stringhe/oggetti (per piu' disclaimer distinti sotto la stessa chiave).
	 */
	private List<DisclaimerEntry> parseEntries(Object value) {
		if (value instanceof List<?> list) {
			List<DisclaimerEntry> entries = new ArrayList<>();
			for (Object item : list) {
				DisclaimerEntry entry = parseEntry(item);
				if (entry != null) {
					entries.add(entry);
				}
			}
			return entries;
		}
		DisclaimerEntry entry = parseEntry(value);
		return (entry != null) ? List.of(entry) : List.of();
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
			Object nomeGruppoObj = ((Map<String, Object>) map).get("nome_gruppo");
			String testo = (testoObj != null) ? testoObj.toString() : "";
			DisclaimerSeverityEnum severity = parseSeverity(severityObj);
			String nomeGruppo = (nomeGruppoObj != null) ? nomeGruppoObj.toString() : null;
			return new DisclaimerEntry(testo, severity, nomeGruppo);
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
	 * Voce disclaimer risolta, indipendente dal DTO di risposta (adesione o servizio).
	 */
	private static final class ResolvedDisclaimer {
		final String testo;
		final DisclaimerContestoEnum contesto;
		final DisclaimerSeverityEnum severity;
		final String profilo;
		final String nomeGruppo;

		ResolvedDisclaimer(String testo, DisclaimerContestoEnum contesto, DisclaimerSeverityEnum severity,
				String profilo, String nomeGruppo) {
			this.testo = testo;
			this.contesto = contesto;
			this.severity = severity;
			this.profilo = profilo;
			this.nomeGruppo = nomeGruppo;
		}
	}

	/**
	 * Rappresentazione interna di una voce disclaimer caricata dal YAML.
	 * Package-private per consentire l'accesso dai test.
	 */
	static final class DisclaimerEntry {
		final String testo;
		final DisclaimerSeverityEnum severity;
		final String nomeGruppo;

		DisclaimerEntry(String testo, DisclaimerSeverityEnum severity) {
			this(testo, severity, null);
		}

		DisclaimerEntry(String testo, DisclaimerSeverityEnum severity, String nomeGruppo) {
			this.testo = testo;
			this.severity = severity;
			this.nomeGruppo = nomeGruppo;
		}
	}
}
