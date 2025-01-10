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
package org.govway.catalogo.monitoraggioutils.allarmi;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.govway.catalogo.monitoraggioutils.ConfigurazioneConnessione;

public class ConfigurazioneGeneraleAllarmeClient extends AbstractAllarmeClient {

	
	public static void main(String[] args) {
		ConfigurazioneConnessione connessione = new ConfigurazioneConnessione();
		connessione.setUrl("http://localhost:8181/govwayAllarmi/monitoraggio/check");
		connessione.setUsername("operatore");
		connessione.setPassword("123456");

		List<AllarmeResponse> lst = new ConfigurazioneGeneraleAllarmeClient("RilevamentoValiditaCertificati@0000000000000000006").getAllarmeList(connessione);
		
		for(AllarmeResponse a: lst) {
			System.out.println("---------------------------");
			System.out.println("Id: " + a.getIdentificativo());
			System.out.println("Dettaglio: " + a.getDettaglio());
			System.out.println("Warning: " + a.isWarning());
		}
	}

	public ConfigurazioneGeneraleAllarmeClient(String idAllarme) {
		super(idAllarme);
	}
	
	@Override
	protected List<AllarmeResponse> parseAllarmeList(List<String> lsts) {
		if(lsts.isEmpty()) {
			return Arrays.asList();
		} else {
			AllarmeResponse allarme = new AllarmeResponse();
			allarme.setIdentificativo(getKey());
			allarme.setDettaglio(lsts.stream().collect(Collectors.joining("\n")));
			allarme.setWarning(false);
			List<AllarmeResponse> lst = Arrays.asList(allarme);
			return lst;
		}
	}
	
	protected String parseIdentificativo(String identificativoRaw) {
		//  Erogazione: [ModI] DettaglioCrediti v1 (SoggettoViaPDND)

		return getKey();
		
	}

	public String getKey() {
		return "";
	}
	
	@Override
	protected void addInfo(String identificativoRaw, AllarmeResponse allarmeResponse) {
	}

}
