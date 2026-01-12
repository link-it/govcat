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

import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneAPI;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneApplicativo;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneErrori;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneEsiti;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneIndirizzoIP;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneOperazione;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzionePrincipal;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneSoggettoRemoto;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneTokenClientId;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneTokenIssuer;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoIntervalloTemporale;

public class PostReportResponse {

	private ReportStatisticoIntervalloTemporale reportStatisticoIntervalloTemporale;
	private ReportStatisticoDistribuzioneEsiti reportStatisticoDistribuzioneEsiti;
	private ReportStatisticoDistribuzioneErrori reportStatisticoDistribuzioneErrori;
	private ReportStatisticoDistribuzioneAPI reportStatisticoDistribuzioneAPI;
	private ReportStatisticoDistribuzioneApplicativo reportStatisticoDistribuzioneApplicativo;
	private ReportStatisticoDistribuzioneIndirizzoIP reportStatisticoDistribuzioneIndirizzoIP;
	private ReportStatisticoDistribuzioneOperazione reportStatisticoDistribuzioneOperazione;
	private ReportStatisticoDistribuzioneSoggettoRemoto reportStatisticoDistribuzioneSoggettoRemoto;
	private ReportStatisticoDistribuzioneTokenClientId reportStatisticoDistribuzioneTokenClientId;
	private ReportStatisticoDistribuzioneTokenIssuer reportStatisticoDistribuzioneTokenIssuer;
	private ReportStatisticoDistribuzionePrincipal reportStatisticoDistribuzionePrincipal;
	
	public ReportStatisticoDistribuzioneOperazione getReportStatisticoDistribuzioneOperazione() {
		return reportStatisticoDistribuzioneOperazione;
	}

	public void setReportStatisticoDistribuzioneOperazione(
			ReportStatisticoDistribuzioneOperazione reportStatisticoDistribuzioneOperazione) {
		this.reportStatisticoDistribuzioneOperazione = reportStatisticoDistribuzioneOperazione;
	}

	public ReportStatisticoDistribuzioneSoggettoRemoto getReportStatisticoDistribuzioneSoggettoRemoto() {
		return reportStatisticoDistribuzioneSoggettoRemoto;
	}

	public void setReportStatisticoDistribuzioneSoggettoRemoto(
			ReportStatisticoDistribuzioneSoggettoRemoto reportStatisticoDistribuzioneSoggettoRemoto) {
		this.reportStatisticoDistribuzioneSoggettoRemoto = reportStatisticoDistribuzioneSoggettoRemoto;
	}

	public ReportStatisticoDistribuzioneTokenClientId getReportStatisticoDistribuzioneTokenClientId() {
		return reportStatisticoDistribuzioneTokenClientId;
	}

	public void setReportStatisticoDistribuzioneTokenClientId(
			ReportStatisticoDistribuzioneTokenClientId reportStatisticoDistribuzioneTokenClientId) {
		this.reportStatisticoDistribuzioneTokenClientId = reportStatisticoDistribuzioneTokenClientId;
	}

	public ReportStatisticoDistribuzioneTokenIssuer getReportStatisticoDistribuzioneTokenIssuer() {
		return reportStatisticoDistribuzioneTokenIssuer;
	}

	public void setReportStatisticoDistribuzioneTokenIssuer(
			ReportStatisticoDistribuzioneTokenIssuer reportStatisticoDistribuzioneTokenIssuer) {
		this.reportStatisticoDistribuzioneTokenIssuer = reportStatisticoDistribuzioneTokenIssuer;
	}

	public ReportStatisticoIntervalloTemporale getReportStatisticoIntervalloTemporale() {
		return reportStatisticoIntervalloTemporale;
	}

	public void setReportStatisticoIntervalloTemporale(ReportStatisticoIntervalloTemporale reportStatisticoIntervalloTemporale) {
		this.reportStatisticoIntervalloTemporale = reportStatisticoIntervalloTemporale;
	}

	public ReportStatisticoDistribuzioneEsiti getReportStatisticoDistribuzioneEsiti() {
		return reportStatisticoDistribuzioneEsiti;
	}

	public void setReportStatisticoDistribuzioneEsiti(ReportStatisticoDistribuzioneEsiti reportStatisticoDistribuzioneEsiti) {
		this.reportStatisticoDistribuzioneEsiti = reportStatisticoDistribuzioneEsiti;
	}

	public ReportStatisticoDistribuzioneErrori getReportStatisticoDistribuzioneErrori() {
		return reportStatisticoDistribuzioneErrori;
	}

	public void setReportStatisticoDistribuzioneErrori(ReportStatisticoDistribuzioneErrori reportStatisticoDistribuzioneErrori) {
		this.reportStatisticoDistribuzioneErrori = reportStatisticoDistribuzioneErrori;
	}

	public ReportStatisticoDistribuzioneAPI getReportStatisticoDistribuzioneAPI() {
		return reportStatisticoDistribuzioneAPI;
	}

	public void setReportStatisticoDistribuzioneAPI(ReportStatisticoDistribuzioneAPI reportStatisticoDistribuzioneAPI) {
		this.reportStatisticoDistribuzioneAPI = reportStatisticoDistribuzioneAPI;
	}

	public ReportStatisticoDistribuzioneApplicativo getReportStatisticoDistribuzioneApplicativo() {
		return reportStatisticoDistribuzioneApplicativo;
	}

	public void setReportStatisticoDistribuzioneApplicativo(ReportStatisticoDistribuzioneApplicativo reportStatisticoDistribuzioneApplicativo) {
		this.reportStatisticoDistribuzioneApplicativo = reportStatisticoDistribuzioneApplicativo;
	}

	public ReportStatisticoDistribuzioneIndirizzoIP getReportStatisticoDistribuzioneIndirizzoIP() {
		return reportStatisticoDistribuzioneIndirizzoIP;
	}

	public void setReportStatisticoDistribuzioneIndirizzoIP(ReportStatisticoDistribuzioneIndirizzoIP reportStatisticoDistribuzioneIndirizzoIP) {
		this.reportStatisticoDistribuzioneIndirizzoIP = reportStatisticoDistribuzioneIndirizzoIP;
	}

	public ReportStatisticoDistribuzionePrincipal getReportStatisticoDistribuzionePrincipal() {
		return reportStatisticoDistribuzionePrincipal;
	}

	public void setReportStatisticoDistribuzionePrincipal(ReportStatisticoDistribuzionePrincipal reportStatisticoDistribuzionePrincipal) {
		this.reportStatisticoDistribuzionePrincipal = reportStatisticoDistribuzionePrincipal;
	}
}
