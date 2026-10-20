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

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.govway.catalogo.core.orm.entity.PackageServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Dato obbligatorio "produzione" di un package: almeno un servizio componente deve essere
 * pubblicato in produzione, anche se ci e' arrivato con il percorso senza collaudo.
 */
class PackageAuthorizationTest {

	private final PackageAuthorization authorization = new PackageAuthorization();

	private ServizioEntity buildPackage(String statoComponente) {
		ServizioEntity _package = new ServizioEntity();
		_package.set_package(true);

		ServizioEntity componente = new ServizioEntity();
		componente.setStato(statoComponente);

		PackageServizioEntity pse = new PackageServizioEntity();
		pse.set_package(_package);
		pse.setServizio(componente);
		_package.getComponenti().add(pse);
		return _package;
	}

	@Test
	@DisplayName("Produzione: componente pubblicato in produzione")
	void produzioneComponentePubblicatoProduzione() {
		ServizioEntity _package = buildPackage("pubblicato_produzione");

		assertDoesNotThrow(() -> authorization.checkCampiObbligatori(List.of(ConfigurazioneClasseDato.PRODUZIONE),
				_package, "richiesto_produzione"));
	}

	@Test
	@DisplayName("Produzione: componente pubblicato in produzione senza collaudo")
	void produzioneComponentePubblicatoProduzioneSenzaCollaudo() {
		ServizioEntity _package = buildPackage("pubblicato_produzione_senza_collaudo");

		assertDoesNotThrow(() -> authorization.checkCampiObbligatori(List.of(ConfigurazioneClasseDato.PRODUZIONE),
				_package, "richiesto_produzione_senza_collaudo"));
	}

	@Test
	@DisplayName("Produzione: nessun componente pubblicato in produzione")
	void produzioneNessunComponentePubblicato() {
		ServizioEntity _package = buildPackage("pubblicato_collaudo");

		UpdateEntitaComplessaNonValidaSemanticamenteException e = assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class,
				() -> authorization.checkCampiObbligatori(List.of(ConfigurazioneClasseDato.PRODUZIONE),
						_package, "richiesto_produzione"));

		assertTrue(e.getErrori().stream()
				.flatMap(err -> err.getCampi().stream())
				.anyMatch(c -> "servizio_pubblicato_produzione_non_presente".equals(c.getNomeCampo())));
	}
}
