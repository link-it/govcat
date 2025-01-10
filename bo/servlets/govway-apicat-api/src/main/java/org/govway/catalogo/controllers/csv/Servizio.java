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

public class Servizio {

	private String erogatore;
	private String servizio;
	private String tipoApi;
	private String aderente;
	private String idAdesione;
	private String implementazioneAPI;
	private String azioneRisorsa;
	private String urlInvocazioneCollaudo;
	private String urlInvocazioneProduzione;
	private String autenticazioneStato;
	private String autenticazioneValoreCollaudo;
	private String autenticazioneValoreProduzione;
	private String applicativiAutorizzatiCollaudo;
	private String rateLimitingCollaudo;
	private String proprietaCollaudo;
	private String applicativiAutorizzatiProduzione;
	private String rateLimitingProduzione;
	private String proprietaProduzione;
	private String connettoreCollaudo;
	private String connettoreProduzione;
	private String referenteRegionaleAdesione;
	private String referenteTecnicoAdesione;

	public String getServizio() {
		return servizio;
	}
	public void setServizio(String servizio) {
		this.servizio = servizio;
	}
	public String getTipoApi() {
		return tipoApi;
	}
	public void setTipoApi(String tipoApi) {
		this.tipoApi = tipoApi;
	}
	public String getErogatore() {
		return erogatore;
	}
	public void setErogatore(String erogatore) {
		this.erogatore = erogatore;
	}
	public String getImplementazioneAPI() {
		return implementazioneAPI;
	}
	public void setImplementazioneAPI(String implementazioneAPI) {
		this.implementazioneAPI = implementazioneAPI;
	}
	public String getAzioneRisorsa() {
		return azioneRisorsa;
	}
	public void setAzioneRisorsa(String azioneRisorsa) {
		this.azioneRisorsa = azioneRisorsa;
	}
	public String getAutenticazioneStato() {
		return autenticazioneStato;
	}
	public void setAutenticazioneStato(String autenticazioneStato) {
		this.autenticazioneStato = autenticazioneStato;
	}
	public String getApplicativiAutorizzatiCollaudo() {
		return applicativiAutorizzatiCollaudo;
	}
	public void setApplicativiAutorizzatiCollaudo(String applicativiAutorizzatiCollaudo) {
		this.applicativiAutorizzatiCollaudo = applicativiAutorizzatiCollaudo;
	}
	public String getRateLimitingCollaudo() {
		return rateLimitingCollaudo;
	}
	public void setRateLimitingCollaudo(String rateLimitingCollaudo) {
		this.rateLimitingCollaudo = rateLimitingCollaudo;
	}
	public String getProprietaCollaudo() {
		return proprietaCollaudo;
	}
	public void setProprietaCollaudo(String proprietaCollaudo) {
		this.proprietaCollaudo = proprietaCollaudo;
	}
	public String getApplicativiAutorizzatiProduzione() {
		return applicativiAutorizzatiProduzione;
	}
	public void setApplicativiAutorizzatiProduzione(String applicativiAutorizzatiProduzione) {
		this.applicativiAutorizzatiProduzione = applicativiAutorizzatiProduzione;
	}
	public String getRateLimitingProduzione() {
		return rateLimitingProduzione;
	}
	public void setRateLimitingProduzione(String rateLimitingProduzione) {
		this.rateLimitingProduzione = rateLimitingProduzione;
	}
	public String getProprietaProduzione() {
		return proprietaProduzione;
	}
	public void setProprietaProduzione(String proprietaProduzione) {
		this.proprietaProduzione = proprietaProduzione;
	}
	public String getReferenteRegionaleAdesione() {
		return referenteRegionaleAdesione;
	}
	public void setReferenteRegionaleAdesione(String referenteRegionaleAdesione) {
		this.referenteRegionaleAdesione = referenteRegionaleAdesione;
	}
	public String getReferenteTecnicoAdesione() {
		return referenteTecnicoAdesione;
	}
	public void setReferenteTecnicoAdesione(String referenteTecnicoAdesione) {
		this.referenteTecnicoAdesione = referenteTecnicoAdesione;
	}
	public String getUrlInvocazioneProduzione() {
		return urlInvocazioneProduzione;
	}
	public void setUrlInvocazioneProduzione(String urlInvocazioneProduzione) {
		this.urlInvocazioneProduzione = urlInvocazioneProduzione;
	}
	public String getUrlInvocazioneCollaudo() {
		return urlInvocazioneCollaudo;
	}
	public void setUrlInvocazioneCollaudo(String urlInvocazioneCollaudo) {
		this.urlInvocazioneCollaudo = urlInvocazioneCollaudo;
	}
	public String getConnettoreCollaudo() {
		return connettoreCollaudo;
	}
	public void setConnettoreCollaudo(String connettoreCollaudo) {
		this.connettoreCollaudo = connettoreCollaudo;
	}
	public String getConnettoreProduzione() {
		return connettoreProduzione;
	}
	public void setConnettoreProduzione(String connettoreProduzione) {
		this.connettoreProduzione = connettoreProduzione;
	}
	public String getAutenticazioneValoreCollaudo() {
		return autenticazioneValoreCollaudo;
	}
	public void setAutenticazioneValoreCollaudo(String autenticazioneValoreCollaudo) {
		this.autenticazioneValoreCollaudo = autenticazioneValoreCollaudo;
	}
	public String getAutenticazioneValoreProduzione() {
		return autenticazioneValoreProduzione;
	}
	public void setAutenticazioneValoreProduzione(String autenticazioneValoreProduzione) {
		this.autenticazioneValoreProduzione = autenticazioneValoreProduzione;
	}
	public String getAderente() {
		return aderente;
	}
	public void setAderente(String aderente) {
		this.aderente = aderente;
	}
	public String getIdAdesione() {
		return idAdesione;
	}
	public void setIdAdesione(String idAdesione) {
		this.idAdesione = idAdesione;
	}
	
}
