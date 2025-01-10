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

import org.govway.catalogo.core.dao.specifications.ClientSpecification;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class ClientService extends AbstractService {

	public Page<ClientEntity> findAll(Specification<ClientEntity> spec, Pageable p) {
		return this.clientRepo.findAll(spec, p);
	}

	public void delete(ClientEntity entity) {
		this.clientRepo.delete(entity);
	}

	public void delete(EstensioneClientEntity entity) {
		this.estensioneClientRepo.delete(entity);
	}

	public boolean exists(ClientEntity entity) {
		return this.exists(filterByKey(entity));
	}

	public boolean exists(Specification<ClientEntity> spec) {
		return this.clientRepo.count(spec) > 0;
	}

	public Optional<ClientEntity> find(UUID key) {
		return this.clientRepo.findOne(filterByKey(key));
	}

	public void save(ClientEntity entity) {
		this.clientRepo.save(entity);
	}

	public boolean existsByNomeSoggettoAmbiente(ClientEntity entity) {
		return this.clientRepo.count(filterByNomeSoggettoAmbiente(entity)) > 0;
	}

	public boolean existsByNomeSoggettoAmbiente(String nome, String soggetto, AmbienteEnum ambiente) {
		return this.clientRepo.count(filterByNomeSoggettoAmbiente(nome, soggetto, ambiente)) > 0;
	}

	public Optional<ClientEntity> findByNomeSoggettoAmbiente(String nome, UUID soggetto, AmbienteEnum ambiente) {
		ClientSpecification entityFilter = new ClientSpecification();
		entityFilter.setNome(Optional.of(nome));
		entityFilter.setIdSoggetto(Optional.of(soggetto));
		entityFilter.setAmbiente(Optional.of(ambiente));
		return this.clientRepo.findOne(entityFilter);
	}

	private Specification<ClientEntity> filterByKey(UUID key) {
		ClientSpecification entityFilter = new ClientSpecification();
		entityFilter.setIdClient(Optional.of(key));
		return entityFilter;
	}

	private Specification<ClientEntity> filterByKey(ClientEntity entity) {
		ClientSpecification entityFilter = new ClientSpecification();
		entityFilter.setIdClient(Optional.of(UUID.fromString(entity.getIdClient())));
		return entityFilter;
	}

	private Specification<ClientEntity> filterByNomeSoggettoAmbiente(ClientEntity entity) {
		ClientSpecification entityFilter = new ClientSpecification();
		entityFilter.setNome(Optional.of(entity.getNome()));
		entityFilter.setIdSoggetto(Optional.of(UUID.fromString(entity.getSoggetto().getIdSoggetto())));
		entityFilter.setAmbiente(Optional.of(entity.getAmbiente()));
		return entityFilter;
	}

	private Specification<ClientEntity> filterByNomeSoggettoAmbiente(String nome, String soggetto, AmbienteEnum ambiente) {
		ClientSpecification entityFilter = new ClientSpecification();
		entityFilter.setNome(Optional.of(nome));
		entityFilter.setIdSoggetto(Optional.of(UUID.fromString(soggetto)));
		entityFilter.setAmbiente(Optional.of(ambiente));
		return entityFilter;
	}

}
