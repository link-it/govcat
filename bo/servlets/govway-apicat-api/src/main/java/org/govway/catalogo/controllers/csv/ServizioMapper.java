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
package org.govway.catalogo.controllers.csv;


import java.io.IOException;
import java.util.Arrays;

import org.govway.catalogo.monitoraggioutils.transazioni.AbstractMapper;

import com.fasterxml.jackson.dataformat.csv.CsvSchema;

public class ServizioMapper extends AbstractMapper<Servizio> {

	
	public static void main(String[] args) throws IOException {
		ServizioMapper sm = new ServizioMapper();
		
		Servizio statistica = new Servizio();
		statistica.setServizio("Servizio v1");
		
		String writeValues = sm.writeValues(Arrays.asList(statistica));
		
		System.out.println(writeValues);
	}
	
	public ServizioMapper() {
		super(Servizio.class, ServizioFormat.class);
	}

	@Override
	protected CsvSchema getSchema() {
		return CsvSchema.builder().setUseHeader(true)
			.build();
	}
	
}