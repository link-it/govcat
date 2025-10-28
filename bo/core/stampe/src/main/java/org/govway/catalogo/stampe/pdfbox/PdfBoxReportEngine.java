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
package org.govway.catalogo.stampe.pdfbox;

import java.awt.Color;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Base64;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import javax.imageio.ImageIO;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.govway.catalogo.stampe.pdfbox.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * PDF Report Engine using Apache PDFBox
 */
public class PdfBoxReportEngine {

    private static final Logger logger = LoggerFactory.getLogger(PdfBoxReportEngine.class);

    private final ObjectMapper objectMapper;
    private final Map<String, PDFont> fontCache;

    // TrueType font file paths in resources
    private static final Map<String, String> TRUETYPE_FONTS = new HashMap<>();

    static {
        TRUETYPE_FONTS.put("Times New Roman PS", "/fonts/Times New Roman PS.ttf");
        TRUETYPE_FONTS.put("Times New Roman PS-Bold", "/fonts/Times New Roman PS Bold.ttf");
        TRUETYPE_FONTS.put("Times New Roman PS-Italic", "/fonts/Times New Roman PS Italic.ttf");
        TRUETYPE_FONTS.put("Times New Roman PS-BoldItalic", "/fonts/Times New Roman PS Bold Italic.ttf");
    }

    public PdfBoxReportEngine() {
        this.objectMapper = new ObjectMapper();
        this.fontCache = new HashMap<>();
        initializeStandardFonts();
    }

    private void initializeStandardFonts() {
        // Standard PDF fonts (Type1 - always available)
        fontCache.put("Times-Roman", PDType1Font.TIMES_ROMAN);
        fontCache.put("Times-Bold", PDType1Font.TIMES_BOLD);
        fontCache.put("Times-Italic", PDType1Font.TIMES_ITALIC);
        fontCache.put("Times-BoldItalic", PDType1Font.TIMES_BOLD_ITALIC);
        fontCache.put("Helvetica", PDType1Font.HELVETICA);
        fontCache.put("Helvetica-Bold", PDType1Font.HELVETICA_BOLD);
        fontCache.put("Helvetica-Oblique", PDType1Font.HELVETICA_OBLIQUE);
        fontCache.put("Helvetica-BoldOblique", PDType1Font.HELVETICA_BOLD_OBLIQUE);
        fontCache.put("Courier", PDType1Font.COURIER);
        fontCache.put("Courier-Bold", PDType1Font.COURIER_BOLD);
    }

    /**
     * Load TrueType fonts from resources into the document
     */
    private void loadTrueTypeFonts(PDDocument document) throws IOException {
        for (Map.Entry<String, String> entry : TRUETYPE_FONTS.entrySet()) {
            String fontKey = entry.getKey();
            String fontPath = entry.getValue();

            try (InputStream fontStream = getClass().getResourceAsStream(fontPath)) {
                if (fontStream != null) {
                    PDFont font = PDType0Font.load(document, fontStream);
                    fontCache.put(fontKey, font);
                    logger.debug("Loaded TrueType font: {} from {}", fontKey, fontPath);
                } else {
                    logger.warn("TrueType font not found: {}", fontPath);
                }
            } catch (IOException e) {
                logger.warn("Failed to load TrueType font: {}", fontPath, e);
            }
        }
    }

    /**
     * Generate PDF from template and data
     */
    public byte[] generatePdf(InputStream templateStream, Object dataModel) throws Exception {
        // Load template
        ReportTemplate template = objectMapper.readValue(templateStream, ReportTemplate.class);

        logger.debug("Generating PDF for template: {}", template.getName());

        // Create PDF document
        try (PDDocument document = new PDDocument()) {
            // Load TrueType fonts from resources
            loadTrueTypeFonts(document);

            // Create first page
            PDRectangle pageSize = new PDRectangle(template.getPage().getWidth(), template.getPage().getHeight());
            PDPage page = new PDPage(pageSize);
            document.addPage(page);

            // Render sections
            float currentY = template.getPage().getHeight() - template.getPage().getMarginTop();

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                for (SectionConfig section : template.getSections()) {
                    // Check condition
                    if (section.getCondition() != null) {
                        boolean shouldRender = evaluateCondition(section.getCondition(), dataModel);
                        if (!shouldRender) {
                            continue;
                        }
                    }

                    // Render section elements
                    currentY = renderSection(document, contentStream, page, template, section, dataModel, currentY);
                }
            }

            // Output to byte array
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    private float renderSection(PDDocument document, PDPageContentStream contentStream, PDPage page,
                                 ReportTemplate template, SectionConfig section, Object dataModel, float startY) throws Exception {

        float currentY = startY;

        for (ElementConfig element : section.getElements()) {
            // Check element condition
            if (element.getCondition() != null) {
                boolean shouldRender = evaluateCondition(element.getCondition(), dataModel);
                if (!shouldRender) {
                    continue;
                }
            }

            // Render based on element type
            if (element instanceof TextFieldConfig) {
                currentY = renderTextField(contentStream, template, (TextFieldConfig) element, dataModel, currentY);
            } else if (element instanceof ImageFieldConfig) {
                currentY = renderImageField(document, contentStream, template, (ImageFieldConfig) element, dataModel, currentY);
            } else if (element instanceof TableConfig) {
                currentY = renderTable(contentStream, template, (TableConfig) element, dataModel, currentY);
            }
            // TODO: Handle nested reports
        }

        return currentY;
    }

    private float renderTextField(PDPageContentStream contentStream, ReportTemplate template,
                                   TextFieldConfig config, Object dataModel, float baseY) throws Exception {

        // Get text content
        String text = config.getStaticText();
        if (text == null && config.getDataPath() != null) {
            Object value = getNestedValue(dataModel, config.getDataPath());
            text = value != null ? value.toString() : "";
        }

        if (text == null || text.isEmpty()) {
            return baseY;
        }

        // Get style
        StyleConfig style = config.getStyleRef() != null ? template.getStyles().get(config.getStyleRef()) : null;
        FontConfig fontConfig = style != null && style.getFontRef() != null ?
            template.getFonts().get(style.getFontRef()) : null;

        if (fontConfig == null) {
            // Default font
            fontConfig = new FontConfig();
        }

        // Get font
        PDFont font = resolveFont(fontConfig);
        float fontSize = fontConfig.getSize();

        // Calculate position (PDF coordinates start from bottom-left)
        float x = template.getPage().getMarginLeft() + config.getX();
        float y = baseY - config.getY() - fontSize;

        // Apply padding if style has it
        float paddingLeft = 0, paddingTop = 0, paddingBottom = 0;
        if (style != null && style.getPadding() != null) {
            paddingLeft = style.getPadding().getLeft();
            paddingTop = style.getPadding().getTop();
            paddingBottom = style.getPadding().getBottom();
        }

        // Draw background if specified
        if (style != null && style.getBackgroundColor() != null) {
            Color bgColor = parseColor(style.getBackgroundColor());
            contentStream.setNonStrokingColor(bgColor);
            contentStream.addRect(x, y - paddingBottom, config.getWidth(), config.getHeight());
            contentStream.fill();
        }

        // Draw borders if specified
        if (style != null && style.getBorder() != null && style.getBorder().getWidth() > 0) {
            drawBorders(contentStream, style.getBorder(), x, y - paddingBottom, config.getWidth(), config.getHeight());
        }

        // Draw text
        Color textColor = parseColor(fontConfig.getColor());
        contentStream.setNonStrokingColor(textColor);
        contentStream.beginText();
        contentStream.setFont(font, fontSize);

        // Apply alignment
        float textX = x + paddingLeft;
        if (style != null && "center".equals(style.getTextAlign())) {
            float textWidth = font.getStringWidth(text) / 1000 * fontSize;
            textX = x + (config.getWidth() - textWidth) / 2;
        } else if (style != null && "right".equals(style.getTextAlign())) {
            float textWidth = font.getStringWidth(text) / 1000 * fontSize;
            textX = x + config.getWidth() - textWidth - paddingLeft;
        }

        float textY = y + config.getHeight() / 2 + fontSize / 3; // Vertical center approximation
        if (style != null && "top".equals(style.getVerticalAlign())) {
            textY = y + config.getHeight() - fontSize - paddingTop;
        } else if (style != null && "bottom".equals(style.getVerticalAlign())) {
            textY = y + paddingBottom;
        }

        contentStream.newLineAtOffset(textX, textY);
        contentStream.showText(text);
        contentStream.endText();

        // Reset color to black
        contentStream.setNonStrokingColor(Color.BLACK);

        return baseY - config.getHeight();
    }

    private float renderImageField(PDDocument document, PDPageContentStream contentStream, ReportTemplate template,
                                    ImageFieldConfig config, Object dataModel, float baseY) throws Exception {

        // Get image data
        Object value = getNestedValue(dataModel, config.getDataPath());
        if (value == null) {
            return baseY;
        }

        String imageData = value.toString();

        // Remove data URI prefix if specified
        if (config.isRemoveDataPrefix() && imageData.contains(",")) {
            imageData = imageData.substring(imageData.indexOf(",") + 1);
        }

        // Decode base64 if specified
        byte[] imageBytes;
        if (config.isDecodeBase64()) {
            imageBytes = Base64.getDecoder().decode(imageData);
        } else {
            imageBytes = imageData.getBytes();
        }

        // Load image
        try (ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes)) {
            var bufferedImage = ImageIO.read(bais);
            if (bufferedImage == null) {
                logger.warn("Could not read image data");
                return baseY;
            }

            PDImageXObject pdImage = PDImageXObject.createFromByteArray(document, imageBytes, "image");

            // Calculate position
            float x = template.getPage().getMarginLeft() + config.getX();
            float y = baseY - config.getY() - config.getHeight();

            // Apply alignment
            float imageX = x;
            if ("center".equals(config.getHAlign())) {
                imageX = x + (config.getWidth() - config.getWidth()) / 2;
            } else if ("right".equals(config.getHAlign())) {
                imageX = x + config.getWidth() - config.getWidth();
            }

            // Draw image
            contentStream.drawImage(pdImage, imageX, y, config.getWidth(), config.getHeight());

            return baseY - config.getHeight();
        }
    }

    private float renderTable(PDPageContentStream contentStream, ReportTemplate template,
                              TableConfig config, Object dataModel, float baseY) throws Exception {

        // Get table data
        Object dataValue = getNestedValue(dataModel, config.getDataPath());
        if (!(dataValue instanceof Collection)) {
            logger.warn("Table data path does not resolve to a collection: {}", config.getDataPath());
            return baseY;
        }

        Collection<?> rows = (Collection<?>) dataValue;
        if (rows.isEmpty()) {
            return baseY;
        }

        float currentY = baseY;
        float startX = template.getPage().getMarginLeft() + config.getX();

        // Render header
        if (config.getHeaderRow() != null) {
            currentY = renderTableHeader(contentStream, template, config, dataModel, startX, currentY);
        }

        // Render data rows
        int rowIndex = 0;
        for (Object row : rows) {
            currentY = renderTableDataRow(contentStream, template, config, row, rowIndex, startX, currentY);
            rowIndex++;
        }

        return currentY;
    }

    private float renderTableHeader(PDPageContentStream contentStream, ReportTemplate template,
                                     TableConfig config, Object dataModel, float startX, float startY) throws Exception {

        TableConfig.HeaderRowConfig headerConfig = config.getHeaderRow();
        StyleConfig style = headerConfig.getStyleRef() != null ?
            template.getStyles().get(headerConfig.getStyleRef()) : null;

        float currentX = startX;
        float y = startY;

        for (TableConfig.ColumnConfig column : headerConfig.getColumns()) {
            String headerText = column.getLabel();
            if (headerText == null && column.getLabelDataPath() != null) {
                Object value = getNestedValue(dataModel, column.getLabelDataPath());
                headerText = value != null ? value.toString() : "";
            }

            if (headerText != null) {
                renderTableCell(contentStream, template, headerText, style,
                    currentX, y, column.getWidth(), headerConfig.getHeight(), false);
            }

            currentX += column.getWidth();
        }

        return startY - headerConfig.getHeight();
    }

    private float renderTableDataRow(PDPageContentStream contentStream, ReportTemplate template,
                                      TableConfig config, Object row, int rowIndex, float startX, float startY) throws Exception {

        TableConfig.DataRowConfig dataConfig = config.getDataRow();
        StyleConfig style = dataConfig.getStyleRef() != null ?
            template.getStyles().get(dataConfig.getStyleRef()) : null;

        // Check for alternate row style
        boolean isAlternate = config.isAlternateRowStyle() && rowIndex % 2 != 0;
        String backgroundColor = null;
        if (isAlternate && style != null && style.getConditional() != null) {
            backgroundColor = style.getConditional().getBackgroundColor();
        }

        float currentX = startX;
        float y = startY;

        for (TableConfig.ColumnConfig column : dataConfig.getColumns()) {
            String cellText = "";
            if (column.getDataPath() != null) {
                Object value = getNestedValue(row, column.getDataPath());
                cellText = value != null ? value.toString() : "";
            }

            renderTableCell(contentStream, template, cellText, style,
                currentX, y, column.getWidth(), dataConfig.getMinHeight(), isAlternate, backgroundColor);

            currentX += column.getWidth();
        }

        return startY - dataConfig.getMinHeight();
    }

    private void renderTableCell(PDPageContentStream contentStream, ReportTemplate template,
                                  String text, StyleConfig style, float x, float y, float width, float height,
                                  boolean isAlternate) throws IOException {
        renderTableCell(contentStream, template, text, style, x, y, width, height, isAlternate, null);
    }

    private void renderTableCell(PDPageContentStream contentStream, ReportTemplate template,
                                  String text, StyleConfig style, float x, float y, float width, float height,
                                  boolean isAlternate, String alternateBackground) throws IOException {

        // Draw background
        String bgColor = style != null ? style.getBackgroundColor() : null;
        if (isAlternate && alternateBackground != null) {
            bgColor = alternateBackground;
        }

        if (bgColor != null) {
            Color color = parseColor(bgColor);
            contentStream.setNonStrokingColor(color);
            contentStream.addRect(x, y - height, width, height);
            contentStream.fill();
        }

        // Draw borders
        if (style != null && style.getBorder() != null && style.getBorder().getWidth() > 0) {
            drawBorders(contentStream, style.getBorder(), x, y - height, width, height);
        }

        // Draw text
        if (text != null && !text.isEmpty()) {
            FontConfig fontConfig = style != null && style.getFontRef() != null ?
                template.getFonts().get(style.getFontRef()) : null;

            if (fontConfig == null) {
                fontConfig = new FontConfig();
            }

            PDFont font = resolveFont(fontConfig);
            float fontSize = fontConfig.getSize();

            float paddingLeft = style != null && style.getPadding() != null ? style.getPadding().getLeft() : 0;
            float paddingTop = style != null && style.getPadding() != null ? style.getPadding().getTop() : 0;

            Color textColor = parseColor(fontConfig.getColor());
            contentStream.setNonStrokingColor(textColor);
            contentStream.beginText();
            contentStream.setFont(font, fontSize);

            float textX = x + paddingLeft;
            float textY = y - height / 2 + fontSize / 3; // Approximate vertical center

            contentStream.newLineAtOffset(textX, textY);
            contentStream.showText(text);
            contentStream.endText();
        }

        // Reset color
        contentStream.setNonStrokingColor(Color.BLACK);
    }

    private void drawBorders(PDPageContentStream contentStream, StyleConfig.BorderConfig border,
                             float x, float y, float width, float height) throws IOException {

        Color borderColor = parseColor(border.getColor());
        contentStream.setStrokingColor(borderColor);
        contentStream.setLineWidth(border.getWidth());

        if (border.isTop()) {
            contentStream.moveTo(x, y + height);
            contentStream.lineTo(x + width, y + height);
            contentStream.stroke();
        }
        if (border.isBottom()) {
            contentStream.moveTo(x, y);
            contentStream.lineTo(x + width, y);
            contentStream.stroke();
        }
        if (border.isLeft()) {
            contentStream.moveTo(x, y);
            contentStream.lineTo(x, y + height);
            contentStream.stroke();
        }
        if (border.isRight()) {
            contentStream.moveTo(x + width, y);
            contentStream.lineTo(x + width, y + height);
            contentStream.stroke();
        }

        contentStream.setStrokingColor(Color.BLACK);
    }

    private PDFont resolveFont(FontConfig fontConfig) {
        String fontKey = fontConfig.getFamily();

        // Map font with bold/italic modifiers for Times New Roman PS (TrueType)
        if ("Times New Roman PS".equals(fontKey)) {
            if (fontConfig.isBold() && fontConfig.isItalic()) {
                fontKey = "Times New Roman PS-BoldItalic";
            } else if (fontConfig.isBold()) {
                fontKey = "Times New Roman PS-Bold";
            } else if (fontConfig.isItalic()) {
                fontKey = "Times New Roman PS-Italic";
            }
        }
        // Map font with bold/italic modifiers for Times-Roman (Type1 fallback)
        else if ("Times-Roman".equals(fontKey)) {
            if (fontConfig.isBold() && fontConfig.isItalic()) {
                fontKey = "Times-BoldItalic";
            } else if (fontConfig.isBold()) {
                fontKey = "Times-Bold";
            } else if (fontConfig.isItalic()) {
                fontKey = "Times-Italic";
            }
        }

        return fontCache.getOrDefault(fontKey, PDType1Font.TIMES_ROMAN);
    }

    private Color parseColor(String colorHex) {
        if (colorHex == null || !colorHex.startsWith("#")) {
            return Color.BLACK;
        }
        try {
            return Color.decode(colorHex);
        } catch (NumberFormatException e) {
            return Color.BLACK;
        }
    }

    private boolean evaluateCondition(String condition, Object dataModel) {
        // Simple condition evaluation (for now just check if field is not null)
        // Format: "fieldName != null" or "fieldName.nestedField != null"
        try {
            if (condition.contains("!= null")) {
                String fieldPath = condition.substring(0, condition.indexOf("!= null")).trim();
                Object value = getNestedValue(dataModel, fieldPath);
                return value != null;
            }
            if (condition.contains("!= null && !")) {
                // Complex condition like: "list != null && !list.isEmpty()"
                String fieldPath = condition.substring(0, condition.indexOf("!= null")).trim();
                Object value = getNestedValue(dataModel, fieldPath);
                if (value == null) return false;
                if (value instanceof Collection) {
                    return !((Collection<?>) value).isEmpty();
                }
                return true;
            }
        } catch (Exception e) {
            logger.warn("Error evaluating condition: {}", condition, e);
        }
        return true;
    }

    private Object getNestedValue(Object obj, String path) {
        if (obj == null || path == null) {
            return null;
        }

        String[] parts = path.split("\\.");
        Object current = obj;

        for (String part : parts) {
            if (current == null) {
                return null;
            }

            try {
                // Try getter method first
                String getterName = "get" + Character.toUpperCase(part.charAt(0)) + part.substring(1);
                Method method = current.getClass().getMethod(getterName);
                current = method.invoke(current);
            } catch (Exception e) {
                // Try field access
                try {
                    Field field = current.getClass().getDeclaredField(part);
                    field.setAccessible(true);
                    current = field.get(current);
                } catch (Exception ex) {
                    logger.warn("Could not access property: {} on {}", part, current.getClass().getName());
                    return null;
                }
            }
        }

        return current;
    }
}
