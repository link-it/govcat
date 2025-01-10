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

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity.AuthType;
import org.govway.catalogo.core.orm.entity.ClientEntity.StatoEnum;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.servlets.model.AdesioneClientCreate;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.ClientCreate;
import org.govway.catalogo.servlets.model.ClientUpdate;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthType;
import org.govway.catalogo.servlets.model.DatiSpecificiClient;
import org.govway.catalogo.servlets.model.StatoClientEnum;
import org.springframework.beans.factory.annotation.Autowired;

public class ClientEngineAssembler extends CoreEngineAssembler {

	@Autowired
	private HttpBasicEstensioneClientAssembler httpBasicEstensioneClientAssembler;
	@Autowired
	private HttpsEstensioneClientAssembler httpsEstensioneClientAssembler;
	@Autowired
	private HttpsPdndEstensioneClientAssembler httpsPdndEstensioneClientAssembler;
	@Autowired
	private PdndEstensioneClientAssembler pdndEstensioneClientAssembler;
	@Autowired
	private SignPdndEstensioneClientAssembler signPdndEstensioneClientAssembler;
	@Autowired
	private HttpsPdndSignEstensioneClientAssembler httpsPdndSignEstensioneClientAssembler;
	@Autowired
	private HttpsSignEstensioneClientAssembler httpsSignEstensioneClientAssembler;
	@Autowired
	private SignEstensioneClientAssembler signEstensioneClientAssembler;
	@Autowired
	private IndirizzoIpEstensioneClientAssembler indirizzoIpEstensioneClientAssembler;
	@Autowired
	private NoDatiEstensioneClientAssembler noDatiEstensioneClientAssembler;
	@Autowired
	private OAuthAuthorizationCodeEstensioneClientAssembler oauthAuthorizationCodeEstensioneClientAssembler;
	@Autowired
	private OAuthClientCredentialsEstensioneClientAssembler oauthClientCredentialsEstensioneClientAssembler;
	@Autowired
	private Configurazione configurazione;

	public AmbienteEnum toAmbiente(org.govway.catalogo.servlets.model.AmbienteEnum ambiente) {
		if(ambiente == null) return null;
		switch(ambiente) {
		case COLLAUDO: return AmbienteEnum.COLLAUDO;
		case PRODUZIONE: return AmbienteEnum.PRODUZIONE;
		}
		
		return null;
	}

	public org.govway.catalogo.servlets.model.AmbienteEnum toAmbiente(AmbienteEnum ambiente) {
		if(ambiente == null) return null;
		switch(ambiente) {
		case COLLAUDO: return org.govway.catalogo.servlets.model.AmbienteEnum.COLLAUDO;
		case PRODUZIONE: return org.govway.catalogo.servlets.model.AmbienteEnum.PRODUZIONE;
		}
		
		return null;
	}

	public StatoEnum toStatoClient(StatoClientEnum stato) {
		switch(stato) {
		case NUOVO: return StatoEnum.NUOVO;
		case CONFIGURATO: return StatoEnum.CONFIGURATO;
		}
		
		return null;
	}

	public StatoClientEnum toStatoClient(StatoEnum stato) {
		switch(stato) {
		case NUOVO: return StatoClientEnum.NUOVO;
		case CONFIGURATO: return StatoClientEnum.CONFIGURATO;
		}
		
		return null;
	}

	public Collection<EstensioneClientEntity> getEstensioni(ClientCreate src) {
		
		IEstensioneClientAssembler assembler = getAssembler(src.getDatiSpecifici().getAuthType());
		ConfigurazioneAuthType configurazione = getConfigurazione(src.getDatiSpecifici().getAuthType());
		return assembler.getEstensioni(src.getDatiSpecifici(), configurazione);
	}

	public List<String> getErroriConfigurabile(ClientEntity entity) {
		IEstensioneClientAssembler assembler = getAssembler(entity.getAuthType());
		return assembler.getErroriConfigurabile(entity);
	}

	public Set<EstensioneClientEntity> getEstensioni(ClientUpdate src, Set<EstensioneClientEntity> attuali) {
		IEstensioneClientAssembler assembler = getAssembler(src.getDatiSpecifici().getAuthType());
		ConfigurazioneAuthType configurazione = getConfigurazione(src.getDatiSpecifici().getAuthType());
		Set<EstensioneClientEntity> nuove = assembler.getEstensioni(src.getDatiSpecifici(), configurazione);
		
		Set<EstensioneClientEntity> merge = merge(attuali, nuove);

		return merge;
	}

	private Set<EstensioneClientEntity> merge(Set<EstensioneClientEntity> attuali, Set<EstensioneClientEntity> nuove) {
		Set<EstensioneClientEntity> merge = new HashSet<>();
		for(EstensioneClientEntity n: nuove) {
			Optional<EstensioneClientEntity> findAny = attuali.stream()
			.filter(a -> a.getNome().equals(n.getNome()))
			.findAny();
			if(findAny.isPresent()) {
				n.setId(findAny.get().getId());
			}
			
			merge.add(n);
		}
		
		return merge;
	}

	public Set<EstensioneClientEntity> getEstensioni(AdesioneClientCreate src) {
		IEstensioneClientAssembler assembler = getAssembler(src.getDatiSpecifici().getAuthType());
		ConfigurazioneAuthType configurazione = getConfigurazione(src.getDatiSpecifici().getAuthType());
		Set<EstensioneClientEntity> estensioni = assembler.getEstensioni(src.getDatiSpecifici(), configurazione);
		
		String duplicati = assembler.checkDuplicati(estensioni);
		
		if(duplicati != null) {
			throw new ConflictException(duplicati);
		}
		
		return estensioni;
	}

	public DatiSpecificiClient getEstensioni(ClientEntity src) {
		IEstensioneClientAssembler assembler = getAssembler(src.getAuthType());
		DatiSpecificiClient datiSpecificiClient = assembler.getDatiSpecificiClient(src.getEstensioni());
		datiSpecificiClient.setAuthType(getAuthType(src.getAuthType()));
		return datiSpecificiClient;
	}

	private IEstensioneClientAssembler getAssembler(AuthType authType) {
		switch(authType) {
		case HTTPS: return httpsEstensioneClientAssembler;
		case PDND: return pdndEstensioneClientAssembler;
		case HTTPS_PDND: return httpsPdndEstensioneClientAssembler;
		case HTTPS_PDND_SIGN: return httpsPdndSignEstensioneClientAssembler;
		case HTTPS_SIGN: return httpsSignEstensioneClientAssembler;
		case HTTP_BASIC: return httpBasicEstensioneClientAssembler;
		case INDIRIZZO_IP: return indirizzoIpEstensioneClientAssembler;
		case NO_DATI: return noDatiEstensioneClientAssembler;
		case OAUTH_AUTHORIZATION_CODE: return oauthAuthorizationCodeEstensioneClientAssembler;
		case OAUTH_CLIENT_CREDENTIALS: return oauthClientCredentialsEstensioneClientAssembler;
		case SIGN: return signEstensioneClientAssembler;
		case SIGN_PDND:return signPdndEstensioneClientAssembler;
		}

		throw new InternalException("Auth type ["+authType+"] non gestito");
	}

	private ConfigurazioneAuthType getConfigurazione(AuthTypeEnum authType) {
		
		return this.configurazione.getServizio().getApi().getAuthType()
			.stream()
			.filter(at -> at.getType().equals(authType))
			.findAny()
			.orElseThrow(() -> {return new InternalException("Auth type ["+authType+"] non gestito");});

	}


	private IEstensioneClientAssembler getAssembler(AuthTypeEnum authType) {
		switch(authType) {
		case HTTPS: return httpsEstensioneClientAssembler;
		case PDND: return pdndEstensioneClientAssembler;
		case HTTPS_PDND: return httpsPdndEstensioneClientAssembler;
		case HTTPS_PDND_SIGN: return httpsPdndSignEstensioneClientAssembler;
		case HTTPS_SIGN: return httpsSignEstensioneClientAssembler;
		case HTTP_BASIC: return httpBasicEstensioneClientAssembler;
		case INDIRIZZO_IP: return indirizzoIpEstensioneClientAssembler;
		case NO_DATI: return noDatiEstensioneClientAssembler;
		case OAUTH_AUTHORIZATION_CODE: return oauthAuthorizationCodeEstensioneClientAssembler;
		case OAUTH_CLIENT_CREDENTIALS: return oauthClientCredentialsEstensioneClientAssembler;
		case SIGN: return signEstensioneClientAssembler;
		case SIGN_PDND:return signPdndEstensioneClientAssembler;
		}

		throw new InternalException("Auth type ["+authType+"] non gestito");
	}

	public AuthType getAuthType(AuthTypeEnum authType) {
		switch(authType) {
		case HTTPS: return AuthType.HTTPS;
		case PDND: return AuthType.PDND;
		case HTTPS_PDND: return AuthType.HTTPS_PDND;
		case HTTPS_PDND_SIGN: return AuthType.HTTPS_PDND_SIGN;
		case HTTPS_SIGN: return AuthType.HTTPS_SIGN;
		case HTTP_BASIC: return AuthType.HTTP_BASIC;
		case INDIRIZZO_IP: return AuthType.INDIRIZZO_IP;
		case NO_DATI: return AuthType.NO_DATI;
		case OAUTH_AUTHORIZATION_CODE: return AuthType.OAUTH_AUTHORIZATION_CODE;
		case OAUTH_CLIENT_CREDENTIALS: return AuthType.OAUTH_CLIENT_CREDENTIALS;
		case SIGN: return AuthType.SIGN;
		case SIGN_PDND: return AuthType.SIGN_PDND;
		}

		throw new InternalException("Auth type ["+authType+"] non gestito");
	}

	public AuthTypeEnum getAuthType(AuthType authType) {
		switch(authType) {
		case HTTPS: return AuthTypeEnum.HTTPS;
		case PDND: return AuthTypeEnum.PDND;
		case HTTPS_PDND: return AuthTypeEnum.HTTPS_PDND;
		case HTTPS_PDND_SIGN: return AuthTypeEnum.HTTPS_PDND_SIGN;
		case HTTPS_SIGN: return AuthTypeEnum.HTTPS_SIGN;
		case HTTP_BASIC: return AuthTypeEnum.HTTP_BASIC;
		case INDIRIZZO_IP: return AuthTypeEnum.INDIRIZZO_IP;
		case NO_DATI: return AuthTypeEnum.NO_DATI;
		case OAUTH_AUTHORIZATION_CODE: return AuthTypeEnum.OAUTH_AUTHORIZATION_CODE;
		case OAUTH_CLIENT_CREDENTIALS: return AuthTypeEnum.OAUTH_CLIENT_CREDENTIALS;
		case SIGN:return AuthTypeEnum.SIGN;
		case SIGN_PDND:return AuthTypeEnum.SIGN_PDND;
		}

		throw new InternalException("Auth type ["+authType+"] non gestito");
	}
}
