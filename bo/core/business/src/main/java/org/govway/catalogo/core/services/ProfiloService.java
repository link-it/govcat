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

import org.govway.catalogo.core.dao.specifications.DominioProfiloSpecification;
import org.govway.catalogo.core.dao.specifications.ProfiloSpecification;
import org.govway.catalogo.core.dao.specifications.SoggettoProfiloSpecification;
import org.govway.catalogo.core.orm.entity.DominioProfiloEntity;
import org.govway.catalogo.core.orm.entity.ProfiloEntity;
import org.govway.catalogo.core.orm.entity.SoggettoProfiloEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class ProfiloService extends AbstractService  {

    public void save(ProfiloEntity profilo) {
        this.profiloRepo.save(profilo);
    }

    public void save(DominioProfiloEntity dominioProfilo) {
        this.dominioProfiloRepo.save(dominioProfilo);
    }

    public void save(SoggettoProfiloEntity soggettoProfilo) {
        this.soggettoProfiloRepo.save(soggettoProfilo);
    }

    public Page<ProfiloEntity> findAll(Specification<ProfiloEntity> spec, Pageable p) {
        return this.profiloRepo.findAll(spec, p);
    }

    public long count(Specification<ProfiloEntity> spec) {
        return this.profiloRepo.count(spec);
    }

    public void delete(ProfiloEntity entity) {
        this.profiloRepo.delete(entity);
    }

    public Optional<DominioProfiloEntity> findDominioProfilo(UUID idProfilo, UUID idDominio) {
        DominioProfiloSpecification dominioProfiloSpecification = new DominioProfiloSpecification();
        dominioProfiloSpecification.setIdProfilo(Optional.ofNullable(idProfilo));
        dominioProfiloSpecification.setIdDominio(Optional.ofNullable(idDominio.toString()));
        return this.dominioProfiloRepo.findOne(dominioProfiloSpecification);
    }

    public Page<DominioProfiloEntity> findAllDominiProfilo(DominioProfiloSpecification dominioProfiloSpecification, Pageable pageable) {
        return this.dominioProfiloRepo.findAll(dominioProfiloSpecification, pageable);
    }

    public void delete(DominioProfiloEntity dominioProfiloEntity) {
        this.dominioProfiloRepo.delete(dominioProfiloEntity);
    }

    public Optional<SoggettoProfiloEntity> findSoggettoProfilo(UUID idProfilo, UUID idSoggetto) {
        SoggettoProfiloSpecification soggettoProfiloSpecification = new SoggettoProfiloSpecification();
        soggettoProfiloSpecification.setIdProfilo(Optional.ofNullable(idProfilo));
        soggettoProfiloSpecification.setIdSoggetto(Optional.ofNullable(idSoggetto.toString()));
        return this.soggettoProfiloRepo.findOne(soggettoProfiloSpecification);
    }

    public Page<SoggettoProfiloEntity> findAllSoggettiProfilo(SoggettoProfiloSpecification soggettoProfiloSpecification, Pageable pageable) {
        return this.soggettoProfiloRepo.findAll(soggettoProfiloSpecification, pageable);
    }

    public void delete(SoggettoProfiloEntity soggettoProfiloEntity) {
        this.soggettoProfiloRepo.delete(soggettoProfiloEntity);
    }

    private Specification<ProfiloEntity> filterByKey(UUID key) {
        ProfiloSpecification profiloSpecification = new ProfiloSpecification();
        profiloSpecification.setIdProfilo(Optional.of(key));
        return profiloSpecification;
    }

    public Optional<ProfiloEntity> find(UUID key) {
        return this.profiloRepo.findOne(filterByKey(key));
    }

    public boolean exists(UUID key) {
        return this.find(key).isPresent();
    }

    private Specification<ProfiloEntity> filterByCodiceInterno(String codiceInterno) {
        ProfiloSpecification profiloSpecification = new ProfiloSpecification();
        profiloSpecification.setCodiceInterno(Optional.of(codiceInterno));
        return profiloSpecification;
    }

    public Optional<ProfiloEntity> findByCodiceInterno(String codiceInterno) {
        return this.profiloRepo.findOne(filterByCodiceInterno(codiceInterno));
    }

    public boolean existsByCodiceInterno(String codiceInterno) {
        return this.findByCodiceInterno(codiceInterno).isPresent();
    }
}
