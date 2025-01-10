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
package org.govway.catalogo.gest.clients.govwayconfig.model;

import org.govway.catalogo.gest.clients.govwayconfig.model.APIBaseImpl;
import org.govway.catalogo.gest.clients.govwayconfig.model.BaseSoggettoItem;
import java.util.ArrayList;
import java.util.List;
import javax.validation.constraints.*;

import io.swagger.v3.oas.annotations.media.Schema;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlType;
import javax.xml.bind.annotation.XmlEnum;
import javax.xml.bind.annotation.XmlEnumValue;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
import com.fasterxml.jackson.annotation.JsonCreator;

import javax.validation.Valid;

public class ApiImplVersioneApiView extends BaseSoggettoItem {
  
  @Schema(required = true, description = "")
  private String apiNome = null;
  
  @Schema(required = true, description = "")
  private Integer apiVersione = null;
  
  @Schema(description = "")
  private String apiReferente = null;
  
  @Schema(description = "")
  private String apiSoapServizio = null;
  
  @Schema(example = "[\"PagamentiTelematici\",\"Anagrafica\"]", description = "")
  private List<String> apiTags = null;
  
  @Schema(description = "")
  private String tipoServizio = null;
  
  @Schema(example = "[1,2,3]", required = true, description = "")
  private List<Integer> versioni = new ArrayList<Integer>();
 /**
   * Get apiNome
   * @return apiNome
  **/
  @JsonProperty("api_nome")
  @NotNull
  @Valid
 @Pattern(regexp="^[_A-Za-z][._A-Za-z0-9]*$") @Size(max=255)  public String getApiNome() {
    return apiNome;
  }

  public void setApiNome(String apiNome) {
    this.apiNome = apiNome;
  }

  public ApiImplVersioneApiView apiNome(String apiNome) {
    this.apiNome = apiNome;
    return this;
  }

 /**
   * Get apiVersione
   * @return apiVersione
  **/
  @JsonProperty("api_versione")
  @NotNull
  @Valid
  public Integer getApiVersione() {
    return apiVersione;
  }

  public void setApiVersione(Integer apiVersione) {
    this.apiVersione = apiVersione;
  }

  public ApiImplVersioneApiView apiVersione(Integer apiVersione) {
    this.apiVersione = apiVersione;
    return this;
  }

 /**
   * Get apiReferente
   * @return apiReferente
  **/
  @JsonProperty("api_referente")
  @Valid
 @Pattern(regexp="^[0-9A-Za-z]+$") @Size(max=255)  public String getApiReferente() {
    return apiReferente;
  }

  public void setApiReferente(String apiReferente) {
    this.apiReferente = apiReferente;
  }

  public ApiImplVersioneApiView apiReferente(String apiReferente) {
    this.apiReferente = apiReferente;
    return this;
  }

 /**
   * Get apiSoapServizio
   * @return apiSoapServizio
  **/
  @JsonProperty("api_soap_servizio")
  @Valid
 @Pattern(regexp="^[_A-Za-z][._A-Za-z0-9]*$") @Size(max=255)  public String getApiSoapServizio() {
    return apiSoapServizio;
  }

  public void setApiSoapServizio(String apiSoapServizio) {
    this.apiSoapServizio = apiSoapServizio;
  }

  public ApiImplVersioneApiView apiSoapServizio(String apiSoapServizio) {
    this.apiSoapServizio = apiSoapServizio;
    return this;
  }

 /**
   * Get apiTags
   * @return apiTags
  **/
  @JsonProperty("api_tags")
  @Valid
  public List<String> getApiTags() {
    return apiTags;
  }

  public void setApiTags(List<String> apiTags) {
    this.apiTags = apiTags;
  }

  public ApiImplVersioneApiView apiTags(List<String> apiTags) {
    this.apiTags = apiTags;
    return this;
  }

  public ApiImplVersioneApiView addApiTagsItem(String apiTagsItem) {
    this.apiTags.add(apiTagsItem);
    return this;
  }

 /**
   * Get tipoServizio
   * @return tipoServizio
  **/
  @JsonProperty("tipo_servizio")
  @Valid
 @Pattern(regexp="^[a-z]{2,20}$") @Size(max=20)  public String getTipoServizio() {
    return tipoServizio;
  }

  public void setTipoServizio(String tipoServizio) {
    this.tipoServizio = tipoServizio;
  }

  public ApiImplVersioneApiView tipoServizio(String tipoServizio) {
    this.tipoServizio = tipoServizio;
    return this;
  }

 /**
   * Get versioni
   * @return versioni
  **/
  @JsonProperty("versioni")
  @NotNull
  @Valid
  public List<Integer> getVersioni() {
    return versioni;
  }

  public void setVersioni(List<Integer> versioni) {
    this.versioni = versioni;
  }

  public ApiImplVersioneApiView versioni(List<Integer> versioni) {
    this.versioni = versioni;
    return this;
  }

  public ApiImplVersioneApiView addVersioniItem(Integer versioniItem) {
    this.versioni.add(versioniItem);
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ApiImplVersioneApiView {\n");
    sb.append("    ").append(toIndentedString(super.toString())).append("\n");
    sb.append("    apiNome: ").append(toIndentedString(apiNome)).append("\n");
    sb.append("    apiVersione: ").append(toIndentedString(apiVersione)).append("\n");
    sb.append("    apiReferente: ").append(toIndentedString(apiReferente)).append("\n");
    sb.append("    apiSoapServizio: ").append(toIndentedString(apiSoapServizio)).append("\n");
    sb.append("    apiTags: ").append(toIndentedString(apiTags)).append("\n");
    sb.append("    tipoServizio: ").append(toIndentedString(tipoServizio)).append("\n");
    sb.append("    versioni: ").append(toIndentedString(versioni)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private static String toIndentedString(java.lang.Object o) {
    if (o == null) {
      return "null";
    }
    return o.toString().replace("\n", "\n    ");
  }
}
