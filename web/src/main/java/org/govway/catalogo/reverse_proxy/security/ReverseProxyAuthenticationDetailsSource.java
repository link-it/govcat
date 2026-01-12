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
package org.govway.catalogo.reverse_proxy.security;

import javax.servlet.http.HttpServletRequest;

import org.govway.catalogo.reverse_proxy.config.WebConsoleConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationDetailsSource;
import org.springframework.security.web.authentication.WebAuthenticationDetails;

public class ReverseProxyAuthenticationDetailsSource implements AuthenticationDetailsSource<HttpServletRequest, WebAuthenticationDetails>{

	private Logger log = LoggerFactory.getLogger(ReverseProxyAuthenticationDetailsSource.class);
	
	private WebConsoleConfig config;
	
	public ReverseProxyAuthenticationDetailsSource(WebConsoleConfig config) {
		this.config = config;
	}
	
	@Override
	public WebAuthenticationDetails buildDetails(HttpServletRequest context) {
		AuthorizationInfo authorizationInfo = this.config.getAuthorizationInfo();
		
		log.debug("Lettura utenza in corso...");
		
		WebAuthenticationDetails webAuthenticationDetails = authorizationInfo.buildDetails(context);
		
		log.debug("Lettura utenza in completata, trovata [{}]...", webAuthenticationDetails);
		
		return webAuthenticationDetails;
	}

}
