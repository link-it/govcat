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
package org.govway.catalogo.reverse_proxy.security.impl;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang.StringUtils;
import org.govway.catalogo.reverse_proxy.config.WebConsoleConfig;
import org.govway.catalogo.reverse_proxy.security.AuthorizationInfo;
import org.govway.catalogo.reverse_proxy.security.ReverseProxyAuthenticationDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

public class JBossSecurityConstraintAuthenticator implements AuthorizationInfo {

	private Logger log = LoggerFactory.getLogger(JBossSecurityConstraintAuthenticator.class);

	private WebConsoleConfig config;
	
	@Override
	public void setConfig(WebConsoleConfig config) {
		this.config = config;
	}
	
	private byte[] decode(byte[] base64Token) {
		try {
			return Base64.getDecoder().decode(base64Token);
		}
		catch (IllegalArgumentException ex) {
			throw new BadCredentialsException("Failed to decode basic authentication token");
		}
	}
	
	public static final String AUTHENTICATION_SCHEME_BASIC = "Basic";
	 
	
	@Override
	public Object getPrincipalFromRequest(HttpServletRequest request) {
		String header = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (header == null) {
			return null;
		}
		header = header.trim();
		if (!StringUtils.startsWithIgnoreCase(header, AUTHENTICATION_SCHEME_BASIC)) {
			return null;
		}
		if (header.equalsIgnoreCase(AUTHENTICATION_SCHEME_BASIC)) {
			throw new BadCredentialsException("Empty basic authentication token");
		}
		byte[] base64Token = header.substring(6).getBytes(StandardCharsets.UTF_8);
		byte[] decoded = decode(base64Token);
		String token = new String(decoded, StandardCharsets.UTF_8);
		int delim = token.indexOf(":");
		if (delim == -1) {
			throw new BadCredentialsException("Invalid basic authentication token");
		}
		UsernamePasswordAuthenticationToken result = UsernamePasswordAuthenticationToken
			.unauthenticated(token.substring(0, delim), token.substring(delim + 1));
		return (String) result.getPrincipal();
	}
	
	@Override
	public ReverseProxyAuthenticationDetails buildDetails(HttpServletRequest request) {
		ReverseProxyAuthenticationDetails authenticationDetails = new ReverseProxyAuthenticationDetails(log, request, config);
		
		Map<String, String> headerValuesFromRequest = new HashMap<>();
		
		// In questa fase si deve inserire eventuali informazioni estratte dalla request all'interno degli header previsti per il catalogo
		
//		if(StringUtils.isNotBlank(amUser.getcodiceFiscale())) {
//			log.debug(MSG_SALVATAGGIO_HEADER_VALORE, webConsoleConfig.getNomeHeaderCfGovWayCatalogoAPI() ,amUser.getcodiceFiscale());
//			headerValuesFromAMUser.put(webConsoleConfig.getNomeHeaderCfGovWayCatalogoAPI(), amUser.getcodiceFiscale()); 
//		}
		
		authenticationDetails.setHeaderValues(headerValuesFromRequest);
		
		return authenticationDetails;
	}
}
