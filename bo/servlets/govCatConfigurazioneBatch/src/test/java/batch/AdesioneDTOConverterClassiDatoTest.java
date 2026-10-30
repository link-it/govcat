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
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.EstensioneAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * Classi dato delle proprietà custom dell'adesione passate al configuratore. Le classi
 * collaudo_pdnd e produzione_pdnd portano i dati del singolo adesore dei profili di fruizione
 * PDND (finalità e quota) e prima venivano scartate insieme a quelle dell'altro ambiente.
 */
class AdesioneDTOConverterClassiDatoTest {

	private static final String CONFIG = """
			{
			  "adesione": {
			    "proprieta_custom": [
			      { "nome_gruppo": "PDNDCollaudo",      "label_gruppo": "PDND", "classe_dato": "collaudo_pdnd",    "proprieta": [] },
			      { "nome_gruppo": "PDNDProduzione",    "label_gruppo": "PDND", "classe_dato": "produzione_pdnd",  "proprieta": [] },
			      { "nome_gruppo": "RateCollaudo",      "label_gruppo": "RL",   "classe_dato": "collaudo",         "proprieta": [] },
			      { "nome_gruppo": "RateProduzione",    "label_gruppo": "RL",   "classe_dato": "produzione",       "proprieta": [] },
			      { "nome_gruppo": "Identificativo",    "label_gruppo": "Id",   "classe_dato": "identificativo",   "proprieta": [] },
			      { "nome_gruppo": "Configurato",       "label_gruppo": "Cfg",  "classe_dato": "collaudo_configurato", "proprieta": [] }
			    ]
			  }
			}
			""";

	@TempDir
	Path tempDir;

	private AdesioneDTOConverter converter(AmbienteEnum ambiente) throws Exception {
		Path file = tempDir.resolve("configurazione-" + UUID.randomUUID() + ".json");
		Files.writeString(file, CONFIG);

		AdesioneEntity adesione = new AdesioneEntity();
		adesione.setStato(ambiente == AmbienteEnum.COLLAUDO ? "collaudo_in_configurazione" : "produzione_in_configurazione");

		ServizioEntity servizio = new ServizioEntity();
		DominioEntity dominio = new DominioEntity();
		dominio.setSoggettoReferente(new SoggettoEntity());
		servizio.setDominio(dominio);
		adesione.setServizio(servizio);

		List<EstensioneAdesioneEntity> estensioni = new ArrayList<>();
		for (String gruppo : List.of("PDNDCollaudo", "PDNDProduzione", "RateCollaudo", "RateProduzione",
				"Identificativo", "Configurato")) {
			EstensioneAdesioneEntity estensione = new EstensioneAdesioneEntity();
			estensione.setGruppo(gruppo);
			estensione.setNome("proprieta");
			estensione.setValore("valore-" + gruppo);
			estensioni.add(estensione);
		}
		adesione.setEstensioni(estensioni);

		AdesioneDTOConverter converter = new AdesioneDTOConverter(adesione, file.toString());
		converter.setDto(new DTOAdesione(null, null, null, null, null, null, null, null));

		Field f = AdesioneDTOConverter.class.getDeclaredField("ambienteConfigurazione");
		f.setAccessible(true);
		f.set(converter, ambiente);

		return converter;
	}

	@Test
	void inCollaudoPassanoLeClassiDatoDiCollaudoCompresaLaPdnd() throws Exception {
		Map<String, String> estensioni = converter(AmbienteEnum.COLLAUDO).setEstensioniAdesione(null, 0);

		assertTrue(estensioni.containsKey("PDNDCollaudo.proprieta"), estensioni.toString());
		assertTrue(estensioni.containsKey("RateCollaudo.proprieta"), estensioni.toString());
		assertTrue(estensioni.containsKey("Identificativo.proprieta"), estensioni.toString());

		assertFalse(estensioni.containsKey("PDNDProduzione.proprieta"), estensioni.toString());
		assertFalse(estensioni.containsKey("RateProduzione.proprieta"), estensioni.toString());
		// le classi dato non previste restano escluse
		assertFalse(estensioni.containsKey("Configurato.proprieta"), estensioni.toString());

		assertEquals("valore-PDNDCollaudo", estensioni.get("PDNDCollaudo.proprieta"));
	}

	@Test
	void inProduzionePassanoLeClassiDatoDiProduzioneCompresaLaPdnd() throws Exception {
		Map<String, String> estensioni = converter(AmbienteEnum.PRODUZIONE).setEstensioniAdesione(null, 0);

		assertTrue(estensioni.containsKey("PDNDProduzione.proprieta"), estensioni.toString());
		assertTrue(estensioni.containsKey("RateProduzione.proprieta"), estensioni.toString());

		assertFalse(estensioni.containsKey("PDNDCollaudo.proprieta"), estensioni.toString());
		assertFalse(estensioni.containsKey("RateCollaudo.proprieta"), estensioni.toString());
	}

	@Test
	void ilFiltroAccettaSoloLeClassiDatoPreviste() throws Exception {
		AdesioneDTOConverter converter = converter(AmbienteEnum.COLLAUDO);

		assertTrue(converter.isClasseDatoConfigurabile("collaudo"));
		assertTrue(converter.isClasseDatoConfigurabile("collaudo_pdnd"));
		assertTrue(converter.isClasseDatoConfigurabile("identificativo"));
		assertTrue(converter.isClasseDatoConfigurabile("specifica"));
		assertTrue(converter.isClasseDatoConfigurabile("generico"));
		assertTrue(converter.isClasseDatoConfigurabile("referenti"));

		assertFalse(converter.isClasseDatoConfigurabile("produzione"));
		assertFalse(converter.isClasseDatoConfigurabile("produzione_pdnd"));
		assertFalse(converter.isClasseDatoConfigurabile("collaudo_configurato"));
		assertFalse(converter.isClasseDatoConfigurabile("api"));
	}
}
