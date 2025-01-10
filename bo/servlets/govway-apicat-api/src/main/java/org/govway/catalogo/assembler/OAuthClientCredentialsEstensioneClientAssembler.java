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
import org.govway.catalogo.servlets.model.AuthTypeOAuthClientCredentials;
import org.govway.catalogo.servlets.model.AuthTypeOAuthClientCredentialsCreate;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthType;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthTypeOAuthClientCredentials;
import org.govway.catalogo.servlets.model.DatiSpecificiClient;
import org.govway.catalogo.servlets.model.DatiSpecificiClientCreate;

public class OAuthClientCredentialsEstensioneClientAssembler extends AbstractEstensioneClientAssembler {

	private static final String CLIENT_ID_PROPERTY = "client_id";

	@Override
	public Set<EstensioneClientEntity> getEstensioni(DatiSpecificiClientCreate src, ConfigurazioneAuthType configurazione) {
		
		if(!(src instanceof AuthTypeOAuthClientCredentialsCreate)) {
			throw new BadRequestException("DatiSpecifici dovrebbe essere un ["+AuthTypeOAuthClientCredentialsCreate.class+"]");
		}
		
		AuthTypeOAuthClientCredentialsCreate specSrc = (AuthTypeOAuthClientCredentialsCreate) src;
		
		if(!(configurazione instanceof ConfigurazioneAuthTypeOAuthClientCredentials)) {
			throw new BadRequestException("Configurazione dovrebbe essere un ["+ConfigurazioneAuthTypeOAuthClientCredentials.class+"]");
		}
		
		Set<EstensioneClientEntity> hashSet = super.getEstensioni(specSrc, configurazione);

		if(specSrc.getClientId()!=null) {
			EstensioneClientEntity clientIdProperty = new EstensioneClientEntity();
			clientIdProperty.setNome(CLIENT_ID_PROPERTY);
			clientIdProperty.setValore(specSrc.getClientId());
			hashSet.add(clientIdProperty);
		}
		return hashSet;
		
	}

	@Override
	public DatiSpecificiClient getDatiSpecificiClient(Set<EstensioneClientEntity> estensioni) {
		AuthTypeOAuthClientCredentials specSrc = new AuthTypeOAuthClientCredentials();
		
		if(existsProperty(estensioni, CLIENT_ID_PROPERTY)) {
			specSrc.setClientId(getTextProperty(estensioni, CLIENT_ID_PROPERTY));
		}

		populateDatiSpecifici(specSrc, estensioni);

		return specSrc;
	}

	@Override
	public List<String> getErroriConfigurabile(ClientEntity entity) {
		DatiSpecificiClient dsc = getDatiSpecificiClient(entity.getEstensioni());
		
		if(!(dsc instanceof AuthTypeOAuthClientCredentials)) {
			throw new BadRequestException("DatiSpecifici dovrebbe essere un ["+AuthTypeOAuthClientCredentials.class+"]");
		}
		
		AuthTypeOAuthClientCredentials specDsc = (AuthTypeOAuthClientCredentials) dsc;

		List<String> errori = new ArrayList<>();
		
		if(specDsc.getClientId() == null) {
			errori.add("client_id");
		}
		
		return errori;
	}


}
