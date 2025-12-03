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

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.core.business.utils.NotificheUtils;
import org.govway.catalogo.core.business.utils.RuoloNotificaEnum;
import org.govway.catalogo.core.orm.entity.NotificaEntity;
import org.govway.catalogo.core.orm.entity.NotificaEntity.STATO;
import org.govway.catalogo.core.orm.entity.NotificaEntity.TIPO;
import org.govway.catalogo.core.orm.entity.NotificaEntity.TIPO_ENTITA;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.servlets.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

public class NotificaEngineAssembler extends CoreEngineAssembler {

    private static final Logger log = LoggerFactory.getLogger(NotificaEngineAssembler.class);
    @Autowired
	private NotificheUtils notificheUtils;
	
	@Autowired
	private AdesioneItemAssembler adesioneItemAssembler;
	
	@Autowired
	private ServizioItemAssembler servizioItemAssembler;
	
	public EntitaNotifica getEntita(NotificaEntity entity) {
		EntitaNotifica en = new EntitaNotifica();
		TipoEntitaNotifica tipo = this.getTipoEntitaNotifica(entity.getTipoEntita());
		en.setTipoEntitaPadre(tipo);
		en.setIdEntita(UUID.fromString(entity.getIdEntita()));
		
		switch(tipo) {
		case ADESIONE: en.setAdesione(getAdesione(entity)); 
			break;
		case SERVIZIO: en.setServizio(getServizio(entity));
			break;}
		
		return en;
	}

	public ItemAdesione getAdesione(NotificaEntity entity) {
		return this.adesioneItemAssembler.toModel(entity.getAdesione());
	}

	public ItemServizio getServizio(NotificaEntity entity) {
		return this.servizioItemAssembler.toModel(entity.getServizio());
	}

	public TipoNotifica getTipoNotifica(NotificaEntity entity) {
		TipoNotificaEnum tipo = this.getTipoNotificaEnum(entity.getTipo());

		switch(tipo) {
		case CAMBIO_STATO:
            CambioStatoTipoNotifica cstn = new CambioStatoTipoNotifica();
            cstn.setTipo(String.valueOf(tipo));
            cstn.setStato(entity.getInfoStato());
            return cstn;
		case COMUNICAZIONE:
            ComunicazioneTipoNotifica ctn = new ComunicazioneTipoNotifica();
            ctn.setTipo(String.valueOf(tipo));
            ctn.setOggetto(entity.getInfoOggetto());
            ctn.setTesto(entity.getInfoMessaggio());
            return ctn;
        }
        return null;
	}

	public List<RuoloNotifica> getRuoliNotifica(String tags) {
		if(tags == null) return null;
		
		List<RuoloNotificaEnum> n = this.notificheUtils.getRuoli(tags);
		
		return n.stream().map(e -> this.toRuoloNotifica(e)).collect(Collectors.toList());
		
	}

	public RuoloNotifica toRuoloNotifica(RuoloNotificaEnum e) {
		if(e == null) return null;

		switch(e) {
		case ADESIONE_REFERENTE_ADESIONE: return RuoloNotifica.ADESIONE_REFERENTE_ADESIONE;
		case ADESIONE_REFERENTE_DOMINIO: return RuoloNotifica.ADESIONE_REFERENTE_DOMINIO;
		case ADESIONE_REFERENTE_TECNICO_DOMINIO: return RuoloNotifica.ADESIONE_REFERENTE_TECNICO_DOMINIO;
		case ADESIONE_REFERENTE_SERVIZIO: return RuoloNotifica.ADESIONE_REFERENTE_SERVIZIO;
		case ADESIONE_REFERENTE_TECNICO_ADESIONE: return RuoloNotifica.ADESIONE_REFERENTE_TECNICO_ADESIONE;
		case ADESIONE_REFERENTE_TECNICO_SERVIZIO: return RuoloNotifica.ADESIONE_REFERENTE_TECNICO_ADESIONE;
		case ADESIONE_RICHIEDENTE_ADESIONE: return RuoloNotifica.ADESIONE_RICHIEDENTE_ADESIONE;
		case ADESIONE_RICHIEDENTE_SERVIZIO: return RuoloNotifica.ADESIONE_RICHIEDENTE_SERVIZIO;
		case SERVIZIO_REFERENTE_DOMINIO: return RuoloNotifica.SERVIZIO_REFERENTE_DOMINIO;
		case SERVIZIO_REFERENTE_TECNICO_DOMINIO: return RuoloNotifica.SERVIZIO_REFERENTE_TECNICO_DOMINIO;
		case SERVIZIO_REFERENTE_SERVIZIO: return RuoloNotifica.SERVIZIO_REFERENTE_SERVIZIO;
		case SERVIZIO_REFERENTE_TECNICO_SERVIZIO: return RuoloNotifica.SERVIZIO_REFERENTE_TECNICO_SERVIZIO;
		case SERVIZIO_RICHIEDENTE_SERVIZIO: return RuoloNotifica.SERVIZIO_RICHIEDENTE_SERVIZIO;
		case ADESIONE_REFERENTE_ADESIONE_EMAIL: return RuoloNotifica.ADESIONE_REFERENTE_ADESIONE_EMAIL;
		case ADESIONE_REFERENTE_DOMINIO_EMAIL: return RuoloNotifica.ADESIONE_REFERENTE_DOMINIO_EMAIL;
		case ADESIONE_REFERENTE_TECNICO_DOMINIO_EMAIL: return RuoloNotifica.ADESIONE_REFERENTE_TECNICO_DOMINIO_EMAIL;
		case ADESIONE_REFERENTE_SERVIZIO_EMAIL: return RuoloNotifica.ADESIONE_REFERENTE_SERVIZIO_EMAIL;
		case ADESIONE_REFERENTE_TECNICO_ADESIONE_EMAIL: return RuoloNotifica.ADESIONE_REFERENTE_TECNICO_ADESIONE_EMAIL;
		case ADESIONE_RICHIEDENTE_ADESIONE_EMAIL: return RuoloNotifica.ADESIONE_RICHIEDENTE_ADESIONE_EMAIL;
		case ADESIONE_RICHIEDENTE_SERVIZIO_EMAIL: return RuoloNotifica.ADESIONE_RICHIEDENTE_SERVIZIO_EMAIL;
		case SERVIZIO_REFERENTE_DOMINIO_EMAIL: return RuoloNotifica.SERVIZIO_REFERENTE_DOMINIO_EMAIL;
		case SERVIZIO_REFERENTE_TECNICO_DOMINIO_EMAIL: return RuoloNotifica.SERVIZIO_REFERENTE_TECNICO_DOMINIO_EMAIL;
		case SERVIZIO_REFERENTE_SERVIZIO_EMAIL: return RuoloNotifica.SERVIZIO_REFERENTE_SERVIZIO_EMAIL;
		case SERVIZIO_REFERENTE_TECNICO_SERVIZIO_EMAIL: return RuoloNotifica.SERVIZIO_REFERENTE_TECNICO_SERVIZIO_EMAIL;
		case SERVIZIO_RICHIEDENTE_SERVIZIO_EMAIL: return RuoloNotifica.SERVIZIO_RICHIEDENTE_SERVIZIO_EMAIL;
		}
		return null;
 	}

	public RuoloNotificaEnum toTag(RuoloNotifica e) {
		if(e == null) return null;

		switch(e) {
		case ADESIONE_REFERENTE_ADESIONE: return RuoloNotificaEnum.ADESIONE_REFERENTE_ADESIONE;
		case ADESIONE_REFERENTE_DOMINIO: return RuoloNotificaEnum.ADESIONE_REFERENTE_DOMINIO;
		case ADESIONE_REFERENTE_TECNICO_DOMINIO: return RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_DOMINIO;
		case ADESIONE_REFERENTE_SERVIZIO: return RuoloNotificaEnum.ADESIONE_REFERENTE_SERVIZIO;
		case ADESIONE_REFERENTE_TECNICO_ADESIONE: return RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_ADESIONE;
		case ADESIONE_REFERENTE_TECNICO_SERVIZIO: return RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_ADESIONE;
		case ADESIONE_RICHIEDENTE_ADESIONE: return RuoloNotificaEnum.ADESIONE_RICHIEDENTE_ADESIONE;
		case ADESIONE_RICHIEDENTE_SERVIZIO: return RuoloNotificaEnum.ADESIONE_RICHIEDENTE_SERVIZIO;
		case SERVIZIO_REFERENTE_DOMINIO: return RuoloNotificaEnum.SERVIZIO_REFERENTE_DOMINIO;
		case SERVIZIO_REFERENTE_TECNICO_DOMINIO: return RuoloNotificaEnum.SERVIZIO_REFERENTE_TECNICO_DOMINIO;
		case SERVIZIO_REFERENTE_SERVIZIO: return RuoloNotificaEnum.SERVIZIO_REFERENTE_SERVIZIO;
		case SERVIZIO_REFERENTE_TECNICO_SERVIZIO: return RuoloNotificaEnum.SERVIZIO_REFERENTE_TECNICO_SERVIZIO;
		case SERVIZIO_RICHIEDENTE_SERVIZIO: return RuoloNotificaEnum.SERVIZIO_RICHIEDENTE_SERVIZIO;
		case ADESIONE_REFERENTE_ADESIONE_EMAIL: return RuoloNotificaEnum.ADESIONE_REFERENTE_ADESIONE_EMAIL;
		case ADESIONE_REFERENTE_DOMINIO_EMAIL: return RuoloNotificaEnum.ADESIONE_REFERENTE_DOMINIO_EMAIL;
		case ADESIONE_REFERENTE_TECNICO_DOMINIO_EMAIL: return RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_DOMINIO_EMAIL;
		case ADESIONE_REFERENTE_SERVIZIO_EMAIL: return RuoloNotificaEnum.ADESIONE_REFERENTE_SERVIZIO_EMAIL;
		case ADESIONE_REFERENTE_TECNICO_ADESIONE_EMAIL: return RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_ADESIONE_EMAIL;
		case ADESIONE_REFERENTE_TECNICO_SERVIZIO_EMAIL: return RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_SERVIZIO_EMAIL;
		case ADESIONE_RICHIEDENTE_ADESIONE_EMAIL: return RuoloNotificaEnum.ADESIONE_RICHIEDENTE_ADESIONE_EMAIL;
		case ADESIONE_RICHIEDENTE_SERVIZIO_EMAIL: return RuoloNotificaEnum.ADESIONE_RICHIEDENTE_SERVIZIO_EMAIL;
		case SERVIZIO_REFERENTE_DOMINIO_EMAIL: return RuoloNotificaEnum.SERVIZIO_REFERENTE_DOMINIO_EMAIL;
		case SERVIZIO_REFERENTE_TECNICO_DOMINIO_EMAIL: return RuoloNotificaEnum.SERVIZIO_REFERENTE_TECNICO_DOMINIO_EMAIL;
		case SERVIZIO_REFERENTE_SERVIZIO_EMAIL: return RuoloNotificaEnum.SERVIZIO_REFERENTE_SERVIZIO_EMAIL;
		case SERVIZIO_REFERENTE_TECNICO_SERVIZIO_EMAIL: return RuoloNotificaEnum.SERVIZIO_REFERENTE_TECNICO_SERVIZIO_EMAIL;
		case SERVIZIO_RICHIEDENTE_SERVIZIO_EMAIL: return RuoloNotificaEnum.SERVIZIO_RICHIEDENTE_SERVIZIO_EMAIL;
		}

		return null;
 	}

	public StatoNotifica getStatoNotifica(STATO stato) {
		if(stato == null) return null;
		
		switch(stato) {
		case LETTA: return StatoNotifica.LETTA;
		case ARCHIVIATA: return StatoNotifica.ARCHIVIATA;
		case NUOVA: return StatoNotifica.NUOVA;
		}
		
		return null;
	}

	public TipoNotificaEnum getTipoNotificaEnum(TIPO tipo) {
		if(tipo == null) return null;

		switch(tipo) {
		case CAMBIO_STATO: return TipoNotificaEnum.CAMBIO_STATO;
		case COMUNICAZIONE: return TipoNotificaEnum.COMUNICAZIONE;
		case CAMBIO_STATO_EMAIL: return TipoNotificaEnum.CAMBIO_STATO_EMAIL;
		case COMUNICAZIONE_EMAIL: return TipoNotificaEnum.COMUNICAZIONE_EMAIL;
		}

		return null;
	}

	public TipoEntitaNotifica getTipoEntitaNotifica(TIPO_ENTITA tipoEntita) {
		if(tipoEntita == null) return null;

		switch(tipoEntita) {
		case ADESIONE: return TipoEntitaNotifica.ADESIONE;
		case SERVIZIO: return TipoEntitaNotifica.SERVIZIO;
		case ADESIONE_EMAIL: return TipoEntitaNotifica.ADESIONE_EMAIL;
		case SERVIZIO_EMAIL: return TipoEntitaNotifica.SERVIZIO_EMAIL;
		}

		return null;
	}

	public STATO getStato(StatoNotifica stato) {
		if(stato == null) return null;
		
		switch(stato) {
		case LETTA: return STATO.LETTA;
		case ARCHIVIATA: return STATO.ARCHIVIATA;
		case NUOVA: return STATO.NUOVA;
		}
		
		return null;
	}

	public TIPO getTipo(TipoNotificaEnum tipo) {
		if(tipo == null) return null;

		switch(tipo) {
		case CAMBIO_STATO: return TIPO.CAMBIO_STATO;
		case COMUNICAZIONE: return TIPO.COMUNICAZIONE;
		case CAMBIO_STATO_EMAIL: return TIPO.CAMBIO_STATO_EMAIL;
		case COMUNICAZIONE_EMAIL: return TIPO.COMUNICAZIONE_EMAIL;
		}

		return null;
	}

	public TIPO_ENTITA getTipoEntita(TipoEntitaNotifica tipoEntita) {
		if(tipoEntita == null) return null;

		switch(tipoEntita) {
		case ADESIONE: return TIPO_ENTITA.ADESIONE;
		case SERVIZIO: return TIPO_ENTITA.SERVIZIO;
		case ADESIONE_EMAIL: return TIPO_ENTITA.ADESIONE_EMAIL;
		case SERVIZIO_EMAIL: return TIPO_ENTITA.SERVIZIO_EMAIL;
		}

		return null;
	}

	public List<TipoEntitaNotifica> getTipiEntitaNotificheAbilitate(UtenteEntity utente) {
		List<TIPO_ENTITA> lst = this.notificheUtils.getTipiEntita(utente.getTipiEntitaNotificheAbilitate());
		if(lst == null) return null;
		return lst.stream().map(e -> this.getTipoEntitaNotifica(e)).collect(Collectors.toList());
	}
	
	public List<TipoNotificaEnum> getTipiNotificheAbilitate(UtenteEntity utente) {
		List<TIPO> lst = this.notificheUtils.getTipi(utente.getTipiNotificheAbilitate());
		if(lst == null) return null;
		return lst.stream().map(e -> this.getTipoNotificaEnum(e)).collect(Collectors.toList());
	}
	
	public List<RuoloNotifica> getTagNotificheAbilitate(UtenteEntity utente) {
		return this.getRuoliNotifica(utente.getRuoliNotificheAbilitate());
	}

	public String getTipiEntitaNotificheAbilitate(List<TipoEntitaNotifica> lst) {
		if(lst == null) return null;
		return this.notificheUtils.getTipiEntita(lst.stream().map(e -> this.getTipoEntita(e)).collect(Collectors.toList()));
	}
	
	public String getTipiNotificheAbilitate(List<TipoNotificaEnum> lst) {
		if(lst == null) return null;
		return this.notificheUtils.getTipi(lst.stream().map(e -> this.getTipo(e)).collect(Collectors.toList()));
	}
	
	public String getTagNotificheAbilitate(List<RuoloNotifica> lst) {
		if(lst == null) return null;
		return this.notificheUtils.getRuoli(lst.stream().map(e -> this.toTag(e)).collect(Collectors.toList()));
	}


}
