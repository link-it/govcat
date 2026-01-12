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
package org.govway.catalogo.assembler;

import java.util.UUID;

import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.SoggettoUpdate;
import org.govway.catalogo.servlets.model.TipoSoggettoGateway;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class SoggettoDettaglioAssembler extends RepresentationModelAssemblerSupport<SoggettoEntity, Soggetto> {

	@Autowired
	private OrganizzazioneService orgBd;

	@Autowired
	private OrganizzazioneItemAssembler organizzazioneItemAssembler;

	public SoggettoDettaglioAssembler() {
		super(SoggettiController.class, Soggetto.class);
	}

	@Override
	public Soggetto toModel(SoggettoEntity entity) {
		
		Soggetto dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdSoggetto(UUID.fromString(entity.getIdSoggetto()));
		dettaglio.setOrganizzazione(organizzazioneItemAssembler.toModel(entity.getOrganizzazione()));

		if(entity.getTipoGateway() != null) {
			dettaglio.setTipoGateway(toTipoGateway(entity.getTipoGateway()));
		}

		dettaglio.setVincolaSkipCollaudo(isVincolaSkipCollaudo(entity));
		dettaglio.setVincolaAderente(isVincolaAderente(entity));
		dettaglio.setVincolaReferente(isVincolaReferente(entity));

		return dettaglio;
	}
	
	public Boolean isVincolaReferente(SoggettoEntity entity) {
		return !entity.getDomini().isEmpty();
	}

	public Boolean isVincolaAderente(SoggettoEntity entity) {
		return !entity.getAdesioni().isEmpty();
	}

	public Boolean isVincolaSkipCollaudo(SoggettoEntity entity) {
		return entity.getDomini().stream().anyMatch(d -> d.isSkipCollaudo());
	}


	public SoggettoEntity toEntity(SoggettoUpdate src, SoggettoEntity entity) {
		BeanUtils.copyProperties(src, entity);
		

		if(src.getTipoGateway() != null) {
			entity.setTipoGateway(getTipoGateway(src.getTipoGateway()));
		} else {
			entity.setTipoGateway(null);
		}

		if(src.isSkipCollaudo() != null) {
			if(!src.isSkipCollaudo() && entity.isSkipCollaudo()) {
				if(isVincolaSkipCollaudo(entity)) {
					throw new BadRequestException("Impossibile disabilitare skip collaudo nel Soggetto ["+entity.getNome()+"], in quanto associato ad almeno un dominio con skip collaudo abilitato");
				}
			}
			entity.setSkipCollaudo(src.isSkipCollaudo());
		}


		if(src.isAderente() != null) {
			if(!src.isAderente() && entity.isAderente()) {
				if(isVincolaAderente(entity)) {
					throw new BadRequestException("Impossibile rendere il Soggetto ["+entity.getNome()+"] non aderente, in quanto associato ad almeno una adesione");
				}
			}
		}
		
		entity.setAderente(src.isAderente());

		if(src.isReferente() != null) {
			if(!src.isReferente() && entity.isReferente()) {
				if(isVincolaReferente(entity)) {
					throw new BadRequestException("Impossibile rendere il Soggetto ["+entity.getNome()+"] non referente, in quanto associato ad almeno un dominio");
				}
			}
		}
		
		entity.setReferente(src.isReferente());

		entity.setOrganizzazione(orgBd.find(src.getIdOrganizzazione()).orElseThrow(() -> new NotFoundException("Organizzazione ["+src.getIdOrganizzazione()+"] non trovata)")));
		return entity;
	}
	
	
	public SoggettoEntity toEntity(SoggettoCreate src) {
		SoggettoEntity entity = new SoggettoEntity();
		BeanUtils.copyProperties(src, entity);
		
		if(src.getTipoGateway() != null) {
			entity.setTipoGateway(getTipoGateway(src.getTipoGateway()));
		}

		entity.setSkipCollaudo(src.isSkipCollaudo());
		entity.setAderente(src.isAderente());
		entity.setReferente(src.isReferente());
		entity.setIdSoggetto(UUID.randomUUID().toString());
		entity.setOrganizzazione(orgBd.find(src.getIdOrganizzazione()).orElseThrow(() -> new NotFoundException("Organizzazione ["+src.getIdOrganizzazione()+"] non trovata)")));
		return entity;
	}

	private String getTipoGateway(TipoSoggettoGateway tipoGateway) {
		return tipoGateway.getValue();
	}

	private TipoSoggettoGateway toTipoGateway(String tipoGateway) {
		return TipoSoggettoGateway.fromValue(tipoGateway);
	}



}
