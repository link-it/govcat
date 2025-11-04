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
package org.govway.catalogo.gest.clients.govwaymonitor.model;

import com.google.gson.annotations.SerializedName;
import io.swagger.v3.oas.annotations.media.Schema;

public class NumeroTransazioni implements OneOfTipoInformazioneReportNumeroTransazioniTipoInformazioneReportOccupazioneBandaTipoInformazioneReportTempoMedioRisposta, OneOfTipoInformazioneReportMultiLineNumeroTransazioniTipoInformazioneReportMultiLineOccupazioneBandaTipoInformazioneReportMultiLineTempoMedioRisposta {

	public static final String SERIALIZED_NAME_TIPO = "tipo";
	@SerializedName(SERIALIZED_NAME_TIPO)
	private TipoInformazioneEnum tipo = TipoInformazioneEnum.NUMERO_TRANSAZIONI;

	@Schema(required = true, description = "")
	@Override
	public TipoInformazioneEnum getTipo() {
		return tipo;

	}

}
