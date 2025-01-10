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
package org.govway.catalogo.reverse_proxy.security;

import javax.servlet.http.HttpServletRequest;

import org.govway.catalogo.reverse_proxy.config.WebConsoleConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.web.authentication.preauth.RequestHeaderAuthenticationFilter;

public class AuthorizationFilter extends RequestHeaderAuthenticationFilter{
	
	private Logger log = LoggerFactory.getLogger(AuthorizationFilter.class);
	
	private WebConsoleConfig config;
	
	@Override
	protected Object getPreAuthenticatedPrincipal(HttpServletRequest request) {
		
		AuthorizationInfo authorizationInfo = this.config.getAuthorizationInfo();
		
		log.debug("Lettura utenza in corso...");
		
		Object principalFromRequest = authorizationInfo.getPrincipalFromRequest(request);
		
		log.debug("Lettura utenza in completata, trovata [{}]...", principalFromRequest);
		
		return principalFromRequest;
	}

	public void setConfig(WebConsoleConfig config) {
		this.config = config;
	}

}

