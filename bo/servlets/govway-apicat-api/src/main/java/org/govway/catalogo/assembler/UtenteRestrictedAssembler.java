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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

/**
 * Assembler for restricted user view - organizational information visible to same organization.
 * Exposes: id_utente, nome, cognome, telefono_aziendale, email_aziendale, stato, referente_tecnico, organizzazione
 */
@Component
public class UtenteRestrictedAssembler extends RepresentationModelAssemblerSupport<UtenteEntity, ItemUtente> {

	@Autowired
	private OrganizzazioneItemAssembler organizzazioneItemAssembler;

	@Autowired
	private UtenteEngineAssembler utenteEngineAssembler;

	public UtenteRestrictedAssembler() {
		super(OrganizzazioniController.class, ItemUtente.class);
	}

	@Override
	public ItemUtente toModel(UtenteEntity entity) {
		ItemUtente dto = instantiateModel(entity);

		// Restricted view: organizational data
		dto.setIdUtente(UUID.fromString(entity.getIdUtente()));
		dto.setNome(entity.getNome());
		dto.setCognome(entity.getCognome());
		dto.setTelefonoAziendale(entity.getTelefonoAziendale());
		dto.setEmailAziendale(entity.getEmailAziendale());
		dto.setStato(utenteEngineAssembler.toStatoUtenteEnum(entity.getStato()));
		dto.setReferenteTecnico(entity.isReferenteTecnico());

		if (entity.getOrganizzazione() != null) {
			dto.setOrganizzazione(organizzazioneItemAssembler.toModel(entity.getOrganizzazione()));
		}

		// Sensitive fields remain null: principal, email, telefono, ruolo, classi_utente

		return dto;
	}

}
