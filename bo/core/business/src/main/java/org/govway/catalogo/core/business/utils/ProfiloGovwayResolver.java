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
package org.govway.catalogo.core.business.utils;

import java.util.Collection;
import java.util.function.Supplier;

import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Risoluzione del profilo di interoperabilità GovWay di un soggetto, condivisa dal batch di
 * configurazione e dal monitoraggio (transazioni e statistiche) perché le due logiche non divergano.
 * <p>
 * Ordine di risoluzione: tipo gateway del soggetto, profilo_govway dichiarato dai profili di
 * autenticazione delle API del servizio (servizio.api.profili[].profilo_govway),
 * soggetto.profilo_gateway_default, monitoraggio.profilo_govway_default, infine ModI.
 */
public final class ProfiloGovwayResolver {

	private static final Logger logger = LoggerFactory.getLogger(ProfiloGovwayResolver.class);

	/** Profilo usato quando nessuna delle fonti della configurazione lo determina. */
	public static final String PROFILO_DEFAULT = "ModI";

	// ModI e` il nome corrente del profilo ModIPA: i due valori sono equivalenti (cfr. ProfiloGovwayService)
	private static final String PROFILO_MODI = "ModI";
	private static final String PROFILO_MODIPA = "ModIPA";

	/**
	 * Lettore del profilo_govway del profilo di autenticazione con il codice interno indicato.
	 *
	 * @param <E> eccezione sollevata dalla lettura della configurazione
	 */
	@FunctionalInterface
	public interface LettoreProfiloGovway<E extends Exception> {
		String getProfiloGovway(String codiceInterno) throws E;
	}

	private ProfiloGovwayResolver() {
	}

	/**
	 * Profilo di interoperabilità GovWay da usare per un soggetto.
	 *
	 * @param tipoGatewaySoggetto tipo gateway del soggetto, nullo se non definito
	 * @param profiloGovwayProfili profilo dichiarato dai profili di autenticazione (vedi
	 *        {@link #getProfiloGovwayProfili}), nullo se assente o non determinabile
	 * @param profiloGatewayDefaultSoggetto soggetto.profilo_gateway_default, letto solo se necessario
	 * @param profiloGovwayDefaultMonitoraggio monitoraggio.profilo_govway_default, letto solo se necessario
	 */
	public static String risolvi(String tipoGatewaySoggetto, String profiloGovwayProfili,
			Supplier<String> profiloGatewayDefaultSoggetto, Supplier<String> profiloGovwayDefaultMonitoraggio) {

		if (tipoGatewaySoggetto != null) {
			return tipoGatewaySoggetto;
		}

		if (profiloGovwayProfili != null) {
			return profiloGovwayProfili;
		}

		String profiloGatewayDefault = profiloGatewayDefaultSoggetto.get();
		if (profiloGatewayDefault != null) {
			return profiloGatewayDefault;
		}

		String profiloMonitoraggio = profiloGovwayDefaultMonitoraggio.get();
		if (profiloMonitoraggio != null) {
			return profiloMonitoraggio;
		}

		return PROFILO_DEFAULT;
	}

	/**
	 * Profilo di interoperabilità GovWay dichiarato dai profili di autenticazione delle API indicate.
	 * I profili che non dichiarano profilo_govway non concorrono. Se i profili ne dichiarano più di uno
	 * non equivalente il valore non è determinabile e si ritorna null.
	 *
	 * @param api API del servizio
	 * @param lettore lettore del profilo_govway di un profilo di autenticazione
	 * @param contesto descrizione dell'oggetto elaborato, usata nel log (es. "dell'adesione X")
	 */
	public static <E extends Exception> String getProfiloGovwayProfili(Collection<ApiEntity> api,
			LettoreProfiloGovway<E> lettore, String contesto) throws E {

		String scelto = null;

		for (ApiEntity apiEntity : api) {
			for (AuthTypeEntity authTypeEntity : apiEntity.getAuthType()) {
				String profiloGovway = lettore.getProfiloGovway(authTypeEntity.getProfilo());

				if (profiloGovway == null) {
					continue;
				}

				if (scelto == null) {
					scelto = profiloGovway;
				} else if (!isEquivalente(scelto, profiloGovway)) {
					logger.warn("I profili {} dichiarano profili di interoperabilità diversi ({} e {}): il profilo del soggetto viene risolto dai default della configurazione",
							contesto, scelto, profiloGovway);
					return null;
				}
			}
		}

		return scelto;
	}

	public static boolean isEquivalente(String profilo1, String profilo2) {
		return normalizza(profilo1).equals(normalizza(profilo2));
	}

	private static String normalizza(String profilo) {
		return PROFILO_MODI.equals(profilo) ? PROFILO_MODIPA : profilo;
	}
}
