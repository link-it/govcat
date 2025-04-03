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

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.govway.catalogo.core.dao.specifications.AllegatoServizioSpecification;
import org.govway.catalogo.core.dao.specifications.MessaggioServizioSpecification;
import org.govway.catalogo.core.dao.specifications.PackageServizioSpecification;
import org.govway.catalogo.core.dao.specifications.ReferenteServizioSpecification;
import org.govway.catalogo.core.dao.specifications.ServizioSpecification;
import org.govway.catalogo.core.dao.specifications.TagSpecification;
import org.govway.catalogo.core.exceptions.NotFoundException;
import org.govway.catalogo.core.orm.entity.AllegatoServizioEntity;
import org.govway.catalogo.core.orm.entity.MessaggioServizioEntity;
import org.govway.catalogo.core.orm.entity.PackageServizioEntity;
import org.govway.catalogo.core.orm.entity.ReferenteServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioGruppoEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.TagEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class ServizioService extends AbstractService {

	public Optional<ServizioEntity> findOne(Specification<ServizioEntity> spec) {
		return this.servizioRepo.findOne(spec);
	}

	public Page<ServizioEntity> findAll(Specification<ServizioEntity> spec, Pageable p) {
		return this.servizioRepo.findAll(spec, p);
	}

	public List<ServizioEntity> findAll(Specification<ServizioEntity> spec, Sort s) {
		return this.servizioRepo.findAll(spec, s);
	}

	public Page<ServizioGruppoEntity> findAllServiziGruppi(Specification<ServizioGruppoEntity> spec, Pageable p) {
		return this.servizioGruppoRepo.findAll(spec, p);
	}

	public Page<ServizioGruppoEntity> findAllServiziGruppiByUtente(Pageable p, UtenteEntity entity) {
		return this.servizioGruppoRepo.findAllByUtente(entity.getId(), p);
	}

	public void delete(ServizioEntity organization) {
		this.servizioRepo.delete(organization);
	}

	public void delete(PackageServizioEntity packageServizio) {
		this.packageServizioRepo.delete(packageServizio);
	}

	public Optional<PackageServizioEntity> findOnePackageServizio(PackageServizioSpecification specification) {
		return this.packageServizioRepo.findOne(specification);
	}

	public List<PackageServizioEntity> findAll() {
		return this.packageServizioRepo.findAll();
	}

	public boolean exists(UUID key) {
		return this.find(key).isPresent();
	}


	public Optional<ServizioEntity> findByNomeVersioneNonArchiviato(String nome, String versione, String statoArchiviato) {
		return this.servizioRepo.findOne(getSpecificationByNomeVersioneNonArchiviato(nome, versione, statoArchiviato));
	}

	public boolean existsByNomeVersioneNonArchiviato(ServizioEntity servizio, String statoArchiviato) {
		return existsByNomeVersioneNonArchiviato(servizio.getNome(), servizio.getVersione(), statoArchiviato);
	}

	public boolean existsByNomeVersioneNonArchiviato(String nome, String versione, String statoArchiviato) {
		return this.servizioRepo.count(getSpecificationByNomeVersioneNonArchiviato(nome, versione, statoArchiviato)) > 0;
	}

	private Specification<ServizioEntity> getSpecificationByNomeVersioneNonArchiviato(String nome, String versione, String statoArchiviato) {

		ServizioSpecification spec = new ServizioSpecification();
		spec.setNome(Optional.of(nome));
		spec.setVersione(Optional.of(versione));

		
		ServizioSpecification specStatoArchiviato = new ServizioSpecification();
		specStatoArchiviato.setStati(Arrays.asList(statoArchiviato));
		
		return spec.and(Specification.not(specStatoArchiviato));
	}
	
	public Optional<ServizioEntity> find(UUID key) {
		return this.servizioRepo.findOne(filterByKey(key));
	}

	public void save(ServizioEntity organization) {
		this.servizioRepo.save(organization);
	}

	private Specification<ServizioEntity> filterByKey(UUID key) {
		ServizioSpecification organizationFilter = new ServizioSpecification();
		organizationFilter.setIdServizi(Arrays.asList(key));
		return organizationFilter;
	}

	public Page<ReferenteServizioEntity> findAllReferentiServizio(ReferenteServizioSpecification spec,
			Pageable pageable) {
		return this.referenteServizioRepo.findAll(spec, pageable);
	}

	public List<ReferenteServizioEntity> getReferenteServizio(UUID idServizio, UUID idUtente, TIPO_REFERENTE tipo) {
		
		ReferenteServizioSpecification spec = new ReferenteServizioSpecification();
		spec.setIdServizio(Optional.of(idServizio));
		spec.setIdUtente(Optional.of(idUtente));
		spec.setTipoReferente(Optional.ofNullable(tipo));
		
		List<ReferenteServizioEntity> findAll = this.referenteServizioRepo.findAll(spec);
		if(findAll.size() == 0) {
			throw new NotFoundException("Referente ["+idUtente+"] non trovato per servizio ["+idServizio+"] "+((tipo != null) ? "e tipo ["+tipo+"]" : ""));
		}
		
		return findAll;
	}

	public void deleteReferenteServizio(ReferenteServizioEntity entity) {
		entity.getServizio().getReferenti().remove(entity);
		this.referenteServizioRepo.delete(entity);
	}

	public void save(ReferenteServizioEntity referenteEntity) {
		this.referenteServizioRepo.save(referenteEntity);
	}

	public TagEntity getTag(String tag) {
		TagSpecification spec = new TagSpecification();
		spec.setTag(Optional.of(tag));
		return this.tagRepo.findOne(spec).orElseGet(() -> {
			TagEntity tagg = new TagEntity();
			tagg.setTag(tag);
			return tagg;
		});
	}
	
	public Page<MessaggioServizioEntity> findAllMessaggiServizio(Specification<MessaggioServizioEntity> spec, Pageable p) {
		return this.messaggioServizioRepo.findAll(spec, p);
	}
	
	public Optional<MessaggioServizioEntity> findMessaggioServizio(UUID idServizio, UUID idMessaggio) {
		MessaggioServizioSpecification spec = new MessaggioServizioSpecification();
		spec.setIdServizio(Optional.of(idServizio));
		spec.setUuid(Optional.of(idMessaggio));
		return this.messaggioServizioRepo.findOne(spec);
	}
	
	public void save(MessaggioServizioEntity entity) {
		this.messaggioServizioRepo.save(entity);
	}

	public void delete(MessaggioServizioEntity entity) {
		this.messaggioServizioRepo.delete(entity);
	}

	public Page<AllegatoServizioEntity> findAllAllegatiServizio(Specification<AllegatoServizioEntity> spec, Pageable p) {
		return this.allegatoServizioRepo.findAll(spec, p);
	}
	
	public Optional<AllegatoServizioEntity> findAllegatoServizio(UUID idServizio, UUID idAllegato) {
		AllegatoServizioSpecification spec = new AllegatoServizioSpecification();
		spec.setIdServizio(Optional.of(idServizio));
		spec.setUuid(Optional.of(idAllegato));
		return this.allegatoServizioRepo.findOne(spec);
	}
	
	public void save(AllegatoServizioEntity entity) {
		this.allegatoServizioRepo.save(entity);
	}

	public void delete(AllegatoServizioEntity entity) {
		this.allegatoServizioRepo.delete(entity);
	}
	
	public List<String> getServiziByReferente(UtenteEntity u) {
		return this.servizioRepo.getServiziByReferente(u.getId(), TIPO_REFERENTE.REFERENTE);
	}

	public List<String> getServiziByReferenteTecnico(UtenteEntity u) {
		return this.servizioRepo.getServiziByReferente(u.getId(), TIPO_REFERENTE.REFERENTE_TECNICO);
	}

	public List<String> getServiziByReferenteDominio(UtenteEntity u) {
		return this.servizioRepo.getServiziByReferenteDominio(u.getId(), TIPO_REFERENTE.REFERENTE);
	}

	public List<String> getServiziByReferenteTecnicoDominio(UtenteEntity u) {
		return this.servizioRepo.getServiziByReferenteDominio(u.getId(), TIPO_REFERENTE.REFERENTE_TECNICO);
	}

	public List<String> getServiziByRichiedente(UtenteEntity u) {
		return this.servizioRepo.getServiziByRichiedente(u.getId());
	}

	public boolean isEliminabile(ServizioEntity servizio) {
	    boolean haAdesioni = adesioneRepo.existsByServizio_Id(servizio.getId());
	    boolean haApi = apiRepo.existsByServizi_Id(servizio.getId());
	    boolean haPackageSubServizi = servizio.is_package() && packageServizioRepo.existsByPackageId(servizio.getId());

	    return !(haAdesioni || haApi || haPackageSubServizi);
	}

	
}
