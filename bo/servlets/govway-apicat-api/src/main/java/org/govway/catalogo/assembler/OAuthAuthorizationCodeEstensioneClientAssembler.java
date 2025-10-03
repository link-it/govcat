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
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.AuthTypeOAuthAuthorizationCode;
import org.govway.catalogo.servlets.model.AuthTypeOAuthAuthorizationCodeCreate;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthType;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthTypeOAuthAuthorizationCode;
import org.govway.catalogo.servlets.model.DatiSpecificiClient;
import org.govway.catalogo.servlets.model.DatiSpecificiClientCreate;

public class OAuthAuthorizationCodeEstensioneClientAssembler extends AbstractEstensioneClientAssembler {

	private static final String HELP_DESK_PROPERTY = "help_desk";
	private static final String NOME_APPLICAZIONE_PORTALE_PROPERTY = "nome_applicazione";
	private static final String URL_ESPOSIZIONE_PROPERTY = "url_esposizione";
	private static final String URL_REDIREZIONE_PROPERTY = "url_redirezione";
	private static final String CLIENT_ID = "client_id";

	@Override
	public Set<EstensioneClientEntity> getEstensioni(DatiSpecificiClientCreate src, ConfigurazioneAuthType configurazione) {

		if(!(src instanceof AuthTypeOAuthAuthorizationCodeCreate)) {
			throw new BadRequestException(ErrorCode.CLT_003, java.util.Map.of("expectedType", AuthTypeOAuthAuthorizationCodeCreate.class.getSimpleName()));
		}

		AuthTypeOAuthAuthorizationCodeCreate specSrc = (AuthTypeOAuthAuthorizationCodeCreate) src;

		if(!(configurazione instanceof ConfigurazioneAuthTypeOAuthAuthorizationCode)) {
			throw new BadRequestException(ErrorCode.CLT_003, java.util.Map.of("expectedType", ConfigurazioneAuthTypeOAuthAuthorizationCode.class.getSimpleName()));
		}

		EstensioneClientEntity eHelpDesk = new EstensioneClientEntity();
		eHelpDesk.setNome(HELP_DESK_PROPERTY);
		eHelpDesk.setValore(specSrc.getHelpDesk());

		EstensioneClientEntity eNomeApplicazione = new EstensioneClientEntity();
		eNomeApplicazione.setNome(NOME_APPLICAZIONE_PORTALE_PROPERTY);
		eNomeApplicazione.setValore(specSrc.getNomeApplicazionePortale());

		EstensioneClientEntity eUrlEsposizione = new EstensioneClientEntity();
		eUrlEsposizione.setNome(URL_ESPOSIZIONE_PROPERTY);
		eUrlEsposizione.setValore(specSrc.getUrlEsposizione());

		EstensioneClientEntity eUrlRedirezione = new EstensioneClientEntity();
		eUrlRedirezione.setNome(URL_REDIREZIONE_PROPERTY);
		eUrlRedirezione.setValore(specSrc.getUrlRedirezione());

		EstensioneClientEntity eClientId = new EstensioneClientEntity();
		eClientId.setNome(CLIENT_ID);
		eClientId.setValore(specSrc.getClientId());

		Set<EstensioneClientEntity> hashSet = super.getEstensioni(specSrc, configurazione);

		HashSet<EstensioneClientEntity> hashSet2 = new HashSet<>(Arrays.asList(eHelpDesk, eNomeApplicazione, eUrlEsposizione,eUrlRedirezione,eClientId));
		hashSet2.addAll(hashSet);
		
		return hashSet2;
		
	}

	@Override
	public DatiSpecificiClient getDatiSpecificiClient(Set<EstensioneClientEntity> estensioni) {
		AuthTypeOAuthAuthorizationCode specSrc = new AuthTypeOAuthAuthorizationCode();
		
		specSrc.setHelpDesk(getTextProperty(estensioni, HELP_DESK_PROPERTY));
		specSrc.setNomeApplicazionePortale(getTextProperty(estensioni, NOME_APPLICAZIONE_PORTALE_PROPERTY));
		specSrc.setUrlEsposizione(getTextProperty(estensioni, URL_ESPOSIZIONE_PROPERTY));
		specSrc.setUrlRedirezione(getTextProperty(estensioni, URL_REDIREZIONE_PROPERTY));
		specSrc.setClientId(getTextProperty(estensioni, CLIENT_ID));

		populateDatiSpecifici(specSrc, estensioni);

		return specSrc;
	}
	
	@Override
	public List<String> getErroriConfigurabile(ClientEntity entity) {
		DatiSpecificiClient dsc = getDatiSpecificiClient(entity.getEstensioni());

		if(!(dsc instanceof AuthTypeOAuthAuthorizationCode)) {
			throw new BadRequestException(ErrorCode.CLT_003, java.util.Map.of("expectedType", AuthTypeOAuthAuthorizationCode.class.getSimpleName()));
		}
		
		AuthTypeOAuthAuthorizationCode specDsc = (AuthTypeOAuthAuthorizationCode) dsc;

		List<String> errori = new ArrayList<>();
		
		if(specDsc.getClientId() == null) {
			errori.add("client_id");
		}
		
		if(specDsc.getUrlEsposizione() == null || specDsc.getUrlEsposizione().trim().isEmpty()) {
			errori.add("url_esposizione");
		}
		
		if(specDsc.getUrlRedirezione() == null || specDsc.getUrlRedirezione().trim().isEmpty()) {
			errori.add("url_redirezione");
		}
		
		if(specDsc.getNomeApplicazionePortale() == null || specDsc.getNomeApplicazionePortale().trim().isEmpty()) {
			errori.add("nome_applicazione_portale");
		}
		
		if(specDsc.getHelpDesk() == null || specDsc.getHelpDesk().trim().isEmpty()) {
			errori.add("help_desk");
		}
		
		return errori;
	}



}
