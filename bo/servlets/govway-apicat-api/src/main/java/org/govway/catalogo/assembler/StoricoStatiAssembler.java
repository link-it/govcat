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
package org.govway.catalogo.assembler;

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.servlets.model.ItemStoricoStato;
import org.govway.catalogo.servlets.model.ItemUtente;
import org.govway.catalogo.servlets.model.PageMetadata;
import org.govway.catalogo.servlets.model.PagedModelItemStoricoStato;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Costruisce lo storico dei cambi di stato di servizi e adesioni (dal piu` recente).
 *
 * I cambi di stato sono quelli registrati nelle tabelle stati_servizio / stati_adesione. La creazione
 * non vi e` registrata: viene aggiunta come ultimo elemento dello storico (il piu` vecchio), costruito
 * da data di creazione, richiedente e stato iniziale del workflow, senza stato precedente. Lo stato
 * iniziale fa anche da stato precedente del primo cambio di stato registrato.
 */
@Component
public class StoricoStatiAssembler {

	/** Cambio di stato registrato, indipendente dall'entita` (servizio o adesione). */
	public record CambioStato(Date data, UtenteEntity utente, String stato) {}

	@Autowired
	private UtenteItemAssembler itemUtenteAssembler;

	/**
	 * @param cambi cambi di stato registrati, dal piu` recente, a partire dalla posizione {@code page*size}:
	 *              al massimo {@code size+1} elementi, l'ultimo dei quali serve solo a ricavare lo stato
	 *              precedente dell'ultimo cambio della pagina
	 * @param totaleCambi numero totale dei cambi di stato registrati
	 * @param creazione la creazione (data, richiedente, stato iniziale)
	 */
	public PagedModelItemStoricoStato toModel(List<CambioStato> cambi, long totaleCambi, CambioStato creazione, int page, int size) {

		Map<Long, ItemUtente> utenti = new HashMap<>();
		List<ItemStoricoStato> content = new ArrayList<>();

		int elementiPagina = Math.min(size, cambi.size());
		for(int i = 0; i < elementiPagina; i++) {
			String statoPrecedente = (i + 1 < cambi.size()) ? cambi.get(i + 1).stato() : creazione.stato();
			content.add(toItem(cambi.get(i), statoPrecedente, utenti));
		}

		// la creazione occupa la posizione successiva all'ultimo cambio registrato
		long offset = (long) page * size;
		if(totaleCambi >= offset && totaleCambi < offset + size) {
			content.add(toItem(creazione, null, utenti));
		}

		long totalElements = totaleCambi + 1;
		PagedModelItemStoricoStato model = new PagedModelItemStoricoStato();
		model.setContent(content);
		model.setPage(new PageMetadata()
				.size((long) size)
				.number((long) page)
				.totalElements(totalElements)
				.totalPages((totalElements + size - 1) / size));
		return model;
	}

	private ItemStoricoStato toItem(CambioStato cambio, String statoPrecedente, Map<Long, ItemUtente> utenti) {
		ItemStoricoStato item = new ItemStoricoStato();
		item.setData(cambio.data().toInstant().atOffset(ZoneOffset.UTC));
		item.setStato(cambio.stato());
		item.setStatoPrecedente(statoPrecedente);
		if(cambio.utente() != null) {
			item.setUtente(utenti.computeIfAbsent(cambio.utente().getId(), id -> this.itemUtenteAssembler.toModel(cambio.utente())));
		}
		return item;
	}
}
