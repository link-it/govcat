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

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.core.orm.entity.GruppoEntity;
import org.govway.catalogo.servlets.model.ItemGruppo;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class GruppoItemAssembler extends RepresentationModelAssemblerSupport<GruppoEntity, ItemGruppo> {

	@Autowired
	private GruppoEngineAssembler engine;
	
//	private Logger logger = LoggerFactory.getLogger(GruppoItemAssembler.class);

	public GruppoItemAssembler() {
		super(GruppiController.class, ItemGruppo.class);
	}

	@Override
	public ItemGruppo toModel(GruppoEntity entity) {
		
		
//		logger.debug("Nome gruppo:" + entity);
		ItemGruppo dettaglio = instantiateModel(entity);
		

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdGruppo(UUID.fromString(entity.getIdGruppo()));
		dettaglio.setTipo(engine.toTipo(entity.getTipo()));

		if(entity.getGruppoPadre()!=null) {
			dettaglio.setPathGruppo(engine.getPathGruppo(entity.getGruppoPadre()));
		}
		
		if(!entity.getFigli().isEmpty()) {

			List<ItemGruppo> lst = new ArrayList<>();
			for(GruppoEntity figlio: entity.getFigli()) {
				lst.add(toModel(figlio));
			}
			Comparator<? super ItemGruppo> comp = (o1, o2) -> {return o1.getNome().compareTo(o2.getNome());};
			dettaglio.setFigli(lst.stream().sorted(comp).collect(Collectors.toList()));
		}
		
		dettaglio.setImmagine(engine.getImmagine(entity));
		
		return dettaglio;
	}

}
