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
 * Style configuration
 */
public class StyleConfig {
    private String fontRef;
    private String backgroundColor;
    private String textAlign = "left";
    private String verticalAlign = "top";
    private PaddingConfig padding;
    private BorderConfig border;
    private Float lineSpacing;
    private ConditionalStyle conditional;

    @JsonProperty("fontRef")
    public String getFontRef() {
        return fontRef;
    }

    public void setFontRef(String fontRef) {
        this.fontRef = fontRef;
    }

    @JsonProperty("backgroundColor")
    public String getBackgroundColor() {
        return backgroundColor;
    }

    public void setBackgroundColor(String backgroundColor) {
        this.backgroundColor = backgroundColor;
    }

    @JsonProperty("textAlign")
    public String getTextAlign() {
        return textAlign;
    }

    public void setTextAlign(String textAlign) {
        this.textAlign = textAlign;
    }

    @JsonProperty("verticalAlign")
    public String getVerticalAlign() {
        return verticalAlign;
    }

    public void setVerticalAlign(String verticalAlign) {
        this.verticalAlign = verticalAlign;
    }

    @JsonProperty("padding")
    public PaddingConfig getPadding() {
        return padding;
    }

    public void setPadding(PaddingConfig padding) {
        this.padding = padding;
    }

    @JsonProperty("border")
    public BorderConfig getBorder() {
        return border;
    }

    public void setBorder(BorderConfig border) {
        this.border = border;
    }

    @JsonProperty("lineSpacing")
    public Float getLineSpacing() {
        return lineSpacing;
    }

    public void setLineSpacing(Float lineSpacing) {
        this.lineSpacing = lineSpacing;
    }

    @JsonProperty("conditional")
    public ConditionalStyle getConditional() {
        return conditional;
    }

    public void setConditional(ConditionalStyle conditional) {
        this.conditional = conditional;
    }

    public static class PaddingConfig {
        private float top = 0;
        private float right = 0;
        private float bottom = 0;
        private float left = 0;

        @JsonProperty("top")
        public float getTop() {
            return top;
        }

        public void setTop(float top) {
            this.top = top;
        }

        @JsonProperty("right")
        public float getRight() {
            return right;
        }

        public void setRight(float right) {
            this.right = right;
        }

        @JsonProperty("bottom")
        public float getBottom() {
            return bottom;
        }

        public void setBottom(float bottom) {
            this.bottom = bottom;
        }

        @JsonProperty("left")
        public float getLeft() {
            return left;
        }

        public void setLeft(float left) {
            this.left = left;
        }
    }

    public static class BorderConfig {
        private float width = 0;
        private String color = "#C0C0C0";
        private boolean top = true;
        private boolean right = true;
        private boolean bottom = true;
        private boolean left = true;

        @JsonProperty("width")
        public float getWidth() {
            return width;
        }

        public void setWidth(float width) {
            this.width = width;
        }

        @JsonProperty("color")
        public String getColor() {
            return color;
        }

        public void setColor(String color) {
            this.color = color;
        }

        @JsonProperty("top")
        public boolean isTop() {
            return top;
        }

        public void setTop(boolean top) {
            this.top = top;
        }

        @JsonProperty("right")
        public boolean isRight() {
            return right;
        }

        public void setRight(boolean right) {
            this.right = right;
        }

        @JsonProperty("bottom")
        public boolean isBottom() {
            return bottom;
        }

        public void setBottom(boolean bottom) {
            this.bottom = bottom;
        }

        @JsonProperty("left")
        public boolean isLeft() {
            return left;
        }

        public void setLeft(boolean left) {
            this.left = left;
        }
    }

    public static class ConditionalStyle {
        private String condition;
        private String backgroundColor;

        @JsonProperty("condition")
        public String getCondition() {
            return condition;
        }

        public void setCondition(String condition) {
            this.condition = condition;
        }

        @JsonProperty("backgroundColor")
        public String getBackgroundColor() {
            return backgroundColor;
        }

        public void setBackgroundColor(String backgroundColor) {
            this.backgroundColor = backgroundColor;
        }
    }
}
