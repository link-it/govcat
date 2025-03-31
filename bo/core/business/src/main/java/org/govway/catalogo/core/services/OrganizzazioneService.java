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
package org.govway.catalogo.core.services;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.core.dao.specifications.OrganizzazioneSpecification;
import org.govway.catalogo.core.exceptions.NotFoundException;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class OrganizzazioneService extends AbstractService {

	private Logger logger = LoggerFactory.getLogger(OrganizzazioneService.class);

	public Page<OrganizzazioneEntity> findAll(Specification<OrganizzazioneEntity> spec, Pageable p) {
		return this.orgRepo.findAll(spec, p);
	}

	public void delete(OrganizzazioneEntity organization) {
		this.orgRepo.delete(organization);
	}

	public boolean exists(UUID key) {
		return this.find(key).isPresent();
	}

	public Optional<OrganizzazioneEntity> find(UUID key) {
		return this.orgRepo.findOne(filterByKey(key));
	}

	public Optional<OrganizzazioneEntity> findByNome(String key) {
		return this.orgRepo.findOne(filterByNome(key));
	}

	public void save(OrganizzazioneEntity organization) {
		if(organization.isAderente() || organization.isReferente()) {

			this.logger.debug("Organizzazione aderente["+organization.isAderente()+"] referente["+organization.isReferente()+"]");

			String customCamelCase = customCamelCase(organization.getNome(), true);

			SoggettoEntity sogg = organization.getSoggetti()
					.stream()
					.findAny().orElseGet(() -> {
						SoggettoEntity so = new SoggettoEntity();
						so.setDataCreazione(new Date());
						so.setRichiedente(organization.getRichiedente());
						so.setIdSoggetto(UUID.randomUUID().toString());
						so.setNome(customCamelCase);
						so.setOrganizzazione(organization);
						
						so.setAderente(organization.isAderente());
						so.setReferente(organization.isReferente());

						so.setDescrizione(organization.getDescrizione());
						this.logger.debug("Creo Soggetto nome["+so.getNome()+"] id_soggetto["+so.getIdSoggetto()+"]");

						this.soggettoRepo.save(so);
						organization.getSoggetti().add(so);
						return so;
					});

			sogg.setAderente(organization.isAderente());
			sogg.setReferente(organization.isReferente());

			sogg.setDescrizione(organization.getDescrizione());
			
			if(organization.isAderente() && organization.getSoggettoDefault() == null) {
				List<SoggettoEntity> soggRef = organization.getSoggetti().stream().filter(s -> s.isAderente()).collect(Collectors.toList());
				
				if(soggRef.size() == 1) {
					organization.setSoggettoDefault(soggRef.get(0));
				} else {
					throw new NotFoundException("Impossibile aggiornare l'organizzazione: impostare il soggetto di default");
				}
			}

		}

		this.orgRepo.save(organization);
		this.logger.debug("Soggetti associati alla organizzazione ["+organization.getSoggetti().size()+"]");
		for(SoggettoEntity sogg: organization.getSoggetti()) {
			this.logger.debug("Salvo Soggetto nome["+sogg.getNome()+"] id_soggetto["+sogg.getIdSoggetto()+"]");
			this.soggettoRepo.save(sogg);
		}
	}

	public static String customCamelCase(String v, boolean upperFirstChar) {

		if(v==null || v.isEmpty()) {
			return v;
		}

		// camel case

		String[] words = v.split("[^A-Za-z0-9-]+");

		if(words==null || words.length<=0) {
			return normalize(v);
		}

		StringBuilder builder = new StringBuilder();
		for (int i = 0; i < words.length; i++) {
			String word = words[i];
			if(word==null || word.isEmpty()) {
				continue;
			}
			if (i > 0 || upperFirstChar) {
				if(word.length()>1) {
					word = Character.toUpperCase(word.charAt(0)) + word.substring(1);
				}
				else {
					word = Character.toUpperCase(word.charAt(0)) + "";
				}
			}
			builder.append(word);
		}
		return normalize(builder.toString());
	}
	private static String normalize(String v) {

		if(v==null || v.isEmpty()) {
			return v;
		}

		// sostituisco caratteri
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < v.length(); i++) {
			char c = v.charAt(i);
			if(!Character.isDigit(c) && !Character.isAlphabetic(c)) {
				sb.append("-");
			}
			else {
				sb.append(c);
			}
		}
		v = sb.toString();

		// elimino doppi --
		while(v.contains("--")) {
			v = v.replace("--", "-");
		}
		return v;
	}

	public boolean existsByNome(OrganizzazioneEntity organization) {
		return this.orgRepo.findOne(filterByNome(organization)).isPresent();
	}

	private Specification<OrganizzazioneEntity> filterByKey(UUID key) {
		OrganizzazioneSpecification organizationFilter = new OrganizzazioneSpecification();
		organizationFilter.setIdOrganizzazione(Optional.of(key));
		return organizationFilter;
	}

	private Specification<OrganizzazioneEntity> filterByNome(OrganizzazioneEntity organization) {
		return filterByNome(organization.getNome());
	}

	private Specification<OrganizzazioneEntity> filterByNome(String nome) {
		OrganizzazioneSpecification organizationFilter = new OrganizzazioneSpecification();
		organizationFilter.setNome(Optional.of(nome));
		return organizationFilter;
	}

}
