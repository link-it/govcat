/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
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
import org.govway.catalogo.core.orm.entity.EstensioneApiEntity;
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
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.Documento;
import org.govway.catalogo.servlets.model.ItemClientAdesione;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.util.Pair;

public class ServizioBuilder {

	private Logger logger = LoggerFactory.getLogger(ServizioBuilder.class);

	@Autowired
	private ClientAdesioneItemAssembler clientAdesioneItemAssembler;

	@Autowired
	private EServiceBuilder eServiceBuilder;

	@Autowired
	private Configurazione configurazione;
	
	private List<Pair<String, String>> custom;
	
	public ServizioBuilder() {
		this.custom = new ArrayList<>();
		
		this.custom.add(Pair.of("finalita", "purposeId"));
		this.custom.add(Pair.of("nome_eservice_pdnd", "nome eService PDND"));
		this.custom.add(Pair.of("versione_eservice_pdnd", "versione eService PDND"));
		
	}
	
	private Collection<Servizio> toListEntries(ServizioEntity servizioEntity) {
		List<Servizio> serviziCSV = new ArrayList<>();

		
		this.logger.debug("Servizio: " + servizioEntity.getNome() + " v" + servizioEntity.getVersione());

		for(AdesioneEntity adesione: servizioEntity.getAdesioni()) {

			this.logger.debug("Adesione: " + adesione.getIdLogico() + " stato: " + adesione.getStato());
			if(this.configurazione.getAdesione().getStatiSchedaAdesione().contains(adesione.getStato())) {

				this.logger.debug("Adesione: " + adesione.getIdLogico() + " stato: " + adesione.getStato() +" OK");
				Set<ApiEntity> apiLst = servizioEntity.getApi();
				this.logger.debug("Adesione: " + adesione.getIdLogico() + " api size: " + apiLst.size());
				
				boolean hasCollaudo = hasCollaudo(adesione.getStato());
				boolean hasProduzione = hasProduzione(adesione.getStato());
				for(ApiEntity api: apiLst) {

					this.logger.debug("Adesione: " + adesione.getIdLogico() + " api: " + api.getNome());
					Servizio s = new Servizio();
					s.setAzioneRisorsa(api.getAuthType().stream().map(at -> new String(at.getResources()).replaceAll(",", "\n")).collect(Collectors.joining("\n")));

					s.setImplementazioneAPI(api.getNome() + " v" + api.getVersione());
					s.setTipoApi(api.getCollaudo().getProtocollo().toString().contains("WSDL") ? "soap" : "rest"); //TODO

					s.setAderente(adesione.getSoggetto().getOrganizzazione().getNome());
					s.setIdAdesione(adesione.getIdLogico());
					
					if(api.getCollaudo()!= null) {
						s.setConnettoreCollaudo(api.getCollaudo().getUrl());
					}

					if(api.getProduzione()!= null) {
						s.setConnettoreProduzione(api.getProduzione().getUrl());
					}

					s.setUrlInvocazioneCollaudo(this.eServiceBuilder.getUrlInvocazione(api, true));
					s.setUrlInvocazioneProduzione(this.eServiceBuilder.getUrlInvocazione(api, false));

					if(hasCollaudo) {
						String purposeIdValoreCollaudo = getProprieta(adesione, api, org.govway.catalogo.core.orm.entity.AmbienteEnum.COLLAUDO);
						if(purposeIdValoreCollaudo != null) {
							s.setProprietaCollaudo(purposeIdValoreCollaudo);	
						}
						
						s.setRateLimitingCollaudo(getRateLimitingValore(adesione, api, org.govway.catalogo.core.orm.entity.AmbienteEnum.COLLAUDO));	

						ClientAdesioneEntity cCollaudo = getClient(adesione, api, AmbienteEnum.COLLAUDO);
						if(cCollaudo !=null) {
							s.setAutenticazioneStato(this.eServiceBuilder.getProfiloString(cCollaudo.getProfilo()));

							ItemClientAdesione cCollaudoItem = this.clientAdesioneItemAssembler.toModel(cCollaudo);
							
							if(cCollaudo.getClient()!=null) {
								s.setAutenticazioneValoreCollaudo(getAutenticazioneValore(cCollaudoItem, cCollaudo.getClient()));
							}

							s.setApplicativiAutorizzatiCollaudo(cCollaudoItem.getNome());
						}

					}

					if(hasProduzione) {

						String purposeIdValoreProduzione = getProprieta(adesione, api, org.govway.catalogo.core.orm.entity.AmbienteEnum.PRODUZIONE);
						if(purposeIdValoreProduzione != null) {
							s.setProprietaProduzione(purposeIdValoreProduzione);
						}
	
						s.setRateLimitingProduzione(getRateLimitingValore(adesione, api, org.govway.catalogo.core.orm.entity.AmbienteEnum.PRODUZIONE));	

						ClientAdesioneEntity cProduzione = getClient(adesione, api, AmbienteEnum.PRODUZIONE);

						if(cProduzione!= null) {
							s.setAutenticazioneStato(this.eServiceBuilder.getProfiloString(cProduzione.getProfilo()));

							ItemClientAdesione cProduzioneItem = this.clientAdesioneItemAssembler.toModel(cProduzione);
							if(cProduzione.getClient()!=null) {
								s.setAutenticazioneValoreProduzione(getAutenticazioneValore(cProduzioneItem, cProduzione.getClient()));
							}
							s.setApplicativiAutorizzatiProduzione(cProduzioneItem.getNome());
						}
					}
					
					
					s.setServizio(servizioEntity.getNome() + " v" + servizioEntity.getVersione());

					s.setReferenteRegionaleAdesione(getReferentiString(adesione.getReferenti()));
					s.setReferenteTecnicoAdesione(getReferentiTecniciString(adesione.getReferenti()));

					s.setErogatore(servizioEntity.getDominio().getSoggettoReferente().getNome());

					serviziCSV.add(s);
				}
			} else {
				this.logger.debug("Adesione: " + adesione.getIdLogico() + " in stato: " + adesione.getStato()+" non consentito per l'export. Stati consentiti ["+this.configurazione.getAdesione().getStatiSchedaAdesione()+"]");
				
			}
		}


		return serviziCSV;
	}

	private boolean hasCollaudo(String stato) {
		return !stato.contains("senza_collaudo");
	}

	private boolean hasProduzione(String stato) {
		return stato.contains("produzione");
	}

	private ClientAdesioneEntity getClient(AdesioneEntity adesione, ApiEntity api, AmbienteEnum ambiente) {

		List<String> lst = api.getAuthType().stream().map(at -> at.getProfilo()).collect(Collectors.toList());

		for(String p: lst) {
			Optional<ClientAdesioneEntity> opt = adesione.getClient().stream().filter(ca -> ca.getProfilo().equals(p) && ca.getAmbiente().equals(ambiente)).findAny();
			if(opt.isPresent()) {
				return opt.get();
			}
		}

		return null;

	}

	private String getRateLimitingValore(AdesioneEntity adesione, ApiEntity api, org.govway.catalogo.core.orm.entity.AmbienteEnum ambiente) {
		String quota = getEstensioneAdesioneValore(adesione, api, ambiente, "rate_limiting_quota");
		String periodo = getEstensioneAdesioneValore(adesione, api, ambiente, "rate_limiting_periodo");
		if(quota != null && periodo != null) {
			return quota + " / " + periodo;
		} else {
			return null;
		}
	}

	private String getProprieta(AdesioneEntity adesione, ApiEntity api, org.govway.catalogo.core.orm.entity.AmbienteEnum ambiente) {
		StringBuilder proprieta = new StringBuilder();
		
		for(Pair<String, String> c: this.custom) {

			String prop = getEstensioneAdesioneValore(adesione, api, ambiente, c.getFirst());
			
			if(prop == null || prop.isEmpty()) {

				List<String> gruppi = this.configurazione.getServizio().getApi().getProprietaCustom().stream()
						.filter(p -> {
							if(ambiente.equals(AmbienteEnum.COLLAUDO)) {
								return p.getClasseDato().equals(ConfigurazioneClasseDato.COLLAUDO) 
										||
										p.getClasseDato().equals(ConfigurazioneClasseDato.COLLAUDO_CONFIGURATO);
							} else {
								return p.getClasseDato().equals(ConfigurazioneClasseDato.PRODUZIONE) 
										||
										p.getClasseDato().equals(ConfigurazioneClasseDato.PRODUZIONE_CONFIGURATO);
							}
						}).map(p -> p.getNomeGruppo()).collect(Collectors.toList());

				prop = getEstensioneAPIValore(api, gruppi, c.getFirst());
				
			}

			if(prop != null && !prop.isEmpty()) {
				if(proprieta.length() > 0) {
					proprieta.append("\n");
				}
				proprieta.append(c.getSecond()).append(": ").append(prop);
			}

		}

		if(proprieta.length() > 0) {
			return proprieta.toString();
		} else {
			return null;
		}
		
	}
	
	private String getEstensioneAdesioneValore(AdesioneEntity adesione, ApiEntity api, org.govway.catalogo.core.orm.entity.AmbienteEnum ambiente, String nome) {
		return adesione.getEstensioni().stream().filter(e -> e.getAmbiente().equals(ambiente) && e.getNome().equals(nome) && api.equals(e.getApi())).findAny().orElse(new EstensioneAdesioneEntity()).getValore();
	}
	
	private String getEstensioneAPIValore(ApiEntity api, List<String> gruppi, String nome) {
		return api.getEstensioni().stream().filter(e -> gruppi.contains(e.getGruppo()) && e.getNome().equals(nome)).findAny().orElse(new EstensioneApiEntity()).getValore();
	}

	private String getAutenticazioneValore(ItemClientAdesione client, ClientEntity entity) {
		switch(client.getDatiSpecifici().getAuthType()) {
		case HTTPS: return getInfo((AuthTypeHttps)client.getDatiSpecifici(), entity);
		case HTTPS_SIGN: return getInfo((AuthTypeHttpsSign)client.getDatiSpecifici(), entity);
		case SIGN: return getInfo((AuthTypeSign)client.getDatiSpecifici(), entity);
		case HTTPS_PDND:return getInfo((AuthTypeHttpsPdnd)client.getDatiSpecifici(), entity);
		case HTTPS_PDND_SIGN:return getInfo((AuthTypeHttpsPdndSign)client.getDatiSpecifici(), entity);
		case PDND:return getInfo((AuthTypePdnd)client.getDatiSpecifici());
		case SIGN_PDND:return getInfo((AuthTypeSignPdnd)client.getDatiSpecifici(), entity);
		case HTTP_BASIC:return getInfo((AuthTypeHttpBasic)client.getDatiSpecifici());
		case INDIRIZZO_IP:return null;
		case NO_DATI: return null;
		case OAUTH_AUTHORIZATION_CODE:return getInfo((AuthTypeOAuthAuthorizationCode)client.getDatiSpecifici());
		case OAUTH_CLIENT_CREDENTIALS:return getInfo((AuthTypeOAuthClientCredentials)client.getDatiSpecifici());
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
		case RICHIESTO_CN:return getSubject(((CertificatoClientRichiestoCn)certificatoFirma).getCertificato(), client);
		case RICHIESTO_CSR:return getSubject(((CertificatoClientRichiestoCsr)certificatoFirma).getCertificato(), client);
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

	public byte[] getCSVEsteso(Collection<ServizioEntity> servizi) {

		Collection<Servizio> serviziCSV = new ArrayList<Servizio>();

		for(ServizioEntity servizio:servizi) {
			serviziCSV.addAll(toListEntries(servizio));
		}

		String csv = "";
		try {
			ServizioMapper servizioMapper = new ServizioMapper();
			csv = servizioMapper.writeValues(serviziCSV);
			if(csv.isEmpty()) {

				Servizio s = new Servizio();
				String header = servizioMapper.writeValues(Arrays.asList(s));

				int indexOfNewLine = header.indexOf('\n');

				// Extract the substring from the start of the string to the first newline character
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
