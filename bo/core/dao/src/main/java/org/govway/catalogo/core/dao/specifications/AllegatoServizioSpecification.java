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
package org.govway.catalogo.core.dao.specifications;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.AllegatoServizioEntity;
import org.govway.catalogo.core.orm.entity.AllegatoServizioEntity.TIPOLOGIA;
import org.govway.catalogo.core.orm.entity.AllegatoServizioEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.AllegatoServizioEntity_;
import org.govway.catalogo.core.orm.entity.DocumentoEntity_;
import org.govway.catalogo.core.orm.entity.ServizioEntity_;
import org.springframework.data.jpa.domain.Specification;

public class AllegatoServizioSpecification implements Specification<AllegatoServizioEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<UUID> uuid= Optional.empty();
	private Optional<String> q= Optional.empty();
	private Optional<String> filename= Optional.empty();
	private Optional<UUID> idServizio= Optional.empty();
	private Optional<TIPOLOGIA> tipologia = Optional.empty();
	private List<VISIBILITA> visibilita = null;
	

	@Override
	public Predicate toPredicate(Root<AllegatoServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<AllegatoServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		if(uuid.isPresent()) {
			predLst.add(cb.equal(root.get(AllegatoServizioEntity_.documento).get(DocumentoEntity_.uuid), uuid.get().toString())); 
		}
		
		if(filename.isPresent()) {
			predLst.add(cb.equal(root.get(AllegatoServizioEntity_.documento).get(DocumentoEntity_.filename), filename.get())); 
		}
		
		if(idServizio.isPresent()) {
			predLst.add(cb.equal(root.get(AllegatoServizioEntity_.servizio).get(ServizioEntity_.idServizio), idServizio.get().toString())); 
		}
		
		if(tipologia.isPresent()) {
			predLst.add(cb.equal(root.get(AllegatoServizioEntity_.tipologia), tipologia.get())); 
		}
		
		if(visibilita != null) {
			if(!visibilita.isEmpty()) {
				ArrayList<Predicate> preds2 = new ArrayList<>();
				
				for(VISIBILITA vis: visibilita) {
					preds2.add(cb.equal(root.get(AllegatoServizioEntity_.visibilita), vis));
				}
				
				predLst.add(cb.or(preds2.toArray(new Predicate[]{})));
			} else {
				predLst.add(cb.disjunction());
			}
		}

		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			String pattern = "%" + q.get().toUpperCase() + "%";
			predLstQ.add(cb.like(cb.upper(root.get(AllegatoServizioEntity_.documento).get(DocumentoEntity_.filename)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.get(AllegatoServizioEntity_.documento).get(DocumentoEntity_.descrizione)), pattern));
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}

		
		return predLst;
	}

	public Optional<UUID> getUuid() {
		return uuid;
	}

	public void setUuid(Optional<UUID> uuid) {
		this.uuid = uuid;
	}

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

	public Optional<UUID> getIdServizio() {
		return idServizio;
	}

	public void setIdServizio(Optional<UUID> idServizio) {
		this.idServizio = idServizio;
	}

	public Optional<TIPOLOGIA> getTipologia() {
		return tipologia;
	}

	public void setTipologia(Optional<TIPOLOGIA> tipologia) {
		this.tipologia = tipologia;
	}

	public List<VISIBILITA> getVisibilita() {
		return visibilita;
	}

	public void setVisibilita(List<VISIBILITA> visibilita) {
		this.visibilita = visibilita;
	}

	public Optional<String> getFilename() {
		return filename;
	}

	public void setFilename(Optional<String> filename) {
		this.filename = filename;
	}

}
