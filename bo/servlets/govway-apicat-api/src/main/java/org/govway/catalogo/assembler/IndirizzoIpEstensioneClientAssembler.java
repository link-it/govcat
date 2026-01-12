/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
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

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity_;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity_;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.AuthTypeIndirizzoIp;
import org.govway.catalogo.servlets.model.AuthTypeIndirizzoIpCreate;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthType;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthTypeIndirizzoIp;
import org.govway.catalogo.servlets.model.DatiSpecificiClient;
import org.govway.catalogo.servlets.model.DatiSpecificiClientCreate;
import org.springframework.data.jpa.domain.Specification;

public class IndirizzoIpEstensioneClientAssembler extends AbstractEstensioneClientAssembler {

	private static final String INDIRIZZO_IP_PROPERTY = "indirizzo_ip";

	@Override
	public Set<EstensioneClientEntity> getEstensioni(DatiSpecificiClientCreate src, ConfigurazioneAuthType configurazione) {

		if(!(src instanceof AuthTypeIndirizzoIpCreate)) {
			throw new BadRequestException(ErrorCode.CLT_400_CONFIG, java.util.Map.of("expectedType", AuthTypeIndirizzoIpCreate.class.getSimpleName()));
		}

		AuthTypeIndirizzoIpCreate specSrc = (AuthTypeIndirizzoIpCreate) src;

		if(!(configurazione instanceof ConfigurazioneAuthTypeIndirizzoIp)) {
			throw new BadRequestException(ErrorCode.CLT_400_CONFIG, java.util.Map.of("expectedType", ConfigurazioneAuthTypeIndirizzoIp.class.getSimpleName()));
		}

		EstensioneClientEntity eIP = new EstensioneClientEntity();
		eIP.setNome(INDIRIZZO_IP_PROPERTY);
		eIP.setValore(specSrc.getIndirizzoIp());

		Set<EstensioneClientEntity> hashSet = super.getEstensioni(specSrc, configurazione);
		hashSet.add(eIP);
		
		return hashSet;
		
	}

	@Override
	public DatiSpecificiClient getDatiSpecificiClient(Set<EstensioneClientEntity> estensioni) {
		AuthTypeIndirizzoIp specSrc = new AuthTypeIndirizzoIp();
		
		specSrc.setIndirizzoIp(getTextProperty(estensioni, INDIRIZZO_IP_PROPERTY));

		populateDatiSpecifici(specSrc, estensioni);

		return specSrc;
	}

	@Override
	public String checkDuplicati(Set<EstensioneClientEntity> estensioni) {
		
		final String indirizzoIp = getTextProperty(estensioni, INDIRIZZO_IP_PROPERTY);
		Specification<ClientEntity> spec = new Specification<ClientEntity>() {
			
			private static final long serialVersionUID = 1L;

			@Override
			public Predicate toPredicate(Root<ClientEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
				List<Predicate> predLst = new ArrayList<>();
				
				predLst.add(cb.equal(root.join(ClientEntity_.estensioni).get(EstensioneClientEntity_.nome), INDIRIZZO_IP_PROPERTY)); 
				predLst.add(cb.equal(root.join(ClientEntity_.estensioni).get(EstensioneClientEntity_.valore), indirizzoIp)); 

				return cb.and(predLst.toArray(new Predicate[]{}));
			}
		};
		if(this.clientService.exists(spec)) {
			return "Indirizzo IP: " + indirizzoIp;
		}
		
		return null;
	}
	
	@Override
	public List<String> getErroriConfigurabile(ClientEntity entity) {
		DatiSpecificiClient dsc = getDatiSpecificiClient(entity.getEstensioni());

		if(!(dsc instanceof AuthTypeIndirizzoIp)) {
			throw new BadRequestException(ErrorCode.CLT_400_CONFIG, java.util.Map.of("expectedType", AuthTypeIndirizzoIp.class.getSimpleName()));
		}
		
		AuthTypeIndirizzoIp specDsc = (AuthTypeIndirizzoIp) dsc;

		List<String> errori = new ArrayList<>();
		
		if(specDsc.getIndirizzoIp() == null) {
			errori.add("indirizzo_ip");
		}
		
		return errori;
	}




}
