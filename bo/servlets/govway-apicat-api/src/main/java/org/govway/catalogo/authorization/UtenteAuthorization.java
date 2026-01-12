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

import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Ruolo;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.ConfigurazioneNotifiche;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteUpdate;

public class UtenteAuthorization extends DefaultAuthorization<UtenteCreate,UtenteUpdate,UtenteEntity> {

	public UtenteAuthorization() {
		super(EntitaEnum.UTENTE);
	}

	public void authorizeUpdate(UtenteEntity entity) {

		UtenteEntity utente = this.coreAuthorization.getUtenteSessione();

		if(!utente.getId().equals(entity.getId())) {
			super.authorizeWrite(EntitaEnum.UTENTE);
		}

	}

	public void authorizeGetNotifiche(UtenteEntity entity) {

		UtenteEntity utente = this.coreAuthorization.getUtenteSessione();

		if(!this.coreAuthorization.isAdmin(utente)) {
			if(!utente.getId().equals(entity.getId())) {
				throw new NotAuthorizedException("Un utente può essere modificato da sé stesso o da un amministratore");
			}
		}
	}

	public void authorizeUpdate(ConfigurazioneNotifiche update, UtenteEntity entity) {
		this.authorizeGetNotifiche(entity);
	}

	@Override
	public void authorizeCreate(UtenteCreate create) {
		Ruolo ruoloCorrente = this.coreAuthorization.getUtenteSessione().getRuolo();
		Ruolo ruoloTarget = toRuolo(create.getRuolo());

		checkHierarchy(ruoloCorrente, ruoloTarget, "creare");

		super.authorizeCreate(create);
	}

	@Override
	public void authorizeUpdate(UtenteUpdate update, UtenteEntity entity) {
		UtenteEntity utenteCorrente = this.coreAuthorization.getUtenteSessione();
		Ruolo ruoloCorrente = utenteCorrente.getRuolo();
		Ruolo nuovoRuolo = toRuolo(update.getRuolo());

		if (utenteCorrente.getId().equals(entity.getId())) {
			// L'utente sta modificando se stesso: verifica che non stia cercando di auto-promuoversi
			checkSelfPromotion(ruoloCorrente, nuovoRuolo);
		} else {
			// L'utente sta modificando un altro utente
			checkHierarchy(ruoloCorrente, entity.getRuolo(), "modificare");
			// Verifica anche che non stia assegnando un ruolo superiore al proprio
			if (nuovoRuolo != null) {
				checkHierarchy(ruoloCorrente, nuovoRuolo, "assegnare il ruolo");
			}
		}

		super.authorizeUpdate(update, entity);
	}

	@Override
	public void authorizeDelete(UtenteEntity entity) {
		Ruolo ruoloCorrente = this.coreAuthorization.getUtenteSessione().getRuolo();
		Ruolo ruoloTarget = entity.getRuolo();

		checkHierarchy(ruoloCorrente, ruoloTarget, "eliminare");

		super.authorizeDelete(entity);
	}

	/**
	 * Verifica la gerarchia dei ruoli: gestore > coordinatore > referente_servizio
	 * Un utente non può operare su utenti con ruolo superiore al proprio.
	 *
	 * @param ruoloCorrente ruolo dell'utente che esegue l'operazione
	 * @param ruoloTarget ruolo dell'utente su cui si opera
	 * @param operazione descrizione dell'operazione (per il messaggio di errore)
	 */
	private void checkHierarchy(Ruolo ruoloCorrente, Ruolo ruoloTarget, String operazione) {
		if (ruoloCorrente == null || ruoloTarget == null) {
			return;
		}

		int livelloCorrente = getLivelloRuolo(ruoloCorrente);
		int livelloTarget = getLivelloRuolo(ruoloTarget);

		if (livelloCorrente < livelloTarget) {
			throw new NotAuthorizedException(
				String.format("Un utente con ruolo %s non può %s utenti con ruolo %s",
					toRuoloLabel(ruoloCorrente), operazione, toRuoloLabel(ruoloTarget))
			);
		}
	}

	/**
	 * Verifica che un utente non stia cercando di auto-promuoversi.
	 * Un utente può mantenere il proprio ruolo o declassarsi, ma non promuoversi.
	 *
	 * @param ruoloCorrente ruolo attuale dell'utente
	 * @param nuovoRuolo nuovo ruolo richiesto
	 */
	private void checkSelfPromotion(Ruolo ruoloCorrente, Ruolo nuovoRuolo) {
		if (ruoloCorrente == null || nuovoRuolo == null) {
			return;
		}

		int livelloCorrente = getLivelloRuolo(ruoloCorrente);
		int livelloNuovo = getLivelloRuolo(nuovoRuolo);

		if (livelloNuovo > livelloCorrente) {
			throw new NotAuthorizedException(
				String.format("Un utente con ruolo %s non può auto-promuoversi al ruolo %s",
					toRuoloLabel(ruoloCorrente), toRuoloLabel(nuovoRuolo))
			);
		}
	}

	/**
	 * Restituisce il livello gerarchico del ruolo (più alto = più permessi)
	 */
	private int getLivelloRuolo(Ruolo ruolo) {
		switch (ruolo) {
			case AMMINISTRATORE:
				return 3; // gestore - livello più alto
			case COORDINATORE:
				return 2;
			case REFERENTE_SERVIZIO:
				return 1;
			default:
				return 0;
		}
	}

	/**
	 * Converte il ruolo in una label leggibile per i messaggi di errore
	 */
	private String toRuoloLabel(Ruolo ruolo) {
		switch (ruolo) {
			case AMMINISTRATORE:
				return "gestore";
			case COORDINATORE:
				return "coordinatore";
			case REFERENTE_SERVIZIO:
				return "referente_servizio";
			default:
				return ruolo.name().toLowerCase();
		}
	}

	/**
	 * Converte RuoloUtenteEnum (API) in Ruolo (Entity)
	 */
	private Ruolo toRuolo(RuoloUtenteEnum ruoloEnum) {
		if (ruoloEnum == null) {
			return null;
		}
		switch (ruoloEnum) {
			case GESTORE:
				return Ruolo.AMMINISTRATORE;
			case COORDINATORE:
				return Ruolo.COORDINATORE;
			case REFERENTE_SERVIZIO:
				return Ruolo.REFERENTE_SERVIZIO;
			default:
				return null;
		}
	}
}
