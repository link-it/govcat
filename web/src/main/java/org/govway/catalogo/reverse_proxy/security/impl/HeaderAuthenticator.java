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

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.govway.catalogo.reverse_proxy.config.WebConsoleConfig;
import org.govway.catalogo.reverse_proxy.costanti.Costanti;
import org.govway.catalogo.reverse_proxy.security.AuthorizationInfo;
import org.govway.catalogo.reverse_proxy.security.ReverseProxyAuthenticationDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HeaderAuthenticator implements AuthorizationInfo {

	private Logger log = LoggerFactory.getLogger(HeaderAuthenticator.class);

	private WebConsoleConfig config;
	
	@Override
	public void setConfig(WebConsoleConfig config) {
		this.config = config;
	}
	
	@Override
	public Object getPrincipalFromRequest(HttpServletRequest request) {
		String headerAuthenticationGovWayCatalogoAPI = this.config.getHeaderAuthenticationGovWayCatalogoAPI();
		
		this.log.debug("Lettura Principal dall'header [{}] in corso...", headerAuthenticationGovWayCatalogoAPI);
		
		String header = request.getHeader(headerAuthenticationGovWayCatalogoAPI);
		
		if(header != null) {
			this.log.debug("Lettura Principal dall'header [{}] completata, trovato valore [{}].", headerAuthenticationGovWayCatalogoAPI, header);	
		} else {
			
			if(this.config.isHeaderAuthenticationAutorizzaRichiesteAnonimeGovWayCatalogoAPI()) {
				this.log.debug("Lettura Principal dall'header [{}] completata, non e' stato trovato un valore, accesso consentito con utenza [{}].", headerAuthenticationGovWayCatalogoAPI, Costanti.PRINCIPAL_UTENZA_ANONIMA);
				return Costanti.PRINCIPAL_UTENZA_ANONIMA;
			} else {
				this.log.debug("Lettura Principal dall'header [{}] completata, non e' stato trovato un valore. Accesso negato.", headerAuthenticationGovWayCatalogoAPI);	
			}
		}
		
		return header;
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
