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

	private String serverUrl;

	/** URL di invocazione aggiuntive dell'API, oltre a quella principale. */
	private List<UrlInvocazioneRisolta> serverUrlAggiuntive = new ArrayList<>();

	public String getServerUrl() {
		return serverUrl;
	}

	public void setServerUrl(String serverUrl) {
		this.serverUrl = serverUrl;
	}

	public List<UrlInvocazioneRisolta> getServerUrlAggiuntive() {
		return serverUrlAggiuntive;
	}

	public void setServerUrlAggiuntive(List<UrlInvocazioneRisolta> serverUrlAggiuntive) {
		this.serverUrlAggiuntive = serverUrlAggiuntive != null ? serverUrlAggiuntive : new ArrayList<>();
	}

	/** URL da dichiarare nella specifica: la principale in prima posizione, poi le aggiuntive. */
	public List<UrlInvocazioneRisolta> getServerUrls() {
		List<UrlInvocazioneRisolta> urls = new ArrayList<>();
		urls.add(new UrlInvocazioneRisolta(null, this.serverUrl));
		urls.addAll(this.serverUrlAggiuntive);
		return urls;
	}
}
