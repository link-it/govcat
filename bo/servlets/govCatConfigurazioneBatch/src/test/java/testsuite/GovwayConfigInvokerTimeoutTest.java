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
package testsuite;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

import config.Applicativo;
import config.GovwayConfigInvoker;
import freemarker.template.Configuration;
import okhttp3.HttpUrl;

/**
 * Timeout delle chiamate verso l'API di configurazione di govway: il valore configurato
 * sostituisce i 10 secondi di default di okhttp, troppo stretti per la prima chiamata dopo un
 * periodo di inattivita'.
 */
class GovwayConfigInvokerTimeoutTest {

	private static final String RISPOSTA = "{}";

	private HttpServer server;
	private long ritardoRispostaMillis;

	@BeforeEach
	void setUp() throws IOException {
		this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		this.server.createContext("/", exchange -> {
			try {
				Thread.sleep(this.ritardoRispostaMillis);
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
			}

			byte[] body = RISPOSTA.getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().add("Content-Type", "application/json");
			exchange.sendResponseHeaders(200, body.length);

			try (OutputStream os = exchange.getResponseBody()) {
				os.write(body);
			}
		});
		this.server.start();
	}

	@AfterEach
	void tearDown() {
		this.server.stop(0);
	}

	private GovwayConfigInvoker invoker(int readTimeoutSecondi) {
		HttpUrl url = HttpUrl.get("http://127.0.0.1:" + this.server.getAddress().getPort());

		return new GovwayConfigInvoker(url, new Configuration(Configuration.VERSION_2_3_29),
				GovwayConfigInvoker.CONNECT_TIMEOUT_SECONDI_DEFAULT,
				readTimeoutSecondi,
				GovwayConfigInvoker.WRITE_TIMEOUT_SECONDI_DEFAULT)
				.credentials("amministratore", "password");
	}

	@Test
	@DisplayName("la risposta piu' lenta del timeout configurato interrompe la chiamata")
	void rispostaOltreIlTimeout() {
		this.ritardoRispostaMillis = 2000;

		GovwayConfigInvoker invoker = invoker(1);

		assertThrows(SocketTimeoutException.class,
				() -> invoker.getServizioApplicativo("applicativo-test", "RegioneToscana", "APIGateway"));
	}

	@Test
	@DisplayName("la risposta entro il timeout configurato viene attesa")
	void rispostaEntroIlTimeout() throws IOException {
		this.ritardoRispostaMillis = 500;

		Applicativo applicativo = invoker(30)
				.getServizioApplicativo("applicativo-test", "RegioneToscana", "APIGateway");

		assertNotNull(applicativo);
	}

	@Test
	@DisplayName("i default sono piu' larghi dei 10 secondi di okhttp")
	void defaultPiuLarghiDiOkhttp() {
		assertTrue(GovwayConfigInvoker.READ_TIMEOUT_SECONDI_DEFAULT > 10,
				"il read timeout di default deve superare i 10 secondi di okhttp");
		assertTrue(GovwayConfigInvoker.WRITE_TIMEOUT_SECONDI_DEFAULT > 10,
				"il write timeout di default deve superare i 10 secondi di okhttp");
	}
}
