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

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Table configuration
 */
public class TableConfig extends ElementConfig {
    private String dataPath;
    private boolean alternateRowStyle = false;
    private HeaderRowConfig headerRow;
    private DataRowConfig dataRow;

    @Override
    public String getType() {
        return "table";
    }

    @JsonProperty("dataPath")
    public String getDataPath() {
        return dataPath;
    }

    public void setDataPath(String dataPath) {
        this.dataPath = dataPath;
    }

    @JsonProperty("alternateRowStyle")
    public boolean isAlternateRowStyle() {
        return alternateRowStyle;
    }

    public void setAlternateRowStyle(boolean alternateRowStyle) {
        this.alternateRowStyle = alternateRowStyle;
    }

    @JsonProperty("headerRow")
    public HeaderRowConfig getHeaderRow() {
        return headerRow;
    }

    public void setHeaderRow(HeaderRowConfig headerRow) {
        this.headerRow = headerRow;
    }

    @JsonProperty("dataRow")
    public DataRowConfig getDataRow() {
        return dataRow;
    }

    public void setDataRow(DataRowConfig dataRow) {
        this.dataRow = dataRow;
    }

    public static class HeaderRowConfig {
        private float height = 30;
        private String styleRef;
        private List<ColumnConfig> columns;

        @JsonProperty("height")
        public float getHeight() {
            return height;
        }

        public void setHeight(float height) {
            this.height = height;
        }

        @JsonProperty("styleRef")
        public String getStyleRef() {
            return styleRef;
        }

        public void setStyleRef(String styleRef) {
            this.styleRef = styleRef;
        }

        @JsonProperty("columns")
        public List<ColumnConfig> getColumns() {
            return columns;
        }

        public void setColumns(List<ColumnConfig> columns) {
            this.columns = columns;
        }
    }

    public static class DataRowConfig {
        private float minHeight = 30;
        private String styleRef;
        private List<ColumnConfig> columns;

        @JsonProperty("minHeight")
        public float getMinHeight() {
            return minHeight;
        }

        public void setMinHeight(float minHeight) {
            this.minHeight = minHeight;
        }

        @JsonProperty("styleRef")
        public String getStyleRef() {
            return styleRef;
        }

        public void setStyleRef(String styleRef) {
            this.styleRef = styleRef;
        }

        @JsonProperty("columns")
        public List<ColumnConfig> getColumns() {
            return columns;
        }

        public void setColumns(List<ColumnConfig> columns) {
            this.columns = columns;
        }
    }

    public static class ColumnConfig {
        private float width;
        private String label;
        private String labelDataPath;
        private String dataPath;
        private String styleRef;
        private boolean stretchWithOverflow = false;

        @JsonProperty("width")
        public float getWidth() {
            return width;
        }

        public void setWidth(float width) {
            this.width = width;
        }

        @JsonProperty("label")
        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        @JsonProperty("labelDataPath")
        public String getLabelDataPath() {
            return labelDataPath;
        }

        public void setLabelDataPath(String labelDataPath) {
            this.labelDataPath = labelDataPath;
        }

        @JsonProperty("dataPath")
        public String getDataPath() {
            return dataPath;
        }

        public void setDataPath(String dataPath) {
            this.dataPath = dataPath;
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
}
