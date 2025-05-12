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
import java.util.Set;

import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.servlets.model.AuthTypePdnd;
import org.govway.catalogo.servlets.model.AuthTypePdndCreate;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthType;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthTypePdnd;
import org.govway.catalogo.servlets.model.DatiSpecificiClient;
import org.govway.catalogo.servlets.model.DatiSpecificiClientCreate;

public class PdndEstensioneClientAssembler extends AbstractEstensioneClientAssembler {

	public static final String CLIENT_ID_PROPERTY = "client_id";

	@Override
	public Set<EstensioneClientEntity> getEstensioni(DatiSpecificiClientCreate src, ConfigurazioneAuthType configurazione) {
		if(!(src instanceof AuthTypePdndCreate)) {
			throw new BadRequestException("DatiSpecifici dovrebbe essere un ["+AuthTypePdndCreate.class+"]");
		}
		
		AuthTypePdndCreate specSrc = (AuthTypePdndCreate) src;
		
		if(!(configurazione instanceof ConfigurazioneAuthTypePdnd)) {
			throw new BadRequestException("Configurazione dovrebbe essere un ["+ConfigurazioneAuthTypePdnd.class+"]");
		}
		
		Set<EstensioneClientEntity> hashSet = super.getEstensioni(specSrc, configurazione);

		EstensioneClientEntity clientIdProperty = new EstensioneClientEntity();
		clientIdProperty.setNome(CLIENT_ID_PROPERTY);
		clientIdProperty.setValore(specSrc.getClientId());
		hashSet.add(clientIdProperty);
		return hashSet;
	}

	@Override
	public DatiSpecificiClient getDatiSpecificiClient(Set<EstensioneClientEntity> estensioni) {
		AuthTypePdnd specSrc = new AuthTypePdnd();
		
		specSrc.setClientId(getTextProperty(estensioni, CLIENT_ID_PROPERTY));

		populateDatiSpecifici(specSrc, estensioni);

		return specSrc;
	}

	@Override
	public List<String> getErroriConfigurabile(ClientEntity entity) {
		DatiSpecificiClient dsc = getDatiSpecificiClient(entity.getEstensioni());
		
		if(!(dsc instanceof AuthTypePdnd)) {
			throw new BadRequestException("DatiSpecifici dovrebbe essere un ["+AuthTypePdnd.class+"]");
		}
		
		AuthTypePdnd specDsc = (AuthTypePdnd) dsc;

		List<String> errori = new ArrayList<>();
		
		if(specDsc.getClientId() == null || specDsc.getClientId().trim().isEmpty()) {
			errori.add("client_id");
		}
		
		return errori;
	}


}
