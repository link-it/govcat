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
package org.govway.catalogo.assembler;

import java.util.HashMap;
import java.util.Map;

import org.govway.catalogo.servlets.model.ItemOrganizzazione;
import org.govway.catalogo.servlets.model.ItemSoggetto;
import org.govway.catalogo.servlets.model.ItemSoggettoLimited;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;

/**
 * Cache di assemblaggio con ciclo di vita legato alla singola richiesta HTTP (@RequestScope).
 *
 * Soggetti e organizzazioni ricorrono moltissimo nelle liste (la stessa organizzazione e i suoi
 * soggetti compaiono in quasi ogni elemento): assemblarne il DTO una sola volta per id evita di
 * ricostruirlo (BeanUtils + navigazioni lazy) ad ogni occorrenza. Le mappe sono per-richiesta,
 * quindi nessun problema di concorrenza o di dati stantii tra richieste diverse.
 *
 * I DTO prodotti sono usati in sola lettura (serializzazione della response), quindi condividere
 * lo stesso riferimento tra piu` elementi e` sicuro.
 */
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class AssemblerRequestCache {

	private final Map<Long, ItemSoggetto> soggetti = new HashMap<>();
	private final Map<Long, ItemSoggettoLimited> soggettiLimited = new HashMap<>();
	private final Map<Long, ItemOrganizzazione> organizzazioni = new HashMap<>();

	public Map<Long, ItemSoggetto> getSoggetti() {
		return this.soggetti;
	}

	public Map<Long, ItemSoggettoLimited> getSoggettiLimited() {
		return this.soggettiLimited;
	}

	public Map<Long, ItemOrganizzazione> getOrganizzazioni() {
		return this.organizzazioni;
	}
}
