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

import java.util.List;
import java.util.Set;

import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.AuthTypeHttps;
import org.govway.catalogo.servlets.model.AuthTypeHttpsCreate;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthType;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthTypeHttps;
import org.govway.catalogo.servlets.model.DatiSpecificiClient;
import org.govway.catalogo.servlets.model.DatiSpecificiClientCreate;

public class HttpsEstensioneClientAssembler extends AbstractEstensioneClientAssembler {

	private static final String AUTENTICAZIONE_PREFIX = "autenticazione";

	@Override
	public Set<EstensioneClientEntity> getEstensioni(DatiSpecificiClientCreate src, ConfigurazioneAuthType configurazione) {
		if(!(src instanceof AuthTypeHttpsCreate)) {
			throw new BadRequestException("DatiSpecifici dovrebbe essere un ["+AuthTypeHttpsCreate.class+"]");
		}
		
		AuthTypeHttpsCreate specSrc = (AuthTypeHttpsCreate) src;

		if(!(configurazione instanceof ConfigurazioneAuthTypeHttps)) {
			throw new BadRequestException("Configurazione dovrebbe essere un ["+ConfigurazioneAuthTypeHttps.class+"]");
		}
		
		ConfigurazioneAuthTypeHttps conf = (ConfigurazioneAuthTypeHttps) configurazione;
		
		Set<EstensioneClientEntity> hashSet = super.getEstensioni(specSrc, configurazione);
		hashSet.addAll(getEstensioniCertificato(specSrc.getCertificatoAutenticazione(), AUTENTICAZIONE_PREFIX, conf.getCertificato()));
		return hashSet;
	}

	@Override
	public DatiSpecificiClient getDatiSpecificiClient(Set<EstensioneClientEntity> estensioni) {
		AuthTypeHttps specSrc = new AuthTypeHttps();
		
		specSrc.setAuthType(AuthTypeEnum.HTTPS);
		specSrc.setCertificatoAutenticazione(getCertificato(estensioni, AUTENTICAZIONE_PREFIX));

		populateDatiSpecifici(specSrc, estensioni);

		return specSrc;
	}

	@Override
	public List<String> getErroriConfigurabile(ClientEntity entity) {
		DatiSpecificiClient dsc = getDatiSpecificiClient(entity.getEstensioni());
		
		if(!(dsc instanceof AuthTypeHttps)) {
			throw new BadRequestException("DatiSpecifici dovrebbe essere un ["+AuthTypeHttps.class+"]");
		}
		
		AuthTypeHttps specDsc = (AuthTypeHttps) dsc;

		return this.getErroriConfigurabileCertificato(specDsc.getCertificatoAutenticazione(), AUTENTICAZIONE_PREFIX);
	}


}
