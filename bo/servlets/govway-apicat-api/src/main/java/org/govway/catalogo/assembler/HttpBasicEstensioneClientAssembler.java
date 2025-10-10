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

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity_;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity_;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.AuthTypeHttpBasic;
import org.govway.catalogo.servlets.model.AuthTypeHttpBasicCreate;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthType;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthTypeHttpBasic;
import org.govway.catalogo.servlets.model.DatiSpecificiClient;
import org.govway.catalogo.servlets.model.DatiSpecificiClientCreate;
import org.springframework.data.jpa.domain.Specification;

public class HttpBasicEstensioneClientAssembler extends AbstractEstensioneClientAssembler {

	private static final String USERNAME_PROPERTY = "username";
	private static final String PASSWORD_PROPERTY = "password";

	@Override
	public Set<EstensioneClientEntity> getEstensioni(DatiSpecificiClientCreate src, ConfigurazioneAuthType configurazione) {

		if(!(src instanceof AuthTypeHttpBasicCreate)) {
			throw new BadRequestException(ErrorCode.CLT_400_CONFIG, java.util.Map.of("expectedType", AuthTypeHttpBasicCreate.class.getSimpleName()));
		}

		AuthTypeHttpBasicCreate specSrc = (AuthTypeHttpBasicCreate) src;

		if(!(configurazione instanceof ConfigurazioneAuthTypeHttpBasic)) {
			throw new BadRequestException(ErrorCode.CLT_400_CONFIG, java.util.Map.of("expectedType", ConfigurazioneAuthTypeHttpBasic.class.getSimpleName()));
		}
		
//		ConfigurazioneAuthTypeHttpBasic conf = (ConfigurazioneAuthTypeHttpBasic) configurazione;

		Set<EstensioneClientEntity> hashSet = super.getEstensioni(specSrc, configurazione);

		if(specSrc.getUsername()!=null) {
			EstensioneClientEntity eUsername = new EstensioneClientEntity();
			eUsername.setNome(USERNAME_PROPERTY);
			eUsername.setValore(specSrc.getUsername());
			hashSet.add(eUsername);
		}
		
		
		if(specSrc.getPassword()!=null) {
			EstensioneClientEntity ePassword = new EstensioneClientEntity();
			ePassword.setNome(PASSWORD_PROPERTY);
			ePassword.setValore(specSrc.getPassword());
	
			hashSet.add(ePassword);
		}
		return hashSet;
		
	}

	@Override
	public DatiSpecificiClient getDatiSpecificiClient(Set<EstensioneClientEntity> estensioni) {
		AuthTypeHttpBasic specSrc = new AuthTypeHttpBasic();
		
		if(existsProperty(estensioni, USERNAME_PROPERTY)) {
			specSrc.setUsername(getTextProperty(estensioni, USERNAME_PROPERTY));
		}
		
		if(existsProperty(estensioni, PASSWORD_PROPERTY)) {
			specSrc.setPassword(getTextProperty(estensioni, PASSWORD_PROPERTY));
		}

		populateDatiSpecifici(specSrc, estensioni);
		
		return specSrc;
	}


	@Override
	public String checkDuplicati(Set<EstensioneClientEntity> estensioni) {
		
		if(existsProperty(estensioni, USERNAME_PROPERTY)) {
			final String username = getTextProperty(estensioni, USERNAME_PROPERTY);
			Specification<ClientEntity> spec = new Specification<ClientEntity>() {
				
				private static final long serialVersionUID = 1L;
	
				@Override
				public Predicate toPredicate(Root<ClientEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
					List<Predicate> predLst = new ArrayList<>();
					
					predLst.add(cb.equal(root.join(ClientEntity_.estensioni).get(EstensioneClientEntity_.nome), USERNAME_PROPERTY)); 
					predLst.add(cb.equal(root.join(ClientEntity_.estensioni).get(EstensioneClientEntity_.valore), username)); 
	
					return cb.and(predLst.toArray(new Predicate[]{}));
				}
			};
			if(this.clientService.exists(spec)) {
				return "Username: " + username;
			}
		}
		
		return null;
	}

	@Override
	public List<String> getErroriConfigurabile(ClientEntity entity) {
		List<String> lst = new ArrayList<>();

		DatiSpecificiClient dsc = getDatiSpecificiClient(entity.getEstensioni());

		if(!(dsc instanceof AuthTypeHttpBasic)) {
			throw new BadRequestException(ErrorCode.CLT_400_CONFIG, java.util.Map.of("expectedType", AuthTypeHttpBasic.class.getSimpleName()));
		}
		
		AuthTypeHttpBasic specDsc = (AuthTypeHttpBasic) dsc;

		if(specDsc.getUsername()== null) {
			lst.add("username");
		}

//		if(specDsc.getPassword()== null) {
//			lst.add("password");
//		}
//		
		return lst;
	}

}
