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
package org.govway.catalogo.monitoraggioutils;

import org.govway.catalogo.monitoraggioutils.transazioni.GetTransazioneRequest;
import org.govway.catalogo.monitoraggioutils.transazioni.GetTransazioneResponse;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniRawResponse;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniRequest;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniResponse;

public interface IMonitoraggioClient {

	public GetTransazioneResponse getTransazione(GetTransazioneRequest request);
	public ListTransazioniResponse listTransazioni(ListTransazioniRequest request);
	public ListTransazioniRawResponse listTransazioniRaw(ListTransazioniRequest request);
	public boolean isLimitata();
}
