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
package org.govway.catalogo.pdnd;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.lang.reflect.Method;
import java.util.Arrays;

import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Verifica i path dell'API PDND esposta dal catalogo, generati dal contratto
 * {@code openapi_pdnd.yaml}.
 */
class PdndContrattoEspostoTest {

	/**
	 * Una sequenza {@code //} nel path rende l'operazione irraggiungibile: il container la
	 * rifiuta con 400 e il path normalizzato non corrisponde ad alcun mapping.
	 */
	@Test
	void nessunPathEspostoContieneUnaSequenzaDiSlash() {
		for(Class<?> api: Arrays.asList(org.govway.catalogo.servlets.pdnd.server.api.GatewayApi.class,
				org.govway.catalogo.servlets.pdnd.server.api.HealthApi.class)) {

			for(Method metodo: api.getMethods()) {
				RequestMapping mapping = metodo.getAnnotation(RequestMapping.class);
				if(mapping == null) {
					continue;
				}

				for(String path: mapping.value()) {
					assertFalse(path.contains("//"), "il path esposto da [" + metodo.getName() + "] contiene una sequenza di slash: " + path);
				}
			}
		}
	}

	@Test
	void gliEServiceDiUnaOrganizzazioneSonoEspostiSulPathAtteso() throws NoSuchMethodException {
		Method metodo = org.govway.catalogo.servlets.pdnd.server.api.GatewayApi.class.getMethod("getOrganizationEServices",
				org.govway.catalogo.servlets.pdnd.model.AmbienteEnum.class, String.class, String.class, String.class, String.class);

		assertEquals("/{ambiente}/organizations/origin/{origin}/externalId/{externalId}/eservices",
				metodo.getAnnotation(RequestMapping.class).value()[0]);
	}
}
