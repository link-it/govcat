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
package keycloak;

import java.io.IOException;

import com.google.gson.FieldNamingPolicy;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import freemarker.template.Configuration;
import okhttp3.FormBody;
import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okhttp3.RequestBody;

/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public class KeycloakInvoker {
	
	private OkHttpClient client;
	private HttpUrl url;
	private String username;
	private String password;
	
	private KeycloakLogin token;
	private Long lastTokenTimestamp = 0l;
	private String realm;
	
	private Gson gson;
	private Configuration templateCfg;
	
	public static final MediaType FORM = MediaType.parse("application/x-www-form-urlencoded");
	public static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
	
	public KeycloakInvoker(HttpUrl url, String username, String password, Configuration cfg) throws IOException {
		this.url = url;
		this.username = username;
		this.password = password;
		this.client = new OkHttpClient();
		this.realm = "master";
		this.gson = new GsonBuilder().setFieldNamingPolicy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES).create();
		this.templateCfg = ((Configuration)cfg.clone());
		this.templateCfg.setClassForTemplateLoading(this.getClass(), "../templates/keycloak");

	}
	
	// login via POST /realms/{realm}/protocol/openid-connect/token
	private void login() throws IOException {
		if (this.token != null && this.lastTokenTimestamp + this.token.getExpiresIn() * 0.9 < System.currentTimeMillis() / 1000)
			return;
		
		HttpUrl loginUrl = this.url.newBuilder()
				.addPathSegment("realms")
				.addPathSegment(this.realm)
				.addPathSegments("protocol/openid-connect/token")
				.build();
		
		RequestBody formBody = new FormBody.Builder()
				.add("username", this.username)
				.add("password", this.password)
				.add("client_id", "admin-cli")
				.add("grant_type", "password").build(); 
		
		Request request = new Request.Builder()
		        .url(loginUrl)
		        .post(formBody)
		        .build();
		
		Response response = this.client.newCall(request).execute();
		
		if (!response.isSuccessful() && !response.body().contentType().subtype().equals("json"))
			throw new IOException("impossibile fare il login su keycloak code: " + response.code());
		
		this.token = this.gson.fromJson(response.body().string(), KeycloakLogin.class);
		this.lastTokenTimestamp = System.currentTimeMillis() / 1000;
	}
	
	public String getIdFromClientId(String clientId) throws IOException {
		HttpUrl clientUrl = this.url.newBuilder()
				.addPathSegments("admin/realms")
				.addPathSegment(this.realm)
				.addPathSegment("clients")
				.addQueryParameter("clientId", clientId)
				.build();
		
		this.login();
		
		Request request = new Request.Builder()
		        .url(clientUrl)
		        .addHeader("Authorization", "Bearer " + this.token.getAccessToken())
		        .get()
		        .build();
		
		Response response = this.client.newCall(request).execute();
		
		if (!response.isSuccessful() && !response.body().contentType().subtype().equals("json"))
			throw new IOException("impossibile ottenere l'id del client da keycloak, code: " + response.code());

		ResponseBody responseBody = response.body();
		String content = responseBody.string();
		
		KeycloakClient[] clients = this.gson.fromJson(content, KeycloakClient[].class);
		
		if (clients.length == 0)
			throw new IOException("Impossibile ottenere l'id del client da keycloak, client not found");
		return clients[0].getId();
	}
	
	public String getSecret(String clientId) throws IOException {
		HttpUrl clientUrl = this.url.newBuilder()
				.addPathSegments("admin/realms")
				.addPathSegment(this.realm)
				.addPathSegment("clients")
				.addPathSegment(this.getIdFromClientId(clientId))
				.addPathSegment("client-secret")
				.build();
		
		this.login();

		
		Request request = new Request.Builder()
		        .url(clientUrl)
		        .addHeader("Authorization", "Bearer " + this.token.getAccessToken())
		        .get()
		        .build();
				
		Response response = this.client.newCall(request).execute();
		
		if (!response.isSuccessful() && !response.body().contentType().subtype().equals("json"))
			throw new IOException("impossibile ottenere il client secret " + response.code());
		
		String responseBody = response.body().string();
		KeycloakError error = this.gson.fromJson(responseBody, KeycloakError.class);
		
		if (error != null && error.getError() != null)
			throw new IOException("errore nella generazione del client secret: " + error.getError());
		
		KeycloakClientSecret secret = this.gson.fromJson(responseBody, KeycloakClientSecret.class);
		return secret.getValue();
	}
	
}
