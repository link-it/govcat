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
import java.util.UUID;

import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.orm.entity.GruppoEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.core.orm.entity.TipoServizio;
import org.govway.catalogo.servlets.model.Documento;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.DocumentoUpdate;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.VisibilitaServizioEnum;
import org.springframework.beans.factory.annotation.Autowired;

public class ServizioEngineAssembler extends CoreEngineAssembler {

	@Autowired
	private DocumentoAssembler documentoAssembler;

	@Autowired
	private DominioDettaglioAssembler dominioDettaglioAssembler;

	@Autowired
	private GruppoDettaglioAssembler gruppoDettaglioAssembler;

	@Autowired
	private ServizioService service;

	public boolean isEliminabile(ServizioEntity entity) {
		return service.isEliminabile(entity);
	}

	public VisibilitaServizioEnum toVisibilita(VISIBILITA visibilita) {
		if(visibilita == null) {
			return null;
		}
		
		switch(visibilita) {
		case PRIVATO: return VisibilitaServizioEnum.PRIVATO;
		case PUBBLICO: return VisibilitaServizioEnum.PUBBLICO;
		case RISERVATO: return VisibilitaServizioEnum.RISERVATO;
		case COMPONENTE: return VisibilitaServizioEnum.COMPONENTE;
		}
		
		return null;
	}

	public VISIBILITA toVisibilita(VisibilitaServizioEnum visibilita, boolean consentiComponente) {
		if(visibilita == null) return null;
		
		if(!consentiComponente && visibilita.equals(VisibilitaServizioEnum.COMPONENTE)) {
			throw new BadRequestException(ErrorCode.VAL_001);
		}
		
		switch(visibilita) {
		case PRIVATO: return VISIBILITA.PRIVATO;
		case PUBBLICO: return VISIBILITA.PUBBLICO;
		case RISERVATO: return VISIBILITA.RISERVATO;
		case COMPONENTE: return VISIBILITA.COMPONENTE;
		}
		return null;
	}
	
	public List<UUID> getGruppi(ServizioEntity entity) {
		List<UUID> lista = new ArrayList<>();
		
		for(GruppoEntity g: entity.getGruppi()) {
			lista.add(UUID.fromString(g.getIdGruppo()));
		}
		return lista;
	}
	
	public Dominio getDominio(ServizioEntity entity) {
		if(entity.getDominio()!=null) {
			return dominioDettaglioAssembler.toModel(entity.getDominio());
		} else {
			return null;
		}
	}

	public UUID getIdDominio(ServizioEntity entity) {
		if(entity.getDominio()!=null) {
			return UUID.fromString(entity.getDominio().getIdDominio());
		} else {
			return null;
		}
	}

	public Documento getImmagine(ServizioEntity entity) {
		if(entity.getImmagine()== null) return null;
		return documentoAssembler.toModel(entity.getImmagine());
	}

	public DocumentoEntity toImmagine(DocumentoUpdate immagine, DocumentoEntity actual) {
		return documentoAssembler.toEntity(immagine, actual, this.getUtenteSessione());
	}

	public DocumentoEntity toImmagine(DocumentoCreate immagine) {
		if(immagine == null) return null;
		return documentoAssembler.toEntity(immagine, this.getUtenteSessione());
	}

	public TipoServizio toTipo(org.govway.catalogo.servlets.model.TipoServizio tipo) {
		if(tipo == null) {
			return null;
		}
		return gruppoDettaglioAssembler.toTipo(tipo);
	}

	public org.govway.catalogo.servlets.model.TipoServizio toTipo(TipoServizio tipo) {
		if(tipo == null) {
			return null;
		}
		return gruppoDettaglioAssembler.toTipo(tipo);
	}

}
