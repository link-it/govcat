package batch;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.core.business.utils.configurazione.ConfigurazioneReader;
import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.dto.DTOAdesioneAPI;
import org.govway.catalogo.core.dto.DTOApi;
import org.govway.catalogo.core.dto.DTOBasicClient;
import org.govway.catalogo.core.dto.DTOClient;
import org.govway.catalogo.core.dto.DTOSoggetto;
import org.govway.catalogo.core.dto.HttpsClient;
import org.govway.catalogo.core.dto.HttpsPdndClient;
import org.govway.catalogo.core.dto.HttpsPdndSignClient;
import org.govway.catalogo.core.dto.HttpsSignClient;
import org.govway.catalogo.core.dto.OauthAuthorizationCodeClient;
import org.govway.catalogo.core.dto.OauthClientCredentialsClient;
import org.govway.catalogo.core.dto.PdndClient;
import org.govway.catalogo.core.dto.SignClient;
import org.govway.catalogo.core.dto.SignPdndClient;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity.AuthType;
import org.govway.catalogo.core.orm.entity.EstensioneAdesioneEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AdesioneDTOConverter {

	private static final Logger logger = LoggerFactory.getLogger(AdesioneDTOConverter.class);

	String externalPath;
	AdesioneEntity adesione;
	DTOAdesione dto;

	private List<DTOApi> api;
	private AmbienteEnum ambienteConfigurazione;
	private List<DTOClient> clients;

	private SoggettoDTOFactory soggettoDTOFactory;
	
	private static final String AUTENTICAZIONE_CERTIFICATO = "autenticazione_CERTIFICATO";
	private static final String FIRMA_CERTIFICATO = "firma_CERTIFICATO";
	private static final String CLIENT_ID = "client_id";
	private static final String USERNAME = "username";
	private static final String URL_ESPOSIZIONE = "url_esposizione";
	private static final String NOME_APPLICAZIONE = "nome_applicazione";
	private static final String HELP_DESK = "help_desk";
	
	AdesioneDTOConverter(AdesioneEntity adesione, String externalPath) {
		this.adesione = adesione;
		this.externalPath = externalPath;
	}

	public void setDto(DTOAdesione dto) {
		this.dto = dto;
	}

	public DTOAdesione getDto() {
		return dto;
	}

	public DTOAdesione converter(SoggettoDTOFactory soggettoDTOFactory) throws ProcessingException, IOException {
		this.soggettoDTOFactory = soggettoDTOFactory;
		api = new ArrayList<>();
		clients = new ArrayList<>();

		getAmbiente();
		setSoggetti();
		setApiErogateAndSetClient();
		Map<String, String>  estensioni = setEstensioniAdesione(null, 0);
		dto.setAmbienteConfigurazione(org.govway.catalogo.core.dto.DTOAdesione.AmbienteEnum.valueOf(ambienteConfigurazione.toString()));
		dto.setApi(api);
		dto.setClients(clients);
		dto.setEstensioni(estensioni);
		dto.setStatoAttuale(adesione.getStato());
		return dto;
	}

	void setSoggetti() {
		dto.setSoggettoErogatore(new DTOSoggetto(this.soggettoDTOFactory.getNomeGateway(adesione.getServizio().getDominio().getSoggettoReferente()), this.soggettoDTOFactory.getTipoGateway(adesione.getServizio().getDominio().getSoggettoReferente())));
		dto.setSoggettoAderente(new DTOSoggetto(this.soggettoDTOFactory.getNomeGateway(adesione.getSoggetto()), this.soggettoDTOFactory.getTipoGateway(adesione.getSoggetto())));
		
		if(adesione.getServizio().getSoggettoInterno()!=null) {
			dto.setSoggettoFruitore(new DTOSoggetto(this.soggettoDTOFactory.getNomeGateway(adesione.getServizio().getSoggettoInterno()), this.soggettoDTOFactory.getTipoGateway(adesione.getServizio().getSoggettoInterno())));
		}
	}

	void getAmbiente() throws ProcessingException {
		if (adesione.getStato().contains("collaudo")) {
			ambienteConfigurazione = AmbienteEnum.COLLAUDO;
			return;
		}
		if (adesione.getStato().contains("produzione")) {
			ambienteConfigurazione = AmbienteEnum.PRODUZIONE;
			return;
		}
		throw new ProcessingException("stato di partenza non compatibile "+ adesione.getStato());
	}


	public Map<String, String> setEstensioniAdesione(String api, int versione) throws IOException {
		Map<String, String> map = new HashMap<>();
		if (adesione.getEstensioni() == null) {
			return Map.of();
		}
		List<EstensioneAdesioneEntity> estensioni = adesione.getEstensioni().stream().filter(e -> ((e.getApi() == null) == (api == null))).collect(Collectors.toList());
		for (EstensioneAdesioneEntity estensione : estensioni) {
			String gruppo = estensione.getGruppo();
			ConfigurazioneReader confReader = new ConfigurazioneReader(externalPath);
			String classeDato = null;
			classeDato = confReader.getClasseDatoAdesione(gruppo);
			if (classeDato.equals(ambienteConfigurazione.toString().toLowerCase()) ||
					classeDato.equals("identificativo") ||
					classeDato.equals("specifica") ||
					classeDato.equals("generico") ||
					classeDato.equals("referenti")) {

				if (api == null) {
					logger.info("nessuna api nella estensione {}",estensione.getNome());

					String valore = estensione.getValore();
					String nomeEstensione = estensione.getNome();

					map.put(gruppo + "." + nomeEstensione, valore);
				} else {
					String apiNome = estensione.getApi().getNome();
					Integer apiVersione = estensione.getApi().getVersione();
					String valore = estensione.getValore();
					String nomeEstensione = estensione.getNome();

					if (api != null && apiVersione == versione && apiNome.equals(api)) {
						map.put(gruppo + "." + nomeEstensione, valore); 
					}
				}
			}

		}
		return map;

	}

	private ClientEntity getClientFromClientAdesione(Set<ClientAdesioneEntity> set, String profilo) throws ProcessingException {
		for (ClientAdesioneEntity clientAdesione : set) {
			if (clientAdesione.getProfilo().equals(profilo))
				return clientAdesione.getClient();
		}

		logger.error("Nessus client associato alla adesione con id {} con profilo {}.",adesione.getId(), profilo);
		throw new ProcessingException("Nessus client associato alla adesione con id "+adesione.getId()+" con profilo "+profilo+".");

	}


	public void setApiErogateAndSetClient() {
		adesione.getServizio().getApi().forEach(this::processApiEntity);
	}

	private void processApiEntity(ApiEntity apiEntity) {
	    apiEntity.getAuthType().forEach(authTypeEntity -> {
	        try {
	            processAuthType(apiEntity, authTypeEntity);
	        } catch (IOException | ProcessingException e) {
	            throw new RuntimeException("Errore durante la gestione di AuthTypeEntity", e);
	        }
	    });
	}

	private void processAuthType(ApiEntity apiEntity, AuthTypeEntity authTypeEntity) throws IOException, ProcessingException {
		Map<String, String> estensioniMap;
		try {
			estensioniMap = setEstensioniAdesione(apiEntity.getNome(), apiEntity.getVersione());
		} catch (IOException e) {
			logger.error("[AdesioneDTOConverter] errore nella gestione delle estensioni adesioni");
			throw e;
		}
		String profilo = authTypeEntity.getProfilo();
		ClientEntity client;
		try {
			client = getClientFromClientAdesione(adesione.getClient(), profilo);
		} catch (ProcessingException e) {
			logger.error("[AdesioneDTOConverter] errore nella gestione del client della adesione");
			throw e;
		}
		List<DTOAdesioneAPI> adesioneList = buildAdesioneList(client, profilo, authTypeEntity);

		DTOApi apiDto = buildDTOApi(apiEntity, estensioniMap, adesioneList);
		api.add(apiDto);

		adesione.getClient().stream()
		.filter(ca -> ca.getProfilo().equals(profilo))
		.forEach(this::processClientAdesione);
	}

	private List<DTOAdesioneAPI> buildAdesioneList(ClientEntity client, String profilo, AuthTypeEntity authTypeEntity) {
		List<DTOAdesioneAPI> list = new ArrayList<>();
		if (client != null) {
			list.add(new DTOAdesioneAPI(profilo, new String(authTypeEntity.getResources()), client.getNome()));
		}
		return list;
	}

	private DTOApi buildDTOApi(ApiEntity apiEntity, Map<String, String> map, List<DTOAdesioneAPI> list) {
		String protocollo = null;
		if (ambienteConfigurazione.equals(AmbienteEnum.COLLAUDO)) {
			protocollo = apiEntity.getCollaudo().getProtocollo().toString();
		}
		else {
			protocollo = apiEntity.getProduzione().getProtocollo().toString();
		}
		return new DTOApi(
				apiEntity.getNome(),
				apiEntity.getVersione(),
				DTOApi.RUOLO.valueOf(apiEntity.getRuolo().toString()),
				DTOApi.PROTOCOLLO.valueOf(protocollo),
				map,
				list);
	}

	private void processClientAdesione(ClientAdesioneEntity clientAdesione) {
		Map<String, EstensioneClientEntity> estensioni = buildEstensioniMap(clientAdesione);
		AuthType authType = clientAdesione.getClient().getAuthType();
		switch (authType) {
		case HTTP_BASIC : addBasicClient(clientAdesione, estensioni);
		break;
		case HTTPS : addHttpsClient(clientAdesione, estensioni);
		break;
		case HTTPS_SIGN :
			addHttpsSignClient(clientAdesione, estensioni);
			break;
		case PDND : addPdndClient(clientAdesione, estensioni);
		break;
		case OAUTH_AUTHORIZATION_CODE : addOauthAuthorizationCodeClient(clientAdesione, estensioni);
		break;
		case OAUTH_CLIENT_CREDENTIALS : addOauthClientCredentialsClient(clientAdesione, estensioni); 
		break;
		case HTTPS_PDND : addHttpsPdndClient(clientAdesione, estensioni);            
		break;
		case HTTPS_PDND_SIGN : addHttpsPdndSignClient(clientAdesione, estensioni);            
		break;
		case SIGN_PDND : addSignPdndClient(clientAdesione, estensioni);            
		break;
		case SIGN : addSignClient(clientAdesione, estensioni);            
		break;
		default : logger.warn("AuthType non gestito: {}", authType);            
		break;
		}
	}

	private Map<String, EstensioneClientEntity> buildEstensioniMap(ClientAdesioneEntity clientAdesione) {
		return clientAdesione.getClient().getEstensioni().stream()
				.collect(Collectors.toMap(EstensioneClientEntity::getNome, e -> e));
	}

	private void addBasicClient(ClientAdesioneEntity clientAdesione, Map<String, EstensioneClientEntity> estensioni) {
		String username = getValue(estensioni, USERNAME);
		if (username != null) {
			clients.add(new DTOBasicClient(clientAdesione.getClient().getNome(),
					clientAdesione.getClient().getDescrizione(),
					clientAdesione.getClient().getAuthType().toString(),
					clientAdesione.getClient().getIndirizzoIp(),
					username));
		} else {
			logger.error("Errore nella mappa estensioni per HTTP_BASIC.");
		}
	}

	private void addHttpsClient(ClientAdesioneEntity clientAdesione, Map<String, EstensioneClientEntity> estensioni) {
	    byte[] certificato = getDocumentRawData(estensioni, AUTENTICAZIONE_CERTIFICATO);
	    String tipo = getDocumentType(estensioni, AUTENTICAZIONE_CERTIFICATO);
	    if (certificato != null && tipo != null) {
	        clients.add(new HttpsClient(clientAdesione.getClient().getNome(),
	                clientAdesione.getClient().getDescrizione(),
	                "HTTPS",
	                clientAdesione.getClient().getIndirizzoIp(),
	                certificato, tipo));
	    } else {
	        logger.error("Errore nella mappa estensioni per HTTPS.");
	    }
	}

	private void addHttpsSignClient(ClientAdesioneEntity clientAdesione, Map<String, EstensioneClientEntity> estensioni) {
	    
		byte[] outCertificate = getDocumentRawData(estensioni,AUTENTICAZIONE_CERTIFICATO);
		String outTipo = getDocumentType(estensioni, AUTENTICAZIONE_CERTIFICATO);
		byte[] signCertificate = getDocumentRawData(estensioni,FIRMA_CERTIFICATO);
		String signTipo = getDocumentType(estensioni, FIRMA_CERTIFICATO);

			if (outCertificate != null && outTipo != null && signCertificate != null && signTipo != null) {
	        clients.add(new HttpsSignClient(clientAdesione.getClient().getNome(), clientAdesione.getClient().getDescrizione(), "HTTPS_SIGN", clientAdesione.getClient().getIndirizzoIp(), outCertificate, outTipo, signCertificate, signTipo));
	        
	    } else {
	        logger.error("Errore nella mappa estensioni per HTTPS_SIGN.");
	    }
	}

	private String getValue(Map<String, EstensioneClientEntity> estensioni, String key) {
		return estensioni.containsKey(key) ? estensioni.get(key).getValore() : null;
	}

	private byte[] getDocumentRawData(Map<String, EstensioneClientEntity> estensioni, String key) {
		return estensioni.containsKey(key) ? estensioni.get(key).getDocumento().getRawData() : null;
	}

	private String getDocumentType(Map<String, EstensioneClientEntity> estensioni, String key) {
		return estensioni.containsKey(key) ? estensioni.get(key).getDocumento().getTipo() : null;
	}


	private void addOauthAuthorizationCodeClient(ClientAdesioneEntity clientAdesione, Map<String, EstensioneClientEntity> estensioni) {
		String uri = getValue(estensioni, URL_ESPOSIZIONE);
		String url = getValue(estensioni, URL_ESPOSIZIONE);
		String nomeApplicazione = getValue(estensioni, NOME_APPLICAZIONE);
		String helpDesk = getValue(estensioni, HELP_DESK);
		String clientId = getValue(estensioni, CLIENT_ID);

		if (uri != null && url != null && nomeApplicazione != null && helpDesk != null && clientId != null) {
			clients.add(new OauthAuthorizationCodeClient(clientAdesione.getClient().getNome(),
					clientAdesione.getClient().getDescrizione(),
					clientAdesione.getClient().getAuthType().toString(),
					clientAdesione.getClient().getIndirizzoIp(),
					clientId, uri, url, nomeApplicazione, helpDesk));
		} else {
			logger.error("Errore nella mappa estensioni per OAUTH_AUTHORIZATION_CODE.");
		}
	}



	private void addSignClient(ClientAdesioneEntity clientAdesione, Map<String, EstensioneClientEntity> estensioni) {
		byte[] certificate = getDocumentRawData(estensioni, FIRMA_CERTIFICATO);
		String tipo = getDocumentType(estensioni, FIRMA_CERTIFICATO);

		if (certificate != null && tipo != null) {
			clients.add(new SignClient(clientAdesione.getClient().getNome(),
					clientAdesione.getClient().getDescrizione(),
					clientAdesione.getClient().getAuthType().toString(),
					clientAdesione.getClient().getIndirizzoIp(),
					certificate, tipo));
		} else {
			logger.error("Errore nella mappa estensioni per SIGN.");
		}
	}


	private void addSignPdndClient(ClientAdesioneEntity clientAdesione, Map<String, EstensioneClientEntity> estensioni) {
		byte[] certificate = getDocumentRawData(estensioni, AUTENTICAZIONE_CERTIFICATO);
		String tipo = getDocumentType(estensioni, AUTENTICAZIONE_CERTIFICATO);
		String clientId = getValue(estensioni, CLIENT_ID);

		if (certificate != null && tipo != null && clientId != null) {
			clients.add(new SignPdndClient(clientAdesione.getClient().getNome(),
					clientAdesione.getClient().getDescrizione(),
					clientAdesione.getClient().getAuthType().toString(),
					clientAdesione.getClient().getIndirizzoIp(),
					certificate, tipo, UUID.fromString(clientId)));
		} else {
			logger.error("Errore nella mappa estensioni per SIGN_PDND.");
		}
	}



	private void addOauthClientCredentialsClient(ClientAdesioneEntity clientAdesione, Map<String, EstensioneClientEntity> estensioni) {
		String clientId = getValue(estensioni, CLIENT_ID);
		if (clientId != null) {
			clients.add(new OauthClientCredentialsClient(clientAdesione.getClient().getNome(),
					clientAdesione.getClient().getDescrizione(),
					clientAdesione.getClient().getAuthType().toString(),
					clientAdesione.getClient().getIndirizzoIp(),
					clientId));
		} else {
			logger.error("Errore nella mappa estensioni per OAUTH_CLIENT_CREDENTIALS.");
		}
	}


	private void addHttpsPdndSignClient(ClientAdesioneEntity clientAdesione, Map<String, EstensioneClientEntity> estensioni) {
		byte[] outCertificate = getDocumentRawData(estensioni, AUTENTICAZIONE_CERTIFICATO);
		String tipoOut = getDocumentType(estensioni, AUTENTICAZIONE_CERTIFICATO);
		byte[] signCertificate = getDocumentRawData(estensioni, FIRMA_CERTIFICATO);
		String tipoSign = getDocumentType(estensioni, FIRMA_CERTIFICATO);
		String clientId = getValue(estensioni, CLIENT_ID);

		if (outCertificate != null && tipoOut != null && signCertificate != null && tipoSign != null && clientId != null) {
			clients.add(new HttpsPdndSignClient(clientAdesione.getClient().getNome(),
					clientAdesione.getClient().getDescrizione(),
					clientAdesione.getClient().getAuthType().toString(),
					clientAdesione.getClient().getIndirizzoIp(),
					outCertificate, tipoOut, signCertificate, tipoSign, UUID.fromString(clientId)));
		} else {
			logger.error("Errore nella mappa estensioni per HTTPS_PDND_SIGN.");
		}
	}


	private void addHttpsPdndClient(ClientAdesioneEntity clientAdesione, Map<String, EstensioneClientEntity> estensioni) {
		byte[] certificate = getDocumentRawData(estensioni, AUTENTICAZIONE_CERTIFICATO);
		String tipo = getDocumentType(estensioni, AUTENTICAZIONE_CERTIFICATO);
		String clientId = getValue(estensioni, CLIENT_ID);

		if (certificate != null && tipo != null && clientId != null) {
			clients.add(new HttpsPdndClient(clientAdesione.getClient().getNome(),
					clientAdesione.getClient().getDescrizione(),
					clientAdesione.getClient().getAuthType().toString(),
					clientAdesione.getClient().getIndirizzoIp(),
					certificate, tipo, UUID.fromString(clientId)));
		} else {
			logger.error("Errore nella mappa estensioni per HTTPS_PDND.");
		}
	}

	private void addPdndClient(ClientAdesioneEntity clientAdesione, Map<String, EstensioneClientEntity> estensioni) {
		String clientId = getValue(estensioni, CLIENT_ID);
		if (clientId != null) {
			clients.add(new PdndClient(clientAdesione.getClient().getNome(),
					clientAdesione.getClient().getDescrizione(),
					clientAdesione.getClient().getAuthType().toString(),
					clientAdesione.getClient().getIndirizzoIp(),
					clientId));
		} else {
			logger.error("Errore nella mappa estensioni per PDND.");
		}
	}

	
}
