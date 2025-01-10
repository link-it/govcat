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

import org.govway.catalogo.monitoraggioutils.ConfigurazioneConnessione;

public class ApplicativoAllarmeClient extends AbstractAllarmeClient {

	
	public static void main(String[] args) {
		ConfigurazioneConnessione connessione = new ConfigurazioneConnessione();
		connessione.setUrl("http://localhost:8181/govwayAllarmi/monitoraggio/check");
		connessione.setUsername("operatore");
		connessione.setPassword("123456");

		ApplicativoAllarmeClient applicativoAllarmeClient = new ApplicativoAllarmeClient("RilevamentoValiditaCertificati@999999999999999999");
		
		
		System.out.println(applicativoAllarmeClient.parseIdentificativo("Applicativo: [ModI] TestCertificatoInScadenza (ACI)"));
		
//		List<AllarmeResponse> lst = applicativoAllarmeClient.getAllarmeList(connessione);
		
		
		
		
//		for(AllarmeResponse a: lst) {
//			System.out.println("---------------------------");
//			System.out.println("Id: " + a.getIdentificativo());
//			System.out.println("Dettaglio: " + a.getDettaglio());
//			System.out.println("Warning: " + a.isWarning());
//		}
	}

	public ApplicativoAllarmeClient(String idAllarme) {
		super(idAllarme);
	}
	
	protected String parseIdentificativo(String identificativoRaw) {
		//  [ModI] ApplicativoStressTestGenerazioneToken (ENTE)

		int index1 = identificativoRaw.indexOf("[");
		int index2 = identificativoRaw.indexOf("]");
		
		String tipo = identificativoRaw.substring(index1+1, index2);
		String nomepiusoggetto = identificativoRaw.substring(index2+2);
		
		int indexNomeSoggetto1 = nomepiusoggetto.indexOf("(");
		int indexNomeSoggetto2 = nomepiusoggetto.indexOf(")");
		
		String nomeSoggetto = nomepiusoggetto.substring(indexNomeSoggetto1+1, indexNomeSoggetto2);
		
		String nome = nomepiusoggetto.substring(0, indexNomeSoggetto1 - 1).trim();
		String id = getKey(tipo, nomeSoggetto, nome);
		return id;
		
	}

	public String getKey(String tipoSoggetto, String nomeSoggetto, String nomeApplicativo) {
		return tipoSoggetto + "/" + nomeSoggetto + "/" + nomeApplicativo;
	}

	@Override
	protected void addInfo(String identificativoRaw, AllarmeResponse allarmeResponse) {
		String parseinfo = parseIdentificativo(identificativoRaw);
		
		allarmeResponse.setNomeApplicativo(parseinfo.split("/")[2]);
		allarmeResponse.setNomeSoggetto(parseinfo.split("/")[1]);
		
	}
}
