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
package org.govway.catalogo.monitoraggioutils;

import org.govway.catalogo.servlets.monitor.model.AmbienteEnum;

public class ConfigurazioneConnessione {

	private String url;
	private String username;
	private String password;
	private AmbienteEnum ambiente;

	private String idAllarmeSoggetti;
	private String idAllarmeApplicativi;
	private String idAllarmeTokenPolicyCertificati;
	private String idAllarmeTokenPolicyBackend;
	
	private String idAllarmeConfigurazioneGeneraleCertificati;

	private String idAllarmeErogazioniModiCertificati;
	private String idAllarmeErogazioniPdndCertificati;
	private String idAllarmeFruizioniModiCertificati;
	private String idAllarmeFruizioniPdndCertificati;
	private String idAllarmeErogazioniModiBackend;
	private String idAllarmeErogazioniPdndBackend;
	private String idAllarmeFruizioniModiBackend;
	private String idAllarmeFruizioniPdndBackend;

	public String getIdAllarmeSoggetti() {
		return idAllarmeSoggetti;
	}
	public void setIdAllarmeSoggetti(String idAllarmeSoggetti) {
		this.idAllarmeSoggetti = idAllarmeSoggetti;
	}
	public String getIdAllarmeApplicativi() {
		return idAllarmeApplicativi;
	}
	public void setIdAllarmeApplicativi(String idAllarmeApplicativi) {
		this.idAllarmeApplicativi = idAllarmeApplicativi;
	}
	public String getIdAllarmeErogazioniModiCertificati() {
		return idAllarmeErogazioniModiCertificati;
	}
	public void setIdAllarmeErogazioniModiCertificati(String idAllarmeErogazioniModiCertificati) {
		this.idAllarmeErogazioniModiCertificati = idAllarmeErogazioniModiCertificati;
	}
	public String getIdAllarmeErogazioniPdndCertificati() {
		return idAllarmeErogazioniPdndCertificati;
	}
	public void setIdAllarmeErogazioniPdndCertificati(String idAllarmeErogazioniPdndCertificati) {
		this.idAllarmeErogazioniPdndCertificati = idAllarmeErogazioniPdndCertificati;
	}
	public String getIdAllarmeFruizioniModiCertificati() {
		return idAllarmeFruizioniModiCertificati;
	}
	public void setIdAllarmeFruizioniModiCertificati(String idAllarmeFruizioniModiCertificati) {
		this.idAllarmeFruizioniModiCertificati = idAllarmeFruizioniModiCertificati;
	}
	public String getIdAllarmeFruizioniPdndCertificati() {
		return idAllarmeFruizioniPdndCertificati;
	}
	public void setIdAllarmeFruizioniPdndCertificati(String idAllarmeFruizioniPdndCertificati) {
		this.idAllarmeFruizioniPdndCertificati = idAllarmeFruizioniPdndCertificati;
	}
	public String getIdAllarmeTokenPolicyCertificati() {
		return idAllarmeTokenPolicyCertificati;
	}
	public void setIdAllarmeTokenPolicyCertificati(String idAllarmeTokenPolicyCertificati) {
		this.idAllarmeTokenPolicyCertificati = idAllarmeTokenPolicyCertificati;
	}
	public String getIdAllarmeTokenPolicyBackend() {
		return idAllarmeTokenPolicyBackend;
	}
	public void setIdAllarmeTokenPolicyBackend(String idAllarmeTokenPolicyBackend) {
		this.idAllarmeTokenPolicyBackend = idAllarmeTokenPolicyBackend;
	}
	public String getIdAllarmeConfigurazioneGeneraleCertificati() {
		return idAllarmeConfigurazioneGeneraleCertificati;
	}
	public void setIdAllarmeConfigurazioneGeneraleCertificati(String idAllarmeConfigurazioneGeneraleCertificati) {
		this.idAllarmeConfigurazioneGeneraleCertificati = idAllarmeConfigurazioneGeneraleCertificati;
	}
	public String getIdAllarmeErogazioniModiBackend() {
		return idAllarmeErogazioniModiBackend;
	}
	public void setIdAllarmeErogazioniModiBackend(String idAllarmeErogazioniModiBackend) {
		this.idAllarmeErogazioniModiBackend = idAllarmeErogazioniModiBackend;
	}
	public String getIdAllarmeErogazioniPdndBackend() {
		return idAllarmeErogazioniPdndBackend;
	}
	public void setIdAllarmeErogazioniPdndBackend(String idAllarmeErogazioniPdndBackend) {
		this.idAllarmeErogazioniPdndBackend = idAllarmeErogazioniPdndBackend;
	}
	public String getIdAllarmeFruizioniModiBackend() {
		return idAllarmeFruizioniModiBackend;
	}
	public void setIdAllarmeFruizioniModiBackend(String idAllarmeFruizioniModiBackend) {
		this.idAllarmeFruizioniModiBackend = idAllarmeFruizioniModiBackend;
	}
	public String getIdAllarmeFruizioniPdndBackend() {
		return idAllarmeFruizioniPdndBackend;
	}
	public void setIdAllarmeFruizioniPdndBackend(String idAllarmeFruizioniPdndBackend) {
		this.idAllarmeFruizioniPdndBackend = idAllarmeFruizioniPdndBackend;
	}

	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	public String getUsername() {
		return username;
	}
	public void setUsername(String username) {
		this.username = username;
	}
	public String getUrl() {
		return url;
	}
	public void setUrl(String url) {
		this.url = url;
	}
	public AmbienteEnum getAmbiente() {
		return ambiente;
	}
	public void setAmbiente(AmbienteEnum ambiente) {
		this.ambiente = ambiente;
	}
}
