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

public class Servizio {

	private String erogatore;
	private String servizio;
	private String api;
	private String tipoApi;
	private String autenticazioneStato;
	private String statoServizio;
	private String urlInvocazioneProduzione;
	private String connettoreProduzione;
	private String urlInvocazioneCollaudo;
	private String connettoreCollaudo;

	public String getErogatore() {
		return erogatore;
	}
	public void setErogatore(String erogatore) {
		this.erogatore = erogatore;
	}
	public String getServizio() {
		return servizio;
	}
	public void setServizio(String servizio) {
		this.servizio = servizio;
	}
	public String getApi() {
		return api;
	}
	public void setApi(String api) {
		this.api = api;
	}
	public String getTipoApi() {
		return tipoApi;
	}
	public void setTipoApi(String tipoApi) {
		this.tipoApi = tipoApi;
	}
	public String getAutenticazioneStato() {
		return autenticazioneStato;
	}
	public void setAutenticazioneStato(String autenticazioneStato) {
		this.autenticazioneStato = autenticazioneStato;
	}
	public String getStatoServizio() {
		return statoServizio;
	}
	public void setStatoServizio(String statoServizio) {
		this.statoServizio = statoServizio;
	}
	public String getUrlInvocazioneProduzione() {
		return urlInvocazioneProduzione;
	}
	public void setUrlInvocazioneProduzione(String urlInvocazioneProduzione) {
		this.urlInvocazioneProduzione = urlInvocazioneProduzione;
	}
	public String getConnettoreProduzione() {
		return connettoreProduzione;
	}
	public void setConnettoreProduzione(String connettoreProduzione) {
		this.connettoreProduzione = connettoreProduzione;
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

}
