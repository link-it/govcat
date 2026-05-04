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
package org.govway.catalogo.core.services;

import java.util.Optional;

import org.govway.catalogo.core.dao.specifications.AziendaEsternaSpecification;
import org.govway.catalogo.core.orm.entity.AziendaEsternaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class AziendaEsternaService extends AbstractService {

	public Page<AziendaEsternaEntity> findAll(Specification<AziendaEsternaEntity> spec, Pageable p) {
		return this.aziendaEsternaRepo.findAll(spec, p);
	}

	public void delete(AziendaEsternaEntity azienda) {
		this.aziendaEsternaRepo.delete(azienda);
	}

	public boolean exists(String nome) {
		return this.findByNome(nome).isPresent();
	}

	public Optional<AziendaEsternaEntity> findByNome(String nome) {
		return this.aziendaEsternaRepo.findOne(filterByNome(nome));
	}

	public void save(AziendaEsternaEntity azienda) {
		this.aziendaEsternaRepo.save(azienda);
	}

	/**
	 * Restituisce l'entità con il nome indicato; se non esiste viene creata e salvata.
	 * Operazione di find-or-create usata in fase di create/update utente per
	 * normalizzare gli inserimenti dei nomi liberi nel medesimo riferimento.
	 */
	public AziendaEsternaEntity findOrCreate(String nome) {
		return this.findByNome(nome).orElseGet(() -> {
			AziendaEsternaEntity nuova = new AziendaEsternaEntity();
			nuova.setNome(nome);
			this.aziendaEsternaRepo.save(nuova);
			return nuova;
		});
	}

	private Specification<AziendaEsternaEntity> filterByNome(String nome) {
		AziendaEsternaSpecification filter = new AziendaEsternaSpecification();
		filter.setNome(Optional.of(nome));
		return filter;
	}

}
