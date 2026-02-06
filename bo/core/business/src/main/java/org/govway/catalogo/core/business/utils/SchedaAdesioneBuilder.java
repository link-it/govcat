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
package org.govway.catalogo.core.business.utils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.Principal;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.xml.bind.JAXBException;

import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ErogazioneEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.core.orm.entity.PackageServizioEntity;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ReferenteServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.stampe.StampePdf;
import org.govway.catalogo.stampe.model.ApiType;
import org.govway.catalogo.stampe.model.ConfigType;
import org.govway.catalogo.stampe.model.ConfigsType;
import org.govway.catalogo.stampe.model.ReferentItemType;
import org.govway.catalogo.stampe.model.ReferentType;
import org.govway.catalogo.stampe.model.ReferentsType;
import org.govway.catalogo.stampe.model.RowType;
import org.govway.catalogo.stampe.model.SchedaAdesione;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SchedaAdesioneBuilder {

	private Logger logger = LoggerFactory.getLogger(SchedaAdesioneBuilder.class);

	@Autowired
	private ConfigurazioneEService configurazione;

	@Autowired
	private EServiceBuilder serviceBuilder;

	@Autowired
	private StampeLabels stampeLabels;

	public byte[] getSchedaAdesione(AdesioneEntity adesione) {
		return getSchedaAdesione(adesione, true, true);
	}

	public byte[] getSchedaAdesione(AdesioneEntity adesione, boolean mostraRichiedente, boolean mostraReferenti) {

		SchedaAdesione a = new SchedaAdesione();

		a.setHeader(this.stampeLabels.getScheda().getHeader());
		a.setTitolo(this.stampeLabels.getScheda().getLabel().getAderente() + " " + adesione.getSoggetto().getOrganizzazione().getNome());
		a.setServizio(adesione.getServizio().getNome());
		a.setVersioneServizio(adesione.getServizio().getVersione());
		a.setOrganizzazioneAderente(adesione.getSoggetto().getOrganizzazione().getNome());

		if(adesione.getSoggetto().getOrganizzazione().getSoggetti().size() > 1) {
			a.setSoggettoAderente(adesione.getSoggetto().getNome());
		}

		a.setIdLogico(adesione.getIdLogico());
		a.setStato(getStato(adesione.getStato()));
		try {
			SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm");

			a.setDataCreazione(sdf.format(adesione.getDataCreazione()));
			if(adesione.getDataUltimaModifica() != null) {
				a.setDataUltimoAggiornamento(sdf.format(adesione.getDataUltimaModifica()));
			}
			a.setDataStampa(sdf.format(new Date()));
		} catch(Exception e) {
			this.logger.error("Errore nel format della data: " + e.getMessage(), e);
		}

		if(this.configurazione.getPdfLogo()!=null) {
			a.setLogo(this.configurazione.getPdfLogo());
		}


		ApiType api = new ApiType();
		
		List<ApiEntity> listApi = getAPI(adesione.getServizio());
		for(ApiEntity apiEntity: listApi) {

			RowType apirow = new RowType();
			if(apiEntity.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO)) {
				apirow.setLabel(this.stampeLabels.getScheda().getLabel().getApi());
			} else {
				apirow.setLabel(this.stampeLabels.getScheda().getLabel().getApiRisposta());
			}
			apirow.setValore(apiEntity.getNome() + " v" + apiEntity.getVersione());
			api.getRow().add(apirow);

			List<AuthTypeEntity> authTypeList = apiEntity.getAuthType();

			authTypeList.stream().findAny().ifPresent(authType -> {
			    RowType modauth = new RowType();
			    modauth.setLabel(this.stampeLabels.getScheda().getLabel().getModalitaAutenticazione());
			    String profilo = authType.getProfilo();

			    if (this.configurazione.getProfili().containsKey(profilo)) {
			        modauth.setValore(this.configurazione.getProfili().get(profilo));
			    } else {
			        modauth.setValore("--");
			    }

			    api.getRow().add(modauth);
			});

		}

		// Aggiungi richiedente se configurato
		if(mostraRichiedente && adesione.getRichiedente() != null) {
			String richiedenteValue = adesione.getRichiedente().getNome() + " " + adesione.getRichiedente().getCognome();
			// Imposta il valore anche nel campo diretto per backward compatibility
			a.setRichiedente(richiedenteValue);
			// Aggiungi anche come riga nella tabella per la visualizzazione nel PDF
			RowType rigaRichiedente = new RowType();
			rigaRichiedente.setLabel("Richiedente");
			rigaRichiedente.setValore(richiedenteValue);
			api.getRow().add(rigaRichiedente);
		}

		a.setApi(api);

		ConfigsType configs = new ConfigsType();
		ConfigType collaudoConfig = new ConfigType();
		ConfigType produzioneConfig = new ConfigType();

		for(ClientAdesioneEntity client: adesione.getClient()) {

			if(client.getClient()!=null) {
				ApiType apiConf = new ApiType();

				// riga client
				RowType row1 = new RowType();
				row1.setLabel(this.stampeLabels.getScheda().getLabel().getClient());
				row1.setValore(client.getClient().getNome());
				apiConf.getRow().add(row1);

				// riga profilo
				RowType row2 = new RowType();
				row2.setLabel(this.stampeLabels.getScheda().getLabel().getProfilo());
				row2.setValore(this.configurazione.getProfili().get(client.getProfilo()));
				apiConf.getRow().add(row2);
				
				// Common Name
				RowType row3 = new RowType();
//				row3.setLabel("Common Name");
				row3.setLabel(getLabelConfClient(client.getClient()));
				row3.setValore(getValoreConfClient(client.getClient()));
				
				apiConf.getRow().add(row3);
				if(client.getClient().getAmbiente().equals(AmbienteEnum.COLLAUDO)) {
					collaudoConfig.getApi().add(apiConf);
				} else {
					produzioneConfig.getApi().add(apiConf);
				}
			}
		}

		for(ErogazioneEntity erog: adesione.getErogazioni()) {
			ApiType apiConf = new ApiType();

			// Erogazione
			RowType row1 = new RowType();
			row1.setLabel(this.stampeLabels.getScheda().getLabel().getErogazione());
			row1.setValore(erog.getApi().getNome());
			apiConf.getRow().add(row1);

			// Base URL
			RowType row = new RowType();
			row.setLabel(this.stampeLabels.getScheda().getLabel().getBaseurl());
			String url = erog.getUrl();
			row.setValore(url);
			apiConf.getRow().add(row);
			if(erog.getAmbiente().equals(AmbienteEnum.COLLAUDO)) {
				collaudoConfig.getApi().add(apiConf);
			} else {
				produzioneConfig.getApi().add(apiConf);
			}
		}

		configs.getCollaudo().add(collaudoConfig);
		configs.getProduzione().add(produzioneConfig);
		a.setConfigs(configs);

		if(mostraReferenti) {
			ReferentsType referents = new ReferentsType();
			boolean hasReferents = false;

			// Referenti adesione (subscription)
			if(!adesione.getReferenti().isEmpty()) {
				ReferentType subRef = new ReferentType();

				for(ReferenteAdesioneEntity ref: adesione.getReferenti()) {
					String tipoRef = null;
					if(ref.getTipo().equals(TIPO_REFERENTE.REFERENTE)) {
						tipoRef = this.stampeLabels.getScheda().getLabel().getReferente();
					} else {
						tipoRef = this.stampeLabels.getScheda().getLabel().getReferenteTecnico();
					}
					ReferentItemType gritm = getReferentItem(ref.getReferente(), tipoRef);
					subRef.getItem().add(gritm);

				}

				if(!subRef.getItem().isEmpty()) {
					referents.setSubscription(subRef);
					hasReferents = true;
				}
			}

			// Referenti servizio (service)
			if(!adesione.getServizio().getReferenti().isEmpty()) {
				ReferentType servRef = new ReferentType();

				for(ReferenteServizioEntity ref: adesione.getServizio().getReferenti()) {

					String tipoRef = null;
					if(ref.getTipo().equals(TIPO_REFERENTE.REFERENTE)) {
						tipoRef = this.stampeLabels.getScheda().getLabel().getReferente();
					} else {
						tipoRef = this.stampeLabels.getScheda().getLabel().getReferenteTecnico();
					}

					ReferentItemType gritm = getReferentItem(ref.getReferente(), tipoRef);
					servRef.getItem().add(gritm);
				}

				if(!servRef.getItem().isEmpty()) {
					referents.setService(servRef);
					hasReferents = true;
				}
			}

			if(hasReferents) {
				a.setReferents(referents);
			}
		}

		ApiType apiEC = new ApiType();
		ApiType apiEP = new ApiType();
		for(ApiEntity apiEntity: listApi) {
			if(apiEntity.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO)) {
				
				String label = apiEntity.getNome() + " v" + apiEntity.getVersione();
				
				if(apiEntity.getCollaudo() != null && apiEntity.getCollaudo().getUrl()!= null) {
					RowType row = new RowType();
					row.setLabel(label);
					row.setValore(this.serviceBuilder.getUrlInvocazione(apiEntity, true));
					apiEC.getRow().add(row);
				}
				if(apiEntity.getProduzione() != null && apiEntity.getProduzione().getUrl()!= null) {
					RowType row = new RowType();
					row.setLabel(label);
					row.setValore(this.serviceBuilder.getUrlInvocazione(apiEntity, false));
					apiEP.getRow().add(row);
				}
			}
		}
		
		// label titolo tabella
		if(apiEC.getRow().size() > 1) {
			apiEC.setTitolo(this.stampeLabels.getScheda().getBaseurl().getPubbliche() + " " + this.stampeLabels.getScheda().getBaseurl().getCollaudo());
		} else {
			apiEC.setTitolo(this.stampeLabels.getScheda().getBaseurl().getPubblica() + " " + this.stampeLabels.getScheda().getBaseurl().getCollaudo());
		}

		if(apiEP.getRow().size() > 1) {
			apiEP.setTitolo(this.stampeLabels.getScheda().getBaseurl().getPubbliche() + " " + this.stampeLabels.getScheda().getBaseurl().getProduzione());
		} else {
			apiEP.setTitolo(this.stampeLabels.getScheda().getBaseurl().getPubblica() + " " + this.stampeLabels.getScheda().getBaseurl().getProduzione());
		}
		
		a.setBaseUrlCollaudo(apiEC);
		
		a.setBaseUrlProduzione(apiEP);
		try {
			return StampePdf.getInstance().creaAdesionePDF(logger,a);
		} catch (Exception e) {
			this.logger.error("Errore durante la creazione della scheda adesione: " + e.getMessage(), e);
		}
		return null;
	}

	private List<ApiEntity> getAPI(ServizioEntity servizio) {
		if(servizio.is_package()) {
			List<ApiEntity> lstApi = new ArrayList<>();
			for(PackageServizioEntity c: servizio.getComponenti()) {
				lstApi.addAll(c.getServizio().getApi());
			}
			return lstApi;
		} else {
			return servizio.getApi().stream().collect(Collectors.toList());
		}
	}

	private String getStato(String stato) {
		if(this.configurazione.getStatiSchedaAdesione()!=null &&
				this.configurazione.getStatiSchedaAdesione().contains(stato)) {
			if(stato.equals("bozza")) {
				return this.stampeLabels.getScheda().getStato().getBozza();
			} else if(stato.equals("richiesto_collaudo")) {
				return this.stampeLabels.getScheda().getStato().getRichiestoCollaudo();
			} else if(stato.equals("in_configurazione_collaudo")) {
				return this.stampeLabels.getScheda().getStato().getInConfigurazioneCollaudo();
			} else if(stato.equals("pubblicato_collaudo")) {
				return this.stampeLabels.getScheda().getStato().getPubblicatoCollaudo();
			} else if(stato.equals("richiesto_produzione")) {
				return this.stampeLabels.getScheda().getStato().getRichiestoProduzione();
			} else if(stato.equals("in_configurazione_produzione")) {
				return this.stampeLabels.getScheda().getStato().getInConfigurazioneProduzione();
			} else if(stato.equals("pubblicato_produzione")) {
				return this.stampeLabels.getScheda().getStato().getPubblicatoProduzione();
			} else if(stato.equals("pubblicato_produzione_senza_collaudo")) {
				return this.stampeLabels.getScheda().getStato().getPubblicatoProduzioneSenzaCollaudo();
			} else if(stato.equals("archiviato")) {
				return this.stampeLabels.getScheda().getStato().getArchiviato();
			} else {
				String statoOut = stato;
				statoOut = statoOut.replaceAll("_produzione_senza_collaudo", " in produzione senza collaudo")
						.replaceAll("_produzione", " in produzione")
						.replaceAll("_collaudo", " in collaudo")
						.replaceAll("_", " ");
				return statoOut.substring(0, 1).toUpperCase() + statoOut.substring(1);
			}
		}

		return null;
	}

	private String getLabelConfClient(ClientEntity client) {
		switch(client.getAuthType()) {
		case HTTPS:
		case HTTPS_SIGN:
		case SIGN:
		case HTTPS_PDND:
		case HTTPS_PDND_SIGN:
		case PDND:
		case SIGN_PDND:
		case HTTP_BASIC:
		case INDIRIZZO_IP:
		case NO_DATI: return this.stampeLabels.getScheda().getLabel().getCommonName();
		case OAUTH_AUTHORIZATION_CODE:
		case OAUTH_CLIENT_CREDENTIALS: return this.stampeLabels.getScheda().getLabel().getClientId();
		}

		this.logger.debug("Implementare authtype: " + client.getAuthType());

		return null;
	}

	private String getValoreConfClient(ClientEntity client) {
		switch(client.getAuthType()) {
		case HTTPS: return getCNAutenticazione(client.getEstensioni());
		case HTTPS_SIGN: return getCNAutenticazioneFirma(client.getEstensioni());
		case SIGN: return getCNFirma(client.getEstensioni());
		case HTTPS_PDND:return getCNAutenticazionePDND(client.getEstensioni());
		case HTTPS_PDND_SIGN:return getCNAutenticazioneFirmaPDND(client.getEstensioni());
		case PDND:return getPDND(client.getEstensioni());
		case SIGN_PDND:return getCNFirmaPDND(client.getEstensioni());
		case HTTP_BASIC:return getUsername(client.getEstensioni());
		case INDIRIZZO_IP:return null;
		case NO_DATI: return null;
		case OAUTH_AUTHORIZATION_CODE:return getClientId(client.getEstensioni());
		case OAUTH_CLIENT_CREDENTIALS:return getClientId(client.getEstensioni());
		}
		
		this.logger.debug("Implementare authtype: " + client.getAuthType());
		return null;
	}

	private String getUsername(Set<EstensioneClientEntity> estensioni) {
		Optional<EstensioneClientEntity> oE = estensioni.stream().filter(e -> e.getNome().equals("username")).findAny();
		if(oE.isPresent()) {
			return oE.get().getValore();
		} else {
			return null;
		}
	}

	private String getCNAutenticazioneFirma(Set<EstensioneClientEntity> estensioni) {
		String cnauth = getCNAutenticazione(estensioni);
		String cnfirma = getCNFirma(estensioni);

		return this.stampeLabels.getScheda().getLabel().getAutenticazione() + ": " + cnauth + "\n\n" + this.stampeLabels.getScheda().getLabel().getFirma() + ": " + cnfirma;
	}

	private String getClientId(Set<EstensioneClientEntity> estensioni) {
		Optional<EstensioneClientEntity> oE = estensioni.stream().filter(e -> e.getNome().equals("client_id")).findAny();
		if(oE.isPresent()) {
			return oE.get().getValore();
		} else {
			return null;
		}
	}

	private String getCNFirma(Set<EstensioneClientEntity> estensioni) {
		return getSubjectDaClient(estensioni, CERTIFICATO_FIRMA);
	}

	private String getCNAutenticazionePDND(Set<EstensioneClientEntity> estensioni) {
		String subjectDaClient = getSubjectDaClient(estensioni, CERTIFICATO_AUTENTICAZIONE);
		String clientId = getClientId(estensioni);
		return this.stampeLabels.getScheda().getLabel().getAutenticazione() + ": " + subjectDaClient + "\n\n" + this.stampeLabels.getScheda().getLabel().getClientId() + ": " + clientId;
	}

	private String getCNAutenticazioneFirmaPDND(Set<EstensioneClientEntity> estensioni) {
		String subjectDaClient = getSubjectDaClient(estensioni, CERTIFICATO_AUTENTICAZIONE);
		String cnfirma = getCNFirma(estensioni);
		String clientId = getClientId(estensioni);
		return this.stampeLabels.getScheda().getLabel().getAutenticazione() + ": " + subjectDaClient + "\n\n" + this.stampeLabels.getScheda().getLabel().getFirma() + ": " + cnfirma + "\n\n" + this.stampeLabels.getScheda().getLabel().getClientId() + ": " + clientId;
	}

	private String getCNFirmaPDND(Set<EstensioneClientEntity> estensioni) {
		String cnfirma = getCNFirma(estensioni);
		String clientId = getClientId(estensioni);
		return this.stampeLabels.getScheda().getLabel().getFirma() + ": " + cnfirma + "\n\n" + this.stampeLabels.getScheda().getLabel().getClientId() + ": " + clientId;
	}

	private String getPDND(Set<EstensioneClientEntity> estensioni) {
		String clientId = getClientId(estensioni);
		return clientId;
	}

	private String getCNAutenticazione(Set<EstensioneClientEntity> estensioni) {
		return getSubjectDaClient(estensioni, CERTIFICATO_AUTENTICAZIONE);
	}

	private String getSubjectDaClient(Set<EstensioneClientEntity> estensioni, String key) {
		Optional<EstensioneClientEntity> oE = estensioni.stream().filter(e -> e.getNome().equals(key)).findAny();
		if(oE.isPresent() && oE.get().getDocumento().getRawData() != null) {
			
            // Carica il certificato
            try(InputStream certificateFile = new ByteArrayInputStream(oE.get().getDocumento().getRawData())) {

                CertificateFactory certificateFactory = CertificateFactory.getInstance("X.509");
                X509Certificate certificate = (X509Certificate) certificateFactory.generateCertificate(certificateFile);

                // Ottieni il soggetto (subject) del certificato
                Principal subject = certificate.getSubjectDN();
                return subject.getName();
            	
            } catch(Exception e) {
            	this.logger.error("Errore nella lettura di un certificato: " + e.getMessage());
            	return null;	
            }
		} else {
			this.logger.error("Nessuna chiave ["+key+"] trovata");
			return null;
		}
	}

	private String CERTIFICATO_AUTENTICAZIONE = "autenticazione_CERTIFICATO";
	private String CERTIFICATO_FIRMA = "firma_CERTIFICATO";

	private ReferentItemType getReferentItem(UtenteEntity referent, String tipo) {
		ReferentItemType ref = new ReferentItemType();

		// Issue 137/140: Formato compatto per visualizzazione referenti nel PDF
		// Ogni referente viene mostrato su una singola riga: "<tipo referente> - <nome> <cognome> - <organizzazione>"
		// Il codice precedente popolava tutti i campi separatamente, causando una visualizzazione multi-riga
		StringBuilder sb = new StringBuilder();
		sb.append(tipo);
		sb.append(" - ");
		sb.append(referent.getNome()).append(" ").append(referent.getCognome());
		if(referent.getOrganizzazione() != null) {
			sb.append(" - ").append(referent.getOrganizzazione().getNome());
		}
		// Usa solo il campo nome per la visualizzazione compatta
		ref.setNome(sb.toString());

		// Codice originale commentato - visualizzazione multi-riga con tutti i campi separati
		// ref.setTipoReferente(tipo);
		// ref.setNome(referent.getNome());
		// ref.setCognome(referent.getCognome());
		// ref.setBusinessTelefono(referent.getTelefonoAziendale());
		// ref.setBusinessEmail(referent.getEmailAziendale());
		// if(referent.getOrganizzazione()!= null) {
		// 	ref.setOrganization(referent.getOrganizzazione().getNome());
		// }

		return ref;
	}

}
