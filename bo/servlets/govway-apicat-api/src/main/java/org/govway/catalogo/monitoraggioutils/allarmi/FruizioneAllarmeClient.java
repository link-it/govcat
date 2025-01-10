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

import java.util.List;

import org.govway.catalogo.monitoraggioutils.ConfigurazioneConnessione;

public class FruizioneAllarmeClient extends AbstractAllarmeClient {

	
	public static void main(String[] args) {
		ConfigurazioneConnessione connessione = new ConfigurazioneConnessione();
		connessione.setUrl("http://localhost:8180/govwayAllarmi/monitoraggio/check");
		connessione.setUsername("operatore");
		connessione.setPassword("123456");

		List<AllarmeResponse> lst = new FruizioneAllarmeClient("RilevamentoValiditaCertificati@0000000000000000005").getAllarmeList(connessione);
		
		for(AllarmeResponse a: lst) {
			System.out.println("---------------------------");
			System.out.println("Id: " + a.getIdentificativo());
			System.out.println("nome: " + a.getNomeServizio());
			System.out.println("versione: " + a.getVersioneServizio());
			System.out.println("erogatore: " + a.getNomeSoggetto());
			System.out.println("Dettaglio: " + a.getDettaglio());
			System.out.println("Warning: " + a.isWarning());
		}
	}

	public FruizioneAllarmeClient(String idAllarme) {
		super(idAllarme);
	}
	
	protected String parseIdentificativo(String identificativoRaw) {
		//  Erogazione: [ModI] DettaglioCrediti v1 (SoggettoViaPDND)

		int index1 = identificativoRaw.indexOf("[");
		int index2 = identificativoRaw.indexOf("]");
		
		String tipo = identificativoRaw.substring(index1+1, index2);
		String nomeversionepiusoggetto = identificativoRaw.substring(index2+2);
		
		int indexNomeSoggetto1 = nomeversionepiusoggetto.indexOf("(");
		int indexNomeSoggetto2 = nomeversionepiusoggetto.indexOf(")");
		
		String nomeSoggetto = nomeversionepiusoggetto.substring(indexNomeSoggetto1+1, indexNomeSoggetto2);
		
		String nomeVersione = nomeversionepiusoggetto.substring(0, indexNomeSoggetto1 - 1);
		String nome = nomeVersione.split(" ")[0];
		String versione = nomeVersione.split(" ")[1].replace("v", "");

		int indexProvider1 = identificativoRaw.lastIndexOf("(");
		int indexProvider2= identificativoRaw.lastIndexOf(")");
		
		String provider = identificativoRaw.substring(indexProvider1+1, indexProvider2).replace("Fruitore:", "");

		return getKey(tipo, nomeSoggetto, provider, nome, Integer.parseInt(versione));
		
	}

	public String getKey(String tipoSoggetto, String provider, String nomeSoggetto, String nomeErogazione, Integer versione) {
		return tipoSoggetto + "/" + nomeSoggetto + "/" + provider + "/" + nomeErogazione + "/" + versione;
	}
	

	@Override
	protected void addInfo(String identificativoRaw, AllarmeResponse allarmeResponse) {
		String parseinfo = parseIdentificativo(identificativoRaw);
		
		allarmeResponse.setNomeServizio(parseinfo.split("/")[3]);
		allarmeResponse.setVersioneServizio(parseinfo.split("/")[4]);
		allarmeResponse.setNomeSoggetto(parseinfo.split("/")[1]);
		
	}

}
