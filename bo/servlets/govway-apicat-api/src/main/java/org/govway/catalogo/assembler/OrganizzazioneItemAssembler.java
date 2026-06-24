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
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.servlets.model.ItemOrganizzazione;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.web.context.request.RequestContextHolder;

public class OrganizzazioneItemAssembler extends RepresentationModelAssemblerSupport<OrganizzazioneEntity, ItemOrganizzazione> {

	@Autowired
	@Lazy
	private SoggettoItemAssembler soggettoItemAssembler;

	@Autowired
	private AssemblerRequestCache cache;


	public OrganizzazioneItemAssembler() {
		super(OrganizzazioniController.class, ItemOrganizzazione.class);
	}

	@Override
	public ItemOrganizzazione toModel(OrganizzazioneEntity entity) {
		// Memoization per-richiesta: la stessa organizzazione ricorre in molti elementi della lista
		// (e il calcolo di multi_soggetto naviga la collezione soggetti). Fuori da una richiesta HTTP
		// (cache non disponibile) si assembla normalmente.
		if(RequestContextHolder.getRequestAttributes() == null) {
			return buildModel(entity);
		}
		return this.cache.getOrganizzazioni().computeIfAbsent(entity.getId(), k -> buildModel(entity));
	}

	private ItemOrganizzazione buildModel(OrganizzazioneEntity entity) {

		ItemOrganizzazione dettaglio = instantiateModel(entity);


		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdOrganizzazione(UUID.fromString(entity.getIdOrganizzazione()));
		dettaglio.setMultiSoggetto(entity.getSoggetti().size() > 1);

		if(entity.getSoggettoDefault()!=null) {
			dettaglio.setSoggettoDefault(this.soggettoItemAssembler.toLimitedModel(entity.getSoggettoDefault()));
		}

		return dettaglio;
	}

}
