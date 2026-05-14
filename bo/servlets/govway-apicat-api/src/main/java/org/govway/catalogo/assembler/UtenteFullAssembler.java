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

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteOrganizzazioneEntity;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.servlets.model.ItemUtente;
import org.govway.catalogo.servlets.model.RuoloOrganizzazioneEnum;
import org.govway.catalogo.servlets.model.UtenteOrganizzazione;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

@Component
public class UtenteFullAssembler extends RepresentationModelAssemblerSupport<UtenteEntity, ItemUtente> {

	@Autowired
	private OrganizzazioneItemAssembler organizzazioneItemAssembler;

	@Autowired
	private UtenteEngineAssembler utenteEngineAssembler;

	@Autowired
	private ClasseUtenteItemAssembler classeUtenteItemAssembler;

	@Autowired
	private UtenteService utenteService;

	public UtenteFullAssembler() {
		super(OrganizzazioniController.class, ItemUtente.class);
	}

	@Override
	public ItemUtente toModel(UtenteEntity entity) {

		ItemUtente dettaglio = instantiateModel(entity);
		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdUtente(UUID.fromString(entity.getIdUtente()));
		dettaglio.setPrincipal(entity.getPrincipal());

		if (entity.getAziendaEsterna() != null) {
			dettaglio.setAziendaEsterna(entity.getAziendaEsterna().getNome());
		}

		// Multi-org: popola la lista delle associazioni utente-organizzazione
		List<UtenteOrganizzazioneEntity> associazioni = utenteService.findUtenteOrganizzazioniByUtente(entity);
		if (associazioni != null && !associazioni.isEmpty()) {
			dettaglio.setOrganizzazioni(associazioni.stream()
					.map(this::toUtenteOrganizzazione)
					.collect(Collectors.toList()));
		}

		dettaglio.setStato(utenteEngineAssembler.toStatoUtenteEnum(entity.getStato()));

		if(entity.getRuolo()!=null) {
			dettaglio.setRuolo(utenteEngineAssembler.toRuolo(entity.getRuolo()));
		}

		dettaglio.setClassiUtente(classeUtenteItemAssembler.toCollectionModel(entity.getClassi()).getContent().stream().collect(Collectors.toList()));

		return dettaglio;
	}

	private UtenteOrganizzazione toUtenteOrganizzazione(UtenteOrganizzazioneEntity assoc) {
		UtenteOrganizzazione model = new UtenteOrganizzazione();
		model.setOrganizzazione(organizzazioneItemAssembler.toModel(assoc.getOrganizzazione()));
		if (assoc.getRuoloOrganizzazione() != null) {
			switch (assoc.getRuoloOrganizzazione()) {
			case AMMINISTRATORE_ORGANIZZAZIONE:
				model.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
				break;
			case OPERATORE_API:
				model.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.OPERATORE_API);
				break;
			}
		}
		return model;
	}

}
