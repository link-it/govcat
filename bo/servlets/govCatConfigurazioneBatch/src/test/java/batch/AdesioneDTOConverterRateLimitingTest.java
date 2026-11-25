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
package batch;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.dto.DTOApi;
import org.govway.catalogo.core.dto.DTOQuotaRateLimiting;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneRateLimitingEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity.AuthType;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.EstensioneAdesioneEntity;
import org.govway.catalogo.core.orm.entity.RateLimitingPeriodo;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * Issue 446: il converter riporta nel DTO dell'API le quote di rate limiting dell'aderente
 * nell'ambiente di configurazione e la finalità PDND letta dalla proprietà custom indicata in
 * adesione.rate_limiting.finalita.
 */
class AdesioneDTOConverterRateLimitingTest {

	private static final String GRUPPO = "PDNDCollaudo";
	private static final String PROPRIETA = "finalita";
	private static final String FINALITA = "3f2a1b4c-5d6e-7f80-9a1b-2c3d4e5f6071";
	private static final String PROFILO = "MTLS";

	private static final String CONFIG_BASE = """
			"soggetto": { "profilo_gateway_default": "APIGateway" },
			"monitoraggio": { "profilo_govway_default": "APIGateway" }
			""";

	private static final String CONFIG_CON_FINALITA = "{" + CONFIG_BASE + """
			, "adesione": {
			    "rate_limiting": {
			      "finalita": { "collaudo": { "nome_gruppo": "PDNDCollaudo", "nome_proprieta": "finalita" } }
			    },
			    "proprieta_custom": [
			      { "nome_gruppo": "PDNDCollaudo", "classe_dato": "collaudo_pdnd", "proprieta": [ { "nome": "finalita" } ] }
			    ]
			  }
			}
			""";

	private static final String CONFIG_SENZA_FINALITA = "{" + CONFIG_BASE + """
			, "adesione": {
			    "proprieta_custom": [
			      { "nome_gruppo": "PDNDCollaudo", "classe_dato": "collaudo_pdnd", "proprieta": [ { "nome": "finalita" } ] }
			    ]
			  }
			}
			""";

	@TempDir
	Path tempDir;

	private String pathConfigurazione(String config) throws Exception {
		Path file = tempDir.resolve("configurazione-" + UUID.randomUUID() + ".json");
		Files.writeString(file, config);
		return file.toString();
	}

	private static SoggettoEntity soggetto(String nome) {
		SoggettoEntity soggetto = new SoggettoEntity();
		soggetto.setNome(nome);
		return soggetto;
	}

	private static ApiEntity api(String nome) {
		ApiConfigEntity collaudo = new ApiConfigEntity();
		collaudo.setProtocollo(ApiEntity.PROTOCOLLO.OPENAPI_3);

		ApiEntity api = new ApiEntity();
		api.setNome(nome);
		api.setVersione(1);
		api.setRuolo(ApiEntity.RUOLO.EROGATO_SOGGETTO_DOMINIO);
		api.setCollaudo(collaudo);
		api.setEstensioni(new ArrayList<>());

		AuthTypeEntity authType = new AuthTypeEntity();
		authType.setProfilo(PROFILO);
		authType.setResources("GET /risorsa".getBytes());
		api.setAuthType(new ArrayList<>(List.of(authType)));
		return api;
	}

	/** Adesione in configurazione in collaudo a un servizio di erogazione con le API indicate. */
	private static AdesioneEntity adesione(ApiEntity... api) {
		DominioEntity dominio = new DominioEntity();
		dominio.setSoggettoReferente(soggetto("REFERENTE_DOMINIO"));

		ServizioEntity servizio = new ServizioEntity();
		servizio.setFruizione(false);
		servizio.setDominio(dominio);
		servizio.setApi(new HashSet<>(Set.of(api)));

		AdesioneEntity adesione = new AdesioneEntity();
		adesione.setIdAdesione(UUID.randomUUID().toString());
		adesione.setStato("collaudo_in_configurazione");
		adesione.setServizio(servizio);
		adesione.setSoggetto(soggetto("ADERENTE"));

		ClientEntity client = new ClientEntity();
		client.setNome("ClientDiProva");
		client.setAuthType(AuthType.HTTPS);
		client.setEstensioni(new HashSet<>());
		ClientAdesioneEntity clientAdesione = new ClientAdesioneEntity();
		clientAdesione.setProfilo(PROFILO);
		clientAdesione.setAmbiente(AmbienteEnum.COLLAUDO);
		clientAdesione.setClient(client);
		adesione.setClient(new HashSet<>(Set.of(clientAdesione)));

		return adesione;
	}

	private static void quota(AdesioneEntity adesione, ApiEntity api, AmbienteEnum ambiente, RateLimitingPeriodo periodo, int quota) {
		AdesioneRateLimitingEntity rl = new AdesioneRateLimitingEntity();
		rl.setAdesione(adesione);
		rl.setApi(api);
		rl.setAmbiente(ambiente);
		rl.setPeriodo(periodo);
		rl.setQuota(quota);
		adesione.getRateLimiting().add(rl);
	}

	private static void finalita(AdesioneEntity adesione, ApiEntity api, AmbienteEnum ambiente, String valore) {
		EstensioneAdesioneEntity estensione = new EstensioneAdesioneEntity();
		estensione.setAdesione(adesione);
		estensione.setApi(api);
		estensione.setAmbiente(ambiente);
		estensione.setGruppo(GRUPPO);
		estensione.setNome(PROPRIETA);
		estensione.setValore(valore);
		adesione.getEstensioni().add(estensione);
	}

	private DTOAdesione converti(AdesioneEntity adesione, String config) throws Exception {
		String path = pathConfigurazione(config);
		SoggettoDTOFactory factory = new SoggettoDTOFactory();
		Field f = SoggettoDTOFactory.class.getDeclaredField("configurazioneJsonPath");
		f.setAccessible(true);
		f.set(factory, path);

		AdesioneDTOConverter converter = new AdesioneDTOConverter(adesione, path);
		converter.setDto(new DTOAdesione(null, null, null, null, null, null, null, null));
		return converter.converter(factory);
	}

	private static DTOApi dtoApi(DTOAdesione dto, String nome) {
		return dto.getApi().stream().filter(a -> a.getNomeApi().equals(nome)).findAny().orElseThrow();
	}

	@Test
	void quoteDellApiNellAmbienteDiConfigurazione() throws Exception {
		ApiEntity api = api("ApiDiProva");
		ApiEntity altra = api("AltraApi");
		AdesioneEntity adesione = adesione(api, altra);
		quota(adesione, api, AmbienteEnum.COLLAUDO, RateLimitingPeriodo.GIORNO, 100);
		quota(adesione, api, AmbienteEnum.COLLAUDO, RateLimitingPeriodo.MINUTO, 2);
		quota(adesione, api, AmbienteEnum.PRODUZIONE, RateLimitingPeriodo.GIORNO, 999);
		quota(adesione, altra, AmbienteEnum.COLLAUDO, RateLimitingPeriodo.ORA, 7);

		DTOAdesione dto = converti(adesione, CONFIG_SENZA_FINALITA);

		Map<DTOQuotaRateLimiting.PERIODO, Integer> quote = dtoApi(dto, "ApiDiProva").getRateLimiting().stream()
				.collect(Collectors.toMap(DTOQuotaRateLimiting::getPeriodo, DTOQuotaRateLimiting::getQuota));
		assertEquals(Map.of(DTOQuotaRateLimiting.PERIODO.GIORNO, 100, DTOQuotaRateLimiting.PERIODO.MINUTO, 2), quote);
		assertEquals(1, dtoApi(dto, "AltraApi").getRateLimiting().size());
	}

	@Test
	void finalitaDellAdesioneDallaProprietaConfigurata() throws Exception {
		ApiEntity api = api("ApiDiProva");
		AdesioneEntity adesione = adesione(api);
		finalita(adesione, null, AmbienteEnum.COLLAUDO, " " + FINALITA + " ");
		finalita(adesione, null, AmbienteEnum.PRODUZIONE, "finalita-di-produzione");

		DTOApi dto = dtoApi(converti(adesione, CONFIG_CON_FINALITA), "ApiDiProva");

		assertTrue(dto.isFinalitaConfigurata());
		assertEquals(FINALITA, dto.getFinalita());
		assertTrue(dto.getRateLimiting().isEmpty());
	}

	@Test
	void finalitaSpecificaPerApiPrevaleSuQuellaDellAdesione() throws Exception {
		ApiEntity api = api("ApiDiProva");
		ApiEntity altra = api("AltraApi");
		AdesioneEntity adesione = adesione(api, altra);
		finalita(adesione, null, AmbienteEnum.COLLAUDO, "finalita-adesione");
		finalita(adesione, api, AmbienteEnum.COLLAUDO, FINALITA);

		DTOAdesione dto = converti(adesione, CONFIG_CON_FINALITA);

		assertEquals(FINALITA, dtoApi(dto, "ApiDiProva").getFinalita());
		assertEquals("finalita-adesione", dtoApi(dto, "AltraApi").getFinalita());
	}

	@Test
	void finalitaConfigurataMaNonValorizzata() throws Exception {
		AdesioneEntity adesione = adesione(api("ApiDiProva"));
		adesione.setEstensioni(null);

		DTOApi dto = dtoApi(converti(adesione, CONFIG_CON_FINALITA), "ApiDiProva");

		assertTrue(dto.isFinalitaConfigurata());
		assertNull(dto.getFinalita());
	}

	@Test
	void finalitaNonConfigurataInConfigurazione() throws Exception {
		AdesioneEntity adesione = adesione(api("ApiDiProva"));
		finalita(adesione, null, AmbienteEnum.COLLAUDO, FINALITA);

		DTOApi dto = dtoApi(converti(adesione, CONFIG_SENZA_FINALITA), "ApiDiProva");

		assertFalse(dto.isFinalitaConfigurata());
		assertNull(dto.getFinalita());
	}
}
