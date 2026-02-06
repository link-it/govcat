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

import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.servlets.model.ClasseUtente;
import org.govway.catalogo.servlets.model.ClasseUtenteCreate;
import org.govway.catalogo.servlets.model.ClasseUtenteUpdate;
import org.springframework.beans.BeanUtils;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ClasseUtenteDettaglioAssembler extends RepresentationModelAssemblerSupport<ClasseUtenteEntity, ClasseUtente> {

	public ClasseUtenteDettaglioAssembler() {
		super(OrganizzazioniController.class, ClasseUtente.class);
	}

	@Override
	public ClasseUtente toModel(ClasseUtenteEntity entity) {
		
		ClasseUtente dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdClasseUtente(UUID.fromString(entity.getIdClasseUtente()));
		return dettaglio;
	}
	
	public ClasseUtenteEntity toEntity(ClasseUtenteUpdate src, ClasseUtenteEntity entity) {
		BeanUtils.copyProperties(src, entity);
		return entity;
	}
	
	
	public ClasseUtenteEntity toEntity(ClasseUtenteCreate src) {
		ClasseUtenteEntity entity = new ClasseUtenteEntity();
		BeanUtils.copyProperties(src, entity);
		entity.setIdClasseUtente(UUID.randomUUID().toString());
		return entity;
	}



}
