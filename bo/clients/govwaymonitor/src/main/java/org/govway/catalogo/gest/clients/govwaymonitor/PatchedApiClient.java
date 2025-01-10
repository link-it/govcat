/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
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
package org.govway.catalogo.gest.clients.govwaymonitor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;

import org.govway.catalogo.gest.clients.govwayconfig.impl.JSON;
import org.govway.catalogo.gest.clients.govwaymonitor.api.MonitoraggioApi;
import org.govway.catalogo.gest.clients.govwaymonitor.impl.ApiClient;
import org.govway.catalogo.gest.clients.govwaymonitor.impl.JSON.DateTypeAdapter;
import org.govway.catalogo.gest.clients.govwaymonitor.impl.JSON.OffsetDateTimeTypeAdapter;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroApiSoggetti;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroMittenteErogazioneSoggettoImpl;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroRicercaRuoloTransazioneEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.ListaTransazioni;
import org.govway.catalogo.gest.clients.govwaymonitor.model.ProfiloEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaIntervalloTemporale;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TipoFiltroMittenteEnum;

import com.google.gson.Gson;

import io.gsonfire.GsonFireBuilder;

public class PatchedApiClient extends ApiClient {

	public static void main(String[] args) {
		ApiClient client = new PatchedApiClient(Optional.of("amministratore"), Optional.of("123456"));
		client.setBasePath("http://127.0.0.1:8887/govwayAPIConfig");
		
		MonitoraggioApi mon = new MonitoraggioApi (client);

		RicercaIntervalloTemporale body = new RicercaIntervalloTemporale();

		try {


			FiltroApiSoggetti api = new FiltroApiSoggetti();

			/*
			 * Parametro api.erogatore
			 * 
			 * 1) caso API erogata dal soggetto del dominio: può non essere valorizzato (eventualmente provare  idApi.getSoggettoGestore())
			 * 2) caso API erogata soggetto aderente: idApi.getSoggetto()
			 * 
			 *   Parametro 			body.setTipo() caso 1, erogazione, caso 2 fruizione

			 */
			
			body.setTipo(FiltroRicercaRuoloTransazioneEnum.EROGAZIONE);
			api.setErogatore("IstitutoNazionalePrevidenzaSociale");
			
			FiltroMittenteErogazioneSoggettoImpl t = new FiltroMittenteErogazioneSoggettoImpl();
			
			t.setIdentificazione(TipoFiltroMittenteEnum.EROGAZIONE_SOGGETTO);
			t.setSoggetto("ProvaMladen");
			body.setMittente(t);
			
			api.setNome("ANFDipendenti");
			api.setVersione(1);

			body.setApi(api);
			
			ListaTransazioni l = mon.findAllTransazioniByFullSearch(ProfiloEnum.MODI, "IstitutoNazionalePrevidenzaSociale", body);

		} catch(Exception e) {
			e.printStackTrace(System.err);
			System.err.println(e.getMessage());
		}

	}


	public PatchedApiClient(Optional<String> username, Optional<String> password) {
		if (username.isPresent() && password.isPresent()) {
			this.addDefaultHeader("Authorization", "Basic " + new String(Base64.getEncoder().encode((username.get()+":"+password.get()).getBytes())));
		}
		
		
        Gson gson = new GsonFireBuilder().createGsonBuilder()
                .registerTypeAdapter(Date.class, new DateTypeAdapter())
                .registerTypeAdapter(java.sql.Date.class, new JSON.SqlDateTypeAdapter())
                .registerTypeAdapter(OffsetDateTime.class, new OffsetDateTimeTypeAdapter())
                .registerTypeAdapter(LocalDate.class, this.getJSON().new LocalDateTypeAdapter())
                .create();

        this.getJSON()
        .setGson(gson);
		
	}
}
