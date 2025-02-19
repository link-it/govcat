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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.govway.catalogo.core.dao.specifications.ApiSpecification;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.ErogazioneEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.AdesioneService;
import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.monitor.controllers.StatisticheController.ErogazioneFruizioneEnum;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneProfilo;
import org.govway.catalogo.servlets.monitor.model.AmbienteEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public class FiltriUtils {

	
	@Autowired
	private ServizioService servizioService;

	@Autowired
	private SoggettoService soggettoService;

	@Autowired
	private ApiService apiService;

	@Autowired
	private AdesioneService adesioneService;

	@Autowired
	private Configurazione configurazione;   

	public String getProfilo(UUID idServizio, UUID idApi) {
		return this.servizioService.runTransaction(() -> {
			ServizioEntity servizio = this.servizioService.find(idServizio)
					.orElseThrow(() -> new NotFoundException("Servizio ["+idServizio+"] non trovato"));
	
			ApiEntity api = null;
			if(idApi != null) {
				api = this.apiService.find(idApi)
					.orElseThrow(() -> new NotFoundException("API ["+idApi+"] non trovata"));
			}
	
			String ridefinito = null;
			
			for(ApiEntity c: servizio.getApi()) {
				if(api == null || api.getId().equals(c.getId())) {
					List<AuthTypeEntity> authTypeList = c.getAuthType();
					for(AuthTypeEntity at: authTypeList) {
						if(ridefinito == null) {
							Optional<ConfigurazioneProfilo> pr = this.configurazione.getServizio().getApi().getProfili()
									.stream()
								.filter(p -> p.getCodiceInterno().equals(at.getProfilo())).findAny();
							if(pr.isPresent() && pr.get().getProfiloGovway()!=null) {
								ridefinito = pr.get().getProfiloGovway();
							}
						}
					}
				}
			}
			
			if(ridefinito != null) {
				return ridefinito;
			} else {
				return this.configurazione.getMonitoraggio().getProfiloGovwayDefault();
			}
			
		});

	}

	public ApiEntity findAPI(String nome, Integer versione, SoggettoEntity soggetto) {
		ApiSpecification spec = new ApiSpecification();
		spec.setNome(Optional.of(nome));
		spec.setVersione(Optional.of(versione));
		Page<ApiEntity> findAll = this.apiService.findAll(spec, Pageable.unpaged());
		
		ApiEntity api = null;
		if(findAll.isEmpty()) {
			return null;
//			throw new NotFoundException("API ["+nome+"/"+versione+"/"+soggetto.getNome()+"] non trovata");
		} else {
			if(findAll.getSize() == 1) {
				api = findAll.stream().findAny().get();
			} else {
				Optional<ApiEntity> oApi = this.apiService.findByNomeVersioneSoggetto(nome, versione, UUID.fromString(soggetto.getIdSoggetto()));
				if(oApi.isPresent()) {
					api = oApi.get();
				} else {
					api = findAll.stream().findAny().get();
				}
			}
		}
		return api;
	}
	
	public String getSoggettoNome(String nome) {

		SoggettoEntity soggetto = this.soggettoService.findByNome(nome)
				.orElseThrow(() -> new NotFoundException("Soggetto ["+nome+"] non trovato"));
		return soggetto.getNomeGateway() != null ? soggetto.getNomeGateway(): soggetto.getNome();
	}

	public List<IdApi> getApi(UUID idServizio, UUID idApi, UUID idAdesione, AmbienteEnum ambiente) {
		
		return this.servizioService.runTransaction(() -> {
			ServizioEntity servizio = this.servizioService.find(idServizio)
					.orElseThrow(() -> new NotFoundException("Servizio ["+idServizio+"] non trovato"));
	
			ApiEntity api = null;
			if(idApi != null) {
				
				api = this.apiService.find(idApi)
					.orElseThrow(() -> new NotFoundException("API ["+idApi+"] non trovata"));
				
				if(!api.getServizi().stream()
					.anyMatch(s -> s.getId().equals(servizio.getId()))) {
					throw new BadRequestException("API ["+api.getNome() + "/" +api.getVersione()+"] non associata al servizio " + servizio.getNome() + "/" + servizio.getVersione());
				}

			}
	
			AdesioneEntity adesione = null;
			if(idAdesione != null) {
				adesione = this.adesioneService.findByIdAdesione(idAdesione.toString())
					.orElseThrow(() -> new NotFoundException("Adesione ["+idAdesione+"] non trovata"));
			}
	
			List<IdApi> apiLst = new ArrayList<>();
			for(ApiEntity ap: servizio.getApi()) {
				if(api == null || api.getId().equals(ap.getId())) {
					ApiConfigEntity conf = ambiente.equals(AmbienteEnum.COLLAUDO) ? ap.getCollaudo(): ap.getProduzione();
					if(ap.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO)) {
						
 						IdApi id = new IdApi();
						id.setNome(conf.getNomeGateway() != null ? conf.getNomeGateway(): ap.getNome());
						id.setVersione(conf.getVersioneGateway() != null ? conf.getVersioneGateway(): ap.getVersione());
						id.setRuolo(ap.getRuolo());
						id.setProtocollo(conf.getProtocollo());

						if(servizio.getSoggettoInterno()!=null) {
							id.setFruizione(true);
						}

						if(adesione != null) {
							id.setSoggetto(getSoggettoNome(adesione.getSoggetto().getNome()));
						} else {
							id.setSoggetto(getSoggettoNome(servizio.getDominio().getSoggettoReferente().getNome()));
						}

						apiLst.add(id);
					} else {
						for(AdesioneEntity ades: servizio.getAdesioni()) {
							if(idAdesione == null || ades.getIdAdesione().equals(idAdesione.toString())) {
								if(this.configurazione.getAdesione().getStatiSchedaAdesione().contains(ades.getStato())) {
									for(ErogazioneEntity e: ades.getErogazioni()) {
										if(e.getApi() != null && e.getApi().getId().equals(ap.getId())) {
											IdApi idErog = new IdApi();
											idErog.setNome(e.getApi().getNome());
											idErog.setVersione(e.getApi().getVersione());
											idErog.setRuolo(ap.getRuolo());
											idErog.setProtocollo(conf.getProtocollo());
											idErog.setSoggetto(getSoggettoNome(ades.getSoggetto().getNome()));
											
											apiLst.add(idErog);
										}
									}
								} else {
									if(idAdesione != null && ades.getIdAdesione().equals(idAdesione.toString())) {
										throw new BadRequestException("L'adesione specificata si trova nello stato " + ades.getStato());
									}
								}
							}
						}
					}
				}
			}
			
			if(apiLst.isEmpty()) {
				throw new BadRequestException("Nessuna API trovata");
			}
			
			return apiLst;
		});

	}
	
}
