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
package org.govway.catalogo.services;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.RateLimitingPeriodo;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneAdesione;
import org.govway.catalogo.servlets.model.ConfigurazioneAdesioneRateLimiting;
import org.govway.catalogo.servlets.model.ConfigurazioneProfilo;
import org.govway.catalogo.servlets.model.ConfigurazioneProfiloRateLimiting;
import org.govway.catalogo.servlets.model.ConfigurazioneRateLimitingQuota;
import org.govway.catalogo.servlets.model.ConfigurazioneRateLimitingStatiAutorizzati;
import org.govway.catalogo.servlets.model.ConfigurazioneWorkflow;
import org.govway.catalogo.servlets.model.RateLimitingPeriodoEnum;
import org.govway.catalogo.servlets.model.Ruolo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Regola del rate limiting delle API, ricavata dal blocco rate_limiting dei profili in
 * configurazione: periodi ammessi e quote previste (totale e fruitore), ciascuna con required e
 * ruoli_abilitati.
 *
 * Il blocco e` facoltativo: in sua assenza vale il default, impostato sui profili al caricamento
 * della configurazione (vedi {@link #applicaDefault(Configurazione)}) cosi` che la console lo legga
 * dall'API di configurazione senza replicarne la logica. I profili PDND, cioe` con pdnd_type, hanno
 * quota totale e quota fruitore con il solo periodo giorno; gli altri la sola quota totale con
 * tutti i periodi.
 *
 * Un'API con piu` profili segue la regola piu` restrittiva: periodi in comune a tutti i profili,
 * quote previste da almeno un profilo, required se lo e` in almeno un profilo, ruoli_abilitati
 * comuni a tutti i profili che li indicano. Senza profili vale il default dei profili non PDND.
 *
 * Per le adesioni definisce gli stati in cui le quote assegnate al fruitore in un ambiente sono
 * autorizzate (adesione.rate_limiting.stati_autorizzati), distinte nel riepilogo del servizio.
 * Una lista non configurata e` ricavata dai nomi degli stati del workflow, con la stessa
 * convenzione <fase>_<ambiente>[_senza_collaudo] su cui si basa il resto dell'applicazione:
 * l'ordine della lista degli stati non e` utilizzabile, perche' il ramo senza collaudo segue quello
 * di produzione.
 *
 * Non dipende dalle autorizzazioni, che la usano per la verifica dei dati obbligatori.
 */
@Component
public class RateLimitingRegole {

	/** Quota prevista dalla regola; ruoliAbilitati null: tutti i ruoli. */
	public record Quota(boolean required, List<Ruolo> ruoliAbilitati) {}

	/** Regola di un'API; una quota null non e` prevista. */
	public record Regola(Set<RateLimitingPeriodo> periodi, Quota quotaTotale, Quota quotaFruitore) {}

	@Autowired
	private Configurazione configurazione;

	/**
	 * Imposta il default sui profili che non dichiarano il blocco rate_limiting e verifica quelli
	 * che lo dichiarano; lo stesso per gli stati autorizzati delle adesioni.
	 */
	public static void applicaDefault(Configurazione configurazione) {
		applicaDefaultProfili(configurazione);
		applicaDefaultAdesioni(configurazione.getAdesione());
	}

	private static void applicaDefaultProfili(Configurazione configurazione) {
		for(ConfigurazioneProfilo profilo: configurazione.getServizio().getApi().getProfili()) {
			ConfigurazioneProfiloRateLimiting rl = profilo.getRateLimiting();
			if(rl == null) {
				profilo.setRateLimiting(getDefault(isPdnd(profilo)));
			} else if(rl.getPeriodi() == null || rl.getPeriodi().isEmpty() || (rl.getQuotaTotale() == null && rl.getQuotaFruitore() == null)) {
				throw new IllegalStateException("Configurazione non valida: il rate_limiting del profilo '" + profilo.getCodiceInterno()
						+ "' deve indicare almeno un periodo e almeno una fra quota_totale e quota_fruitore");
			}
		}
	}

	private static ConfigurazioneProfiloRateLimiting getDefault(boolean pdnd) {
		ConfigurazioneProfiloRateLimiting rl = new ConfigurazioneProfiloRateLimiting();
		rl.setQuotaTotale(new ConfigurazioneRateLimitingQuota().required(false));
		if(pdnd) {
			rl.setPeriodi(new ArrayList<>(List.of(RateLimitingPeriodoEnum.GIORNO)));
			rl.setQuotaFruitore(new ConfigurazioneRateLimitingQuota().required(false));
		} else {
			rl.setPeriodi(new ArrayList<>(List.of(RateLimitingPeriodoEnum.MINUTO, RateLimitingPeriodoEnum.ORA, RateLimitingPeriodoEnum.GIORNO)));
		}
		return rl;
	}

	private static void applicaDefaultAdesioni(ConfigurazioneAdesione adesione) {
		ConfigurazioneWorkflow workflow = adesione.getWorkflow();
		List<String> stati = workflow != null && workflow.getStati() != null ? workflow.getStati() : List.of();

		if(adesione.getRateLimiting() == null) {
			adesione.setRateLimiting(new ConfigurazioneAdesioneRateLimiting());
		}
		if(adesione.getRateLimiting().getStatiAutorizzati() == null) {
			adesione.getRateLimiting().setStatiAutorizzati(new ConfigurazioneRateLimitingStatiAutorizzati());
		}

		ConfigurazioneRateLimitingStatiAutorizzati sa = adesione.getRateLimiting().getStatiAutorizzati();
		if(sa.getCollaudo() == null) {
			sa.setCollaudo(getStatiAutorizzatiDefault(workflow, stati, AmbienteEnum.COLLAUDO));
		} else {
			checkStati(sa.getCollaudo(), stati, "collaudo");
		}
		if(sa.getProduzione() == null) {
			sa.setProduzione(getStatiAutorizzatiDefault(workflow, stati, AmbienteEnum.PRODUZIONE));
		} else {
			checkStati(sa.getProduzione(), stati, "produzione");
		}
	}

	/**
	 * Collaudo: stati di collaudo da autorizzato in poi e stati di produzione con collaudo, in cui
	 * il collaudo e` gia` stato autorizzato. Produzione: stati di produzione da autorizzato in poi,
	 * con o senza collaudo. Esclusi sempre lo stato iniziale e quello archiviato.
	 */
	private static List<String> getStatiAutorizzatiDefault(ConfigurazioneWorkflow workflow, List<String> stati, AmbienteEnum ambiente) {
		List<String> esclusi = new ArrayList<>();
		if(workflow != null) {
			esclusi.add(workflow.getStatoIniziale());
			esclusi.add(workflow.getStatoArchiviato());
		}

		return new ArrayList<>(stati.stream()
				.filter(s -> !esclusi.contains(s))
				.filter(s -> AmbienteEnum.PRODUZIONE.equals(ambiente)
						? s.contains("produzione") && !s.startsWith("richiesto")
						: !s.contains("senza_collaudo") && (s.contains("produzione") || (s.contains("collaudo") && !s.startsWith("richiesto"))))
				.toList());
	}

	private static void checkStati(List<String> statiAutorizzati, List<String> stati, String ambiente) {
		for(String s: statiAutorizzati) {
			if(!stati.contains(s)) {
				throw new IllegalStateException("Configurazione non valida: lo stato '" + s + "' di adesione.rate_limiting.stati_autorizzati."
						+ ambiente + " non e` fra gli stati del workflow delle adesioni");
			}
		}
	}

	/** Profilo PDND: pdnd_type valorizzato, lo stesso criterio del menu` PDND della console. */
	private static boolean isPdnd(ConfigurazioneProfilo profilo) {
		return profilo.getPdndType() != null && !profilo.getPdndType().isBlank();
	}

	/** Stati delle adesioni in cui le quote dell'ambiente sono autorizzate, impostati all'avvio. */
	public List<String> getStatiAutorizzati(AmbienteEnum ambiente) {
		ConfigurazioneRateLimitingStatiAutorizzati sa = this.configurazione.getAdesione().getRateLimiting().getStatiAutorizzati();
		return AmbienteEnum.PRODUZIONE.equals(ambiente) ? sa.getProduzione() : sa.getCollaudo();
	}

	public Regola getRegola(ApiEntity api) {

		List<ConfigurazioneProfiloRateLimiting> regole = new ArrayList<>();
		for(AuthTypeEntity at: api.getAuthType()) {
			this.configurazione.getServizio().getApi().getProfili().stream()
				.filter(p -> p.getCodiceInterno().equals(at.getProfilo()))
				.findAny()
				.ifPresent(p -> regole.add(Optional.ofNullable(p.getRateLimiting()).orElseGet(() -> getDefault(isPdnd(p)))));
		}

		if(regole.isEmpty()) {
			regole.add(getDefault(false));
		}

		Set<RateLimitingPeriodo> periodi = EnumSet.allOf(RateLimitingPeriodo.class);
		for(ConfigurazioneProfiloRateLimiting rl: regole) {
			periodi.retainAll(rl.getPeriodi().stream().map(p -> RateLimitingPeriodo.valueOf(p.name())).toList());
		}

		return new Regola(periodi,
				combina(regole.stream().map(ConfigurazioneProfiloRateLimiting::getQuotaTotale).toList()),
				combina(regole.stream().map(ConfigurazioneProfiloRateLimiting::getQuotaFruitore).toList()));
	}

	private Quota combina(List<ConfigurazioneRateLimitingQuota> quote) {
		boolean prevista = false;
		boolean required = false;
		List<Ruolo> ruoliAbilitati = null;
		for(ConfigurazioneRateLimitingQuota q: quote) {
			if(q == null) {
				continue;
			}
			prevista = true;
			required = required || Boolean.TRUE.equals(q.isRequired());
			if(q.getRuoliAbilitati() != null) {
				if(ruoliAbilitati == null) {
					ruoliAbilitati = new ArrayList<>(q.getRuoliAbilitati());
				} else {
					ruoliAbilitati.retainAll(q.getRuoliAbilitati());
				}
			}
		}
		return prevista ? new Quota(required, ruoliAbilitati) : null;
	}
}
