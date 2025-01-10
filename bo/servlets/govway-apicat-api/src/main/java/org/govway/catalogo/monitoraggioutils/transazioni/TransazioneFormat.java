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
package org.govway.catalogo.monitoraggioutils.transazioni;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

@JsonPropertyOrder
public abstract class TransazioneFormat {

	@JsonProperty("Id Transazione")
	abstract String getIdTransazione();
	@JsonProperty("Profilo")
	abstract String getProfilo();
	@JsonProperty("Esito")
	abstract String getEsito();
	@JsonProperty("Contesto")
	abstract String getContesto();
	@JsonProperty("Metodo HTTP")
	abstract String getMetodoHTTP();
	@JsonProperty("Tipologia")
	abstract String getTipologia();
	@JsonProperty("Data Ingresso Richiesta In Ricezione")
	abstract String getDataIngressoRichiestaInRicezione();
	@JsonProperty("Data Uscita Richiesta In Ricezione")
	abstract String getDataUscitaRichiestaInSpedizione();
	@JsonProperty("Data Ingresso Risposta In Ricezione")
	abstract String getDataIngressoRispostaInRicezione();
	@JsonProperty("Data Uscita Risposta In Ricezione")
	abstract String getDataUscitaRispostaConsegnata();
	@JsonProperty("Tempo Risposta Servizio")
	abstract String getTempoRispostaServizio();
	@JsonProperty("Latenza Totale")
	abstract String getLatenzaTotale();
	@JsonProperty("Codice Risposta Ingresso")
	abstract String getCodiceRispostaIngresso();
	@JsonProperty("Codice Risposta Uscita")
	abstract String getCodiceRispostaUscita();
	@JsonProperty("Fruitore(Soggetto)")
	abstract String getSoggettoFruitore();
	@JsonProperty("Erogatore(Soggetto)")
	abstract String getSoggettoErogatore();
	@JsonProperty("Tipo API")
	abstract String getTipoAPI();
	@JsonProperty("Tags")
	abstract String getTags();
	@JsonProperty("API")
	abstract String getApi();
	@JsonProperty("Azione")
	abstract String getAzione();
	@JsonProperty("Id Applicativo Richiesta")
	abstract String getIdApplicativoRichiesta();
	@JsonProperty("Id Applicativo Risposta")
	abstract String getIdApplicativoRisposta();
	@JsonProperty("Applicativo Fruitore")
	abstract String getApplicativoFruitore();
	@JsonProperty("Credenziali")
	abstract String getCredenziali();
	@JsonProperty("Indirizzo Client")
	abstract String getIndirizzoClient();
	@JsonProperty("X-Forwarded-For")
	abstract String getxForwardedFor();
	@JsonProperty("Richiedente")
	abstract String getRichiedente();
	@JsonProperty("Token Applicativo Client")
	abstract String getTokenApplicativoClient();
	@JsonProperty("Token Applicativo Client (Soggetto)")
	abstract String getSoggettoTokenApplicativoClient();

}
