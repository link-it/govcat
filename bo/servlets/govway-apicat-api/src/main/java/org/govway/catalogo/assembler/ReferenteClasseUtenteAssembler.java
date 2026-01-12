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

import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.core.exceptions.NotFoundException;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity;
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
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ReferenteClasseUtenteAssembler extends RepresentationModelAssemblerSupport<UtenteEntity, Referente> {

	@Autowired
	private UtenteService utenteService;

	@Autowired
	private UtenteItemAssembler utenteItemAssembler;

	private TipoReferenteEnum tipoReferente;
	
	public ReferenteClasseUtenteAssembler() {
		super(AdesioniController.class, Referente.class);
	}

	@Override
	public Referente toModel(UtenteEntity entity) {
		
		Referente dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setTipo(this.tipoReferente);
		dettaglio.setUtente(utenteItemAssembler.toModel(entity));
		return dettaglio;
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
				.orElseThrow(() -> new NotFoundException("Utente ["+src.getIdUtente()+"] non trovato"));
		
		if(!utente.getStato().equals(Stato.ABILITATO)) {
			throw new BadRequestException("L'utente ["+utente.getNome()+" "+utente.getCognome()+"] non risulta abilitato");
		}

		if(tipoReferente.equals(TIPO_REFERENTE.REFERENTE)) {
			if(utente.getOrganizzazione() == null || !utente.getOrganizzazione().getId().equals(adesione.getSoggetto().getOrganizzazione().getId())) {
				throw new BadRequestException("L'utente ["+utente.getNome()+" "+utente.getCognome()+"] non afferisce all'organizzazione ["+adesione.getSoggetto().getOrganizzazione().getNome()+"] dell'adesione");
			}
		}

		entity.setTipo(tipoReferente);
		entity.setAdesione(adesione);
		entity.setReferente(utente);
		
		boolean exists = adesione.getReferenti().stream().anyMatch(r -> r.getReferente().equals(entity.getReferente()) && r.getTipo().equals(entity.getTipo()));
		
		if(exists) {
			throw new BadRequestException("Utente ["+entity.getReferente().getNome()+" "+entity.getReferente().getCognome()+"] gia referente di tipo ["+entity.getTipo()+"] per l'adesione ["+entity.getAdesione()+"]");
		}
		
		return entity;
	}

}
