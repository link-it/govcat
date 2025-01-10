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
package org.govway.catalogo.reverse_proxy.config;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.PostConstruct;

import org.govway.catalogo.reverse_proxy.beans.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix="org.govway.catalogo.reverse-proxy.headers-da-aggiungere", ignoreInvalidFields = true, ignoreUnknownFields = true)
public class HeadersDaAggiungere {
	
	private static Logger log = LoggerFactory.getLogger(HeadersDaAggiungere.class);

	private List<Pair> headers = new ArrayList<>();

	public List<Pair> getHeaders() {
		return this.headers;
	}
	
	public void setHeaders(List<Pair> headers) {
		this.headers = headers;
	}
	
	@PostConstruct
	public void init() {
		this.logProperties();
	}
	
	public void logProperties() {
		log.info(" ****** Headers da Aggiungere ******* ");
		
		if(this.headers != null && !this.headers.isEmpty()) {
			for (Pair pair : headers) {
				log.info("[{}] -> [{}]", pair.getNome(), pair.getValore());
			}
		}
		
		log.info(" ****** Fine Headers da Aggiungere ******* ");
	}
}
