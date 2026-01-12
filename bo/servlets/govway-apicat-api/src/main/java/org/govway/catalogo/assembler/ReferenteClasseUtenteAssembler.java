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

import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Stato;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.Referente;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ReferenteClasseUtenteAssembler extends RepresentationModelAssemblerSupport<UtenteEntity, Referente> {

	@Autowired
	private UtenteService utenteService;

	@Autowired
	private UtenteFullAssembler utenteFullAssembler;

	@Autowired
	private UtenteRestrictedAssembler utenteRestrictedAssembler;

	@Autowired
	private UtentePublicAssembler utentePublicAssembler;

	@Autowired
	private CoreAuthorization coreAuth;

	private TipoReferenteEnum tipoReferente;

	public ReferenteClasseUtenteAssembler() {
		super(AdesioniController.class, Referente.class);
	}

	@Override
	public Referente toModel(UtenteEntity entity) {

		Referente dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setTipo(this.tipoReferente);

		// Determina quale DTO usare in base all'utente corrente
		UtenteEntity viewer = coreAuth.getUtenteSessione();

		if (viewer != null && (coreAuth.isAdmin(viewer) || viewer.equals(entity))) {
			// Admin o stesso utente: tutti i dati
			dettaglio.setUtente(utenteFullAssembler.toModel(entity));
		} else if (viewer != null && isSameOrganization(viewer, entity)) {
			// Stessa organizzazione: dati aziendali
			dettaglio.setUtente(utenteRestrictedAssembler.toModel(entity));
		} else {
			// Utente esterno o anonimo: solo dati pubblici
			dettaglio.setUtente(utentePublicAssembler.toModel(entity));
		}

		return dettaglio;
	}

	private boolean isSameOrganization(UtenteEntity viewer, UtenteEntity referente) {
		OrganizzazioneEntity viewerOrg = viewer.getOrganizzazione();
		OrganizzazioneEntity referenteOrg = referente.getOrganizzazione();
		return viewerOrg != null && referenteOrg != null && viewerOrg.equals(referenteOrg);
	}

	public TIPO_REFERENTE toTipoReferente(TipoReferenteEnum tipo) {
		if(tipo==null) return null;
		switch(tipo) {
		case REFERENTE: return TIPO_REFERENTE.REFERENTE;
		case REFERENTE_TECNICO: return TIPO_REFERENTE.REFERENTE_TECNICO;
		}
		return null;
	}

	public ReferenteAdesioneEntity toEntity(ReferenteCreate src, AdesioneEntity adesione) {
		ReferenteAdesioneEntity entity = new ReferenteAdesioneEntity();
		BeanUtils.copyProperties(src, entity);
		
		TIPO_REFERENTE tipoReferente = toTipoReferente(src.getTipo());
		UtenteEntity utente = utenteService.find(src.getIdUtente())
				.orElseThrow(() -> new NotFoundException(ErrorCode.UT_404));
		
		if(!utente.getStato().equals(Stato.ABILITATO)) {
			throw new BadRequestException(ErrorCode.UT_404, java.util.Map.of("nomeUtente", utente.getNome(), "cognomeUtente", utente.getCognome()));
		}

		if(tipoReferente.equals(TIPO_REFERENTE.REFERENTE)) {
			if(utente.getOrganizzazione() == null || !utente.getOrganizzazione().getId().equals(adesione.getSoggetto().getOrganizzazione().getId())) {
				throw new BadRequestException(ErrorCode.UT_404, java.util.Map.of("nomeUtente", utente.getNome(), "cognomeUtente", utente.getCognome(), "nomeOrganizzazione", adesione.getSoggetto().getOrganizzazione().getNome()));
			}
		}

		entity.setTipo(tipoReferente);
		entity.setAdesione(adesione);
		entity.setReferente(utente);

		boolean exists = adesione.getReferenti().stream().anyMatch(r -> r.getReferente().equals(entity.getReferente()) && r.getTipo().equals(entity.getTipo()));

		if(exists) {
			throw new BadRequestException(ErrorCode.UT_404, java.util.Map.of("nomeUtente", entity.getReferente().getNome(), "cognomeUtente", entity.getReferente().getCognome(), "tipoReferente", entity.getTipo().toString()));
		}
		
		return entity;
	}

}
