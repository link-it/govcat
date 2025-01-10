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
import java.util.UUID;

import org.govway.catalogo.core.dao.specifications.ClasseUtenteSpecification;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class ClasseUtenteService extends AbstractService {

	public Page<ClasseUtenteEntity> findAll(Specification<ClasseUtenteEntity> spec, Pageable p) {
		return this.classeUtenteRepo.findAll(spec, p);
	}

	public void delete(ClasseUtenteEntity classeUtente) {
		this.classeUtenteRepo.delete(classeUtente);
	}

	public void save(ClasseUtenteEntity classeUtente) {
		this.classeUtenteRepo.save(classeUtente);
	}

	public boolean exists(ClasseUtenteEntity classeUtente) {
		return this.classeUtenteRepo.findOne(filterByNome(classeUtente)).isPresent();
	}

	public Optional<ClasseUtenteEntity> findByNome(ClasseUtenteEntity classeUtente) {
		return this.classeUtenteRepo.findOne(filterByNome(classeUtente));
	}

	public Optional<ClasseUtenteEntity> findByNome(String classeUtente) {
		return this.classeUtenteRepo.findOne(filterByNome(classeUtente));
	}

	public Optional<ClasseUtenteEntity> findByIdClasseUtente(UUID nome) {
		ClasseUtenteSpecification classeUtenteFilter = new ClasseUtenteSpecification();
		classeUtenteFilter.setIdClasseUtente(Optional.of(nome));
		return this.classeUtenteRepo.findOne(classeUtenteFilter);
	}

	private Specification<ClasseUtenteEntity> filterByNome(ClasseUtenteEntity classeUtente) {
		return filterByNome(classeUtente.getNome());
	}

	private Specification<ClasseUtenteEntity> filterByNome(String nome) {
		ClasseUtenteSpecification classeUtenteFilter = new ClasseUtenteSpecification();
		classeUtenteFilter.setNome(Optional.of(nome));
		return classeUtenteFilter;
	}

}
