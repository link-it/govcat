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
package org.govway.catalogo.reverse_proxy.filters;

import javax.servlet.Filter;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;

import org.govway.catalogo.reverse_proxy.costanti.Costanti;
import org.springframework.stereotype.Component;

/**
 * Servlet Filter implementation class ProxyFilter
 */
@Component
public class MonitorProxyFilter extends ProxyFilter {
	
	private String urlPrefix;
	
	/**
	 * @see Filter#init(FilterConfig)
	 */
	@Override
	public void init(FilterConfig fConfig) throws ServletException {
		super.init(fConfig);
		this.urlPrefix = fConfig.getInitParameter(Costanti.URL_PREFIX);
	}
	
	@Override
	public String getUrlPrefix() {
		return this.urlPrefix;
	}
}
