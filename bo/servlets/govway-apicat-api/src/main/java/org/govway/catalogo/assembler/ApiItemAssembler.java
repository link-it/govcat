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

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneProfilo;
import org.govway.catalogo.servlets.model.ItemApi;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ApiItemAssembler extends RepresentationModelAssemblerSupport<ApiEntity, ItemApi> {
	
	@Autowired
	private ApiEngineAssembler apiEngineAssembler;
	
	@Autowired
	private ServizioItemAssembler servizioItemAssembler;
	
	@Autowired
	private Configurazione configurazione;

	public static final String SEPARATOR = ",";

	public ApiItemAssembler() {
		super(APIController.class, ItemApi.class);
	}

	@Override
	public ItemApi toModel(ApiEntity entity) {
		
		ItemApi dettaglio = instantiateModel(entity);
		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdApi(UUID.fromString(entity.getIdApi()));
		dettaglio.setDescrizione(Optional.ofNullable(entity.getDescrizione()).map(d -> new String(d)).orElse(null));

		if(entity.getCollaudo()!= null) {
			dettaglio.setConfigurazioneCollaudo(this.apiEngineAssembler.toConfigurazione(entity.getCollaudo()));
		}
		
		if(entity.getProduzione()!= null) {
			dettaglio.setConfigurazioneProduzione(this.apiEngineAssembler.toConfigurazione(entity.getProduzione()));
		}
		
		Comparator<? super AuthTypeEntity> c = (o1, o2) -> {
			return (int) (o1.getId() - o2.getId());
		};
		
		List<AuthTypeEntity> lst = entity.getAuthType().stream().sorted(c).collect(Collectors.toList());
		
		for(AuthTypeEntity authType: lst) {
			AuthTypeApiResource g = new AuthTypeApiResource();
			g.setNote(authType.getNote());
			
			Optional<ConfigurazioneProfilo> configurazioneProfilo = this.configurazione.getServizio().getApi().getProfili()
					.stream()
					.filter(p -> p.getCodiceInterno().equals(authType.getProfilo()))
					.findAny();
					//.orElseThrow(() -> new BadRequestException("Profilo ["+authType.getProfilo()+"] non trovato"));
			if (configurazioneProfilo.isEmpty()) {
			    String errorMessage = String.format("Profilo [%s] non trovato", authType.getProfilo());
			    throw new BadRequestException(ErrorCode.VAL_002);
			}

			g.setProfilo(authType.getProfilo());
			g.setResources(Arrays.asList(new String(authType.getResources()).split(SEPARATOR)));
			
			dettaglio.addGruppiAuthTypeItem(g);
		}

		dettaglio.setServizio(this.servizioItemAssembler.toModel(entity.getServizio()));
		dettaglio.setRuolo(this.apiEngineAssembler.toRuolo(entity.getRuolo()));

		dettaglio.setProprietaCustom(this.apiEngineAssembler.getApiProprietaCustom(entity));
		
		return dettaglio;
	}

}
