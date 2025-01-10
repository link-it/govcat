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

import org.govway.catalogo.gest.clients.govwayconfig.model.ListaSenzaTotale;
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

public class Lista extends ListaSenzaTotale {
  
  @Schema(required = true, description = "Number of items matching the filter criteria")
 /**
   * Number of items matching the filter criteria  
  **/
  private Long total = null;
  
  @Schema(description = "Link to last result page. Null if you are already on last page.")
 /**
   * Link to last result page. Null if you are already on last page.  
  **/
  private String last = null;
 /**
   * Number of items matching the filter criteria
   * minimum: 0
   * @return total
  **/
  @JsonProperty("total")
  @NotNull
  @Valid
 @Min(0L)  public Long getTotal() {
    return total;
  }

  public void setTotal(Long total) {
    this.total = total;
  }

  public Lista total(Long total) {
    this.total = total;
    return this;
  }

 /**
   * Link to last result page. Null if you are already on last page.
   * @return last
  **/
  @JsonProperty("last")
  @Valid
  public String getLast() {
    return last;
  }

  public void setLast(String last) {
    this.last = last;
  }

  public Lista last(String last) {
    this.last = last;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class Lista {\n");
    sb.append("    ").append(toIndentedString(super.toString())).append("\n");
    sb.append("    total: ").append(toIndentedString(total)).append("\n");
    sb.append("    last: ").append(toIndentedString(last)).append("\n");
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
