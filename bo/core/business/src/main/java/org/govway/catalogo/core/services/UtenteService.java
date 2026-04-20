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

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.govway.catalogo.core.dao.specifications.AdesioneSpecification;
import org.govway.catalogo.core.dao.specifications.DominioSpecification;
import org.govway.catalogo.core.dao.specifications.ServizioSpecification;
import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteOrganizzazioneEntity;
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
		
		String nomecognome = utente.getNome() + " " + utente.getCognome();	
		if(sizeadesioni > 0) {
			return "Utente ["+nomecognome+"] referente di ["+sizeadesioni+"] adesioni";
		}
		
		ServizioSpecification specS = new ServizioSpecification();
		specS.setIdReferente(Optional.of(utente.getIdUtente()));
		long sizeservizi = this.servizioRepo.count(specS);
		
		if(sizeservizi > 0) {
			return "Utente ["+nomecognome+"] referente di ["+sizeservizi+"] servizi";
		}
		
		DominioSpecification specD = new DominioSpecification();
		specD.setIdReferente(Optional.of(utente.getIdUtente()));
		long sizedomini = this.dominioRepo.count(specD);
		
		if(sizedomini > 0) {
			return "Utente ["+nomecognome+"] referente di ["+sizedomini+"] domini";
		}
		
		return null;
	}

	public boolean exists(UUID key) {
		return this.find(key).isPresent();
	}

	public Optional<UtenteEntity> find(UUID key) {
		return this.utenteRepo.findOne(filterByKey(key));
	}

	public Optional<UtenteEntity> findByPrincipal(String principal) {

		UtenteSpecification utenteFilter = new UtenteSpecification();
		utenteFilter.setPrincipal(Optional.of(principal));
		
		return this.utenteRepo.findOne(utenteFilter);
	}

	public void save(UtenteEntity utente) {
		this.utenteRepo.save(utente);
	}

	public void saveAndFlush(UtenteEntity utente) {
		this.utenteRepo.saveAndFlush(utente);
	}

	public boolean existsByKey(UUID idUtente) {
		return this.utenteRepo.findOne(filterByKey(idUtente)).isPresent();
	}

	public boolean existsByPrincipal(String principal) {

		UtenteSpecification utenteFilter = new UtenteSpecification();
		utenteFilter.setPrincipal(Optional.of(principal));
		
		return this.utenteRepo.count(utenteFilter) > 0;
	}

	private Specification<UtenteEntity> filterByKey(UUID key) {
		UtenteSpecification utenteFilter = new UtenteSpecification();
		utenteFilter.setIdUtente(Optional.of(key.toString()));
		return utenteFilter;
	}

	public Set<String> getRuoliReferente(UtenteEntity utente) {
		Set<String> ruoli = new HashSet<>();

		// Cerca referenti dominio
		for (var ref : this.referenteDominioRepo.findByReferente(utente)) {
			if (ref.getTipo() == TIPO_REFERENTE.REFERENTE) {
				ruoli.add("REFERENTE_DOMINIO");
			} else if (ref.getTipo() == TIPO_REFERENTE.REFERENTE_TECNICO) {
				ruoli.add("REFERENTE_TECNICO_DOMINIO");
			}
		}

		// Cerca referenti servizio
		for (var ref : this.referenteServizioRepo.findByReferente(utente)) {
			if (ref.getTipo() == TIPO_REFERENTE.REFERENTE) {
				ruoli.add("REFERENTE_SERVIZIO");
			} else if (ref.getTipo() == TIPO_REFERENTE.REFERENTE_TECNICO) {
				ruoli.add("REFERENTE_TECNICO_SERVIZIO");
			}
		}

		// Cerca referenti adesione
		for (var ref : this.referenteAdesioneRepo.findByReferente(utente)) {
			if (ref.getTipo() == TIPO_REFERENTE.REFERENTE) {
				ruoli.add("REFERENTE_ADESIONE");
			} else if (ref.getTipo() == TIPO_REFERENTE.REFERENTE_TECNICO) {
				ruoli.add("REFERENTE_TECNICO_ADESIONE");
			}
		}

		// Cerca richiedente servizio
		if (!this.servizioRepo.getServiziByRichiedente(utente.getId()).isEmpty()) {
			ruoli.add("RICHIEDENTE_SERVIZIO");
		}

		// Cerca richiedente adesione
		if (!this.adesioneRepo.getAdesioniByRichiedente(utente.getId()).isEmpty()) {
			ruoli.add("RICHIEDENTE_ADESIONE");
		}

		return ruoli;
	}

	/**
	 * Restituisce la lista delle associazioni utente-organizzazione per l'utente indicato.
	 * Utile per accedere alle associazioni senza incorrere in LazyInitializationException
	 * quando l'entità utente è detached dalla session Hibernate.
	 */
	public List<UtenteOrganizzazioneEntity> findUtenteOrganizzazioniByUtente(UtenteEntity utente) {
		return this.utenteOrganizzazioneRepo.findByUtente(utente);
	}

	/**
	 * Cerca l'associazione utente-organizzazione per la coppia indicata.
	 *
	 * @return Optional con l'associazione se presente, empty se l'utente non appartiene all'organizzazione
	 */
	public Optional<UtenteOrganizzazioneEntity> findUtenteOrganizzazione(UtenteEntity utente, OrganizzazioneEntity organizzazione) {
		if (utente == null || organizzazione == null) {
			return Optional.empty();
		}
		return this.utenteOrganizzazioneRepo.findByUtente(utente).stream()
				.filter(assoc -> assoc.getOrganizzazione() != null
						&& assoc.getOrganizzazione().getId().equals(organizzazione.getId()))
				.findFirst();
	}

	/**
	 * Verifica se l'utente è associato all'organizzazione indicata.
	 * Non considera il ruolo: restituisce true anche se il ruolo è null (nessun ruolo / sola lettura).
	 *
	 * Include fallback sulla vecchia FK singola id_organizzazione per retrocompatibilità durante
	 * la transizione al modello multi-organizzazione.
	 * TODO [MULTI-ORG] Rimuovere il fallback sulla FK singola quando tutti i flussi
	 * di creazione/modifica utente popoleranno la nuova tabella utenti_organizzazioni.
	 */
	public boolean isAssociatoA(UtenteEntity utente, OrganizzazioneEntity organizzazione) {
		if (utente == null || organizzazione == null) {
			return false;
		}
		if (findUtenteOrganizzazione(utente, organizzazione).isPresent()) {
			return true;
		}
		// Fallback sulla FK singola per retrocompatibilità
		return utente.getOrganizzazione() != null
				&& utente.getOrganizzazione().getId().equals(organizzazione.getId());
	}

	/**
	 * Verifica se l'utente ha uno dei ruoli specificati nell'organizzazione indicata.
	 * Restituisce false se non c'è associazione o se il ruolo dell'associazione è null.
	 */
	public boolean hasRuoloInOrganizzazione(UtenteEntity utente, OrganizzazioneEntity organizzazione, RuoloOrganizzazione... ruoli) {
		Optional<UtenteOrganizzazioneEntity> assoc = findUtenteOrganizzazione(utente, organizzazione);
		if (assoc.isEmpty() || assoc.get().getRuoloOrganizzazione() == null) {
			return false;
		}
		RuoloOrganizzazione ruoloUtente = assoc.get().getRuoloOrganizzazione();
		for (RuoloOrganizzazione r : ruoli) {
			if (ruoloUtente == r) {
				return true;
			}
		}
		return false;
	}

}
