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
package org.govway.catalogo.core.configurazione;

import java.util.Map;

public class AbstractEsitoConfigurazione {

	public enum ESITO {OK,KO_TEMPORANEO,KO_DEFINITIVO}
	
	private ESITO esito;
	private String messaggioErrore;
	private Map<String,String> chiaveRestituita;
	
	public ESITO getEsito() {
		return esito;
	}
	public void setEsito(ESITO esito) {
		this.esito = esito;
	}
	public String getMessaggioErrore() {
		return messaggioErrore;
	}
	public void setMessaggioErrore(String messaggioErrore) {
		this.messaggioErrore = messaggioErrore;
	}
	public Map<String,String> getChiaveRestituita() {
		return chiaveRestituita;
	}
	public void setChiaveRestituita(Map<String,String> chiaveRestituita) {
		this.chiaveRestituita = chiaveRestituita;
	}
}
