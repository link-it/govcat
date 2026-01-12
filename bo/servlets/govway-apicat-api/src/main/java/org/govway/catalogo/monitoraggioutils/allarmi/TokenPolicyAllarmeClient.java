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

public class TokenPolicyAllarmeClient extends AbstractAllarmeClient {

	
	public static void main(String[] args) {
		ConfigurazioneConnessione connessione = new ConfigurazioneConnessione();
		connessione.setUrl("http://localhost:8181/govwayAllarmi/monitoraggio/check");
		connessione.setUsername("operatore");
		connessione.setPassword("123456");

		List<AllarmeResponse> lst = new TokenPolicyAllarmeClient("RilevamentoValiditaCertificati@0000000000000000003").getAllarmeList(connessione);
		
		for(AllarmeResponse a: lst) {
			System.out.println("---------------------------");
			System.out.println("Id: " + a.getIdentificativo());
			System.out.println("Dettaglio: " + a.getDettaglio());
			System.out.println("Warning: " + a.isWarning());
		}
	}

	public TokenPolicyAllarmeClient(String idAllarme) {
		super(idAllarme);
	}
	
	protected String parseIdentificativo(String identificativoRaw) {
		//  Token Policy Validazione: TESTERRATO [Introspection]
		// Token Policy Negoziazione: TestErratoNegoziazione

		if(identificativoRaw.contains("Token Policy Validazione")) {
			return identificativoRaw.split("Token Policy Validazione: ")[1].split(" ")[0];
		} else {
			return identificativoRaw.split("Token Policy Negoziazione: ")[1].split(" ")[0];
		}
	}

	public String getKey(String nomePolicy) {
		return nomePolicy;
	}
	

	@Override
	protected void addInfo(String identificativoRaw, AllarmeResponse allarmeResponse) {
	}

}
