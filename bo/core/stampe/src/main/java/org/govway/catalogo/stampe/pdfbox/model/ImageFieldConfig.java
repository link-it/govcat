/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
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
 * Image field configuration
 */
public class ImageFieldConfig extends ElementConfig {
    private float height;
    private String dataPath;
    private String hAlign = "left";
    private String vAlign = "top";
    private String styleRef;
    private boolean decodeBase64 = true;
    private boolean removeDataPrefix = true;

    @Override
    public String getType() {
        return "image";
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

    @JsonProperty("hAlign")
    public String getHAlign() {
        return hAlign;
    }

    public void setHAlign(String hAlign) {
        this.hAlign = hAlign;
    }

    @JsonProperty("vAlign")
    public String getVAlign() {
        return vAlign;
    }

    public void setVAlign(String vAlign) {
        this.vAlign = vAlign;
    }

    @JsonProperty("styleRef")
    public String getStyleRef() {
        return styleRef;
    }

    public void setStyleRef(String styleRef) {
        this.styleRef = styleRef;
    }

    @JsonProperty("decodeBase64")
    public boolean isDecodeBase64() {
        return decodeBase64;
    }

    public void setDecodeBase64(boolean decodeBase64) {
        this.decodeBase64 = decodeBase64;
    }

    @JsonProperty("removeDataPrefix")
    public boolean isRemoveDataPrefix() {
        return removeDataPrefix;
    }

    public void setRemoveDataPrefix(boolean removeDataPrefix) {
        this.removeDataPrefix = removeDataPrefix;
    }
}
