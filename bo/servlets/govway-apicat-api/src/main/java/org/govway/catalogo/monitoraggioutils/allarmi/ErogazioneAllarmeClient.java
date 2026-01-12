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

public class ErogazioneAllarmeClient extends AbstractAllarmeClient {

	
	public static void main(String[] args) {
		ConfigurazioneConnessione connessione = new ConfigurazioneConnessione();
		connessione.setUrl("http://localhost:8180/govwayAllarmi/monitoraggio/check");
		connessione.setUsername("operatore");
		connessione.setPassword("123456");

		List<AllarmeResponse> lst = new ErogazioneAllarmeClient("RilevamentoConnettivitaBackend@0000000000000000002").getAllarmeList(connessione);
		
//		ErogazioneAllarmeClient erogazioneAllarmeClient = new ErogazioneAllarmeClient("RilevamentoConnettivitaBackend@0000000000000000002");
//		String k = erogazioneAllarmeClient.getKey("ModI", "SoggettoModI", "CasellarioAssistenza", 1);
//		Optional<AllarmeResponse> oA = erogazioneAllarmeClient.getAllarme(connessione, k, null);
//		
//		if(oA.isPresent()) {
//			AllarmeResponse a = oA.get();
//			System.out.println("---------------------------");
//			System.out.println("Id: " + a.getIdentificativo());
//			System.out.println("Dettaglio: " + a.getDettaglio());
//			System.out.println("Warning: " + a.isWarning());
//		} else {
//			System.out.println("Allarme non presente");
//		}
	
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

	public ErogazioneAllarmeClient(String idAllarme) {
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
		return getKey(tipo, nomeSoggetto, nome, Integer.parseInt(versione));
		
	}

	public String getKey(String tipoSoggetto, String nomeSoggetto, String nomeErogazione, Integer versione) {
		return tipoSoggetto + "/" + nomeSoggetto + "/" + nomeErogazione + "/" + versione;
	}

	@Override
	protected void addInfo(String identificativoRaw, AllarmeResponse allarmeResponse) {
		String parseinfo = parseIdentificativo(identificativoRaw);
		
		allarmeResponse.setNomeServizio(parseinfo.split("/")[2]);
		allarmeResponse.setVersioneServizio(parseinfo.split("/")[3]);
		allarmeResponse.setNomeSoggetto(parseinfo.split("/")[1]);
		
	}
}
