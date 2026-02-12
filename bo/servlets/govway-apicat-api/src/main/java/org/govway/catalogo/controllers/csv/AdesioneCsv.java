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

public class AdesioneCsv {

	private String erogatore;
	private String servizio;
	private String autenticazioneStato;
	private String aderente;
	private String idAdesione;
	private String statoAdesione;
	private String referenteRegionaleAdesione;
	private String referenteTecnicoAdesione;
	private String applicativiAutorizzatiProduzione;
	private String applicativiAutorizzatiCollaudo;

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
	public String getAutenticazioneStato() {
		return autenticazioneStato;
	}
	public void setAutenticazioneStato(String autenticazioneStato) {
		this.autenticazioneStato = autenticazioneStato;
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
	public String getStatoAdesione() {
		return statoAdesione;
	}
	public void setStatoAdesione(String statoAdesione) {
		this.statoAdesione = statoAdesione;
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
	public String getApplicativiAutorizzatiProduzione() {
		return applicativiAutorizzatiProduzione;
	}
	public void setApplicativiAutorizzatiProduzione(String applicativiAutorizzatiProduzione) {
		this.applicativiAutorizzatiProduzione = applicativiAutorizzatiProduzione;
	}
	public String getApplicativiAutorizzatiCollaudo() {
		return applicativiAutorizzatiCollaudo;
	}
	public void setApplicativiAutorizzatiCollaudo(String applicativiAutorizzatiCollaudo) {
		this.applicativiAutorizzatiCollaudo = applicativiAutorizzatiCollaudo;
	}

}
