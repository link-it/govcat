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
package org.govway.catalogo.reverse_proxy.filters;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.text.MessageFormat;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Collectors;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang.StringUtils;
import org.govway.catalogo.reverse_proxy.beans.Pair;
import org.govway.catalogo.reverse_proxy.config.HeadersDaAggiungere;
import org.govway.catalogo.reverse_proxy.config.WebConsoleConfig;
import org.govway.catalogo.reverse_proxy.costanti.Costanti;
import org.govway.catalogo.reverse_proxy.models.Problem;
import org.govway.catalogo.reverse_proxy.security.ReverseProxyUserDetails;
import org.govway.catalogo.reverse_proxy.utils.AntPathRequestMatcher;
import org.govway.catalogo.reverse_proxy.whitelist.Whitelist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;

public abstract class ProxyFilter implements Filter {

	private static Logger logger = LoggerFactory.getLogger(ProxyFilter.class);

	@Autowired
	protected WebConsoleConfig webConsoleConfig;
	
	@Autowired
	protected HeadersDaAggiungere headersDaAggiungere;

	public abstract String getUrlPrefix();
	
	/**
	 * Default constructor. 
	 */
	public ProxyFilter() {
		//donothing
	}

	/**
	 * @see Filter#destroy()
	 */
	@Override
	public void destroy() {
		//donothing
	}

	/**
	 * @see Filter#doFilter(ServletRequest, ServletResponse, FilterChain)
	 */
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
		HttpServletRequest req = (HttpServletRequest) request;
		HttpServletResponse res = (HttpServletResponse) response;
		Authentication a = SecurityContextHolder.getContext().getAuthentication();

		String utente = null;
		Map<String, String> headerValues = null;
		logger.debug("Ricevuta richiesta per la risorsa: [{}]", req.getRequestURI());

		if(a != null){

			if(a.getPrincipal() instanceof ReverseProxyUserDetails) {
				ReverseProxyUserDetails userDetails = (ReverseProxyUserDetails) a.getPrincipal();
				if(userDetails != null){
					utente = userDetails.getUsername();
					headerValues = userDetails.getAuthenticationDetails().getHeaderValues();
				}

			} else if(a.getPrincipal() instanceof UserDetails) {
				UserDetails userDetails = (UserDetails) a.getPrincipal();
				if(userDetails != null){
					utente = userDetails.getUsername();
				}
			}  
		}

		logger.debug("Utenza individuata: [{}]", utente);

		logger.debug("Base Path Servizio: [{}]", this.getUrlPrefix());

		// controllo black list
		logger.debug("Controllo autorizzazione sulla risorsa richiesta in corso...");

		Whitelist whitelist = webConsoleConfig.getWhitelist();
		if(whitelist != null) {
			HttpMethod httpMethod = HttpMethod.resolve(req.getMethod().toUpperCase());
			logger.debug("Controllo autorizzazione sulla risorsa richiesta, individuato HTTPMethod [{}].", httpMethod);

			List<String> listaPerHttpMethod = whitelist.getListaPerHttpMethod(httpMethod);

			logger.debug("Controllo autorizzazione sulla risorsa richiesta, path consentiti: [{}].", StringUtils.join(listaPerHttpMethod, ","));

			if(listaPerHttpMethod != null && !listaPerHttpMethod.isEmpty()) {
				// per ogni url definita per Method applico il matching e passano solo le url che sono indicate nelle proprieta'

				boolean autorizzato = false;
				for (String urlDaControllareHttpMethod : listaPerHttpMethod) {
					String urlDaControllare = this.getUrlPrefix() + urlDaControllareHttpMethod;
					logger.debug("Controllo autorizzazione sulla risorsa richiesta, HTTPMethod [{}], Pattern [{}].", httpMethod, urlDaControllare);

					AntPathRequestMatcher antPathRequestMatcher = new AntPathRequestMatcher(urlDaControllare, req.getMethod().toUpperCase());
					boolean doMatches = antPathRequestMatcher.doMatches(req);

					logger.debug("Controllo autorizzazione sulla risorsa richiesta, HTTPMethod [{}], Pattern [{}], concluso con esito [{}].", httpMethod, urlDaControllare, (doMatches ? "OK" : "KO"));
					if(doMatches) {
						// appena trovo una url valida esco dal ciclo di controllo
						autorizzato = true;
						break;
					}
				}

				if(!autorizzato) {
					// se la url non viene individuata tra quelle indicate nella white list blocco l'accesso
					this.setProblem(res);
					return;
				}
			} else {
				// se nella whitelist non vengono indicate url per l'HTTPMethod individuato blocco tutte le url 
				logger.debug("Controllo autorizzazione sulla risorsa richiesta completata, non e' stata trovata la whitelist delle URL consentite per HTTPMEthod [{}]: accesso negato.", httpMethod);
				this.setProblem(res);
				return;
			}
		} else {
			logger.debug("Controllo autorizzazione sulla risorsa richiesta completata, non e' stata trovata la whitelist delle URL consentite: accesso negato.");			
			// se la whitelist non viene caricata correttamente blocco tutto le url
			this.setProblem(res);
			return;
		}
		
		HeaderMapRequestWrapper requestWrapper = new HeaderMapRequestWrapper(req);

		logger.debug("Controllo autorizzazione set dell'header autorizzazione GovwayCatalogoAPI in corso...");

		// Aggiungo Header Autenticazione ApiCatalogo
		String headerAuthentication = webConsoleConfig.getHeaderAuthenticationGovWayCatalogoAPI();

		String headerAuth = req.getHeader(headerAuthentication);

		// se ricevo l'header di autorizzazione apiCatalogo devo bloccare la richiesta
		if(headerAuth != null && this.webConsoleConfig.getRestituisciErroreSeTrovoHeaderAutenticazione()) {
			this.setProblem(res, MessageFormat.format(Costanti.MSG_E_STATO_TROVATO_NELLE_REQUEST_UN_HEADER_DI_NOME_0_ACCESSO_NEGATO, headerAuthentication));
			logger.debug("Controllo autorizzazione set dell'header autorizzazione GovwayCatalogoAPI completato con errore, e' stato trovato un header di nome [{}], valore [{}].", headerAuthentication, headerAuth);
			return;
		}

		// propago l'header autenticazione solo se non presente
		if(headerAuth == null) {
			requestWrapper.addHeader(headerAuthentication, utente);
		}

		logger.debug("Controllo autorizzazione set dell'header autorizzazione GovwayCatalogoAPI completato.");

		logger.debug("Controllo autorizzazione set header aggiuntivi GovwayCatalogoAPI in corso...");

		// riporto eventuali header da inviare al servizio Govway Catalogo API 
		if(headerValues != null && headerValues.size() > 0) {
			for (Entry<String, String> entry : headerValues.entrySet()) {
				String headerName = entry.getKey();
				String headerValue = entry.getValue();

				String headerCheck = req.getHeader(headerName);

				// se ricevo un header previsto devo bloccare la richiesta
				if(headerCheck != null && this.webConsoleConfig.getRestituisciErroreSeTrovoHeaderAutenticazione()) {
					this.setProblem(res, MessageFormat.format(Costanti.MSG_E_STATO_TROVATO_NELLE_REQUEST_UN_HEADER_DI_NOME_0_ACCESSO_NEGATO, headerName));
					logger.debug("Controllo autorizzazione set dell'header aggiuntivi GovwayCatalogoAPI completato con errore, e' stato trovato un header di nome [{}], valore [{}].", headerName, headerCheck);
					return;
				}

				logger.debug("Imposto Header [{}], Valore [{}]", headerName, headerValue);
				requestWrapper.addHeader(headerName, headerValue);
			}
		}

		logger.debug("Controllo autorizzazione set header aggiuntivi GovwayCatalogoAPI completato.");


		logger.debug("Controllo autorizzazione set header aggiuntivi definiti nel file di properties in corso...");

		// aggiungo header
		if(headersDaAggiungere != null && headersDaAggiungere.getHeaders() != null) {
			for (Pair header : headersDaAggiungere.getHeaders()) {
				if(header != null && StringUtils.isNotBlank(header.getNome()) && StringUtils.isNotBlank(header.getValore())) {

					String headerCheck = req.getHeader(header.getNome());

					// se ricevo un header previsto devo bloccare la richiesta
					if(headerCheck != null && this.webConsoleConfig.getRestituisciErroreSeTrovoHeaderAutenticazione()) {
						this.setProblem(res, "E' stato trovato nelle request un header di nome '"+header.getNome()+"', accesso negato.");
						logger.debug("Controllo autorizzazione set dell'header aggiuntivi completato con errore, e' stato trovato un header di nome [{}], valore [{}].", header.getNome() ,headerCheck);
						return;
					}

					logger.debug("Imposto Header [{}], Valore [{}]", header.getNome(), header.getValore());
					requestWrapper.addHeader(header.getNome(), header.getValore());
				}
			}
		}

		logger.debug("Controllo autorizzazione set header aggiuntivi definiti nel file di properties completato.");

		chain.doFilter(requestWrapper, response);
	}

	/**
	 * @see Filter#init(FilterConfig)
	 */
	@Override
	public void init(FilterConfig fConfig) throws ServletException {
		//		this.urlPrefix = fConfig.getInitParameter(URL_PREFIX);
	}

	public class HeaderMapRequestWrapper extends HttpServletRequestWrapper {
		/**
		 * construct a wrapper for this request
		 * 
		 * @param request
		 */
		public HeaderMapRequestWrapper(HttpServletRequest request) {
			super(request);
		}

		private Map<String, String> headerMap = new HashMap<>();

		/**
		 * add a header with given name and value
		 * 
		 * @param name
		 * @param value
		 */
		public void addHeader(String name, String value) {
			headerMap.put(name, value);
		}

		@Override
		public String getHeader(String name) {
			String headerValue = super.getHeader(name);
			if (headerMap.containsKey(name)) {
				headerValue = headerMap.get(name);
			}
			return headerValue;
		}

		/**
		 * get the Header names
		 */
		@Override
		public Enumeration<String> getHeaderNames() {
			Set<String> names = Collections.list(super.getHeaderNames()).stream().collect(Collectors.toSet());
			for (String name : headerMap.keySet()) {
				names.add(name);
			}
			return Collections.enumeration(names);
		}

		@Override
		public Enumeration<String> getHeaders(String name) {
			Set<String> values = Collections.list(super.getHeaders(name)).stream().collect(Collectors.toSet());
			if (headerMap.containsKey(name)) {
				values.add(headerMap.get(name));
			}
			return Collections.enumeration(values);
		}
	}

	private void setProblem(HttpServletResponse response) throws IOException {
		this.setProblem(response, "La url richiesta non e' tra quelle consentite per l'utenza.");
	}

	private void setProblem(HttpServletResponse response, String detail) throws IOException {
		Problem problem = new Problem();
		problem.setStatus(HttpStatus.FORBIDDEN.value());
		problem.setTitle(HttpStatus.FORBIDDEN.getReasonPhrase());
		try {problem.setType(new URI(Costanti.problemTypes.get(HttpStatus.FORBIDDEN)));} catch (URISyntaxException e) {}
		problem.setDetail(detail);

		ObjectMapper om = new ObjectMapper();
		om.setPropertyNamingStrategy(PropertyNamingStrategies.LOWER_CAMEL_CASE);

		response.setStatus(HttpStatus.FORBIDDEN.value());
		om.writeValue(response.getOutputStream(), problem);
	}
}
