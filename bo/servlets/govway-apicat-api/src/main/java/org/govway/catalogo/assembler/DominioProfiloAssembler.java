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

import org.govway.catalogo.controllers.ProfiliController;
import org.govway.catalogo.core.orm.entity.DominioProfiloEntity;
import org.govway.catalogo.servlets.model.ItemDominio;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

import java.util.UUID;

public class DominioProfiloAssembler extends RepresentationModelAssemblerSupport<DominioProfiloEntity, ItemDominio>  {

    private final SoggettoItemAssembler soggettoItemAssmbler;

    private final DominioEngineAssembler dominioEngineAssmbler;

    @Autowired
    public DominioProfiloAssembler(SoggettoItemAssembler soggettoItemAssmbler, DominioEngineAssembler dominioEngineAssmbler) {
        super(ProfiliController.class, ItemDominio.class);
        this.soggettoItemAssmbler = soggettoItemAssmbler;
        this.dominioEngineAssmbler = dominioEngineAssmbler;
    }

    @Override
    public ItemDominio toModel(DominioProfiloEntity entity) {
        ItemDominio dominio = instantiateModel(entity);
        BeanUtils.copyProperties(entity.getDominio(), dominio);

        dominio.setIdDominio(UUID.fromString(entity.getDominio().getIdDominio()));
        dominio.setDeprecato(entity.getDominio().isDeprecato());

        dominio.setSoggettoReferente(this.soggettoItemAssmbler.toModel(entity.getDominio().getSoggettoReferente()));
        dominio.setVisibilita(this.dominioEngineAssmbler.toVisibilita(entity.getDominio().getVisibilita()));

        return dominio;
    }
}
