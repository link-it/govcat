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

import org.govway.catalogo.gest.clients.govwayconfig.model.ApiImplConfigurazioneStato;
import org.govway.catalogo.gest.clients.govwayconfig.model.CachingRispostaRegola;
import org.govway.catalogo.gest.clients.govwayconfig.model.StatoDefaultRidefinitoEnum;
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

public class CachingRisposta extends ApiImplConfigurazioneStato {
  
  @Schema(required = true, description = "")
  private StatoDefaultRidefinitoEnum stato = null;
  
  @Schema(description = "")
  private Boolean abilitato = null;
  
  @Schema(description = "")
  private Integer cacheTimeoutSeconds = null;
  
  @Schema(description = "")
  private Boolean maxResponseSize = null;
  
  @Schema(description = "")
  private Long maxResponseSizeKb = null;
  
  @Schema(description = "")
  private Boolean hashRequestUri = true;
  
  @Schema(description = "")
  private Boolean hashAllQueryParameters = true;
  
  @Schema(description = "")
  private List<String> hashQueryParamaters = null;
  
  @Schema(description = "")
  private List<String> hashHeaders = null;
  
  @Schema(description = "")
  private Boolean hashPayload = true;
  
  @Schema(description = "")
  private Boolean controlNoCache = true;
  
  @Schema(description = "")
  private Boolean controlNoStore = true;
  
  @Schema(description = "")
  private Boolean controlMaxAge = true;
  
  @Schema(description = "")
  private List<CachingRispostaRegola> regole = null;
 /**
   * Get stato
   * @return stato
  **/
  @JsonProperty("stato")
  @NotNull
  @Valid
  public StatoDefaultRidefinitoEnum getStato() {
    return stato;
  }

  public void setStato(StatoDefaultRidefinitoEnum stato) {
    this.stato = stato;
  }

  public CachingRisposta stato(StatoDefaultRidefinitoEnum stato) {
    this.stato = stato;
    return this;
  }

 /**
   * Get abilitato
   * @return abilitato
  **/
  @JsonProperty("abilitato")
  @Valid
  public Boolean isAbilitato() {
    return abilitato;
  }

  public void setAbilitato(Boolean abilitato) {
    this.abilitato = abilitato;
  }

  public CachingRisposta abilitato(Boolean abilitato) {
    this.abilitato = abilitato;
    return this;
  }

 /**
   * Get cacheTimeoutSeconds
   * @return cacheTimeoutSeconds
  **/
  @JsonProperty("cache_timeout_seconds")
  @Valid
  public Integer getCacheTimeoutSeconds() {
    return cacheTimeoutSeconds;
  }

  public void setCacheTimeoutSeconds(Integer cacheTimeoutSeconds) {
    this.cacheTimeoutSeconds = cacheTimeoutSeconds;
  }

  public CachingRisposta cacheTimeoutSeconds(Integer cacheTimeoutSeconds) {
    this.cacheTimeoutSeconds = cacheTimeoutSeconds;
    return this;
  }

 /**
   * Get maxResponseSize
   * @return maxResponseSize
  **/
  @JsonProperty("max_response_size")
  @Valid
  public Boolean isMaxResponseSize() {
    return maxResponseSize;
  }

  public void setMaxResponseSize(Boolean maxResponseSize) {
    this.maxResponseSize = maxResponseSize;
  }

  public CachingRisposta maxResponseSize(Boolean maxResponseSize) {
    this.maxResponseSize = maxResponseSize;
    return this;
  }

 /**
   * Get maxResponseSizeKb
   * @return maxResponseSizeKb
  **/
  @JsonProperty("max_response_size_kb")
  @Valid
  public Long getMaxResponseSizeKb() {
    return maxResponseSizeKb;
  }

  public void setMaxResponseSizeKb(Long maxResponseSizeKb) {
    this.maxResponseSizeKb = maxResponseSizeKb;
  }

  public CachingRisposta maxResponseSizeKb(Long maxResponseSizeKb) {
    this.maxResponseSizeKb = maxResponseSizeKb;
    return this;
  }

 /**
   * Get hashRequestUri
   * @return hashRequestUri
  **/
  @JsonProperty("hash_request_uri")
  @Valid
  public Boolean isHashRequestUri() {
    return hashRequestUri;
  }

  public void setHashRequestUri(Boolean hashRequestUri) {
    this.hashRequestUri = hashRequestUri;
  }

  public CachingRisposta hashRequestUri(Boolean hashRequestUri) {
    this.hashRequestUri = hashRequestUri;
    return this;
  }

 /**
   * Get hashAllQueryParameters
   * @return hashAllQueryParameters
  **/
  @JsonProperty("hash_all_query_parameters")
  @Valid
  public Boolean isHashAllQueryParameters() {
    return hashAllQueryParameters;
  }

  public void setHashAllQueryParameters(Boolean hashAllQueryParameters) {
    this.hashAllQueryParameters = hashAllQueryParameters;
  }

  public CachingRisposta hashAllQueryParameters(Boolean hashAllQueryParameters) {
    this.hashAllQueryParameters = hashAllQueryParameters;
    return this;
  }

 /**
   * Get hashQueryParamaters
   * @return hashQueryParamaters
  **/
  @JsonProperty("hash_query_paramaters")
  @Valid
  public List<String> getHashQueryParamaters() {
    return hashQueryParamaters;
  }

  public void setHashQueryParamaters(List<String> hashQueryParamaters) {
    this.hashQueryParamaters = hashQueryParamaters;
  }

  public CachingRisposta hashQueryParamaters(List<String> hashQueryParamaters) {
    this.hashQueryParamaters = hashQueryParamaters;
    return this;
  }

  public CachingRisposta addHashQueryParamatersItem(String hashQueryParamatersItem) {
    this.hashQueryParamaters.add(hashQueryParamatersItem);
    return this;
  }

 /**
   * Get hashHeaders
   * @return hashHeaders
  **/
  @JsonProperty("hash_headers")
  @Valid
  public List<String> getHashHeaders() {
    return hashHeaders;
  }

  public void setHashHeaders(List<String> hashHeaders) {
    this.hashHeaders = hashHeaders;
  }

  public CachingRisposta hashHeaders(List<String> hashHeaders) {
    this.hashHeaders = hashHeaders;
    return this;
  }

  public CachingRisposta addHashHeadersItem(String hashHeadersItem) {
    this.hashHeaders.add(hashHeadersItem);
    return this;
  }

 /**
   * Get hashPayload
   * @return hashPayload
  **/
  @JsonProperty("hash_payload")
  @Valid
  public Boolean isHashPayload() {
    return hashPayload;
  }

  public void setHashPayload(Boolean hashPayload) {
    this.hashPayload = hashPayload;
  }

  public CachingRisposta hashPayload(Boolean hashPayload) {
    this.hashPayload = hashPayload;
    return this;
  }

 /**
   * Get controlNoCache
   * @return controlNoCache
  **/
  @JsonProperty("control_no_cache")
  @Valid
  public Boolean isControlNoCache() {
    return controlNoCache;
  }

  public void setControlNoCache(Boolean controlNoCache) {
    this.controlNoCache = controlNoCache;
  }

  public CachingRisposta controlNoCache(Boolean controlNoCache) {
    this.controlNoCache = controlNoCache;
    return this;
  }

 /**
   * Get controlNoStore
   * @return controlNoStore
  **/
  @JsonProperty("control_no_store")
  @Valid
  public Boolean isControlNoStore() {
    return controlNoStore;
  }

  public void setControlNoStore(Boolean controlNoStore) {
    this.controlNoStore = controlNoStore;
  }

  public CachingRisposta controlNoStore(Boolean controlNoStore) {
    this.controlNoStore = controlNoStore;
    return this;
  }

 /**
   * Get controlMaxAge
   * @return controlMaxAge
  **/
  @JsonProperty("control_max_age")
  @Valid
  public Boolean isControlMaxAge() {
    return controlMaxAge;
  }

  public void setControlMaxAge(Boolean controlMaxAge) {
    this.controlMaxAge = controlMaxAge;
  }

  public CachingRisposta controlMaxAge(Boolean controlMaxAge) {
    this.controlMaxAge = controlMaxAge;
    return this;
  }

 /**
   * Get regole
   * @return regole
  **/
  @JsonProperty("regole")
  @Valid
  public List<CachingRispostaRegola> getRegole() {
    return regole;
  }

  public void setRegole(List<CachingRispostaRegola> regole) {
    this.regole = regole;
  }

  public CachingRisposta regole(List<CachingRispostaRegola> regole) {
    this.regole = regole;
    return this;
  }

  public CachingRisposta addRegoleItem(CachingRispostaRegola regoleItem) {
    this.regole.add(regoleItem);
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class CachingRisposta {\n");
    sb.append("    ").append(toIndentedString(super.toString())).append("\n");
    sb.append("    stato: ").append(toIndentedString(stato)).append("\n");
    sb.append("    abilitato: ").append(toIndentedString(abilitato)).append("\n");
    sb.append("    cacheTimeoutSeconds: ").append(toIndentedString(cacheTimeoutSeconds)).append("\n");
    sb.append("    maxResponseSize: ").append(toIndentedString(maxResponseSize)).append("\n");
    sb.append("    maxResponseSizeKb: ").append(toIndentedString(maxResponseSizeKb)).append("\n");
    sb.append("    hashRequestUri: ").append(toIndentedString(hashRequestUri)).append("\n");
    sb.append("    hashAllQueryParameters: ").append(toIndentedString(hashAllQueryParameters)).append("\n");
    sb.append("    hashQueryParamaters: ").append(toIndentedString(hashQueryParamaters)).append("\n");
    sb.append("    hashHeaders: ").append(toIndentedString(hashHeaders)).append("\n");
    sb.append("    hashPayload: ").append(toIndentedString(hashPayload)).append("\n");
    sb.append("    controlNoCache: ").append(toIndentedString(controlNoCache)).append("\n");
    sb.append("    controlNoStore: ").append(toIndentedString(controlNoStore)).append("\n");
    sb.append("    controlMaxAge: ").append(toIndentedString(controlMaxAge)).append("\n");
    sb.append("    regole: ").append(toIndentedString(regole)).append("\n");
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
