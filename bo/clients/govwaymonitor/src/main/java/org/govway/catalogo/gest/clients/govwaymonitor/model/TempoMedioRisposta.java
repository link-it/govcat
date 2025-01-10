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

import java.util.Objects;

import com.google.gson.annotations.SerializedName;

import io.swagger.annotations.ApiModelProperty;

/**
 * TempoMedioRisposta
 */
@javax.annotation.Generated(value = "org.openapitools.codegen.languages.JavaClientCodegen", date = "2023-09-27T18:38:39.702666+02:00[Europe/Rome]")
public class TempoMedioRisposta implements OneOfTipoInformazioneReportNumeroTransazioniTipoInformazioneReportOccupazioneBandaTipoInformazioneReportTempoMedioRisposta, OneOfTipoInformazioneReportMultiLineNumeroTransazioniTipoInformazioneReportMultiLineOccupazioneBandaTipoInformazioneReportMultiLineTempoMedioRisposta {
	public static final String SERIALIZED_NAME_TIPO = "tipo";
	@SerializedName(SERIALIZED_NAME_TIPO)
	private TipoInformazioneEnum tipo = TipoInformazioneEnum.TEMPO_MEDIO_RISPOSTA;

	public static final String SERIALIZED_NAME_TEMPO_MEDIO_RISPOSTA = "tempo_medio_risposta";
	@SerializedName(SERIALIZED_NAME_TEMPO_MEDIO_RISPOSTA)
	private TempoMedioRispostaTipi tempoMedioRisposta = new TempoMedioRispostaTipi();


	public TempoMedioRisposta tipo(TipoInformazioneEnum tipo) {

		this.tipo = tipo;
		return this;
	}

	/**
	 * Get tipo
	 * @return tipo
	 **/
	@ApiModelProperty(required = true, value = "")

	public TipoInformazioneEnum getTipo() {
		return tipo;
	}


	public void setTipo(TipoInformazioneEnum tipo) {
		this.tipo = tipo;
	}


	public TempoMedioRisposta tempoMedioRisposta(TempoMedioRispostaTipi tempoMedioRisposta) {

		this.tempoMedioRisposta = tempoMedioRisposta;
		return this;
	}

	/**
	 * Get tempoMedioRisposta
	 * @return tempoMedioRisposta
	 **/
	@javax.annotation.Nullable
	@ApiModelProperty(value = "")

	public TempoMedioRispostaTipi getTempoMedioRisposta() {
		return tempoMedioRisposta;
	}


	public void setTempoMedioRisposta(TempoMedioRispostaTipi tempoMedioRisposta) {
		this.tempoMedioRisposta = tempoMedioRisposta;
	}


	@Override
	public boolean equals(Object o) {
		if (this == o) {
			return true;
		}
		if (o == null || getClass() != o.getClass()) {
			return false;
		}
		TempoMedioRisposta tipoInformazioneReportTempoMedioRisposta = (TempoMedioRisposta) o;
		return Objects.equals(this.tipo, tipoInformazioneReportTempoMedioRisposta.tipo) &&
				Objects.equals(this.tempoMedioRisposta, tipoInformazioneReportTempoMedioRisposta.tempoMedioRisposta);
	}

	@Override
	public int hashCode() {
		return Objects.hash(tipo, tempoMedioRisposta);
	}

	@Override
	public String toString() {
		StringBuilder sb = new StringBuilder();
		sb.append("class TempoMedioRisposta {\n");
		sb.append("    tipo: ").append(toIndentedString(tipo)).append("\n");
		sb.append("    tempoMedioRisposta: ").append(toIndentedString(tempoMedioRisposta)).append("\n");
		sb.append("}");
		return sb.toString();
	}

	/**
	 * Convert the given object to string with each line indented by 4 spaces
	 * (except the first line).
	 */
	private String toIndentedString(Object o) {
		if (o == null) {
			return "null";
		}
		return o.toString().replace("\n", "\n    ");
	}

}