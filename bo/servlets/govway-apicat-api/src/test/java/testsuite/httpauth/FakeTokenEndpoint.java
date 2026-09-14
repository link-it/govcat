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
package testsuite.httpauth;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

/**
 * Token endpoint di prova, realizzato con l'http server del jdk per non introdurre
 * dipendenze di test aggiuntive.
 *
 * Registra le richieste ricevute cosi' che i test possano verificare quante negoziazioni sono
 * state effettuate e come sono state presentate le credenziali.
 */
public class FakeTokenEndpoint implements AutoCloseable {

	private final HttpServer server;
	private final AtomicInteger richieste = new AtomicInteger();
	private final List<String> bodyRicevuti = new CopyOnWriteArrayList<>();
	private final List<String> authorizationRicevuti = new CopyOnWriteArrayList<>();

	private volatile long expiresIn = 3600L;
	private volatile boolean expiresInPresente = true;
	private volatile String tokenType = "Bearer";
	private volatile int statusCode = 200;
	private volatile String rispostaErrore = "{\"error\":\"invalid_client\",\"error_description\":\"client non valido\"}";
	private volatile long ritardoMillis = 0L;

	public FakeTokenEndpoint() throws IOException {
		this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		this.server.createContext("/token", this::gestisci);
		this.server.start();
	}

	private void gestisci(HttpExchange exchange) throws IOException {
		int numero = this.richieste.incrementAndGet();

		String authorization = exchange.getRequestHeaders().getFirst("Authorization");
		this.authorizationRicevuti.add(authorization == null ? "" : authorization);

		try(InputStream is = exchange.getRequestBody()) {
			this.bodyRicevuti.add(new String(is.readAllBytes(), StandardCharsets.UTF_8));
		}

		if(this.ritardoMillis > 0) {
			try {
				Thread.sleep(this.ritardoMillis);
			} catch(InterruptedException e) {
				Thread.currentThread().interrupt();
			}
		}

		byte[] risposta;

		if(this.statusCode != 200) {
			risposta = this.rispostaErrore.getBytes(StandardCharsets.UTF_8);
		} else {
			StringBuilder json = new StringBuilder("{\"access_token\":\"token-").append(numero).append('"');

			if(this.tokenType != null) {
				json.append(",\"token_type\":\"").append(this.tokenType).append('"');
			}

			if(this.expiresInPresente) {
				json.append(",\"expires_in\":").append(this.expiresIn);
			}

			risposta = json.append('}').toString().getBytes(StandardCharsets.UTF_8);
		}

		exchange.getResponseHeaders().add("Content-Type", "application/json");
		exchange.sendResponseHeaders(this.statusCode, risposta.length);

		try(OutputStream os = exchange.getResponseBody()) {
			os.write(risposta);
		}
	}

	public String url() {
		return "http://127.0.0.1:" + this.server.getAddress().getPort() + "/token";
	}

	public int getNumeroRichieste() {
		return this.richieste.get();
	}

	public List<String> getBodyRicevuti() {
		return this.bodyRicevuti;
	}

	public List<String> getAuthorizationRicevuti() {
		return this.authorizationRicevuti;
	}

	public FakeTokenEndpoint conExpiresIn(long expiresIn) {
		this.expiresIn = expiresIn;
		this.expiresInPresente = true;
		return this;
	}

	public FakeTokenEndpoint senzaExpiresIn() {
		this.expiresInPresente = false;
		return this;
	}

	public FakeTokenEndpoint conTokenType(String tokenType) {
		this.tokenType = tokenType;
		return this;
	}

	public FakeTokenEndpoint conErrore(int statusCode) {
		this.statusCode = statusCode;
		return this;
	}

	public FakeTokenEndpoint conRitardo(long ritardoMillis) {
		this.ritardoMillis = ritardoMillis;
		return this;
	}

	@Override
	public void close() {
		this.server.stop(0);
	}
}
