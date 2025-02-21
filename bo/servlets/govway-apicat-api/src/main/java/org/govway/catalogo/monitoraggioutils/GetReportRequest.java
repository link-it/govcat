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
package org.govway.catalogo.monitoraggioutils;

import java.time.OffsetDateTime;
import java.util.List;

import org.govway.catalogo.gest.clients.govwaymonitor.model.ProfiloEnum;
import org.govway.catalogo.monitor.controllers.StatisticheController.ErogazioneFruizioneEnum;
import org.govway.catalogo.monitor.controllers.StatisticheController.TipologiaReportEnum;
import org.govway.catalogo.servlets.monitor.model.EsitoTransazioneEnum;
import org.govway.catalogo.servlets.monitor.model.TipoInformazioneReportEnum;
import org.govway.catalogo.servlets.monitor.model.TipoIntervalloTemporaleEnum;
import org.govway.catalogo.servlets.monitor.model.TipoReportAndamentoTemporaleEnum;
import org.govway.catalogo.servlets.monitor.model.TipoReportEnum;
import org.govway.catalogo.servlets.monitor.model.UnitaTempoReportEnum;

public class GetReportRequest {

	public String getApiNome() {
		return apiNome;
	}
	public void setApiNome(String apiNome) {
		this.apiNome = apiNome;
	}
	public Integer getApiVersione() {
		return apiVersione;
	}
	public void setApiVersione(Integer apiVersione) {
		this.apiVersione = apiVersione;
	}
	public EsitoTransazioneEnum getEsito() {
		return esito;
	}
	public void setEsito(EsitoTransazioneEnum esito) {
		this.esito= esito;
	}
	public String getOperazione() {
		return operazione;
	}
	public void setOperazione(String operazione) {
		this.operazione = operazione;
	}
	public UnitaTempoReportEnum getUnitaTempo() {
		return unitaTempo;
	}
	public void setUnitaTempo(UnitaTempoReportEnum unitaTempo) {
		this.unitaTempo = unitaTempo;
	}
	public TipoIntervalloTemporaleEnum getTipoIntervalloTemporale() {
		return tipoIntervalloTemporale;
	}
	public void setTipoIntervalloTemporale(TipoIntervalloTemporaleEnum tipoIntervalloTemporale) {
		this.tipoIntervalloTemporale = tipoIntervalloTemporale;
	}
	public OffsetDateTime getDataInizio() {
		return dataInizio;
	}
	public void setDataInizio(OffsetDateTime dataInizio) {
		this.dataInizio = dataInizio;
	}
	public OffsetDateTime getDataFine() {
		return dataFine;
	}
	public void setDataFine(OffsetDateTime dataFine) {
		this.dataFine = dataFine;
	}
	public Integer getUnitaTemporale() {
		return unitaTemporale;
	}
	public void setUnitaTemporale(Integer unitaTemporale) {
		this.unitaTemporale = unitaTemporale;
	}
	public TipoReportEnum getTipoReport() {
		return tipoReport;
	}
	public void setTipoReport(TipoReportEnum tipoReport) {
		this.tipoReport = tipoReport;
	}
	public TipoInformazioneReportEnum getTipoInformazioneReport() {
		return tipoInformazioneReport;
	}
	public void setTipoInformazioneReport(TipoInformazioneReportEnum tipoInformazioneReport) {
		this.tipoInformazioneReport = tipoInformazioneReport;
	}
	public TipoReportAndamentoTemporaleEnum getTipoReportAndamentoTemporale() {
		return tipoReportAndamentoTemporale;
	}
	public void setTipoReportAndamentoTemporale(TipoReportAndamentoTemporaleEnum tipoReportAndamentoTemporale) {
		this.tipoReportAndamentoTemporale = tipoReportAndamentoTemporale;
	}
	public ConfigurazioneConnessione getConfigurazioneConnessione() {
		return configurazioneConnessione;
	}
	public void setConfigurazioneConnessione(ConfigurazioneConnessione configurazioneConnessione) {
		this.configurazioneConnessione = configurazioneConnessione;
	}
	
	public TipologiaReportEnum getTipologiaReportEnum() {
		return tipologiaReportEnum;
	}
	public void setTipologiaReportEnum(TipologiaReportEnum tipologiaReportEnum) {
		this.tipologiaReportEnum = tipologiaReportEnum;
	}

	public ProfiloEnum getProfilo() {
		return profilo;
	}
	public void setProfilo(ProfiloEnum profilo) {
		this.profilo = profilo;
	}

	public ErogazioneFruizioneEnum getErogazioneFruizioneEnum() {
		return erogazioneFruizioneEnum;
	}
	public void setErogazioneFruizioneEnum(ErogazioneFruizioneEnum erogazioneFruizioneEnum) {
		this.erogazioneFruizioneEnum = erogazioneFruizioneEnum;
	}

	public String getAccept() {
		return accept;
	}
	public void setAccept(String accept) {
		this.accept = accept;
	}

	public List<Integer> getListaCodici() {
		return listaCodici;
	}
	public void setListaCodici(List<Integer> listaCodici) {
		this.listaCodici = listaCodici;
	}

	public String getSoggettoReferente() {
		return soggettoReferente;
	}
	public void setSoggettoReferente(String soggettoReferente) {
		this.soggettoReferente = soggettoReferente;
	}

	public String getSoggettoErogatore() {
		return soggettoErogatore;
	}
	public void setSoggettoErogatore(String soggettoErogatore) {
		this.soggettoErogatore = soggettoErogatore;
	}

	private ConfigurazioneConnessione configurazioneConnessione;
	private	ProfiloEnum profilo;
	private	String apiNome;
	private Integer apiVersione;
	private String soggettoReferente;
	private String soggettoErogatore;
	private EsitoTransazioneEnum esito;
	private List<Integer> listaCodici;
	private String operazione;
	private UnitaTempoReportEnum unitaTempo;
	private TipoIntervalloTemporaleEnum tipoIntervalloTemporale;
	private OffsetDateTime dataInizio;
	private OffsetDateTime dataFine;
	private Integer unitaTemporale;
	private TipoReportAndamentoTemporaleEnum tipoReportAndamentoTemporale;
	private TipoReportEnum tipoReport;
	private TipoInformazioneReportEnum tipoInformazioneReport;
	private TipologiaReportEnum tipologiaReportEnum;
	private ErogazioneFruizioneEnum erogazioneFruizioneEnum;
	private String accept;
}
