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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import org.govway.catalogo.MonitorV1Controller;
import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.controllers.CustomPageRequest;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.monitor.controllers.StatisticheController.TipoVerifica;
import org.govway.catalogo.monitoraggioutils.ConfigurazioneConnessione;
import org.govway.catalogo.monitoraggioutils.GetDetailRequest;
import org.govway.catalogo.monitoraggioutils.GetDetailResponse;
import org.govway.catalogo.monitoraggioutils.GetInformazioniPuntualiRequest;
import org.govway.catalogo.monitoraggioutils.GetInformazioniPuntualiResponse;
import org.govway.catalogo.monitoraggioutils.GetStatoRequest;
import org.govway.catalogo.monitoraggioutils.GetStatoResponse;
import org.govway.catalogo.monitoraggioutils.IStatisticheClient;
import org.govway.catalogo.monitoraggioutils.allarmi.AllarmiClient;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.monitor.model.AmbienteEnum;
import org.govway.catalogo.servlets.monitor.model.EsitoVerificaBackend;
import org.govway.catalogo.servlets.monitor.model.EsitoVerificaCertificatiInScadenza;
import org.govway.catalogo.servlets.monitor.model.EsitoVerificaCertificatiScaduti;
import org.govway.catalogo.servlets.monitor.model.EsitoVerificaEventi;
import org.govway.catalogo.servlets.monitor.model.ItemApplicativoVerificato;
import org.govway.catalogo.servlets.monitor.model.ItemServizioVerificato;
import org.govway.catalogo.servlets.monitor.model.PageMetadata;
import org.govway.catalogo.servlets.monitor.model.PagedModelItemApplicativiVerificati;
import org.govway.catalogo.servlets.monitor.model.PagedModelItemServiziVerificati;
import org.govway.catalogo.servlets.monitor.model.ResocontoVerificaCertificati;
import org.govway.catalogo.servlets.monitor.model.ResocontoVerificaConnettivita;
import org.govway.catalogo.servlets.monitor.model.ResocontoVerificaConnettivitaPeriodo;
import org.govway.catalogo.servlets.monitor.model.TipoVerificaEnum;
import org.govway.catalogo.servlets.monitor.server.api.VerificaApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.IanaLinkRelations;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@MonitorV1Controller
public class VerificaController implements VerificaApi {

	private Logger logger = LoggerFactory.getLogger(StatisticheController.class);

	@Autowired
	private Configurazione configurazione;   

	@Autowired
	private IStatisticheClient monitoraggioClient;
	
	@Autowired
	private PagedResourcesAssembler<ItemServizioVerificato> pagedResourceAssemblerServizio;

	@Autowired
	private PagedResourcesAssembler<ItemApplicativoVerificato> pagedResourceAssemblerApplicativo;

	@Autowired
	private AllarmiClient allarmiClient;   

	@Autowired
	private RequestUtils requestUtils;   

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

    @Value("${allarmi.collaudo.uri}")
	protected String uriAllarmiCollaudo;
    @Value("${allarmi.collaudo.authn.basic.username}")
	protected String userAllarmiCollaudo;
    @Value("${allarmi.collaudo.authn.basic.password}")
	protected String passwordAllarmiCollaudo;

    @Value("${allarme.collaudo.soggetti.certificati}")
    protected String idAllarmeSoggettiCollaudo;
    @Value("${allarme.collaudo.applicativi.certificati}")
    protected String idAllarmeApplicativiCollaudo;
    @Value("${allarme.collaudo.modi.erogazioni.certificati}")
    protected String idAllarmeErogazioniModiCertificatiCollaudo;
    @Value("${allarme.collaudo.pdnd.erogazioni.certificati}")
    protected String idAllarmeErogazioniPdndCertificatiCollaudo;
    @Value("${allarme.collaudo.modi.fruizioni.certificati}")
    protected String idAllarmeFruizioniModiCertificatiCollaudo;
    @Value("${allarme.collaudo.pdnd.fruizioni.certificati}")
    protected String idAllarmeFruizioniPdndCertificatiCollaudo;
    @Value("${allarme.collaudo.token_policy.certificati}")
    protected String idAllarmeTokenPolicyCertificatiCollaudo;
    @Value("${allarme.collaudo.token_policy.backend}")
    protected String idAllarmeTokenPolicyBackendCollaudo;
    @Value("${allarme.collaudo.configurazione_generale.certificati}")
    protected String idAllarmeConfigurazioneGeneraleCertificatiCollaudo;
    @Value("${allarme.collaudo.modi.erogazioni.backend}")
    protected String idAllarmeErogazioniModiBackendCollaudo;
    @Value("${allarme.collaudo.pdnd.erogazioni.backend}")
    protected String idAllarmeErogazioniPdndBackendCollaudo;
    @Value("${allarme.collaudo.modi.fruizioni.backend}")
    protected String idAllarmeFruizioniModiBackendCollaudo;
    @Value("${allarme.collaudo.pdnd.fruizioni.backend}")
	protected String idAllarmeFruizioniPdndBackendCollaudo;


    @Value("${allarmi.produzione.uri}")
	protected String uriAllarmiProduzione;
    @Value("${allarmi.produzione.authn.basic.username}")
	protected String userAllarmiProduzione;
    @Value("${allarmi.produzione.authn.basic.password}")
	protected String passwordAllarmiProduzione;

    @Value("${allarme.produzione.soggetti.certificati}")
    protected String idAllarmeSoggettiProduzione;
    @Value("${allarme.produzione.applicativi.certificati}")
    protected String idAllarmeApplicativiProduzione;
    @Value("${allarme.produzione.modi.erogazioni.certificati}")
    protected String idAllarmeErogazioniModiCertificatiProduzione;
    @Value("${allarme.produzione.pdnd.erogazioni.certificati}")
    protected String idAllarmeErogazioniPdndCertificatiProduzione;
    @Value("${allarme.produzione.modi.fruizioni.certificati}")
    protected String idAllarmeFruizioniModiCertificatiProduzione;
    @Value("${allarme.produzione.pdnd.fruizioni.certificati}")
    protected String idAllarmeFruizioniPdndCertificatiProduzione;
    @Value("${allarme.produzione.token_policy.certificati}")
    protected String idAllarmeTokenPolicyCertificatiProduzione;
    @Value("${allarme.produzione.token_policy.backend}")
    protected String idAllarmeTokenPolicyBackendProduzione;
    @Value("${allarme.produzione.configurazione_generale.certificati}")
    protected String idAllarmeConfigurazioneGeneraleCertificatiProduzione;
    @Value("${allarme.produzione.modi.erogazioni.backend}")
    protected String idAllarmeErogazioniModiBackendProduzione;
    @Value("${allarme.produzione.pdnd.erogazioni.backend}")
    protected String idAllarmeErogazioniPdndBackendProduzione;
    @Value("${allarme.produzione.modi.fruizioni.backend}")
    protected String idAllarmeFruizioniModiBackendProduzione;
    @Value("${allarme.produzione.pdnd.fruizioni.backend}")
	protected String idAllarmeFruizioniPdndBackendProduzione;

	private void authorize() {
		if(!this.configurazione.getMonitoraggio().isAbilitato()) {
			throw new NotFoundException(ErrorCode.MON_404, Map.of());
		}

		if(this.configurazione.getMonitoraggio().isVerificheAbilitate()!= null && !this.configurazione.getMonitoraggio().isVerificheAbilitate()) {
			throw new NotFoundException(ErrorCode.MON_404_STATS, Map.of("tipo", "verifiche"));
		}
		
		this.requestUtils.getPrincipal();
		//TODO check ruoli
	}
/*
	//@Override
	public ResponseEntity<EsitoVerificaCertificatiInScadenza> ambienteApplicativiModiOrganizationNameCertificatiInScadenzaGet(
			AmbienteEnum ambiente,
			String organization,
			String name) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			EsitoVerificaCertificatiInScadenza esitoVerificaCertificatiInScadenza = this.allarmiClient.getCertificatoInScadenzaApplicativo(ModiPdndEnum.MODI, organization, name, getConfigurazioneConnessione(ambiente));
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaCertificatiInScadenza);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}
*/

	private ConfigurazioneConnessione getConfigurazioneConnessione(AmbienteEnum ambiente) {
		
		ConfigurazioneConnessione conf = new ConfigurazioneConnessione();
		conf.setAmbiente(ambiente);
		
		if(ambiente.equals(AmbienteEnum.COLLAUDO)) {
			conf.setUrl(this.uriAllarmiCollaudo);

			conf.setUsername(this.userAllarmiCollaudo);
			conf.setPassword(this.passwordAllarmiCollaudo);

			conf.setIdAllarmeSoggetti(this.idAllarmeSoggettiCollaudo);
			conf.setIdAllarmeApplicativi(this.idAllarmeApplicativiCollaudo);
			conf.setIdAllarmeErogazioniModiCertificati(this.idAllarmeErogazioniModiCertificatiCollaudo);
			conf.setIdAllarmeErogazioniPdndCertificati(this.idAllarmeErogazioniPdndCertificatiCollaudo);
			conf.setIdAllarmeFruizioniModiCertificati(this.idAllarmeFruizioniModiCertificatiCollaudo);
			conf.setIdAllarmeFruizioniPdndCertificati(this.idAllarmeFruizioniPdndCertificatiCollaudo);
			conf.setIdAllarmeTokenPolicyCertificati(this.idAllarmeTokenPolicyCertificatiCollaudo);
			conf.setIdAllarmeTokenPolicyBackend(this.idAllarmeTokenPolicyBackendCollaudo);
			conf.setIdAllarmeConfigurazioneGeneraleCertificati(this.idAllarmeConfigurazioneGeneraleCertificatiCollaudo);
			conf.setIdAllarmeErogazioniModiBackend(this.idAllarmeErogazioniModiBackendCollaudo);
			conf.setIdAllarmeErogazioniPdndBackend(this.idAllarmeErogazioniPdndBackendCollaudo);
			conf.setIdAllarmeFruizioniModiBackend(this.idAllarmeFruizioniModiBackendCollaudo);
			conf.setIdAllarmeFruizioniPdndBackend(this.idAllarmeFruizioniPdndBackendCollaudo);

		} else {
			conf.setUrl(this.uriAllarmiProduzione);

			conf.setUsername(this.userAllarmiProduzione);
			conf.setPassword(this.passwordAllarmiProduzione);
			
			conf.setIdAllarmeSoggetti(this.idAllarmeSoggettiProduzione);
			conf.setIdAllarmeApplicativi(this.idAllarmeApplicativiProduzione);
			conf.setIdAllarmeErogazioniModiCertificati(this.idAllarmeErogazioniModiCertificatiProduzione);
			conf.setIdAllarmeErogazioniPdndCertificati(this.idAllarmeErogazioniPdndCertificatiProduzione);
			conf.setIdAllarmeFruizioniModiCertificati(this.idAllarmeFruizioniModiCertificatiProduzione);
			conf.setIdAllarmeFruizioniPdndCertificati(this.idAllarmeFruizioniPdndCertificatiProduzione);
			conf.setIdAllarmeTokenPolicyCertificati(this.idAllarmeTokenPolicyCertificatiProduzione);
			conf.setIdAllarmeTokenPolicyBackend(this.idAllarmeTokenPolicyBackendProduzione);
			conf.setIdAllarmeConfigurazioneGeneraleCertificati(this.idAllarmeConfigurazioneGeneraleCertificatiProduzione);
			conf.setIdAllarmeErogazioniModiBackend(this.idAllarmeErogazioniModiBackendProduzione);
			conf.setIdAllarmeErogazioniPdndBackend(this.idAllarmeErogazioniPdndBackendProduzione);
			conf.setIdAllarmeFruizioniModiBackend(this.idAllarmeFruizioniModiBackendProduzione);
			conf.setIdAllarmeFruizioniPdndBackend(this.idAllarmeFruizioniPdndBackendProduzione);

		}

		return conf;
	}

	private ConfigurazioneConnessione getConfigurazioneConnessioneMonitor(AmbienteEnum ambiente) {
		
		ConfigurazioneConnessione conf = new ConfigurazioneConnessione();
		conf.setAmbiente(ambiente);
		conf.setUrl(ambiente.equals(AmbienteEnum.COLLAUDO) ? this.uriMonitorCollaudo:this.uriMonitorProduzione);
		conf.setUsername(ambiente.equals(AmbienteEnum.COLLAUDO) ? this.userMonitorCollaudo:this.userMonitorProduzione);
		conf.setPassword(ambiente.equals(AmbienteEnum.COLLAUDO) ? this.passwordMonitorCollaudo:this.passwordMonitorProduzione);

		return conf;
	}


	private ResocontoVerificaCertificati getResoconto(List<?> esitoVerificaCertificatiScaduti,
			List<?> esitoVerificaCertificatiInScadenza) {
		ResocontoVerificaCertificati rvc = new ResocontoVerificaCertificati();

		long scadutiSize = esitoVerificaCertificatiScaduti.size();
		long inScadenzaSize = esitoVerificaCertificatiInScadenza.size();
		
		rvc.setInScadenza(inScadenzaSize);
		rvc.setScaduti(scadutiSize);
		
		return rvc;
		
	}

	private ResocontoVerificaConnettivita getResocontoConnettivita(List<?> esitoVerificaConnettivitaErrori) {
		ResocontoVerificaConnettivita rvc = new ResocontoVerificaConnettivita();

		long erroriSize = esitoVerificaConnettivitaErrori.size();
		
		rvc.setErrori(erroriSize);
		
		return rvc;
		
	}

	private PagedModelItemServiziVerificati filterAndSort(List<ItemServizioVerificato> unpagedLst, Pageable pageable) {
		Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);

		Comparator<ItemServizioVerificato> c = new Comparator<ItemServizioVerificato>() {

			//@Override
			public int compare(ItemServizioVerificato o1, ItemServizioVerificato o2) {
				
				String nomeVersione1 = o1.getNome() + "_" + o1.getVersione();
				String nomeVersione2 = o2.getNome() + "_" + o2.getVersione();
				
				return nomeVersione1.compareTo(nomeVersione2);
			}
		};

		PageImpl<ItemServizioVerificato> page = new PageImpl<ItemServizioVerificato>(toPaged(unpagedLst.stream().sorted(c).collect(Collectors.toList()), pageable), pageable, unpagedLst.size());
		
		PagedModel<EntityModel<ItemServizioVerificato>> lst = this.pagedResourceAssemblerServizio.toModel(page, link);
		
		
		PagedModelItemServiziVerificati list = new PagedModelItemServiziVerificati();
		list.setContent(lst.getContent().stream().map(e -> e.getContent())
				.collect(Collectors.toList()));
		list.add(lst.getLinks());
		list.setPage(new PageMetadata().size((long)page.getSize()).number((long)page.getNumber()).totalElements((long)page.getTotalElements()).totalPages((long)page.getTotalPages()));
		
		return list;
	}

	private PagedModelItemApplicativiVerificati filterAndSortApplicativi(List<ItemApplicativoVerificato> unpagedLst, Pageable pageable) {
		Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);

		Comparator<ItemApplicativoVerificato> c = new Comparator<ItemApplicativoVerificato>() {

			//@Override
			public int compare(ItemApplicativoVerificato o1, ItemApplicativoVerificato o2) {
				
				String nomeVersione1 = o1.getNome() + "_" + o1.getSoggetto();
				String nomeVersione2 = o2.getNome() + "_" + o2.getSoggetto();
				
				return nomeVersione1.compareTo(nomeVersione2);
			}
		};
		PageImpl<ItemApplicativoVerificato> page = new PageImpl<ItemApplicativoVerificato>(toPaged(unpagedLst.stream().sorted(c).collect(Collectors.toList()), pageable), pageable, unpagedLst.size());
		
		PagedModel<EntityModel<ItemApplicativoVerificato>> lst = this.pagedResourceAssemblerApplicativo.toModel(page, link);
		
		
		PagedModelItemApplicativiVerificati list = new PagedModelItemApplicativiVerificati();
		list.setContent(lst.getContent().stream().map(e -> e.getContent())
				.collect(Collectors.toList()));
		list.add(Arrays.asList(link));
		list.add(lst.getLinks());
		list.setPage(new PageMetadata().size((long)page.getSize()).number((long)page.getNumber()).totalElements((long)page.getTotalElements()).totalPages((long)page.getTotalPages()));
		
		return list;
	}

	private <T> List<T> toPaged(List<T> unpagedLst, Pageable pageable) {
		int limit = pageable.getPageSize();
		long offset = pageable.getOffset();
		
		if(offset > unpagedLst.size()) {
			return Arrays.asList();
		} else {
			long endindex = offset+limit;
			long end = Math.min((long) unpagedLst.size(), endindex);
			
			List<T> lst = new ArrayList<>();
			
			for(long i = offset; i < end; i++) {
				lst.add(unpagedLst.get((int)i));
			}
			
			return lst;
		}
	}

	private EsitoVerificaEventi getInformazioniPuntuali(String soggetto, TipoVerifica tipoVerifica, AmbienteEnum ambiente, String provider, String name, Integer version, OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica) {
		GetInformazioniPuntualiRequest request = new GetInformazioniPuntualiRequest();
		
		request.setConfigurazioneConnessione(getConfigurazioneConnessioneMonitor(ambiente));
		request.setTipoVerifica(tipoVerifica);
		request.setSoggetto(soggetto);
		
		request.setProvider(provider);
		request.setName(name);
		request.setVersion(version);
		
		request.setDataInizioVerifica(dataInizioVerifica);
		request.setDataFineVerifica(dataFineVerifica);
		
		GetInformazioniPuntualiResponse response = this.monitoraggioClient.getInformazioniPuntuali(request);
		
		return response.getEsitoVerificaEventi();
	}

	private ResocontoVerificaConnettivitaPeriodo getResocontoVerificaConnettivitaPeriodo(String soggetto, TipoVerifica tipoVerifica, AmbienteEnum ambiente, OffsetDateTime periodo1DataInizioVerifica, OffsetDateTime periodo1DataFineVerifica, OffsetDateTime periodo2DataInizioVerifica, OffsetDateTime periodo2DataFineVerifica) {

		GetStatoRequest getStatoRequest = new GetStatoRequest();
		
		getStatoRequest.setConfigurazioneConnessione(getConfigurazioneConnessioneMonitor(ambiente));
		getStatoRequest.setTipoVerifica(tipoVerifica);
		getStatoRequest.setSoggetto(soggetto);
		
		getStatoRequest.setPeriodo1DataInizioVerifica(periodo1DataInizioVerifica);
		getStatoRequest.setPeriodo1DataFineVerifica(periodo1DataFineVerifica);
		
		getStatoRequest.setPeriodo2DataInizioVerifica(periodo2DataInizioVerifica);
		getStatoRequest.setPeriodo2DataFineVerifica(periodo2DataFineVerifica);
		
		GetStatoResponse response = this.monitoraggioClient.getStato(getStatoRequest);
		
		return response.getResocontoVerificaConnettivitaPeriodo();
	}

	private List<ItemServizioVerificato> getDetailServizi(String soggetto, TipoVerifica tipoVerifica, AmbienteEnum ambiente, OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica) {
		GetDetailRequest getStatoRequest = new GetDetailRequest();
		
		getStatoRequest.setConfigurazioneConnessione(getConfigurazioneConnessioneMonitor(ambiente));
		getStatoRequest.setTipoVerifica(tipoVerifica);
		getStatoRequest.setSoggetto(soggetto);
		
		getStatoRequest.setDataInizioVerifica(dataInizioVerifica);
		getStatoRequest.setDataFineVerifica(dataFineVerifica);
		
		GetDetailResponse response = this.monitoraggioClient.getDetail(getStatoRequest);
		
		return response.getListServiziVerificati();

	}

	@Override
	public ResponseEntity<EsitoVerificaCertificatiInScadenza> ambienteApplicativiTipoVerificaSoggettoNameCertificatiInScadenzaGet(
			AmbienteEnum ambiente, TipoVerificaEnum tipoVerifica,
			String soggetto,
			String name) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			EsitoVerificaCertificatiInScadenza esitoVerificaCertificatiInScadenza = this.allarmiClient.getCertificatoInScadenzaApplicativo(tipoVerifica, soggetto, name, getConfigurazioneConnessione(ambiente));
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaCertificatiInScadenza);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	
	
	
	
	
	
	
	@Override
	public ResponseEntity<EsitoVerificaCertificatiScaduti> ambienteApplicativiTipoVerificaSoggettoNameCertificatiScadutiGet(
			AmbienteEnum ambiente, TipoVerificaEnum tipoVerifica,
			String soggetto,
			String name) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			EsitoVerificaCertificatiScaduti esitoVerificaCertificatiScaduti = this.allarmiClient.getCertificatoScadutoApplicativo(tipoVerifica, soggetto, name, getConfigurazioneConnessione(ambiente));
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaCertificatiScaduti);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaBackend> ambienteErogazioniSoggettoNameVersionBackendStatoGet(
			AmbienteEnum ambiente, String soggetto,
			String name, Integer version) {		try {
				this.logger.info("Invocazione in corso ..."); 
				
				this.authorize();
				this.logger.debug("Autorizzazione completata con successo");     

				EsitoVerificaBackend esitoVerificaCertificatiScaduti = this.allarmiClient.getVerificaBackendErogazione(soggetto, name, version, getConfigurazioneConnessione(ambiente));
				this.logger.debug("Invocazione completata con successo");
				return ResponseEntity.ok(esitoVerificaCertificatiScaduti);
			}
			catch(RuntimeException e) {
				this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
				throw e;
			}
			catch(Throwable e) {
				this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
				throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
			}
		// TODO
	}

	@Override
	public ResponseEntity<EsitoVerificaCertificatiInScadenza> ambienteErogazioniSoggettoNameVersionCertificatiInScadenzaGet(
			AmbienteEnum ambiente, String soggetto,
			String name, Integer version) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			EsitoVerificaCertificatiInScadenza esitoVerificaCertificatiInScadenza = this.allarmiClient.getCertificatoInScadenzaErogazione(soggetto, name, version, getConfigurazioneConnessione(ambiente));
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaCertificatiInScadenza);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaCertificatiScaduti> ambienteErogazioniSoggettoNameVersionCertificatiScadutiGet(
			AmbienteEnum ambiente, String soggetto,
			String name, Integer version) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			EsitoVerificaCertificatiScaduti esitoVerificaCertificatiScaduti = this.allarmiClient.getCertificatoScadutoErogazione(soggetto, name, version, getConfigurazioneConnessione(ambiente));
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaCertificatiScaduti);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}
	@Override
	public ResponseEntity<EsitoVerificaEventi> ambienteErogazioniSoggettoNameVersionConnectionTimeoutStatoGet(
			AmbienteEnum ambiente, String soggetto,
			String name, Integer version,
			OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     
			EsitoVerificaEventi esitoVerificaEventi = getInformazioniPuntuali(soggetto, TipoVerifica.CONNECTION_TIMEOUT, ambiente, null, name, version, dataInizioVerifica, dataFineVerifica);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaEventi);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaEventi> ambienteErogazioniSoggettoNameVersionRateLimitingStatoGet(
			AmbienteEnum ambiente, String soggetto,
			String name, Integer version,
			OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     
			EsitoVerificaEventi esitoVerificaEventi = getInformazioniPuntuali(soggetto, TipoVerifica.RATE_LIMITING, ambiente, null, name, version, dataInizioVerifica, dataFineVerifica);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaEventi);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaEventi> ambienteErogazioniSoggettoNameVersionReadTimeoutStatoGet(
			AmbienteEnum ambiente, String soggetto,
			String name, Integer version,
			OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     
			EsitoVerificaEventi esitoVerificaEventi = getInformazioniPuntuali(soggetto, TipoVerifica.READ_TIMEOUT, ambiente, null, name, version, dataInizioVerifica, dataFineVerifica);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaEventi);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaBackend> ambienteFruizioniSoggettoProviderNameVersionBackendStatoGet(
			AmbienteEnum ambiente, String soggetto,
			String provider,
			String name, Integer version) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			EsitoVerificaBackend esitoVerificaCertificatiScaduti = this.allarmiClient.getVerificaBackendFruizione(soggetto, provider, name, version, getConfigurazioneConnessione(ambiente));
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaCertificatiScaduti);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaCertificatiInScadenza> ambienteFruizioniSoggettoProviderNameVersionCertificatiInScadenzaGet(
			AmbienteEnum ambiente, String soggetto,
			String provider,
			String name, Integer version) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			EsitoVerificaCertificatiInScadenza esitoVerificaCertificatiInScadenza = this.allarmiClient.getCertificatoInScadenzaFruizione(soggetto, provider, name, version, getConfigurazioneConnessione(ambiente));
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaCertificatiInScadenza);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaCertificatiScaduti> ambienteFruizioniSoggettoProviderNameVersionCertificatiScadutiGet(
			AmbienteEnum ambiente, String soggetto,
			String provider,
			String name, Integer version) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			EsitoVerificaCertificatiScaduti esitoVerificaCertificatiScaduti = this.allarmiClient.getCertificatoScadutoFruizione(soggetto, provider, name, version, getConfigurazioneConnessione(ambiente));
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaCertificatiScaduti);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaEventi> ambienteFruizioniSoggettoProviderNameVersionConnectionTimeoutStatoGet(
			AmbienteEnum ambiente, String soggetto,
			String provider,
			String name, Integer version,
			OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     
			EsitoVerificaEventi esitoVerificaEventi = getInformazioniPuntuali(soggetto, TipoVerifica.CONNECTION_TIMEOUT, ambiente, provider, name, version, dataInizioVerifica, dataFineVerifica);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaEventi);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaEventi> ambienteFruizioniSoggettoProviderNameVersionRateLimitingStatoGet(
			AmbienteEnum ambiente, String soggetto,
			String provider,
			String name, Integer version,
			OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     
			EsitoVerificaEventi esitoVerificaEventi = getInformazioniPuntuali(soggetto, TipoVerifica.RATE_LIMITING, ambiente, provider, name, version, dataInizioVerifica, dataFineVerifica);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaEventi);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaEventi> ambienteFruizioniSoggettoProviderNameVersionReadTimeoutStatoGet(
			AmbienteEnum ambiente, String soggetto,
			String provider,
			String name, Integer version,
			OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     
			EsitoVerificaEventi esitoVerificaEventi = getInformazioniPuntuali(soggetto, TipoVerifica.READ_TIMEOUT, ambiente, provider, name, version, dataInizioVerifica, dataFineVerifica);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaEventi);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemServiziVerificati> ambienteServiziSoggettoBackendDetailsGet(
			AmbienteEnum ambiente, String soggetto,
			Integer page, Integer size, List<String> sort) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");

			CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("id"));
			List<ItemServizioVerificato> esitoVerificaCertificatiInScadenza = this.allarmiClient.getServiziBackendStato(getConfigurazioneConnessione(ambiente), soggetto);

			PagedModelItemServiziVerificati pmsv = filterAndSort(esitoVerificaCertificatiInScadenza, pageable);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(pmsv);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<ResocontoVerificaConnettivita> ambienteServiziSoggettoBackendStatoGet(AmbienteEnum ambiente,
			String soggetto) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			List<ItemServizioVerificato> esitoVerificaCertificatiInScadenza = this.allarmiClient.getServiziBackendStato(getConfigurazioneConnessione(ambiente), soggetto);
			
			ResocontoVerificaConnettivita pmsv = getResocontoConnettivita(esitoVerificaCertificatiInScadenza);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(pmsv);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemServiziVerificati> ambienteServiziSoggettoCertificatiInScadenzaGet(
			AmbienteEnum ambiente, String soggetto,
			Integer page, Integer size, List<String> sort) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");

			CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("id"));
			List<ItemServizioVerificato> esitoVerificaCertificatiInScadenza = this.allarmiClient.getCertificatiServiziInScadenza(getConfigurazioneConnessione(ambiente), soggetto);

			PagedModelItemServiziVerificati pmsv = filterAndSort(esitoVerificaCertificatiInScadenza, pageable);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(pmsv);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemServiziVerificati> ambienteServiziSoggettoCertificatiScadutiGet(
			AmbienteEnum ambiente, String soggetto,
			Integer page, Integer size, List<String> sort) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");

			CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("id"));
			List<ItemServizioVerificato> esitoVerificaCertificatiInScadenza = this.allarmiClient.getCertificatiServiziScaduti(getConfigurazioneConnessione(ambiente), soggetto);

			PagedModelItemServiziVerificati pmsv = filterAndSort(esitoVerificaCertificatiInScadenza, pageable);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(pmsv);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<ResocontoVerificaCertificati> ambienteServiziSoggettoCertificatiStatoGet(
			AmbienteEnum ambiente,
			String soggetto) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			List<ItemServizioVerificato> esitoVerificaCertificatiScaduti = this.allarmiClient.getCertificatiServiziScaduti(getConfigurazioneConnessione(ambiente), soggetto);
			List<ItemServizioVerificato> esitoVerificaCertificatiInScadenza = this.allarmiClient.getCertificatiServiziInScadenza(getConfigurazioneConnessione(ambiente), soggetto);
			
			ResocontoVerificaCertificati rvc = getResoconto(esitoVerificaCertificatiScaduti, esitoVerificaCertificatiInScadenza);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(rvc);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}


	@Override
	public ResponseEntity<PagedModelItemServiziVerificati> ambienteServiziSoggettoConnectionTimeoutDetailsGet(
			AmbienteEnum ambiente, String soggetto,
			OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica,
			Integer page, Integer size, List<String> sort) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");

			CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("id"));
			List<ItemServizioVerificato> esitoVerificaCertificatiInScadenza = getDetailServizi(soggetto, TipoVerifica.CONNECTION_TIMEOUT, ambiente, dataInizioVerifica, dataFineVerifica);

			PagedModelItemServiziVerificati pmsv = filterAndSort(esitoVerificaCertificatiInScadenza, pageable);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(pmsv);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<ResocontoVerificaConnettivitaPeriodo> ambienteServiziSoggettoConnectionTimeoutStatoGet(
			AmbienteEnum ambiente, String soggetto,
			OffsetDateTime periodo1DataInizioVerifica,
			OffsetDateTime periodo1DataFineVerifica,
			OffsetDateTime periodo2DataInizioVerifica,
			OffsetDateTime periodo2DataFineVerifica) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     
			ResocontoVerificaConnettivitaPeriodo esitoVerificaEventi = getResocontoVerificaConnettivitaPeriodo(soggetto, TipoVerifica.CONNECTION_TIMEOUT, ambiente, periodo1DataInizioVerifica, periodo1DataFineVerifica, periodo2DataInizioVerifica, periodo2DataFineVerifica);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaEventi);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemServiziVerificati> ambienteServiziSoggettoRateLimitingDetailsGet(
			AmbienteEnum ambiente, String soggetto,
			OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica,
			Integer page, Integer size, List<String> sort) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");

			CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("id"));
			List<ItemServizioVerificato> esitoVerificaCertificatiInScadenza = getDetailServizi(soggetto, TipoVerifica.RATE_LIMITING, ambiente, dataInizioVerifica, dataFineVerifica);

			PagedModelItemServiziVerificati pmsv = filterAndSort(esitoVerificaCertificatiInScadenza, pageable);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(pmsv);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<ResocontoVerificaConnettivitaPeriodo> ambienteServiziSoggettoRateLimitingStatoGet(
			AmbienteEnum ambiente, String soggetto,
			OffsetDateTime periodo1DataInizioVerifica,
			OffsetDateTime periodo1DataFineVerifica,
			OffsetDateTime periodo2DataInizioVerifica,
			OffsetDateTime periodo2DataFineVerifica) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     
			ResocontoVerificaConnettivitaPeriodo esitoVerificaEventi = getResocontoVerificaConnettivitaPeriodo(soggetto, TipoVerifica.RATE_LIMITING, ambiente, periodo1DataInizioVerifica, periodo1DataFineVerifica, periodo2DataInizioVerifica, periodo2DataFineVerifica);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaEventi);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemServiziVerificati> ambienteServiziSoggettoReadTimeoutDetailsGet(
			AmbienteEnum ambiente, String soggetto,
			OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica,
			Integer page, Integer size, List<String> sort) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");

			CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("id"));
			List<ItemServizioVerificato> esitoVerificaCertificatiInScadenza = getDetailServizi(soggetto, TipoVerifica.READ_TIMEOUT, ambiente, dataInizioVerifica, dataFineVerifica);

			PagedModelItemServiziVerificati pmsv = filterAndSort(esitoVerificaCertificatiInScadenza, pageable);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(pmsv);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<ResocontoVerificaConnettivitaPeriodo> ambienteServiziSoggettoReadTimeoutStatoGet(
			AmbienteEnum ambiente, String soggetto,
			OffsetDateTime periodo1DataInizioVerifica,
			OffsetDateTime periodo1DataFineVerifica,
			OffsetDateTime periodo2DataInizioVerifica,
			OffsetDateTime periodo2DataFineVerifica) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     
			ResocontoVerificaConnettivitaPeriodo esitoVerificaEventi = getResocontoVerificaConnettivitaPeriodo(soggetto, TipoVerifica.READ_TIMEOUT, ambiente, periodo1DataInizioVerifica, periodo1DataFineVerifica, periodo2DataInizioVerifica, periodo2DataFineVerifica);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaEventi);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaCertificatiInScadenza> ambienteSoggettiSoggettoCertificatiInScadenzaGet(
			AmbienteEnum ambiente,
			String soggetto) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			EsitoVerificaCertificatiInScadenza esitoVerificaCertificatiInScadenza = this.allarmiClient.getCertificatoInScadenzaSoggetto(soggetto, getConfigurazioneConnessione(ambiente));
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaCertificatiInScadenza);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaCertificatiScaduti> ambienteSoggettiSoggettoCertificatiScadutiGet(
			AmbienteEnum ambiente,
			String soggetto) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			EsitoVerificaCertificatiScaduti esitoVerificaCertificatiScaduti = this.allarmiClient.getCertificatoScadutoSoggetto(soggetto, getConfigurazioneConnessione(ambiente));
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaCertificatiScaduti);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemApplicativiVerificati> ambienteApplicativiCertificatiInScadenzaGet(
			AmbienteEnum ambiente, Integer page, Integer size, List<String> sort) {
		try {
			this.logger.info("Invocazione in corso ...");

			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");

			CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("id"));
			ConfigurazioneConnessione configurazioneConnessione = getConfigurazioneConnessione(ambiente);
			List<ItemApplicativoVerificato> esitoVerificaCertificatiInScadenza = this.allarmiClient.getCertificatiApplicativiInScadenza(configurazioneConnessione);

			PagedModelItemApplicativiVerificati pmsv = filterAndSortApplicativi(esitoVerificaCertificatiInScadenza, pageable);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(pmsv);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemApplicativiVerificati> ambienteApplicativiCertificatiScadutiGet(
			AmbienteEnum ambiente,
			Integer page, Integer size, List<String> sort) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			ConfigurazioneConnessione configurazioneConnessione = getConfigurazioneConnessione(ambiente);
			List<ItemApplicativoVerificato> esitoVerificaCertificatiInScadenza = this.allarmiClient.getCertificatiApplicativiScaduti(configurazioneConnessione);
			
			CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("id"));

			PagedModelItemApplicativiVerificati pmsv = filterAndSortApplicativi(esitoVerificaCertificatiInScadenza, pageable);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(pmsv);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<ResocontoVerificaCertificati> ambienteApplicativiCertificatiStatoGet(AmbienteEnum ambiente) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			List<ItemApplicativoVerificato> esitoVerificaCertificatiScaduti = this.allarmiClient.getCertificatiApplicativiScaduti(getConfigurazioneConnessione(ambiente));
			List<ItemApplicativoVerificato> esitoVerificaCertificatiInScadenza = this.allarmiClient.getCertificatiApplicativiInScadenza(getConfigurazioneConnessione(ambiente));
			
			ResocontoVerificaCertificati rvc = getResoconto(esitoVerificaCertificatiScaduti, esitoVerificaCertificatiInScadenza);
			
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(rvc);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaBackend> ambienteTokenPolicyNameBackendStatoGet(AmbienteEnum ambiente,
			@Pattern(regexp = "^[_A-Za-z][\\-\\._A-Za-z0-9]*$") @Size(max = 255) String name) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			EsitoVerificaBackend esitoVerificaCertificatiScaduti = this.allarmiClient.getVerificaBackendTokenPolicy(name, getConfigurazioneConnessione(ambiente));
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaCertificatiScaduti);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}
	@Override
	public ResponseEntity<EsitoVerificaCertificatiInScadenza> ambienteTokenPolicyNameCertificatiInScadenzaGet(
			AmbienteEnum ambiente, @Pattern(regexp = "^[_A-Za-z][\\-\\._A-Za-z0-9]*$") @Size(max = 255) String name) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			EsitoVerificaCertificatiInScadenza esitoVerificaCertificatiInScadenza = this.allarmiClient.getCertificatoInScadenzaTokenPolicy(name, getConfigurazioneConnessione(ambiente));
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaCertificatiInScadenza);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

	@Override
	public ResponseEntity<EsitoVerificaCertificatiScaduti> ambienteTokenPolicyNameCertificatiScadutiGet(
			AmbienteEnum ambiente, @Pattern(regexp = "^[_A-Za-z][\\-\\._A-Za-z0-9]*$") @Size(max = 255) String name) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			
			this.authorize();
			this.logger.debug("Autorizzazione completata con successo");     

			EsitoVerificaCertificatiScaduti esitoVerificaCertificatiScaduti = this.allarmiClient.getCertificatoScadutoTokenPolicy(name, getConfigurazioneConnessione(ambiente));
			this.logger.debug("Invocazione completata con successo");
			return ResponseEntity.ok(esitoVerificaCertificatiScaduti);
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500, Map.of(), e);
		}
	}

}
