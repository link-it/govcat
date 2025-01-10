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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.PROTOCOLLO;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.EstensioneApiEntity;
import org.govway.catalogo.servlets.model.APIDatiAmbiente;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.AuthTypeApiResourceProprietaCustom;
import org.govway.catalogo.servlets.model.ProprietaCustom;
import org.govway.catalogo.servlets.model.ProtocolloDettaglioEnum;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.RuoloAPIEnum;
import org.springframework.beans.factory.annotation.Autowired;

public class ApiEngineAssembler extends CoreEngineAssembler {

	@Autowired
	private DocumentoAssembler allegatoAssembler;
	
	public ProtocolloEnum toProtocollo(PROTOCOLLO protocollo) {
		if(protocollo ==null) return null;
		switch(protocollo) {
		case OPENAPI_3: return ProtocolloEnum.REST;
		case WSDL11: return ProtocolloEnum.SOAP;
		case WSDL12: return ProtocolloEnum.SOAP;
		case SWAGGER_2: return ProtocolloEnum.REST;
		}
		
		return null;
	}

	public List<ProprietaCustom> getApiProprietaCustom(ApiEntity entity) {
		Map<String, List<AuthTypeApiResourceProprietaCustom>> map = new HashMap<>();

		for(EstensioneApiEntity e: entity.getEstensioni()) {
		
			if(!map.containsKey(e.getGruppo())) {
				map.put(e.getGruppo(), new ArrayList<>());
			}
			
			AuthTypeApiResourceProprietaCustom cp = new AuthTypeApiResourceProprietaCustom();
			cp.setNome(e.getNome());
			cp.setValore(e.getValore());
			map.get(e.getGruppo()).add(cp);
		}

		return map.entrySet().stream()
			.map(e -> {
				ProprietaCustom estensione = new ProprietaCustom();
				estensione.setGruppo(e.getKey());
				estensione.setProprieta(e.getValue());
				return estensione;
			}).collect(Collectors.toList());
		
	}
	
	public ProtocolloDettaglioEnum toProtocolloDettaglio(PROTOCOLLO protocollo) {
		if(protocollo ==null) return null;
		switch(protocollo) {
		case OPENAPI_3: return ProtocolloDettaglioEnum.OPENAPI_3;
		case WSDL11: return ProtocolloDettaglioEnum.WSDL_11;
		case WSDL12: return ProtocolloDettaglioEnum.WSDL_12;
		case SWAGGER_2: return ProtocolloDettaglioEnum.SWAGGER_2;
		}
		
		return null;
	}

	public RUOLO toRuolo(RuoloAPIEnum ruolo) {
		switch(ruolo) {
		case ADERENTE: return RUOLO.EROGATO_SOGGETTO_ADERENTE;
		case DOMINIO: return RUOLO.EROGATO_SOGGETTO_DOMINIO;
		}
		
		return null;
	}

	public RuoloAPIEnum toRuolo(RUOLO ruolo) {
		switch(ruolo) {
		case EROGATO_SOGGETTO_ADERENTE: return RuoloAPIEnum.ADERENTE;
		case EROGATO_SOGGETTO_DOMINIO: return RuoloAPIEnum.DOMINIO;
		}
		
		return null;
	}


	public APIDatiAmbiente toConfigurazione(ApiConfigEntity config) {
		APIDatiAmbiente apiDatiAmbiente = new APIDatiAmbiente();
		apiDatiAmbiente.setProtocollo(this.toProtocollo(config.getProtocollo()));
		apiDatiAmbiente.setProtocolloDettaglio(this.toProtocolloDettaglio(config.getProtocollo()));
		
		if(config.getSpecifica() != null) {
			apiDatiAmbiente.setSpecifica(this.allegatoAssembler.toModel(config.getSpecifica()));
		}
		apiDatiAmbiente.setDatiErogazione(toDatiErogazione(config));
		return apiDatiAmbiente;
	}

	public APIDatiErogazione toDatiErogazione(ApiConfigEntity config) {
		APIDatiErogazione datiErog = new APIDatiErogazione();

		datiErog.setNomeGateway(config.getNomeGateway());
		datiErog.setVersioneGateway(config.getVersioneGateway());
		
		datiErog.setUrl(config.getUrl());
		datiErog.setUrlPrefix(config.getUrlPrefix());
		
		return datiErog;
	}

}
