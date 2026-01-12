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

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.govway.catalogo.reverse_proxy.config.WebConsoleConfig;
import org.slf4j.Logger;
import org.springframework.security.web.authentication.WebAuthenticationDetails;

public class ReverseProxyAuthenticationDetails extends WebAuthenticationDetails{

	private static final long serialVersionUID = 1L;
	
	private Map<String, String> headerValues = new HashMap<>();
	
	public ReverseProxyAuthenticationDetails(Logger log, HttpServletRequest request, WebConsoleConfig webConsoleConfig) {
		super(request);
	}
	
	public void setHeaderValues(Map<String, String> headerValues) {
		this.headerValues = headerValues;
	}
	
	public Map<String, String> getHeaderValues() {
		return headerValues;
	}

	@Override
	public boolean equals(Object obj) {
		return super.equals(obj);
	}
	
	@Override
	public int hashCode() {
		return super.hashCode();
	}
}
