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
package org.govway.catalogo.assembler;

import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.ClasseUtenteService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.RichiestaNonValidaSemanticamenteException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.DominioUpdate;
import org.govway.catalogo.servlets.model.VisibilitaDominioEnum;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class DominioDettaglioAssembler extends RepresentationModelAssemblerSupport<DominioEntity, Dominio> {

	@Autowired
	private SoggettoItemAssembler soggettoItemAssmbler;
	
	@Autowired
	private SoggettoService soggettoService;
	
	@Autowired
	private DominioEngineAssembler engine;
	
	@Autowired
	private ClasseUtenteService classeUtenteService;

	@Autowired
	private ClasseUtenteItemAssembler classeUtenteItemAssembler;

	public DominioDettaglioAssembler() {
		super(DominiController.class, Dominio.class);
	}

	@Override
	public Dominio toModel(DominioEntity entity) {
		
		Dominio dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdDominio(UUID.fromString(entity.getIdDominio()));
		dettaglio.setDeprecato(entity.isDeprecato());
		dettaglio.setVincolaSkipCollaudo(isVincolaSkipCollaudo(entity));

		dettaglio.setSoggettoReferente(this.soggettoItemAssmbler.toModel(entity.getSoggettoReferente()));
		dettaglio.setVisibilita(this.engine.toVisibilita(entity.getVisibilita()));
		dettaglio.setClassi(classeUtenteItemAssembler.toCollectionModel(entity.getClassi()).getContent().stream().collect(Collectors.toList()));
		return dettaglio;
	}
	
	public DominioEntity toEntity(DominioUpdate src, DominioEntity entity) {
		BeanUtils.copyProperties(src, entity);

		entity.setDeprecato(src.isDeprecato());

		SoggettoEntity soggetto = soggettoService.find(src.getIdSoggettoReferente()).orElseThrow(() -> new NotFoundException(ErrorCode.ORG_005));

		if(!soggetto.isReferente()) {
			throw new BadRequestException(ErrorCode.VAL_001);
		}
		
		entity.setSoggettoReferente(soggetto);

		if(src.isSkipCollaudo() != null) {
			if(!src.isSkipCollaudo() && entity.isSkipCollaudo()) {
				if(isVincolaSkipCollaudo(entity)) {
					throw new BadRequestException(ErrorCode.GEN_001);
				}
			}
			setSkipCollaudo(src.isSkipCollaudo(), entity);
		}
		
		if(entity.isSkipCollaudo() && !entity.getSoggettoReferente().isSkipCollaudo()) {
			throw new RichiestaNonValidaSemanticamenteException(ErrorCode.VAL_011);
		}

		entity.setVisibilita(this.engine.toVisibilita(src.getVisibilita()));
		if(src.getClassi()!= null) {
			entity.getClassi().clear();
			for(UUID classe: src.getClassi()) {
				entity.getClassi().add(this.classeUtenteService.findByIdClasseUtente(classe)
						.orElseThrow(() -> new NotFoundException(ErrorCode.ORG_009)));
			}
		} else {
			entity.getClassi().clear();
		}
		return entity;
	}

	private boolean isVincolaSkipCollaudo(DominioEntity entity) {
		return entity.getServizi().stream().anyMatch(s -> s.isSkipCollaudo());
	}

	private void setSkipCollaudo(Boolean skipCollaudo, DominioEntity entity) {
		entity.setSkipCollaudo(skipCollaudo);

		if(entity.isSkipCollaudo() && !entity.getSoggettoReferente().isSkipCollaudo()) {
			throw new BadRequestException(ErrorCode.GEN_001);
		}
	}
	

	
	
	public DominioEntity toEntity(DominioCreate src) {
		DominioEntity entity = new DominioEntity();
		BeanUtils.copyProperties(src, entity);
		
		entity.setDeprecato(src.isDeprecato());
		entity.setIdDominio(UUID.randomUUID().toString());
		SoggettoEntity soggetto = soggettoService.find(src.getIdSoggettoReferente()).orElseThrow(() -> new NotFoundException(ErrorCode.ORG_005));

		if(!soggetto.isReferente()) {
			throw new BadRequestException(ErrorCode.VAL_001);
		}
		
		entity.setSoggettoReferente(soggetto);
		entity.setVisibilita(this.engine.toVisibilita(src.getVisibilita()));
		
		setSkipCollaudo(src.isSkipCollaudo(), entity);

		if(src.getClassi()!= null) {
			entity.getClassi().clear();
			for(UUID classe: src.getClassi()) {
				entity.getClassi().add(this.classeUtenteService.findByIdClasseUtente(classe)
						.orElseThrow(() -> new NotFoundException(ErrorCode.ORG_009)));
			}
		} else {
			entity.getClassi().clear();
		}

		return entity;
	}

	public VISIBILITA toVisibilita(VisibilitaDominioEnum visibilita) {
		return engine.toVisibilita(visibilita);
	}



}
