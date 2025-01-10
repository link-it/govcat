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

public class Transazione {
	private String idTransazione;
	private String profilo;
	private String esito;
	private String contesto;
	private String metodoHTTP;
	private String tipologia;
	private String dataIngressoRichiestaInRicezione;
	private String dataUscitaRichiestaInSpedizione;
	private String dataIngressoRispostaInRicezione;
	private String dataUscitaRispostaConsegnata;
	private String tempoRispostaServizio;
	private String latenzaTotale;
	private String codiceRispostaIngresso;
	private String codiceRispostaUscita;
	private String soggettoFruitore;
	private String soggettoErogatore;
	private String tipoAPI;
	private String tags;
	private String api;
	private String azione;
	private String idApplicativoRichiesta;
	private String idApplicativoRisposta;
	private String applicativoFruitore;
	private String credenziali;
	private String indirizzoClient;
	private String xForwardedFor;
	private String richiedente;
	private String tokenApplicativoClient;
	private String soggettoTokenApplicativoClient;
	public String getIdTransazione() {
		return idTransazione;
	}
	public void setIdTransazione(String idTransazione) {
		this.idTransazione = idTransazione;
	}
	public String getProfilo() {
		return profilo;
	}
	public void setProfilo(String profilo) {
		this.profilo = profilo;
	}
	public String getEsito() {
		return esito;
	}
	public void setEsito(String esito) {
		this.esito = esito;
	}
	public String getContesto() {
		return contesto;
	}
	public void setContesto(String contesto) {
		this.contesto = contesto;
	}
	public String getMetodoHTTP() {
		return metodoHTTP;
	}
	public void setMetodoHTTP(String metodoHTTP) {
		this.metodoHTTP = metodoHTTP;
	}
	public String getTipologia() {
		return tipologia;
	}
	public void setTipologia(String tipologia) {
		this.tipologia = tipologia;
	}
	public String getDataIngressoRichiestaInRicezione() {
		return dataIngressoRichiestaInRicezione;
	}
	public void setDataIngressoRichiestaInRicezione(String dataIngressoRichiestaInRicezione) {
		this.dataIngressoRichiestaInRicezione = dataIngressoRichiestaInRicezione;
	}
	public String getDataUscitaRichiestaInSpedizione() {
		return dataUscitaRichiestaInSpedizione;
	}
	public void setDataUscitaRichiestaInSpedizione(String dataUscitaRichiestaInSpedizione) {
		this.dataUscitaRichiestaInSpedizione = dataUscitaRichiestaInSpedizione;
	}
	public String getDataIngressoRispostaInRicezione() {
		return dataIngressoRispostaInRicezione;
	}
	public void setDataIngressoRispostaInRicezione(String dataIngressoRispostaInRicezione) {
		this.dataIngressoRispostaInRicezione = dataIngressoRispostaInRicezione;
	}
	public String getDataUscitaRispostaConsegnata() {
		return dataUscitaRispostaConsegnata;
	}
	public void setDataUscitaRispostaConsegnata(String dataUscitaRispostaConsegnata) {
		this.dataUscitaRispostaConsegnata = dataUscitaRispostaConsegnata;
	}
	public String getTempoRispostaServizio() {
		return tempoRispostaServizio;
	}
	public void setTempoRispostaServizio(String tempoRispostaServizio) {
		this.tempoRispostaServizio = tempoRispostaServizio;
	}
	public String getLatenzaTotale() {
		return latenzaTotale;
	}
	public void setLatenzaTotale(String latenzaTotale) {
		this.latenzaTotale = latenzaTotale;
	}
	public String getCodiceRispostaIngresso() {
		return codiceRispostaIngresso;
	}
	public void setCodiceRispostaIngresso(String codiceRispostaIngresso) {
		this.codiceRispostaIngresso = codiceRispostaIngresso;
	}
	public String getCodiceRispostaUscita() {
		return codiceRispostaUscita;
	}
	public void setCodiceRispostaUscita(String codiceRispostaUscita) {
		this.codiceRispostaUscita = codiceRispostaUscita;
	}
	public String getSoggettoFruitore() {
		return soggettoFruitore;
	}
	public void setSoggettoFruitore(String soggettoFruitore) {
		this.soggettoFruitore = soggettoFruitore;
	}
	public String getSoggettoErogatore() {
		return soggettoErogatore;
	}
	public void setSoggettoErogatore(String soggettoErogatore) {
		this.soggettoErogatore = soggettoErogatore;
	}
	public String getTipoAPI() {
		return tipoAPI;
	}
	public void setTipoAPI(String tipoAPI) {
		this.tipoAPI = tipoAPI;
	}
	public String getTags() {
		return tags;
	}
	public void setTags(String tags) {
		this.tags = tags;
	}
	public String getApi() {
		return api;
	}
	public void setApi(String api) {
		this.api = api;
	}
	public String getAzione() {
		return azione;
	}
	public void setAzione(String azione) {
		this.azione = azione;
	}
	public String getIdApplicativoRichiesta() {
		return idApplicativoRichiesta;
	}
	public void setIdApplicativoRichiesta(String idApplicativoRichiesta) {
		this.idApplicativoRichiesta = idApplicativoRichiesta;
	}
	public String getIdApplicativoRisposta() {
		return idApplicativoRisposta;
	}
	public void setIdApplicativoRisposta(String idApplicativoRisposta) {
		this.idApplicativoRisposta = idApplicativoRisposta;
	}
	public String getApplicativoFruitore() {
		return applicativoFruitore;
	}
	public void setApplicativoFruitore(String applicativoFruitore) {
		this.applicativoFruitore = applicativoFruitore;
	}
	public String getCredenziali() {
		return credenziali;
	}
	public void setCredenziali(String credenziali) {
		this.credenziali = credenziali;
	}
	public String getIndirizzoClient() {
		return indirizzoClient;
	}
	public void setIndirizzoClient(String indirizzoClient) {
		this.indirizzoClient = indirizzoClient;
	}
	public String getxForwardedFor() {
		return xForwardedFor;
	}
	public void setxForwardedFor(String xForwardedFor) {
		this.xForwardedFor = xForwardedFor;
	}
	public String getRichiedente() {
		return richiedente;
	}
	public void setRichiedente(String richiedente) {
		this.richiedente = richiedente;
	}
	public String getTokenApplicativoClient() {
		return tokenApplicativoClient;
	}
	public void setTokenApplicativoClient(String tokenApplicativoClient) {
		this.tokenApplicativoClient = tokenApplicativoClient;
	}
	public String getSoggettoTokenApplicativoClient() {
		return soggettoTokenApplicativoClient;
	}
	public void setSoggettoTokenApplicativoClient(String soggettoTokenApplicativoClient) {
		this.soggettoTokenApplicativoClient = soggettoTokenApplicativoClient;
	}
}
