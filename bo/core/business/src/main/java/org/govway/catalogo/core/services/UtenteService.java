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

import java.util.Optional;

import org.govway.catalogo.core.dao.specifications.AdesioneSpecification;
import org.govway.catalogo.core.dao.specifications.DominioSpecification;
import org.govway.catalogo.core.dao.specifications.ServizioSpecification;
import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class UtenteService extends AbstractService {

	public Page<UtenteEntity> findAll(Specification<UtenteEntity> spec, Pageable p) {
		return this.utenteRepo.findAll(spec, p);
	}

	public long count(Specification<UtenteEntity> spec) {
		return this.utenteRepo.count(spec);
	}

	public void delete(UtenteEntity utente) {
		
		checkReferente(utente);
		
		for(ClasseUtenteEntity c: utente.getClassi()) {
			c.getUtentiAssociati().remove(utente);
		}
		utente.getClassi().clear();
		this.utenteRepo.save(utente);
		this.utenteRepo.delete(utente);
	}

	public String checkReferente(UtenteEntity utente) {
		AdesioneSpecification specA = new AdesioneSpecification();
		specA.setIdReferente(Optional.of(utente.getIdUtente()));
		long sizeadesioni = this.adesioneRepo.count(specA);
		
		if(sizeadesioni > 0) {
			return "Utente ["+utente.getIdUtente()+"] referente di ["+sizeadesioni+"] adesioni";
		}
		
		ServizioSpecification specS = new ServizioSpecification();
		specS.setIdReferente(Optional.of(utente.getIdUtente()));
		long sizeservizi = this.servizioRepo.count(specS);
		
		if(sizeservizi > 0) {
			return "Utente ["+utente.getIdUtente()+"] referente di ["+sizeservizi+"] servizi";
		}
		
		DominioSpecification specD = new DominioSpecification();
		specD.setIdReferente(Optional.of(utente.getIdUtente()));
		long sizedomini = this.dominioRepo.count(specD);
		
		if(sizedomini > 0) {
			return "Utente ["+utente.getIdUtente()+"] referente di ["+sizedomini+"] domini";
		}
		
		return null;
	}

	public boolean exists(String key) {
		return this.find(key).isPresent();
	}

	public Optional<UtenteEntity> find(String key) {
		return this.utenteRepo.findOne(filterByKey(key));
	}

	public void save(UtenteEntity utente) {
		this.utenteRepo.save(utente);
	}

	public boolean existsByKey(String idUtente) {
		return this.utenteRepo.findOne(filterByKey(idUtente)).isPresent();
	}

	private Specification<UtenteEntity> filterByKey(String key) {
		UtenteSpecification utenteFilter = new UtenteSpecification();
		utenteFilter.setIdUtente(Optional.of(key));
		return utenteFilter;
	}

}
