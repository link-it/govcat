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
package org.govway.catalogo.monitoraggioutils.transazioni;


import java.io.IOException;
import java.util.Arrays;

import com.fasterxml.jackson.dataformat.csv.CsvSchema;

public class TransazioneMapper extends AbstractMapper<Transazione> {

	
	public static void main(String[] args) throws IOException {
		TransazioneMapper sm = new TransazioneMapper();
		
		Transazione statistica = new Transazione();
		statistica.setIdTransazione("ABC");
		statistica.setIdApplicativoRichiesta("ABCD");
		
		String writeValues = sm.writeValues(Arrays.asList(statistica));
		
		System.out.println(writeValues);
	}
	
	public TransazioneMapper() {
		super(Transazione.class, TransazioneFormat.class);
	}

	@Override
	protected CsvSchema getSchema() {
		return CsvSchema.builder().setUseHeader(true)
//				.addColumn("idTransazione")
//				.addColumn("profilo")
//				.addColumn("esito")
//				.addColumn("contesto")
//				.addColumn("metodoHTTP")
//				.addColumn("eventi")
//				.addColumn("tipologia")
//				.addColumn("dataIngressoRichiestaInRicezioneString")
//				.addColumn("dataUscitaRichiestaInSpedizioneString")
//				.addColumn("dataIngressoRispostaInRicezioneString")
//				.addColumn("dataUscitaRispostaConsegnataString")
//				.addColumn("tempoRispostaServizio")
//				.addColumn("latenzaTotale")
//				.addColumn("codiceRispostaIngresso")
//				.addColumn("codiceRispostaUscita")
//				.addColumn("soggettoFruitore")
//				.addColumn("soggettoErogatore")
//				.addColumn("tipoAPI")
//				.addColumn("tags")
//				.addColumn("apiAzione")
//				.addColumn("idApplicativoRichiesta")
//				.addColumn("idApplicativoRisposta")
//				.addColumn("applicativoFruitore")
//				.addColumn("credenziali")
//				.addColumn("location")
//				.addColumn("connettore")
//				.addColumn("urlInvocazione")
//				.addColumn("indirizzoClient")
//				.addColumn("xForwardedFor")
//				.addColumn("richiedenteToken")
//				.addColumn("applicativoClient")
//				.addColumn("soggettoTokenApplicativoClient")
			.build();
	}
	
}