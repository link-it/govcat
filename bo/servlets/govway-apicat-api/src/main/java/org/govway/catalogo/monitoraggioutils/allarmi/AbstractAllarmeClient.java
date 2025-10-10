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

import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.apache.commons.io.IOUtils;
import org.apache.http.HttpEntity;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.monitoraggioutils.ConfigurazioneConnessione;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class AbstractAllarmeClient {

	
	protected Logger logger = LoggerFactory.getLogger(AbstractAllarmeClient.class);

	private String idAllarme;
	public AbstractAllarmeClient(String idAllarme) {
		this.idAllarme = idAllarme;
	}
	
	public List<AllarmeResponse> getAllarmeList(ConfigurazioneConnessione connessione) {
		return getAllarmeList(connessione, null);
	}
	
	public List<AllarmeResponse> getAllarmeList(ConfigurazioneConnessione connessione, Boolean warning) {

		List<String> lsts = getAllarmeViaHTTP(connessione, idAllarme);
		
		List<AllarmeResponse> parseAllarmeList = parseAllarmeList(lsts);
		
		return parseAllarmeList.stream().filter(r-> warning == null || r.isWarning() == warning).collect(Collectors.toList());
	}
	
	public Optional<AllarmeResponse> getAllarme(ConfigurazioneConnessione connessione, String key, Boolean warning) {
		
		
		List<String> lsts = getAllarmeViaHTTP(connessione, idAllarme);
		
		List<AllarmeResponse> lst= parseAllarmeList(lsts);
		
		Optional<AllarmeResponse> o = lst.stream().filter(r -> r.getIdentificativo().equals(key) && (warning == null || r.isWarning() == warning)).findAny();
		if(o.isPresent()) {
			return o;
		}
		
		return Optional.empty();
	}

	protected List<AllarmeResponse> parseAllarmeList(List<String> lsts) {
		List<AllarmeResponse> lst = new ArrayList<>();
		int index = findSeparatorWarning(lsts);
		
		if(index >= 0) {
			lst.addAll(parse(lsts, 0, index, false));
			lst.addAll(parse(lsts, index+1, lsts.size(), true));
		} else {
			lst.addAll(parse(lsts, 0, lsts.size(), false));
		}
		
		return lst;
	}
	
	
	private int findSeparatorWarning(List<String> lsts) {
		for(int i = 0; i < lsts.size(); i++) {
			String lst = lsts.get(i);
			if(lst.contains("Identificati certificati che necessitano di un aggiornamento:")) {
				return i;
			}
		}
		
		return -1;
	}

	private List<AllarmeResponse> parse(List<String> lst, int begin, int end, boolean warning) {
		List<Integer> lstSeparators = new ArrayList<>();
		
		for(int i = begin; i < end; i++) {
			if(lst.get(i).equals("================================")) {
				lstSeparators.add(i);
			}
		}
		
		lstSeparators.add(end);
		
		List<AllarmeResponse> response = new ArrayList<>();
		
		for(int i = 0; i < lstSeparators.size() -1; i++) {
			int index = lstSeparators.get(i);
			int indexNext = lstSeparators.get(i+1);
			AllarmeResponse allarmeResponse = new AllarmeResponse();
			String identificativoRaw = lst.get(index+1);
			allarmeResponse.setIdentificativo(parseIdentificativo(identificativoRaw));
			allarmeResponse.setDettaglio(getDettaglio(lst, index, indexNext));
			allarmeResponse.setWarning(warning);

			addInfo(identificativoRaw, allarmeResponse);
			
			response.add(allarmeResponse);
		}

		return response;
		
	}


	protected abstract void addInfo(String identificativoRaw, AllarmeResponse allarmeResponse);
	protected abstract String parseIdentificativo(String identificativoRaw);

	private String getDettaglio(List<String> lst, Integer index, int nextIndex) {
		StringBuilder dettaglio = new StringBuilder();
		
		for(int i = index + 2; i < nextIndex; i++) {
			if(lst.get(i).trim().length() > 0) {
				if(dettaglio.length() > 0) {
					dettaglio.append("\n");
				}
				dettaglio.append(lst.get(i));
			}
		}
		
		return dettaglio.toString();
	}


	private List<String> getAllarmeViaHTTP(ConfigurazioneConnessione connessione, String idAllarme) {
		
		try {
	        CredentialsProvider provider = new BasicCredentialsProvider();
	        provider.setCredentials(
	                AuthScope.ANY,
	                new UsernamePasswordCredentials(connessione.getUsername(), connessione.getPassword())
	        );

	        CloseableHttpClient httpClient = HttpClientBuilder.create()
	                .setDefaultCredentialsProvider(provider)
	                .build();


			HttpGet request = new HttpGet(connessione.getUrl() + "/" + idAllarme);
	
			CloseableHttpResponse response = httpClient.execute(request);
	
			try {
	
				if(response.getStatusLine().getStatusCode() < 299) {
					return new ArrayList<>();
				} else if(response.getStatusLine().getStatusCode() == 500) {
					HttpEntity entity = response.getEntity();
					if (entity != null) {
						return IOUtils.readLines(entity.getContent(), Charset.defaultCharset());
					} else {
						throw new InternalException(ErrorCode.INT_502, Map.of("idAllarme", idAllarme));
					}
				} else {
					throw new InternalException(ErrorCode.INT_502, Map.of("idAllarme", idAllarme, "statusCode", String.valueOf(response.getStatusLine().getStatusCode())));
				}
	
			} finally {
				response.close();
				httpClient.close();
			}
		} catch(Exception e) {
			this.logger.error(e.getMessage(), e);
			throw new InternalException(ErrorCode.INT_500_COMMUNICATION, Map.of("idAllarme", idAllarme), e);
		}
	}
}
