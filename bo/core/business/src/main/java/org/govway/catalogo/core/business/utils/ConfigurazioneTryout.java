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
package org.govway.catalogo.core.business.utils;

import java.util.ArrayList;
import java.util.List;

public class ConfigurazioneTryout {

	/** URL da dichiarare nella specifica, nell'ordine: la prima e` quella mostrata per prima. */
	private List<UrlInvocazioneRisolta> serverUrls = new ArrayList<>();

	public List<UrlInvocazioneRisolta> getServerUrls() {
		return serverUrls;
	}

	public void setServerUrls(List<UrlInvocazioneRisolta> serverUrls) {
		this.serverUrls = serverUrls != null ? serverUrls : new ArrayList<>();
	}

	/** Imposta una sola URL, quella predefinita e senza etichetta. */
	public void setServerUrl(String serverUrl) {
		this.serverUrls = new ArrayList<>(List.of(
				new UrlInvocazioneRisolta(EServiceBuilder.ID_URL_INVOCAZIONE_DEFAULT, null, serverUrl)));
	}
}
