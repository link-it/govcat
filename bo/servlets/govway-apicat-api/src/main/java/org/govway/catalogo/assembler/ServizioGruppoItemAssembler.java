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

import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.core.orm.entity.ServizioGruppoEntity;
import org.govway.catalogo.core.orm.entity.ServizioGruppoEntity.TipoServizioGruppoEnum;
import org.govway.catalogo.servlets.model.ItemServizioGruppo;
import org.govway.catalogo.servlets.model.TipoServizioGruppo;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ServizioGruppoItemAssembler extends RepresentationModelAssemblerSupport<ServizioGruppoEntity, ItemServizioGruppo> {

	@Autowired
	private DocumentoAssembler documentoAssembler;

	@Autowired
	private GruppoEngineAssembler gruppoEngineAssembler;

	@Autowired
	private ServizioEngineAssembler servizioEngineAssembler;

	@Autowired
	private DominioDettaglioAssembler dominioDettaglioAssembler;

	public ServizioGruppoItemAssembler() {
		super(ServiziController.class, ItemServizioGruppo.class);
	}

	@Override
	public ItemServizioGruppo toModel(ServizioGruppoEntity entity) {
		
		ItemServizioGruppo dettaglio = instantiateModel(entity);
		

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setTipo(entity.getTipo().equals(TipoServizioGruppoEnum.GRUPPO) ? TipoServizioGruppo.GRUPPO : TipoServizioGruppo.SERVIZIO);
		dettaglio.setTipoComponente(this.gruppoEngineAssembler.toTipo(entity.getTipoComponente()));
		if(dettaglio.getTipo().equals(TipoServizioGruppo.SERVIZIO)) {
			dettaglio.setVisibilita(this.servizioEngineAssembler.toVisibilita(entity.getVisibilita()));
			dettaglio.setDominio(this.dominioDettaglioAssembler.toModel(entity.getServizio().getDominio()));
		} else {
			dettaglio.setStato(null);
		}
		
		dettaglio.setId(UUID.fromString(entity.getIdEntita()));
		
		if(entity.getGruppo()!=null) {
			dettaglio.setIdGruppoPadre(UUID.fromString(entity.getGruppo().getIdGruppo()));
			
			dettaglio.setPathGruppo(gruppoEngineAssembler.getPathGruppo(entity.getGruppo()));
		}
		if(entity.getImmagine()!=null) {
			dettaglio.setImmagine(documentoAssembler.toModel(entity.getImmagine()));
		}
		
		return dettaglio;
	}
	
}
