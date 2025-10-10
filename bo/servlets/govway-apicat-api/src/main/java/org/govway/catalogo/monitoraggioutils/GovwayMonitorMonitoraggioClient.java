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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.gest.clients.govwaymonitor.PatchedApiClient;
import org.govway.catalogo.gest.clients.govwaymonitor.api.MonitoraggioApi;
import org.govway.catalogo.gest.clients.govwaymonitor.impl.ApiException;
import org.govway.catalogo.gest.clients.govwaymonitor.model.DetailTransazione;
import org.govway.catalogo.gest.clients.govwaymonitor.model.EsitoTransazioneFullSearchEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroApiSoggetti;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroEsito;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroMittenteErogazioneSoggettoImpl;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroRicercaRuoloTransazioneEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroTemporale;
import org.govway.catalogo.gest.clients.govwaymonitor.model.ListaTransazioni;
import org.govway.catalogo.gest.clients.govwaymonitor.model.ProfiloEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaIntervalloTemporale;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TipoFiltroMittenteEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TransazioneExtInformazioniApi;
import org.govway.catalogo.monitoraggioutils.transazioni.GetTransazioneRequest;
import org.govway.catalogo.monitoraggioutils.transazioni.GetTransazioneResponse;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniRawResponse;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniRequest;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniResponse;
import org.govway.catalogo.monitoraggioutils.transazioni.TransazioneBuilder;
import org.govway.catalogo.servlets.monitor.model.ItemSoggetto;
import org.govway.catalogo.servlets.monitor.model.ItemTransazione;
import org.govway.catalogo.servlets.monitor.model.PagedModelItemTransazione;
import org.govway.catalogo.servlets.monitor.model.Transazione;
import org.govway.catalogo.servlets.monitor.model.TransazioneApi;
import org.govway.catalogo.servlets.monitor.model.TransazioneDatiMittente;
import org.govway.catalogo.servlets.monitor.model.TransazioneEsito;
import org.govway.catalogo.servlets.monitor.model.TransazioneMittente;
import org.govway.catalogo.servlets.monitor.model.TransazioneRichiesta;
import org.govway.catalogo.servlets.monitor.model.TransazioneRisposta;
import org.govway.catalogo.servlets.monitor.model.TransazioneToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
public class GovwayMonitorMonitoraggioClient extends AbstractGovwayMonitorClient implements IMonitoraggioClient{

	private Logger logger = LoggerFactory.getLogger(GovwayMonitorMonitoraggioClient.class);

	@Autowired
	private TransazioneBuilder transazioneBuilder;
	
	@Override
	public GetTransazioneResponse getTransazione(GetTransazioneRequest request) {

		try {
			PatchedApiClient client = getClient(request.getConfigurazioneConnessione());

			MonitoraggioApi mon = new MonitoraggioApi(client);

			DetailTransazione transazione = mon.getTransazione(request.getIdTransazione());

			GetTransazioneResponse response = new GetTransazioneResponse();

			Transazione itemTransazione = toTransazione(transazione);
			response.setTransazione(itemTransazione);
			return response;
		} catch(Exception e) {
			this.logger.error("Errore nell'invocazione del monitoraggio: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	public ItemTransazione toTransazione(org.govway.catalogo.gest.clients.govwaymonitor.model.ItemTransazione transazioneDB) {
		ItemTransazione transazione = new ItemTransazione();

		transazione.setIdApplicativo(transazioneDB.getIdConversazione());
		transazione.setIdTraccia(transazioneDB.getIdTraccia().toString());
		transazione.setIdCluster(transazioneDB.getIdCluster());
		transazione.setData(transazioneDB.getRichiesta().getDataRicezione());

		// latenza totale = risposta.data_consegna -  richiesta.data_ricezione
		
		long latenzaTotale = transazioneDB.getRisposta().getDataConsegna().toInstant().toEpochMilli() - transazioneDB.getRichiesta().getDataRicezione().toInstant().toEpochMilli(); 
		
		transazione.setTempoElaborazione(latenzaTotale);

		// latenza servizio = risposta.data_ricezione -  richiesta.data_consegna (verificare che entrambe siano null)
		
		if(transazioneDB.getRisposta().getDataRicezione() != null &&
				transazioneDB.getRichiesta().getDataConsegna() != null) {
			long latenzaServizio = transazioneDB.getRisposta().getDataRicezione().toInstant().toEpochMilli() - transazioneDB.getRichiesta().getDataConsegna().toInstant().toEpochMilli(); 

			transazione.setTempoRispostaServizio(latenzaServizio);
		}

		transazione.setProfilo(transazioneDB.getProfilo().toString());
		transazione.setRichiedente(transazioneDB.getRichiedente());
		
		
		if(transazioneDB.getRisposta()!= null) {
			try {
				int esito = Integer.parseInt(transazioneDB.getRisposta().getEsitoConsegna());
				transazione.setReturnCodeHttp(esito);
			} catch(Exception e) {}
		}
		transazione.setProfilo(transazioneDB.getProfilo().toString());
		
		
		
		if(transazioneDB.getEsito() != null) {
			TransazioneEsito esito = new TransazioneEsito();
			esito.setCodice(transazioneDB.getEsito().getCodice());
			esito.setDescrizione(transazioneDB.getEsito().getDescrizione());
			transazione.setEsito(esito);
		}
		
		if(transazioneDB.getApi() != null) {
			TransazioneApi api = new TransazioneApi();
			api.setNome(transazioneDB.getApi().getNome());
			api.setVersione(transazioneDB.getApi().getVersione());
			api.setErogatore(toSoggetto(transazioneDB.getApi().getErogatore()));
			
			api.setOperazione(transazioneDB.getApi().getOperazione());
			
			api.setTags(transazioneDB.getApi().getTags());
			
			if(transazioneDB.getApi().getInformazioniErogatore()!=null){
				api.setProfiloCollaborazione(transazioneDB.getApi().getInformazioniErogatore().getTipo());
			}
			
			transazione.setApi(api);
		}

		return transazione;
	}

	public Transazione toTransazione(org.govway.catalogo.gest.clients.govwaymonitor.model.DetailTransazione transazioneDB) {
		Transazione transazione = new Transazione();

		transazione.setIdApplicativo(transazioneDB.getIdConversazione());
		transazione.setIdTraccia(transazioneDB.getIdTraccia().toString());
		transazione.setIdCluster(transazioneDB.getIdCluster());
		
		// latenza totale = risposta.data_consegna -  richiesta.data_ricezione
		
		long latenzaTotale = transazioneDB.getRisposta().getDataConsegna().toInstant().toEpochMilli() - transazioneDB.getRichiesta().getDataRicezione().toInstant().toEpochMilli(); 
		
		transazione.setTempoElaborazione(latenzaTotale);

		// latenza servizio = risposta.data_ricezione -  richiesta.data_consegna (verificare che entrambe siano valorizzate)
		
		if(transazioneDB.getRisposta().getDataRicezione() != null &&
				transazioneDB.getRichiesta().getDataConsegna() != null) {
			long latenzaServizio = transazioneDB.getRisposta().getDataRicezione().toInstant().toEpochMilli() - transazioneDB.getRichiesta().getDataConsegna().toInstant().toEpochMilli(); 

			transazione.setTempoRispostaServizio(latenzaServizio);
		}
		
		transazione.setProfilo(transazioneDB.getProfilo().toString());
		transazione.setRichiedente(transazioneDB.getRichiedente());
		
		transazione.setDettaglioErrore(transazioneDB.getDettaglioErrore());
		
		if(transazioneDB.getApi() != null) {
			TransazioneApi api = new TransazioneApi();
			api.setNome(transazioneDB.getApi().getNome());
			api.setVersione(transazioneDB.getApi().getVersione());
			api.setErogatore(toSoggetto(transazioneDB.getApi().getErogatore()));
			
			api.setOperazione(transazioneDB.getApi().getOperazione());
			
			api.setTags(transazioneDB.getApi().getTags());
			
			if(transazioneDB.getApi().getInformazioniErogatore()!=null){
				api.setProfiloCollaborazione(transazioneDB.getApi().getInformazioniErogatore().getTipo());
			}
			
			transazione.setRuoloComponent(null);
			
			transazione.setApi(api);
		}

		if(transazioneDB.getEsito() != null) {
//			EsitoTransazioneEnum codiceEsito = getEsito(transazioneDB.getEsito().getCodice());
//
//			if(codiceEsito != null) {
				TransazioneEsito esito = new TransazioneEsito();
				esito.setCodice(transazioneDB.getEsito().getCodice());
				esito.setDescrizione(transazioneDB.getEsito().getDescrizione());

				transazione.setEsito(esito);
//			} else {
//				throw new InternalException("Codice ["+transazioneDB.getEsito().getCodice()+"] non gestito");
//			}
		}

		if(transazioneDB.getRichiesta()!=null) {
			TransazioneRichiesta richiesta = new TransazioneRichiesta();
			richiesta.setDataConsegna(transazioneDB.getRichiesta().getDataConsegna());
			richiesta.setDataRicezione(transazioneDB.getRichiesta().getDataRicezione());
			
			richiesta.setDimensioneRicezione(transazioneDB.getRichiesta().getBytesIngresso());
			richiesta.setDimensioneConsegna(transazioneDB.getRichiesta().getBytesUscita());
			//TODO perché in ricezione e in spedizione?? non ha senso quanto scritto 

			richiesta.setIdCorrelazione(transazioneDB.getRichiesta().getIdApplicativo());
			richiesta.setIdMessaggio(transazioneDB.getRichiesta().getId());

			transazione.setRichiesta(richiesta);

			transazione.setData(transazioneDB.getRichiesta().getDataAccettazione());
			transazione.setConnettore(transazioneDB.getRichiesta().getConnettore());

		}

		if(transazioneDB.getRisposta()!=null) {
			TransazioneRisposta risposta = new TransazioneRisposta();
			risposta.setDataConsegna(transazioneDB.getRisposta().getDataConsegna());
			risposta.setDataRicezione(transazioneDB.getRisposta().getDataRicezione());

			risposta.setDimensioneRicezione(transazioneDB.getRisposta().getBytesIngresso());
			risposta.setDimensioneConsegna(transazioneDB.getRisposta().getBytesUscita());

			risposta.setIdCorrelazione(transazioneDB.getRisposta().getIdApplicativo());
			risposta.setIdMessaggio(transazioneDB.getRisposta().getId());

			risposta.setFaultConsegna(transazioneDB.getRisposta().getFaultConsegna());
			risposta.setFaultRicezione(transazioneDB.getRisposta().getFaultRicezione());

			transazione.setRisposta(risposta);

			transazione.setReturnCodeHttp(Integer.parseInt(transazioneDB.getRisposta().getEsitoConsegna()));
			
			if(transazioneDB.getRisposta().getEsitoRicezione() != null) {
				transazione.setReturnCodeHttpBackend(Integer.parseInt(transazioneDB.getRisposta().getEsitoRicezione()));
			}
		}
		
		if(transazioneDB.getMittente()!=null) {
			TransazioneMittente mittente = new TransazioneMittente();
			mittente.setFruitore(toSoggetto(transazioneDB.getMittente().getFruitore()));
			mittente.setApplicativo(transazioneDB.getMittente().getApplicativo());
			transazione.setMittente(mittente);
			
			
			TransazioneDatiMittente datiMittente = new TransazioneDatiMittente();
			datiMittente.setCredenziali(transazioneDB.getMittente().getCredenziali());
			datiMittente.setIndirizzoIp(transazioneDB.getMittente().getIndirizzoClient());
			datiMittente.setIndirizzoIpInoltrato(transazioneDB.getMittente().getIndirizzoClientInoltrato());
			datiMittente.setMetodoHttp(transazioneDB.getRichiesta().getTipo().toString());
			datiMittente.setPrincipal(transazioneDB.getMittente().getPrincipal());
			datiMittente.setUrlInvocazione(transazioneDB.getRichiesta().getUrlInvocazione());
			transazione.setDatiMittente(datiMittente);

			if(transazioneDB.getMittente().getInformazioniToken() != null) {
				TransazioneToken token = new TransazioneToken();
				token.setClientId(transazioneDB.getMittente().getInformazioniToken().getClientId());
				token.setEmail(transazioneDB.getMittente().getInformazioniToken().getMail());
				token.setIssuer(transazioneDB.getMittente().getInformazioniToken().getIssuer());
				token.setSubject(transazioneDB.getMittente().getInformazioniToken().getSubject());
				token.setUsername(transazioneDB.getMittente().getInformazioniToken().getUsername());

				if(transazioneDB.getMittente().getApplicativoToken()!=null) {
					token.setApplicativo(transazioneDB.getMittente().getApplicativoToken().getNome());
					token.setSoggetto(transazioneDB.getMittente().getApplicativoToken().getSoggetto());
				}
				
				token.setToken(transazioneDB.getMittente().getToken());
				
				if(token.getToken()!= null ||
						token.getClientId()!= null ||
						token.getEmail()!= null ||
						token.getIssuer()!= null ||
						token.getSubject()!= null ||
						token.getUsername()!= null ||
						token.getApplicativo()!= null ||
						token.getSoggetto()!= null) {
					transazione.setToken(token);
				}
				
			}

		}

		transazione.setTempoElaborazione(transazioneDB.getLatenzaTotale());
		
		return transazione;
	}


	public ItemTransazione toItemTransazione(org.govway.catalogo.gest.clients.govwaymonitor.model.DetailTransazione transazioneDB) {
		ItemTransazione transazione = new ItemTransazione();

		transazione.setIdApplicativo(transazioneDB.getIdConversazione());
		transazione.setIdTraccia(transazioneDB.getIdTraccia().toString());
		transazione.setIdCluster(transazioneDB.getIdCluster());
		
		// latenza totale = risposta.data_consegna -  richiesta.data_ricezione
		
		long latenzaTotale = transazioneDB.getRisposta().getDataConsegna().toInstant().toEpochMilli() - transazioneDB.getRichiesta().getDataRicezione().toInstant().toEpochMilli(); 
		
		transazione.setTempoElaborazione(latenzaTotale);

		// latenza servizio = risposta.data_ricezione -  richiesta.data_consegna (verificare che entrambe siano valorizzate)
		
		if(transazioneDB.getRisposta().getDataRicezione() != null &&
				transazioneDB.getRichiesta().getDataConsegna() != null) {
			long latenzaServizio = transazioneDB.getRisposta().getDataRicezione().toInstant().toEpochMilli() - transazioneDB.getRichiesta().getDataConsegna().toInstant().toEpochMilli(); 

			transazione.setTempoRispostaServizio(latenzaServizio);
		}
		
		transazione.setProfilo(transazioneDB.getProfilo().toString());
		transazione.setRichiedente(transazioneDB.getRichiedente());
		
		if(transazioneDB.getApi() != null) {
			TransazioneApi api = new TransazioneApi();
			api.setNome(transazioneDB.getApi().getNome());
			api.setVersione(transazioneDB.getApi().getVersione());
			api.setErogatore(toSoggetto(transazioneDB.getApi().getErogatore()));
			
			api.setOperazione(transazioneDB.getApi().getOperazione());
			
			api.setTags(transazioneDB.getApi().getTags());
			
			if(transazioneDB.getApi().getInformazioniErogatore()!=null){
				api.setProfiloCollaborazione(transazioneDB.getApi().getInformazioniErogatore().getTipo());
			}
			
			transazione.setRuoloComponent(null);
			
			transazione.setApi(api);
		}

		if(transazioneDB.getEsito() != null) {
//			EsitoTransazioneEnum codiceEsito = getEsito(transazioneDB.getEsito().getCodice());
//
//			if(codiceEsito != null) {
				TransazioneEsito esito = new TransazioneEsito();
				esito.setCodice(transazioneDB.getEsito().getCodice());
				esito.setDescrizione(transazioneDB.getEsito().getDescrizione());

				transazione.setEsito(esito);
//			} else {
//				throw new InternalException("Codice ["+transazioneDB.getEsito().getCodice()+"] non gestito");
//			}
		}

		if(transazioneDB.getRichiesta()!=null) {
			TransazioneRichiesta richiesta = new TransazioneRichiesta();
			richiesta.setDataConsegna(transazioneDB.getRichiesta().getDataConsegna());
			richiesta.setDataRicezione(transazioneDB.getRichiesta().getDataRicezione());
			
			richiesta.setDimensioneRicezione(transazioneDB.getRichiesta().getBytesIngresso());
			richiesta.setDimensioneConsegna(transazioneDB.getRichiesta().getBytesUscita());
			//TODO perché in ricezione e in spedizione?? non ha senso quanto scritto 

			richiesta.setIdCorrelazione(transazioneDB.getRichiesta().getIdApplicativo());
			richiesta.setIdMessaggio(transazioneDB.getRichiesta().getId());


			transazione.setData(transazioneDB.getRichiesta().getDataAccettazione());
		}

		if(transazioneDB.getRisposta()!=null) {
			TransazioneRisposta risposta = new TransazioneRisposta();
			risposta.setDataConsegna(transazioneDB.getRisposta().getDataConsegna());
			risposta.setDataRicezione(transazioneDB.getRisposta().getDataRicezione());

			risposta.setDimensioneRicezione(transazioneDB.getRisposta().getBytesIngresso());
			risposta.setDimensioneConsegna(transazioneDB.getRisposta().getBytesUscita());

			risposta.setIdCorrelazione(transazioneDB.getRisposta().getIdApplicativo());
			risposta.setIdMessaggio(transazioneDB.getRisposta().getId());

			risposta.setFaultConsegna(transazioneDB.getRisposta().getFaultConsegna());
			risposta.setFaultRicezione(transazioneDB.getRisposta().getFaultRicezione());


			transazione.setReturnCodeHttp(Integer.parseInt(transazioneDB.getRisposta().getEsitoConsegna()));
			
		}
		
		if(transazioneDB.getMittente()!=null) {
			TransazioneMittente mittente = new TransazioneMittente();
			mittente.setFruitore(toSoggetto(transazioneDB.getMittente().getFruitore()));
			mittente.setApplicativo(transazioneDB.getMittente().getApplicativo());
			
			
			TransazioneDatiMittente datiMittente = new TransazioneDatiMittente();
			datiMittente.setCredenziali(transazioneDB.getMittente().getCredenziali());
			datiMittente.setIndirizzoIp(transazioneDB.getMittente().getIndirizzoClient());
			datiMittente.setIndirizzoIpInoltrato(transazioneDB.getMittente().getIndirizzoClientInoltrato());
			datiMittente.setMetodoHttp(transazioneDB.getRichiesta().getTipo().toString());
			datiMittente.setPrincipal(transazioneDB.getMittente().getPrincipal());
			datiMittente.setUrlInvocazione(transazioneDB.getRichiesta().getUrlInvocazione());

			if(transazioneDB.getMittente().getInformazioniToken() != null) {
				TransazioneToken token = new TransazioneToken();
				token.setClientId(transazioneDB.getMittente().getInformazioniToken().getClientId());
				token.setEmail(transazioneDB.getMittente().getInformazioniToken().getMail());
				token.setIssuer(transazioneDB.getMittente().getInformazioniToken().getIssuer());
				token.setSubject(transazioneDB.getMittente().getInformazioniToken().getSubject());
				token.setUsername(transazioneDB.getMittente().getInformazioniToken().getUsername());

				if(transazioneDB.getMittente().getApplicativoToken()!=null) {
					token.setApplicativo(transazioneDB.getMittente().getApplicativoToken().getNome());
					token.setSoggetto(transazioneDB.getMittente().getApplicativoToken().getSoggetto());
				}
				
				token.setToken(transazioneDB.getMittente().getToken());
				
				
			}

		}

		transazione.setTempoElaborazione(transazioneDB.getLatenzaTotale());
		
		return transazione;
	}

	private ItemSoggetto toSoggetto(String erogatore) {
		ItemSoggetto item = new ItemSoggetto();
		item.setNome(erogatore);
		return item;
	}

	@Override
	public ListTransazioniResponse listTransazioni(ListTransazioniRequest request) {
		try {
			if(request.getIdTransazione()!= null) {
				
				PatchedApiClient client = getClient(request.getConfigurazioneConnessione());

				MonitoraggioApi mon = new MonitoraggioApi(client);

				ListTransazioniResponse ls = new ListTransazioniResponse();
				try {
					PagedModelItemTransazione pagedModel = new PagedModelItemTransazione();
					pagedModel.setContent(new ArrayList<>());
					ls.setPagedModel(pagedModel);
					DetailTransazione transazione = mon.getTransazione(request.getIdTransazione());
					
					checkTransazioneServizio(transazione, request.getLstIdApi());
					ls.setPagedModel(toTransactionList(transazione));
				} catch(ApiException e) {
					if (e.getCode() != 404) {
						throw e;
					}
				}

				return ls;
			} else {
				ListaTransazioni l = getListaTransazioniGovwayMonitor(request);
				
				ListTransazioniResponse ls = new ListTransazioniResponse();
				ls.setPagedModel(toTransactionList(l));
				return ls;
			}
		} catch (RuntimeException e) {
			throw e;
		} catch(Exception e) {
			this.logger.error("Errore nell'invocazione del monitoraggio: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	private PagedModelItemTransazione toTransactionList(
			DetailTransazione transazione) {
		PagedModelItemTransazione pm = new PagedModelItemTransazione();
		pm.setContent(Arrays.asList(toItemTransazione(transazione)));
		return pm;
	}

	private ListaTransazioni getListaTransazioniGovwayMonitor(ListTransazioniRequest request) throws ApiException {
		int rLimit = request.getPageable().getPageSize();
		int rOffset = rLimit*request.getPageable().getPageNumber();
		//			this.logger.info("sogg ["+organization+"] servceid ["+serviceId+"] componentid ["+componentId+"] esito ["+esito+"]");     

		PatchedApiClient client = getClient(request.getConfigurazioneConnessione());
		MonitoraggioApi mon = new MonitoraggioApi (client);

		RicercaIntervalloTemporale body = new RicercaIntervalloTemporale();

		body.offset(rOffset).limit(rLimit);
		FiltroTemporale interv = new FiltroTemporale();

		interv.setDataInizio(request.getDataDa());
		interv.setDataFine(request.getDataA());

		body.setIntervalloTemporale(interv);

		if(request.getEsito()!=null) {
			FiltroEsito filtroEsito = new FiltroEsito();
			filtroEsito.setEscludiScartate(false);
			
			EsitoTransazioneFullSearchEnum tipo = null;

			switch(request.getEsito()) {
			case FALLITE: tipo = EsitoTransazioneFullSearchEnum.FALLITE;
			break;
			case FALLITE_E_FAULT: tipo = EsitoTransazioneFullSearchEnum.FALLITE_E_FAULT;
			break;
			case FAULT: tipo = EsitoTransazioneFullSearchEnum.FAULT;
			break;
			case OK: tipo = EsitoTransazioneFullSearchEnum.OK;
			break;
			case FALLITE_ESCLUDI_SCARTATE:
				tipo = EsitoTransazioneFullSearchEnum.FALLITE;
				filtroEsito.setEscludiScartate(true);
			break;
			case FALLITE_E_FAULT_ESCLUDI_SCARTATE:
				tipo = EsitoTransazioneFullSearchEnum.FALLITE_E_FAULT;
				filtroEsito.setEscludiScartate(true);
				break;
			case PERSONALIZZATO:
				tipo = EsitoTransazioneFullSearchEnum.PERSONALIZZATO;
				filtroEsito.setCodici(request.getEsitoCodici());
				break;
			case QUALSIASI:
				tipo = EsitoTransazioneFullSearchEnum.QUALSIASI;
				break;
			default:
				break;
			}				
			
			if(tipo!=null) {
				filtroEsito.setTipo(tipo);
				body.setEsito(filtroEsito);
			}
		} else {
			FiltroEsito filtroEsito = new FiltroEsito();
			filtroEsito.setTipo(EsitoTransazioneFullSearchEnum.QUALSIASI);
			filtroEsito.setEscludiScartate(false);
			body.setEsito(filtroEsito);
		}
		
		filtraServizi(body, request);
		
		
		
		ListaTransazioni l = mon.findAllTransazioniByFullSearch(ProfiloEnum.fromValue(request.getProfilo()), request.getSoggettoReferente(), body);
		return l;
	}

	private PagedModelItemTransazione toTransactionList(ListaTransazioni l) {
		PagedModelItemTransazione pm = new PagedModelItemTransazione();
		pm.setContent(l.getItems().stream().map(t -> toTransazione(t)).collect(Collectors.toList()));
		return pm;
	}

	private void filtraServizi(RicercaIntervalloTemporale body, ListTransazioniRequest request) {

		List<IdApi> apiaderente = request.getLstIdApi().stream().filter(a -> a.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_ADERENTE)).collect(Collectors.toList());
		
		if(!apiaderente.isEmpty()) {
			filtraPerApiAderente(body, apiaderente.get(0), request.getSoggettoReferente());
		} else {
			filtraPerApiDominio(body,request.getLstIdApi().get(0),request.getSoggettoReferente());
		}
	}
	
	private void filtraPerApiAderente(RicercaIntervalloTemporale body, IdApi idApi, String soggettoReferente) {
		
		FiltroApiSoggetti api = new FiltroApiSoggetti();

		/*
		 * Parametro api.erogatore
		 * 
		 * 1) caso API erogata dal soggetto del dominio: può non essere valorizzato (eventualmente provare  idApi.getSoggettoGestore())
		 * 2) caso API erogata soggetto aderente: idApi.getSoggetto()
		 * 
		 *   Parametro 			body.setTipo() caso 1, erogazione, caso 2 fruizione

		 */
		
		if(idApi.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO)) {
			body.setTipo(FiltroRicercaRuoloTransazioneEnum.EROGAZIONE);
			api.setErogatore(soggettoReferente);
			
			if(idApi.getSoggetto()!= null) {
				FiltroMittenteErogazioneSoggettoImpl t = new FiltroMittenteErogazioneSoggettoImpl();
				
				t.setIdentificazione(TipoFiltroMittenteEnum.EROGAZIONE_SOGGETTO);
				t.setSoggetto(idApi.getSoggetto());
				body.setMittente(t);
			}
		} else {
			body.setTipo(FiltroRicercaRuoloTransazioneEnum.FRUIZIONE);
			api.setErogatore(idApi.getSoggetto());
		}
		
		api.setNome(idApi.getNome());
		api.setVersione(idApi.getVersione());

		body.setApi(api);
	}

	
	private void filtraPerApiDominio(RicercaIntervalloTemporale body,IdApi idApi, String soggettoReferente) {
		
		FiltroApiSoggetti api = new FiltroApiSoggetti();

		if(idApi.isFruizione()) {
			body.setTipo(FiltroRicercaRuoloTransazioneEnum.FRUIZIONE);
			api.setErogatore(idApi.getSoggetto());
		} else {
			body.setTipo(FiltroRicercaRuoloTransazioneEnum.EROGAZIONE);
			api.setErogatore(soggettoReferente);
		}
		
		api.setNome(idApi.getNome());
		api.setVersione(idApi.getVersione());

		body.setApi(api);
	}

	
	
	@Override
	public boolean isLimitata() {
		return true;
	}

	@Override
	public ListTransazioniRawResponse listTransazioniRaw(ListTransazioniRequest request) {
		try {
			Collection<org.govway.catalogo.monitoraggioutils.transazioni.Transazione> collection = new ArrayList<>();
			
			if(request.getIdTransazione()!= null) {
				
				PatchedApiClient client = getClient(request.getConfigurazioneConnessione());

				MonitoraggioApi mon = new MonitoraggioApi(client);


				try {
					DetailTransazione transazione = mon.getTransazione(request.getIdTransazione());
					
					checkTransazioneServizio(transazione, request.getLstIdApi());
					collection.add(this.transazioneBuilder.toTransazione(transazione, request.getConfigurazioneConnessione().getAmbiente()));
				} catch(ApiException e) {
					if (e.getCode() != 404) {
						throw e;
					}
				}

			} else {
	
				ListaTransazioni response = getListaTransazioniGovwayMonitor(request);
	
				for(org.govway.catalogo.gest.clients.govwaymonitor.model.ItemTransazione item: response.getItems()) {
					collection.add(this.transazioneBuilder.toTransazione(item, request.getConfigurazioneConnessione().getAmbiente()));
				}
			}
			
			return this.transazioneBuilder.getRawTransazioni(collection);
		} catch (RuntimeException e) {
			throw e;
		} catch (Exception e) {
			this.logger.error("Errore durante la serializzazione delle transazioni: " + e.getMessage(), e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
		
	}

	private void checkTransazioneServizio(DetailTransazione transazione, List<IdApi> lstIdApi) {
		
		if(transazione.getApi()!= null) {
			TransazioneExtInformazioniApi api = transazione.getApi(); 
			ApiEntity ap = this.transazioneBuilder.getIdApi(api.getNome(), api.getVersione(), api.getErogatore());

			List<IdApi> apis = lstIdApi.stream().filter(a -> a.getNome().equals(ap.getNome()) && a.getVersione().equals(ap.getVersione())).collect(Collectors.toList());
			if(apis.size() > 0) {
				return;
			} else {
				throw new NotAuthorizedException(ErrorCode.AUT_403_RESOURCE, Map.of("idTraccia", transazione.getIdTraccia().toString()));
			}

			
			
		}
	}

}
