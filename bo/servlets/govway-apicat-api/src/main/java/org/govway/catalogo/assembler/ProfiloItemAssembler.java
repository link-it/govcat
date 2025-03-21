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
import org.govway.catalogo.core.orm.entity.ProfiloEntity;
import org.govway.catalogo.servlets.model.ItemProfilo;
import org.govway.catalogo.servlets.model.Profilo;
import org.springframework.beans.BeanUtils;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ProfiloItemAssembler extends RepresentationModelAssemblerSupport<ProfiloEntity, ItemProfilo> {

    private final ProfiloEngineAssembler profiloEngineAssembler;

    public ProfiloItemAssembler(ProfiloEngineAssembler profiloEngineAssembler) {
        super(ProfiliController.class, ItemProfilo.class);
        this.profiloEngineAssembler = profiloEngineAssembler;
    }

    @Override
    public ItemProfilo toModel(ProfiloEntity entity) {

        ItemProfilo profilo = instantiateModel(entity);
        BeanUtils.copyProperties(entity, profilo);

        profilo.setAuthType(profiloEngineAssembler.toAuthTypeEnum(entity.getAuthType()));

        if(entity.getCompatibilita() != null) {
            profilo.setCompatibilita(profiloEngineAssembler.toConfigurazioneCompatibilitaApiEnum(entity.getCompatibilita()));
        }

        if(entity.getTipoDominio() != null) {
            profilo.setTipoDominio(profiloEngineAssembler.toConfigurazioneTipoDominioEnum(entity.getTipoDominio()));
        }

        return profilo;
    }

    public ProfiloEntity toEntity(Profilo profilo, ProfiloEntity entity) {
        BeanUtils.copyProperties(profilo, entity);

        entity.setAuthType(profiloEngineAssembler.toEntity(profilo.getAuthType()));

        if(profilo.getCompatibilita()!= null) {
            entity.setCompatibilita(profiloEngineAssembler.toEntity(profilo.getCompatibilita()));
        }

        if(profilo.getTipoDominio()!= null) {
            entity.setTipoDominio(profiloEngineAssembler.toEntity(profilo.getTipoDominio()));
        }

        return entity;
    }
}
