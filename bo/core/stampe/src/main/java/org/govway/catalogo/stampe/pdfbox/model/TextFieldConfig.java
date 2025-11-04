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
 * Text field configuration
 */
public class TextFieldConfig extends ElementConfig {
    private float height;
    private String dataPath;
    private String staticText;
    private String styleRef;
    private boolean stretchWithOverflow = false;

    @Override
    public String getType() {
        return "text";
    }

    @JsonProperty("height")
    public float getHeight() {
        return height;
    }

    public void setHeight(float height) {
        this.height = height;
    }

    @JsonProperty("dataPath")
    public String getDataPath() {
        return dataPath;
    }

    public void setDataPath(String dataPath) {
        this.dataPath = dataPath;
    }

    @JsonProperty("staticText")
    public String getStaticText() {
        return staticText;
    }

    public void setStaticText(String staticText) {
        this.staticText = staticText;
    }

    @JsonProperty("styleRef")
    public String getStyleRef() {
        return styleRef;
    }

    public void setStyleRef(String styleRef) {
        this.styleRef = styleRef;
    }

    @JsonProperty("stretchWithOverflow")
    public boolean isStretchWithOverflow() {
        return stretchWithOverflow;
    }

    public void setStretchWithOverflow(boolean stretchWithOverflow) {
        this.stretchWithOverflow = stretchWithOverflow;
    }
}
