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
import java.util.stream.Collectors;

import org.govway.catalogo.core.dao.specifications.OrganizzazioneSpecification;
import org.govway.catalogo.core.exceptions.NotFoundException;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteOrganizzazioneEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class OrganizzazioneService extends AbstractService {

	private Logger logger = LoggerFactory.getLogger(OrganizzazioneService.class);

	public Page<OrganizzazioneEntity> findAll(Specification<OrganizzazioneEntity> spec, Pageable p) {
		return this.orgRepo.findAll(spec, p);
	}

	public void delete(OrganizzazioneEntity organization) {
		this.orgRepo.delete(organization);
	}

	public boolean exists(UUID key) {
		return this.find(key).isPresent();
	}

	public Optional<OrganizzazioneEntity> find(UUID key) {
		return this.orgRepo.findOne(filterByKey(key));
	}

	/**
	 * Trova un'organizzazione tramite il suo ID interno (PK).
	 */
	public Optional<OrganizzazioneEntity> findById(Long id) {
		return this.orgRepo.findById(id);
	}

	public Optional<OrganizzazioneEntity> findByNome(String key) {
		return this.orgRepo.findOne(filterByNome(key));
	}

	public void save(OrganizzazioneEntity organization) {
		if(organization.isAderente() || organization.isReferente()) {

			this.logger.debug("Organizzazione aderente["+organization.isAderente()+"] referente["+organization.isReferente()+"]");

			String customCamelCase = customCamelCase(organization.getNome(), true);

			SoggettoEntity sogg = organization.getSoggetti()
					.stream()
					.findAny().orElseGet(() -> {
						SoggettoEntity so = new SoggettoEntity();
						so.setIdSoggetto(UUID.randomUUID().toString());
						so.setNome(customCamelCase);
						so.setOrganizzazione(organization);
						
						so.setAderente(organization.isAderente());
						so.setReferente(organization.isReferente());

						so.setDescrizione(organization.getDescrizione());
						this.logger.debug("Creo Soggetto nome["+so.getNome()+"] id_soggetto["+so.getIdSoggetto()+"]");

						this.soggettoRepo.save(so);
						organization.getSoggetti().add(so);
						return so;
					});

			sogg.setAderente(organization.isAderente());
			sogg.setReferente(organization.isReferente());

			sogg.setDescrizione(organization.getDescrizione());
			
			if(organization.isAderente() && organization.getSoggettoDefault() == null) {
				List<SoggettoEntity> soggRef = organization.getSoggetti().stream().filter(s -> s.isAderente()).collect(Collectors.toList());
				
				if(soggRef.size() == 1) {
					organization.setSoggettoDefault(soggRef.get(0));
				} else {
					throw new NotFoundException("Impossibile aggiornare l'organizzazione: impostare il soggetto di default");
				}
			}

		}

		this.orgRepo.save(organization);
		this.logger.debug("Soggetti associati alla organizzazione ["+organization.getSoggetti().size()+"]");
		for(SoggettoEntity sogg: organization.getSoggetti()) {
			this.logger.debug("Salvo Soggetto nome["+sogg.getNome()+"] id_soggetto["+sogg.getIdSoggetto()+"]");
			this.soggettoRepo.save(sogg);
		}
	}

	public static String customCamelCase(String v, boolean upperFirstChar) {

		if(v==null || v.isEmpty()) {
			return v;
		}

		// camel case

		String[] words = v.split("[^A-Za-z0-9-]+");

		if(words==null || words.length<=0) {
			return normalize(v);
		}

		StringBuilder builder = new StringBuilder();
		for (int i = 0; i < words.length; i++) {
			String word = words[i];
			if(word==null || word.isEmpty()) {
				continue;
			}
			if (i > 0 || upperFirstChar) {
				if(word.length()>1) {
					word = Character.toUpperCase(word.charAt(0)) + word.substring(1);
				}
				else {
					word = Character.toUpperCase(word.charAt(0)) + "";
				}
			}
			builder.append(word);
		}
		return normalize(builder.toString());
	}
	private static String normalize(String v) {

		if(v==null || v.isEmpty()) {
			return v;
		}

		// sostituisco caratteri
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < v.length(); i++) {
			char c = v.charAt(i);
			if(!Character.isDigit(c) && !Character.isAlphabetic(c)) {
				sb.append("-");
			}
			else {
				sb.append(c);
			}
		}
		v = sb.toString();

		// elimino doppi --
		while(v.contains("--")) {
			v = v.replace("--", "-");
		}
		return v;
	}

	public boolean existsByNome(OrganizzazioneEntity organization) {
		return this.orgRepo.findOne(filterByNome(organization)).isPresent();
	}

	private Specification<OrganizzazioneEntity> filterByKey(UUID key) {
		OrganizzazioneSpecification organizationFilter = new OrganizzazioneSpecification();
		organizationFilter.setIdOrganizzazione(Optional.of(key));
		return organizationFilter;
	}

	private Specification<OrganizzazioneEntity> filterByNome(OrganizzazioneEntity organization) {
		return filterByNome(organization.getNome());
	}

	private Specification<OrganizzazioneEntity> filterByNome(String nome) {
		OrganizzazioneSpecification organizationFilter = new OrganizzazioneSpecification();
		organizationFilter.setNome(Optional.of(nome));
		return organizationFilter;
	}

	// === Gestione associazioni utente-organizzazione ===

	/**
	 * Salva o aggiorna un'associazione utente-organizzazione.
	 */
	public UtenteOrganizzazioneEntity save(UtenteOrganizzazioneEntity entity) {
		return this.utenteOrganizzazioneRepo.save(entity);
	}

	/**
	 * Elimina un'associazione utente-organizzazione.
	 */
	public void delete(UtenteOrganizzazioneEntity entity) {
		this.utenteOrganizzazioneRepo.delete(entity);
	}

	/**
	 * Restituisce una pagina di associazioni utente-organizzazione per l'organizzazione indicata.
	 */
	public Page<UtenteOrganizzazioneEntity> findUtenteOrganizzazioniByOrganizzazione(OrganizzazioneEntity organizzazione, Pageable pageable) {
		return this.utenteOrganizzazioneRepo.findByOrganizzazione(organizzazione, pageable);
	}

	/**
	 * Restituisce una pagina di associazioni utente-organizzazione applicando una Specification
	 * (es. filtro per organizzazione + ricerca libera q su principal/nome/cognome).
	 */
	public Page<UtenteOrganizzazioneEntity> findUtenteOrganizzazioni(
			org.springframework.data.jpa.domain.Specification<UtenteOrganizzazioneEntity> spec,
			Pageable pageable) {
		return this.utenteOrganizzazioneRepo.findAll(spec, pageable);
	}

	/**
	 * Conta gli utenti associati ad un'organizzazione.
	 */
	public long countUtentiByOrganizzazione(OrganizzazioneEntity organizzazione) {
		return this.utenteOrganizzazioneRepo.countByOrganizzazione(organizzazione);
	}

	/**
	 * Cerca l'associazione utente-organizzazione per una specifica coppia.
	 */
	public Optional<UtenteOrganizzazioneEntity> findUtenteOrganizzazione(UtenteEntity utente, OrganizzazioneEntity organizzazione) {
		if (utente == null || organizzazione == null) {
			return Optional.empty();
		}
		return this.utenteOrganizzazioneRepo.findByUtente(utente).stream()
				.filter(a -> a.getOrganizzazione() != null
						&& a.getOrganizzazione().getId().equals(organizzazione.getId()))
				.findFirst();
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
	 * Verifica se l'utente è associato all'organizzazione indicata.
	 * Non considera il ruolo: restituisce true anche se il ruolo è null (nessun ruolo / sola lettura).
	 */
	public boolean isAssociatoA(UtenteEntity utente, OrganizzazioneEntity organizzazione) {
		if (utente == null || organizzazione == null) {
			return false;
		}
		return findUtenteOrganizzazione(utente, organizzazione).isPresent();
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

	/**
	 * Verifica se due utenti hanno almeno un'organizzazione in comune.
	 */
	public boolean hasOrganizzazioneInComune(UtenteEntity u1, UtenteEntity u2) {
		if (u1 == null || u2 == null) {
			return false;
		}
		Set<Long> org1 = raccogliIdOrganizzazioni(u1);
		Set<Long> org2 = raccogliIdOrganizzazioni(u2);
		org1.retainAll(org2);
		return !org1.isEmpty();
	}

	private Set<Long> raccogliIdOrganizzazioni(UtenteEntity u) {
		Set<Long> ids = new HashSet<>();
		for (UtenteOrganizzazioneEntity assoc : findUtenteOrganizzazioniByUtente(u)) {
			if (assoc.getOrganizzazione() != null) {
				ids.add(assoc.getOrganizzazione().getId());
			}
		}
		return ids;
	}

	/**
	 * Restituisce gli utenti che hanno il ruolo indicato sull'organizzazione.
	 * Filtra solo utenti in stato operativo (ABILITATO o PENDING_UPDATE), utili per
	 * il recapito di notifiche/comunicazioni.
	 */
	public List<UtenteEntity> findUtentiByOrganizzazioneAndRuolo(OrganizzazioneEntity organizzazione, RuoloOrganizzazione ruolo) {
		if (organizzazione == null || ruolo == null) {
			return java.util.Collections.emptyList();
		}
		return this.utenteOrganizzazioneRepo
				.findByOrganizzazioneAndRuoloOrganizzazione(organizzazione, ruolo)
				.stream()
				.map(UtenteOrganizzazioneEntity::getUtente)
				.filter(u -> u != null
						&& (u.getStato() == UtenteEntity.Stato.ABILITATO
								|| u.getStato() == UtenteEntity.Stato.PENDING_UPDATE))
				.collect(Collectors.toList());
	}

}
