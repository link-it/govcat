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

import java.time.OffsetDateTime;

import org.govway.catalogo.monitor.controllers.StatisticheController.TipoVerifica;

public class GetDetailRequest {

	private String soggetto;
	private TipoVerifica tipoVerifica;
	private ConfigurazioneConnessione configurazioneConnessione;
	private OffsetDateTime dataInizioVerifica;
	private OffsetDateTime dataFineVerifica;

	public String getSoggetto() {
		return soggetto;
	}
	public void setSoggetto(String soggetto) {
		this.soggetto = soggetto;
	}
	public TipoVerifica getTipoVerifica() {
		return tipoVerifica;
	}
	public void setTipoVerifica(TipoVerifica tipoVerifica) {
		this.tipoVerifica = tipoVerifica;
	}
	public ConfigurazioneConnessione getConfigurazioneConnessione() {
		return configurazioneConnessione;
	}
	public void setConfigurazioneConnessione(ConfigurazioneConnessione configurazioneConnessione) {
		this.configurazioneConnessione = configurazioneConnessione;
	}
	public OffsetDateTime getDataInizioVerifica() {
		return dataInizioVerifica;
	}
	public void setDataInizioVerifica(OffsetDateTime dataInizioVerifica) {
		this.dataInizioVerifica = dataInizioVerifica;
	}
	public OffsetDateTime getDataFineVerifica() {
		return dataFineVerifica;
	}
	public void setDataFineVerifica(OffsetDateTime dataFineVerifica) {
		this.dataFineVerifica = dataFineVerifica;
	}

}
