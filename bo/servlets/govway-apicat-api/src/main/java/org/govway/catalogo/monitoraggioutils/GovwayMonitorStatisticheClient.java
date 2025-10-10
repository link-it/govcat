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

import java.io.File;
import java.nio.file.Files;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.tika.Tika;
import org.govway.catalogo.cache.CatalogoCache;
import org.govway.catalogo.cache.GovwayCache;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.gest.clients.govwaymonitor.PatchedApiClient;
import org.govway.catalogo.gest.clients.govwaymonitor.api.ReportisticaApi;
import org.govway.catalogo.gest.clients.govwaymonitor.impl.ApiException;
import org.govway.catalogo.gest.clients.govwaymonitor.model.EsitoTransazioneFullSearchEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.Evento;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroApiSoggetti;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroEsito;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroRicercaRuoloTransazioneEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroMittenteErogazioneSoggettoImpl;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroTemporale;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FormatoReportEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.NumeroTransazioni;
import org.govway.catalogo.gest.clients.govwaymonitor.model.OccupazioneBanda;
import org.govway.catalogo.gest.clients.govwaymonitor.model.OneOfTipoInformazioneReportMultiLineNumeroTransazioniTipoInformazioneReportMultiLineOccupazioneBandaTipoInformazioneReportMultiLineTempoMedioRisposta;
import org.govway.catalogo.gest.clients.govwaymonitor.model.OneOfTipoInformazioneReportNumeroTransazioniTipoInformazioneReportOccupazioneBandaTipoInformazioneReportTempoMedioRisposta;
import org.govway.catalogo.gest.clients.govwaymonitor.model.OpzioniGenerazioneReport;
import org.govway.catalogo.gest.clients.govwaymonitor.model.OpzioniGenerazioneReportAllOfTipoInformazione;
import org.govway.catalogo.gest.clients.govwaymonitor.model.OpzioniGenerazioneReportMultiLine;
import org.govway.catalogo.gest.clients.govwaymonitor.model.OpzioniGenerazioneReportMultiLineAllOfTipoInformazione;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaAndamentoTemporale;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaAndamentoTemporaleAllOfMittente;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneApi;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneApiAllOfMittente;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneApplicativo;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneApplicativoRegistrato;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneAzione;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneAzioneAllOfMittente;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneErrori;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneErroriAllOfMittente;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneEsiti;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneEsitiAllOfMittente;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneSoggettoRemoto;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneSoggettoRemotoAllOfMittente;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneTokenInfo;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TempoMedioRisposta;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TipoFiltroMittenteEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TipoReportEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TokenClaimEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.UnitaTempoReportEnum;
import org.govway.catalogo.monitor.controllers.StatisticheController.ErogazioneFruizioneEnum;
import org.govway.catalogo.monitor.controllers.StatisticheController.TipoVerifica;
import org.govway.catalogo.monitor.controllers.StatisticheController.TipologiaReportEnum;
import org.govway.catalogo.monitoraggioutils.GetEsitoVerificaEventiItem.Errore;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.monitor.model.EsitoTransazioneEnum;
import org.govway.catalogo.servlets.monitor.model.EsitoVerificaEventi;
import org.govway.catalogo.servlets.monitor.model.EsitoVerificaEventiEnum;
import org.govway.catalogo.servlets.monitor.model.ItemServizioVerificato;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneAPI;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneAPIItem;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneApplicativo;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneApplicativoItem;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneErrori;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneErroriItem;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneEsiti;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneEsitiItem;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneIndirizzoIP;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneIndirizzoIPItem;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneOperazione;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneOperazioneItem;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzionePrincipal;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzionePrincipalItem;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneSoggettoRemoto;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneSoggettoRemotoItem;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneTokenClientId;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneTokenClientIdItem;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneTokenIssuer;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneTokenIssuerItem;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoIntervalloTemporale;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoIntervalloTemporaleItem;
import org.govway.catalogo.servlets.monitor.model.ResocontoVerificaConnettivitaPeriodo;
import org.govway.catalogo.servlets.monitor.model.TipoInformazioneReportEnum;
import org.govway.catalogo.servlets.monitor.model.TipoReportAndamentoTemporaleEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.databind.MappingIterator;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.dataformat.csv.CsvMapper;
import com.fasterxml.jackson.dataformat.csv.CsvParser;
import com.fasterxml.jackson.dataformat.csv.CsvSchema;

public class GovwayMonitorStatisticheClient extends AbstractGovwayMonitorClient implements IStatisticheClient {

	private Logger logger = LoggerFactory.getLogger(GovwayMonitorStatisticheClient.class);

	@Autowired
	private Tika tika;

	@Autowired
	private ApiService apiService;
	
    @Autowired
	protected Configurazione configurazione;
	
    @Autowired
	protected CatalogoCache catalogoCache;
	
    @Autowired
	protected GovwayCache govwayCache;
	
	@Override
	public GetReportResponse getReport(GetReportRequest request) {
		try {
			File result = getResult(request);

			if(result != null) {
				GetReportResponse response = new GetReportResponse();
				byte[] src = Files.readAllBytes(result.toPath());
				response.setContentType(this.tika.detect(src));
				response.setResource(src);
				return response;
			} else {
				throw new NotFoundException("Ricerca non implementata");
			}
		} catch(Exception e) {
			this.logger.error("Errore nell'invocazione del monitoraggio: " +e.getMessage(),e);
			throw new InternalException(e.getMessage());
		}
	}

	private RicercaStatisticaAndamentoTemporale getRicercaStatisticaAndamentoTemporale(GetReportRequest request) {
		RicercaStatisticaAndamentoTemporale reportRequest = new RicercaStatisticaAndamentoTemporale();

		FiltroApiSoggetti filtroapiSoggetti = getFiltroApiSoggetti(request);
		reportRequest.setApi(filtroapiSoggetti);
		reportRequest.setAzione(request.getOperazione());
		
		// Wrap FiltroMittenteErogazioneSoggettoImpl into the appropriate wrapper class
		FiltroMittenteErogazioneSoggettoImpl mittente = getMittenteImpl(request);
		if (mittente != null) {
			reportRequest.setMittente(new RicercaStatisticaAndamentoTemporaleAllOfMittente(mittente));
		}
		
		reportRequest.setEsito(getEsito(request.getEsito(), request.getListaCodici()));

		FiltroTemporale interv = getFiltroTemporale(request);

		reportRequest.setIntervalloTemporale(interv);

		reportRequest.setUnitaTempo(getUnitaTempo(request.getUnitaTempo()));
		reportRequest.setTipo(request.getErogazioneFruizioneEnum().equals(ErogazioneFruizioneEnum.EROGAZIONE) ? FiltroRicercaRuoloTransazioneEnum.EROGAZIONE : FiltroRicercaRuoloTransazioneEnum.FRUIZIONE);

		reportRequest.setReport(toReportMultiLineType(request.getAccept(), request.getTipoReportAndamentoTemporale(), request.getTipoInformazioneReport()));
		return reportRequest;
	}

	private RicercaStatisticaDistribuzioneEsiti getRicercaStatisticaDistribuzioneEsiti(GetReportRequest request) {
		RicercaStatisticaDistribuzioneEsiti reportRequest = new RicercaStatisticaDistribuzioneEsiti();

		FiltroApiSoggetti filtroapiSoggetti = getFiltroApiSoggetti(request);
		reportRequest.setApi(filtroapiSoggetti);
		reportRequest.setAzione(request.getOperazione());
		
		// Wrap FiltroMittenteErogazioneSoggettoImpl into the appropriate wrapper class
		FiltroMittenteErogazioneSoggettoImpl mittente = getMittenteImpl(request);
		if (mittente != null) {
			reportRequest.setMittente(new RicercaStatisticaDistribuzioneEsitiAllOfMittente(mittente));
		}

		FiltroTemporale interv = new FiltroTemporale();

		interv.setDataInizio(request.getDataInizio() != null ? request.getDataInizio() : OffsetDateTime.now().minus(Duration.ofDays(7)));
		interv.setDataFine(request.getDataFine() != null ? request.getDataFine() : OffsetDateTime.now());

		reportRequest.setIntervalloTemporale(interv);

		reportRequest.setUnitaTempo(getUnitaTempo(request.getUnitaTempo()));
		reportRequest.setTipo(request.getErogazioneFruizioneEnum().equals(ErogazioneFruizioneEnum.EROGAZIONE) ? FiltroRicercaRuoloTransazioneEnum.EROGAZIONE : FiltroRicercaRuoloTransazioneEnum.FRUIZIONE);

		reportRequest.setReport(toReportType(request.getAccept(), request.getTipoReportAndamentoTemporale(), request.getTipoReport(), request.getTipoInformazioneReport()));
		return reportRequest;
	}

	private RicercaStatisticaDistribuzioneErrori getRicercaStatisticaDistribuzioneErrori(GetReportRequest request) {
		RicercaStatisticaDistribuzioneErrori reportRequest = new RicercaStatisticaDistribuzioneErrori();

		FiltroApiSoggetti filtroapiSoggetti = getFiltroApiSoggetti(request);
		reportRequest.setApi(filtroapiSoggetti);
		reportRequest.setEsito(getEsito(request.getEsito(), request.getListaCodici()));
		reportRequest.setAzione(request.getOperazione());
		
		// Wrap FiltroMittenteErogazioneSoggettoImpl into the appropriate wrapper class
		FiltroMittenteErogazioneSoggettoImpl mittente = getMittenteImpl(request);
		if (mittente != null) {
			reportRequest.setMittente(new RicercaStatisticaDistribuzioneErroriAllOfMittente(mittente));
		}

		FiltroTemporale interv = getFiltroTemporale(request);

		reportRequest.setIntervalloTemporale(interv);

		reportRequest.setUnitaTempo(getUnitaTempo(request.getUnitaTempo()));
		reportRequest.setTipo(request.getErogazioneFruizioneEnum().equals(ErogazioneFruizioneEnum.EROGAZIONE) ? FiltroRicercaRuoloTransazioneEnum.EROGAZIONE : FiltroRicercaRuoloTransazioneEnum.FRUIZIONE);

		reportRequest.setReport(toReportType(request.getAccept(), request.getTipoReportAndamentoTemporale(), request.getTipoReport(), request.getTipoInformazioneReport()));
		return reportRequest;
	}

	private RicercaStatisticaDistribuzioneApi getRicercaStatisticaDistribuzioneApi(GetReportRequest request) {
		RicercaStatisticaDistribuzioneApi reportRequest = new RicercaStatisticaDistribuzioneApi();

		reportRequest.setEsito(getEsito(request.getEsito(), request.getListaCodici()));
		
		// Wrap FiltroMittenteErogazioneSoggettoImpl into the appropriate wrapper class
		FiltroMittenteErogazioneSoggettoImpl mittente = getMittenteImpl(request);
		if (mittente != null) {
			reportRequest.setMittente(new RicercaStatisticaDistribuzioneApiAllOfMittente(mittente));
		}

		FiltroTemporale interv = new FiltroTemporale();

		interv.setDataInizio(request.getDataInizio() != null ? request.getDataInizio() : OffsetDateTime.now().minus(Duration.ofDays(7)));
		interv.setDataFine(request.getDataFine() != null ? request.getDataFine() : OffsetDateTime.now());

		reportRequest.setIntervalloTemporale(interv);

		reportRequest.setUnitaTempo(getUnitaTempo(request.getUnitaTempo()));
		reportRequest.setTipo(request.getErogazioneFruizioneEnum().equals(ErogazioneFruizioneEnum.EROGAZIONE) ? FiltroRicercaRuoloTransazioneEnum.EROGAZIONE : FiltroRicercaRuoloTransazioneEnum.FRUIZIONE);

		reportRequest.setReport(toReportType(request.getAccept(), request.getTipoReportAndamentoTemporale(), request.getTipoReport(), request.getTipoInformazioneReport()));
		return reportRequest;
	}

	private RicercaStatisticaDistribuzioneApplicativoRegistrato getRicercaStatisticaDistribuzioneApplicativo(GetReportRequest request) {
		RicercaStatisticaDistribuzioneApplicativoRegistrato reportRequest = new RicercaStatisticaDistribuzioneApplicativoRegistrato();

		FiltroApiSoggetti filtroapiSoggetti = getFiltroApiSoggetti(request);
		reportRequest.setApi(filtroapiSoggetti);
		reportRequest.setEsito(getEsito(request.getEsito(), request.getListaCodici()));
		reportRequest.setAzione(request.getOperazione());

		FiltroTemporale interv = getFiltroTemporale(request);

		reportRequest.setIntervalloTemporale(interv);

		reportRequest.setUnitaTempo(getUnitaTempo(request.getUnitaTempo()));
		reportRequest.setTipo(request.getErogazioneFruizioneEnum().equals(ErogazioneFruizioneEnum.EROGAZIONE) ? FiltroRicercaRuoloTransazioneEnum.EROGAZIONE : FiltroRicercaRuoloTransazioneEnum.FRUIZIONE);

		reportRequest.setReport(toReportType(request.getAccept(), request.getTipoReportAndamentoTemporale(), request.getTipoReport(), request.getTipoInformazioneReport()));
		return reportRequest;
	}

	private RicercaStatisticaDistribuzioneApplicativo getRicercaStatisticaDistribuzioneIP(GetReportRequest request) {
		RicercaStatisticaDistribuzioneApplicativo reportRequest = new RicercaStatisticaDistribuzioneApplicativo();

		FiltroApiSoggetti filtroapiSoggetti = getFiltroApiSoggetti(request);
		reportRequest.setApi(filtroapiSoggetti);
		reportRequest.setEsito(getEsito(request.getEsito(), request.getListaCodici()));
		reportRequest.setAzione(request.getOperazione());

		FiltroTemporale interv = getFiltroTemporale(request);

		reportRequest.setIntervalloTemporale(interv);

		reportRequest.setUnitaTempo(getUnitaTempo(request.getUnitaTempo()));
		reportRequest.setTipo(request.getErogazioneFruizioneEnum().equals(ErogazioneFruizioneEnum.EROGAZIONE) ? FiltroRicercaRuoloTransazioneEnum.EROGAZIONE : FiltroRicercaRuoloTransazioneEnum.FRUIZIONE);

		reportRequest.setReport(toReportType(request.getAccept(), request.getTipoReportAndamentoTemporale(), request.getTipoReport(), request.getTipoInformazioneReport()));
		return reportRequest;
	}

	private RicercaStatisticaDistribuzioneApplicativo getRicercaStatisticaDistribuzionePrincipal(GetReportRequest request) {
		RicercaStatisticaDistribuzioneApplicativo reportRequest = new RicercaStatisticaDistribuzioneApplicativo();

		FiltroApiSoggetti filtroapiSoggetti = getFiltroApiSoggetti(request);
		reportRequest.setApi(filtroapiSoggetti);
		reportRequest.setEsito(getEsito(request.getEsito(), request.getListaCodici()));
		reportRequest.setAzione(request.getOperazione());

		FiltroTemporale interv = getFiltroTemporale(request);

		reportRequest.setIntervalloTemporale(interv);

		reportRequest.setUnitaTempo(getUnitaTempo(request.getUnitaTempo()));
		reportRequest.setTipo(request.getErogazioneFruizioneEnum().equals(ErogazioneFruizioneEnum.EROGAZIONE) ? FiltroRicercaRuoloTransazioneEnum.EROGAZIONE : FiltroRicercaRuoloTransazioneEnum.FRUIZIONE);

		reportRequest.setReport(toReportType(request.getAccept(), request.getTipoReportAndamentoTemporale(), request.getTipoReport(), request.getTipoInformazioneReport()));
		return reportRequest;
	}

	private RicercaStatisticaDistribuzioneAzione getRicercaStatisticaDistribuzioneOperazione(GetReportRequest request) {
		RicercaStatisticaDistribuzioneAzione reportRequest = new RicercaStatisticaDistribuzioneAzione();

		FiltroApiSoggetti filtroapiSoggetti = getFiltroApiSoggetti(request);
		reportRequest.setApi(filtroapiSoggetti);
		
		// Wrap FiltroMittenteErogazioneSoggettoImpl into the appropriate wrapper class
		FiltroMittenteErogazioneSoggettoImpl mittente = getMittenteImpl(request);
		if (mittente != null) {
			reportRequest.setMittente(new RicercaStatisticaDistribuzioneAzioneAllOfMittente(mittente));
		}

		reportRequest.setEsito(getEsito(request.getEsito(), request.getListaCodici()));

		FiltroTemporale interv = new FiltroTemporale();

		interv.setDataInizio(request.getDataInizio() != null ? request.getDataInizio() : OffsetDateTime.now().minus(Duration.ofDays(7)));
		interv.setDataFine(request.getDataFine() != null ? request.getDataFine() : OffsetDateTime.now());

		reportRequest.setIntervalloTemporale(interv);

		reportRequest.setUnitaTempo(getUnitaTempo(request.getUnitaTempo()));
		reportRequest.setTipo(request.getErogazioneFruizioneEnum().equals(ErogazioneFruizioneEnum.EROGAZIONE) ? FiltroRicercaRuoloTransazioneEnum.EROGAZIONE : FiltroRicercaRuoloTransazioneEnum.FRUIZIONE);

		reportRequest.setReport(toReportType(request.getAccept(), request.getTipoReportAndamentoTemporale(), request.getTipoReport(), request.getTipoInformazioneReport()));
		return reportRequest;
	}

	private RicercaStatisticaDistribuzioneTokenInfo getRicercaStatisticaDistribuzioneTokenClientId(GetReportRequest request) {
		RicercaStatisticaDistribuzioneTokenInfo reportRequest = new RicercaStatisticaDistribuzioneTokenInfo();

		reportRequest.setClaim(TokenClaimEnum.CLIENT_ID);
		FiltroApiSoggetti filtroapiSoggetti = getFiltroApiSoggetti(request);
		reportRequest.setApi(filtroapiSoggetti);
		reportRequest.setAzione(request.getOperazione());

		reportRequest.setEsito(getEsito(request.getEsito(), request.getListaCodici()));

		FiltroTemporale interv = getFiltroTemporale(request);

		reportRequest.setIntervalloTemporale(interv);

		reportRequest.setUnitaTempo(getUnitaTempo(request.getUnitaTempo()));
		reportRequest.setTipo(request.getErogazioneFruizioneEnum().equals(ErogazioneFruizioneEnum.EROGAZIONE) ? FiltroRicercaRuoloTransazioneEnum.EROGAZIONE : FiltroRicercaRuoloTransazioneEnum.FRUIZIONE);

		reportRequest.setReport(toReportType(request.getAccept(), request.getTipoReportAndamentoTemporale(), request.getTipoReport(), request.getTipoInformazioneReport()));
		return reportRequest;
	}

	private RicercaStatisticaDistribuzioneTokenInfo getRicercaStatisticaDistribuzioneTokenIssuer(GetReportRequest request) {
		RicercaStatisticaDistribuzioneTokenInfo reportRequest = new RicercaStatisticaDistribuzioneTokenInfo();

		reportRequest.setClaim(TokenClaimEnum.ISSUER);

		FiltroApiSoggetti filtroapiSoggetti = getFiltroApiSoggetti(request);
		reportRequest.setApi(filtroapiSoggetti);
		reportRequest.setAzione(request.getOperazione());

		reportRequest.setEsito(getEsito(request.getEsito(), request.getListaCodici()));

		FiltroTemporale interv = getFiltroTemporale(request);

		reportRequest.setIntervalloTemporale(interv);

		reportRequest.setUnitaTempo(getUnitaTempo(request.getUnitaTempo()));
		reportRequest.setTipo(request.getErogazioneFruizioneEnum().equals(ErogazioneFruizioneEnum.EROGAZIONE) ? FiltroRicercaRuoloTransazioneEnum.EROGAZIONE : FiltroRicercaRuoloTransazioneEnum.FRUIZIONE);

		reportRequest.setReport(toReportType(request.getAccept(), request.getTipoReportAndamentoTemporale(), request.getTipoReport(), request.getTipoInformazioneReport()));
		return reportRequest;
	}

	private RicercaStatisticaDistribuzioneSoggettoRemoto getRicercaStatisticaDistribuzioneSoggettoRemoto(GetReportRequest request) {
		RicercaStatisticaDistribuzioneSoggettoRemoto reportRequest = new RicercaStatisticaDistribuzioneSoggettoRemoto();

		FiltroApiSoggetti filtroapiSoggetti = getFiltroApiSoggetti(request);
		reportRequest.setApi(filtroapiSoggetti);
		
		// Wrap FiltroMittenteErogazioneSoggettoImpl into the appropriate wrapper class
		FiltroMittenteErogazioneSoggettoImpl mittente = getMittenteImpl(request);
		if (mittente != null) {
			reportRequest.setMittente(new RicercaStatisticaDistribuzioneSoggettoRemotoAllOfMittente(mittente));
		}

		reportRequest.setAzione(request.getOperazione());

		reportRequest.setEsito(getEsito(request.getEsito(), request.getListaCodici()));

		FiltroTemporale interv = getFiltroTemporale(request);

		reportRequest.setIntervalloTemporale(interv);

		reportRequest.setUnitaTempo(getUnitaTempo(request.getUnitaTempo()));
		reportRequest.setTipo(request.getErogazioneFruizioneEnum().equals(ErogazioneFruizioneEnum.EROGAZIONE) ? FiltroRicercaRuoloTransazioneEnum.EROGAZIONE : FiltroRicercaRuoloTransazioneEnum.FRUIZIONE);

		reportRequest.setReport(toReportType(request.getAccept(), request.getTipoReportAndamentoTemporale(), request.getTipoReport(), request.getTipoInformazioneReport()));
		return reportRequest;
	}


	private FiltroMittenteErogazioneSoggettoImpl getMittenteImpl(GetReportRequest request) {
		
		if(request.getSoggettoErogatore()!= null && !request.getSoggettoErogatore().equals(request.getSoggettoReferente()) && request.getErogazioneFruizioneEnum().equals(ErogazioneFruizioneEnum.EROGAZIONE)) {
			FiltroMittenteErogazioneSoggettoImpl m = new FiltroMittenteErogazioneSoggettoImpl();
			m.setIdentificazione(TipoFiltroMittenteEnum.EROGAZIONE_SOGGETTO);
			m.setSoggetto(request.getSoggettoErogatore());
			return m;
		}
		
		return null;
	}

	private FiltroTemporale getFiltroTemporale(GetReportRequest request) {
		FiltroTemporale interv = new FiltroTemporale();

		interv.setDataInizio(request.getDataInizio() != null ? request.getDataInizio() : OffsetDateTime.now().minus(Duration.ofDays(7)));
		interv.setDataFine(request.getDataFine() != null ? request.getDataFine() : OffsetDateTime.now());
		return interv;
	}

	private FiltroApiSoggetti getFiltroApiSoggetti(GetReportRequest request) {
		FiltroApiSoggetti filtroapiSoggetti = new FiltroApiSoggetti();
		
		filtroapiSoggetti.setErogatore(request.getSoggettoErogatore());

		filtroapiSoggetti.setNome(request.getApiNome());
		filtroapiSoggetti.setVersione(request.getApiVersione());
		return filtroapiSoggetti;
	}

	private FiltroEsito getEsito(EsitoTransazioneEnum esito, List<Integer> listaCodici) {
		
		if(esito == null) return null;
		FiltroEsito f = new FiltroEsito();
		
		if(esito.equals(EsitoTransazioneEnum.PERSONALIZZATO)) {
			f.setTipo(EsitoTransazioneFullSearchEnum.PERSONALIZZATO);
			f.setCodici(listaCodici);
		} else {
			EsitoTransazioneFullSearchEnum tipo = null;
			switch(esito) {
			case FALLITE: tipo = EsitoTransazioneFullSearchEnum.FALLITE; 
				break;
			case FALLITE_ESCLUDI_SCARTATE:  tipo = EsitoTransazioneFullSearchEnum.FALLITE;
				f.setEscludiScartate(true);
				break;
			case FALLITE_E_FAULT: tipo = EsitoTransazioneFullSearchEnum.FALLITE_E_FAULT;
				break;
			case FALLITE_E_FAULT_ESCLUDI_SCARTATE: tipo = EsitoTransazioneFullSearchEnum.FALLITE_E_FAULT;
				f.escludiScartate(true);
				break;
			case FAULT: tipo = EsitoTransazioneFullSearchEnum.FAULT;
				break;
			case OK: tipo = EsitoTransazioneFullSearchEnum.OK;
				break;
			case PERSONALIZZATO:
				break;
			case QUALSIASI: tipo = EsitoTransazioneFullSearchEnum.QUALSIASI;
				break;
			default:
				break;
			}
			f.setTipo(tipo);
		}
		
		return f;
	}

	private OpzioniGenerazioneReportMultiLine toReportMultiLineType(String accept, TipoReportAndamentoTemporaleEnum tipoReportAndamentoTemporaleEnum, TipoInformazioneReportEnum tipoInformazioneReportEnum) {
		OpzioniGenerazioneReportMultiLine ml = new OpzioniGenerazioneReportMultiLine ();

		FormatoReportEnum formato = null;
		if(accept.equals("text/csv")) {
			formato = FormatoReportEnum.CSV;
		} else if(accept.equals("application/pdf")) {
			formato = FormatoReportEnum.PDF;
		} else if(accept.equals("application/vnd.ms-excel")) {
			formato = FormatoReportEnum.XLS;
		} else {
			formato = FormatoReportEnum.CSV;
		}
		ml.setFormato(formato);
		TipoReportEnum tipo = TipoReportEnum.LINE;
		switch(tipoReportAndamentoTemporaleEnum) {
		case BAR: tipo = TipoReportEnum.BAR;
		break;
		case LINE: tipo = TipoReportEnum.LINE;
		break;
		case TABLE: tipo = TipoReportEnum.TABLE;
		}
		ml.setTipo(tipo);
		OneOfTipoInformazioneReportMultiLineNumeroTransazioniTipoInformazioneReportMultiLineOccupazioneBandaTipoInformazioneReportMultiLineTempoMedioRisposta tipoInfo = null;
		
		switch(tipoInformazioneReportEnum) {
		case NUMERO_TRANSAZIONI: tipoInfo = new NumeroTransazioni();
		break;
		case OCCUPAZIONE_BANDA: tipoInfo = new OccupazioneBanda();
		break;
		case TEMPO_MEDIO_RISPOSTA: tipoInfo = new TempoMedioRisposta();
		break;
		}

		// Wrap the tipoInfo into the appropriate wrapper class
		if (tipoInfo != null) {
			ml.setTipoInformazione(new OpzioniGenerazioneReportMultiLineAllOfTipoInformazione(tipoInfo));
		}

		return ml;
	}

	private OpzioniGenerazioneReport toReportType(String accept, TipoReportAndamentoTemporaleEnum tipoReportAndamentoTemporaleEnum, org.govway.catalogo.servlets.monitor.model.TipoReportEnum tipoReportEnum, TipoInformazioneReportEnum tipoInformazioneReportEnum) {
		OpzioniGenerazioneReport ml = new OpzioniGenerazioneReport();

		FormatoReportEnum formato = null;
		if(accept.equals("text/csv")) {
			formato = FormatoReportEnum.CSV;
		} else if(accept.equals("application/pdf")) {
			formato = FormatoReportEnum.PDF;
		} else if(accept.equals("application/vnd.ms-excel")) {
			formato = FormatoReportEnum.XLS;
		} else {
			formato = FormatoReportEnum.CSV;
		}
		ml.setFormato(formato);

		if(tipoReportAndamentoTemporaleEnum!=null) {
			TipoReportEnum tipo = TipoReportEnum.LINE;
			switch(tipoReportAndamentoTemporaleEnum) {
			case BAR: tipo = TipoReportEnum.BAR;
			break;
			case LINE: tipo = TipoReportEnum.LINE;
			break;
			case TABLE: tipo = TipoReportEnum.TABLE;
			}
			ml.setTipo(tipo);
		} else {
			TipoReportEnum tipo = TipoReportEnum.LINE;
			switch(tipoReportEnum) {
			case BAR: tipo = TipoReportEnum.BAR;
			break;
			case TABLE: tipo = TipoReportEnum.TABLE;
			break;
			case PIE:tipo = TipoReportEnum.PIE;
			break;
			}
			ml.setTipo(tipo);
		}
		
		OneOfTipoInformazioneReportNumeroTransazioniTipoInformazioneReportOccupazioneBandaTipoInformazioneReportTempoMedioRisposta tipoInfo = null;
		
		switch(tipoInformazioneReportEnum) {
		case NUMERO_TRANSAZIONI: tipoInfo = new NumeroTransazioni();
		break;
		case OCCUPAZIONE_BANDA: tipoInfo = new OccupazioneBanda();
		break;
		case TEMPO_MEDIO_RISPOSTA: tipoInfo = new TempoMedioRisposta();
		break;
		}

		// Wrap the tipoInfo into the appropriate wrapper class
		if (tipoInfo != null) {
			ml.setTipoInformazione(new OpzioniGenerazioneReportAllOfTipoInformazione(tipoInfo));
		}

		return ml;
	}

	private UnitaTempoReportEnum getUnitaTempo(org.govway.catalogo.servlets.monitor.model.UnitaTempoReportEnum unitaTempo) {
		switch(unitaTempo) {
		case ORARIO: return UnitaTempoReportEnum.ORARIO;
		case GIORNALIERO:return UnitaTempoReportEnum.GIORNALIERO;
		case SETTIMANALE: return UnitaTempoReportEnum.SETTIMANALE;
		case MENSILE: return UnitaTempoReportEnum.MENSILE;
		}

		return null;
	}

	@Override
	public PostReportResponse postReport(GetReportRequest request) {
		try {
			File result = getResult(request);

			MappingIterator<Map<String, String>> values = null;
			if(result != null) {
				byte[] src = Files.readAllBytes(result.toPath());
				values = getObjectReader().readValues(new String(src));
			} else {
				values = MappingIterator.emptyIterator();
			}

			PostReportResponse response = new PostReportResponse();
			
			final String valoreString = getValoreString(request);

			if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.ANDAMENTO_TEMPORALE)) {
				ReportStatisticoIntervalloTemporale report = new ReportStatisticoIntervalloTemporale();

				List<ReportStatisticoIntervalloTemporaleItem> valori = new ArrayList<>();
				values.forEachRemaining(record -> {

					ReportStatisticoIntervalloTemporaleItem valore = new ReportStatisticoIntervalloTemporaleItem();

					valore.setData(record.get("Data"));
					String v = record.get("Numero Transazioni");
					if(v == null) {
						v = record.get(valoreString);
					}
					valore.setValore(Long.parseLong(v));
//					valore.setValore(Long.parseLong(record.get(valoreString)));
					valori.add(valore);
				});

				report.setValori(valori);
				response.setReportStatisticoIntervalloTemporale(report);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_ESITI)) {
				ReportStatisticoDistribuzioneEsiti report = new ReportStatisticoDistribuzioneEsiti();

				List<ReportStatisticoDistribuzioneEsitiItem> valori = new ArrayList<>();
				values.forEachRemaining(record -> {

					ReportStatisticoDistribuzioneEsitiItem valore = new ReportStatisticoDistribuzioneEsitiItem();

					valore.setData(record.get("Data"));
					valore.setValoreFallite(Long.parseLong(record.get("Fallite")));
					valore.setValoreFault(Long.parseLong(record.get("Fault Applicativo")));
					valore.setValoreOk(Long.parseLong(record.get("Ok")));
					valori.add(valore);
				});

				report.setValori(valori);
				response.setReportStatisticoDistribuzioneEsiti(report);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_ERRORI)) {
				ReportStatisticoDistribuzioneErrori report = new ReportStatisticoDistribuzioneErrori();

				List<ReportStatisticoDistribuzioneErroriItem> valori = new ArrayList<>();
				values.forEachRemaining(record -> {

					ReportStatisticoDistribuzioneErroriItem valore = new ReportStatisticoDistribuzioneErroriItem();

					valore.setDescrizione(record.get("Descrizione"));
					valore.setEsito(record.get("Esito"));
					valore.setValore(Long.parseLong(record.get(valoreString)));
					valori.add(valore);
				});

				report.setValori(valori);
				response.setReportStatisticoDistribuzioneErrori(report);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_API)) {
				ReportStatisticoDistribuzioneAPI report = new ReportStatisticoDistribuzioneAPI();

				List<ReportStatisticoDistribuzioneAPIItem> valori = new ArrayList<>();
				values.forEachRemaining(record -> {

					ReportStatisticoDistribuzioneAPIItem valore = new ReportStatisticoDistribuzioneAPIItem();

					valore.setErogatore(record.get("Erogatore"));
					valore.setNome(record.get("Nome"));
					valore.setValore(Long.parseLong(record.get(valoreString)));
					valori.add(valore);
				});

				report.setValori(valori);
				response.setReportStatisticoDistribuzioneAPI(report);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_APPLICATIVO)) {
				ReportStatisticoDistribuzioneApplicativo report = new ReportStatisticoDistribuzioneApplicativo();

				List<ReportStatisticoDistribuzioneApplicativoItem> valori = new ArrayList<>();
				values.forEachRemaining(record -> {

					ReportStatisticoDistribuzioneApplicativoItem valore = new ReportStatisticoDistribuzioneApplicativoItem();

					valore.setSoggetto(record.get("Soggetto"));
					valore.setNome(record.get("Nome"));
					valore.setValore(Long.parseLong(record.get(valoreString)));
					valori.add(valore);
				});

				report.setValori(valori);
				response.setReportStatisticoDistribuzioneApplicativo(report);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_IP)) {
				ReportStatisticoDistribuzioneIndirizzoIP report = new ReportStatisticoDistribuzioneIndirizzoIP();

				List<ReportStatisticoDistribuzioneIndirizzoIPItem> valori = new ArrayList<>();
				values.forEachRemaining(record -> {

					ReportStatisticoDistribuzioneIndirizzoIPItem valore = new ReportStatisticoDistribuzioneIndirizzoIPItem();

					valore.setIndirizzo(record.get("Indirizzo IP"));
					valore.setValore(Long.parseLong(record.get(valoreString)));
					valori.add(valore);
				});

				report.setValori(valori);
				response.setReportStatisticoDistribuzioneIndirizzoIP(report);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_PRINCIPAL)) {
				ReportStatisticoDistribuzionePrincipal report = new ReportStatisticoDistribuzionePrincipal();

				List<ReportStatisticoDistribuzionePrincipalItem> valori = new ArrayList<>();
				values.forEachRemaining(record -> {

					ReportStatisticoDistribuzionePrincipalItem valore = new ReportStatisticoDistribuzionePrincipalItem();

					valore.setIndirizzo(record.get("Indirizzo"));
					valore.setValore(Long.parseLong(record.get(valoreString)));
					valori.add(valore);
				});

				report.setValori(valori);
				response.setReportStatisticoDistribuzionePrincipal(report);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_OPERAZIONE)) {
				ReportStatisticoDistribuzioneOperazione report = new ReportStatisticoDistribuzioneOperazione();

				List<ReportStatisticoDistribuzioneOperazioneItem> valori = new ArrayList<>();
				values.forEachRemaining(record -> {

					ReportStatisticoDistribuzioneOperazioneItem valore = new ReportStatisticoDistribuzioneOperazioneItem();

					valore.setErogatore(record.get("Erogatore"));
					valore.setNome(record.get("API"));
					valore.setOperazione(record.get("Azione"));
					valore.setValore(Long.parseLong(record.get(valoreString)));
					valori.add(valore);
				});

				report.setValori(valori);
				response.setReportStatisticoDistribuzioneOperazione(report);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_SOGGETTO_REMOTO)) {
				ReportStatisticoDistribuzioneSoggettoRemoto report = new ReportStatisticoDistribuzioneSoggettoRemoto();

				List<ReportStatisticoDistribuzioneSoggettoRemotoItem> valori = new ArrayList<>();
				values.forEachRemaining(record -> {

					ReportStatisticoDistribuzioneSoggettoRemotoItem valore = new ReportStatisticoDistribuzioneSoggettoRemotoItem();

					valore.setNome(record.get("Soggetto"));
					valore.setValore(Long.parseLong(record.get(valoreString)));
					valori.add(valore);
				});

				report.setValori(valori);
				response.setReportStatisticoDistribuzioneSoggettoRemoto(report);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_TOKEN_CLIENT_ID)) {
				ReportStatisticoDistribuzioneTokenClientId report = new ReportStatisticoDistribuzioneTokenClientId();

				List<ReportStatisticoDistribuzioneTokenClientIdItem> valori = new ArrayList<>();
				values.forEachRemaining(record -> {

					ReportStatisticoDistribuzioneTokenClientIdItem valore = new ReportStatisticoDistribuzioneTokenClientIdItem();

					valore.setApplicativo(record.get("Applicativo"));
					valore.setClientId(record.get("Client ID"));
					valore.setSoggetto(record.get("Soggetto"));
					valore.setValore(Long.parseLong(record.get(valoreString)));
					valori.add(valore);
				});

				report.setValori(valori);
				response.setReportStatisticoDistribuzioneTokenClientId(report);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_TOKEN_ISSUER)) {
				ReportStatisticoDistribuzioneTokenIssuer report = new ReportStatisticoDistribuzioneTokenIssuer();

				List<ReportStatisticoDistribuzioneTokenIssuerItem> valori = new ArrayList<>();
				values.forEachRemaining(record -> {

					ReportStatisticoDistribuzioneTokenIssuerItem valore = new ReportStatisticoDistribuzioneTokenIssuerItem();

					valore.setIssuer(record.get("Issuer"));
					valore.setValore(Long.parseLong(record.get(valoreString)));
					valori.add(valore);
				});

				report.setValori(valori);
				response.setReportStatisticoDistribuzioneTokenIssuer(report);
			}

			return response;
		} catch(Exception e) {
			this.logger.error("Errore nell'invocazione del monitoraggio: " +e.getMessage(),e);
			throw new InternalException(e.getMessage());
		}
	}

	private String getValoreString(GetReportRequest request) {
		String valoreString = null;
		switch(request.getTipoInformazioneReport()) {
		case NUMERO_TRANSAZIONI: valoreString = "Numero Transazioni";
			break;
		case OCCUPAZIONE_BANDA: valoreString = "Occupazione Banda Complessiva [bytes]";
			break;
		case TEMPO_MEDIO_RISPOSTA: valoreString = "Latenza Media Totale [ms]";
			break;
		default:
			break;}
		return valoreString;
	}

	private File getResult(GetReportRequest request) throws ApiException {
		PatchedApiClient client = getClient(request.getConfigurazioneConnessione());
		ReportisticaApi mon = new ReportisticaApi(client);

		try {
			File result = null;
			if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.ANDAMENTO_TEMPORALE)) {
				RicercaStatisticaAndamentoTemporale reportRequest = getRicercaStatisticaAndamentoTemporale(request);
				result = mon.getReportDistribuzioneTemporaleByFullSearch(request.getProfilo(), request.getSoggettoReferente(), reportRequest);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_ESITI)) {
				RicercaStatisticaDistribuzioneEsiti reportRequest = getRicercaStatisticaDistribuzioneEsiti(request);
				result = mon.getReportDistribuzioneEsitiByFullSearch(request.getProfilo(), request.getSoggettoReferente(), reportRequest);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_ERRORI)) {
				RicercaStatisticaDistribuzioneErrori reportRequest = getRicercaStatisticaDistribuzioneErrori(request);
				result = mon.getReportDistribuzioneErroriByFullSearch(request.getProfilo(), request.getSoggettoReferente(), reportRequest);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_API)) {
				RicercaStatisticaDistribuzioneApi reportRequest = getRicercaStatisticaDistribuzioneApi(request);
				result = mon.getReportDistribuzioneApiByFullSearch(request.getProfilo(), request.getSoggettoReferente(), reportRequest);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_APPLICATIVO)) {
				RicercaStatisticaDistribuzioneApplicativoRegistrato reportRequest = getRicercaStatisticaDistribuzioneApplicativo(request);
				result = mon.getReportDistribuzioneApplicativoByFullSearch(request.getProfilo(), request.getSoggettoReferente(), reportRequest);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_IP)) {
				RicercaStatisticaDistribuzioneApplicativo reportRequest = getRicercaStatisticaDistribuzioneIP(request);
				result = mon.getReportDistribuzioneIndirizzoIPByFullSearch(request.getProfilo(), request.getSoggettoReferente(), reportRequest);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_PRINCIPAL)) {
				RicercaStatisticaDistribuzioneApplicativo reportRequest = getRicercaStatisticaDistribuzionePrincipal(request);
				result = mon.getReportDistribuzioneIdAutenticatoByFullSearch(request.getProfilo(), request.getSoggettoReferente(), reportRequest);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_OPERAZIONE)) {
				RicercaStatisticaDistribuzioneAzione reportRequest = getRicercaStatisticaDistribuzioneOperazione(request);
				result = mon.getReportDistribuzioneAzioneByFullSearch(request.getProfilo(), request.getSoggettoReferente(), reportRequest);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_SOGGETTO_REMOTO)) {
				RicercaStatisticaDistribuzioneSoggettoRemoto reportRequest = getRicercaStatisticaDistribuzioneSoggettoRemoto(request);
				result = mon.getReportDistribuzioneSoggettoRemotoByFullSearch(request.getProfilo(), request.getSoggettoReferente(), reportRequest);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_TOKEN_CLIENT_ID)) {
				RicercaStatisticaDistribuzioneTokenInfo reportRequest = getRicercaStatisticaDistribuzioneTokenClientId(request);
				result = mon.getReportDistribuzioneTokenInfoByFullSearch(request.getProfilo(), request.getSoggettoReferente(), reportRequest);
			} else if(request.getTipologiaReportEnum().equals(TipologiaReportEnum.DISTRIBUZIONE_TOKEN_ISSUER)) {
				RicercaStatisticaDistribuzioneTokenInfo reportRequest = getRicercaStatisticaDistribuzioneTokenIssuer(request);
				result = mon.getReportDistribuzioneTokenInfoByFullSearch(request.getProfilo(), request.getSoggettoReferente(), reportRequest);
			}
			return result;
		} catch (ApiException e) {
			if(e.getCode() == 404) {
				return null;
			} else {
				throw e;
			}
		}
	}

	private ObjectReader getObjectReader() {
		return new CsvMapper()
				.enable(CsvParser.Feature.SKIP_EMPTY_LINES)
				.readerFor(Map.class)        
				.with(
						CsvSchema.emptySchema()
						.withHeader()                  
						.withColumnSeparator(',')
						.withQuoteChar('"')
						.withNullValue("")

						);
	}

	@Override
	public GetStatoResponse getStato(GetStatoRequest request) {
		List<String> tipi = getTipiVerifica(request.getTipoVerifica());
		
		long countPeriodo1 = countEventi(request.getSoggetto(), request.getConfigurazioneConnessione(), tipi, request.getPeriodo1DataInizioVerifica(), request.getPeriodo1DataFineVerifica());
		long countPeriodo2 = countEventi(request.getSoggetto(), request.getConfigurazioneConnessione(), tipi, request.getPeriodo2DataInizioVerifica(), request.getPeriodo2DataFineVerifica());
		
		GetStatoResponse getStatoResponse = new GetStatoResponse();
		ResocontoVerificaConnettivitaPeriodo rvcp = new ResocontoVerificaConnettivitaPeriodo();
		
		rvcp.setPeriodo1(countPeriodo1);
		rvcp.setPeriodo2(countPeriodo2);
		
		getStatoResponse.setResocontoVerificaConnettivitaPeriodo(rvcp);
		return getStatoResponse;
	}

	private List<String> getTipiVerifica(TipoVerifica tipoVerifica) {
		List<String> tipi = new ArrayList<>();
		
		switch(tipoVerifica) {
		case CONNECTION_TIMEOUT: tipi.add("ControlloTraffico_ConnectionTimeout");
			break;
		case RATE_LIMITING: 
			tipi.add("RateLimiting_PolicyGlobale");
			tipi.add("RateLimiting_PolicyAPI");
			break;
		case READ_TIMEOUT:
			tipi.add("ControlloTraffico_ReadTimeout");
			tipi.add("ControlloTraffico_RequestReadTimeout");
			break;
		default:
			break;
		
		}
		return tipi;
	}

	private long countEventi(String soggetto, ConfigurazioneConnessione conf, List<String> tipi, OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica) {
		return this.getEventi(soggetto, conf, tipi, dataInizioVerifica, dataFineVerifica).size();
	}

	private Collection<ItemServizioVerificato> getEventi(String soggetto, ConfigurazioneConnessione conf, List<String> tipi, OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica) {
		Map<String, ItemServizioVerificato> map = new HashMap<>();
		
		
		return this.apiService.runTransaction(() -> {
			for(String tipo: tipi) {
				try {
					List<Evento> resp = this.govwayCache.findAllEventi(conf, dataInizioVerifica, dataFineVerifica, tipo);
						
					for(Evento item: resp) {
						String origine = item.getOrigine();
						ItemServizioVerificato i = getServizio(origine, soggetto, tipo);
						if(i != null) {
							String k = i.getIdServizio().toString();
							map.put(k, i);
						}
					}
				} catch (ApiException e) {
					throw new InternalException("Errore durante la findAllEventi: " + e.getMessage());
				}
			}
			return map.values();
		});
	}

	private EsitoVerificaEventi getEsitoVerificaEventi(ConfigurazioneConnessione conf, List<String> tipi, String origine, ApiEntity api, OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica) {
		Map<String, GetEsitoVerificaEventiItem> map = new HashMap<>();
		for(String tipo: tipi) {
			try {
				List<Evento> resp = this.govwayCache.findAllEventi(conf, dataInizioVerifica, dataFineVerifica, tipo);
				for(Evento item: resp) {

					GetEsitoVerificaEventiItem getEsito = getEsito(item);

					if(map.containsKey(getEsito.getGruppo())) {
						Errore errore = getEsito.getListErrori().get(0);
						map.get(getEsito.getGruppo()).addErrore(errore.getDescrizione(), errore.getDates().get(0));
					} else {
						map.put(getEsito.getGruppo(), getEsito);
					}

				}
			} catch (ApiException e) {
				throw new InternalException("Errore durante la findAllEventi: " + e.getMessage());
			}
		}
		EsitoVerificaEventi eve = new EsitoVerificaEventi();
		if(map.isEmpty()) {
			eve.setEsito(EsitoVerificaEventiEnum.OK);
		} else {
			eve.setEsito(EsitoVerificaEventiEnum.ERRORE);
			eve.setDettagli(map.values().stream().map(e -> {return e.toString();}).collect(Collectors.joining("\n")));
		}
		return eve;
	}
	
	private GetEsitoVerificaEventiItem getEsito(Evento item) {
		GetEsitoVerificaEventiItem getEsito = new GetEsitoVerificaEventiItem();

		getEsito.setGruppo(getGruppo(item));
		getEsito.addErrore(getDescrizione(item), Date.from(item.getOraRegistrazione().toInstant()));
		
		return getEsito;
	}

	private String getGruppo(Evento item) {
		String[] split = item.getOrigine().split("/");
		
		String versione;
		if(split.length == 3) {
			versione = split[2];
		} else if(split.length == 4) {
			versione = split[3];
		} else {
			throw new InternalException("Formato dell'origine ["+item.getOrigine()+"] non riconosciuto");
		}

		if(versione.contains("(") && versione.contains(")")) {
			versione = versione.substring(versione.indexOf("(")+1,versione.indexOf(")"));
			return versione.replaceAll("'","").replace("gruppo ", "");
		} else {
			return "Predefinito";
		}

	}

	private String getDescrizione(Evento item) {
		if(item.getDescrizione()!=null) {
			return item.getDescrizione();
		} else {
			if(item.getTipo().equals("ControlloTraffico_ConnectionTimeout")) {
				return "Connessione non stabilita entro il timeout specificato";
			} else if(item.getTipo().equals("ControlloTraffico_RequestReadTimeout")) {
				return "Richiesta non ricevuta entro il timeout specificato";
			} else if(item.getTipo().equals("ControlloTraffico_ReadTimeout")) {
				return "Risposta non ricevuta entro il timeout specificato";
			} else if(item.getTipo().equals("RateLimiting_PolicyGlobale")) {
				String nomePolicy = parseNomePolicy(item.getOrigine());
				return "Rilevata violazione della policy globale ‘"+nomePolicy+"'";
			} else if(item.getTipo().equals("RateLimiting_PolicyAPI")) {
				String nomePolicy = parseNomePolicy(item.getOrigine());
				return "Rilevata violazione della policy ‘"+nomePolicy+"'";
			} else {
				return "Descrizione - tipo: " + item.getTipo();
			}
		}

	}

	private String parseNomePolicy(String origine) {
		return origine.split(" - API")[0];
	}

	@Override
	public GetDetailResponse getDetail(GetDetailRequest request) {
		List<String> tipi = getTipiVerifica(request.getTipoVerifica());
		
		GetDetailResponse getDetailResponse = new GetDetailResponse();
		Collection<ItemServizioVerificato> set = getEventi(request.getSoggetto(), request.getConfigurazioneConnessione(), tipi, request.getDataInizioVerifica(), request.getDataFineVerifica());
		
		getDetailResponse.setListServiziVerificati(set.stream().collect(Collectors.toList()));

		return getDetailResponse;
	}

	private ItemServizioVerificato getServizio(String origine, String soggetto, String tipo) {
		String[] split = origine.split("/");
		
		String erogatore;
		String nomeApi;
		String versione;
		if(split.length == 3) {
			erogatore = split[0];
			nomeApi = split[1];
			versione = split[2];
		} else if(split.length == 4) {
			erogatore = split[0];
			nomeApi = split[2];
			versione = split[3];
		} else {
			throw new InternalException("Formato dell'origine ["+origine+"] non riconosciuto");
		}

		if(tipo.contains("RateLimiting")) {
			erogatore = erogatore.substring(erogatore.indexOf(":") + 1).replaceAll(" ", "");
		}
		
		if(versione.contains("(")) {
			versione = versione.substring(0, versione.indexOf("("));
		}

		versione = versione.replaceAll(" ", "").replaceAll("v", "");
		
		String erogatoreAtteso = soggetto;
		
		if(!erogatoreAtteso.equals(erogatore)) {
			return null;
		}
		
		Optional<ApiEntity> api = this.catalogoCache.getApiEntity(erogatoreAtteso, nomeApi, Integer.parseInt(versione));

		if(api.isPresent()) {
			return getItemServizioVerificato(api.get());
		} else {
			return null;
		}
	}

	private ItemServizioVerificato getItemServizioVerificato(ApiEntity apiEntity) {
		
		ServizioEntity servizio = apiEntity.getServizio();
		ItemServizioVerificato isv = new ItemServizioVerificato();
		
		isv.setIdServizio(UUID.fromString(servizio.getIdServizio()));
		isv.setNome(servizio.getNome());
		isv.setVersione(Integer.parseInt(servizio.getVersione()));
		
		return isv;
	}

	@Override
	public GetInformazioniPuntualiResponse getInformazioniPuntuali(GetInformazioniPuntualiRequest request) {

		return this.apiService.runTransaction(() -> {
					
			List<String> tipi = getTipiVerifica(request.getTipoVerifica());
			
			String origine;
			String erogatore = request.getSoggetto();		
	
			ApiEntity api = this.catalogoCache.getApiEntity(erogatore, request.getName(), request.getVersion())
					.orElseThrow(() -> new NotFoundException("Api ["+request.getName()+"/"+request.getVersion()+"/"+erogatore+"] non trovata"));
			
			if(request.getProvider() != null) {
				
				SoggettoEntity soggProvider = this.catalogoCache.getSoggetto(request.getProvider());			
	
				ServizioEntity servizio = api.getServizio();
				
				long count = this.catalogoCache.countAdesioni(servizio.getIdServizio(), soggProvider.getIdSoggetto());
				
				if(count <= 0) {
					throw new NotFoundException("Adesione del soggetto ["+request.getProvider()+"] al servizio ["+servizio.getNome()+"/"+servizio.getVersione() + "] non trovata");
				}
	
				origine = erogatore+"/"+request.getProvider()+"/"+request.getName()+"/v"+request.getVersion();
			} else {
				origine = erogatore+"/"+request.getName()+"/v"+request.getVersion();
			}
			GetInformazioniPuntualiResponse getInformazioniPuntualiResponse = new GetInformazioniPuntualiResponse();
			EsitoVerificaEventi eve = getEsitoVerificaEventi(request.getConfigurazioneConnessione(), tipi, origine, api, request.getDataInizioVerifica(), request.getDataFineVerifica());
			
			getInformazioniPuntualiResponse.setEsitoVerificaEventi(eve);
	
			return getInformazioniPuntualiResponse;
		});
	}
}
