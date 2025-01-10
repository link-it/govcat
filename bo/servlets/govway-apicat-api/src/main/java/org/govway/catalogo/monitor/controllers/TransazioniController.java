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

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.MonitorV1Controller;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.monitor.controllers.StatisticheController.ErogazioneFruizioneEnum;
import org.govway.catalogo.monitoraggioutils.ConfigurazioneConnessione;
import org.govway.catalogo.monitoraggioutils.FiltriUtils;
import org.govway.catalogo.monitoraggioutils.IMonitoraggioClient;
import org.govway.catalogo.monitoraggioutils.IdApi;
import org.govway.catalogo.monitoraggioutils.transazioni.GetTransazioneRequest;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniRawResponse;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniRequest;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniResponse;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.monitor.model.AmbienteEnum;
import org.govway.catalogo.servlets.monitor.model.EsitoTransazioneEnum;
import org.govway.catalogo.servlets.monitor.model.IntervalloTemporale;
import org.govway.catalogo.servlets.monitor.model.ItemOrganizzazione;
import org.govway.catalogo.servlets.monitor.model.ItemSoggetto;
import org.govway.catalogo.servlets.monitor.model.ItemTransazione;
import org.govway.catalogo.servlets.monitor.model.ListaTransazioniIdQuery;
import org.govway.catalogo.servlets.monitor.model.ListaTransazioniQuery;
import org.govway.catalogo.servlets.monitor.model.PagedModelItemTransazione;
import org.govway.catalogo.servlets.monitor.model.RuoloAPIEnum;
import org.govway.catalogo.servlets.monitor.model.Transazione;
import org.govway.catalogo.servlets.monitor.server.api.TransazioniApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@MonitorV1Controller
public class TransazioniController implements TransazioniApi {

	private Logger logger = LoggerFactory.getLogger(TransazioniController.class);

	@Autowired
	private IMonitoraggioClient client;
	
	@Autowired
	private SoggettoService soggettoService;

	@Autowired
	private Configurazione configurazione;   

	@Autowired
	private FiltriUtils filtriUtils;

    @Value("${monitor.collaudo.uri}")
	protected String uriMonitorCollaudo;
    @Value("${monitor.collaudo.authn.basic.username}")
	protected String userMonitorCollaudo;
    @Value("${monitor.collaudo.authn.basic.password}")
	protected String passwordMonitorCollaudo;
    
    @Value("${monitor.produzione.uri}")
	protected String uriMonitorProduzione;
    @Value("${monitor.produzione.authn.basic.username}")
	protected String userMonitorProduzione;
    @Value("${monitor.produzione.authn.basic.password}")
	protected String passwordMonitorProduzione;

    private void fill(Transazione transazione) {
		this.soggettoService.runTransaction(() -> {
			
			if(transazione.getApi()!=null) {
				SoggettoEntity soggetto = this.soggettoService.findByNome(transazione.getApi().getErogatore().getNome()).orElseThrow(() -> new NotFoundException("Soggetto ["+transazione.getApi().getErogatore()+"] non trovato"));

				ItemSoggetto itemSoggetto = new ItemSoggetto();

				BeanUtils.copyProperties(soggetto, itemSoggetto);

				itemSoggetto.setIdSoggetto(UUID.fromString(soggetto.getIdSoggetto()));
				ItemOrganizzazione organizzazione = new ItemOrganizzazione();
				BeanUtils.copyProperties(soggetto.getOrganizzazione(), organizzazione);

				organizzazione.setIdOrganizzazione(UUID.fromString(soggetto.getOrganizzazione().getIdOrganizzazione()));
				organizzazione.setMultiSoggetto(soggetto.getOrganizzazione().getSoggetti().size() > 1);
				itemSoggetto.setOrganizzazione(organizzazione);

				transazione.getApi().setErogatore(itemSoggetto);				

				ApiEntity api = this.filtriUtils.findAPI(transazione.getApi().getNome(), transazione.getApi().getVersione(), soggetto);

				if(api!=null) {
					switch(api.getRuolo()) {
					case EROGATO_SOGGETTO_ADERENTE: transazione.setRuoloComponent(RuoloAPIEnum.ADERENTE);
					break;
					case EROGATO_SOGGETTO_DOMINIO: transazione.setRuoloComponent(RuoloAPIEnum.DOMINIO);
					break;
					}
				}
			}
			
		});
	}
	
	private void fill(ItemTransazione transazione) {
		this.soggettoService.runTransaction(() -> {
			
			if(transazione.getApi()!=null) {
				SoggettoEntity soggetto = this.soggettoService.findByNome(transazione.getApi().getErogatore().getNome()).orElseThrow(() -> new NotFoundException("Soggetto ["+transazione.getApi().getErogatore()+"] non trovato"));

				ItemSoggetto itemSoggetto = new ItemSoggetto();

				BeanUtils.copyProperties(soggetto, itemSoggetto);

				itemSoggetto.setIdSoggetto(UUID.fromString(soggetto.getIdSoggetto()));
				ItemOrganizzazione organizzazione = new ItemOrganizzazione();
				BeanUtils.copyProperties(soggetto.getOrganizzazione(), organizzazione);

				organizzazione.setIdOrganizzazione(UUID.fromString(soggetto.getOrganizzazione().getIdOrganizzazione()));
				organizzazione.setMultiSoggetto(soggetto.getOrganizzazione().getSoggetti().size() > 1);
				itemSoggetto.setOrganizzazione(organizzazione);

				transazione.getApi().setErogatore(itemSoggetto);				
				
				ApiEntity api = this.filtriUtils.findAPI(transazione.getApi().getNome(), transazione.getApi().getVersione(), soggetto);
				
				if(api !=null) {
					switch(api.getRuolo()) {
					case EROGATO_SOGGETTO_ADERENTE: transazione.setRuoloComponent(RuoloAPIEnum.ADERENTE);
					break;
					case EROGATO_SOGGETTO_DOMINIO: transazione.setRuoloComponent(RuoloAPIEnum.DOMINIO);
					break;
					}
				}
			}
			
		});
	}
	private ResponseEntity<Resource> getResource(ListTransazioniRawResponse response) throws IOException {
		return ResponseEntity.status(HttpStatus.OK)
				.header("Content-Type", response.getContentType())
				.body(new ByteArrayResource(response.getResource()));
	}
	
	private ListTransazioniRequest fillListaTransazioniRequest(AmbienteEnum ambiente, UUID idServizio,
			OffsetDateTime dataDa, OffsetDateTime dataA, UUID idApi, EsitoTransazioneEnum esito, List<Integer> esitoCodici,
			UUID idAdesione, UUID idClient, Pageable pageable, ErogazioneFruizioneEnum erogazione, String soggetto) {
		ListTransazioniRequest request = new ListTransazioniRequest();
		List<IdApi> idapi = this.filtriUtils.getApi(idServizio, idApi, idAdesione, ambiente);
		for (IdApi api : idapi) {
			this.filtriUtils.checkErogazioneFruizione(api.isFruizione(), soggetto, api.getVersione(), erogazione);
		}
		request.setConfigurazioneConnessione(getConfigurazioneConnessione(ambiente));
		request.setLstIdApi(idapi);
		request.setEsito(esito);
		request.setEsitoCodici(esitoCodici);
		request.setDataA(dataA);		
		request.setDataDa(dataDa);
		request.setProfilo(this.filtriUtils.getProfilo(idServizio, idApi));
		
		request.setSoggetto(this.filtriUtils.getSoggettoNome(soggetto));
		request.setIdAdesione(idAdesione);
		request.setIdClient(idClient);
		request.setPageable(pageable);
		
		return request;
	}
	
	private ListTransazioniRequest fillListaTransazioniRequest(AmbienteEnum ambiente, UUID idTransazione, UUID idServizio) {
		ListTransazioniRequest request = new ListTransazioniRequest();
		request.setConfigurazioneConnessione(getConfigurazioneConnessione(ambiente));
		request.setIdTransazione(idTransazione);
		List<IdApi> idapi = this.filtriUtils.getApi(idServizio, null, null, ambiente);
		
		request.setLstIdApi(idapi);
		return request;
	}

	private void authorize() {
		if(!this.configurazione.getServizio().getMonitoraggio().isAbilitato()) {
			throw new NotFoundException("Monitoraggio non abilitato");
		}
		
		if(this.configurazione.getServizio().getMonitoraggio().isTransazioniAbilitate() != null && !this.configurazione.getServizio().getMonitoraggio().isTransazioniAbilitate()) {
			throw new NotFoundException("Transazioni non abilitate");
		}
		
		//TODO check ruoli
	}

	private ResponseEntity<PagedModelItemTransazione> getResponse(ListTransazioniResponse response) {
		if(response.getPagedModel().getContent()!=null) {
			for(ItemTransazione t: response.getPagedModel().getContent()) {
				fill(t);
			}
		}
		return ResponseEntity.ok().body(response.getPagedModel());
	}

	private ConfigurazioneConnessione getConfigurazioneConnessione(AmbienteEnum ambiente) {
		
		ConfigurazioneConnessione conf = new ConfigurazioneConnessione();
		conf.setUrl(ambiente.equals(AmbienteEnum.COLLAUDO) ? this.uriMonitorCollaudo:this.uriMonitorProduzione);

		conf.setUsername(ambiente.equals(AmbienteEnum.COLLAUDO) ? this.userMonitorCollaudo:this.userMonitorProduzione);
		conf.setPassword(ambiente.equals(AmbienteEnum.COLLAUDO) ? this.passwordMonitorCollaudo:this.passwordMonitorProduzione);

		return conf;
	}

	private ListTransazioniRequest fillListaTransazioniRequest(AmbienteEnum ambiente,
			ListaTransazioniQuery query, ErogazioneFruizioneEnum erogazione, String nome) {
		ListTransazioniRequest request = new ListTransazioniRequest();


		List<IdApi> idapi = this.filtriUtils.getApi(query.getApi().getIdServizio(), query.getApi().getIdApi(), query.getApi().getIdAdesione(), ambiente);
		request.setConfigurazioneConnessione(getConfigurazioneConnessione(ambiente));
		request.setLstIdApi(idapi);
		if(query.getEsito()!=null) {
			request.setEsito(query.getEsito().getTipo());
		}
		IntervalloTemporale it = ((IntervalloTemporale)query.getIntervalloTemporale());

		request.setDataA(it.getDataFine());		
		request.setDataDa(it.getDataInizio());
		request.setProfilo(this.filtriUtils.getProfilo(query.getApi().getIdServizio(), query.getApi().getIdApi()));
		
		request.setSoggetto(this.filtriUtils.getSoggettoNome(nome));
		request.setIdAdesione(query.getApi().getIdAdesione());
		request.setIdClient(query.getApi().getIdClient());
		if(query.getPaging()!= null) {
			Sort sort = query.getPaging().getSort() != null ? Sort.by(query.getPaging().getSort().toArray(new String[]{})) : Sort.unsorted();
			request.setPageable(PageRequest.of(query.getPaging().getPage(), query.getPaging().getSize(), sort));
		} else {
			request.setPageable(PageRequest.of(0, 20));
		}
		
		return request;
	}
	
/*
    //@Override
	public ResponseEntity<Transazione> collaudoDiagnosticaIdTransazioneGet(UUID idTransazione) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			
			this.logger.debug("Autorizzazione completata con successo");     

			GetTransazioneRequest request = new GetTransazioneRequest();
			request.setConfigurazioneConnessione(getConfigurazioneConnessione(AmbienteEnum.COLLAUDO));
			request.setIdTransazione(idTransazione);
			
			Transazione transazione = this.client.getTransazione(request).getTransazione();

			fill(transazione);
			this.logger.debug("Invocazione completata con successo");
			
			return ResponseEntity.ok(transazione);

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	//@Override
	public ResponseEntity<Resource> collaudoErogazioniModiDiagnosticaListaTransazioniGet(UUID idServizio, OffsetDateTime dataDa,
			OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoCodici, UUID idAdesione, UUID idClient, Pageable pageable) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.COLLAUDO, idServizio, dataDa, dataA, idApi, esito, esitoCodici, idAdesione, idClient, pageable,
					ErogazioneFruizioneEnum.EROGAZIONE, ModiPdndEnum.MODI);
			ListTransazioniRawResponse response = this.client.listTransazioniRaw(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResource(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
	
	//@Override
	public ResponseEntity<PagedModelItemTransazione> collaudoErogazioniModiDiagnosticaListaTransazioniPost(
			ListaTransazioniQuery listaTransazioniQuery) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.COLLAUDO, listaTransazioniQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, ModiPdndEnum.MODI);
			ListTransazioniResponse response = this.client.listTransazioni(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResponse(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	//@Override
	public ResponseEntity<Resource> collaudoErogazioniPdndDiagnosticaListaTransazioniGet(UUID idServizio, OffsetDateTime dataDa,
			OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoCodici, UUID idAdesione, UUID idClient, Pageable pageable) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.COLLAUDO, idServizio, dataDa, dataA, idApi, esito, esitoCodici, idAdesione, idClient, pageable,
					ErogazioneFruizioneEnum.EROGAZIONE, ModiPdndEnum.PDND);
			ListTransazioniRawResponse response = this.client.listTransazioniRaw(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResource(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
	//@Override
	public ResponseEntity<PagedModelItemTransazione> collaudoErogazioniPdndDiagnosticaListaTransazioniPost(ListaTransazioniQuery listaTransazioniQuery) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.COLLAUDO, listaTransazioniQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, ModiPdndEnum.PDND);
			ListTransazioniResponse response = this.client.listTransazioni(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResponse(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
	//@Override
	public ResponseEntity<Resource> collaudoFruizioniModiDiagnosticaListaTransazioniGet(UUID idServizio, OffsetDateTime dataDa,
			OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoCodici, UUID idAdesione, UUID idClient, Pageable pageable) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.COLLAUDO, idServizio, dataDa, dataA, idApi, esito, esitoCodici, idAdesione, idClient, pageable,
					ErogazioneFruizioneEnum.FRUIZIONE, ModiPdndEnum.MODI);
			ListTransazioniRawResponse response = this.client.listTransazioniRaw(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResource(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
	//@Override
	public ResponseEntity<PagedModelItemTransazione> collaudoFruizioniModiDiagnosticaListaTransazioniPost(ListaTransazioniQuery listaTransazioniQuery) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.COLLAUDO, listaTransazioniQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, ModiPdndEnum.MODI);
			ListTransazioniResponse response = this.client.listTransazioni(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResponse(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
	//@Override
	public ResponseEntity<Resource> collaudoFruizioniPdndDiagnosticaListaTransazioniGet(UUID idServizio, OffsetDateTime dataDa,
			OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoCodici, UUID idAdesione, UUID idClient, Pageable pageable) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.COLLAUDO, idServizio, dataDa, dataA, idApi, esito, esitoCodici, idAdesione, idClient, pageable,
					ErogazioneFruizioneEnum.FRUIZIONE, ModiPdndEnum.PDND);
			ListTransazioniRawResponse response = this.client.listTransazioniRaw(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResource(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
	//@Override
	public ResponseEntity<PagedModelItemTransazione> collaudoFruizioniPdndDiagnosticaListaTransazioniPost(ListaTransazioniQuery listaTransazioniQuery) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.COLLAUDO, listaTransazioniQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, ModiPdndEnum.PDND);
			ListTransazioniResponse response = this.client.listTransazioni(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResponse(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

    //@Override
	public ResponseEntity<Transazione> produzioneDiagnosticaIdTransazioneGet(UUID idTransazione) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			
			this.logger.debug("Autorizzazione completata con successo");     

			GetTransazioneRequest request = new GetTransazioneRequest();
			request.setConfigurazioneConnessione(getConfigurazioneConnessione(AmbienteEnum.PRODUZIONE));
			request.setIdTransazione(idTransazione);
			
			Transazione transazione = this.client.getTransazione(request).getTransazione();

			fill(transazione);
			this.logger.debug("Invocazione completata con successo");
			
			return ResponseEntity.ok(transazione);

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	//@Override
	public ResponseEntity<Resource> produzioneErogazioniModiDiagnosticaListaTransazioniGet(UUID idServizio, OffsetDateTime dataDa,
			OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoCodici, UUID idAdesione, UUID idClient, Pageable pageable) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.PRODUZIONE, idServizio, dataDa, dataA, idApi, esito, esitoCodici, idAdesione, idClient, pageable,
					ErogazioneFruizioneEnum.EROGAZIONE, ModiPdndEnum.MODI);
			ListTransazioniRawResponse response = this.client.listTransazioniRaw(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResource(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
	
	//@Override
	public ResponseEntity<PagedModelItemTransazione> produzioneErogazioniModiDiagnosticaListaTransazioniPost(
			ListaTransazioniQuery listaTransazioniQuery) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.PRODUZIONE, listaTransazioniQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, ModiPdndEnum.MODI);
			ListTransazioniResponse response = this.client.listTransazioni(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResponse(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	//@Override
	public ResponseEntity<Resource> produzioneErogazioniPdndDiagnosticaListaTransazioniGet(UUID idServizio, OffsetDateTime dataDa,
			OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoCodici, UUID idAdesione, UUID idClient, Pageable pageable) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.PRODUZIONE, idServizio, dataDa, dataA, idApi, esito, esitoCodici, idAdesione, idClient, pageable,
					ErogazioneFruizioneEnum.EROGAZIONE, ModiPdndEnum.PDND);
			ListTransazioniRawResponse response = this.client.listTransazioniRaw(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResource(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
	//@Override
	public ResponseEntity<PagedModelItemTransazione> produzioneErogazioniPdndDiagnosticaListaTransazioniPost(ListaTransazioniQuery listaTransazioniQuery) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.PRODUZIONE, listaTransazioniQuery,
					ErogazioneFruizioneEnum.EROGAZIONE, ModiPdndEnum.PDND);
			ListTransazioniResponse response = this.client.listTransazioni(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResponse(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
	//@Override
	public ResponseEntity<Resource> produzioneFruizioniModiDiagnosticaListaTransazioniGet(UUID idServizio, OffsetDateTime dataDa,
			OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoCodici, UUID idAdesione, UUID idClient, Pageable pageable) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.PRODUZIONE, idServizio, dataDa, dataA, idApi, esito, esitoCodici, idAdesione, idClient, pageable,
					ErogazioneFruizioneEnum.FRUIZIONE, ModiPdndEnum.MODI);
			ListTransazioniRawResponse response = this.client.listTransazioniRaw(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResource(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
	//@Override
	public ResponseEntity<PagedModelItemTransazione> produzioneFruizioniModiDiagnosticaListaTransazioniPost(ListaTransazioniQuery listaTransazioniQuery) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.PRODUZIONE, listaTransazioniQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, ModiPdndEnum.MODI);
			ListTransazioniResponse response = this.client.listTransazioni(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResponse(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
	//@Override
	public ResponseEntity<Resource> produzioneFruizioniPdndDiagnosticaListaTransazioniGet(UUID idServizio, OffsetDateTime dataDa,
			OffsetDateTime dataA, UUID idApi,
			EsitoTransazioneEnum esito, List<Integer> esitoCodici, UUID idAdesione, UUID idClient, Pageable pageable) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.PRODUZIONE, idServizio, dataDa, dataA, idApi, esito, esitoCodici, idAdesione, idClient, pageable,
					ErogazioneFruizioneEnum.FRUIZIONE, ModiPdndEnum.PDND);
			ListTransazioniRawResponse response = this.client.listTransazioniRaw(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResource(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
	//@Override
	public ResponseEntity<PagedModelItemTransazione> produzioneFruizioniPdndDiagnosticaListaTransazioniPost(ListaTransazioniQuery listaTransazioniQuery) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.PRODUZIONE, listaTransazioniQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, ModiPdndEnum.PDND);
			ListTransazioniResponse response = this.client.listTransazioni(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResponse(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	//@Override
	public ResponseEntity<Resource> collaudoDiagnosticaListaTransazioniIdGet(UUID idTransazione, UUID idServizio) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.COLLAUDO, idTransazione, idServizio);
			ListTransazioniRawResponse response = this.client.listTransazioniRaw(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResource(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	//@Override
	public ResponseEntity<PagedModelItemTransazione> collaudoDiagnosticaListaTransazioniIdPost(ListaTransazioniIdQuery listaTransazioniIdQuery) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.COLLAUDO, listaTransazioniIdQuery.getIdTransazione(), listaTransazioniIdQuery.getIdServizio());
			ListTransazioniResponse response = this.client.listTransazioni(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResponse(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	//@Override
	public ResponseEntity<Resource> produzioneDiagnosticaListaTransazioniIdGet(UUID idTransazione,UUID idServizio) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.PRODUZIONE, idTransazione, idServizio);
			ListTransazioniRawResponse response = this.client.listTransazioniRaw(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResource(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	//@Override
	public ResponseEntity<PagedModelItemTransazione> produzioneDiagnosticaListaTransazioniIdPost(ListaTransazioniIdQuery listaTransazioniIdQuery) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(AmbienteEnum.PRODUZIONE, listaTransazioniIdQuery.getIdTransazione(), listaTransazioniIdQuery.getIdServizio());
			ListTransazioniResponse response = this.client.listTransazioni(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResponse(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
*/
	@Override
	public ResponseEntity<Transazione> ambienteDiagnosticaIdTransazioneGet(AmbienteEnum ambiente, UUID idTransazione) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			
			this.logger.debug("Autorizzazione completata con successo");     

			GetTransazioneRequest request = new GetTransazioneRequest();

			request.setConfigurazioneConnessione(getConfigurazioneConnessione(ambiente));
			request.setIdTransazione(idTransazione);
			
			Transazione transazione = this.client.getTransazione(request).getTransazione();

			fill(transazione);
			this.logger.debug("Invocazione completata con successo");
			
			return ResponseEntity.ok(transazione);

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteDiagnosticaListaTransazioniIdGet(AmbienteEnum ambiente,
			UUID idTransazione, UUID idServizio) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(ambiente, idTransazione, idServizio);
			ListTransazioniRawResponse response = this.client.listTransazioniRaw(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResource(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemTransazione> ambienteDiagnosticaListaTransazioniIdPost(AmbienteEnum ambiente,
			ListaTransazioniIdQuery listaTransazioniIdQuery) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(ambiente, listaTransazioniIdQuery.getIdTransazione(), listaTransazioniIdQuery.getIdServizio());
			ListTransazioniResponse response = this.client.listTransazioni(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResponse(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> ambienteErogazioniSoggettoDiagnosticaListaTransazioniGet(AmbienteEnum ambiente,
			String soggetto,
			UUID idServizio, OffsetDateTime dataDa,
			OffsetDateTime dataA, UUID idApi, EsitoTransazioneEnum esito,
			List<Integer> esitoCodici, UUID idAdesione, UUID idClient, Pageable pageable) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(ambiente, idServizio, dataDa, dataA, idApi, esito, esitoCodici, idAdesione, idClient, pageable,
					ErogazioneFruizioneEnum.EROGAZIONE, soggetto);
			ListTransazioniRawResponse response = this.client.listTransazioniRaw(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResource(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemTransazione> ambienteErogazioniSoggettoDiagnosticaListaTransazioniPost(
			AmbienteEnum ambiente, String soggetto,
			ListaTransazioniQuery listaTransazioniQuery) {
	try {
		this.logger.info("Invocazione in corso ..."); 
		
		this.authorize();
		this.logger.debug("Autorizzazione completata con successo");     

		ListTransazioniRequest request = fillListaTransazioniRequest(ambiente, listaTransazioniQuery,
				ErogazioneFruizioneEnum.EROGAZIONE, soggetto);
		ListTransazioniResponse response = this.client.listTransazioni(request);

		this.logger.debug("Invocazione completata con successo");
		
		return getResponse(response);
	}
	catch(RuntimeException e) {
		this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
		throw e;
	}
	catch(Throwable e) {
		this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
		throw new InternalException(e);
	}
	}

	@Override
	public ResponseEntity<Resource> ambienteFruizioniSoggettoDiagnosticaListaTransazioniGet(AmbienteEnum ambiente,
			String soggetto,
			UUID idServizio, OffsetDateTime dataDa,
			OffsetDateTime dataA, UUID idApi, EsitoTransazioneEnum esito,
			List<Integer> esitoCodici, UUID idAdesione, UUID idClient, Pageable pageable) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(ambiente, idServizio, dataDa, dataA, idApi, esito, esitoCodici, idAdesione, idClient, pageable,
					ErogazioneFruizioneEnum.FRUIZIONE, soggetto);
			ListTransazioniRawResponse response = this.client.listTransazioniRaw(request);

			this.logger.debug("Invocazione completata con successo");
			
			return getResource(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemTransazione> ambienteFruizioniSoggettoDiagnosticaListaTransazioniPost(
			AmbienteEnum ambiente, String soggetto,
			ListaTransazioniQuery listaTransazioniQuery) {
		try {
			this.logger.info("Invocazione in corso ..."); 

			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ListTransazioniRequest request = fillListaTransazioniRequest(ambiente, listaTransazioniQuery,
					ErogazioneFruizioneEnum.FRUIZIONE, soggetto);
			ListTransazioniResponse response = this.client.listTransazioni(request);

			this.logger.debug("Invocazione completata con successo");

			return getResponse(response);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
}
