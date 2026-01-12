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

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.core.orm.entity.GruppoEntity;
import org.govway.catalogo.core.services.GruppoService;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.RichiestaNonValidaSemanticamenteException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.GruppoUpdate;
import org.govway.catalogo.servlets.model.TipoServizio;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.hateoas.server.mvc.WebMvcLinkBuilder;

public class GruppoDettaglioAssembler extends RepresentationModelAssemblerSupport<GruppoEntity, Gruppo> {

	@Autowired
	private GruppoService gruppoService;
	
	@Autowired
	private GruppoEngineAssembler engine;
	
	public GruppoDettaglioAssembler() {
		super(OrganizzazioniController.class, Gruppo.class);
	}

	@Override
	public Gruppo toModel(GruppoEntity entity) {
		
		Gruppo dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdGruppo(UUID.fromString(entity.getIdGruppo()));

		dettaglio.setTipo(engine.toTipo(entity.getTipo()));

//		if(entity.getGruppoPadre() != null) {
//			dettaglio.setPadre(engine.toGerarchiaGruppoModel(entity.getGruppoPadre()));
//		}
	
		if(!entity.getFigli().isEmpty()) {

			List<Gruppo> lst = new ArrayList<>();
			for(GruppoEntity figlio: entity.getFigli()) {
				lst.add(toModel(figlio));
			}
			dettaglio.setFigli(lst);
		}
		
		dettaglio.setImmagine(engine.getImmagine(entity));

		try {

			if(dettaglio.getImmagine()!=null) {
				Link link = WebMvcLinkBuilder.
						linkTo(Class.forName(GruppiController.class.getName()).getMethod("getImmagineGruppo", UUID.class), dettaglio.getIdGruppo()).withRel("immagine");
				
				dettaglio.add(link);
			}
		} catch (NoSuchMethodException | SecurityException | ClassNotFoundException e) {
			throw new RuntimeException(e);
		}


		return dettaglio;
	}
	
	public GruppoEntity toEntity(GruppoUpdate src, GruppoEntity entity) {
		BeanUtils.copyProperties(src, entity);
		
		if(src.getPadre()!= null) {
			if(src.getPadre().toString().equals(entity.getIdGruppo())) {
				throw new NotFoundException(ErrorCode.GRP_404);
			}
			
			entity.setGruppoPadre(this.gruppoService.find(src.getPadre())
					.orElseThrow(() -> new NotFoundException(ErrorCode.GRP_404))
					);
		} else {
			entity.setGruppoPadre(null);
		}

		org.govway.catalogo.core.orm.entity.TipoServizio tipo = engine.toTipo(src.getTipo());
		
		if(!tipo.equals(entity.getTipo())) {
			if(!entity.getServizi().isEmpty()) {
				throw new RichiestaNonValidaSemanticamenteException(ErrorCode.VAL_422);
			}
			entity.setTipo(tipo);
		}

		entity.setAlberatura(this.engine.getAlberatura(entity));
		entity.setImmagine(engine.toImmagine(src.getImmagine(), entity.getImmagine()));
		
		return entity;
	}
	
	
	public GruppoEntity toEntity(GruppoCreate src) {
		GruppoEntity entity = new GruppoEntity();
		BeanUtils.copyProperties(src, entity);

		entity.setIdGruppo(UUID.randomUUID().toString());

		if(src.getPadre()!= null) {
			if(src.getPadre().toString().equals(entity.getIdGruppo())) {
				throw new NotFoundException(ErrorCode.GRP_404);
			}
			
			entity.setGruppoPadre(this.gruppoService.find(src.getPadre())
					.orElseThrow(() -> new NotFoundException(ErrorCode.GRP_404))
					);
		}
		
		entity.setTipo(engine.toTipo(src.getTipo()));

		entity.setAlberatura(this.engine.getAlberatura(entity));
		if(src.getImmagine()!=null) {
			entity.setImmagine(engine.toImmagine(src.getImmagine()));
		}
		

		return entity;
	}

	public org.govway.catalogo.core.orm.entity.TipoServizio toTipo(TipoServizio tipo) {
		return this.engine.toTipo(tipo);
	}

	public TipoServizio toTipo(org.govway.catalogo.core.orm.entity.TipoServizio tipo) {
		return this.engine.toTipo(tipo);
	}

}
