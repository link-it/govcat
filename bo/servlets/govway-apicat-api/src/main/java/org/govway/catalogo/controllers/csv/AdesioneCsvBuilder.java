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
package org.govway.catalogo.controllers.csv;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.govway.catalogo.core.business.utils.EServiceBuilder;
import org.govway.catalogo.assembler.CertificateUtils;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity.AuthType;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.EstensioneAdesioneEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.servlets.model.Configurazione;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.util.Pair;

public class AdesioneCsvBuilder {

	private Logger logger = LoggerFactory.getLogger(AdesioneCsvBuilder.class);

	@Autowired
	private EServiceBuilder eServiceBuilder;

	@Autowired
	private Configurazione configurazione;

	private List<Pair<String, String>> custom;

	// Caches per sessione di export (popolate in getCSV, svuotate alla fine)
	private Map<String, String> profiloStringCache;
	private Map<Long, ServizioEntity> servizioCache;
	// Cache per le estensioni dei client (evita lazy loading ripetuto)
	private Map<Long, Set<EstensioneClientEntity>> clientEstensioniCache;
	// Cache per i subject dei certificati X.509 (evita di parsare più volte lo stesso certificato)
	private Map<String, String> certificatoSubjectCache;
	// Cache per le date di scadenza dei certificati X.509
	private Map<String, Date> certificatoScadenzaCache;

	public AdesioneCsvBuilder() {
		this.custom = new ArrayList<>();
		this.custom.add(Pair.of("finalita", "purposeId"));
		this.custom.add(Pair.of("nome_eservice_pdnd", "nome eService PDND"));
		this.custom.add(Pair.of("versione_eservice_pdnd", "versione eService PDND"));
	}

	private void initCaches() {
		this.profiloStringCache = new ConcurrentHashMap<>();
		this.servizioCache = new ConcurrentHashMap<>();
		this.clientEstensioniCache = new ConcurrentHashMap<>();
		this.certificatoSubjectCache = new ConcurrentHashMap<>();
		this.certificatoScadenzaCache = new ConcurrentHashMap<>();
	}

	private void clearCaches() {
		if (this.profiloStringCache != null) this.profiloStringCache.clear();
		if (this.servizioCache != null) this.servizioCache.clear();
		if (this.clientEstensioniCache != null) this.clientEstensioniCache.clear();
		if (this.certificatoSubjectCache != null) this.certificatoSubjectCache.clear();
		if (this.certificatoScadenzaCache != null) this.certificatoScadenzaCache.clear();
	}

	private AdesioneCsv toListEntries(AdesioneEntity adesione) {
		this.logger.debug("Adesione: " + adesione.getIdLogico() + " stato: " + adesione.getStato());

		if(!this.configurazione.getAdesione().getStatiSchedaAdesione().contains(adesione.getStato())) {
			this.logger.debug("Adesione: " + adesione.getIdLogico() + " in stato: " + adesione.getStato()+" non consentito per l'export. Stati consentiti ["+this.configurazione.getAdesione().getStatiSchedaAdesione()+"]");
			return null;
		}

		this.logger.debug("Adesione: " + adesione.getIdLogico() + " stato: " + adesione.getStato() +" OK");

		ServizioEntity servizioEntity = getCachedServizio(adesione);

		boolean hasCollaudo = hasCollaudo(adesione.getStato());
		boolean hasProduzione = hasProduzione(adesione.getStato());

		AdesioneCsv a = new AdesioneCsv();

		// Soggetto Erogatore
		a.setErogatore(servizioEntity.getDominio().getSoggettoReferente().getNome());

		// Servizio
		a.setServizio(servizioEntity.getNome() + " v" + servizioEntity.getVersione());

		// Soggetto Aderente
		a.setAderente(adesione.getSoggetto().getOrganizzazione().getNome());

		// Identificativo Adesione
		a.setIdAdesione(adesione.getIdLogico());

		// Stato Adesione
		a.setStatoAdesione(processStato(adesione.getStato()));

		// Referenti
		a.setReferenteRegionaleAdesione(getReferentiString(adesione.getReferenti()));
		a.setReferenteTecnicoAdesione(getReferentiTecniciString(adesione.getReferenti()));

		// Autenticazione (Stato) - aggregato da tutti i ClientAdesioneEntity
		a.setAutenticazioneStato(getAutenticazioneStatoAggregato(adesione));

		if(hasCollaudo) {
			// Rate Limiting e Proprietà aggregati da EstensioneAdesioneEntity
			a.setRateLimitingCollaudo(getRateLimitingValoreAggregato(adesione, AmbienteEnum.COLLAUDO));
			a.setProprietaCollaudo(getProprietaAggregata(adesione, AmbienteEnum.COLLAUDO));

			// Autenticazione Valore, Scadenza Certificato e Applicativi Autorizzati aggregati da ClientAdesioneEntity
			List<ClientAdesioneEntity> clientsCollaudo = getClients(adesione, AmbienteEnum.COLLAUDO);
			a.setAutenticazioneValoreCollaudo(getAutenticazioneValoreAggregato(clientsCollaudo));
			a.setScadenzaCertificatoCollaudo(getScadenzaCertificatoAggregato(clientsCollaudo));
			a.setApplicativiAutorizzatiCollaudo(getApplicativiAutorizzatiAggregato(clientsCollaudo));
		}

		if(hasProduzione) {
			// Rate Limiting e Proprietà aggregati da EstensioneAdesioneEntity
			a.setRateLimitingProduzione(getRateLimitingValoreAggregato(adesione, AmbienteEnum.PRODUZIONE));
			a.setProprietaProduzione(getProprietaAggregata(adesione, AmbienteEnum.PRODUZIONE));

			// Autenticazione Valore, Scadenza Certificato e Applicativi Autorizzati aggregati da ClientAdesioneEntity
			List<ClientAdesioneEntity> clientsProduzione = getClients(adesione, AmbienteEnum.PRODUZIONE);
			a.setAutenticazioneValoreProduzione(getAutenticazioneValoreAggregato(clientsProduzione));
			a.setScadenzaCertificatoProduzione(getScadenzaCertificatoAggregato(clientsProduzione));
			a.setApplicativiAutorizzatiProduzione(getApplicativiAutorizzatiAggregato(clientsProduzione));
		}

		return a;
	}

	private String processStato(String stato) {
		if (stato == null || stato.isEmpty()) {
			return stato;
		}

		String result;

		if (stato.endsWith("_produzione_senza_collaudo")) {
			String prefix = stato.substring(0, stato.length() - "_produzione_senza_collaudo".length());
			prefix = prefix.replace("_", " ");
			result = capitalizeFirst(prefix) + " in produzione senza collaudo";
		} else if (stato.endsWith("_produzione")) {
			String prefix = stato.substring(0, stato.length() - "_produzione".length());
			prefix = prefix.replace("_", " ");
			result = capitalizeFirst(prefix) + " in produzione";
		} else if (stato.endsWith("_collaudo")) {
			String prefix = stato.substring(0, stato.length() - "_collaudo".length());
			prefix = prefix.replace("_", " ");
			result = capitalizeFirst(prefix) + " in collaudo";
		} else {
			result = capitalizeFirst(stato.replace("_", " "));
		}

		return result;
	}

	private String capitalizeFirst(String str) {
		if (str == null || str.isEmpty()) {
			return str;
		}
		return str.substring(0, 1).toUpperCase() + str.substring(1);
	}

	private boolean hasCollaudo(String stato) {
		return !stato.contains("senza_collaudo");
	}

	private boolean hasProduzione(String stato) {
		return stato.contains("produzione");
	}

	private List<ClientAdesioneEntity> getClients(AdesioneEntity adesione, AmbienteEnum ambiente) {
		return adesione.getClient().stream()
				.filter(ca -> ca.getAmbiente().equals(ambiente))
				.collect(Collectors.toList());
	}

	/**
	 * Versione cached di adesione.getServizio() per evitare di eseguire
	 * la query LAZY ogni volta per adesioni che condividono lo stesso servizio.
	 */
	private ServizioEntity getCachedServizio(AdesioneEntity adesione) {
		// getId() su un proxy Hibernate non lo inizializza
		Long servizioId = adesione.getServizio().getId();
		return this.servizioCache.computeIfAbsent(servizioId,
				id -> adesione.getServizio());
	}

	/**
	 * Versione cached di eServiceBuilder.getProfiloString() per evitare
	 * di accedere alla configurazione più volte per lo stesso profilo.
	 */
	private String getCachedProfiloString(String profiloKey) {
		if (profiloKey == null) return null;
		return this.profiloStringCache.computeIfAbsent(profiloKey,
				key -> this.eServiceBuilder.getProfiloString(key));
	}

	/**
	 * Versione cached delle estensioni del client per evitare lazy loading ripetuto.
	 */
	private Set<EstensioneClientEntity> getCachedClientEstensioni(ClientEntity client) {
		if (client == null) return java.util.Collections.emptySet();
		return this.clientEstensioniCache.computeIfAbsent(client.getId(),
				id -> client.getEstensioni());
	}

	/**
	 * Estrae il valore per una proprietà specifica dalle estensioni del client.
	 */
	private String getEstensioneValore(Set<EstensioneClientEntity> estensioni, String propertyName) {
		return estensioni.stream()
				.filter(e -> e.getNome().equals(propertyName))
				.findFirst()
				.map(EstensioneClientEntity::getValore)
				.orElse(null);
	}

	/**
	 * Verifica se esiste una proprietà specifica nelle estensioni del client.
	 */
	private boolean existsEstensione(Set<EstensioneClientEntity> estensioni, String propertyName) {
		return estensioni.stream()
				.anyMatch(e -> e.getNome().equals(propertyName));
	}

	private String getAutenticazioneStatoAggregato(AdesioneEntity adesione) {
		Set<String> profili = adesione.getClient().stream()
				.map(ca -> getCachedProfiloString(ca.getProfilo()))
				.filter(p -> p != null && !p.isEmpty())
				.collect(Collectors.toCollection(java.util.LinkedHashSet::new));

		if(profili.isEmpty()) {
			return null;
		}
		return String.join("\n", profili);
	}

	private String getAutenticazioneValoreAggregato(List<ClientAdesioneEntity> clients) {
		List<String> valori = new ArrayList<>();
		for(ClientAdesioneEntity clientAdesione: clients) {
			ClientEntity client = clientAdesione.getClient();
			if(client != null) {
				String valore = getAutenticazioneValoreDiretto(client);
				if(valore != null && !valore.isEmpty()) {
					valori.add(valore);
				}
			}
		}
		if(valori.isEmpty()) {
			return null;
		}
		return String.join("\n", valori);
	}

	private String getApplicativiAutorizzatiAggregato(List<ClientAdesioneEntity> clients) {
		List<String> nomi = new ArrayList<>();
		for(ClientAdesioneEntity clientAdesione: clients) {
			ClientEntity client = clientAdesione.getClient();
			if(client != null && client.getNome() != null && !client.getNome().isEmpty()) {
				nomi.add(client.getNome());
			}
		}
		if(nomi.isEmpty()) {
			return null;
		}
		return String.join("\n", nomi);
	}

	private String getRateLimitingValoreAggregato(AdesioneEntity adesione, AmbienteEnum ambiente) {
		// Filtra le estensioni per rate limiting
		List<EstensioneAdesioneEntity> estensioniRateLimiting = adesione.getEstensioni().stream()
				.filter(e -> e.getAmbiente().equals(ambiente) &&
						(e.getNome().equals("rate_limiting_quota") || e.getNome().equals("rate_limiting_periodo")))
				.collect(Collectors.toList());

		// Raggruppa le estensioni per API (usando Optional per gestire null)
		java.util.Map<Optional<ApiEntity>, List<EstensioneAdesioneEntity>> estensioniPerApi = estensioniRateLimiting.stream()
				.collect(Collectors.groupingBy(e -> Optional.ofNullable(e.getApi()), java.util.LinkedHashMap::new, Collectors.toList()));

		List<String> risultati = new ArrayList<>();
		for(java.util.Map.Entry<Optional<ApiEntity>, List<EstensioneAdesioneEntity>> entry: estensioniPerApi.entrySet()) {
			ApiEntity api = entry.getKey().orElse(null);
			List<EstensioneAdesioneEntity> estensioni = entry.getValue();

			String quota = estensioni.stream()
					.filter(e -> e.getNome().equals("rate_limiting_quota"))
					.findFirst()
					.map(EstensioneAdesioneEntity::getValore)
					.orElse(null);
			String periodo = estensioni.stream()
					.filter(e -> e.getNome().equals("rate_limiting_periodo"))
					.findFirst()
					.map(EstensioneAdesioneEntity::getValore)
					.orElse(null);

			if(quota != null && periodo != null) {
				String valore = quota + " / " + periodo;
				if(api != null) {
					risultati.add(api.getNome() + " v" + api.getVersione() + ": " + valore);
				} else {
					risultati.add(valore);
				}
			}
		}

		if(risultati.isEmpty()) {
			return null;
		}
		return String.join("\n", risultati);
	}

	private String getProprietaAggregata(AdesioneEntity adesione, AmbienteEnum ambiente) {
		// Filtra le estensioni per proprietà custom
		List<EstensioneAdesioneEntity> estensioniProprieta = adesione.getEstensioni().stream()
				.filter(e -> e.getAmbiente().equals(ambiente) &&
						this.custom.stream().anyMatch(c -> c.getFirst().equals(e.getNome())))
				.collect(Collectors.toList());

		// Raggruppa le estensioni per API (usando Optional per gestire null)
		java.util.Map<Optional<ApiEntity>, List<EstensioneAdesioneEntity>> estensioniPerApi = estensioniProprieta.stream()
				.collect(Collectors.groupingBy(e -> Optional.ofNullable(e.getApi()), java.util.LinkedHashMap::new, Collectors.toList()));

		List<String> risultati = new ArrayList<>();
		for(java.util.Map.Entry<Optional<ApiEntity>, List<EstensioneAdesioneEntity>> entry: estensioniPerApi.entrySet()) {
			ApiEntity api = entry.getKey().orElse(null);
			List<EstensioneAdesioneEntity> estensioni = entry.getValue();

			for(Pair<String, String> c: this.custom) {
				String prop = estensioni.stream()
						.filter(e -> e.getNome().equals(c.getFirst()))
						.findFirst()
						.map(EstensioneAdesioneEntity::getValore)
						.orElse(null);

				if(prop != null && !prop.isEmpty()) {
					String label = c.getSecond() + ": " + prop;
					if(api != null) {
						risultati.add(api.getNome() + " v" + api.getVersione() + ": " + label);
					} else {
						risultati.add(label);
					}
				}
			}
		}

		if(risultati.isEmpty()) {
			return null;
		}
		return String.join("\n", risultati);
	}

	// Costanti per i nomi delle proprietà nelle estensioni client
	private static final String CLIENT_ID_PROPERTY = "client_id";
	private static final String USERNAME_PROPERTY = "username";
	private static final String AUTENTICAZIONE_CN_PROPERTY = "autenticazione_CN";
	private static final String FIRMA_CN_PROPERTY = "firma_CN";
	private static final String AUTENTICAZIONE_CERTIFICATO_PROPERTY = "autenticazione_CERTIFICATO";
	private static final String FIRMA_CERTIFICATO_PROPERTY = "firma_CERTIFICATO";

	/**
	 * Estrae il valore di autenticazione direttamente dalle estensioni del client,
	 * senza usare l'assembler e senza caricare i BLOB dei certificati.
	 * Per i certificati, mostra il CN se disponibile, altrimenti "presente".
	 */
	private String getAutenticazioneValoreDiretto(ClientEntity client) {
		AuthType authType = client.getAuthType();
		if (authType == null) {
			return null;
		}

		Set<EstensioneClientEntity> estensioni = getCachedClientEstensioni(client);

		switch(authType) {
		case HTTPS:
			return "certificato autenticazione: " + getCertificatoInfo(estensioni, "autenticazione");

		case HTTPS_SIGN:
			return "certificato autenticazione: " + getCertificatoInfo(estensioni, "autenticazione") +
				   " certificato firma: " + getCertificatoInfo(estensioni, "firma");

		case SIGN:
			return "certificato firma: " + getCertificatoInfo(estensioni, "firma");

		case HTTPS_PDND:
			return "certificato autenticazione: " + getCertificatoInfo(estensioni, "autenticazione") +
				   " client_id: " + getEstensioneValore(estensioni, CLIENT_ID_PROPERTY);

		case HTTPS_PDND_SIGN:
			return "certificato autenticazione: " + getCertificatoInfo(estensioni, "autenticazione") +
				   " certificato firma: " + getCertificatoInfo(estensioni, "firma") +
				   " client_id: " + getEstensioneValore(estensioni, CLIENT_ID_PROPERTY);

		case PDND:
			return "client_id: " + getEstensioneValore(estensioni, CLIENT_ID_PROPERTY);

		case SIGN_PDND:
			return "certificato firma: " + getCertificatoInfo(estensioni, "firma") +
				   " client_id: " + getEstensioneValore(estensioni, CLIENT_ID_PROPERTY);

		case HTTP_BASIC:
			return "username: " + getEstensioneValore(estensioni, USERNAME_PROPERTY);

		case OAUTH_AUTHORIZATION_CODE:
		case OAUTH_CLIENT_CREDENTIALS:
			return "client_id: " + getEstensioneValore(estensioni, CLIENT_ID_PROPERTY);

		case INDIRIZZO_IP:
		case NO_DATI:
		default:
			return null;
		}
	}

	/**
	 * Ottiene informazioni sul certificato, estraendo il subject dal certificato X.509.
	 * Usa una cache per evitare di parsare più volte lo stesso certificato.
	 */
	private String getCertificatoInfo(Set<EstensioneClientEntity> estensioni, String prefix) {
		String cnProperty = prefix + "_CN";
		String certProperty = prefix + "_CERTIFICATO";

		// Prima verifica se esiste un CN (certificato richiesto via CN)
		String cn = getEstensioneValore(estensioni, cnProperty);
		if (cn != null && !cn.isEmpty()) {
			// Se c'è anche il certificato, parsalo per estrarre il subject completo
			DocumentoEntity documento = getDocumentoEstensione(estensioni, certProperty);
			if (documento != null) {
				String subject = getCachedCertificatoSubject(documento);
				if (subject != null) {
					return subject;
				}
			}
			// Altrimenti ritorna il CN
			return cn;
		}

		// Verifica se esiste il certificato (tipo FORNITO o CSR)
		DocumentoEntity documento = getDocumentoEstensione(estensioni, certProperty);
		if (documento != null) {
			String subject = getCachedCertificatoSubject(documento);
			if (subject != null) {
				return subject;
			}
			return "presente";
		}

		return "non configurato";
	}

	/**
	 * Ottiene il documento da un'estensione, se presente.
	 */
	private DocumentoEntity getDocumentoEstensione(Set<EstensioneClientEntity> estensioni, String propertyName) {
		return estensioni.stream()
				.filter(e -> e.getNome().equals(propertyName) && e.getDocumento() != null)
				.findFirst()
				.map(EstensioneClientEntity::getDocumento)
				.orElse(null);
	}

	/**
	 * Ottiene il subject del certificato X.509 dalla cache, oppure lo parsa e lo salva in cache.
	 */
	private String getCachedCertificatoSubject(DocumentoEntity documento) {
		if (documento == null || documento.getUuid() == null) {
			return null;
		}

		String uuid = documento.getUuid();
		return this.certificatoSubjectCache.computeIfAbsent(uuid, id -> {
			try {
				return CertificateUtils.getSubject(documento);
			} catch (Exception e) {
				this.logger.error("Errore nel parsing del certificato con UUID [" + uuid + "]: " + e.getMessage());
				return null;
			}
		});
	}

	/**
	 * Ottiene la data di scadenza del certificato X.509 dalla cache, oppure la parsa e la salva in cache.
	 */
	private Date getCachedCertificatoScadenza(DocumentoEntity documento) {
		if (documento == null || documento.getUuid() == null) {
			return null;
		}

		String uuid = documento.getUuid();
		return this.certificatoScadenzaCache.computeIfAbsent(uuid, id -> {
			try {
				return CertificateUtils.getNotAfter(documento);
			} catch (Exception e) {
				this.logger.error("Errore nel parsing della scadenza del certificato con UUID [" + uuid + "]: " + e.getMessage());
				return null;
			}
		});
	}

	/**
	 * Ottiene la scadenza del certificato di autenticazione aggregata da tutti i client.
	 */
	private String getScadenzaCertificatoAggregato(List<ClientAdesioneEntity> clients) {
		SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
		List<String> scadenze = new ArrayList<>();

		for(ClientAdesioneEntity clientAdesione: clients) {
			ClientEntity client = clientAdesione.getClient();
			if(client != null) {
				Set<EstensioneClientEntity> estensioni = getCachedClientEstensioni(client);
				DocumentoEntity documento = getDocumentoEstensione(estensioni, AUTENTICAZIONE_CERTIFICATO_PROPERTY);
				if(documento != null) {
					Date scadenza = getCachedCertificatoScadenza(documento);
					if(scadenza != null) {
						String scadenzaStr = client.getNome() + ": " + sdf.format(scadenza);
						scadenze.add(scadenzaStr);
					}
				}
			}
		}

		if(scadenze.isEmpty()) {
			return null;
		}
		return String.join("\n", scadenze);
	}

	private static String getReferentiString(Set<ReferenteAdesioneEntity> referenti) {
		return getGenericReferentiString(referenti, TIPO_REFERENTE.REFERENTE);
	}

	private static String getReferentiTecniciString(Set<ReferenteAdesioneEntity> referenti) {
		return getGenericReferentiString(referenti, TIPO_REFERENTE.REFERENTE_TECNICO);
	}

	private static String getGenericReferentiString(Set<ReferenteAdesioneEntity> referenti, TIPO_REFERENTE tipo) {
		return referenti.stream().filter(r -> r.getTipo().equals(tipo))
				.map(r -> r.getReferente().getEmailAziendale())
				.collect(Collectors.joining("\n"));
	}

	public byte[] getCSV(Collection<AdesioneEntity> adesioni) {
		// Inizializza le cache per questa sessione di export
		initCaches();

		try {
			Collection<AdesioneCsv> adesioniCSV = new ArrayList<>();

			for(AdesioneEntity adesione: adesioni) {
				AdesioneCsv csv = toListEntries(adesione);
				if(csv != null) {
					adesioniCSV.add(csv);
				}
			}

			String csv = "";
			try {
				AdesioneCsvMapper adesioneMapper = new AdesioneCsvMapper();
				csv = adesioneMapper.writeValues(adesioniCSV);
				if(csv.isEmpty()) {
					AdesioneCsv a = new AdesioneCsv();
					String header = adesioneMapper.writeValues(Arrays.asList(a));

					int indexOfNewLine = header.indexOf('\n');

					return header.substring(0, indexOfNewLine).getBytes();
				} else {
					return csv.getBytes();
				}
			} catch(IOException e) {
				logger.error("Errore durante la serializzazione del CSV: " + e.getMessage(), e);
			}
			return "".getBytes();
		} finally {
			// Pulisci le cache alla fine dell'export
			clearCaches();
		}
	}

}
