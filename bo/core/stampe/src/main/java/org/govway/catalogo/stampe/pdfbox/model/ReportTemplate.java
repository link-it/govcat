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

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Root class representing a PDF report template
 */
public class ReportTemplate {

    private String name;
    private String dataModel;
    private PageConfig page;
    private Map<String, FontConfig> fonts;
    private Map<String, StyleConfig> styles;
    private List<SectionConfig> sections;

    @JsonProperty("name")
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @JsonProperty("dataModel")
    public String getDataModel() {
        return dataModel;
    }

    public void setDataModel(String dataModel) {
        this.dataModel = dataModel;
    }

    @JsonProperty("page")
    public PageConfig getPage() {
        return page;
    }

    public void setPage(PageConfig page) {
        this.page = page;
    }

    @JsonProperty("fonts")
    public Map<String, FontConfig> getFonts() {
        return fonts;
    }

    public void setFonts(Map<String, FontConfig> fonts) {
        this.fonts = fonts;
    }

    @JsonProperty("styles")
    public Map<String, StyleConfig> getStyles() {
        return styles;
    }

    public void setStyles(Map<String, StyleConfig> styles) {
        this.styles = styles;
    }

    @JsonProperty("sections")
    public List<SectionConfig> getSections() {
        return sections;
    }

    public void setSections(List<SectionConfig> sections) {
        this.sections = sections;
    }

    /**
     * Page configuration
     */
    public static class PageConfig {
        private float width = 595;
        private float height = 842;
        private float marginLeft = 20;
        private float marginRight = 20;
        private float marginTop = 20;
        private float marginBottom = 20;

        @JsonProperty("width")
        public float getWidth() {
            return width;
        }

        public void setWidth(float width) {
            this.width = width;
        }

        @JsonProperty("height")
        public float getHeight() {
            return height;
        }

        public void setHeight(float height) {
            this.height = height;
        }

        @JsonProperty("marginLeft")
        public float getMarginLeft() {
            return marginLeft;
        }

        public void setMarginLeft(float marginLeft) {
            this.marginLeft = marginLeft;
        }

        @JsonProperty("marginRight")
        public float getMarginRight() {
            return marginRight;
        }

        public void setMarginRight(float marginRight) {
            this.marginRight = marginRight;
        }

        @JsonProperty("marginTop")
        public float getMarginTop() {
            return marginTop;
        }

        public void setMarginTop(float marginTop) {
            this.marginTop = marginTop;
        }

        @JsonProperty("marginBottom")
        public float getMarginBottom() {
            return marginBottom;
        }

        public void setMarginBottom(float marginBottom) {
            this.marginBottom = marginBottom;
        }

        public float getContentWidth() {
            return width - marginLeft - marginRight;
        }

        public float getContentHeight() {
            return height - marginTop - marginBottom;
        }
    }
}
