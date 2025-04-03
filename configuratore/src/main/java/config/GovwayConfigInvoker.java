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
package config;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.govway.catalogo.core.dto.DTOSoggetto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.FieldNamingPolicy;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import configuratore.GruppoServizio;
import freemarker.core.ParseException;
import freemarker.template.Configuration;
import freemarker.template.MalformedTemplateNameException;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import freemarker.template.TemplateNotFoundException;
import okhttp3.Credentials;
import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public class GovwayConfigInvoker {	
	
	private static final String QUERY_PROFILO = "profilo";
	private static final String QUERY_SOGGETTO = "soggetto";
	private static final String QUERY_GRUPPO = "gruppo";
	
	private static final String HEADER_AUTHORIZATION = "Authorization";
	private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

	private final HttpUrl baseUrl;
	private String credentials;	
	private final OkHttpClient client;
	private Gson gson;
	
	private Configuration template;
	private static final String PATH_TEMPLATE_APPLICATIVO = "applicativo.ftlh";
	private static final String PATH_TEMPLATE_EROGAZIONE_APPLICATIVI = "erogazioneApplicativi.ftlh";
	private static final String PATH_TEMPLATE_CREDENZIALI = "credenziali.ftlh";
	private static final String PATH_TEMPLATE_SOGGETTO_AUTORIZZATO = "soggettoAutorizzato.ftlh";

	private Logger logger = LoggerFactory.getLogger(GovwayConfigInvoker.class);

	
	public GovwayConfigInvoker credentials(String username, String password) {
		this.credentials = Credentials.basic(username, password);
		return this;
	}
	
	public GovwayConfigInvoker(HttpUrl url, Configuration cfg) throws TemplateNotFoundException, MalformedTemplateNameException, ParseException, IOException {
		this.baseUrl = url;
		this.client = new OkHttpClient();
		
		this.gson = new GsonBuilder()
				.setFieldNamingPolicy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES)
				.create();
		
		
		this.template = cfg;
	}
	
	private RequestBody templateToRequestBody(MediaType type, Template template, Object dataModel) throws TemplateException, IOException {
		ByteArrayOutputStream stream = new ByteArrayOutputStream();
		Writer writer = new OutputStreamWriter(stream);
		template.process(dataModel, writer);
		
		byte[] content = stream.toByteArray();
		return RequestBody.create(content, type);
	}
	
	
	private HttpUrl.Builder getUrlConfigurazioneServizio(GruppoServizio api) {
		HttpUrl.Builder url = this.baseUrl.newBuilder();
		DTOSoggetto soggetto;
		
		if (api.isFruizione()) {
			url.addPathSegment("fruizioni")
				.addPathSegment(api.getSoggettoErogatore().getNomeGateway());
			soggetto = api.getSoggettoFruitore();
		} else {
			url.addPathSegment("erogazioni");
			soggetto = api.getSoggettoErogatore();
		}
		
		url.addQueryParameter(QUERY_SOGGETTO, soggetto.getNomeGateway())
			.addQueryParameter(QUERY_PROFILO, soggetto.getTipoGateway());
		
		url.addPathSegment(api.getNomeServizio())
			.addPathSegment(api.getVersioneServizio().toString());
		
		this.logger.debug("getUrlConfigurazioneServizio:" + url);
		return url;
	}
	
	/**
	 * Ottiene il controllo degli accessi del servzio
	 * @param api, servizio interessato
	 * @return la classe ritorno degli accessi
	 * @throws IOException
	 */
	public ControlloAccessiAutenticazione getControlloAccessiAutenticazione(GruppoServizio api) throws IOException {
		HttpUrl url = this.getUrlConfigurazioneServizio(api)
				.addPathSegments("configurazioni/controllo-accessi/autenticazione")
				.addQueryParameter(QUERY_SOGGETTO, api.getSoggettoErogatore().getNomeGateway())
				.addQueryParameter(QUERY_PROFILO, api.getSoggettoErogatore().getTipoGateway())
				.addQueryParameter(QUERY_GRUPPO, api.getGruppo())
				.build();
		
		Request req = new Request.Builder()
				.url(url)
				.addHeader(HEADER_AUTHORIZATION, credentials)
				.get()
				.build();
		
		Response res = this.client.newCall(req).execute();
		
		if (!res.isSuccessful())
			throw new IOException("ottenuto codice di errore HTTP: " + res.code());
		
		ResponseBody responseBody = res.body();
		String content = responseBody.string();
		
		return this.gson.fromJson(content, ControlloAccessiAutenticazione.class);
	}
	
	
	/**
	 * 
	 * @param erogazione
	 * @return
	 * @throws IOException
	 */
	public ControlloAccessiGestioneToken getControlloAccessiGestioneToken(GruppoServizio singleAPI) throws IOException {
		HttpUrl url = this.baseUrl.newBuilder()
				.addPathSegment("erogazioni")
				.addPathSegment(singleAPI.getNomeServizio())
				.addPathSegment(singleAPI.getVersioneServizio().toString())
				.addPathSegments("configurazioni/controllo-accessi/gestione-token")
				.addQueryParameter(QUERY_SOGGETTO, singleAPI.getSoggettoErogatore().getNomeGateway())
				.addQueryParameter(QUERY_PROFILO, singleAPI.getSoggettoErogatore().getTipoGateway())
				.addQueryParameter(QUERY_GRUPPO, singleAPI.getGruppo())
				.build();
		
		Request req = new Request.Builder()
				.url(url)
				.addHeader(HEADER_AUTHORIZATION, credentials)
				.get()
				.build();
		
		Response res = this.client.newCall(req).execute();
		
		if (!res.isSuccessful())
			throw new IOException("ottenuto codice di errore HTTP: " + res.code());
		
		ResponseBody responseBody = res.body();
		String content = responseBody.string();
		
		return this.gson.fromJson(content, ControlloAccessiGestioneToken.class);
	}
	
	// /erogazioni/{nome}/{versione}/configurazioni/controllo-accessi/autorizzazione
	public ControlloAccessiAutorizzazione getControlloAccessiAutorizzazione(GruppoServizio api) throws IOException {
		HttpUrl url = this.getUrlConfigurazioneServizio(api)
				.addPathSegments("configurazioni/controllo-accessi/autorizzazione")
				.addQueryParameter(QUERY_SOGGETTO, api.getSoggettoErogatore().getNomeGateway())
				.addQueryParameter(QUERY_PROFILO, api.getSoggettoErogatore().getTipoGateway())
				.addQueryParameter(QUERY_GRUPPO, api.getGruppo())
				.build();
		
		Request req = new Request.Builder()
				.url(url)
				.addHeader(HEADER_AUTHORIZATION, credentials)
				.get()
				.build();
		
		Response res = this.client.newCall(req).execute();
		
		if (!res.isSuccessful())
			throw new IOException("ottenuto codice di errore HTTP: " + res.code());
		
		ResponseBody responseBody = res.body();
		String content = responseBody.string();
		
		return this.gson.fromJson(content, ControlloAccessiAutorizzazione.class);
	}
	
	public Response postServizioApplicativo(ServizioApplicativo sa, DTOSoggetto soggetto) throws IOException, TemplateException {			
		HttpUrl url = this.baseUrl.newBuilder()
				.addPathSegment("applicativi")
				.addQueryParameter(QUERY_SOGGETTO, soggetto.getNomeGateway())
				.addQueryParameter(QUERY_PROFILO, soggetto.getTipoGateway())
				.build();
		
		Request request = new Request.Builder()
		        .url(url)
		        .addHeader(GovwayConfigInvoker.HEADER_AUTHORIZATION, this.credentials)
		        .post(templateToRequestBody(JSON, this.template.getTemplate(PATH_TEMPLATE_APPLICATIVO), sa))
		        .build();
		
		return this.client.newCall(request).execute();
	}
	
	public Response postApplicativoToServizio(GruppoServizio singleAPI, String saName, String soggetto) throws TemplateException, IOException {
		HttpUrl url = this.getUrlConfigurazioneServizio(singleAPI)
				.addPathSegment("configurazioni")
				.addPathSegment("controllo-accessi")
				.addQueryParameter(QUERY_GRUPPO, singleAPI.getGruppo())
				.addPathSegment("autorizzazione")
				.addPathSegment("applicativi")
				.build();
				
		Map<String, String> root = new HashMap<>();
		root.put("nome_applicativo", saName);
		if (soggetto != null)
			root.put("soggetto", soggetto);
		
		Request request = new Request.Builder()
		        .url(url)
		        .addHeader(HEADER_AUTHORIZATION, this.credentials)
		        .post(templateToRequestBody(JSON, this.template.getTemplate(PATH_TEMPLATE_EROGAZIONE_APPLICATIVI), root))
		        .build();
				
		return this.client.newCall(request).execute();
	}
	
	public Response postApplicativoToServizioToken(GruppoServizio singleAPI, String saName) throws TemplateException, IOException {
		// infine assicio il servizio applicativo ai richiedenti
		HttpUrl url = this.baseUrl.newBuilder()
				.addPathSegment("erogazioni")
				.addPathSegment(singleAPI.getNomeServizio())
				.addPathSegment(singleAPI.getVersioneServizio().toString())
				.addPathSegment("configurazioni")
				.addPathSegment("controllo-accessi")
				.addPathSegment("autorizzazione")
				.addPathSegment("token")
				.addPathSegment("applicativi")
				.addQueryParameter(QUERY_SOGGETTO, singleAPI.getSoggettoErogatore().getNomeGateway())
				.addQueryParameter(QUERY_PROFILO, singleAPI.getSoggettoErogatore().getTipoGateway())
				.addQueryParameter(QUERY_GRUPPO, singleAPI.getGruppo())
				.build();
					
		Map<String, String> root = new HashMap<>();
		root.put("nome_applicativo", saName);
			
		Request request = new Request.Builder()
		        .url(url)
		        .addHeader(HEADER_AUTHORIZATION, this.credentials)
		        .post(templateToRequestBody(JSON, this.template.getTemplate(PATH_TEMPLATE_EROGAZIONE_APPLICATIVI), root))
		        .build();
					
		return this.client.newCall(request).execute();
	}
	
	private List<String> getNomiFromRisorse(GruppoServizio singleAPI, List<String> risorse) throws IOException {
		Integer limit = 100;
		Integer offset = 0;
		HttpUrl url = this.baseUrl.newBuilder()
				.addPathSegment("api")
				.addPathSegment(singleAPI.getNomeApi())
				.addPathSegment(singleAPI.getVersioneApi().toString())
				.addPathSegments("risorse")
				.addQueryParameter(QUERY_SOGGETTO, singleAPI.getSoggettoErogatore().getNomeGateway())
				.addQueryParameter(QUERY_PROFILO, singleAPI.getSoggettoErogatore().getTipoGateway())
				.addQueryParameter("limit", limit.toString())
				.addQueryParameter("offset", offset.toString())
				.build();
		
		Request req;
		Response res;
		ResponseBody responseBody;
		String content;
		
		ListaApiRisorse listaRisorse = new ListaApiRisorse();
		listaRisorse.setNext(url.toString());
		listaRisorse.setItems(List.of());
		Map<String, String> risorseNomi = new HashMap<>();
		
		do {
			req = new Request.Builder()
					.url(listaRisorse.getNext())
					.addHeader(HEADER_AUTHORIZATION, credentials)
					.get()
					.build();
			
			res = this.client.newCall(req).execute();

			this.logger.info("getNomiFromRisorse:" + url);

			if (!res.isSuccessful())
				throw new IOException("ottenuto codice di errore HTTP: " + res.code());
			
			responseBody = res.body();
			content = responseBody.string();
			
			listaRisorse = this.gson.fromJson(content, ListaApiRisorse.class);
			
			for (ApiRisorsa item : listaRisorse.getItems())
				risorseNomi.put(item.getHttpMethod() + " " + item.getPath(), item.getNome());
		} while (listaRisorse.getNext() != null);
		
		
		List<String> nomi = new ArrayList<>();
		for (String risorsa : risorse) {
 			String nome = risorseNomi.get(risorsa);
			
			if (nome == null) {
				throw new IOException("risorsa non presente");
			} else {
				nomi.add(nome);
			}
		}
		
		return nomi;
	}
	
	public List<String> getGruppiFromRisorse(GruppoServizio api, List<String> risorse) throws IOException {	
		Integer limit = 100;
		Integer offset = 0;
		List<String> nomiRisorse = this.getNomiFromRisorse(api, risorse);
		Set<String> azioni = new HashSet<>();
		azioni.addAll(nomiRisorse);
		
		HttpUrl url = this.getUrlConfigurazioneServizio(api)
				.addPathSegments("gruppi")
				.addQueryParameter(QUERY_SOGGETTO, api.getSoggettoErogatore().getNomeGateway())
				.addQueryParameter(QUERY_PROFILO, api.getSoggettoErogatore().getTipoGateway())
				.addQueryParameter("limit", limit.toString())
				.addQueryParameter("offset", offset.toString())
				.build();
		
		Request req;
		Response res;
		ResponseBody responseBody;
		String content;
		
		ListaGruppi listaGruppi = new ListaGruppi();
		listaGruppi.setNext(url.toString());
		listaGruppi.setItems(List.of());
		
		List<String> list = new ArrayList<>();
		do {
			req = new Request.Builder()
					.url(listaGruppi.getNext())
					.addHeader(HEADER_AUTHORIZATION, credentials)
					.get()
					.build();
			
			res = this.client.newCall(req).execute();
			
			if (!res.isSuccessful())
				throw new IOException("ottenuto codice di errore HTTP: " + res.code());
			
			responseBody = res.body();
			content = responseBody.string();
			
			listaGruppi = this.gson.fromJson(content, ListaGruppi.class);
			
			for (GruppoItem item : listaGruppi.getItems()) {
				if (item.getAzioni().stream().anyMatch(azioni::contains)) {
					azioni.removeAll(item.getAzioni());
					list.add(item.getNome());
				}
			}
			
		} while(listaGruppi.getNext() != null);
		
		if (!azioni.isEmpty())
			list.add("Predefinito");
		
		return list;
	}
	
	public String getNomeApiFromSingleApi(GruppoServizio api) throws IOException {
		HttpUrl url = this.getUrlConfigurazioneServizio(api)
				.addPathSegment("api")
				.build();
		
		Request req = new Request.Builder()
				.url(url)
				.addHeader(HEADER_AUTHORIZATION, this.credentials)
				.get()
				.build();
		
		
		Response res = this.client.newCall(req).execute();
		if (!res.isSuccessful())
			throw new IOException("errore impossibile ottenere api dall'erogazione, code = " + res.code());
		
		ResponseBody responseBody = res.body();
		String content = responseBody.string();
		
		
		ErogazioneApiImplementata erogazioneApi = this.gson.fromJson(content, ErogazioneApiImplementata.class);
		
		return erogazioneApi.getApiNome();
		
	}
	
	public Applicativo getServizioApplicativo(String nome, String profilo) throws IOException {
		
		HttpUrl url = this.baseUrl.newBuilder()
				.addPathSegment("applicativi")
				.addPathSegment(nome)
				.addQueryParameter(QUERY_PROFILO, profilo)
				.build();
		
		Request req = new Request.Builder()
				.url(url)
				.addHeader(HEADER_AUTHORIZATION, this.credentials)
				.get()
				.build();
		
		Response res = this.client.newCall(req).execute();
		if (!res.isSuccessful())
			throw new IOException("errore nell'ottenere applicativo con nome = " + nome + ", code = " + res.code());
		
		ResponseBody responseBody = res.body();
		String content = responseBody.string();
		
		
		return this.gson.fromJson(content, Applicativo.class);
	}
	
	public Response postCredenzialiSoggetto(DTOSoggetto soggetto, Credenziali credenziali) throws TemplateNotFoundException, MalformedTemplateNameException, ParseException, TemplateException, IOException {
		HttpUrl url = this.baseUrl.newBuilder()
				.addPathSegment("soggetti")
				.addPathSegment(soggetto.getNomeGateway())
				.addPathSegment("credenziali")
				.addQueryParameter(QUERY_PROFILO, soggetto.getTipoGateway())
				.build();
		
		Request req = new Request.Builder()
				.url(url)
				.addHeader(HEADER_AUTHORIZATION, this.credentials)
				.put(templateToRequestBody(JSON, this.template.getTemplate(PATH_TEMPLATE_CREDENZIALI), credenziali))
				.build();
		
		return this.client.newCall(req).execute();
	}
	
	public Response postSoggettoAutorizzato(GruppoServizio gruppoServizio, String soggetto) throws TemplateException, IOException {
		HttpUrl url = this.getUrlConfigurazioneServizio(gruppoServizio)
				.addPathSegment("configurazioni")
				.addPathSegment("controllo-accessi")
				.addQueryParameter(QUERY_GRUPPO, gruppoServizio.getGruppo())
				.addPathSegment("autorizzazione")
				.addPathSegment("soggetti")
				.build();
		
		Map<String, String> root = new HashMap<>();
		root.put("soggetto", soggetto);
		
		Request request = new Request.Builder()
		        .url(url)
		        .addHeader(HEADER_AUTHORIZATION, this.credentials)
		        .post(templateToRequestBody(JSON, this.template.getTemplate(PATH_TEMPLATE_SOGGETTO_AUTORIZZATO), root))
		        .build();
				
		return this.client.newCall(request).execute();
	}	
	
}
