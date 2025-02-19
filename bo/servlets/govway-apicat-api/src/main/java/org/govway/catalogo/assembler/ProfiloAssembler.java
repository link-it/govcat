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
import java.util.List;

import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Stato;
import org.govway.catalogo.servlets.model.Profilo;
import org.govway.catalogo.servlets.model.StatoProfiloEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ProfiloAssembler extends RepresentationModelAssemblerSupport<UtenteEntity, Profilo> {

	@Autowired
	private UtenteDettaglioAssembler utenteDettaglioAssembler;
	
	@Autowired
	private RequestUtils requestUtils;
	
	public ProfiloAssembler() {
		super(OrganizzazioniController.class, Profilo.class);
	}

	@Override
	public Profilo toModel(UtenteEntity entity) {
		
		Profilo dettaglio = instantiateModel(entity);
		dettaglio.setUtente(utenteDettaglioAssembler.toModel(entity));
		dettaglio.setStato(toStatoProfilo(entity.getStato()));
		dettaglio.setIdm(requestUtils.getIdm());
		dettaglio.setSettings(utenteDettaglioAssembler.toSettings(entity));
//		if(!entity.getRuolo().equals(Ruolo.AMMINISTRATORE)) {
//			dettaglio.setGrantServizi(requestUtils.getGrantServizi(entity));
//			dettaglio.setGrantAdesioni(requestUtils.getGrantAdesioni(entity));
//		}
		return dettaglio;
	}
	
	private StatoProfiloEnum toStatoProfilo(Stato stato) {
		if(stato == null) return null;
		switch(stato) {
		case ABILITATO: return StatoProfiloEnum.ABILITATO;
		case DISABILITATO: return StatoProfiloEnum.DISABILITATO;
		case NON_CONFIGURATO: return StatoProfiloEnum.NON_CONFIGURATO;
		}
		
		return null;
	}

	public List<String> getBlankContactFields(UtenteEntity utente) {
		
		List<String> fields = new ArrayList<>();
		
		if(utente.getIdUtente() == null) {
			fields.add("IdUtente");
		}
		if(utente.getNome() == null) {
			utente.setNome("NOME");
//			fields.add("Nome");
		}
		if(utente.getCognome() == null) {
			utente.setCognome("COGNOME");
//			fields.add("Cognome");
		}
		if(utente.getEmailAziendale() == null) {
			utente.setEmailAziendale("EMAILAZIENDALE");
//			fields.add("EmailAziendale");
		}
		if(utente.getTelefonoAziendale() == null) {
			utente.setTelefonoAziendale("TELEFONOAZIENDALE");
//			fields.add("TelefonoAziendale");
		}

		return fields;
	}

}
