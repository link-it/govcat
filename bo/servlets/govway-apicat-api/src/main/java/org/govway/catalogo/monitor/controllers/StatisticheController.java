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
package org.govway.catalogo.monitor.controllers;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import javax.servlet.http.HttpServletRequest;
import org.govway.catalogo.MonitorV1Controller;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.gest.clients.govwaymonitor.model.ProfiloEnum;
import org.govway.catalogo.monitoraggioutils.ConfigurazioneConnessione;
import org.govway.catalogo.monitoraggioutils.FiltriUtils;
import org.govway.catalogo.monitoraggioutils.GetReportRequest;
import org.govway.catalogo.monitoraggioutils.GetReportResponse;
import org.govway.catalogo.monitoraggioutils.IStatisticheClient;
import org.govway.catalogo.monitoraggioutils.IdApi;
import org.govway.catalogo.monitoraggioutils.PostReportResponse;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneFormatiReport;
import org.govway.catalogo.servlets.model.ConfigurazioneTipiDistribuzione;
import org.govway.catalogo.servlets.monitor.model.AmbienteEnum;
import org.govway.catalogo.servlets.monitor.model.AndamentoTemporaleQuery;
import org.govway.catalogo.servlets.monitor.model.DistribuzioneApiQuery;
import org.govway.catalogo.servlets.monitor.model.DistribuzioneApplicativoQuery;
import org.govway.catalogo.servlets.monitor.model.DistribuzioneClientIdQuery;
import org.govway.catalogo.servlets.monitor.model.DistribuzioneErroriQuery;
import org.govway.catalogo.servlets.monitor.model.DistribuzioneEsitiQuery;
import org.govway.catalogo.servlets.monitor.model.DistribuzioneIPQuery;
import org.govway.catalogo.servlets.monitor.model.DistribuzioneIssuerQuery;
import org.govway.catalogo.servlets.monitor.model.DistribuzioneOperazioneQuery;
import org.govway.catalogo.servlets.monitor.model.DistribuzionePrincipalQuery;
import org.govway.catalogo.servlets.monitor.model.DistribuzioneSoggettoRemotoQuery;
import org.govway.catalogo.servlets.monitor.model.EsitoTransazioneEnum;
import org.govway.catalogo.servlets.monitor.model.IntervalloTemporale;
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
import org.govway.catalogo.servlets.monitor.model.TipoInformazioneReportEnum;
import org.govway.catalogo.servlets.monitor.model.TipoIntervalloTemporaleEnum;
import org.govway.catalogo.servlets.monitor.model.TipoReportAndamentoTemporaleEnum;
import org.govway.catalogo.servlets.monitor.model.TipoReportEnum;
import org.govway.catalogo.servlets.monitor.model.UnitaTempoReportEnum;
import org.govway.catalogo.servlets.monitor.server.api.StatisticheApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@MonitorV1Controller
public class StatisticheController implements StatisticheApi {

	private Logger logger = LoggerFactory.getLogger(StatisticheController.class);

	@Autowired
	private HttpServletRequest request;

	@Autowired
	private IStatisticheClient client;

	@Autowired
	private Configurazione configurazione;

	@Autowired
	private FiltriUtils filtriUtils;

	@Value("${statistiche.collaudo.uri}")
	protected String uriStatisticheCollaudo;
	@Value("${statistiche.collaudo.authn.basic.username}")
	protected String userStatisticheCollaudo;
	@Value("${statistiche.collaudo.authn.basic.password}")
	protected String passwordStatisticheCollaudo;

	@Value("${statistiche.produzione.uri}")
	protected String uriStatisticheProduzione;
	@Value("${statistiche.produzione.authn.basic.username}")
	protected String userStatisticheProduzione;
	@Value("${statistiche.produzione.authn.basic.password}")
	protected String passwordStatisticheProduzione;

	public enum ErogazioneFruizioneEnum {
		EROGAZIONE, FRUIZIONE
	}

	public enum ModiPdndEnum {
		MODI, PDND
	}

	public enum TipoVerifica {
		READ_TIMEOUT, CONNECTION_TIMEOUT, RATE_LIMITING
	}

	public enum TipologiaReportEnum {
		ANDAMENTO_TEMPORALE, DISTRIBUZIONE_ESITI, DISTRIBUZIONE_ERRORI, DISTRIBUZIONE_SOGGETTO_REMOTO,
		DISTRIBUZIONE_API, DISTRIBUZIONE_OPERAZIONE, DISTRIBUZIONE_APPLICATIVO, DISTRIBUZIONE_TOKEN_CLIENT_ID,
		DISTRIBUZIONE_TOKEN_ISSUER, DISTRIBUZIONE_IP, DISTRIBUZIONE_PRINCIPAL
	}

	private void authorize(ConfigurazioneTipiDistribuzione configurazioneTipiDistribuzione) {
		if (!this.configurazione.getMonitoraggio().isAbilitato()) {
			throw new NotFoundException("Monitoraggio non abilitato");
		}

		if (this.configurazione.getMonitoraggio().isStatisticheAbilitate() != null
				&& !this.configurazione.getMonitoraggio().isStatisticheAbilitate()) {
			throw new NotFoundException("Statistiche non abilitate");
		}

        if(this.configurazione.getMonitoraggio().getStatistiche() != null &&
            this.configurazione.getMonitoraggio().getStatistiche().getTipiDistribuzione() != null &&
            !this.configurazione.getMonitoraggio().getStatistiche().getTipiDistribuzione().isEmpty() &&
                !this.configurazione.getMonitoraggio().getStatistiche().getTipiDistribuzione().contains(configurazioneTipiDistribuzione)) {
            throw new NotFoundException("Tipo di distribuzione non abilitato");
        }

        ConfigurazioneFormatiReport formatoReportRichiesto = ConfigurazioneFormatiReport.CSV;
        String acceptValue = this.request.getHeader("Accept");
        if(acceptValue == null || acceptValue.contains("csv")) {
            formatoReportRichiesto = ConfigurazioneFormatiReport.CSV;
        } else if(acceptValue.contains("pdf")) {
            formatoReportRichiesto = ConfigurazioneFormatiReport.PDF;
        } else if(acceptValue.contains("vnd.ms-excel")) {
            formatoReportRichiesto = ConfigurazioneFormatiReport.XLS;
        }
        if(this.configurazione.getMonitoraggio().getStatistiche() != null &&
                this.configurazione.getMonitoraggio().getStatistiche().getFormatiReport() != null &&
                !this.configurazione.getMonitoraggio().getStatistiche().getFormatiReport().isEmpty() &&
                !this.configurazione.getMonitoraggio().getStatistiche().getFormatiReport().contains(formatoReportRichiesto)) {
            throw new NotFoundException("Tipo di formato report non abilitato");
        }

		// TODO check ruoli
	}

	private GetReportRequest fillGetReportRequest(AmbienteEnum ambiente, UUID idServizio, OffsetDateTime dataDa,
			OffsetDateTime dataA, UUID idApi, EsitoTransazioneEnum esito, List<Integer> listaCodici, UUID idAdesione,
			UUID idClient, String operazione, UnitaTempoReportEnum unitaTempo,
			TipoIntervalloTemporaleEnum tipoIntervalloTemporale, Integer unitaTemporale,
			TipoReportAndamentoTemporaleEnum tipoReportAndamentoTemporale, TipoReportEnum tipoReport,
			TipoInformazioneReportEnum tipoInformazioneReport, ErogazioneFruizioneEnum erogazioneFruizione,
			String soggetto, TipologiaReportEnum tipologiaReportEnum) {

		List<IdApi> idapi = this.filtriUtils.getApi(idServizio, idApi, idAdesione, ambiente);

		GetReportRequest getReportRequest = new GetReportRequest();

		getReportRequest.setConfigurazioneConnessione(getConfigurazioneConnessione(ambiente));
		getReportRequest.setApiNome(idapi.get(0).getNome());
		getReportRequest.setApiVersione(idapi.get(0).getVersione());

		getReportRequest.setSoggettoReferente(soggetto);
		getReportRequest.setSoggettoErogatore(this.filtriUtils.getSoggettoNome(idapi.get(0).getSoggetto()));
		getReportRequest.setEsito(esito);
		getReportRequest.setListaCodici(listaCodici);
		getReportRequest.setOperazione(operazione);
		getReportRequest.setUnitaTempo(unitaTempo);
		getReportRequest.setTipoIntervalloTemporale(tipoIntervalloTemporale);
		getReportRequest.setDataInizio(dataDa);
		getReportRequest.setDataFine(dataA);
		getReportRequest.setUnitaTemporale(unitaTemporale);
		getReportRequest.setTipoReport(tipoReport);
		getReportRequest.setTipoReportAndamentoTemporale(tipoReportAndamentoTemporale);
		getReportRequest.setTipoInformazioneReport(tipoInformazioneReport);
		getReportRequest.setTipologiaReportEnum(tipologiaReportEnum);
		getReportRequest
				.setProfilo(ProfiloEnum.fromValue(this.configurazione.getMonitoraggio().getProfiloGovwayDefault()));
		getReportRequest.setErogazioneFruizioneEnum(erogazioneFruizione);
		getReportRequest.setAccept(this.request.getHeader("Accept"));

		return getReportRequest;
	}

	private ConfigurazioneConnessione getConfigurazioneConnessione(AmbienteEnum ambiente) {

		ConfigurazioneConnessione conf = new ConfigurazioneConnessione();
		conf.setUrl(
				ambiente.equals(AmbienteEnum.COLLAUDO) ? this.uriStatisticheCollaudo : this.uriStatisticheProduzione);

		conf.setUsername(
				ambiente.equals(AmbienteEnum.COLLAUDO) ? this.userStatisticheCollaudo : this.userStatisticheProduzione);
		conf.setPassword(ambiente.equals(AmbienteEnum.COLLAUDO) ? this.passwordStatisticheCollaudo
				: this.passwordStatisticheProduzione);

		return conf;
	}

	private ResponseEntity<Resource> getResource(GetReportResponse response) {
		return ResponseEntity.status(HttpStatus.OK).header("Content-Type", response.getContentType())
				.body(new ByteArrayResource(response.getResource()));
	}

	private ResponseEntity<ReportStatisticoIntervalloTemporale> getReportStatisticoIntervalloTemporale(
			PostReportResponse response) {
		return ResponseEntity.ok().body(response.getReportStatisticoIntervalloTemporale());
	}

	private GetReportRequest fillPostReportRequestInfoComuni(GetReportRequest getReportRequest, AmbienteEnum ambiente,
			ErogazioneFruizioneEnum erogazioneFruizione, String soggetto, TipologiaReportEnum andamentoTemporale) {
		getReportRequest.setConfigurazioneConnessione(getConfigurazioneConnessione(ambiente));
		getReportRequest.setSoggettoReferente(soggetto);
		getReportRequest.setTipologiaReportEnum(andamentoTemporale);
		getReportRequest
				.setProfilo(ProfiloEnum.fromValue(this.configurazione.getMonitoraggio().getProfiloGovwayDefault()));
		getReportRequest.setErogazioneFruizioneEnum(erogazioneFruizione);
		getReportRequest.setAccept("text/csv");

		return getReportRequest;
	}

	private GetReportRequest fillPostReportRequest(AmbienteEnum ambiente, AndamentoTemporaleQuery query,
			ErogazioneFruizioneEnum erogazioneFruizione, String soggetto, TipologiaReportEnum andamentoTemporale) {

		GetReportRequest getReportRequest = new GetReportRequest();

		fillPostReportRequestInfoComuni(getReportRequest, ambiente, erogazioneFruizione, soggetto, andamentoTemporale);

		List<IdApi> idapi = this.filtriUtils.getApi(query.getApi().getIdServizio(), query.getApi().getIdApi(),
				query.getApi().getIdAdesione(), ambiente);
		getReportRequest.setApiNome(idapi.get(0).getNome());
		getReportRequest.setApiVersione(idapi.get(0).getVersione());
		if (query.getEsito() != null) {
			getReportRequest.setEsito(query.getEsito().getTipo());
			getReportRequest.setListaCodici(query.getEsito().getCodici());
		}

		getReportRequest.setSoggettoErogatore(this.filtriUtils.getSoggettoNome(idapi.get(0).getSoggetto()));

		getReportRequest.setOperazione(query.getOperazione());
		getReportRequest.setUnitaTempo(query.getUnitaTempo());
		getReportRequest.setTipoIntervalloTemporale(query.getIntervalloTemporale().getTipoIntervalloTemporale());

		IntervalloTemporale it = ((IntervalloTemporale) query.getIntervalloTemporale());

		getReportRequest.setTipoReportAndamentoTemporale(query.getTipoReportAndamentoTemporale());
		getReportRequest.setTipoInformazioneReport(query.getTipoInformazioneReport());

		getReportRequest.setDataFine(it.getDataFine());
		getReportRequest.setDataInizio(it.getDataInizio());

		return getReportRequest;
	}

	private GetReportRequest fillPostReportRequest(AmbienteEnum ambiente, DistribuzioneEsitiQuery query,
			ErogazioneFruizioneEnum erogazioneFruizione, String soggetto, TipologiaReportEnum andamentoTemporale) {

		GetReportRequest getReportRequest = new GetReportRequest();

		fillPostReportRequestInfoComuni(getReportRequest, ambiente, erogazioneFruizione, soggetto, andamentoTemporale);

		List<IdApi> idapi = this.filtriUtils.getApi(query.getApi().getIdServizio(), query.getApi().getIdApi(),
				query.getApi().getIdAdesione(), ambiente);
		getReportRequest.setApiNome(idapi.get(0).getNome());
		getReportRequest.setApiVersione(idapi.get(0).getVersione());
		if (query.getEsito() != null) {
			getReportRequest.setEsito(query.getEsito().getTipo());
			getReportRequest.setListaCodici(query.getEsito().getCodici());
		}
		getReportRequest.setSoggettoErogatore(this.filtriUtils.getSoggettoNome(idapi.get(0).getSoggetto()));

		getReportRequest.setOperazione(query.getOperazione());
		getReportRequest.setUnitaTempo(query.getUnitaTempo());
		getReportRequest.setTipoIntervalloTemporale(query.getIntervalloTemporale().getTipoIntervalloTemporale());

		IntervalloTemporale it = ((IntervalloTemporale) query.getIntervalloTemporale());

		getReportRequest.setTipoReportAndamentoTemporale(query.getTipoReportAndamentoTemporale());
		getReportRequest.setTipoInformazioneReport(query.getTipoInformazioneReport());

		getReportRequest.setDataFine(it.getDataFine());
		getReportRequest.setDataInizio(it.getDataInizio());

		return getReportRequest;
	}

	private GetReportRequest fillPostReportRequest(AmbienteEnum ambiente, DistribuzioneErroriQuery query,
			ErogazioneFruizioneEnum erogazioneFruizione, String soggetto, TipologiaReportEnum andamentoTemporale) {

		GetReportRequest getReportRequest = new GetReportRequest();

		fillPostReportRequestInfoComuni(getReportRequest, ambiente, erogazioneFruizione, soggetto, andamentoTemporale);

		List<IdApi> idapi = this.filtriUtils.getApi(query.getApi().getIdServizio(), query.getApi().getIdApi(),
				query.getApi().getIdAdesione(), ambiente);
		getReportRequest.setApiNome(idapi.get(0).getNome());
		getReportRequest.setApiVersione(idapi.get(0).getVersione());
		if (query.getEsito() != null) {
			getReportRequest.setEsito(query.getEsito().getTipo());
			getReportRequest.setListaCodici(query.getEsito().getCodici());
		}

		getReportRequest.setSoggettoErogatore(this.filtriUtils.getSoggettoNome(idapi.get(0).getSoggetto()));

		getReportRequest.setOperazione(query.getOperazione());
		getReportRequest.setUnitaTempo(query.getUnitaTempo());
		getReportRequest.setTipoIntervalloTemporale(query.getIntervalloTemporale().getTipoIntervalloTemporale());

		IntervalloTemporale it = ((IntervalloTemporale) query.getIntervalloTemporale());

		getReportRequest.setDataInizio(it.getDataInizio());
		getReportRequest.setTipoReport(query.getTipoReport());

		return getReportRequest;
	}

	private GetReportRequest fillPostReportRequest(AmbienteEnum ambiente, DistribuzioneApiQuery query,
			ErogazioneFruizioneEnum erogazioneFruizione, String soggetto, TipologiaReportEnum andamentoTemporale) {

		GetReportRequest getReportRequest = new GetReportRequest();

		fillPostReportRequestInfoComuni(getReportRequest, ambiente, erogazioneFruizione, soggetto, andamentoTemporale);

		List<IdApi> idapi = this.filtriUtils.getApi(query.getApi().getIdServizio(), query.getApi().getIdApi(),
				query.getApi().getIdAdesione(), ambiente);
		getReportRequest.setApiNome(idapi.get(0).getNome());
		getReportRequest.setApiVersione(idapi.get(0).getVersione());
		if (query.getEsito() != null) {
			getReportRequest.setEsito(query.getEsito().getTipo());
			getReportRequest.setListaCodici(query.getEsito().getCodici());
		}

		getReportRequest.setSoggettoErogatore(this.filtriUtils.getSoggettoNome(idapi.get(0).getSoggetto()));

		getReportRequest.setOperazione(query.getOperazione());
		getReportRequest.setUnitaTempo(query.getUnitaTempo());
		getReportRequest.setTipoIntervalloTemporale(query.getIntervalloTemporale().getTipoIntervalloTemporale());

		IntervalloTemporale it = ((IntervalloTemporale) query.getIntervalloTemporale());

		getReportRequest.setDataInizio(it.getDataInizio());
		getReportRequest.setTipoReport(query.getTipoReport());

		return getReportRequest;
	}

	private GetReportRequest fillPostReportRequest(AmbienteEnum ambiente, DistribuzioneApplicativoQuery query,
			ErogazioneFruizioneEnum erogazioneFruizione, String soggetto, TipologiaReportEnum andamentoTemporale) {

		GetReportRequest getReportRequest = new GetReportRequest();

		fillPostReportRequestInfoComuni(getReportRequest, ambiente, erogazioneFruizione, soggetto, andamentoTemporale);

		List<IdApi> idapi = this.filtriUtils.getApi(query.getApi().getIdServizio(), query.getApi().getIdApi(),
				query.getApi().getIdAdesione(), ambiente);
		getReportRequest.setApiNome(idapi.get(0).getNome());
		getReportRequest.setApiVersione(idapi.get(0).getVersione());
		if (query.getEsito() != null) {
			getReportRequest.setEsito(query.getEsito().getTipo());
			getReportRequest.setListaCodici(query.getEsito().getCodici());
		}

		getReportRequest.setSoggettoErogatore(this.filtriUtils.getSoggettoNome(idapi.get(0).getSoggetto()));

		getReportRequest.setOperazione(query.getOperazione());
		getReportRequest.setUnitaTempo(query.getUnitaTempo());
		getReportRequest.setTipoIntervalloTemporale(query.getIntervalloTemporale().getTipoIntervalloTemporale());

		IntervalloTemporale it = ((IntervalloTemporale) query.getIntervalloTemporale());

		getReportRequest.setDataInizio(it.getDataInizio());
		getReportRequest.setTipoReport(query.getTipoReport());

		return getReportRequest;
	}

	private GetReportRequest fillPostReportRequest(AmbienteEnum ambiente, DistribuzioneIPQuery query,
			ErogazioneFruizioneEnum erogazioneFruizione, String soggetto, TipologiaReportEnum andamentoTemporale) {

		GetReportRequest getReportRequest = new GetReportRequest();

		fillPostReportRequestInfoComuni(getReportRequest, ambiente, erogazioneFruizione, soggetto, andamentoTemporale);

		List<IdApi> idapi = this.filtriUtils.getApi(query.getApi().getIdServizio(), query.getApi().getIdApi(),
				query.getApi().getIdAdesione(), ambiente);
		getReportRequest.setApiNome(idapi.get(0).getNome());
		getReportRequest.setApiVersione(idapi.get(0).getVersione());
		if (query.getEsito() != null) {
			getReportRequest.setEsito(query.getEsito().getTipo());
			getReportRequest.setListaCodici(query.getEsito().getCodici());
		}

		getReportRequest.setSoggettoErogatore(this.filtriUtils.getSoggettoNome(idapi.get(0).getSoggetto()));

		getReportRequest.setOperazione(query.getOperazione());
		getReportRequest.setUnitaTempo(query.getUnitaTempo());
		getReportRequest.setTipoIntervalloTemporale(query.getIntervalloTemporale().getTipoIntervalloTemporale());

		IntervalloTemporale it = ((IntervalloTemporale) query.getIntervalloTemporale());

		getReportRequest.setDataInizio(it.getDataInizio());
		getReportRequest.setTipoReport(query.getTipoReport());

		return getReportRequest;
	}

	private GetReportRequest fillPostReportRequest(AmbienteEnum ambiente, DistribuzioneOperazioneQuery query,
			ErogazioneFruizioneEnum erogazioneFruizione, String soggetto, TipologiaReportEnum andamentoTemporale) {

		GetReportRequest getReportRequest = new GetReportRequest();

		fillPostReportRequestInfoComuni(getReportRequest, ambiente, erogazioneFruizione, soggetto, andamentoTemporale);

		List<IdApi> idapi = this.filtriUtils.getApi(query.getApi().getIdServizio(), query.getApi().getIdApi(),
				query.getApi().getIdAdesione(), ambiente);
		getReportRequest.setApiNome(idapi.get(0).getNome());
		getReportRequest.setApiVersione(idapi.get(0).getVersione());
		if (query.getEsito() != null) {
			getReportRequest.setEsito(query.getEsito().getTipo());
			getReportRequest.setListaCodici(query.getEsito().getCodici());
		}

		getReportRequest.setSoggettoErogatore(this.filtriUtils.getSoggettoNome(idapi.get(0).getSoggetto()));

		getReportRequest.setOperazione(query.getOperazione());
		getReportRequest.setUnitaTempo(query.getUnitaTempo());
		getReportRequest.setTipoIntervalloTemporale(query.getIntervalloTemporale().getTipoIntervalloTemporale());

		IntervalloTemporale it = ((IntervalloTemporale) query.getIntervalloTemporale());

		getReportRequest.setDataInizio(it.getDataInizio());
		getReportRequest.setTipoReport(query.getTipoReport());

		return getReportRequest;
	}

	private GetReportRequest fillPostReportRequest(AmbienteEnum ambiente, DistribuzioneSoggettoRemotoQuery query,
			ErogazioneFruizioneEnum erogazioneFruizione, String soggetto, TipologiaReportEnum andamentoTemporale) {

		GetReportRequest getReportRequest = new GetReportRequest();

		fillPostReportRequestInfoComuni(getReportRequest, ambiente, erogazioneFruizione, soggetto, andamentoTemporale);

		List<IdApi> idapi = this.filtriUtils.getApi(query.getApi().getIdServizio(), query.getApi().getIdApi(),
				query.getApi().getIdAdesione(), ambiente);
		getReportRequest.setApiNome(idapi.get(0).getNome());
		getReportRequest.setApiVersione(idapi.get(0).getVersione());
		if (query.getEsito() != null) {
			getReportRequest.setEsito(query.getEsito().getTipo());
			getReportRequest.setListaCodici(query.getEsito().getCodici());
		}

		getReportRequest.setSoggettoErogatore(this.filtriUtils.getSoggettoNome(idapi.get(0).getSoggetto()));

		getReportRequest.setOperazione(query.getOperazione());
		getReportRequest.setUnitaTempo(query.getUnitaTempo());
		getReportRequest.setTipoIntervalloTemporale(query.getIntervalloTemporale().getTipoIntervalloTemporale());

		IntervalloTemporale it = ((IntervalloTemporale) query.getIntervalloTemporale());

		getReportRequest.setDataInizio(it.getDataInizio());
		getReportRequest.setTipoReport(query.getTipoReport());

		return getReportRequest;
	}

	private GetReportRequest fillPostReportRequest(AmbienteEnum ambiente, DistribuzioneClientIdQuery query,
			ErogazioneFruizioneEnum erogazioneFruizione, String soggetto, TipologiaReportEnum andamentoTemporale) {

		GetReportRequest getReportRequest = new GetReportRequest();

		fillPostReportRequestInfoComuni(getReportRequest, ambiente, erogazioneFruizione, soggetto, andamentoTemporale);

		List<IdApi> idapi = this.filtriUtils.getApi(query.getApi().getIdServizio(), query.getApi().getIdApi(),
				query.getApi().getIdAdesione(), ambiente);
		getReportRequest.setApiNome(idapi.get(0).getNome());
		getReportRequest.setApiVersione(idapi.get(0).getVersione());
		if (query.getEsito() != null) {
			getReportRequest.setEsito(query.getEsito().getTipo());
			getReportRequest.setListaCodici(query.getEsito().getCodici());
		}

		getReportRequest.setSoggettoErogatore(this.filtriUtils.getSoggettoNome(idapi.get(0).getSoggetto()));

		getReportRequest.setOperazione(query.getOperazione());
		getReportRequest.setUnitaTempo(query.getUnitaTempo());
		getReportRequest.setTipoIntervalloTemporale(query.getIntervalloTemporale().getTipoIntervalloTemporale());

		IntervalloTemporale it = ((IntervalloTemporale) query.getIntervalloTemporale());

		getReportRequest.setDataInizio(it.getDataInizio());
		getReportRequest.setTipoReport(query.getTipoReport());

		return getReportRequest;
	}

	private GetReportRequest fillPostReportRequest(AmbienteEnum ambiente, DistribuzioneIssuerQuery query,
			ErogazioneFruizioneEnum erogazioneFruizione, String soggetto, TipologiaReportEnum andamentoTemporale) {

		GetReportRequest getReportRequest = new GetReportRequest();

		fillPostReportRequestInfoComuni(getReportRequest, ambiente, erogazioneFruizione, soggetto, andamentoTemporale);

		List<IdApi> idapi = this.filtriUtils.getApi(query.getApi().getIdServizio(), query.getApi().getIdApi(),
				query.getApi().getIdAdesione(), ambiente);
		getReportRequest.setApiNome(idapi.get(0).getNome());
		getReportRequest.setApiVersione(idapi.get(0).getVersione());
		if (query.getEsito() != null) {
			getReportRequest.setEsito(query.getEsito().getTipo());
			getReportRequest.setListaCodici(query.getEsito().getCodici());
		}

		getReportRequest.setSoggettoErogatore(this.filtriUtils.getSoggettoNome(idapi.get(0).getSoggetto()));

		getReportRequest.setOperazione(query.getOperazione());
		getReportRequest.setUnitaTempo(query.getUnitaTempo());
		getReportRequest.setTipoIntervalloTemporale(query.getIntervalloTemporale().getTipoIntervalloTemporale());

		IntervalloTemporale it = ((IntervalloTemporale) query.getIntervalloTemporale());

		getReportRequest.setDataInizio(it.getDataInizio());
		getReportRequest.setTipoReport(query.getTipoReport());

		return getReportRequest;
	}

	private GetReportRequest fillPostReportRequest(AmbienteEnum ambiente, DistribuzionePrincipalQuery query,
			ErogazioneFruizioneEnum erogazioneFruizione, String soggetto, TipologiaReportEnum andamentoTemporale) {

		GetReportRequest getReportRequest = new GetReportRequest();

		fillPostReportRequestInfoComuni(getReportRequest, ambiente, erogazioneFruizione, soggetto, andamentoTemporale);

		List<IdApi> idapi = this.filtriUtils.getApi(query.getApi().getIdServizio(), query.getApi().getIdApi(),
				query.getApi().getIdAdesione(), ambiente);
		getReportRequest.setApiNome(idapi.get(0).getNome());
		getReportRequest.setApiVersione(idapi.get(0).getVersione());
		if (query.getEsito() != null) {
			getReportRequest.setEsito(query.getEsito().getTipo());
			getReportRequest.setListaCodici(query.getEsito().getCodici());
		}

		getReportRequest.setSoggettoErogatore(this.filtriUtils.getSoggettoNome(idapi.get(0).getSoggetto()));

		getReportRequest.setOperazione(query.getOperazione());
		getReportRequest.setUnitaTempo(query.getUnitaTempo());
		getReportRequest.setTipoIntervalloTemporale(query.getIntervalloTemporale().getTipoIntervalloTemporale());

		IntervalloTemporale it = ((IntervalloTemporale) query.getIntervalloTemporale());

		getReportRequest.setDataInizio(it.getDataInizio());
		getReportRequest.setTipoReport(query.getTipoReport());

		return getReportRequest;
	}

	private ResponseEntity<ReportStatisticoDistribuzioneEsiti> getReportStatisticoDistribuzioneEsiti(
			PostReportResponse response) {
		return ResponseEntity.ok().body(response.getReportStatisticoDistribuzioneEsiti());
	}

	private ResponseEntity<ReportStatisticoDistribuzioneErrori> getReportStatisticoDistribuzioneErrori(
			PostReportResponse response) {
		return ResponseEntity.ok().body(response.getReportStatisticoDistribuzioneErrori());
	}

	private ResponseEntity<ReportStatisticoDistribuzioneAPI> getReportStatisticoDistribuzioneApi(
			PostReportResponse response) {
		return ResponseEntity.ok().body(response.getReportStatisticoDistribuzioneAPI());
	}

	private ResponseEntity<ReportStatisticoDistribuzioneApplicativo> getReportStatisticoDistribuzioneApplicativo(
			PostReportResponse response) {
		return ResponseEntity.ok().body(response.getReportStatisticoDistribuzioneApplicativo());
	}

	private ResponseEntity<ReportStatisticoDistribuzioneIndirizzoIP> getReportStatisticoDistribuzioneIndirizzoIP(
			PostReportResponse response) {
		return ResponseEntity.ok().body(response.getReportStatisticoDistribuzioneIndirizzoIP());
	}

	private ResponseEntity<ReportStatisticoDistribuzioneOperazione> getReportStatisticoDistribuzioneOperazione(
			PostReportResponse response) {
		return ResponseEntity.ok().body(response.getReportStatisticoDistribuzioneOperazione());
	}

	private ResponseEntity<ReportStatisticoDistribuzioneSoggettoRemoto> getReportStatisticoDistribuzioneSoggettoRemoto(
			PostReportResponse response) {
		return ResponseEntity.ok().body(response.getReportStatisticoDistribuzioneSoggettoRemoto());
	}

	private ResponseEntity<ReportStatisticoDistribuzioneTokenClientId> getReportStatisticoDistribuzioneTokenClientId(
			PostReportResponse response) {
		return ResponseEntity.ok().body(response.getReportStatisticoDistribuzioneTokenClientId());
	}

	private ResponseEntity<ReportStatisticoDistribuzioneTokenIssuer> getReportStatisticoDistribuzioneTokenIssuer(
			PostReportResponse response) {
		return ResponseEntity.ok().body(response.getReportStatisticoDistribuzioneTokenIssuer());
	}

	private ResponseEntity<ReportStatisticoDistribuzionePrincipal> getReportStatisticoDistribuzionePrincipal(
			PostReportResponse response) {
		return ResponseEntity.ok().body(response.getReportStatisticoDistribuzionePrincipal());
	}

	@Override
	public ResponseEntity<Resource> ambienteErogazioniSoggettoReportAndamentoTemporaleGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportAndamentoTemporaleEnum tipoReport,
			TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.ANDAMENTO_TEMPORALE);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, tipoReport, null, tipoInformazioneReport, ErogazioneFruizioneEnum.EROGAZIONE,
					soggetto, TipologiaReportEnum.ANDAMENTO_TEMPORALE);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoIntervalloTemporale> ambienteErogazioniSoggettoReportAndamentoTemporalePost(
			AmbienteEnum ambiente, String soggetto, AndamentoTemporaleQuery andamentoTemporaleQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.ANDAMENTO_TEMPORALE);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, andamentoTemporaleQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, soggetto, TipologiaReportEnum.ANDAMENTO_TEMPORALE);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoIntervalloTemporale(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteErogazioniSoggettoReportDistribuzioneApiGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_API);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.EROGAZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_API);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneAPI> ambienteErogazioniSoggettoReportDistribuzioneApiPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneApiQuery distribuzioneApiQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_API);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneApiQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_API);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneApi(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteErogazioniSoggettoReportDistribuzioneApplicativoGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_APPLICATIVO);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.EROGAZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_APPLICATIVO);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneApplicativo> ambienteErogazioniSoggettoReportDistribuzioneApplicativoPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneApplicativoQuery distribuzioneApplicativoQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_APPLICATIVO);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneApplicativoQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_APPLICATIVO);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneApplicativo(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteErogazioniSoggettoReportDistribuzioneErroriGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_ERRORI);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.EROGAZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_ERRORI);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneErrori> ambienteErogazioniSoggettoReportDistribuzioneErroriPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneErroriQuery distribuzioneErroriQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_ERRORI);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneErroriQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_ERRORI);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneErrori(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteErogazioniSoggettoReportDistribuzioneEsitiGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportAndamentoTemporaleEnum tipoReport,
			TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_ESITI);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, tipoReport, null, tipoInformazioneReport, ErogazioneFruizioneEnum.EROGAZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_ESITI);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneEsiti> ambienteErogazioniSoggettoReportDistribuzioneEsitiPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneEsitiQuery distribuzioneEsitiQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_ESITI);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneEsitiQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_ESITI);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneEsiti(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteErogazioniSoggettoReportDistribuzioneIpGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_IP);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.EROGAZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_IP);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneIndirizzoIP> ambienteErogazioniSoggettoReportDistribuzioneIpPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneIPQuery distribuzioneIPQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_IP);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneIPQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_IP);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneIndirizzoIP(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteErogazioniSoggettoReportDistribuzioneOperazioneGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_OPERAZIONE);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.EROGAZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_OPERAZIONE);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneOperazione> ambienteErogazioniSoggettoReportDistribuzioneOperazionePost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneOperazioneQuery distribuzioneOperazioneQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_OPERAZIONE);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneOperazioneQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_OPERAZIONE);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneOperazione(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteErogazioniSoggettoReportDistribuzioneSoggettoRemotoGet(
			AmbienteEnum ambiente, String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA,
			UUID idApi, EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_SOGGETTO_REMOTO);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.EROGAZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_SOGGETTO_REMOTO);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneSoggettoRemoto> ambienteErogazioniSoggettoReportDistribuzioneSoggettoRemotoPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneSoggettoRemotoQuery distribuzioneSoggettoRemotoQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_SOGGETTO_REMOTO);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneSoggettoRemotoQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_SOGGETTO_REMOTO);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneSoggettoRemoto(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteErogazioniSoggettoReportDistribuzioneTokenClientidGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_TOKEN_CLIENT_ID);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.EROGAZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_TOKEN_CLIENT_ID);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneTokenClientId> ambienteErogazioniSoggettoReportDistribuzioneTokenClientidPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneClientIdQuery distribuzioneClientIdQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_TOKEN_CLIENT_ID);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneClientIdQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_TOKEN_CLIENT_ID);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneTokenClientId(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteErogazioniSoggettoReportDistribuzioneTokenIssuerGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_TOKEN_ISSUER);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.EROGAZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_TOKEN_ISSUER);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneTokenIssuer> ambienteErogazioniSoggettoReportDistribuzioneTokenIssuerPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneIssuerQuery distribuzioneIssuerQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_TOKEN_ISSUER);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneIssuerQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_TOKEN_ISSUER);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneTokenIssuer(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteFruizioniSoggettoReportAndamentoTemporaleGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportAndamentoTemporaleEnum tipoReport,
			TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.ANDAMENTO_TEMPORALE);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, tipoReport, null, tipoInformazioneReport, ErogazioneFruizioneEnum.FRUIZIONE,
					soggetto, TipologiaReportEnum.ANDAMENTO_TEMPORALE);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoIntervalloTemporale> ambienteFruizioniSoggettoReportAndamentoTemporalePost(
			AmbienteEnum ambiente, String soggetto, AndamentoTemporaleQuery andamentoTemporaleQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.ANDAMENTO_TEMPORALE);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, andamentoTemporaleQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, soggetto, TipologiaReportEnum.ANDAMENTO_TEMPORALE);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoIntervalloTemporale(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteFruizioniSoggettoReportDistribuzioneApiGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_API);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.FRUIZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_API);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneAPI> ambienteFruizioniSoggettoReportDistribuzioneApiPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneApiQuery distribuzioneApiQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_API);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneApiQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_API);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneApi(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteFruizioniSoggettoReportDistribuzioneApplicativoGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_APPLICATIVO);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.FRUIZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_APPLICATIVO);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneApplicativo> ambienteFruizioniSoggettoReportDistribuzioneApplicativoPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneApplicativoQuery distribuzioneApplicativoQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_APPLICATIVO);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneApplicativoQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_APPLICATIVO);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneApplicativo(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteFruizioniSoggettoReportDistribuzioneErroriGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_ERRORI);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.FRUIZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_ERRORI);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneErrori> ambienteFruizioniSoggettoReportDistribuzioneErroriPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneErroriQuery distribuzioneErroriQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_ERRORI);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneErroriQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_ERRORI);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneErrori(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteFruizioniSoggettoReportDistribuzioneEsitiGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportAndamentoTemporaleEnum tipoReport,
			TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_ESITI);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, tipoReport, null, tipoInformazioneReport, ErogazioneFruizioneEnum.FRUIZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_ESITI);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneEsiti> ambienteFruizioniSoggettoReportDistribuzioneEsitiPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneEsitiQuery distribuzioneEsitiQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_ESITI);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneEsitiQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_ESITI);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneEsiti(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteFruizioniSoggettoReportDistribuzioneIpGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_IP);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.FRUIZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_IP);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneIndirizzoIP> ambienteFruizioniSoggettoReportDistribuzioneIpPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneIPQuery distribuzioneIPQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_IP);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneIPQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_IP);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneIndirizzoIP(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteFruizioniSoggettoReportDistribuzioneOperazioneGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_OPERAZIONE);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.FRUIZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_OPERAZIONE);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneOperazione> ambienteFruizioniSoggettoReportDistribuzioneOperazionePost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneOperazioneQuery distribuzioneOperazioneQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_OPERAZIONE);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneOperazioneQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_OPERAZIONE);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneOperazione(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteFruizioniSoggettoReportDistribuzionePrincipalGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_PRINCIPAL);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.FRUIZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_PRINCIPAL);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzionePrincipal> ambienteFruizioniSoggettoReportDistribuzionePrincipalPost(
			AmbienteEnum ambiente, String soggetto, DistribuzionePrincipalQuery distribuzionePrincipalQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_PRINCIPAL);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzionePrincipalQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_PRINCIPAL);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzionePrincipal(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteFruizioniSoggettoReportDistribuzioneSoggettoRemotoGet(AmbienteEnum ambiente,
			String soggetto, UUID idServizio, OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoListaCodici, UUID idAdesione, UUID idClient,
			String operazione, UnitaTempoReportEnum unitaTempo, TipoIntervalloTemporaleEnum tipoIntervalloTemporale,
			Integer unitaTemporale, TipoReportEnum tipoReport, TipoInformazioneReportEnum tipoInformazioneReport) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_SOGGETTO_REMOTO);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillGetReportRequest(ambiente, idServizio, dataDa, dataA, idApi, esito,
					esitoListaCodici, idAdesione, idClient, operazione, unitaTempo, tipoIntervalloTemporale,
					unitaTemporale, null, tipoReport, tipoInformazioneReport, ErogazioneFruizioneEnum.FRUIZIONE,
					soggetto, TipologiaReportEnum.DISTRIBUZIONE_SOGGETTO_REMOTO);
			GetReportResponse response = this.client.getReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getResource(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ReportStatisticoDistribuzioneSoggettoRemoto> ambienteFruizioniSoggettoReportDistribuzioneSoggettoRemotoPost(
			AmbienteEnum ambiente, String soggetto, DistribuzioneSoggettoRemotoQuery distribuzioneSoggettoRemotoQuery) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize(ConfigurazioneTipiDistribuzione.DISTRIBUZIONE_SOGGETTO_REMOTO);
			this.logger.debug("Autorizzazione completata con successo");

			GetReportRequest request = fillPostReportRequest(ambiente, distribuzioneSoggettoRemotoQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, soggetto, TipologiaReportEnum.DISTRIBUZIONE_SOGGETTO_REMOTO);
			PostReportResponse response = this.client.postReport(request);

			this.logger.debug("Invocazione completata con successo");

			return getReportStatisticoDistribuzioneSoggettoRemoto(response);
		} catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

}
