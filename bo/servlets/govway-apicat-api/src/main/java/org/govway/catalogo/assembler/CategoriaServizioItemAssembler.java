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
import org.govway.catalogo.servlets.model.ItemCategoriaServizio;
import org.govway.catalogo.servlets.model.ItemServizio;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class CategoriaServizioItemAssembler extends RepresentationModelAssemblerSupport<CategoriaEntity, ItemCategoriaServizio> {

	@Autowired
	private TassonomiaItemAssembler tassonomiaAssembler;
	
	@Autowired
	private ServizioItemAssembler servizioAssembler;
	
	@Autowired
	private CategoriaEngineAssembler categoriaEngineAssembler;
	
	public CategoriaServizioItemAssembler() {
		super(OrganizzazioniController.class, ItemCategoriaServizio.class);
	}

	@Override
	public ItemCategoriaServizio toModel(CategoriaEntity entity) {
		
		ItemCategoriaServizio dettaglio = instantiateModel(entity);
		

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdCategoria(UUID.fromString(entity.getIdCategoria()));
		dettaglio.setTassonomia(this.tassonomiaAssembler.toModel(entity.getTassonomia()));
		dettaglio.setPathCategoria(this.categoriaEngineAssembler.getPathCategoria(entity));
		

		if(entity.getFigli()!=null && !entity.getFigli().isEmpty()) {
			List<ItemCategoriaServizio> figli = new ArrayList<>();
			for(CategoriaEntity figlio: entity.getFigli()) {
				figli.add(toModel(figlio));
			}
			
			
			Comparator<? super ItemCategoriaServizio> c = new Comparator<>() {

				@Override
				public int compare(ItemCategoriaServizio o1, ItemCategoriaServizio o2) {
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
	
}
