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
package org.govway.catalogo.monitoraggioutils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.PackageServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.services.ProfiloGovwayService;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneApi;
import org.govway.catalogo.servlets.model.ConfigurazioneMonitoraggio;
import org.govway.catalogo.servlets.model.ConfigurazioneProfilo;
import org.govway.catalogo.servlets.model.ConfigurazioneServizio;
import org.govway.catalogo.servlets.model.ConfigurazioneSoggetto;
import org.govway.catalogo.servlets.model.TipoSoggettoGateway;
import org.junit.jupiter.api.Test;

/**
 * Profilo di interoperabilità GovWay usato da transazioni e statistiche (Issue 440): override del
 * gestore sull'API, poi la stessa logica del batch di configurazione (tipo gateway del soggetto,
 * profilo_govway dei profili delle API del servizio, soggetto.profilo_gateway_default,
 * monitoraggio.profilo_govway_default).
 */
class FiltriUtilsGetProfiloTest {

	private static final String SOGGETTO = "Ente";
	private static final String INTERNO = "INTERNO_HTTPS";
	private static final String MODI = "MODI_P1";
	private static final String NON_MAPPATO = "NON_MAPPATO";

	private final ServizioService servizioService = mock(ServizioService.class);
	private final ApiService apiService = mock(ApiService.class);
	private final SoggettoService soggettoService = mock(SoggettoService.class);
	private final ProfiloGovwayService profiloGovwayService = mock(ProfiloGovwayService.class);

	private long sequenza = 1;

	private FiltriUtils filtriUtils(ServizioEntity servizio, String tipoGatewaySoggetto,
			TipoSoggettoGateway profiloGatewayDefault, String profiloGovwayDefaultMonitoraggio) throws Exception {

		when(this.servizioService.find(any())).thenReturn(Optional.of(servizio));
		when(this.servizioService.runTransaction(any(Supplier.class)))
				.thenAnswer(inv -> ((Supplier<?>) inv.getArgument(0)).get());

		SoggettoEntity soggetto = new SoggettoEntity();
		soggetto.setNome(SOGGETTO);
		soggetto.setTipoGateway(tipoGatewaySoggetto);
		when(this.soggettoService.findByNome(SOGGETTO)).thenReturn(Optional.of(soggetto));
		when(this.soggettoService.findByNome("Sconosciuto")).thenReturn(Optional.empty());

		ConfigurazioneApi configurazioneApi = new ConfigurazioneApi();
		configurazioneApi.setProfili(List.of(
				new ConfigurazioneProfilo().codiceInterno(INTERNO).profiloGovway("APIGateway"),
				new ConfigurazioneProfilo().codiceInterno(MODI).profiloGovway("ModIPA"),
				new ConfigurazioneProfilo().codiceInterno(NON_MAPPATO)));
		ConfigurazioneServizio configurazioneServizio = new ConfigurazioneServizio();
		configurazioneServizio.setApi(configurazioneApi);

		ConfigurazioneSoggetto configurazioneSoggetto = new ConfigurazioneSoggetto();
		configurazioneSoggetto.setProfiloGatewayDefault(profiloGatewayDefault);

		ConfigurazioneMonitoraggio monitoraggio = new ConfigurazioneMonitoraggio();
		monitoraggio.setProfiloGovwayDefault(profiloGovwayDefaultMonitoraggio);

		Configurazione configurazione = new Configurazione();
		configurazione.setServizio(configurazioneServizio);
		configurazione.setSoggetto(configurazioneSoggetto);
		configurazione.setMonitoraggio(monitoraggio);

		FiltriUtils filtriUtils = new FiltriUtils();
		inject(filtriUtils, "servizioService", this.servizioService);
		inject(filtriUtils, "apiService", this.apiService);
		inject(filtriUtils, "soggettoService", this.soggettoService);
		inject(filtriUtils, "profiloGovwayService", this.profiloGovwayService);
		inject(filtriUtils, "configurazione", configurazione);
		return filtriUtils;
	}

	private FiltriUtils filtriUtils(ServizioEntity servizio, String tipoGatewaySoggetto) throws Exception {
		return filtriUtils(servizio, tipoGatewaySoggetto, TipoSoggettoGateway.API_GATEWAY, "ModI");
	}

	private static void inject(Object target, String fieldName, Object value) throws Exception {
		Field f = FiltriUtils.class.getDeclaredField(fieldName);
		f.setAccessible(true);
		f.set(target, value);
	}

	private ApiEntity api(String... profili) {
		ApiEntity api = new ApiEntity();
		api.setId(this.sequenza++);
		for (String profilo : profili) {
			AuthTypeEntity authType = new AuthTypeEntity();
			authType.setProfilo(profilo);
			api.getAuthType().add(authType);
		}
		when(this.apiService.find(any())).thenReturn(Optional.of(api));
		return api;
	}

	private static ServizioEntity servizio(ApiEntity... api) {
		ServizioEntity servizio = new ServizioEntity();
		servizio.setNome("Servizio");
		servizio.setVersione("1");
		servizio.getApi().addAll(List.of(api));
		return servizio;
	}

	@Test
	void profiloDeiProfiliSenzaTipoGatewayDelSoggetto() throws Exception {
		// Prima della Issue 440 le statistiche usavano sempre monitoraggio.profilo_govway_default (ModI)
		FiltriUtils filtriUtils = filtriUtils(servizio(api(INTERNO)), null);

		assertEquals("APIGateway", filtriUtils.getProfilo(UUID.randomUUID(), null, SOGGETTO));
	}

	@Test
	void tipoGatewayDelSoggettoPrevaleSulProfiloDeiProfili() throws Exception {
		FiltriUtils filtriUtils = filtriUtils(servizio(api(INTERNO)), "ModIPA");

		assertEquals("ModIPA", filtriUtils.getProfilo(UUID.randomUUID(), null, SOGGETTO));
	}

	@Test
	void overrideDelGestorePrevaleSuTutto() throws Exception {
		ApiEntity api = api(INTERNO);
		FiltriUtils filtriUtils = filtriUtils(servizio(api), "ModIPA");
		when(this.profiloGovwayService.getOverride(api)).thenReturn("SPCoop");

		assertEquals("SPCoop", filtriUtils.getProfilo(UUID.randomUUID(), null, SOGGETTO));
	}

	@Test
	void overrideDiUnaltraApiNonConsiderato() throws Exception {
		ApiEntity altra = api(INTERNO);
		ApiEntity monitorata = api(INTERNO); // ultima creata: restituita da apiService.find
		FiltriUtils filtriUtils = filtriUtils(servizio(altra, monitorata), null);
		when(this.profiloGovwayService.getOverride(altra)).thenReturn("SPCoop");

		assertEquals("APIGateway", filtriUtils.getProfilo(UUID.randomUUID(), UUID.randomUUID(), SOGGETTO));
	}

	@Test
	void profiliDiscordiTraLeApiDelServizioRicadonoSulDefaultDelSoggetto() throws Exception {
		// come il batch: il profilo dei profili è calcolato su tutte le API del servizio
		ApiEntity interna = api(INTERNO);
		ApiEntity modi = api(MODI);
		FiltriUtils filtriUtils = filtriUtils(servizio(interna, modi), null, TipoSoggettoGateway.SP_COOP, "ModI");

		assertEquals("SPCoop", filtriUtils.getProfilo(UUID.randomUUID(), UUID.randomUUID(), SOGGETTO));
	}

	@Test
	void senzaProfiloGovwaySiUsaIlDefaultDelSoggetto() throws Exception {
		FiltriUtils filtriUtils = filtriUtils(servizio(api(NON_MAPPATO)), null);

		assertEquals("APIGateway", filtriUtils.getProfilo(UUID.randomUUID(), null, SOGGETTO));
	}

	@Test
	void senzaDefaultDelSoggettoSiUsaQuelloDelMonitoraggio() throws Exception {
		FiltriUtils filtriUtils = filtriUtils(servizio(api(NON_MAPPATO)), null, null, "ModI");

		assertEquals("ModI", filtriUtils.getProfilo(UUID.randomUUID(), null, SOGGETTO));
	}

	@Test
	void packageUsaLeApiDeiServiziComponenti() throws Exception {
		ServizioEntity componente = servizio(api(MODI));
		PackageServizioEntity pse = new PackageServizioEntity();
		pse.setServizio(componente);

		ServizioEntity pacchetto = servizio();
		pacchetto.set_package(true);
		pacchetto.getComponenti().add(pse);

		FiltriUtils filtriUtils = filtriUtils(pacchetto, null);

		assertEquals("ModIPA", filtriUtils.getProfilo(UUID.randomUUID(), UUID.randomUUID(), SOGGETTO));
	}

	@Test
	void soggettoInesistente() throws Exception {
		FiltriUtils filtriUtils = filtriUtils(servizio(api(INTERNO)), null);

		assertThrows(NotFoundException.class, () -> filtriUtils.getProfilo(UUID.randomUUID(), null, "Sconosciuto"));
	}
}
