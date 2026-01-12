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
package org.govway.catalogo.monitoraggioutils.allarmi;

public class AllarmeResponse {

	private String identificativo;
	private String dettaglio;
	private boolean warning;
	private String nomeServizio;
	private String versioneServizio;
	private String nomeApplicativo;
	private String nomeSoggetto;
	
	
	public String getNomeServizio() {
		return nomeServizio;
	}
	public void setNomeServizio(String nomeServizio) {
		this.nomeServizio = nomeServizio;
	}
	public String getVersioneServizio() {
		return versioneServizio;
	}
	public void setVersioneServizio(String versioneServizio) {
		this.versioneServizio = versioneServizio;
	}
	public String getNomeApplicativo() {
		return nomeApplicativo;
	}
	public void setNomeApplicativo(String nomeApplicativo) {
		this.nomeApplicativo = nomeApplicativo;
	}
	public String getNomeSoggetto() {
		return nomeSoggetto;
	}
	public void setNomeSoggetto(String nomeSoggetto) {
		this.nomeSoggetto= nomeSoggetto;
	}
	public String getDettaglio() {
		return dettaglio;
	}
	public void setDettaglio(String dettaglio) {
		this.dettaglio = dettaglio;
	}
	public String getIdentificativo() {
		return identificativo;
	}
	public void setIdentificativo(String identificativo) {
		this.identificativo = identificativo;
	}
	public boolean isWarning() {
		return warning;
	}
	public void setWarning(boolean warning) {
		this.warning = warning;
	}
}
