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
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.AdesioneEntity_;
import org.govway.catalogo.core.orm.entity.ApiEntity_;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity_;
import org.govway.catalogo.core.orm.entity.CategoriaEntity_;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity_;
import org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.DominioEntity_;
import org.govway.catalogo.core.orm.entity.GruppoEntity_;
import org.govway.catalogo.core.orm.entity.PackageServizioEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteServizioEntity_;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity_;
import org.govway.catalogo.core.orm.entity.TagEntity_;
import org.govway.catalogo.core.orm.entity.TipoServizio;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity_;
import org.springframework.data.jpa.domain.Specification;

public class ServizioSpecification implements Specification<ServizioEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> q = Optional.empty();
	private List<UUID> idServizi = null;
	private Optional<UUID> idPackage = Optional.empty();
	private Optional<Boolean> _package = Optional.empty();
	private Optional<String> nome = Optional.empty();
	private Optional<String> versione = Optional.empty();
	private Optional<String> idReferente = Optional.empty();
	private List<UUID> gruppoList = null;
	private Optional<Long> idGruppo = Optional.empty();
	private Optional<UUID> dominio = Optional.empty();
	private List<UUID> categorie = null;
	private Optional<VISIBILITA> visibilita = Optional.empty();
	private Optional<TipoServizio> tipo = Optional.empty();
	private Optional<UUID> idApi = Optional.empty();
	private Optional<UtenteEntity> utente = Optional.empty();
	private Optional<Boolean> utenteAdmin = Optional.empty();
	private Optional<Boolean> aderibili = Optional.empty();
	private List<String> stati = null;
	private List<String> statiAderibili = new ArrayList<>();
	private List<String> tag = null;
	private List<String> profilo = null;
	private Set<ClasseUtenteEntity> classi = null;
	private Set<ClasseUtenteEntity> classiDominio = null;
	
	public enum TipoMieiServizi {TUTTI,MIEI_SERVIZI}
	private TipoMieiServizi tipoMieiServizi = TipoMieiServizi.TUTTI;

	@Override
	public Predicate toPredicate(Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		query.distinct(true); 

		if(idReferente.isPresent()) {
			Path<String> joinedReferentIds = root.join(ServizioEntity_.referenti).join(ReferenteServizioEntity_.referente).get(UtenteEntity_.idUtente);
			predLst.add(cb.literal(idReferente.get()).in(joinedReferentIds));
		}

		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			String pattern = "%" + q.get().toUpperCase() + "%";
			predLstQ.add(cb.like(cb.upper(root.get(ServizioEntity_.nome)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.get(ServizioEntity_.descrizione)), pattern));
			predLstQ.add(cb.like(cb.upper(root.get(ServizioEntity_.descrizioneSintetica)), pattern));
			predLstQ.add(cb.like(cb.upper(root.get(ServizioEntity_.terminiRicerca)), pattern));
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		
		if (nome.isPresent()) {
			predLst.add(cb.equal(root.get(ServizioEntity_.nome), nome.get())); 
		}
		

		if(idServizi != null) {
			if(!idServizi.isEmpty()) {
				ArrayList<Predicate> preds2 = new ArrayList<>();
				
				for(UUID idServizio: idServizi) {
					preds2.add(cb.equal(root.get(ServizioEntity_.idServizio), idServizio.toString()));				
				}
				
				predLst.add(cb.or(preds2.toArray(new Predicate[]{})));
			} else {
				predLst.add(cb.disjunction());
			}
		}

		if (versione.isPresent()) {
			predLst.add(cb.equal(root.get(ServizioEntity_.versione), versione.get().toString()));
		}
		
		if (idPackage.isPresent()) {
			predLst.add(cb.equal(root.join(ServizioEntity_.packages).join(PackageServizioEntity_._package).get(ServizioEntity_.idServizio), idPackage.get().toString()));
		}
		
		if (_package.isPresent()) {
			predLst.add(cb.equal(root.get(ServizioEntity_._package), _package.get()));
		}
		if (visibilita.isPresent()) {
			predLst.add(getVisibilitaFilter(visibilita.get(), root, cb));
		}
		
		if (tipo.isPresent()) {
			predLst.add(cb.equal(root.get(ServizioEntity_.tipo), tipo.get()));
		}
		
		if (idApi.isPresent()) {
			Path<String> joinedComponentId = root.join(ServizioEntity_.api).get(ApiEntity_.idApi);
			predLst.add(joinedComponentId.in(idApi.get().toString()));
		}
		
		if(gruppoList != null) {
			if(!gruppoList.isEmpty()) {
				ArrayList<Predicate> preds2 = new ArrayList<>();
				
				for(UUID gruppo: gruppoList) {
					preds2.add(cb.equal(root.join(ServizioEntity_.gruppi, JoinType.LEFT).get(GruppoEntity_.idGruppo), gruppo.toString()));
				}
				
				predLst.add(cb.or(preds2.toArray(new Predicate[]{})));
			} else {
				predLst.add(cb.disjunction());
			}
		}
		
		if(idGruppo.isPresent()) {
			ArrayList<Predicate> preds2 = new ArrayList<>();
			
			preds2.add(cb.like(root.join(ServizioEntity_.gruppi, JoinType.LEFT).get(GruppoEntity_.alberatura), "%#"+idGruppo.get()+"#%"));
			preds2.add(cb.equal(root.join(ServizioEntity_.gruppi, JoinType.LEFT).get(GruppoEntity_.id), idGruppo.get()));
			
			predLst.add(cb.or(preds2.toArray(new Predicate[]{})));
			
		}

		if(categorie != null) {
			if(!categorie.isEmpty()) {
				ArrayList<Predicate> preds2 = new ArrayList<>();
				
				for(UUID categoria: categorie) {
					preds2.add(cb.equal(root.join(ServizioEntity_.categorie, JoinType.LEFT).get(CategoriaEntity_.idCategoria), categoria.toString()));				
				}
				
				predLst.add(cb.or(preds2.toArray(new Predicate[]{})));
			} else {
				predLst.add(cb.disjunction());
			}
		}
		
		if(dominio.isPresent()) {
			predLst.add(cb.equal(root.get(ServizioEntity_.dominio).get(DominioEntity_.idDominio), dominio.get().toString()));
		}
		
		if(stati != null) {
			if(!stati.isEmpty()) {
				ArrayList<Predicate> preds2 = new ArrayList<>();
				
				for(String stato: stati) {
					preds2.add(cb.equal(root.get(ServizioEntity_.stato), stato));
				}
				
				predLst.add(cb.or(preds2.toArray(new Predicate[]{})));
			} else {
				predLst.add(cb.disjunction());
			}
		}
		
		if(aderibili.isPresent()) {

			ArrayList<Predicate> preds2 = new ArrayList<>();
			
			for(String stato: getStatiAderibili()) {
				if(aderibili.get()) {
					preds2.add(cb.equal(root.get(ServizioEntity_.stato), stato));
				} else {
					preds2.add(cb.notEqual(root.get(ServizioEntity_.stato), stato));
				}
			}
			
			predLst.add(cb.or(preds2.toArray(new Predicate[]{})));
			predLst.add(cb.equal(root.get(ServizioEntity_.adesioneDisabilitata), false));
		}
		
		if(tag != null && !tag.isEmpty()) {

			ArrayList<Predicate> preds2 = new ArrayList<>();

			for(String t: tag) {
				preds2.add(cb.literal(t).in(root.join(ServizioEntity_.tags, JoinType.LEFT).get(TagEntity_.tag)));
			}

			predLst.add(cb.and(preds2.toArray(new Predicate[]{})));

		}

		if(profilo != null && !profilo.isEmpty()) {

			ArrayList<Predicate> preds2 = new ArrayList<>();

			for(String p: profilo) {
				preds2.add(cb.literal(p).in(root.join(ServizioEntity_.api, JoinType.LEFT).join(ApiEntity_.authType, JoinType.LEFT).get(AuthTypeEntity_.profilo)));
			}

			predLst.add(cb.or(preds2.toArray(new Predicate[]{})));

		}

		if(classi != null) {
			if(!classi.isEmpty()) {
				predLst.add(root.join(ServizioEntity_.classi, JoinType.LEFT).in(classi));
			} else {
				predLst.add(cb.disjunction());
			}
		}
		
		if(classiDominio != null) {
			if(!classiDominio.isEmpty()) {
				predLst.add(root.join(ServizioEntity_.dominio).join(DominioEntity_.classi, JoinType.LEFT).in(classiDominio));
			} else {
				predLst.add(cb.disjunction());
			}
		}
		
		if(this.utente.isPresent()) {

			UtenteEntity utente = this.utente.get();

			List<Predicate> predListMieiServizi = new ArrayList<>();
			if(utente.getId() != null) {
				predListMieiServizi.add(cb.equal(root.join(ServizioEntity_.referenti, JoinType.LEFT).get(ReferenteServizioEntity_.referente).get(UtenteEntity_.id), utente.getId()));
				predListMieiServizi.add(cb.equal(root.join(ServizioEntity_.dominio, JoinType.LEFT).join(DominioEntity_.referenti, JoinType.LEFT).get(ReferenteDominioEntity_.referente).get(UtenteEntity_.id), utente.getId()));
				predListMieiServizi.add(cb.equal(root.join(ServizioEntity_.classi, JoinType.LEFT).join(ClasseUtenteEntity_.utentiAssociati, JoinType.LEFT).get(UtenteEntity_.id), utente.getId()));
				predListMieiServizi.add(cb.equal(root.join(ServizioEntity_.dominio, JoinType.LEFT).join(DominioEntity_.classi, JoinType.LEFT).join(ClasseUtenteEntity_.utentiAssociati, JoinType.LEFT).get(UtenteEntity_.id), utente.getId()));
				predListMieiServizi.add(cb.equal(root.get(ServizioEntity_.richiedente).get(UtenteEntity_.id), utente.getId()));
				predListMieiServizi.add(cb.literal(utente.getId()).in(root.join(ServizioEntity_.adesioni, JoinType.LEFT).join(AdesioneEntity_.referenti, JoinType.LEFT).join(ReferenteAdesioneEntity_.referente, JoinType.LEFT).get(UtenteEntity_.id)));
				predListMieiServizi.add(cb.literal(utente.getId()).in(root.join(ServizioEntity_.adesioni, JoinType.LEFT).get(AdesioneEntity_.richiedente).get(UtenteEntity_.id)));
			}
			

			List<Predicate> predLstUtente = new ArrayList<>();
			if(this.tipoMieiServizi.equals(TipoMieiServizi.TUTTI)) {

				List<Predicate> predLstPubblico = new ArrayList<>();
				ArrayList<Predicate> predsStati = new ArrayList<>();
				
				for(String stato: getStatiAderibili()) {
					predsStati.add(cb.equal(root.get(ServizioEntity_.stato), stato));
				}
				
				predLstPubblico.add(getVisibilitaFilter(VISIBILITA.PUBBLICO, root, cb));
				predLstPubblico.add(cb.or(predsStati.toArray(new Predicate[]{})));
				predLstUtente.add(cb.and(predLstPubblico.toArray(new Predicate[]{})));

			}
			

			if(!predListMieiServizi.isEmpty()) {
				predLstUtente.add(cb.or(predListMieiServizi.toArray(new Predicate[]{})));
			}

			predLst.add(cb.or(predLstUtente.toArray(new Predicate[] {})));

			Predicate visibilitaNonComponente = cb.not(cb.equal(root.get(ServizioEntity_.visibilita), VISIBILITA.COMPONENTE)); 
			Predicate visibilitaNull = cb.isNull(root.get(ServizioEntity_.visibilita)); 
			
			predLst.add(cb.or(visibilitaNull, visibilitaNonComponente));

		}

		if(this.utenteAdmin.isPresent() && !this.utenteAdmin.get()) {
			predLst.add(cb.notEqual(root.get(ServizioEntity_.stato), "archiviato"));
		}
		
		return predLst;
	}
	
	private Predicate getVisibilitaFilter(VISIBILITA visibilita, Root<ServizioEntity> root, CriteriaBuilder cb) {
		Predicate statoServizio = cb.equal(root.get(ServizioEntity_.visibilita), visibilita); 
		Predicate statoNull = cb.isNull(root.get(ServizioEntity_.visibilita)); 
		Predicate statoDominio = cb.equal(root.join(ServizioEntity_.dominio).get(DominioEntity_.visibilita), visibilita);
		return cb.or(statoServizio, cb.and(statoNull, statoDominio));
	}
	
	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

	public Optional<String> getNome() {
		return nome;
	}

	public void setNome(Optional<String> nome) {
		this.nome = nome;
	}


	public Optional<String> getVersione() {
		return versione;
	}

	public void setVersione(Optional<String> versione) {
		this.versione = versione;
	}

	public Optional<UUID> getDominio() {
		return dominio;
	}

	public void setDominio(Optional<UUID> dominio) {
		this.dominio = dominio;
	}

	public Optional<VISIBILITA> getVisibilita() {
		return visibilita;
	}

	public void setVisibilita(Optional<VISIBILITA> visibilita) {
		this.visibilita = visibilita;
	}

	public List<String> getStati() {
		return stati;
	}

	public void setStati(List<String> stati) {
		this.stati = stati;
	}

	public List<String> getTag() {
		return tag;
	}

	public void setTag(List<String> tag) {
		this.tag = tag;
	}

	public List<String> getProfilo() {
		return profilo;
	}

	public void setProfilo(List<String> profilo) {
		this.profilo = profilo;
	}

	public Set<ClasseUtenteEntity> getClassi() {
		return classi;
	}

	public void setClassi(Set<ClasseUtenteEntity> classi) {
		this.classi = classi;
	}

	public Set<ClasseUtenteEntity> getClassiDominio() {
		return classiDominio;
	}

	public void setClassiDominio(Set<ClasseUtenteEntity> classiDominio) {
		this.classiDominio = classiDominio;
	}

	public Optional<String> getIdReferente() {
		return idReferente;
	}

	public void setIdReferente(Optional<String> idReferente) {
		this.idReferente = idReferente;
	}

	public Optional<UUID> getIdApi() {
		return idApi;
	}

	public void setIdApi(Optional<UUID> idApi) {
		this.idApi = idApi;
	}

	public Optional<UtenteEntity> getUtente() {
		return utente;
	}

	public void setUtente(Optional<UtenteEntity> utente) {
		this.utente = utente;
	}

	public Optional<Boolean> getAderibili() {
		return aderibili;
	}

	public void setAderibili(Optional<Boolean> aderibili) {
		this.aderibili = aderibili;
	}

	public List<String> getStatiAderibili() {
		return statiAderibili;
	}

	public void setStatiAderibili(List<String> statiAderibili) {
		this.statiAderibili = statiAderibili;
	}

	public TipoMieiServizi getTipoMieiServizi() {
		return tipoMieiServizi;
	}

	public void setTipoMieiServizi(TipoMieiServizi tipoMieiServizi) {
		this.tipoMieiServizi = tipoMieiServizi;
	}

	public List<UUID> getCategorie() {
		return categorie;
	}

	public void setCategorie(List<UUID> categorie) {
		this.categorie = categorie;
	}

	public List<UUID> getIdServizi() {
		return idServizi;
	}

	public void setIdServizi(List<UUID> idServizi) {
		this.idServizi = idServizi;
	}

	public List<UUID> getGruppoList() {
		return gruppoList;
	}

	public void setGruppoList(List<UUID> gruppoList) {
		this.gruppoList = gruppoList;
	}

	public Optional<UUID> getIdPackage() {
		return idPackage;
	}

	public void setIdPackage(Optional<UUID> idPackage) {
		this.idPackage = idPackage;
	}

	public Optional<Boolean> get_package() {
		return _package;
	}

	public void set_package(Optional<Boolean> _package) {
		this._package = _package;
	}
	
	public Optional<TipoServizio> getTipo() {
		return tipo;
	}

	public void setTipo(Optional<TipoServizio> tipo) {
		this.tipo = tipo;
	}

	public Optional<Boolean> getUtenteAdmin() {
		return utenteAdmin;
	}

	public void setUtenteAdmin(Optional<Boolean> utenteAdmin) {
		this.utenteAdmin = utenteAdmin;
	}

	public Optional<Long> getIdGruppo() {
		return idGruppo;
	}

	public void setIdGruppo(Optional<Long> idGruppo) {
		this.idGruppo = idGruppo;
	}

}
