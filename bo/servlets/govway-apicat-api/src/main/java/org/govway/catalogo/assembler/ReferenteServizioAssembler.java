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

import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.core.exceptions.NotFoundException;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.ReferenteServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Stato;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.servlets.model.Referente;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ReferenteServizioAssembler extends RepresentationModelAssemblerSupport<ReferenteServizioEntity, Referente> {

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

	@Autowired
	@Lazy
	private ServizioDettaglioAssembler servizioDettaglioAssembler;

	public ReferenteServizioAssembler() {
		super(ServiziController.class, Referente.class);
	}

	@Override
	public Referente toModel(ReferenteServizioEntity entity) {

		Referente dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setTipo(toTipoReferente(entity.getTipo()));

		// Determina quale DTO usare in base all'utente corrente
		UtenteEntity viewer = coreAuth.getUtenteSessione();
		UtenteEntity referente = entity.getReferente();

		if (viewer != null && (coreAuth.isAdmin(viewer) || viewer.equals(referente))) {
			// Admin o stesso utente: tutti i dati
			dettaglio.setUtente(utenteFullAssembler.toModel(referente));
		} else if (viewer != null && isSameOrganization(viewer, referente)) {
			// Stessa organizzazione: dati aziendali
			dettaglio.setUtente(utenteRestrictedAssembler.toModel(referente));
		} else {
			// Utente esterno o anonimo: solo dati pubblici
			dettaglio.setUtente(utentePublicAssembler.toModel(referente));
		}

		return dettaglio;
	}

	private boolean isSameOrganization(UtenteEntity viewer, UtenteEntity referente) {
		OrganizzazioneEntity viewerOrg = viewer.getOrganizzazione();
		OrganizzazioneEntity referenteOrg = referente.getOrganizzazione();
		return viewerOrg != null && referenteOrg != null && viewerOrg.equals(referenteOrg);
	}
	
	public TipoReferenteEnum toTipoReferente(TIPO_REFERENTE tipo) {
		switch(tipo) {
		case REFERENTE: return TipoReferenteEnum.REFERENTE;
		case REFERENTE_TECNICO: return TipoReferenteEnum.REFERENTE_TECNICO;
		}
		return null;
	}

	public TIPO_REFERENTE toTipoReferente(TipoReferenteEnum tipo) {
		if(tipo==null) return null;
		switch(tipo) {
		case REFERENTE: return TIPO_REFERENTE.REFERENTE;
		case REFERENTE_TECNICO: return TIPO_REFERENTE.REFERENTE_TECNICO;
		}
		return null;
	}

	public ReferenteServizioEntity toEntity(ReferenteCreate src, ServizioEntity servizio) {
		ReferenteServizioEntity entity = new ReferenteServizioEntity();
		BeanUtils.copyProperties(src, entity);
		
		TIPO_REFERENTE tipoReferente = toTipoReferente(src.getTipo());
		UtenteEntity utente = utenteService.find(src.getIdUtente())
				.orElseThrow(() -> new NotFoundException("Utente ["+src.getIdUtente()+"] non trovato"));
		
		if(!utente.getStato().equals(Stato.ABILITATO)) {
			throw new BadRequestException("L'utente ["+utente.getNome()+" "+utente.getCognome()+"] non risulta abilitato");
		}

		if(tipoReferente.equals(TIPO_REFERENTE.REFERENTE)) {
			if(utente.getRuolo() == null) {
				throw new BadRequestException("L'utente ["+utente.getNome()+" "+utente.getCognome()+"] non risulta referente servizio o gestore");
			}

		}
		entity.setReferente(utente);
		entity.setTipo(tipoReferente);
		
		entity.setServizio(servizio);

		boolean exists = servizio.getReferenti().stream().anyMatch(r -> r.getReferente().equals(entity.getReferente()) && r.getTipo().equals(entity.getTipo()));
		
		if(exists) {
			throw new BadRequestException("Utente ["+utente.getNome()+" "+utente.getCognome()+"] gia referente di tipo ["+entity.getTipo()+"] per il servizio ["+entity.getServizio().getNome()+"/"+entity.getServizio().getVersione()+"]");
		}
		
		this.servizioDettaglioAssembler.setUltimaModifica(servizio);

		return entity;
	}

}
