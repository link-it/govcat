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
package config;

import java.util.Base64;

/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public class ServizioApplicativo {
	private String nomeApplicativo;
	private String descrizione;
	private String modalitaAccesso;
	private String certificato;
	private String tipoCertificato = "CER";
	private String tokenPolicy;
	private String tokenIdentificativo;
	private String modiDominio;
	
	public ServizioApplicativo setNomeApplicativo(String nomeApplicativo) {
		this.nomeApplicativo = nomeApplicativo;
		return this;
	}
	
	public ServizioApplicativo setDescrizione(String descrizione) {
		this.descrizione = descrizione;
		return this;
	}
	
	public ServizioApplicativo setModalitaAccesso(String modalitaAccesso) {
		this.modalitaAccesso = modalitaAccesso;
		return this;
	}
	
	public ServizioApplicativo setCertificato(byte[] certificato) {
		this.certificato = Base64.getEncoder().encodeToString(certificato);
		return this;
	}
	
	public String getTipoCertificato() {
		return tipoCertificato;
	}

	public void setTipoCertificato(String tipoCertificato) {
		this.tipoCertificato = tipoCertificato;
	}

	public ServizioApplicativo setTokenPolicy(String tokenPolicy) {
		this.tokenPolicy = tokenPolicy;
		return this;
	}
	
	public ServizioApplicativo setTokenIdentificativo(String tokenIdentificativo) {
		this.tokenIdentificativo = tokenIdentificativo;
		return this;
	}
	
	public String getNomeApplicativo() {
		return nomeApplicativo;
	}
	public String getDescrizione() {
		return descrizione;
	}
	public String getModalitaAccesso() {
		return modalitaAccesso;
	}
	public String getCertificato() {
		return certificato;
	}
	public String getTokenPolicy() {
		return tokenPolicy;
	}
	public String getTokenIdentificativo() {
		return tokenIdentificativo;
	}

	public String getModiDominio() {
		return modiDominio;
	}

	public ServizioApplicativo setModiDominio(String modiDominio) {
		this.modiDominio = modiDominio;
		return this;
	}
	
}
