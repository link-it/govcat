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
package org.govway.catalogo.controllers.csv;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

@JsonPropertyOrder
public abstract class ServizioFormat {

	@JsonProperty("Soggetto Erogatore")
	abstract String getErogatore();
	@JsonProperty("Servizio")
	abstract String getServizio();
	@JsonProperty("API")
	abstract String getApi();
	@JsonProperty("Tipologia API")
	abstract String getTipoApi();
	@JsonProperty("Modalità Autenticazione")
	abstract String getAutenticazioneStato();
	@JsonProperty("Stato Servizio")
	abstract String getStatoServizio();
	@JsonProperty("URL Invocazione (Prod)")
	abstract String getUrlInvocazioneProduzione();
	@JsonProperty("Backend URL (Prod)")
	abstract String getConnettoreProduzione();
	@JsonProperty("URL Invocazione (Coll)")
	abstract String getUrlInvocazioneCollaudo();
	@JsonProperty("Backend URL (Coll)")
	abstract String getConnettoreCollaudo();

}
