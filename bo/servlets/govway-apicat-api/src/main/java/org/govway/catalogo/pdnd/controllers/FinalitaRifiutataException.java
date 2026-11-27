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
package org.govway.catalogo.pdnd.controllers;

import java.util.Map;
import java.util.UUID;

import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.InternalException;

/**
 * Finalita' letta dalla PDND v3 che ha la sola versione rifiutata: lo stato REJECTED non esiste
 * nel modello dati esposto (quello della v1), quindi la finalita' non si puo' restituire.
 *
 * Per l'API PDND esposta resta un errore interno INT.500.PDND, come ogni altro stato non
 * rappresentabile; chi usa il client internamente puo' invece riconoscere il rifiuto, che e' una
 * risposta valida della PDND e non un problema di comunicazione (Issue 486).
 */
public class FinalitaRifiutataException extends InternalException {

	private static final long serialVersionUID = 1L;

	private final UUID purposeId;
	private final String titolo;
	private final String stato;

	public FinalitaRifiutataException(UUID purposeId, String titolo, String stato) {
		super(ErrorCode.INT_500_PDND, Map.of("dettagli",
				"stato della finalita' ["+purposeId+"] non rappresentabile nel modello dati esposto"));
		this.purposeId = purposeId;
		this.titolo = titolo;
		this.stato = stato;
	}

	public UUID getPurposeId() {
		return this.purposeId;
	}

	/** Titolo della finalita' sulla PDND. */
	public String getTitolo() {
		return this.titolo;
	}

	/** Stato della versione rifiutata, come lo riporta la PDND. */
	public String getStato() {
		return this.stato;
	}
}
