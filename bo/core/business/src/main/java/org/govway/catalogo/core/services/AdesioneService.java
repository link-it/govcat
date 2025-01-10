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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.govway.catalogo.core.dao.specifications.AdesioneSpecification;
import org.govway.catalogo.core.dao.specifications.MessaggioAdesioneSpecification;
import org.govway.catalogo.core.dao.specifications.ReferenteAdesioneSpecification;
import org.govway.catalogo.core.exceptions.NotFoundException;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.MessaggioAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class AdesioneService extends AbstractService {

	public Page<AdesioneEntity> findAll(Specification<AdesioneEntity> spec, Pageable p) {
		return this.adesioneRepo.findAll(spec, p);
	}

	public Optional<AdesioneEntity> findOne(Specification<AdesioneEntity> spec) {
		return this.adesioneRepo.findOne(spec);
	}

	public long count(Specification<AdesioneEntity> spec) {
		return this.adesioneRepo.count(spec);
	}

	public void delete(AdesioneEntity adesione) {
		this.messaggioAdesioneRepo.deleteAll(adesione.getMessaggi());
		this.adesioneRepo.delete(adesione);
	}

	public void save(AdesioneEntity adesione) {
		this.adesioneRepo.save(adesione);
	}

	public Optional<AdesioneEntity> findByIdAdesione(String idAdesione) {
		AdesioneSpecification adesioneFilter = new AdesioneSpecification();
		adesioneFilter.setIdAdesione(Optional.of(UUID.fromString(idAdesione)));
		return this.adesioneRepo.findOne(adesioneFilter);
	}

	public Page<ReferenteAdesioneEntity> findAllReferentiAdesione(ReferenteAdesioneSpecification spec,
			Pageable pageable) {
		return this.referenteAdesioneRepo.findAll(spec, pageable);
	}

	public List<ReferenteAdesioneEntity> getReferenteAdesione(UUID idAdesione, String idUtente, TIPO_REFERENTE tipo) {
		ReferenteAdesioneSpecification spec = new ReferenteAdesioneSpecification();
		spec.setIdAdesione(Optional.of(idAdesione.toString()));
		spec.setIdUtente(Optional.of(idUtente.toString()));
		spec.setTipoReferente(Optional.ofNullable(tipo));
		
		List<ReferenteAdesioneEntity> findAll = this.referenteAdesioneRepo.findAll(spec);
		if(findAll.size() == 0) {
			throw new NotFoundException("Referente ["+idUtente+"] non trovato per l'adesione ["+idAdesione+"] "+((tipo != null) ? "e tipo ["+tipo+"]" : ""));
		}
		
		return findAll;
	}

	public void deleteReferenteAdesione(ReferenteAdesioneEntity entity) {
		entity.getAdesione().getReferenti().remove(entity);
		this.referenteAdesioneRepo.delete(entity);
	}

	public void save(ReferenteAdesioneEntity referenteEntity) {
		this.referenteAdesioneRepo.save(referenteEntity);
	}

	public Page<MessaggioAdesioneEntity> findAllMessaggiAdesione(Specification<MessaggioAdesioneEntity> spec, Pageable p) {
		return this.messaggioAdesioneRepo.findAll(spec, p);
	}
	
	public Optional<MessaggioAdesioneEntity> findMessaggioAdesione(String idAdesione, String idMessaggio) {
		MessaggioAdesioneSpecification spec = new MessaggioAdesioneSpecification();
		spec.setIdAdesione(Optional.of(idAdesione));
		spec.setUuid(Optional.of(idMessaggio));
		return this.messaggioAdesioneRepo.findOne(spec);
	}
	
	public void save(MessaggioAdesioneEntity entity) {
		this.messaggioAdesioneRepo.save(entity);
	}

	public void delete(MessaggioAdesioneEntity entity) {
		this.messaggioAdesioneRepo.delete(entity);
	}

	public List<String> getAdesioniByReferente(UtenteEntity u) {
		return this.adesioneRepo.getAdesioniByReferente(u.getId(), TIPO_REFERENTE.REFERENTE);
	}

	public List<String> getAdesioniByReferenteTecnico(UtenteEntity u) {
		return this.adesioneRepo.getAdesioniByReferente(u.getId(), TIPO_REFERENTE.REFERENTE_TECNICO);
	}

	public List<String> getAdesioniByReferenteServizio(UtenteEntity u) {
		return this.adesioneRepo.getAdesioniByReferenteServizio(u.getId(), TIPO_REFERENTE.REFERENTE);
	}

	public List<String> getAdesioniByReferenteTecnicoServizio(UtenteEntity u) {
		return this.adesioneRepo.getAdesioniByReferenteServizio(u.getId(), TIPO_REFERENTE.REFERENTE_TECNICO);
	}

	public List<String> getAdesioniByReferenteDominio(UtenteEntity u) {
		return this.adesioneRepo.getAdesioniByReferenteDominio(u.getId(), TIPO_REFERENTE.REFERENTE);
	}

	public List<String> getAdesioniByReferenteTecnicoDominio(UtenteEntity u) {
		return this.adesioneRepo.getAdesioniByReferenteDominio(u.getId(), TIPO_REFERENTE.REFERENTE_TECNICO);
	}

	public List<String> getAdesioniByRichiedente(UtenteEntity u) {
		return this.adesioneRepo.getAdesioniByRichiedente(u.getId());
	}

	public boolean existsBySoggettoServizioNonArchiviato(AdesioneEntity entity, String statoArchiviato) {
		AdesioneSpecification spec = new AdesioneSpecification();
		spec.setIdServizio(Optional.of(UUID.fromString(entity.getServizio().getIdServizio())));
		spec.setIdSoggetto(Optional.of(UUID.fromString(entity.getSoggetto().getIdSoggetto())));
		return this.adesioneRepo.findAll(spec, Pageable.unpaged()).stream().anyMatch( s -> !s.getStato().equals(statoArchiviato));
	}


}
