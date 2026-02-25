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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.govway.catalogo.assembler.CertificateUtils;
import org.govway.catalogo.assembler.ClientAdesioneItemAssembler;
import org.govway.catalogo.core.business.utils.EServiceBuilder;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.EstensioneAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.servlets.model.AuthTypeHttpBasic;
import org.govway.catalogo.servlets.model.AuthTypeHttps;
import org.govway.catalogo.servlets.model.AuthTypeHttpsPdnd;
import org.govway.catalogo.servlets.model.AuthTypeHttpsPdndSign;
import org.govway.catalogo.servlets.model.AuthTypeHttpsSign;
import org.govway.catalogo.servlets.model.AuthTypeOAuthAuthorizationCode;
import org.govway.catalogo.servlets.model.AuthTypeOAuthClientCredentials;
import org.govway.catalogo.servlets.model.AuthTypePdnd;
import org.govway.catalogo.servlets.model.AuthTypeSign;
import org.govway.catalogo.servlets.model.AuthTypeSignPdnd;
import org.govway.catalogo.servlets.model.CertificatoClient;
import org.govway.catalogo.servlets.model.CertificatoClientFornito;
import org.govway.catalogo.servlets.model.CertificatoClientRichiestoCn;
import org.govway.catalogo.servlets.model.CertificatoClientRichiestoCsr;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.Documento;
import org.govway.catalogo.servlets.model.ItemClientAdesione;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.util.Pair;

public class AdesioneCsvBuilder {

	private Logger logger = LoggerFactory.getLogger(AdesioneCsvBuilder.class);

	@Autowired
	private ClientAdesioneItemAssembler clientAdesioneItemAssembler;

	@Autowired
	private EServiceBuilder eServiceBuilder;

	@Autowired
	private Configurazione configurazione;

	private List<Pair<String, String>> custom;

	public AdesioneCsvBuilder() {
		this.custom = new ArrayList<>();
		this.custom.add(Pair.of("finalita", "purposeId"));
		this.custom.add(Pair.of("nome_eservice_pdnd", "nome eService PDND"));
		this.custom.add(Pair.of("versione_eservice_pdnd", "versione eService PDND"));
	}

	private AdesioneCsv toListEntries(AdesioneEntity adesione) {
		this.logger.debug("Adesione: " + adesione.getIdLogico() + " stato: " + adesione.getStato());

		if(!this.configurazione.getAdesione().getStatiSchedaAdesione().contains(adesione.getStato())) {
			this.logger.debug("Adesione: " + adesione.getIdLogico() + " in stato: " + adesione.getStato()+" non consentito per l'export. Stati consentiti ["+this.configurazione.getAdesione().getStatiSchedaAdesione()+"]");
			return null;
		}

		this.logger.debug("Adesione: " + adesione.getIdLogico() + " stato: " + adesione.getStato() +" OK");

		ServizioEntity servizioEntity = adesione.getServizio();

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

			// Autenticazione Valore e Applicativi Autorizzati aggregati da ClientAdesioneEntity
			List<ClientAdesioneEntity> clientsCollaudo = getClients(adesione, AmbienteEnum.COLLAUDO);
			a.setAutenticazioneValoreCollaudo(getAutenticazioneValoreAggregato(clientsCollaudo));
			a.setApplicativiAutorizzatiCollaudo(getApplicativiAutorizzatiAggregato(clientsCollaudo));
		}

		if(hasProduzione) {
			// Rate Limiting e Proprietà aggregati da EstensioneAdesioneEntity
			a.setRateLimitingProduzione(getRateLimitingValoreAggregato(adesione, AmbienteEnum.PRODUZIONE));
			a.setProprietaProduzione(getProprietaAggregata(adesione, AmbienteEnum.PRODUZIONE));

			// Autenticazione Valore e Applicativi Autorizzati aggregati da ClientAdesioneEntity
			List<ClientAdesioneEntity> clientsProduzione = getClients(adesione, AmbienteEnum.PRODUZIONE);
			a.setAutenticazioneValoreProduzione(getAutenticazioneValoreAggregato(clientsProduzione));
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

	private String getAutenticazioneStatoAggregato(AdesioneEntity adesione) {
		Set<String> profili = adesione.getClient().stream()
				.map(ca -> this.eServiceBuilder.getProfiloString(ca.getProfilo()))
				.filter(p -> p != null && !p.isEmpty())
				.collect(Collectors.toCollection(java.util.LinkedHashSet::new));

		if(profili.isEmpty()) {
			return null;
		}
		return String.join("\n", profili);
	}

	private String getAutenticazioneValoreAggregato(List<ClientAdesioneEntity> clients) {
		List<String> valori = new ArrayList<>();
		for(ClientAdesioneEntity client: clients) {
			if(client.getClient() != null) {
				ItemClientAdesione clientItem = this.clientAdesioneItemAssembler.toModel(client);
				String valore = getAutenticazioneValore(clientItem, client.getClient());
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
		for(ClientAdesioneEntity client: clients) {
			ItemClientAdesione clientItem = this.clientAdesioneItemAssembler.toModel(client);
			if(clientItem.getNome() != null && !clientItem.getNome().isEmpty()) {
				nomi.add(clientItem.getNome());
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

	private String getAutenticazioneValore(ItemClientAdesione client, ClientEntity entity) {
		switch(client.getDatiSpecifici().getAuthType()) {
		case HTTPS: return getInfo((AuthTypeHttps)client.getDatiSpecifici(), entity);
		case HTTPS_SIGN: return getInfo((AuthTypeHttpsSign)client.getDatiSpecifici(), entity);
		case SIGN: return getInfo((AuthTypeSign)client.getDatiSpecifici(), entity);
		case HTTPS_PDND: return getInfo((AuthTypeHttpsPdnd)client.getDatiSpecifici(), entity);
		case HTTPS_PDND_SIGN: return getInfo((AuthTypeHttpsPdndSign)client.getDatiSpecifici(), entity);
		case PDND: return getInfo((AuthTypePdnd)client.getDatiSpecifici());
		case SIGN_PDND: return getInfo((AuthTypeSignPdnd)client.getDatiSpecifici(), entity);
		case HTTP_BASIC: return getInfo((AuthTypeHttpBasic)client.getDatiSpecifici());
		case INDIRIZZO_IP: return null;
		case NO_DATI: return null;
		case OAUTH_AUTHORIZATION_CODE: return getInfo((AuthTypeOAuthAuthorizationCode)client.getDatiSpecifici());
		case OAUTH_CLIENT_CREDENTIALS: return getInfo((AuthTypeOAuthClientCredentials)client.getDatiSpecifici());
		}

		return null;
	}

	private String getInfo(AuthTypeOAuthClientCredentials datiSpecifici) {
		return "client_id:" + datiSpecifici.getClientId();
	}

	private String getInfo(AuthTypeOAuthAuthorizationCode datiSpecifici) {
		return "client_id:" + datiSpecifici.getClientId();
	}

	private String getInfo(AuthTypeHttpBasic datiSpecifici) {
		return "username: " + datiSpecifici.getUsername();
	}

	private String getInfo(AuthTypeSignPdnd datiSpecifici, ClientEntity client) {
		return "certificato firma: " + getInfoFromCertificato(datiSpecifici.getCertificatoFirma(), client) + " " + "client_id:" + datiSpecifici.getClientId();
	}

	private String getInfoFromCertificato(CertificatoClient certificatoFirma, ClientEntity client) {
		switch(certificatoFirma.getTipoCertificato()) {
		case FORNITO: return getSubject(((CertificatoClientFornito)certificatoFirma).getCertificato(), client);
		case RICHIESTO_CN: return getSubject(((CertificatoClientRichiestoCn)certificatoFirma).getCertificato(), client);
		case RICHIESTO_CSR: return getSubject(((CertificatoClientRichiestoCsr)certificatoFirma).getCertificato(), client);
		}
		return null;
	}

	private String getSubject(Documento documento, ClientEntity client) {
		if(documento != null) {
			try {
				return CertificateUtils.getSubject(client, documento.getUuid().toString());
			} catch(Exception e) {
				this.logger.error("Errore nella ricerca del certificato: " + e.getMessage());
				return null;
			}
		} else {
			this.logger.error("Nessun certificato trovato");
			return null;
		}
	}

	private String getInfo(AuthTypePdnd datiSpecifici) {
		return "client_id:" + datiSpecifici.getClientId();
	}

	private String getInfo(AuthTypeHttpsPdndSign datiSpecifici, ClientEntity client) {
		return "certificato autenticazione: " + getInfoFromCertificato(datiSpecifici.getCertificatoAutenticazione(), client) + " " + "certificato firma: " + getInfoFromCertificato(datiSpecifici.getCertificatoFirma(), client) + " " + "client_id:" + datiSpecifici.getClientId();
	}

	private String getInfo(AuthTypeHttpsPdnd datiSpecifici, ClientEntity client) {
		return "certificato autenticazione: " + getInfoFromCertificato(datiSpecifici.getCertificatoAutenticazione(), client) + " " + "client_id:" + datiSpecifici.getClientId();
	}

	private String getInfo(AuthTypeSign datiSpecifici, ClientEntity client) {
		return "certificato firma: " + getInfoFromCertificato(datiSpecifici.getCertificatoFirma(), client);
	}

	private String getInfo(AuthTypeHttpsSign datiSpecifici, ClientEntity client) {
		return "certificato autenticazione: " + getInfoFromCertificato(datiSpecifici.getCertificatoAutenticazione(), client) + " " + "certificato firma: " + getInfoFromCertificato(datiSpecifici.getCertificatoFirma(), client);
	}

	private String getInfo(AuthTypeHttps datiSpecifici, ClientEntity client) {
		return "certificato autenticazione: " + getInfoFromCertificato(datiSpecifici.getCertificatoAutenticazione(), client);
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
	}

}
