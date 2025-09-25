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
import org.govway.catalogo.servlets.model.AuthTypeHttpsPdndSign;
import org.govway.catalogo.servlets.model.AuthTypeHttpsPdndSignCreate;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthType;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthTypeHttpsPdndSign;
import org.govway.catalogo.servlets.model.DatiSpecificiClient;
import org.govway.catalogo.servlets.model.DatiSpecificiClientCreate;

public class HttpsPdndSignEstensioneClientAssembler extends AbstractEstensioneClientAssembler {

	private static final String AUTENTICAZIONE_PREFIX = "autenticazione";
	private static final String FIRMA_PREFIX = "firma";
	private static final String CLIENT_ID_PROPERTY = "client_id";

	@Override
	public Set<EstensioneClientEntity> getEstensioni(DatiSpecificiClientCreate src, ConfigurazioneAuthType configurazione) {
		if(!(src instanceof AuthTypeHttpsPdndSignCreate)) {
			throw new BadRequestException(ErrorCode.CLT_003);
		}
		
		AuthTypeHttpsPdndSignCreate specSrc = (AuthTypeHttpsPdndSignCreate) src;
		
		if(!(configurazione instanceof ConfigurazioneAuthTypeHttpsPdndSign)) {
			throw new BadRequestException(ErrorCode.CLT_003);
		}
		
		ConfigurazioneAuthTypeHttpsPdndSign conf = (ConfigurazioneAuthTypeHttpsPdndSign) configurazione;

		Set<EstensioneClientEntity> hashSet = super.getEstensioni(specSrc, configurazione);

		Set<EstensioneClientEntity> lst = getEstensioniCertificato(specSrc.getCertificatoAutenticazione(), AUTENTICAZIONE_PREFIX, conf.getCertificatoAutenticazione());
		Set<EstensioneClientEntity> lst2 = getEstensioniCertificato(specSrc.getCertificatoFirma(), FIRMA_PREFIX, conf.getCertificatoFirma());
	
		hashSet.addAll(lst);
		hashSet.addAll(lst2);
		
		EstensioneClientEntity clientIdProperty = new EstensioneClientEntity();
		clientIdProperty.setNome(CLIENT_ID_PROPERTY);
		clientIdProperty.setValore(specSrc.getClientId());
		hashSet.add(clientIdProperty);
		return hashSet;
	}

	@Override
	public DatiSpecificiClient getDatiSpecificiClient(Set<EstensioneClientEntity> estensioni) {
		AuthTypeHttpsPdndSign specSrc = new AuthTypeHttpsPdndSign();
		
		specSrc.setCertificatoAutenticazione(getCertificato(estensioni, AUTENTICAZIONE_PREFIX));
		specSrc.setCertificatoFirma(getCertificato(estensioni, FIRMA_PREFIX));
		specSrc.setClientId(getTextProperty(estensioni, CLIENT_ID_PROPERTY));

		populateDatiSpecifici(specSrc, estensioni);

		return specSrc;
	}

	@Override
	public List<String> getErroriConfigurabile(ClientEntity entity) {
		DatiSpecificiClient dsc = getDatiSpecificiClient(entity.getEstensioni());
		
		if(!(dsc instanceof AuthTypeHttpsPdndSign)) {
			throw new BadRequestException(ErrorCode.CLT_003);
		}
		
		AuthTypeHttpsPdndSign specDsc = (AuthTypeHttpsPdndSign) dsc;

		List<String> erroriConfigurabileCertificato = this.getErroriConfigurabileCertificato(specDsc.getCertificatoAutenticazione(), AUTENTICAZIONE_PREFIX);
		erroriConfigurabileCertificato.addAll(this.getErroriConfigurabileCertificato(specDsc.getCertificatoFirma(), FIRMA_PREFIX));
		
		if(specDsc.getClientId() == null || specDsc.getClientId().trim().isEmpty()) {
			erroriConfigurabileCertificato.add("client_id");
		}
		
		return erroriConfigurabileCertificato;
	}


}
