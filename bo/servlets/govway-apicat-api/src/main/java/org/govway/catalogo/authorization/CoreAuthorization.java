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
package org.govway.catalogo.authorization;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OrganizationContext;
import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Ruolo;
import org.govway.catalogo.core.orm.entity.UtenteEntity.RuoloPdnd;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.RichiestaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.Configurazione;
import org.springframework.beans.factory.annotation.Autowired;

public class CoreAuthorization {

	@Autowired
	private RequestUtils requestUtils;

	@Autowired
	protected Configurazione configurazione;

	@Autowired
	private OrganizationContext organizationContext;

	@Autowired
	private UtenteService utenteService;

	@Autowired
	private OrganizzazioneService organizzazioneService;
	
	public UtenteEntity getUtenteSessione() {
		boolean consentiAnonimo = this.configurazione.getUtente().isConsentiAccessoAnonimo();
		return getUtenteSessione(consentiAnonimo);
	}

	private UtenteEntity getUtenteSessione(boolean consentiUtenteAnonimo) {
		InfoProfilo utente = this.requestUtils.getPrincipal(!consentiUtenteAnonimo);
		if(!consentiUtenteAnonimo) {
			if(utente == null)
				throw new NotAuthorizedException(ErrorCode.AUT_403);
			if(utente.utente == null)
				throw new NotAuthorizedException(ErrorCode.AUT_403);
			return utente.utente;
		} else {
			if(utente != null) {
				return utente.utente;
			} else {
				return null;
			}
		}
	}

	public boolean isAdmin() {
		return isAdmin(getUtenteSessione());
	}
	
	public boolean isCoordinatore() {
		return isCoordinatore(getUtenteSessione());
	}

	public boolean isAdmin(UtenteEntity utente) {
		return utente != null && Ruolo.AMMINISTRATORE.equals(utente.getRuolo());
	}
	
	public boolean isCoordinatore(UtenteEntity utente) {
		return utente != null && Ruolo.COORDINATORE.equals(utente.getRuolo());
	}
	
	public void requireAdmin() {
		if(!isAdmin()) {
			throw new NotAuthorizedException(ErrorCode.AUT_403);
		}
	}

	/**
	 * Verifica che l'utente in sessione abbia ruolo PDND amministratore: requisito delle
	 * operazioni di scrittura verso la PDND.
	 */
	public void requireRuoloPdndAdmin() {
		UtenteEntity utente = getUtenteSessione();

		if(utente == null || !RuoloPdnd.ADMIN.equals(utente.getRuoloPdnd())) {
			throw new NotAuthorizedException(ErrorCode.AUT_403_RUOLO_PDND);
		}
	}

	public void requireLogged() {
		if(isAnounymous()) {
			throw new NotAuthorizedException(ErrorCode.AUT_403);
		}
	}

	/**
	 * Verifica i ruoli base per la creazione di un servizio:
	 * - admin (gestore) → OK
	 * - utente con ruolo per-organizzazione (AMM_ORG o OPERATORE_API) sull'organizzazione di sessione → OK
	 * Per i vincoli aggiuntivi della matrice (es. flag referente dell'organizzazione di sessione)
	 * vedere ServizioAuthorization.authorizeCreate.
	 */
	public void requireRuoloPerCreareServizio() {
		if(!isAdmin() && !isRuoloOrganizzazione()) {
			throw new NotAuthorizedException(ErrorCode.AUT_403);
		}
	}

	/**
	 * Verifica se l'utente ha un ruolo per-organizzazione valido.
	 * Usa il contesto organizzazione di sessione se disponibile (verifica ruolo non-null
	 * nell'organizzazione attiva). Se non c'è contesto di sessione, ricade sul ruolo
	 * globale dell'utente per retrocompatibilità.
	 */
	private boolean isRuoloOrganizzazione() {
		InfoProfilo principal = this.requestUtils.getPrincipal(false);
		if(principal == null || principal.utente == null) {
			return false;
		}

		// Se c'è un contesto organizzazione attivo, verifica il ruolo in quella organizzazione.
		// Ruolo null = nessun ruolo = sola lettura, non sufficiente.
		if (this.organizationContext != null && this.organizationContext.hasOrganizzazione()) {
			return this.organizationContext.getRuoloOrganizzazione() != null;
		}

		// Fallback: nessun contesto di sessione, verifica il ruolo globale.
		return principal.utente.getRuolo() != null && principal.utente.getRuolo().equals(Ruolo.RUOLO_ORGANIZZAZIONE);
	}

	public boolean isAnounymous() {
		InfoProfilo principal = this.requestUtils.getPrincipal(false);
		return principal == null || principal.utente == null;
	}

	public boolean isWhiteListed() {
		return this.requestUtils.isWhiteListed();
	}

	/**
	 * @return il contesto organizzazione della richiesta corrente, può essere vuoto
	 */
	public OrganizationContext getOrganizationContext() {
		return this.organizationContext;
	}

	/**
	 * Carica al volo l'entità organizzazione di sessione dal database.
	 * Il bean OrganizationContext mantiene solo l'identificativo per evitare problemi di
	 * lazy initialization su entità detached. La query è risolta nella transazione attiva
	 * del controller chiamante.
	 *
	 * @return l'organizzazione attiva di sessione, o null se non impostata
	 */
	public OrganizzazioneEntity getOrganizzazioneSessione() {
		if (this.organizationContext != null && this.organizationContext.hasOrganizzazione()) {
			return this.organizzazioneService.findById(this.organizationContext.getIdOrganizzazione())
					.orElse(null);
		}
		return null;
	}

	/**
	 * @return il ruolo dell'utente nell'organizzazione di sessione, o null se non impostata
	 */
	public RuoloOrganizzazione getRuoloOrganizzazioneSessione() {
		if (this.organizationContext != null && this.organizationContext.hasOrganizzazione()) {
			return this.organizationContext.getRuoloOrganizzazione();
		}
		return null;
	}

	/**
	 * Verifica se l'utente ha uno dei ruoli specificati nell'organizzazione di sessione.
	 * Restituisce false se non c'è un contesto organizzazione attivo oppure se il ruolo è null.
	 */
	public boolean hasRuoloInOrganizzazioneSessione(RuoloOrganizzazione... ruoli) {
		RuoloOrganizzazione ruoloUtente = getRuoloOrganizzazioneSessione();
		if (ruoloUtente == null) {
			return false;
		}
		for (RuoloOrganizzazione r : ruoli) {
			if (ruoloUtente == r) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Organizzazione di sessione su cui l'utente opera come amministratore: ne amplia la visibilita`
	 * a servizi e adesioni dell'organizzazione (vedi i filtri per utente di servizi e adesioni).
	 *
	 * @return l'identificativo (PK) dell'organizzazione di sessione se il ruolo in sessione e`
	 *         {@link RuoloOrganizzazione#AMMINISTRATORE_ORGANIZZAZIONE}, altrimenti vuoto
	 */
	public Optional<Long> getIdOrganizzazioneAmministrataSessione() {
		if (hasRuoloInOrganizzazioneSessione(RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE)) {
			return Optional.of(this.organizationContext.getIdOrganizzazione());
		}
		return Optional.empty();
	}

	/**
	 * @return true se l'organizzazione di sessione ha il flag referente attivo
	 */
	public boolean isOrganizzazioneSessioneReferente() {
		OrganizzazioneEntity org = getOrganizzazioneSessione();
		return org != null && org.isReferente();
	}

	/**
	 * @return true se l'organizzazione di sessione ha il flag aderente attivo
	 */
	public boolean isOrganizzazioneSessioneAderente() {
		OrganizzazioneEntity org = getOrganizzazioneSessione();
		return org != null && org.isAderente();
	}

	/**
	 * Verifica se l'utente indicato ha uno dei ruoli specificati su una specifica organizzazione.
	 * A differenza di hasRuoloInOrganizzazioneSessione, non usa il contesto di sessione ma
	 * effettua una query diretta sulle associazioni dell'utente.
	 */
	public boolean hasRuoloInOrganizzazione(UtenteEntity utente, OrganizzazioneEntity organizzazione, RuoloOrganizzazione... ruoli) {
		return this.organizzazioneService.hasRuoloInOrganizzazione(utente, organizzazione, ruoli);
	}

	/**
	 * Organizzazione di cui i referenti del servizio devono essere almeno operatori API: quella del
	 * soggetto referente del dominio. Vuota per le fruizioni, i cui referenti non sono vincolati.
	 */
	public static Optional<OrganizzazioneEntity> getOrganizzazioneReferenti(ServizioEntity servizio) {
		if (servizio.isFruizione()) {
			return Optional.empty();
		}
		return Optional.of(servizio.getDominio().getSoggettoReferente().getOrganizzazione());
	}

	/**
	 * Organizzazione di cui i referenti del dominio devono essere almeno operatori API: quella del
	 * soggetto referente. Vuota per le organizzazioni intermediate, i cui referenti non sono vincolati.
	 */
	public static Optional<OrganizzazioneEntity> getOrganizzazioneReferenti(DominioEntity dominio) {
		OrganizzazioneEntity organizzazione = dominio.getSoggettoReferente().getOrganizzazione();
		return organizzazione.isIntermediata() ? Optional.empty() : Optional.of(organizzazione);
	}

	/**
	 * Organizzazione di cui i referenti dell'adesione devono essere almeno operatori API: quella del
	 * soggetto aderente.
	 */
	public static Optional<OrganizzazioneEntity> getOrganizzazioneReferenti(AdesioneEntity adesione) {
		return Optional.of(adesione.getSoggetto().getOrganizzazione());
	}

	/**
	 * Indica se il ruolo nell'organizzazione consente di essere referente di servizi, domini e
	 * adesioni dell'organizzazione (almeno Operatore API).
	 */
	public static boolean isRuoloReferente(RuoloOrganizzazione ruolo) {
		return ruolo == RuoloOrganizzazione.OPERATORE_API || ruolo == RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE;
	}

	/**
	 * Verifica se l'utente puo` essere referente di servizi, domini e adesioni dell'organizzazione:
	 * il gestore sempre, gli altri se associati all'organizzazione con almeno il ruolo Operatore API.
	 * L'organizzazione e` quella restituita da getOrganizzazioneReferenti per la risorsa.
	 */
	public boolean isReferenteValido(UtenteEntity utente, OrganizzazioneEntity organizzazione) {
		return isAdmin(utente) || this.organizzazioneService.findUtenteOrganizzazione(utente, organizzazione)
				.map(assoc -> isRuoloReferente(assoc.getRuoloOrganizzazione()))
				.orElse(false);
	}

	/**
	 * Come {@link #isReferenteValido(UtenteEntity, OrganizzazioneEntity)}, ma con l'errore che indica
	 * l'utente e il motivo: non associato all'organizzazione o senza un ruolo sufficiente.
	 *
	 * @throws NotAuthorizedException {@link ErrorCode#AUT_403_ORG_MISSING} o {@link ErrorCode#AUT_403_REFERENT_NO_ROLE}
	 */
	public void checkReferente(UtenteEntity utente, OrganizzazioneEntity organizzazione) {
		if (isReferenteValido(utente, organizzazione)) {
			return;
		}
		ErrorCode errorCode = this.organizzazioneService.isAssociatoA(utente, organizzazione)
				? ErrorCode.AUT_403_REFERENT_NO_ROLE
				: ErrorCode.AUT_403_ORG_MISSING;
		throw new NotAuthorizedException(errorCode, Map.of(
				"orgNome", organizzazione.getNome(),
				"userIdUtente", utente.getIdUtente(),
				"nomeUtente", utente.getNome(),
				"cognomeUtente", utente.getCognome()));
	}

	/**
	 * Verifica i referenti gia` presenti su una risorsa che passa sotto un'altra organizzazione
	 * (servizio spostato su un dominio di un'altra organizzazione, dominio assegnato a un soggetto
	 * di un'altra organizzazione): l'errore e` di validazione ed elenca tutti i referenti non validi.
	 *
	 * @throws RichiestaNonValidaSemanticamenteException {@link ErrorCode#VAL_422_REFERENTI_ORGANIZZAZIONE}
	 */
	public void checkReferentiNuovaOrganizzazione(Collection<UtenteEntity> referenti, OrganizzazioneEntity organizzazione) {
		String nonValidi = referenti.stream()
				.distinct()
				.filter(u -> !isReferenteValido(u, organizzazione))
				.map(u -> u.getNome() + " " + u.getCognome())
				.collect(Collectors.joining(", "));
		if (!nonValidi.isEmpty()) {
			throw new RichiestaNonValidaSemanticamenteException(ErrorCode.VAL_422_REFERENTI_ORGANIZZAZIONE,
					Map.of("orgNome", organizzazione.getNome(), "referenti", nonValidi));
		}
	}

}
