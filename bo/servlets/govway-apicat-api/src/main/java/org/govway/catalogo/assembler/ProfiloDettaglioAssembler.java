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
import org.govway.catalogo.core.orm.entity.*;
import org.govway.catalogo.servlets.model.Profilo;
import org.govway.catalogo.servlets.model.ProfiloCreate;
import org.govway.catalogo.servlets.model.ProfiloUpdate;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

import java.util.UUID;

public class ProfiloDettaglioAssembler extends RepresentationModelAssemblerSupport<ProfiloEntity, Profilo> {

    private final ProfiloEngineAssembler profiloEngineAssembler;

    @Autowired
    public ProfiloDettaglioAssembler(ProfiloEngineAssembler profiloEngineAssembler) {
        super(ProfiliController.class, Profilo.class);
        this.profiloEngineAssembler = profiloEngineAssembler;
    }

    @Override
    public Profilo toModel(ProfiloEntity entity) {

        Profilo profilo = instantiateModel(entity);

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

    public ProfiloEntity toEntity(ProfiloCreate profilo) {
        ProfiloEntity entity = new ProfiloEntity();
        BeanUtils.copyProperties(profilo, entity);

        entity.setIdProfilo(UUID.randomUUID());
        entity.setAuthType(profiloEngineAssembler.toEntity(profilo.getAuthType()));

        if(profilo.getCompatibilita()!= null) {
            entity.setCompatibilita(profiloEngineAssembler.toEntity(profilo.getCompatibilita()));
        }

        if(profilo.getTipoDominio()!= null) {
            entity.setTipoDominio(profiloEngineAssembler.toEntity(profilo.getTipoDominio()));
        }

        return entity;
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

    public ProfiloEntity toEntity(ProfiloUpdate profilo, ProfiloEntity entity) {
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

    public DominioProfiloEntity toEntity(ProfiloEntity profilo, DominioEntity dominio) {
        DominioProfiloEntity dominioProfiloEntity = new DominioProfiloEntity();
        dominioProfiloEntity.setProfilo(profilo);
        dominioProfiloEntity.setDominio(dominio);
        return dominioProfiloEntity;
    }

    public SoggettoProfiloEntity toEntity(ProfiloEntity profilo, SoggettoEntity soggetto) {
        SoggettoProfiloEntity soggettoProfiloEntity = new SoggettoProfiloEntity();
        soggettoProfiloEntity.setProfilo(profilo);
        soggettoProfiloEntity.setSoggetto(soggetto);
        return soggettoProfiloEntity;
    }
}
