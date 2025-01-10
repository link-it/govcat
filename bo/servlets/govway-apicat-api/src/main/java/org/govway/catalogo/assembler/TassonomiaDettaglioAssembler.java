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

import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.core.orm.entity.CategoriaEntity;
import org.govway.catalogo.core.orm.entity.TassonomiaEntity;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.servlets.model.Tassonomia;
import org.govway.catalogo.servlets.model.TassonomiaCreate;
import org.govway.catalogo.servlets.model.TassonomiaUpdate;
import org.springframework.beans.BeanUtils;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class TassonomiaDettaglioAssembler extends RepresentationModelAssemblerSupport<TassonomiaEntity, Tassonomia> {

	public TassonomiaDettaglioAssembler() {
		super(OrganizzazioniController.class, Tassonomia.class);
	}

	@Override
	public Tassonomia toModel(TassonomiaEntity entity) {
		
		Tassonomia dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdTassonomia(UUID.fromString(entity.getIdTassonomia()));
		return dettaglio;
	}
	
	public TassonomiaEntity toEntity(TassonomiaUpdate src, TassonomiaEntity entity) {
		BeanUtils.copyProperties(src, entity);
		
		if(src.isVisibile()!=null) {
			entity.setVisibile(src.isVisibile());
		}
		if(src.isObbligatorio()!=null) {
			entity.setObbligatorio(src.isObbligatorio());
		}

		check(entity);
		return entity;
	}
	
	
	public TassonomiaEntity toEntity(TassonomiaCreate src) {
		TassonomiaEntity entity = new TassonomiaEntity();
		BeanUtils.copyProperties(src, entity);
		entity.setIdTassonomia(UUID.randomUUID().toString());
		if(src.isVisibile()!=null) {
			entity.setVisibile(src.isVisibile());
		}
		if(src.isObbligatorio()!=null) {
			entity.setObbligatorio(src.isObbligatorio());
		}

		check(entity);
		return entity;
	}

	private void check(TassonomiaEntity entity) {
		if(entity.isVisibile()) {
			if(entity.getCategorie().isEmpty()) {
				throw new BadRequestException("Impossibile abilitare la Tassonomia ["+entity.getNome()+"]. Nessuna Categoria associata");
			}
		} else {

			if(entity.getCategorie() != null) {
				for(CategoriaEntity c: entity.getCategorie()) {
					if(!c.getServizi().isEmpty()) {	
						throw new BadRequestException("Impossibile disabilitare la Tassonomia ["+entity.getNome()+"]. Categoria ["+c.getNome()+"] associata a "+c.getServizi().size()+" servizi");
					}
				}
			}
			
		}
	}



}
