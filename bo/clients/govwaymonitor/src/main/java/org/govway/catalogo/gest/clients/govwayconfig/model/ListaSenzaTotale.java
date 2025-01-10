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

public class ListaSenzaTotale  {
  
  @Schema(required = true, description = "The zero-ary offset index into the results")
 /**
   * The zero-ary offset index into the results  
  **/
  private Long offset = null;
  
  @Schema(required = true, description = "How many items to return at one time")
 /**
   * How many items to return at one time  
  **/
  private Integer limit = null;
  
  @Schema(description = "Link to first result page. Null if you are already on first page.")
 /**
   * Link to first result page. Null if you are already on first page.  
  **/
  private String first = null;
  
  @Schema(description = "Link to next result page. Null if you are on last page.")
 /**
   * Link to next result page. Null if you are on last page.  
  **/
  private String next = null;
  
  @Schema(description = "Link to previous result page. Null if you are on first page.")
 /**
   * Link to previous result page. Null if you are on first page.  
  **/
  private String prev = null;
 /**
   * The zero-ary offset index into the results
   * @return offset
  **/
  @JsonProperty("offset")
  @NotNull
  @Valid
  public Long getOffset() {
    return offset;
  }

  public void setOffset(Long offset) {
    this.offset = offset;
  }

  public ListaSenzaTotale offset(Long offset) {
    this.offset = offset;
    return this;
  }

 /**
   * How many items to return at one time
   * @return limit
  **/
  @JsonProperty("limit")
  @NotNull
  @Valid
  public Integer getLimit() {
    return limit;
  }

  public void setLimit(Integer limit) {
    this.limit = limit;
  }

  public ListaSenzaTotale limit(Integer limit) {
    this.limit = limit;
    return this;
  }

 /**
   * Link to first result page. Null if you are already on first page.
   * @return first
  **/
  @JsonProperty("first")
  @Valid
  public String getFirst() {
    return first;
  }

  public void setFirst(String first) {
    this.first = first;
  }

  public ListaSenzaTotale first(String first) {
    this.first = first;
    return this;
  }

 /**
   * Link to next result page. Null if you are on last page.
   * @return next
  **/
  @JsonProperty("next")
  @Valid
  public String getNext() {
    return next;
  }

  public void setNext(String next) {
    this.next = next;
  }

  public ListaSenzaTotale next(String next) {
    this.next = next;
    return this;
  }

 /**
   * Link to previous result page. Null if you are on first page.
   * @return prev
  **/
  @JsonProperty("prev")
  @Valid
  public String getPrev() {
    return prev;
  }

  public void setPrev(String prev) {
    this.prev = prev;
  }

  public ListaSenzaTotale prev(String prev) {
    this.prev = prev;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ListaSenzaTotale {\n");
    
    sb.append("    offset: ").append(toIndentedString(offset)).append("\n");
    sb.append("    limit: ").append(toIndentedString(limit)).append("\n");
    sb.append("    first: ").append(toIndentedString(first)).append("\n");
    sb.append("    next: ").append(toIndentedString(next)).append("\n");
    sb.append("    prev: ").append(toIndentedString(prev)).append("\n");
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
