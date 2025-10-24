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
package org.govway.catalogo.monitoraggioutils.allarmi;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.assembler.PdndEstensioneClientAssembler;
import org.govway.catalogo.core.dao.specifications.ClientSpecification;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity.StatoEnum;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.core.services.ClientService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ClientApiException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.monitoraggioutils.ConfigurazioneConnessione;
import org.govway.catalogo.pdnd.controllers.PDNDClient;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.monitor.model.EsitoVerificaBackend;
import org.govway.catalogo.servlets.monitor.model.EsitoVerificaBackendEnum;
import org.govway.catalogo.servlets.monitor.model.EsitoVerificaCertificatiInScadenza;
import org.govway.catalogo.servlets.monitor.model.EsitoVerificaCertificatiInScadenzaEnum;
import org.govway.catalogo.servlets.monitor.model.EsitoVerificaCertificatiScaduti;
import org.govway.catalogo.servlets.monitor.model.EsitoVerificaCertificatiScadutiEnum;
import org.govway.catalogo.servlets.monitor.model.ItemApplicativoVerificato;
import org.govway.catalogo.servlets.monitor.model.ItemServizioVerificato;
import org.govway.catalogo.servlets.monitor.model.TipoVerificaEnum;
import org.govway.catalogo.servlets.pdnd.client.api.GatewayApi;
import org.govway.catalogo.servlets.pdnd.client.api.HealthApi;
import org.govway.catalogo.servlets.pdnd.client.api.impl.ApiClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public class AllarmiClient {

	@Autowired
    @Qualifier("PDNDClientCollaudo")
	private ApiClient apiClientCollaudo;
	
	@Autowired
    @Qualifier("PDNDClientProduzione")
	private ApiClient apiClientProduzione;
	
	
	private PDNDClient clientCollaudo;
	private PDNDClient clientProduzione;

	private Logger logger = LoggerFactory.getLogger(AllarmiClient.class);


	private PDNDClient getClientPdnd(org.govway.catalogo.servlets.monitor.model.AmbienteEnum ambiente) {
		switch(ambiente) {
		case COLLAUDO: return getClientPdndCollaudo();
		case PRODUZIONE:return getClientPdndProduzione();
		}
		
		return null;
	}

	private PDNDClient getClientPdndCollaudo() {
		if(this.clientCollaudo == null) {
			this.clientCollaudo = new PDNDClient(new GatewayApi(this.apiClientCollaudo), new HealthApi(this.apiClientCollaudo));
		}
		
		return this.clientCollaudo;
	}

	private PDNDClient getClientPdndProduzione() {
		if(this.clientProduzione == null) {
			this.clientProduzione = new PDNDClient(new GatewayApi(this.apiClientProduzione), new HealthApi(this.apiClientProduzione));
		}
		
		return this.clientProduzione;
	}
	

	@Autowired
	protected Configurazione configurazione;
	
	@Autowired
	protected ClientService clientService;
	
	@Autowired
	protected SoggettoService soggettoService;
	
	@Autowired
	protected ApiService apiService;
	
	public EsitoVerificaCertificatiScaduti getCertificatoScadutoSoggetto(String soggetto, ConfigurazioneConnessione connessione) {
		
		String nomeSoggetto = this.getNomeSoggetto(soggetto);
		String tipoSoggetto = this.getTipo(soggetto);
		Optional<AllarmeResponse> oR = getCertificatoScadutoSoggetto(nomeSoggetto, tipoSoggetto, connessione, false);
		if(soggetto.equals(TipoVerificaEnum.PDND.getValue())) {
			return getEsitoVerificaCertificatiScaduti(oR);
		} else {
			if(oR.isPresent()) {
				return getEsitoVerificaCertificatiScaduti(oR);
			}
			
			Optional<AllarmeResponse> oR2 = getAllarmeConfigurazioneGenerale(connessione);
			return getEsitoVerificaCertificatiScaduti(oR2);
			
		}
	}

	public EsitoVerificaCertificatiInScadenza getCertificatoInScadenzaSoggetto(String soggetto, ConfigurazioneConnessione connessione) {
		
		String nomeSoggetto = this.getNomeSoggetto(soggetto);
		String tipoSoggetto = this.getTipo(soggetto);
		Optional<AllarmeResponse> oR = getCertificatoScadutoSoggetto(nomeSoggetto, tipoSoggetto, connessione, true);
		if(soggetto.equals(TipoVerificaEnum.PDND.getValue())) {
			return getEsitoVerificaCertificatiInScadenza(oR);
		} else {
			if(oR.isPresent()) {
				return getEsitoVerificaCertificatiInScadenza(oR);
			}
			
			Optional<AllarmeResponse> oR2 = getAllarmeConfigurazioneGenerale(connessione);
			return getEsitoVerificaCertificatiInScadenza(oR2);
		}
	}

	public EsitoVerificaCertificatiScaduti getCertificatoScadutoApplicativo(TipoVerificaEnum tipoVerifica, String soggetto, String nomeApplicativo, ConfigurazioneConnessione connessione) {
		return this.soggettoService.runTransaction(() -> {
			ClientEntity c = getClient(soggetto, nomeApplicativo, connessione);
			
			if(isValidaApplicativo(c)) {
				Optional<AllarmeResponse> oR = getCertificatoScadutoApplicativo(soggetto, nomeApplicativo, connessione, false);
				if(oR.isPresent()) {
					return getEsitoVerificaCertificatiScaduti(oR);
				}
			}
			
			if(isValidaSoggetto(c)) {
				String tipoSoggetto = this.getTipo(soggetto);
				Optional<AllarmeResponse> oR = getCertificatoScadutoSoggetto(c.getSoggetto().getNome(), tipoSoggetto, connessione, false);
				if(oR.isPresent()) {
					return getEsitoVerificaCertificatiScaduti(oR);
				}
			}
	
			if(tipoVerifica.equals(TipoVerificaEnum.PDND)) {
				String clientId = getClientId(c);
				try{
					getClientPdnd(connessione.getAmbiente()).getClient(UUID.fromString(clientId));
				} catch (ClientApiException e) {
					if(e.getE().getCode() == 404) {
						logger.error("Client ["+clientId+"] non esistente sulla PDND");
						EsitoVerificaCertificatiScaduti esito = new EsitoVerificaCertificatiScaduti();
						esito.setEsito(EsitoVerificaCertificatiScadutiEnum.SCADUTO);
						esito.setDettagli("Client ["+clientId+"] non esistente sulla PDND");
						return esito;
					} else {
						logger.error("Errore durante la ricerca del client ["+clientId+"] sulla PDND: " + e.getMessage(), e);
						throw new InternalException(ErrorCode.SYS_500, Map.of("clientId", clientId), e);
					}
				} catch (RuntimeException e) {
					logger.error("Errore durante la ricerca del client ["+clientId+"] sulla PDND: " + e.getMessage(), e);
					throw new InternalException(ErrorCode.SYS_500, Map.of("clientId", clientId), e);
				}
			}
	
			return getEsitoVerificaCertificatiScaduti(Optional.empty());
		});
	}

	private String getClientId(ClientEntity c) {
		if(!isApplicativoPdnd(c)) {
			throw new BadRequestException(ErrorCode.CLT_400_CONFIG, Map.of("authType", c.getAuthType().toString()));
		}

		if(!c.getStato().equals(StatoEnum.CONFIGURATO)) {
			throw new BadRequestException(ErrorCode.CLT_400_CONFIG, Map.of("stato", c.getStato().toString()));
		}

		if(!c.getAdesioni().stream().filter(a -> this.configurazione.getAdesione().getStatiSchedaAdesione().contains(a.getAdesione().getStato()))
			.findAny().isPresent()) {
			throw new BadRequestException(ErrorCode.CLT_404, Map.of("nomeClient", c.getNome()));
		}
		return c.getEstensioni().stream().filter(e -> e.getNome().equals(PdndEstensioneClientAssembler.CLIENT_ID_PROPERTY))
			.findAny()
			.orElseThrow(() -> new BadRequestException(ErrorCode.CLT_400_CONFIG, Map.of("property", PdndEstensioneClientAssembler.CLIENT_ID_PROPERTY)))
			.getValore();
	}

	private boolean isApplicativoPdnd(ClientEntity c) {
		switch(c.getAuthType()) {
		case HTTPS_PDND_SIGN:
		case HTTPS_SIGN:
		case SIGN_PDND:
		case PDND:
		case HTTPS_PDND:
			return true;
		case HTTPS: 
		case HTTP_BASIC:
		case INDIRIZZO_IP:
		case NO_DATI:
		case OAUTH_AUTHORIZATION_CODE:
		case OAUTH_CLIENT_CREDENTIALS:
		case SIGN:
		}
		return false;
	}

	private boolean isValidaSoggetto(ClientEntity c) {
		switch(c.getAuthType()) {
		case HTTPS: 
		case HTTPS_PDND:
		case HTTPS_PDND_SIGN:
		case HTTPS_SIGN: return true;
		case HTTP_BASIC:
		case INDIRIZZO_IP:
		case NO_DATI:
		case OAUTH_AUTHORIZATION_CODE:
		case OAUTH_CLIENT_CREDENTIALS:
		case PDND:
		case SIGN:
		case SIGN_PDND:
		}
		return false;
	}

	private boolean isValidaApplicativo(ClientEntity c) {
		switch(c.getAuthType()) {
		case SIGN:
		case SIGN_PDND:
		case HTTPS_PDND_SIGN:
		case HTTPS_SIGN:
			return true;
		case HTTPS: 
		case HTTPS_PDND:
		case HTTP_BASIC:
		case INDIRIZZO_IP:
		case NO_DATI:
		case OAUTH_AUTHORIZATION_CODE:
		case OAUTH_CLIENT_CREDENTIALS:
		case PDND:
		}
		return false;
	}

	private ClientEntity getClient(String organization, String nomeApplicativo, ConfigurazioneConnessione connessione) {
		SoggettoEntity soggetto = this.soggettoService.findByNome(organization).orElseThrow(() -> new BadRequestException(ErrorCode.SOG_404, Map.of("nomeSoggetto", organization)));

		AmbienteEnum ambiente = null;
		switch(connessione.getAmbiente()) {
		case COLLAUDO: ambiente = AmbienteEnum.COLLAUDO;
			break;
		case PRODUZIONE:ambiente = AmbienteEnum.PRODUZIONE;
			break;
		default:
			break;

		}
		return this.clientService.findByNomeSoggettoAmbiente(nomeApplicativo, UUID.fromString(soggetto.getIdSoggetto()), ambiente)
				.orElseThrow(() -> new BadRequestException(ErrorCode.CLT_404, Map.of("nomeClient", nomeApplicativo, "nomeSoggetto", organization, "ambiente", connessione.getAmbiente().toString())));
	}

	private Optional<ServizioEntity> getOptionalServizio(String nome, Integer versione, String erogatore) {
		
		this.logger.info("Cerco API ["+nome+"/"+versione+"/"+erogatore+"]");
		
		Optional<SoggettoEntity> findByNome = this.soggettoService.findByNome(erogatore);
		if(!findByNome.isPresent()) {
			return Optional.empty();
		}
		
		Optional<ApiEntity> findApi = this.apiService.findByNomeVersioneSoggetto(nome, versione, UUID.fromString(findByNome.get().getIdSoggetto()));
		if(!findApi.isPresent()) {
			return Optional.empty();
		}
		
		return Optional.of(findApi.get().getServizio());
	}

	private Optional<ClientEntity> getOptionalClient(String organization, String nomeApplicativo, ConfigurazioneConnessione connessione) {
		Optional<SoggettoEntity> soggetto = this.soggettoService.findByNome(organization);
		
		if(!soggetto.isPresent()) {
			return Optional.empty();
		}
		
		AmbienteEnum ambiente = null;
		switch(connessione.getAmbiente()) {
		case COLLAUDO: ambiente = AmbienteEnum.COLLAUDO;
			break;
		case PRODUZIONE:ambiente = AmbienteEnum.PRODUZIONE;
			break;
		default:
			break;
		
		}
		return this.clientService.findByNomeSoggettoAmbiente(nomeApplicativo, UUID.fromString(soggetto.get().getIdSoggetto()), ambiente);
	}

	public EsitoVerificaCertificatiInScadenza getCertificatoInScadenzaApplicativo(TipoVerificaEnum tipoVerifica, String soggetto, String nomeApplicativo, ConfigurazioneConnessione connessione) {
		
		ClientEntity c = getClient(soggetto, nomeApplicativo, connessione);
		
		List<AllarmeResponse> lst = new ArrayList<>();
		
		if(isValidaApplicativo(c)) {
			Optional<AllarmeResponse> oR = getCertificatoScadutoApplicativo(soggetto, nomeApplicativo, connessione, true);
			if(oR.isPresent()) {
				lst.add(oR.get());
			}
		}
		
		if(isValidaSoggetto(c)) {
			String tipoSoggetto = this.getTipo(soggetto);
			Optional<AllarmeResponse> oR = getCertificatoScadutoSoggetto(c.getSoggetto().getNome(), tipoSoggetto, connessione, true);
			if(oR.isPresent()) {
				lst.add(oR.get());
			}
		}
		
		
		return getEsitoVerificaCertificatiInScadenza(lst.stream().findAny());
	}

	public EsitoVerificaCertificatiScaduti getCertificatoScadutoErogazione(String soggetto, String nome, Integer versione, ConfigurazioneConnessione connessione) {
		
		Optional<AllarmeResponse> oR = getAllarmeErogazione(soggetto, nome, versione, connessione, true, false);
		return getEsitoVerificaCertificatiScaduti(oR);
	}

	public EsitoVerificaCertificatiInScadenza getCertificatoInScadenzaErogazione(String soggetto, String nome, Integer versione, ConfigurazioneConnessione connessione) {
		
		Optional<AllarmeResponse> oR = getAllarmeErogazione(soggetto, nome, versione, connessione, true, true);
		return getEsitoVerificaCertificatiInScadenza(oR);
	}

	
	public EsitoVerificaBackend getVerificaBackendErogazione(String soggetto, String nome, Integer versione, ConfigurazioneConnessione connessione) {
		
		Optional<AllarmeResponse> oR = getAllarmeErogazione(soggetto, nome, versione, connessione, false, null);
		return getEsitoVerificaBackend(oR);
	}

	public EsitoVerificaCertificatiScaduti getCertificatoScadutoFruizione(String soggetto, String provider, String nome, Integer versione, ConfigurazioneConnessione connessione) {
		
		Optional<AllarmeResponse> oR = getAllarmeFruizione(soggetto, provider, nome, versione, connessione, true, false);
		return getEsitoVerificaCertificatiScaduti(oR);
	}

	public EsitoVerificaCertificatiInScadenza getCertificatoInScadenzaFruizione(String soggetto, String provider, String nome, Integer versione, ConfigurazioneConnessione connessione) {
		
		Optional<AllarmeResponse> oR = getAllarmeFruizione(soggetto, provider, nome, versione, connessione, true, true);
		return getEsitoVerificaCertificatiInScadenza(oR);
	}

	public EsitoVerificaBackend getVerificaBackendFruizione(String soggetto, String provider, String nome, Integer versione, ConfigurazioneConnessione connessione) {
		
		Optional<AllarmeResponse> oR = getAllarmeFruizione(soggetto, provider, nome, versione, connessione, false, null);
		return getEsitoVerificaBackend(oR);
	}

	public EsitoVerificaCertificatiScaduti getCertificatoScadutoTokenPolicy(String nomePolicy, ConfigurazioneConnessione connessione) {
		
		Optional<AllarmeResponse> oR = getAllarmeTokenPolicy(nomePolicy, connessione, true, false);
		return getEsitoVerificaCertificatiScaduti(oR);
	}

	public EsitoVerificaCertificatiInScadenza getCertificatoInScadenzaTokenPolicy(String nomePolicy, ConfigurazioneConnessione connessione) {
		
		Optional<AllarmeResponse> oR = getAllarmeTokenPolicy(nomePolicy, connessione, true, true);
		return getEsitoVerificaCertificatiInScadenza(oR);
	}

	public EsitoVerificaBackend getVerificaBackendTokenPolicy(String nomePolicy, ConfigurazioneConnessione connessione) {
		
		Optional<AllarmeResponse> oR = getAllarmeTokenPolicy(nomePolicy, connessione, false, null);
		return getEsitoVerificaBackend(oR);
	}


	private Optional<AllarmeResponse> getCertificatoScadutoSoggetto(String nomeSoggetto, String tipoSoggetto, ConfigurazioneConnessione connessione, Boolean warning) {
		SoggettoAllarmeClient client = new SoggettoAllarmeClient(connessione.getIdAllarmeSoggetti());
		String k = client.getKey(tipoSoggetto, nomeSoggetto);
		return client.getAllarme(connessione, k, warning);
	}

	private Optional<AllarmeResponse> getCertificatoScadutoApplicativo(String nomeSoggetto, String nomeApplicativo, ConfigurazioneConnessione connessione, Boolean warning) {
		ApplicativoAllarmeClient client = new ApplicativoAllarmeClient(connessione.getIdAllarmeApplicativi());
		String k = client.getKey(getTipo(nomeSoggetto), getNomeSoggetto(nomeSoggetto), nomeApplicativo);
		return client.getAllarme(connessione, k, warning);
	}

	private Optional<AllarmeResponse> getAllarmeTokenPolicy(String nomePolicy, ConfigurazioneConnessione connessione, boolean certificato, Boolean warning) {
		TokenPolicyAllarmeClient client = new TokenPolicyAllarmeClient(certificato ? connessione.getIdAllarmeTokenPolicyCertificati() : connessione.getIdAllarmeTokenPolicyBackend());
		String k = client.getKey(nomePolicy);
		return client.getAllarme(connessione, k, warning);
	}

	private Optional<AllarmeResponse> getAllarmeErogazione(String soggetto, String nome, Integer versione, ConfigurazioneConnessione connessione, boolean certificato, Boolean warning) {
		ErogazioneAllarmeClient client = new ErogazioneAllarmeClient(getIdAllarmeErogazioni(soggetto, certificato, connessione));
		String k = client.getKey(getTipo(soggetto), getNomeSoggetto(soggetto), nome, versione);
		return client.getAllarme(connessione, k, warning);
	}

	private Optional<AllarmeResponse> getAllarmeFruizione(String soggetto, String provider, String nome, Integer versione, ConfigurazioneConnessione connessione, boolean certificato, Boolean warning) {
		FruizioneAllarmeClient client = new FruizioneAllarmeClient(getIdAllarmeFruizioni(soggetto, certificato, connessione));
		String k = client.getKey(getTipo(soggetto), provider, getNomeSoggetto(soggetto), nome, versione);
		return client.getAllarme(connessione, k, warning);
	}

	public Optional<AllarmeResponse> getAllarmeConfigurazioneGenerale(ConfigurazioneConnessione connessione) {
		ConfigurazioneGeneraleAllarmeClient client = new ConfigurazioneGeneraleAllarmeClient(connessione.getIdAllarmeConfigurazioneGeneraleCertificati());
		String k = client.getKey();
		return client.getAllarme(connessione, k, null);
	}

	private EsitoVerificaCertificatiScaduti getEsitoVerificaCertificatiScaduti(Optional<AllarmeResponse> oR) {
		EsitoVerificaCertificatiScaduti esito = new EsitoVerificaCertificatiScaduti();
		if(oR.isPresent()) {
			esito.setEsito(EsitoVerificaCertificatiScadutiEnum.SCADUTO);
			esito.setDettagli(oR.get().getDettaglio());
		} else {
			esito.setEsito(EsitoVerificaCertificatiScadutiEnum.VALIDO);
		}
		
		return esito;
	}
	
	private EsitoVerificaCertificatiInScadenza getEsitoVerificaCertificatiInScadenza(Optional<AllarmeResponse> oR) {
		EsitoVerificaCertificatiInScadenza esito = new EsitoVerificaCertificatiInScadenza();
		if(oR.isPresent()) {
			esito.setEsito(EsitoVerificaCertificatiInScadenzaEnum.IN_SCADENZA);
			esito.setDettagli(oR.get().getDettaglio());
		} else {
			esito.setEsito(EsitoVerificaCertificatiInScadenzaEnum.VALIDO);
		}
		
		return esito;
	}
	
	private EsitoVerificaBackend getEsitoVerificaBackend(Optional<AllarmeResponse> oR) {
		EsitoVerificaBackend esito = new EsitoVerificaBackend();
		if(oR.isPresent()) {
			esito.setEsito(EsitoVerificaBackendEnum.ERRORE);
			esito.setDettagli(oR.get().getDettaglio());
		} else {
			esito.setEsito(EsitoVerificaBackendEnum.OK);
		}
		
		return esito;
	}

	private String getIdAllarmeErogazioni(String soggetto, boolean certificato, ConfigurazioneConnessione connessione) {
		if(certificato) {
			return connessione.getIdAllarmeErogazioniModiCertificati();
		} else {
			return connessione.getIdAllarmeErogazioniModiBackend();
		}
	}
	
	private String getIdAllarmeFruizioni(String nomeSoggetto, boolean certificato, ConfigurazioneConnessione connessione) {
		if(certificato) {
			return connessione.getIdAllarmeFruizioniModiCertificati();
		} else {
			return connessione.getIdAllarmeFruizioniModiBackend();
		}
	}
	
	private String getTipo(String nomeSoggetto) {
		SoggettoEntity soggetto = this.soggettoService.findByNome(nomeSoggetto).orElseThrow(() -> new BadRequestException(ErrorCode.SOG_404, Map.of("nomeSoggetto", nomeSoggetto)));
		if (soggetto.getTipoGateway()==null) return this.configurazione.getSoggetto().getProfiloGatewayDefault().toString();
		else return soggetto.getTipoGateway();
	}

	private String getNomeSoggetto(String nomeSoggetto) {
		SoggettoEntity soggetto = this.soggettoService.findByNome(nomeSoggetto).orElseThrow(() -> new BadRequestException(ErrorCode.SOG_404, Map.of("nomeSoggetto", nomeSoggetto)));
		if (soggetto.getNomeGateway()==null) return soggetto.getNome();
		else return soggetto.getNomeGateway();
	}
	
	public List<ItemServizioVerificato> getCertificatiServiziScaduti(ConfigurazioneConnessione connessione, String soggetto) {
		return getServiziConStato(connessione, true, soggetto, false);
	}

	public List<ItemServizioVerificato> getCertificatiServiziInScadenza(ConfigurazioneConnessione connessione, String soggetto) {
		return getServiziConStato(connessione, true, soggetto, true);
	}

	public List<ItemApplicativoVerificato> getCertificatiApplicativiScaduti(ConfigurazioneConnessione connessione) {
		return getCertificatiApplicativiConStato(connessione, false);
	}

	public List<ItemApplicativoVerificato> getCertificatiApplicativiInScadenza(ConfigurazioneConnessione connessione) {
		return getCertificatiApplicativiConStato(connessione, true);
	}

	public List<ItemServizioVerificato> getServiziBackendStato(ConfigurazioneConnessione connessione, String soggetto) {
		return getServiziConStato(connessione, false, soggetto, null);
	}

	private List<ItemApplicativoVerificato> getCertificatiApplicativiConStato(ConfigurazioneConnessione connessione, boolean warning) {
		ApplicativoAllarmeClient client = new ApplicativoAllarmeClient(connessione.getIdAllarmeApplicativi());
		List<AllarmeResponse> alLst = client.getAllarmeList(connessione, warning);
		
		Map<String, ItemApplicativoVerificato> ret = new HashMap<>();
		for(AllarmeResponse al: alLst) {
			ItemApplicativoVerificato item = toItemApplicativoVerificato(al, connessione);
			
			if(item != null) {
				ret.put(item.getIdClient().toString(), item);
			}
		}
		SoggettoAllarmeClient clientSoggetto = new SoggettoAllarmeClient(connessione.getIdAllarmeSoggetti());
		List<AllarmeResponse> alLst2 = clientSoggetto.getAllarmeList(connessione, warning);

		for(AllarmeResponse al: alLst2) {
			
			Optional<SoggettoEntity> sogg = this.soggettoService.findByNome(al.getNomeSoggetto());
			
			if(sogg.isPresent()) {
				ClientSpecification spec = new ClientSpecification();
				spec.setIdSoggetto(Optional.of(UUID.fromString(sogg.get().getIdSoggetto())));
				spec.setAmbiente(Optional.of(connessione.getAmbiente().equals(org.govway.catalogo.servlets.monitor.model.AmbienteEnum.COLLAUDO) ? AmbienteEnum.COLLAUDO : AmbienteEnum.PRODUZIONE));

				Page<ClientEntity> clients = this.clientService.findAll(spec, Pageable.unpaged());
				
				for(ClientEntity c: clients) {
					if(isValidaSoggetto(c)) {
						al.setNomeApplicativo(c.getNome());
						ItemApplicativoVerificato item = toItemApplicativoVerificato(al, connessione);
						if(item != null) {
							ret.put(item.getIdClient().toString(), item);
						}
					}
				}
				
			}
			
		}
		
		return ret.values().stream().collect(Collectors.toList());
	}

	private List<ItemServizioVerificato> getServiziConStato(ConfigurazioneConnessione connessione, boolean certificati, String soggetto, Boolean warning) {
		ErogazioneAllarmeClient clientErog = new ErogazioneAllarmeClient(getIdAllarmeErogazioni(soggetto, certificati, connessione));
		FruizioneAllarmeClient clientFrui = new FruizioneAllarmeClient(getIdAllarmeFruizioni(soggetto, certificati, connessione));
		
		List<AllarmeResponse> lstErogazioni = clientErog.getAllarmeList(connessione, warning);
		List<AllarmeResponse> lstFruizioni = clientFrui.getAllarmeList(connessione, warning);
		
		Map<String, AllarmeResponse> map = new HashMap<>();
		
		for(AllarmeResponse a: lstErogazioni) {
			map.put(a.getIdentificativo(), a);
		}
		
		for(AllarmeResponse a: lstFruizioni) {
			map.put(a.getIdentificativo(), a);
		}
		
		
		Map<String, ItemServizioVerificato> ret = new HashMap<>();

		return this.apiService.runTransaction(() -> {
		for(AllarmeResponse al: map.values()) {
			ItemServizioVerificato item = toItemServizioVerificato(al);
			
			if(item != null) {
				ret.put(item.getIdServizio().toString(), item);
			}
		}
		
		return ret.values().stream().collect(Collectors.toList());
		});
	}

	private ItemServizioVerificato toItemServizioVerificato(AllarmeResponse a) {
		Optional<ServizioEntity> oS = getOptionalServizio(a.getNomeServizio(), Integer.parseInt(a.getVersioneServizio()), a.getNomeSoggetto());
		if(!oS.isPresent()) {
			return null;
		}

		ServizioEntity servizioEntity = oS.get();
		ItemServizioVerificato isv = new ItemServizioVerificato();
		isv.setNome(servizioEntity.getNome());
		isv.setVersione(Integer.parseInt(servizioEntity.getVersione()));
		isv.setIdServizio(UUID.fromString(servizioEntity.getIdServizio()));
		return isv;
	}

	private ItemApplicativoVerificato toItemApplicativoVerificato(AllarmeResponse a, ConfigurazioneConnessione connessione) {
		
		Optional<ClientEntity> oC = getOptionalClient(a.getNomeSoggetto(), a.getNomeApplicativo(), connessione);
		if(!oC.isPresent()) {
			return null;
		}
		
		ItemApplicativoVerificato iav = new ItemApplicativoVerificato();
		iav.setNome(a.getNomeApplicativo());
		iav.setSoggetto(a.getNomeSoggetto());
		iav.setIdClient(UUID.fromString(oC.get().getIdClient()));
		iav.setPdnd(this.isApplicativoPdnd(oC.get()));
		return iav;
	}

}
