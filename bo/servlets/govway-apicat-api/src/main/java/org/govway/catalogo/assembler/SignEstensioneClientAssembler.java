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
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.AuthTypeSign;
import org.govway.catalogo.servlets.model.AuthTypeSignCreate;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthType;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthTypeSign;
import org.govway.catalogo.servlets.model.DatiSpecificiClient;
import org.govway.catalogo.servlets.model.DatiSpecificiClientCreate;

public class SignEstensioneClientAssembler extends AbstractEstensioneClientAssembler {

	private static final String FIRMA_PREFIX = "firma";

	@Override
	public Set<EstensioneClientEntity> getEstensioni(DatiSpecificiClientCreate src, ConfigurazioneAuthType configurazione) {
		if(!(src instanceof AuthTypeSignCreate)) {
			throw new BadRequestException(ErrorCode.VAL_002, java.util.Map.of("expectedType", AuthTypeSignCreate.class.getSimpleName()));
		}

		AuthTypeSignCreate specSrc = (AuthTypeSignCreate) src;

		if(!(configurazione instanceof ConfigurazioneAuthTypeSign)) {
			throw new BadRequestException(ErrorCode.VAL_002, java.util.Map.of("expectedType", ConfigurazioneAuthTypeSign.class.getSimpleName()));
		}
		
		ConfigurazioneAuthTypeSign conf = (ConfigurazioneAuthTypeSign) configurazione;

		Set<EstensioneClientEntity> lst2 = getEstensioniCertificato(specSrc.getCertificatoFirma(), FIRMA_PREFIX, conf.getCertificatoFirma());
	
		Set<EstensioneClientEntity> hashSet = super.getEstensioni(specSrc, configurazione);
		
		hashSet.addAll(lst2);
		
		return hashSet;
	}

	@Override
	public DatiSpecificiClient getDatiSpecificiClient(Set<EstensioneClientEntity> estensioni) {
		AuthTypeSign specSrc = new AuthTypeSign();
		
		specSrc.setCertificatoFirma(getCertificato(estensioni, FIRMA_PREFIX));

		populateDatiSpecifici(specSrc, estensioni);

		return specSrc;
	}

	@Override
	public List<String> getErroriConfigurabile(ClientEntity entity) {
		DatiSpecificiClient dsc = getDatiSpecificiClient(entity.getEstensioni());

		if(!(dsc instanceof AuthTypeSign)) {
			throw new BadRequestException(ErrorCode.VAL_002, java.util.Map.of("expectedType", AuthTypeSign.class.getSimpleName()));
		}
		
		AuthTypeSign specDsc = (AuthTypeSign) dsc;

		List<String> erroriConfigurabileCertificato = this.getErroriConfigurabileCertificato(specDsc.getCertificatoFirma(), FIRMA_PREFIX);
		
		return erroriConfigurabileCertificato;
	}


}
