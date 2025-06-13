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
import java.util.Optional;

import org.govway.catalogo.core.orm.entity.UtenteEntity.Ruolo;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Stato;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.RuoloUtenteEnumSearch;
import org.govway.catalogo.servlets.model.StatoUtenteEnum;

public class UtenteEngineAssembler extends CoreEngineAssembler {

	public Optional<Stato> toStatoEntity(Optional<StatoUtenteEnum> statoUtente) {
		if(statoUtente.isPresent()) {
			return Optional.of(toEntity(statoUtente.get()));
		} else {
			return Optional.empty();
		}
	}

	public Stato toEntity(StatoUtenteEnum statoUtente) {
		switch(statoUtente) {
		case ABILITATO: return Stato.ABILITATO;
		case DISABILITATO: return Stato.DISABILITATO;
		case NON_CONFIGURATO: return Stato.NON_CONFIGURATO;
		}
		return null;
	}

	public StatoUtenteEnum toStatoUtenteEnum(Stato statoUtente) {
		switch(statoUtente) {
		case ABILITATO: return StatoUtenteEnum.ABILITATO;
		case DISABILITATO: return StatoUtenteEnum.DISABILITATO;
		case NON_CONFIGURATO: return StatoUtenteEnum.NON_CONFIGURATO;
		}
		return null;
	}

	public RuoloUtenteEnum toRuolo(Ruolo ruolo) {
		switch(ruolo) {
		case AMMINISTRATORE: return RuoloUtenteEnum.GESTORE;
		case COORDINATORE: return RuoloUtenteEnum.COORDINATORE;
		case REFERENTE_SERVIZIO: return RuoloUtenteEnum.REFERENTE_SERVIZIO;
		default:
			break;
		}
		
		return null;
	}

	public List<Ruolo> toEntity(List<RuoloUtenteEnumSearch> ruolo) {
		if(ruolo == null || ruolo.isEmpty()) {
			return null;
		}
		
		List<Ruolo> r = new ArrayList<>();
		
		for(RuoloUtenteEnumSearch rr: ruolo) {
			switch(rr) {
			case GESTORE: r.add(Ruolo.AMMINISTRATORE);
				break;
			case COORDINATORE: r.add(Ruolo.COORDINATORE);
			break;
			case REFERENTE_SERVIZIO: r.add(Ruolo.REFERENTE_SERVIZIO);
				break;
			default:
				break;
			}
		}
		
		return r;
	}

	public Ruolo toEntity(RuoloUtenteEnum ruolo) {
		switch(ruolo) {
		case GESTORE: return Ruolo.AMMINISTRATORE;
		case COORDINATORE: return Ruolo.COORDINATORE;
		case REFERENTE_SERVIZIO: return Ruolo.REFERENTE_SERVIZIO;
		}
		
		return null;
	}

}
