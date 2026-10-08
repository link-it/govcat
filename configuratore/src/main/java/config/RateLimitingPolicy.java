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
package config;

/**
 * Policy di rate limiting di una erogazione o di una fruizione.
 *
 * La policy e' identificata per criteri (metrica e intervallo): govway risolve da se' la policy
 * globale corrispondente. Il filtro sull'applicativo fruitore limita la soglia al singolo
 * applicativo, che e' il modo in cui si assegna una quota al singolo adesore.
 */
public class RateLimitingPolicy {

	/** Soglia espressa come stringa di cifre: evita la formattazione dei numeri del template. */
	private String sogliaValore;

	private String nome;
	private String stato = "abilitato";
	private String metrica = "numero-richieste";
	private String intervallo = "giornaliero";
	private String applicativoFruitore;

	public RateLimitingPolicy setNome(String nome) {
		this.nome = nome;
		return this;
	}

	public RateLimitingPolicy setStato(String stato) {
		this.stato = stato;
		return this;
	}

	public RateLimitingPolicy setSogliaValore(String sogliaValore) {
		this.sogliaValore = sogliaValore;
		return this;
	}

	public RateLimitingPolicy setMetrica(String metrica) {
		this.metrica = metrica;
		return this;
	}

	public RateLimitingPolicy setIntervallo(String intervallo) {
		this.intervallo = intervallo;
		return this;
	}

	public RateLimitingPolicy setApplicativoFruitore(String applicativoFruitore) {
		this.applicativoFruitore = applicativoFruitore;
		return this;
	}

	public String getNome() {
		return nome;
	}

	public String getStato() {
		return stato;
	}

	public String getSogliaValore() {
		return sogliaValore;
	}

	public String getMetrica() {
		return metrica;
	}

	public String getIntervallo() {
		return intervallo;
	}

	public String getApplicativoFruitore() {
		return applicativoFruitore;
	}

}
