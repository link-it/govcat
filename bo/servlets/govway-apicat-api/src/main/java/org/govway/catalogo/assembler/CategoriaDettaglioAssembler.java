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

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.core.orm.entity.CategoriaEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.TassonomiaEntity;
import org.govway.catalogo.core.services.TassonomiaService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.Categoria;
import org.govway.catalogo.servlets.model.CategoriaCreate;
import org.govway.catalogo.servlets.model.CategoriaUpdate;
import org.govway.catalogo.servlets.model.ItemServizio;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class CategoriaDettaglioAssembler extends RepresentationModelAssemblerSupport<CategoriaEntity, Categoria> {

	@Autowired
	private TassonomiaService service;
	
	@Autowired
	private TassonomiaItemAssembler tassonomiaAssembler;
	
	@Autowired
	private ServizioItemAssembler servizioAssembler;
	
	@Autowired
	private CategoriaEngineAssembler categoriaEngineAssembler;
	
	public CategoriaDettaglioAssembler() {
		super(OrganizzazioniController.class, Categoria.class);
	}

	@Override
	public Categoria toModel(CategoriaEntity entity) {
		
		Categoria dettaglio = instantiateModel(entity);
		

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdCategoria(UUID.fromString(entity.getIdCategoria()));
		dettaglio.setTassonomia(this.tassonomiaAssembler.toModel(entity.getTassonomia()));
		dettaglio.setPathCategoria(this.categoriaEngineAssembler.getPathCategoria(entity));		

		if(entity.getFigli()!=null && !entity.getFigli().isEmpty()) {
			List<Categoria> figli = new ArrayList<>();
			for(CategoriaEntity figlio: entity.getFigli()) {
				figli.add(toModel(figlio));
			}
			
			
			Comparator<? super Categoria> c = new Comparator<>() {

				@Override
				public int compare(Categoria o1, Categoria o2) {
					return o1.getNome().compareTo(o2.getNome());
				}
			};
			
			figli = figli.stream().sorted(c).collect(Collectors.toList());
			
			dettaglio.setFigli(figli);
		}
		

		if(entity.getServizi()!=null && !entity.getServizi().isEmpty()) {
			List<ItemServizio> servizi = new ArrayList<>();
			for(ServizioEntity figlio: entity.getServizi()) {
				servizi.add(this.servizioAssembler.toModel(figlio));
			}
			dettaglio.setServizi(servizi);
		}

		return dettaglio;
	}
	
	public CategoriaEntity toEntity(CategoriaUpdate src, CategoriaEntity entity) {
		BeanUtils.copyProperties(src, entity);
		return entity;
	}
	
	
	public CategoriaEntity toEntity(CategoriaCreate src, TassonomiaEntity tassonomia) {
		CategoriaEntity entity = new CategoriaEntity();
		BeanUtils.copyProperties(src, entity);
		entity.setIdCategoria(UUID.randomUUID().toString());
		entity.setTassonomia(tassonomia);
		
		if(src.getCategoriaPadre()!=null) {
			CategoriaEntity padre = this.service.findCategoria(src.getCategoriaPadre()).orElseThrow(() -> new BadRequestException(ErrorCode.TAX_001));

			if(!padre.getTassonomia().getIdTassonomia().equals(entity.getTassonomia().getIdTassonomia())) {
				throw new BadRequestException(ErrorCode.TAX_002, java.util.Map.of("idCategoria", src.getCategoriaPadre().toString(), "tassonomia", entity.getTassonomia().toString()));
			}

			if(!padre.getServizi().isEmpty()) {
				throw new BadRequestException(ErrorCode.TAX_003, java.util.Map.of("idCategoria", src.getCategoriaPadre().toString(), "numeroServizi", String.valueOf(padre.getServizi().size())));
			}

			
			entity.setCategoriaPadre(padre);
		}
		
		return entity;
	}



}
