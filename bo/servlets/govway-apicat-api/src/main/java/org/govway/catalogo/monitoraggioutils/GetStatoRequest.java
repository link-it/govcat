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

public class GetStatoRequest {

	private String soggetto;
	private TipoVerifica tipoVerifica;
	private ConfigurazioneConnessione configurazioneConnessione;
	private OffsetDateTime periodo1DataInizioVerifica;
	private OffsetDateTime periodo1DataFineVerifica;
	private OffsetDateTime periodo2DataInizioVerifica;
	private OffsetDateTime periodo2DataFineVerifica;
	
	public String getSoggetto() {
		return soggetto;
	}
	public void setSoggetto(String soggetto) {
		this.soggetto = soggetto;
	}
	public OffsetDateTime getPeriodo1DataInizioVerifica() {
		return periodo1DataInizioVerifica;
	}
	public void setPeriodo1DataInizioVerifica(OffsetDateTime periodo1DataInizioVerifica) {
		this.periodo1DataInizioVerifica = periodo1DataInizioVerifica;
	}
	public OffsetDateTime getPeriodo1DataFineVerifica() {
		return periodo1DataFineVerifica;
	}
	public void setPeriodo1DataFineVerifica(OffsetDateTime periodo1DataFineVerifica) {
		this.periodo1DataFineVerifica = periodo1DataFineVerifica;
	}
	public OffsetDateTime getPeriodo2DataInizioVerifica() {
		return periodo2DataInizioVerifica;
	}
	public void setPeriodo2DataInizioVerifica(OffsetDateTime periodo2DataInizioVerifica) {
		this.periodo2DataInizioVerifica = periodo2DataInizioVerifica;
	}
	public OffsetDateTime getPeriodo2DataFineVerifica() {
		return periodo2DataFineVerifica;
	}
	public void setPeriodo2DataFineVerifica(OffsetDateTime periodo2DataFineVerifica) {
		this.periodo2DataFineVerifica = periodo2DataFineVerifica;
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
}
