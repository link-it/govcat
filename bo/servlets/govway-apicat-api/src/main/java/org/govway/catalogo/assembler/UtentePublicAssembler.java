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
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.servlets.model.ItemUtente;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

/**
 * Assembler for public user view - minimal information visible to all users.
 * Only exposes: id_utente, nome, cognome
 */
@Component
public class UtentePublicAssembler extends RepresentationModelAssemblerSupport<UtenteEntity, ItemUtente> {

	public UtentePublicAssembler() {
		super(OrganizzazioniController.class, ItemUtente.class);
	}

	@Override
	public ItemUtente toModel(UtenteEntity entity) {
		ItemUtente dto = instantiateModel(entity);

		// Public view: only basic identification
		dto.setIdUtente(UUID.fromString(entity.getIdUtente()));
		dto.setNome(entity.getNome());
		dto.setCognome(entity.getCognome());
		// All other fields remain null

		return dto;
	}

}
