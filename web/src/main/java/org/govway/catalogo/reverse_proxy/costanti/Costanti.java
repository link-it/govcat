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
package org.govway.catalogo.reverse_proxy.costanti;

import java.util.AbstractMap;
import java.util.Map;

import org.govway.catalogo.reverse_proxy.servlets.ProxyServletApi;
import org.govway.catalogo.reverse_proxy.servlets.ProxyServletMonitor;
import org.govway.catalogo.reverse_proxy.servlets.ProxyServletPdnd;
import org.springframework.http.HttpStatus;

public class Costanti {
	
	private Costanti () {}
	
	public static final String INIT_PARAMETER_MAX_THREADS_VALUE_15 = "15";
	public static final String INIT_PARAMETER_MAX_THREADS = "maxThreads";
	public static final String INIT_PARAMETER_PREFIX = "prefix";
	public static final String INIT_PARAMETER_PROXY_TO = "proxyTo";
	
	public static final String PROXY_API_FILTER_NAME = "proxyFilterApi";
	public static final String PROXY_API_PREFIX = ProxyServletApi.PROXY_API_PREFIX;
	public static final String PROXY_API_URL_PATTERN = Costanti.PROXY_API_PREFIX + "/*";
	
	public static final String PROXY_PDND_FILTER_NAME = "proxyFilterAPdnd";
	public static final String PROXY_PDND_PREFIX = ProxyServletPdnd.PROXY_PDND_PREFIX;
	public static final String PROXY_PDND_URL_PATTERN = Costanti.PROXY_PDND_PREFIX + "/*";
	
	public static final String PROXY_MONITOR_FILTER_NAME = "proxyFilterMonitor";
	public static final String PROXY_MONITOR_PREFIX = ProxyServletMonitor.PROXY_MONITOR_PREFIX;
	public static final String PROXY_MONITOR_URL_PATTERN = Costanti.PROXY_MONITOR_PREFIX + "/*";
	
	public static final Map<HttpStatus, String> problemTypes = Map.ofEntries(
			new AbstractMap.SimpleEntry<HttpStatus, String>(HttpStatus.CONFLICT,  "https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict"),
			new AbstractMap.SimpleEntry<HttpStatus, String>(HttpStatus.NOT_FOUND, "https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found"),
			new AbstractMap.SimpleEntry<HttpStatus, String>(HttpStatus.BAD_REQUEST,"https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request"),
			new AbstractMap.SimpleEntry<HttpStatus, String>(HttpStatus.UNPROCESSABLE_ENTITY,"https://www.rfc-editor.org/rfc/rfc9110.html#name-422-unprocessable-content"),
			new AbstractMap.SimpleEntry<HttpStatus, String>(HttpStatus.INTERNAL_SERVER_ERROR, "https://www.rfc-editor.org/rfc/rfc9110.html#name-500-internal-server-error"),
			new AbstractMap.SimpleEntry<HttpStatus, String>(HttpStatus.OK, "https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok"),
			new AbstractMap.SimpleEntry<HttpStatus, String>(HttpStatus.UNAUTHORIZED, "https://www.rfc-editor.org/rfc/rfc9110.html#name-401-unauthorized"),
			new AbstractMap.SimpleEntry<HttpStatus, String>(HttpStatus.FORBIDDEN, "https://www.rfc-editor.org/rfc/rfc9110.html#name-403-forbidden"),
			new AbstractMap.SimpleEntry<HttpStatus, String>(HttpStatus.NOT_ACCEPTABLE, "https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable"),
			new AbstractMap.SimpleEntry<HttpStatus, String>(HttpStatus.BAD_GATEWAY, "https://www.rfc-editor.org/rfc/rfc9110.html#name-502-bad-gateway"),
			new AbstractMap.SimpleEntry<HttpStatus, String>(HttpStatus.SERVICE_UNAVAILABLE, "https://www.rfc-editor.org/rfc/rfc9110.html#name-503-service-unavailable"),
			new AbstractMap.SimpleEntry<HttpStatus, String>(HttpStatus.TOO_MANY_REQUESTS, "https://www.rfc-editor.org/rfc/rfc6585#section-4")
		);
	
	public static final String MSG_E_STATO_TROVATO_NELLE_REQUEST_UN_HEADER_DI_NOME_0_ACCESSO_NEGATO = "E'' stato trovato nelle request un header di nome ''{0}'', accesso negato.";
	public static final String HEADER_AUTHORIZATION = "Authorization";
	public static final String HEADER_AUTHORIZATION_VALUE_PREFIX = "Bearer ";
	public static final String URL_PREFIX = "URL_PREFIX";
	public static final String MSG_SALVATAGGIO_HEADER_VALORE = "Salvataggio Header: [{}] Valore [{}]";

	public static final String PRINCIPAL_UTENZA_ANONIMA = "Anonimo";
}
