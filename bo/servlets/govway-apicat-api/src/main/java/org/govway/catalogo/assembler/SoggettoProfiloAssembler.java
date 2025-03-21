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
import org.govway.catalogo.core.orm.entity.SoggettoProfiloEntity;
import org.govway.catalogo.servlets.model.ItemSoggetto;
import org.govway.catalogo.servlets.model.TipoSoggettoGateway;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

import java.util.UUID;

public class SoggettoProfiloAssembler extends RepresentationModelAssemblerSupport<SoggettoProfiloEntity, ItemSoggetto> {

    private final OrganizzazioneItemAssembler organizzazioneItemAssembler;

    @Autowired
    public SoggettoProfiloAssembler(OrganizzazioneItemAssembler organizzazioneItemAssembler) {
        super(ProfiliController.class, ItemSoggetto.class);
        this.organizzazioneItemAssembler = organizzazioneItemAssembler;
    }


    @Override
    public ItemSoggetto toModel(SoggettoProfiloEntity entity) {
        ItemSoggetto soggetto = instantiateModel(entity);
        BeanUtils.copyProperties(entity.getSoggetto(), soggetto);
        if(entity.getSoggetto().getTipoGateway() != null) {
            soggetto.setTipoGateway(toTipoGateway(entity.getSoggetto().getTipoGateway()));
        }

        soggetto.setIdSoggetto(UUID.fromString(entity.getSoggetto().getIdSoggetto()));
        soggetto.setOrganizzazione(organizzazioneItemAssembler.toModel(entity.getSoggetto().getOrganizzazione()));
        return soggetto;
    }

    private TipoSoggettoGateway toTipoGateway(String tipoGateway) {
        return TipoSoggettoGateway.fromValue(tipoGateway);
    }
}
