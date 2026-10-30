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

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneProfilo;
import org.govway.catalogo.servlets.model.ConfigurazioneRiferimentoProprietaCustom;
import org.govway.catalogo.servlets.model.TipoSoggettoGateway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Profilo di interoperabilità GovWay delle API.
 *
 * Un profilo della configurazione (servizio.api.profili) può essere limitato a un solo profilo di
 * interoperabilità GovWay tramite profilo_govway. Il profilo di interoperabilità di un'API è quello
 * ridefinito dal gestore tramite la proprietà custom indicata in servizio.api.proprieta_profilo_govway,
 * altrimenti il tipo gateway del soggetto (referente del dominio per le erogazioni, ente erogatore per
 * le fruizioni), altrimenti soggetto.profilo_gateway_default.
 *
 * La ridefinizione influenza la scelta dei profili e il monitoraggio, non la configurazione di GovWay.
 */
@Service
public class ProfiloGovwayService {

	// ModI e` il nome corrente del profilo ModIPA: i due valori sono equivalenti
	private static final String MODI = "ModI";

	@Autowired
	private Configurazione configurazione;

	@Autowired
	private CoreAuthorization coreAuthorization;

	private ConfigurazioneRiferimentoProprietaCustom getRiferimentoOverride() {
		if(this.configurazione.getServizio() == null || this.configurazione.getServizio().getApi() == null) {
			return null;
		}
		return this.configurazione.getServizio().getApi().getProprietaProfiloGovway();
	}

	public boolean isGruppoOverride(String gruppo) {
		ConfigurazioneRiferimentoProprietaCustom rif = getRiferimentoOverride();
		return rif != null && rif.getNomeGruppo().equals(gruppo);
	}

	public boolean isProprietaOverride(String gruppo, String nome) {
		ConfigurazioneRiferimentoProprietaCustom rif = getRiferimentoOverride();
		return rif != null && rif.getNomeGruppo().equals(gruppo) && rif.getNomeProprieta().equals(nome);
	}

	/**
	 * Il gruppo che contiene la ridefinizione del profilo di interoperabilità è modificabile solo dal gestore.
	 * Resta leggibile da tutti: la console lo usa per filtrare i profili selezionabili e lo mostra solo al gestore.
	 */
	public void checkModificaGruppo(String gruppo) {
		if(isGruppoOverride(gruppo) && !this.coreAuthorization.isAdmin()) {
			throw new NotAuthorizedException(ErrorCode.AUT_403_GRUPPO_RISERVATO_GESTORE, Map.of("gruppo", gruppo));
		}
	}

	public void checkValoreOverride(String gruppo, String nome, String valore) {
		if(!isProprietaOverride(gruppo, nome) || isBlank(valore)) {
			return;
		}
		boolean valido = Arrays.stream(TipoSoggettoGateway.values()).anyMatch(t -> t.getValue().equals(valore));
		if(!valido) {
			String ammessi = Arrays.stream(TipoSoggettoGateway.values()).map(TipoSoggettoGateway::getValue).collect(Collectors.joining(", "));
			throw new BadRequestException(ErrorCode.VAL_400_PROFILO_GOVWAY, Map.of("valore", valore, "valoriAmmessi", ammessi));
		}
	}

	/**
	 * Ridefinizione del profilo di interoperabilità impostata dal gestore sull'API, se presente.
	 */
	public String getOverride(ApiEntity api) {
		ConfigurazioneRiferimentoProprietaCustom rif = getRiferimentoOverride();
		if(rif == null || api.getEstensioni() == null) {
			return null;
		}
		return api.getEstensioni().stream()
				.filter(e -> rif.getNomeGruppo().equals(e.getGruppo()) && rif.getNomeProprieta().equals(e.getNome()))
				.map(e -> e.getValore())
				.filter(v -> !isBlank(v))
				.findAny()
				.orElse(null);
	}

	/**
	 * Profilo di interoperabilità GovWay dell'API: ridefinizione del gestore, altrimenti tipo gateway
	 * del soggetto, altrimenti soggetto.profilo_gateway_default. Null se non determinabile.
	 */
	public String getProfiloGovway(ApiEntity api) {
		String override = getOverride(api);
		if(override != null) {
			return override;
		}

		SoggettoEntity soggetto = getSoggetto(api.getServizio());
		if(soggetto != null && !isBlank(soggetto.getTipoGateway())) {
			return soggetto.getTipoGateway();
		}

		if(this.configurazione.getSoggetto() != null && this.configurazione.getSoggetto().getProfiloGatewayDefault() != null) {
			return this.configurazione.getSoggetto().getProfiloGatewayDefault().getValue();
		}
		return null;
	}

	private SoggettoEntity getSoggetto(ServizioEntity servizio) {
		if(servizio == null) {
			return null;
		}
		if(servizio.isFruizione() && servizio.getSoggettoErogatore() != null) {
			return servizio.getSoggettoErogatore();
		}
		return servizio.getDominio() != null ? servizio.getDominio().getSoggettoReferente() : null;
	}

	/**
	 * Verifica che i profili dell'API siano compatibili con il suo profilo di interoperabilità GovWay.
	 * Le API erogate dal soggetto aderente non sono verificate: l'aderente non è noto alla creazione.
	 */
	public void checkProfili(ApiEntity api) {
		if(!RUOLO.EROGATO_SOGGETTO_DOMINIO.equals(api.getRuolo()) || api.getAuthType() == null || api.getAuthType().isEmpty()) {
			return;
		}

		String profiloGovwayApi = getProfiloGovway(api);
		if(profiloGovwayApi == null) {
			return;
		}

		for(AuthTypeEntity authType: api.getAuthType()) {
			Optional<ConfigurazioneProfilo> profilo = this.configurazione.getServizio().getApi().getProfili()
					.stream()
					.filter(p -> p.getCodiceInterno().equals(authType.getProfilo()))
					.findAny();

			if(profilo.isPresent() && profilo.get().getProfiloGovway() != null
					&& !isEquivalente(profilo.get().getProfiloGovway(), profiloGovwayApi)) {
				throw new BadRequestException(ErrorCode.VAL_422_PROFILO_GOVWAY, Map.of(
						"profilo", authType.getProfilo(),
						"profiloGovwayProfilo", profilo.get().getProfiloGovway(),
						"profiloGovwayApi", profiloGovwayApi));
			}
		}
	}

	public static boolean isEquivalente(String profilo1, String profilo2) {
		return normalizza(profilo1).equals(normalizza(profilo2));
	}

	private static String normalizza(String profilo) {
		return MODI.equals(profilo) ? TipoSoggettoGateway.MOD_IPA.getValue() : profilo;
	}

	private static boolean isBlank(String s) {
		return s == null || s.isBlank();
	}
}
