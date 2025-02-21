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
package org.govway.catalogo.monitoraggioutils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.stream.Collectors;

import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.monitoraggioutils.transazioni.GetTransazioneRequest;
import org.govway.catalogo.monitoraggioutils.transazioni.GetTransazioneResponse;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniRawResponse;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniRequest;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniResponse;
import org.govway.catalogo.monitoraggioutils.transazioni.TransazioneBuilder;
import org.govway.catalogo.servlets.monitor.model.EsitoTransazioneEnum;
import org.govway.catalogo.servlets.monitor.model.ItemSoggetto;
import org.govway.catalogo.servlets.monitor.model.ItemTransazione;
import org.govway.catalogo.servlets.monitor.model.PageMetadata;
import org.govway.catalogo.servlets.monitor.model.PagedModelItemTransazione;
import org.govway.catalogo.servlets.monitor.model.Transazione;
import org.govway.catalogo.servlets.monitor.model.TransazioneApi;
import org.govway.catalogo.servlets.monitor.model.TransazioneEsito;
import org.govway.catalogo.servlets.monitor.model.TransazioneMittente;
import org.govway.catalogo.servlets.monitor.model.TransazioneRichiesta;
import org.govway.catalogo.servlets.monitor.model.TransazioneRisposta;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.util.FileCopyUtils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.databind.node.JsonNodeType;

public class ELKMonitoraggioClient implements IMonitoraggioClient{

	private Logger logger = LoggerFactory.getLogger(ELKMonitoraggioClient.class);

	@Autowired
	private TransazioneBuilder transazioneBuilder;

	@Override
	public GetTransazioneResponse getTransazione(GetTransazioneRequest request) {

		try {
			String idTransazione = request.getIdTransazione().toString();
			ConfigurazioneConnessione configurazioneConnessione = request.getConfigurazioneConnessione();
			JsonNode response = getJsonTreeByIdTransazione(idTransazione, configurazioneConnessione);
			
			JsonNode tree = response.get("hits").get("hits").get(0).get("_source");
			Transazione transazioneDetail = this.toDetail(tree);

			GetTransazioneResponse gtresponse = new GetTransazioneResponse();
			gtresponse.setTransazione(transazioneDetail);
			return gtresponse;
		} catch(Exception e) {
			this.logger.error("Errore nell'invocazione del monitoraggio: " +e.getMessage(),e);
			throw new InternalException(e.getMessage());
		}
	}

	private JsonNode getJsonTreeByIdTransazione(String idTransazione, ConfigurazioneConnessione configurazioneConnessione)
			throws IOException, MalformedURLException, ProtocolException {
		Resource resource = new ClassPathResource("/get_template.json");
		InputStream inputStream = resource.getInputStream();
		byte[] req = FileCopyUtils.copyToByteArray(inputStream);

		String actualRequest = new String(req)
				.replaceAll("#ID_EGOV#", idTransazione);

		JsonNode response = executeSearch(actualRequest, configurazioneConnessione);
		
		return response;
	}

	@Override
	public ListTransazioniResponse listTransazioni(ListTransazioniRequest request) {
		
		try {

			JsonNode tree;
			int rLimit = request.getPageable() != null ? request.getPageable().getPageSize() : 50;
			int rOffset =request.getPageable() != null ? rLimit*request.getPageable().getPageNumber() : 0;
			if(request.getIdTransazione() != null) {
				ListTransazioniResponse listTransazioniResponse = new ListTransazioniResponse();
				rLimit = 1;
				rOffset = 0;
				tree = getJsonTreeByIdTransazione(request.getIdTransazione().toString(), request.getConfigurazioneConnessione());
				PagedModelItemTransazione pagedModel = this.toListItems(tree, rOffset, rLimit);
				listTransazioniResponse.setPagedModel(pagedModel);
				return listTransazioniResponse;
			} else  {
				return getListaTransazioniELK(request);
			}

	
		} catch(Exception e) {
			this.logger.error("Errore nell'invocazione del monitoraggio: " +e.getMessage(),e);
			throw new InternalException(e.getMessage());
		}
	}

	private ListTransazioniResponse getListaTransazioniELK(ListTransazioniRequest request)
			throws IOException, MalformedURLException, ProtocolException {
		int rLimit;
		int rOffset;
		rLimit = request.getPageable().getPageSize();
		rOffset = rLimit*request.getPageable().getPageNumber();
		String services = getServices(request.getLstIdApi(), request.getSoggettoReferente());

		if(services == null) {
			this.logger.info("Services null");
			return new ListTransazioniResponse();
		}

		JsonNode tree = getJsonNodeELK(request);
		PagedModelItemTransazione pagedModel = this.toListItems(tree, rOffset, rLimit);
		ListTransazioniResponse listTransazioniResponse = new ListTransazioniResponse();
		listTransazioniResponse.setPagedModel(pagedModel);
		return listTransazioniResponse;
	}

	private JsonNode getJsonNodeELK(ListTransazioniRequest request)
			throws IOException, MalformedURLException, ProtocolException {
		int rLimit;
		int rOffset;

		rLimit = request.getPageable().getPageSize();
		rOffset = rLimit*request.getPageable().getPageNumber();
		String services = getServices(request.getLstIdApi(), request.getSoggettoReferente());

		if(services == null) {
			this.logger.info("Services null");
			return null;
		}

		Resource resource = new ClassPathResource("/findAll_template.json");
		InputStream inputStream = resource.getInputStream();
		byte[] req = FileCopyUtils.copyToByteArray(inputStream);

		String actualRequest = new String(req)
				.replaceAll("#SERVICES_TO_MATCH#", services)
				.replaceAll("#DATA_DA#", format(request.getDataDa()))
				.replaceAll("#DATA_A#", format(request.getDataA()))
				.replaceAll("#ESITO#", getEsito(request.getEsito()))
				.replaceAll("#OFFSET#", rOffset+"")
				.replaceAll("#LIMIT#", rLimit+"")
				;

		return executeSearch(actualRequest, request.getConfigurazioneConnessione());
	}

	private JsonNode executeSearch(String actualRequest, ConfigurazioneConnessione configurazioneConnessione) throws MalformedURLException, IOException, ProtocolException {
		URL url = new URL(configurazioneConnessione.getUrl());
		HttpURLConnection connection = (HttpURLConnection) url.openConnection();

		if(configurazioneConnessione.getUsername()!=null &&configurazioneConnessione.getPassword()!=null) {
			String auth =  configurazioneConnessione.getUsername()+":" + configurazioneConnessione.getPassword();
			String authentication = "Basic " + new String(Base64.getEncoder().encode(auth.getBytes()));
			connection.setRequestProperty("Authorization", authentication);
		}

		connection.setRequestProperty("kbn-xsrf", "true");
		connection.setRequestProperty("Content-Type", "application/json");

		connection.setRequestProperty("Accept", "*/*");
		connection.setDoOutput(true);
		connection.setDoInput(true);

		connection.setRequestMethod("POST");

		this.logger.info("Request: " + actualRequest);

		connection.getOutputStream().write(actualRequest.getBytes());
		connection.getOutputStream().close();

		int responseCode = connection.getResponseCode();

		this.logger.info("response code: " + responseCode);

		byte[] res = FileCopyUtils.copyToByteArray(connection.getInputStream());
		this.logger.info("Response: " + new String(res));

		JsonMapper mapper = new JsonMapper();
		JsonNode tree = mapper.readTree(new ByteArrayInputStream(res));
		return tree;
	}

	private String getEsito(org.govway.catalogo.servlets.monitor.model.EsitoTransazioneEnum esito) {
		if(esito == null) {
			return "";
		}

		List<Integer> lst = this.getEsiti(esito);

		return "," + or(matches(lst.stream().map(e -> e +"").collect(Collectors.toSet()), "govway_status"));

	}

	private String or(String condition) {
		return "{\"bool\" : {\"should\" : ["+condition+"], \"minimum_should_match\" : 1}}";
	}

	private String and(String condition) {
		return "{\"bool\" : {\"must\" : ["+condition+"]}}";
	}

	private String matches(Collection<String> fields, String fieldName) {
		StringBuilder sb = new StringBuilder();
		for(String field: fields) {
			if(sb.length() > 0) {
				sb.append(", ");
			}
			sb.append(matches(fieldName, field));
		}

		return sb.toString();
	}

	private String matches(String field, String fieldName) {
//		return "{\"match_phrase\" : {\""+fieldName+"\" : \""+field+"\"}}";
		return "{\"match_phrase\" : {\""+field+"\" : {\"query\": \""+fieldName+"\"}}}";
	}

	private String format(OffsetDateTime data) {
		java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSZ");
		return data.format(formatter);
	}

	private String getServices(List<IdApi> idApiLst, String soggettoReferente) {


		Set<String> servizi = new HashSet<>();
		
		for(IdApi id: idApiLst) {
			servizi.add(matchServizio(id, soggettoReferente));
		}
		
		if(servizi.size() == 0) {
			return null;
		} else if(servizi.size() == 1) {
			return servizi.stream().findAny().get();
		} else {
			StringBuffer sb = new StringBuffer();
			
			for(String servizio: servizi) {
				if(sb.length() > 0) {
					sb.append(", ");
				}
				
				sb.append(servizio);
			}
			
			return or(sb.toString());
		}
	}

//	private String matchServizio = "\"bool\": {\"must\": [[{\"match_phrase\": {\"servizio\": \"#NOME#\"}},{\"match_phrase\": {\"versione_servizio\": #VERSIONE#}},{\"match_phrase\": {\"#CAMPO_EROGATORE#\": \"#EROGATORE#\"}},{\"match_phrase\": {\"tipo_transazione\": \"#TIPO#\"}}]]}";
	private String matchServizio(IdApi id, String soggettoReferente) {
		
		String tipo = null;
		String campoErogatore = null;
		String erogatore = null;
		if(id.isFruizione()) {
			tipo = "fruizione";
			campoErogatore = "erogatore";
			erogatore = soggettoReferente;
		} else {
			tipo = id.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO) ? "erogazione" : "fruizione";
			campoErogatore = id.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO) ? "erogatore" : "soggetto_fruitore";
			erogatore = id.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO) ? soggettoReferente: id.getSoggetto();
		}

		List<String> matchesList = new ArrayList<String>();
		matchesList.add(matches("servizio", id.getNome()));
		matchesList.add(matches("versione_servizio", id.getVersione() + ""));
		matchesList.add(matches(campoErogatore, erogatore));
		matchesList.add(matches("tipo_transazione", tipo));
		
		StringBuilder sb = new StringBuilder();
		for(String match: matchesList) {
			if(sb.length() > 0) {
				sb.append(", ");
			}
			
			sb.append(match);
		}
		return sb.toString();

//		return and(sb.toString());
	}

	private Map<Integer, EsitoTransazioneEnum> esiti = null;

	private Map<Integer, EsitoTransazioneEnum> getEsiti() {

		if(this.esiti == null) {
			InputStream is = null;
			try {
				this.esiti = new HashMap<>();
				Properties p = new Properties();
				is = ELKMonitoraggioClient.class.getResourceAsStream("/esiti.properties");
				p.load(is);

				String oks = p.getProperty("esiti.codes.ok");
				String[] okl = oks.split(","); 
				for(String ok:okl) {
					this.esiti.put(Integer.parseInt(ok.trim()), EsitoTransazioneEnum.OK);
				}

				String erroriconsegnas = p.getProperty("esiti.codes.erroriConsegna");
				String[] erroriconsegnal = erroriconsegnas.split(","); 
				for(String erroriconsegna:erroriconsegnal) {
					this.esiti.put(Integer.parseInt(erroriconsegna.trim()), EsitoTransazioneEnum.FALLITE);
				}

				String scartates = p.getProperty("esiti.codes.richiestaScartate");
				String[] scartatel = scartates.split(","); 
				for(String scart:scartatel) {
					this.esiti.put(Integer.parseInt(scart.trim()), EsitoTransazioneEnum.FALLITE_ESCLUDI_SCARTATE);
				}

				this.esiti.put(2, EsitoTransazioneEnum.FAULT);

			} catch (IOException e) {
				if(is != null) {
					try {is.close();}catch (IOException ec) {}
				}
			}
		}

		return this.esiti;
	}

	private EsitoTransazioneEnum getEsito(Integer esitoInt) {
		if(this.getEsiti().containsKey(esitoInt)) {
			return this.getEsiti().get(esitoInt);
		}
		return null;
	}

	public List<Integer> getEsiti(EsitoTransazioneEnum esito) {
		if(esito.equals(EsitoTransazioneEnum.FALLITE)) {
			List<Integer> lst = this.getEsiti().entrySet().stream().filter(e -> !e.getValue().equals(EsitoTransazioneEnum.OK)).map(e -> e.getKey()).collect(Collectors.toList());
			return lst;
		} else if(esito.equals(EsitoTransazioneEnum.FALLITE_E_FAULT)) {
			List<Integer> lst = this.getEsiti().entrySet().stream().filter(e -> !e.getValue().equals(EsitoTransazioneEnum.OK)).map(e -> e.getKey()).collect(Collectors.toList());
			return lst;
		} else {
			return this.getEsiti().entrySet().stream().filter(e -> e.getValue().equals(esito)).map(e -> e.getKey()).collect(Collectors.toList());
		}
	}

	public PagedModelItemTransazione toListItems(JsonNode jsonNode, int rOffset, int rLimit) {

		JsonNode hits = jsonNode.get("hits");

		PagedModelItemTransazione lista = new PagedModelItemTransazione();
		Iterator<JsonNode> itHits = hits.get("hits").iterator();
		while(itHits.hasNext()) {
			JsonNode jsonNodeHits = itHits.next();
			JsonNode source = jsonNodeHits.get("_source");
			lista.addContentItem(toItem(source));
		}
		
		long size = 0;
		if(lista.getContent()!= null) {
			size = lista.getContent().size();
		} else {
			lista.setContent(new ArrayList<>());
		}

		lista.setPage(new PageMetadata().size(size).number(1l).totalElements(size).totalPages(1l));
		return lista;
	}

	public ListTransazioniRawResponse toListRaw(JsonNode jsonNode) throws IOException {

		JsonNode hits = jsonNode.get("hits");

		Iterator<JsonNode> itHits = hits.get("hits").iterator();
		List<org.govway.catalogo.monitoraggioutils.transazioni.Transazione> list = new ArrayList<>();
		while(itHits.hasNext()) {
			JsonNode jsonNodeHits = itHits.next();
			JsonNode source = jsonNodeHits.get("_source");
			list.add(toRaw(source));
		}

		return this.transazioneBuilder.getRawTransazioni(list);
	}

	public ItemTransazione toItem(JsonNode source) {
		ItemTransazione transazione = new ItemTransazione();

		transazione.setIdTraccia(getOrNull(source.get("id_transazione")));
		transazione.setIdApplicativo(getOrNull(source.get("id_toscana")));
		transazione.setIdCluster(getOrNull(source.get("id_cluster")));
		String timeIn = getOrNull(source.get("data_ingresso_richiesta"));
		if(timeIn!=null) {
			transazione.setData(OffsetDateTime.parse(timeIn));
		}
		transazione.setTempoElaborazione(getOrNullLong(source.get("tempo_elaborazione")));
		transazione.setProfilo(getOrNull(source.get("profilo")));

		transazione.setRichiedente(getOrNull(source.get("fruitore")));
		transazione.setReturnCodeHttp(getOrNullInteger(source.get("http_code")));
		
		JsonNode jsonNodeErrorCode = source.get("govway_status");
		if(jsonNodeErrorCode != null && !jsonNodeErrorCode.isNull()) {
			
			TransazioneEsito esito = new TransazioneEsito();
			esito.setCodice(jsonNodeErrorCode.asText());
			JsonNode jsonNode = source.get("error_message");
			
			if(jsonNode != null && jsonNode.getNodeType().equals(JsonNodeType.STRING)) {
				esito.setDescrizione(jsonNode.asText());
			}

			transazione.setEsito(esito);

		} else {
			TransazioneEsito esito = new TransazioneEsito();
			esito.setCodice(EsitoTransazioneEnum.OK.toString());
			transazione.setEsito(esito);
		}
		
		TransazioneApi api = new TransazioneApi();

		api.setNome(source.get("servizio").asText());
		api.setVersione(source.get("versione_servizio").asInt());
		api.setErogatore(getSoggetto(source.get("erogatore").asText()));
		api.setOperazione(source.get("azione").asText());
		api.setProfiloCollaborazione(getOrNull(source.get("profilo")));
		
		transazione.setApi(api);
		
		return transazione;

	}

	public Transazione toDetail(JsonNode source) {
		Transazione transazione = new Transazione();

		TransazioneRichiesta richiesta = new TransazioneRichiesta();

		String timeIn = getOrNull(source.get("data_ingresso_richiesta"));
		if(timeIn != null) {
			richiesta.setDataRicezione(OffsetDateTime.parse(timeIn));
		} else {
			String timeSIn = getOrNull(source.get("timestamp_pda_in"));
			if(timeSIn != null) {
				richiesta.setDataRicezione(OffsetDateTime.parse(timeSIn));
			}			
		}

		transazione.setRichiesta(richiesta);

		TransazioneRisposta risposta = new TransazioneRisposta();

		String timeOut = getOrNull(source.get("data_uscita_risposta"));
		if(timeOut != null) {
			risposta.setDataConsegna(OffsetDateTime.parse(timeOut));
		}

		transazione.setRisposta(risposta);

		
		String mittenteString = getOrNull(source.get("fruitore"));
		if(mittenteString != null) {
			TransazioneMittente mittente = new TransazioneMittente();
			mittente.setFruitore(getSoggetto(mittenteString));
			transazione.setMittente(mittente);
		}

		TransazioneApi api = new TransazioneApi();

		api.setNome(source.get("servizio").asText());
		api.setVersione(source.get("versione_servizio").asInt());
		api.setErogatore(getSoggetto(source.get("erogatore").asText()));
		api.setOperazione(source.get("azione").asText());
		api.setProfiloCollaborazione(getOrNull(source.get("profilo")));
		
		transazione.setApi(api);

		JsonNode jsonNodeErrorCode = source.get("govway_status");
		if(jsonNodeErrorCode != null && !jsonNodeErrorCode.isNull()) {
			TransazioneEsito esito = new TransazioneEsito();
			esito.setCodice(jsonNodeErrorCode.asText());
			JsonNode jsonNode = source.get("error_message");
			if(jsonNode != null && jsonNode.getNodeType().equals(JsonNodeType.STRING)) {
				esito.setDescrizione(jsonNode.asText());
			}
			transazione.setEsito(esito);
		} else {

			TransazioneEsito esito = new TransazioneEsito();
			esito.setCodice(EsitoTransazioneEnum.OK.toString());
			transazione.setEsito(esito);
		}

		transazione.setIdTraccia(getOrNull(source.get("id_transazione")));
		transazione.setIdApplicativo(getOrNull(source.get("id_toscana")));
//		transazione.setIdCorrelazioneRichiesta(getOrNull(source.get("id_correlazione_richiesta")));
//		transazione.setIdCorrelazioneRisposta(getOrNull(source.get("id_correlazione_risposta")));
//		transazione.setUrlInvocazione(getOrNull(source.get("url_invocazione")));
		transazione.setReturnCodeHttp(getOrNullInteger(source.get("http_code")));
		transazione.setReturnCodeHttpBackend(getOrNullInteger(source.get("backend_http_code")));
//		transazione.setMetodoHttp(getOrNull(source.get("http_method")));
		transazione.setTempoElaborazione(getOrNullLong(source.get("tempo_elaborazione")));

		return transazione;
	}

	public org.govway.catalogo.monitoraggioutils.transazioni.Transazione toRaw(JsonNode source) {
		org.govway.catalogo.monitoraggioutils.transazioni.Transazione transazione = new org.govway.catalogo.monitoraggioutils.transazioni.Transazione();

		String timeIn = getOrNull(source.get("data_ingresso_richiesta"));
		if(timeIn != null) {
			transazione.setDataIngressoRichiestaInRicezione(timeIn);
		} else {
			String timeSIn = getOrNull(source.get("timestamp_pda_in"));
			if(timeSIn != null) {
				transazione.setDataIngressoRichiestaInRicezione(timeSIn);
			}			
		}

		String timeOut = getOrNull(source.get("data_uscita_risposta"));
		if(timeOut != null) {
			transazione.setDataUscitaRispostaConsegnata(timeOut);
		}

		String timeOutReq = getOrNull(source.get("data_invocazione_backend"));
		if(timeOutReq != null) {
			transazione.setDataUscitaRichiestaInSpedizione(timeOutReq);
		}

		String timeInRes = getOrNull(source.get("data_risposta_backend"));
		if(timeInRes != null) {
			transazione.setDataIngressoRispostaInRicezione(timeInRes);
		}

		String mittenteString = getOrNull(source.get("fruitore"));
		if(mittenteString != null) {
			transazione.setApplicativoFruitore(mittenteString);
		}

		transazione.setApi(source.get("servizio").asText() + " v" + source.get("versione_servizio").asInt());
		transazione.setSoggettoErogatore(source.get("erogatore").asText());
		transazione.setProfilo(getOrNull(source.get("profilo_interoperabilita")));
		transazione.setContesto("applicativo");

		transazione.setTipologia(getOrNull(source.get("tipo_transazione")));
		
		String tipoApi = getOrNull(source.get("tipo_api"));
		transazione.setTipoAPI(tipoApi);
		
		String azioneString = source.get("azione").asText();
		
		if(transazione.getTipoAPI().equals("soap")) {
			transazione.setAzione(azioneString);
		} else {
			transazione.setAzione(this.transazioneBuilder.getAzioneRest(azioneString));
			transazione.setMetodoHTTP(this.transazioneBuilder.getMetodoHTTPRest(azioneString));
		}
		
		
		JsonNode jsonNodeErrorCode = source.get("govway_status_detail");
		if(jsonNodeErrorCode != null && !jsonNodeErrorCode.isNull()) {
			transazione.setEsito(jsonNodeErrorCode.asText());
		} else {
			transazione.setEsito("Ok");
		}

		transazione.setIdTransazione(getOrNull(source.get("id_transazione")));
		transazione.setIdApplicativoRichiesta(getOrNull(source.get("id_correlazione_richiesta")));
		transazione.setIdApplicativoRisposta(getOrNull(source.get("id_correlazione_risposta")));
//		transazione.setIdCorrelazioneRichiesta(getOrNull(source.get("id_correlazione_richiesta")));
//		transazione.setIdCorrelazioneRisposta(getOrNull(source.get("id_correlazione_risposta")));
//		transazione.setUrlInvocazione(getOrNull(source.get("url_invocazione")));
//		transazione.setMetodoHttp(getOrNull(source.get("http_method")));
		
		transazione.setCodiceRispostaUscita(getOrNull(source.get("http_code")));
		transazione.setCodiceRispostaIngresso(getOrNull(source.get("backend_http_code")));
		Long tempoElaborazione = getOrNullLong(source.get("tempo_elaborazione"));
		
		if(tempoElaborazione!=null) {
			transazione.setTempoRispostaServizio(DurationFormatUtilities.convertSystemTimeIntoStringMillisecondi(tempoElaborazione, true));
		}
		
		Long latenzaTotale = getOrNullLong(source.get("latenza")); 

		if(latenzaTotale!=null) {
			transazione.setLatenzaTotale(DurationFormatUtilities.convertSystemTimeIntoStringMillisecondi(latenzaTotale, true));
		}


		return transazione;
	}

	private ItemSoggetto getSoggetto(String nomesoggetto) {
		ItemSoggetto s = new ItemSoggetto();
		s.setNome(nomesoggetto);
		return s;
	}

	private String getOrNull(JsonNode jsonNode) {
		if(jsonNode == null || jsonNode.isNull()) {
			return null;
		}		

		return jsonNode.asText();
	}

	private Integer getOrNullInteger(JsonNode jsonNode) {
		String resp = this.getOrNull(jsonNode);
		if(resp == null) {
			return null;
		}		

		try {
			return Integer.parseInt(resp);
		} catch(NumberFormatException e) {
			return null;
		}
	}

	private Long getOrNullLong(JsonNode jsonNode) {
		String resp = this.getOrNull(jsonNode);
		if(resp == null) {
			return null;
		}		

		try {
			return Long.parseLong(resp);
		} catch(NumberFormatException e) {
			try {
				return (long) Double.parseDouble(resp);
			} catch(RuntimeException re) {
				return null;
			} catch(Throwable t) {
				return null;
			} 
		}
	}



	@Override
	public boolean isLimitata() {
		return true;
	}

	@Override
	public ListTransazioniRawResponse listTransazioniRaw(ListTransazioniRequest request) {
		try {
			if(request.getIdTransazione()!= null) {
				return toListRaw(getJsonTreeByIdTransazione(request.getIdTransazione().toString(), request.getConfigurazioneConnessione()));
			} else {
				return toListRaw(getJsonNodeELK(request));
			}
			
		} catch (RuntimeException e) {
			throw e;
		} catch (Exception e) {
			this.logger.error("Errore durante la serializzazione delle transazioni: " + e.getMessage(), e);
			throw new InternalException("Errore durante la serializzazione delle transazioni: " + e.getMessage());
		}
	}
	
}
 