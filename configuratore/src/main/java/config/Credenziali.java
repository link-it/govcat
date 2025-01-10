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
package config;

import java.util.Base64;

/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public class Credenziali {
	private byte[] certificato;
	private String tipoCertificato = "CER";
	private String modalitaAccesso = "https";
	
	public String getCertificato() {
		return Base64.getEncoder().encodeToString(certificato);
	}
	public String getTipoCertificato() {
		return tipoCertificato;
	}
	public void setCertificato(byte[] certificato) {
		this.certificato = certificato;
	}
	public void setTipoCertificato(String tipoCertificato) {
		this.tipoCertificato = tipoCertificato;
	}
	public String getModalitaAccesso() {
		return modalitaAccesso;
	}
	public void setModalitaAccesso(String tipoAccesso) {
		this.modalitaAccesso = tipoAccesso;
	}
	
	
}
