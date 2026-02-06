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
package org.govway.catalogo.monitoraggioutils.allarmi;

import java.util.List;

import org.govway.catalogo.monitoraggioutils.ConfigurazioneConnessione;

public class SoggettoAllarmeClient extends AbstractAllarmeClient {

	public SoggettoAllarmeClient(String idAllarme) {
		super(idAllarme);
	}
	
	public static void main(String[] args) {
		ConfigurazioneConnessione connessione = new ConfigurazioneConnessione();
		connessione.setUrl("http://localhost:8181/govwayAllarmi/monitoraggio/check");
		connessione.setUsername("operatore");
		connessione.setPassword("123456");

		List<AllarmeResponse> lst = new SoggettoAllarmeClient("RilevamentoValiditaCertificati@0000000000000000001").getAllarmeList(connessione);
		
		for(AllarmeResponse a: lst) {
			System.out.println("=====================");
			System.out.println("Id: " + a.getIdentificativo());
			System.out.println("Dettaglio: " + a.getDettaglio());
			System.out.println("Warning: " + a.isWarning());
		}
	}

	protected String parseIdentificativo(String identificativoRaw) {
		int index1 = identificativoRaw.indexOf("[");
		int index2 = identificativoRaw.indexOf("]");
		
		String tipo = identificativoRaw.substring(index1+1, index2);
		String soggetto = identificativoRaw.substring(index2+2);
		
		return getKey(tipo, soggetto);
		
	}

	public String getKey(String tipoSoggetto, String nomeSoggetto) {
		return tipoSoggetto + "/" + nomeSoggetto;
	}
	

	@Override
	protected void addInfo(String identificativoRaw, AllarmeResponse allarmeResponse) {
		String parseinfo = parseIdentificativo(identificativoRaw);
		
		allarmeResponse.setNomeSoggetto(parseinfo.split("/")[1]);
	}

}
