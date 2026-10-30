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
import static org.junit.jupiter.api.Assertions.assertNull;

import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.dto.DTOAdesioneAPI;
import org.govway.catalogo.core.dto.DTOApi;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity.AuthType;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.EstensioneApiEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * Token policy GovWay e profilo di interoperabilità ricavati dalla configurazione: il profilo di
 * autenticazione dichiara con proprieta_token_policy quale proprietà custom dell'API contiene la
 * policy, e con profilo_govway il profilo di interoperabilità da usare quando il soggetto non lo
 * definisce.
 */
class AdesioneDTOConverterTokenPolicyTest {

	private static final String GRUPPO_TOKEN_POLICY = "TokenPolicyGovway";
	private static final String PROPRIETA_TOKEN_POLICY = "token_policy";
	private static final String CLIENT_ID = "b3b1a0e2-1111-2222-3333-444455556666";

	private static final String CONFIG = """
			{
			  "soggetto": { "profilo_gateway_default": "SPCoop" },
			  "servizio": {
			    "api": {
			      "profili": [
			        {
			          "codice_interno": "OAUTH_CC",
			          "etichetta": "OAuth Client Credentials",
			          "auth_type": "pdnd",
			          "profilo_govway": "APIGateway",
			          "proprieta_token_policy": {
			            "nome_gruppo": "TokenPolicyGovway",
			            "nome_proprieta": "token_policy"
			          }
			        },
			        {
			          "codice_interno": "PDND",
			          "etichetta": "PDND",
			          "auth_type": "pdnd",
			          "profilo_govway": "APIGateway"
			        }
			      ]
			    }
			  },
			  "monitoraggio": { "profilo_govway_default": "ModI" }
			}
			""";

	@TempDir
	Path tempDir;

	private String configurazione;

	private String pathConfigurazione() throws Exception {
		if (this.configurazione == null) {
			Path file = tempDir.resolve("configurazione-" + UUID.randomUUID() + ".json");
			Files.writeString(file, CONFIG);
			this.configurazione = file.toString();
		}
		return this.configurazione;
	}

	private SoggettoDTOFactory soggettoDTOFactory() throws Exception {
		SoggettoDTOFactory factory = new SoggettoDTOFactory();
		Field f = SoggettoDTOFactory.class.getDeclaredField("configurazioneJsonPath");
		f.setAccessible(true);
		f.set(factory, pathConfigurazione());
		return factory;
	}

	private static SoggettoEntity soggetto(String nome) {
		SoggettoEntity soggetto = new SoggettoEntity();
		soggetto.setNome(nome);
		return soggetto;
	}

	private static ClientEntity client(String nome) {
		ClientEntity client = new ClientEntity();
		client.setNome(nome);
		client.setAuthType(AuthType.PDND);

		EstensioneClientEntity clientId = new EstensioneClientEntity();
		clientId.setNome("client_id");
		clientId.setValore(CLIENT_ID);
		client.setEstensioni(new HashSet<>(Set.of(clientId)));

		return client;
	}

	/**
	 * Adesione minima a un servizio di erogazione con una sola API, un solo profilo di
	 * autenticazione e un solo client.
	 *
	 * @param profilo codice interno del profilo di autenticazione dell'API
	 * @param estensioniApi proprietà custom dell'API
	 */
	private static AdesioneEntity adesione(String profilo, List<EstensioneApiEntity> estensioniApi) {
		ApiConfigEntity collaudo = new ApiConfigEntity();
		collaudo.setProtocollo(ApiEntity.PROTOCOLLO.OPENAPI_3);

		ApiEntity api = new ApiEntity();
		api.setNome("ApiDiProva");
		api.setVersione(1);
		api.setRuolo(ApiEntity.RUOLO.EROGATO_SOGGETTO_DOMINIO);
		api.setCollaudo(collaudo);
		api.setEstensioni(new ArrayList<>(estensioniApi));

		AuthTypeEntity authType = new AuthTypeEntity();
		authType.setProfilo(profilo);
		authType.setResources("GET /risorsa".getBytes());
		api.setAuthType(new ArrayList<>(List.of(authType)));

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
		adesione.setEstensioni(null);

		ClientAdesioneEntity clientAdesione = new ClientAdesioneEntity();
		clientAdesione.setProfilo(profilo);
		clientAdesione.setAmbiente(AmbienteEnum.COLLAUDO);
		clientAdesione.setClient(client("ClientDiProva"));
		adesione.setClient(new HashSet<>(Set.of(clientAdesione)));

		return adesione;
	}

	private static EstensioneApiEntity estensione(String gruppo, String nome, String valore) {
		EstensioneApiEntity estensione = new EstensioneApiEntity();
		estensione.setGruppo(gruppo);
		estensione.setNome(nome);
		estensione.setValore(valore);
		return estensione;
	}

	private DTOAdesione converti(AdesioneEntity adesione) throws Exception {
		AdesioneDTOConverter converter = new AdesioneDTOConverter(adesione, pathConfigurazione());
		converter.setDto(new DTOAdesione(null, null, null, null, null, null, null, null));
		return converter.converter(soggettoDTOFactory());
	}

	private static DTOAdesioneAPI unicaAdesioneApi(DTOAdesione dto) {
		assertEquals(1, dto.getApi().size());
		DTOApi api = dto.getApi().get(0);
		assertEquals(1, api.getDTOAdesioneApi().size());
		return api.getDTOAdesioneApi().get(0);
	}

	@Test
	void tokenPolicyLettaDallaProprietaCustomDellApi() throws Exception {
		AdesioneEntity adesione = adesione("OAUTH_CC",
				List.of(estensione(GRUPPO_TOKEN_POLICY, PROPRIETA_TOKEN_POLICY, "PolicyOauthCC")));

		DTOAdesioneAPI adesioneApi = unicaAdesioneApi(converti(adesione));

		assertEquals("OAUTH_CC", adesioneApi.getProfilo());
		assertEquals("PolicyOauthCC", adesioneApi.getTokenPolicy());
	}

	@Test
	void tokenPolicyNullaSeIlProfiloNonReferenziaLaProprieta() throws Exception {
		// il profilo PDND non dichiara proprieta_token_policy: la proprietà custom viene ignorata
		AdesioneEntity adesione = adesione("PDND",
				List.of(estensione(GRUPPO_TOKEN_POLICY, PROPRIETA_TOKEN_POLICY, "PolicyOauthCC")));

		assertNull(unicaAdesioneApi(converti(adesione)).getTokenPolicy());
	}

	@Test
	void tokenPolicyNullaSeLApiNonValorizzaLaProprieta() throws Exception {
		AdesioneEntity adesione = adesione("OAUTH_CC", List.of());

		assertNull(unicaAdesioneApi(converti(adesione)).getTokenPolicy());
	}

	@Test
	void tokenPolicyNullaSeIlGruppoNonCoincide() throws Exception {
		AdesioneEntity adesione = adesione("OAUTH_CC",
				List.of(estensione("AltroGruppo", PROPRIETA_TOKEN_POLICY, "PolicyOauthCC")));

		assertNull(unicaAdesioneApi(converti(adesione)).getTokenPolicy());
	}

	@Test
	void tokenPolicyNullaSeIlValoreEVuoto() throws Exception {
		AdesioneEntity adesione = adesione("OAUTH_CC",
				List.of(estensione(GRUPPO_TOKEN_POLICY, PROPRIETA_TOKEN_POLICY, "   ")));

		assertNull(unicaAdesioneApi(converti(adesione)).getTokenPolicy());
	}

	@Test
	void profiloDelSoggettoRicavatoDalProfiloGovwayDelProfilo() throws Exception {
		// il soggetto non ha tipo gateway: vince profilo_govway del profilo (APIGateway) e non
		// soggetto.profilo_gateway_default (SPCoop) né monitoraggio.profilo_govway_default (ModI)
		AdesioneEntity adesione = adesione("OAUTH_CC", List.of());

		DTOAdesione dto = converti(adesione);

		assertEquals("APIGateway", dto.getSoggettoAderente().getTipoGateway());
		assertEquals("APIGateway", dto.getSoggettoErogatore().getTipoGateway());
	}

	@Test
	void tipoGatewayDelSoggettoPrevaleSulProfiloGovway() throws Exception {
		AdesioneEntity adesione = adesione("OAUTH_CC", List.of());
		adesione.getSoggetto().setTipoGateway("ModIPA");

		DTOAdesione dto = converti(adesione);

		assertEquals("ModIPA", dto.getSoggettoAderente().getTipoGateway());
		// il referente del dominio non ha tipo gateway: ricade sul profilo_govway del profilo
		assertEquals("APIGateway", dto.getSoggettoErogatore().getTipoGateway());
	}

	@Test
	void profiloNonConfiguratoRicadeSulDefaultDelSoggetto() throws Exception {
		AdesioneEntity adesione = adesione("PROFILO_NON_IN_CONFIGURAZIONE", List.of());

		DTOAdesione dto = converti(adesione);

		assertEquals("SPCoop", dto.getSoggettoAderente().getTipoGateway());
	}
}
