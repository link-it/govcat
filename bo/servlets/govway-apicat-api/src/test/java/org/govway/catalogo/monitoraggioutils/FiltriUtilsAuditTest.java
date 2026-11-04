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

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.EstensioneApiEntity;
import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneMonitoraggio;
import org.govway.catalogo.servlets.model.ConfigurazioneProprietaAudit;
import org.govway.catalogo.servlets.monitor.model.AmbienteEnum;
import org.junit.jupiter.api.Test;

/**
 * Abilitazione del monitoraggio di audit per API e ambiente (Issue 404): un'API ha l'audit in un ambiente
 * se almeno una delle proprietà configurate in monitoraggio.proprieta_audit per quell'ambiente è valorizzata.
 */
class FiltriUtilsAuditTest {

	private static final List<ConfigurazioneProprietaAudit> PROPRIETA_AUDIT = List.of(
			proprietaAudit("PDNDCollaudo", "audit", org.govway.catalogo.servlets.model.AmbienteEnum.COLLAUDO),
			proprietaAudit("PDNDProduzione", "audit", org.govway.catalogo.servlets.model.AmbienteEnum.PRODUZIONE));

	private static ConfigurazioneProprietaAudit proprietaAudit(String gruppo, String nome, org.govway.catalogo.servlets.model.AmbienteEnum ambiente) {
		ConfigurazioneProprietaAudit p = new ConfigurazioneProprietaAudit();
		p.setNomeGruppo(gruppo);
		p.setNomeProprieta(nome);
		p.setAmbiente(ambiente);
		return p;
	}

	private static EstensioneApiEntity estensione(String gruppo, String nome, String valore) {
		EstensioneApiEntity e = new EstensioneApiEntity();
		e.setGruppo(gruppo);
		e.setNome(nome);
		e.setValore(valore);
		return e;
	}

	@Test
	void abilitata_soloNellAmbienteDellaProprieta() {
		List<EstensioneApiEntity> estensioni = List.of(estensione("PDNDCollaudo", "audit", "audit01"));

		assertTrue(FiltriUtils.isAuditAbilitato(PROPRIETA_AUDIT, estensioni, AmbienteEnum.COLLAUDO));
		assertFalse(FiltriUtils.isAuditAbilitato(PROPRIETA_AUDIT, estensioni, AmbienteEnum.PRODUZIONE));
	}

	@Test
	void nonAbilitata_proprietaVuotaOAltroGruppo() {
		assertFalse(FiltriUtils.isAuditAbilitato(PROPRIETA_AUDIT, List.of(estensione("PDNDCollaudo", "audit", " ")), AmbienteEnum.COLLAUDO));
		assertFalse(FiltriUtils.isAuditAbilitato(PROPRIETA_AUDIT, List.of(estensione("PDNDCollaudo", "audit", null)), AmbienteEnum.COLLAUDO));
		assertFalse(FiltriUtils.isAuditAbilitato(PROPRIETA_AUDIT, List.of(estensione("AltroGruppo", "audit", "audit01")), AmbienteEnum.COLLAUDO));
		assertFalse(FiltriUtils.isAuditAbilitato(PROPRIETA_AUDIT, List.of(estensione("PDNDCollaudo", "altra", "audit01")), AmbienteEnum.COLLAUDO));
	}

	@Test
	void nonAbilitata_senzaConfigurazione() {
		List<EstensioneApiEntity> estensioni = List.of(estensione("PDNDCollaudo", "audit", "audit01"));

		assertFalse(FiltriUtils.isAuditAbilitato(null, estensioni, AmbienteEnum.COLLAUDO));
		assertFalse(FiltriUtils.isAuditAbilitato(List.of(), estensioni, AmbienteEnum.COLLAUDO));
	}

	@Test
	void checkApiAudit_perIdApi() throws Exception {
		ApiEntity api = new ApiEntity();
		api.setNome("TestPDNDRestAudit");
		api.setVersione(1);
		api.getEstensioni().add(estensione("PDNDProduzione", "audit", "audit02"));

		FiltriUtils filtriUtils = buildFiltriUtils(api);
		UUID idApi = UUID.randomUUID();

		assertDoesNotThrow(() -> filtriUtils.checkApiAudit(idApi, AmbienteEnum.PRODUZIONE));

		BadRequestException e = assertThrows(BadRequestException.class, () -> filtriUtils.checkApiAudit(idApi, AmbienteEnum.COLLAUDO));
		assertEquals(ErrorCode.MON_400_AUDIT_API, e.getErrorCode());
		assertEquals("TestPDNDRestAudit", e.getParameters().get("nomeApi"));
		assertEquals("1", e.getParameters().get("versioneApi"));
		assertEquals("collaudo", e.getParameters().get("ambiente"));
	}

	private FiltriUtils buildFiltriUtils(ApiEntity api) throws Exception {
		FiltriUtils filtriUtils = new FiltriUtils();

		ApiService apiService = mock(ApiService.class);
		when(apiService.find(any())).thenReturn(Optional.of(api));
		// runTransaction esegue direttamente il runnable (nessuna transazione reale nei test).
		doAnswer(inv -> {
			((Runnable) inv.getArgument(0)).run();
			return null;
		}).when(apiService).runTransaction(any(Runnable.class));

		ConfigurazioneMonitoraggio monitoraggio = new ConfigurazioneMonitoraggio();
		monitoraggio.setAuditAbilitato(true);
		monitoraggio.setProprietaAudit(PROPRIETA_AUDIT);
		Configurazione configurazione = new Configurazione();
		configurazione.setMonitoraggio(monitoraggio);

		inject(filtriUtils, "apiService", apiService);
		inject(filtriUtils, "configurazione", configurazione);
		return filtriUtils;
	}

	private static void inject(Object target, String fieldName, Object value) throws Exception {
		Field f = FiltriUtils.class.getDeclaredField(fieldName);
		f.setAccessible(true);
		f.set(target, value);
	}
}
