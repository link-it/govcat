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
package org.govway.catalogo.controllers.csv;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

@JsonPropertyOrder
public abstract class ServizioFormat {

	@JsonProperty("Erogatore")
	abstract String getErogatore();
	@JsonProperty("Servizio")
	abstract String getServizio();
	@JsonProperty("Tipo API")
	abstract String getTipoApi();
	@JsonProperty("Aderente")
	abstract String getAderente();
	@JsonProperty("Id Adesione")
	abstract String getIdAdesione();
	@JsonProperty("Stato")
	abstract String getStato();
	@JsonProperty("API")
	abstract String getImplementazioneAPI();
	@JsonProperty("Azione/Risorsa")
	abstract String getAzioneRisorsa();
	@JsonProperty("URL Invocazione (Collaudo)")
	abstract String getUrlInvocazioneCollaudo();
	@JsonProperty("URL Invocazione (Produzione)")
	abstract String getUrlInvocazioneProduzione();
	@JsonProperty("Autenticazione (Stato)")
	abstract String getAutenticazioneStato();
	@JsonProperty("Autenticazione Valore (Collaudo)")
	abstract String getAutenticazioneValoreCollaudo();
	@JsonProperty("Autenticazione Valore (Produzione)")
	abstract String getAutenticazioneValoreProduzione();
	@JsonProperty("Autenticazione (Applicativi Autorizzati Collaudo)")
	abstract String getApplicativiAutorizzatiCollaudo();
	@JsonProperty("Rate Limiting (Collaudo)")
	abstract String getRateLimitingCollaudo();
	@JsonProperty("Proprietà (Collaudo)")
	abstract String getProprietaCollaudo();
	@JsonProperty("Autenticazione (Applicativi Autorizzati Produzione)")
	abstract String getApplicativiAutorizzatiProduzione();
	@JsonProperty("Rate Limiting (Produzione)")
	abstract String getRateLimitingProduzione();
	@JsonProperty("Proprietà (Produzione)")
	abstract String getProprietaProduzione();
	@JsonProperty("Connettore (Collaudo)")
	abstract String getConnettoreCollaudo();
	@JsonProperty("Connettore (Produzione)")
	abstract String getConnettoreProduzione();
	@JsonProperty("Referente Regionale Adesione")
	abstract String getReferenteRegionaleAdesione();
	@JsonProperty("Referente Tecnico Adesione")
	abstract String getReferenteTecnicoAdesione();

}
