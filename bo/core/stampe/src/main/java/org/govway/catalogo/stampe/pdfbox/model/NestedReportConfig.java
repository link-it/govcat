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
package org.govway.catalogo.stampe.pdfbox.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Nested report configuration
 */
public class NestedReportConfig extends ElementConfig {
    private String dataPath;
    private String templateRef;
    private String headerLabel;
    private String headerStyleRef;

    @Override
    public String getType() {
        return "nested";
    }

    @JsonProperty("dataPath")
    public String getDataPath() {
        return dataPath;
    }

    public void setDataPath(String dataPath) {
        this.dataPath = dataPath;
    }

    @JsonProperty("templateRef")
    public String getTemplateRef() {
        return templateRef;
    }

    public void setTemplateRef(String templateRef) {
        this.templateRef = templateRef;
    }

    @JsonProperty("headerLabel")
    public String getHeaderLabel() {
        return headerLabel;
    }

    public void setHeaderLabel(String headerLabel) {
        this.headerLabel = headerLabel;
    }

    @JsonProperty("headerStyleRef")
    public String getHeaderStyleRef() {
        return headerStyleRef;
    }

    public void setHeaderStyleRef(String headerStyleRef) {
        this.headerStyleRef = headerStyleRef;
    }
}
