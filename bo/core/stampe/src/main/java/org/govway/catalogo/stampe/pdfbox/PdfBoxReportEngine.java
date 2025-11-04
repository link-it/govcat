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

        // Elements flow vertically - each element positions relative to currentY
        // Skip empty elements entirely (don't consume vertical space)
        float currentY = startY;

        for (ElementConfig element : section.getElements()) {
            // Check element condition
            if (element.getCondition() != null) {
                boolean shouldRender = evaluateCondition(element.getCondition(), dataModel);
                if (!shouldRender) {
                    continue;
                }
            }

            // Render based on element type - only if it has content
            if (element instanceof TextFieldConfig) {
                TextFieldConfig textConfig = (TextFieldConfig) element;
                if (hasContent(dataModel, textConfig.getDataPath(), textConfig.getStaticText())) {
                    currentY = renderTextFieldFlowing(contentStream, template, textConfig, dataModel, currentY);

                    // Add spacing based on element style
                    // Subtitle needs more space (15pt), section titles less (3pt), others 5pt
                    if ("subtitleBox".equals(textConfig.getStyleRef())) {
                        currentY -= 15; // More space after subtitle
                    } else if ("sectionTitleBox".equals(textConfig.getStyleRef())) {
                        currentY -= 3;  // Less space - section title should be close to its table
                    } else {
                        currentY -= 5;  // Default spacing
                    }
                }
                // If no content, skip entirely - don't consume space
            } else if (element instanceof ImageFieldConfig) {
                ImageFieldConfig imageConfig = (ImageFieldConfig) element;
                if (hasContent(dataModel, imageConfig.getDataPath(), null)) {
                    currentY = renderImageFieldFlowing(document, contentStream, template, imageConfig, dataModel, currentY);
                    // Add spacing after image
                    currentY -= 5;
                }
                // If no image, skip entirely - don't consume space
            } else if (element instanceof TableConfig) {
                TableConfig tableConfig = (TableConfig) element;
                // Check if table has data
                Object dataValue = getNestedValue(dataModel, tableConfig.getDataPath());
                if (dataValue instanceof Collection && !((Collection<?>) dataValue).isEmpty()) {
                    currentY = renderTable(contentStream, template, tableConfig, dataModel, currentY);
                    // Add more spacing after tables (15 points)
                    currentY -= 15;
                }
                // If table is empty, skip entirely
            }
        }

        return currentY;
    }

    /**
     * Check if element has content to render
     */
    private boolean hasContent(Object dataModel, String dataPath, String staticText) {
        if (staticText != null && !staticText.isEmpty()) {
            return true;
        }
        if (dataPath != null) {
            Object value = getNestedValue(dataModel, dataPath);
            return value != null && !value.toString().isEmpty();
        }
        return false;
    }

    /**
     * Render text field with flowing positioning
     * @param currentY The current Y position in PDF coordinates (from bottom)
     * @return The new Y position after rendering
     */
    private float renderTextFieldFlowing(PDPageContentStream contentStream, ReportTemplate template,
                                          TextFieldConfig config, Object dataModel, float currentY) throws Exception {

        // Get text content
        String text = config.getStaticText();
        if (text == null && config.getDataPath() != null) {
            Object value = getNestedValue(dataModel, config.getDataPath());
            text = value != null ? value.toString() : "";
        }

        if (text == null || text.isEmpty()) {
            return currentY;
        }

        // Get style
        StyleConfig style = config.getStyleRef() != null ? template.getStyles().get(config.getStyleRef()) : null;
        FontConfig fontConfig = style != null && style.getFontRef() != null ?
            template.getFonts().get(style.getFontRef()) : null;

        if (fontConfig == null) {
            fontConfig = new FontConfig();
        }

        // Get font
        PDFont font = resolveFont(fontConfig);
        float fontSize = fontConfig.getSize();

        // Calculate position - box starts at currentY
        float x = template.getPage().getMarginLeft() + config.getX();
        float boxTop = currentY;
        float boxBottom = boxTop - config.getHeight();

        // Apply padding
        float paddingLeft = 0, paddingTop = 0, paddingBottom = 0, paddingRight = 0;
        if (style != null && style.getPadding() != null) {
            paddingLeft = style.getPadding().getLeft();
            paddingTop = style.getPadding().getTop();
            paddingBottom = style.getPadding().getBottom();
            paddingRight = style.getPadding().getRight();
        }

        // Draw background
        if (style != null && style.getBackgroundColor() != null) {
            Color bgColor = parseColor(style.getBackgroundColor());
            contentStream.setNonStrokingColor(bgColor);
            contentStream.addRect(x, boxBottom, config.getWidth(), config.getHeight());
            contentStream.fill();
        }

        // Draw borders
        if (style != null && style.getBorder() != null && style.getBorder().getWidth() > 0) {
            drawBorders(contentStream, style.getBorder(), x, boxBottom, config.getWidth(), config.getHeight());
        }

        // Draw text with wrapping
        Color textColor = parseColor(fontConfig.getColor());
        contentStream.setNonStrokingColor(textColor);

        float availableWidth = config.getWidth() - paddingLeft - paddingRight;
        java.util.List<String> lines = wrapText(text, font, fontSize, availableWidth);

        // Calculate vertical position using proper font metrics
        // Get font metrics for accurate positioning
        float ascent = font.getFontDescriptor().getAscent() / 1000 * fontSize;
        float descent = font.getFontDescriptor().getDescent() / 1000 * fontSize;

        float availableHeight = config.getHeight() - paddingTop - paddingBottom;
        float totalTextHeight = lines.size() * fontSize * 1.2f;

        // Default: middle alignment - center the text block
        float startY = boxBottom + paddingBottom + (availableHeight + totalTextHeight) / 2 - fontSize * 0.2f;

        // Handle vertical alignment
        if (style != null && "top".equals(style.getVerticalAlign())) {
            // For top alignment, position baseline such that ascent stays below top edge
            // startY is the baseline of the first line
            // Text extends from (startY - descent) to (startY + ascent)
            // We want (startY + ascent) = boxTop - paddingTop
            startY = boxTop - paddingTop - ascent;
        } else if (style != null && "bottom".equals(style.getVerticalAlign())) {
            startY = boxBottom + paddingBottom + totalTextHeight - fontSize * 0.2f;
        } else if (style != null && "middle".equals(style.getVerticalAlign())) {
            // Center the text block properly
            float textBlockMiddle = boxBottom + paddingBottom + availableHeight / 2;
            startY = textBlockMiddle + (totalTextHeight / 2) - (fontSize * 1.2f * (lines.size() - 1)) / 2;
        }

        // Ensure text doesn't extend above the top padding (avoid border overlap)
        // This applies to all alignment modes
        float textTop = startY + ascent;  // Top of the first line of text
        float maxTop = boxTop - paddingTop;
        if (textTop > maxTop) {
            // Adjust startY down so text top aligns with padding boundary
            startY = maxTop - ascent;
        }

        contentStream.beginText();
        contentStream.setFont(font, fontSize);

        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i);
            float lineWidth = font.getStringWidth(line) / 1000 * fontSize;
            float textX = x + paddingLeft;

            if (style != null && "center".equals(style.getTextAlign())) {
                textX = x + (config.getWidth() - lineWidth) / 2;
            } else if (style != null && "right".equals(style.getTextAlign())) {
                textX = x + config.getWidth() - lineWidth - paddingRight;
            }

            float lineY = startY - (i * fontSize * 1.2f);
            contentStream.newLineAtOffset(textX, lineY);
            contentStream.showText(line);
            contentStream.newLineAtOffset(-textX, -lineY);
        }

        contentStream.endText();
        contentStream.setNonStrokingColor(Color.BLACK);

        return boxBottom; // Return new Y position (bottom of this element)
    }

    /**
     * Render text field with absolute positioning within section
     * @param sectionTop The Y coordinate of the section top in PDF coordinates (from bottom)
     */
    private void renderTextFieldAbsolute(PDPageContentStream contentStream, ReportTemplate template,
                                          TextFieldConfig config, Object dataModel, float sectionTop) throws Exception {

        // Get text content
        String text = config.getStaticText();
        if (text == null && config.getDataPath() != null) {
            Object value = getNestedValue(dataModel, config.getDataPath());
            text = value != null ? value.toString() : "";
        }

        if (text == null || text.isEmpty()) {
            return; // Element at absolute position, skip if empty
        }

        // Get style
        StyleConfig style = config.getStyleRef() != null ? template.getStyles().get(config.getStyleRef()) : null;
        FontConfig fontConfig = style != null && style.getFontRef() != null ?
            template.getFonts().get(style.getFontRef()) : null;

        if (fontConfig == null) {
            fontConfig = new FontConfig();
        }

        // Get font
        PDFont font = resolveFont(fontConfig);
        float fontSize = fontConfig.getSize();

        // Calculate position
        // config.getY() is offset from TOP of section (top-down, 0 = section top)
        // PDF coordinates are bottom-up, so: boxTop = sectionTop - config.getY()
        float x = template.getPage().getMarginLeft() + config.getX();
        float boxTop = sectionTop - config.getY();
        float boxBottom = boxTop - config.getHeight();

        // Apply padding
        float paddingLeft = 0, paddingTop = 0, paddingBottom = 0, paddingRight = 0;
        if (style != null && style.getPadding() != null) {
            paddingLeft = style.getPadding().getLeft();
            paddingTop = style.getPadding().getTop();
            paddingBottom = style.getPadding().getBottom();
            paddingRight = style.getPadding().getRight();
        }

        // Draw background
        if (style != null && style.getBackgroundColor() != null) {
            Color bgColor = parseColor(style.getBackgroundColor());
            contentStream.setNonStrokingColor(bgColor);
            contentStream.addRect(x, boxBottom, config.getWidth(), config.getHeight());
            contentStream.fill();
        }

        // Draw borders
        if (style != null && style.getBorder() != null && style.getBorder().getWidth() > 0) {
            drawBorders(contentStream, style.getBorder(), x, boxBottom, config.getWidth(), config.getHeight());
        }

        // Draw text with wrapping
        Color textColor = parseColor(fontConfig.getColor());
        contentStream.setNonStrokingColor(textColor);

        float availableWidth = config.getWidth() - paddingLeft - paddingRight;
        java.util.List<String> lines = wrapText(text, font, fontSize, availableWidth);

        // Calculate vertical position
        float ascent = font.getFontDescriptor().getAscent() / 1000 * fontSize;
        float availableHeight = config.getHeight() - paddingTop - paddingBottom;
        float totalTextHeight = lines.size() * fontSize * 1.2f;
        float startY = boxBottom + paddingBottom + (availableHeight + totalTextHeight) / 2 - fontSize * 0.2f;

        // Handle vertical alignment
        if (style != null && "top".equals(style.getVerticalAlign())) {
            startY = boxTop - paddingTop - fontSize * 0.8f;
        } else if (style != null && "bottom".equals(style.getVerticalAlign())) {
            startY = boxBottom + paddingBottom + totalTextHeight - fontSize * 0.2f;
        }

        contentStream.beginText();
        contentStream.setFont(font, fontSize);

        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i);
            float lineWidth = font.getStringWidth(line) / 1000 * fontSize;
            float textX = x + paddingLeft;

            if (style != null && "center".equals(style.getTextAlign())) {
                textX = x + (config.getWidth() - lineWidth) / 2;
            } else if (style != null && "right".equals(style.getTextAlign())) {
                textX = x + config.getWidth() - lineWidth - paddingRight;
            }

            float lineY = startY - (i * fontSize * 1.2f);
            contentStream.newLineAtOffset(textX, lineY);
            contentStream.showText(line);
            contentStream.newLineAtOffset(-textX, -lineY);
        }

        contentStream.endText();
        contentStream.setNonStrokingColor(Color.BLACK);
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
            return baseY - config.getHeight(); // Still advance Y position
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

        // Calculate position (PDF coordinates start from bottom-left, template uses top-down)
        // baseY is the current Y position in PDF coordinates (from bottom)
        float x = template.getPage().getMarginLeft() + config.getX();
        // The box bottom edge in PDF coordinates
        float boxBottom = baseY - config.getHeight();

        // Apply padding if style has it
        float paddingLeft = 0, paddingTop = 0, paddingBottom = 0, paddingRight = 0;
        if (style != null && style.getPadding() != null) {
            paddingLeft = style.getPadding().getLeft();
            paddingTop = style.getPadding().getTop();
            paddingBottom = style.getPadding().getBottom();
            paddingRight = style.getPadding().getRight();
        }

        // Draw background if specified
        if (style != null && style.getBackgroundColor() != null) {
            Color bgColor = parseColor(style.getBackgroundColor());
            contentStream.setNonStrokingColor(bgColor);
            contentStream.addRect(x, boxBottom, config.getWidth(), config.getHeight());
            contentStream.fill();
        }

        // Draw borders if specified
        if (style != null && style.getBorder() != null && style.getBorder().getWidth() > 0) {
            drawBorders(contentStream, style.getBorder(), x, boxBottom, config.getWidth(), config.getHeight());
        }

        // Draw text with proper wrapping if needed
        Color textColor = parseColor(fontConfig.getColor());
        contentStream.setNonStrokingColor(textColor);

        // Calculate text position with proper font metrics
        float textX = x + paddingLeft;

        // Use proper font metrics for vertical centering
        // PDFBox font.getHeight() returns the font bounding box height (ascent + descent)
        // For vertical centering, we need to account for the baseline
        float fontHeight = font.getFontDescriptor().getFontBoundingBox().getHeight() / 1000 * fontSize;
        float descent = font.getFontDescriptor().getDescent() / 1000 * fontSize;
        float ascent = font.getFontDescriptor().getAscent() / 1000 * fontSize;

        float textY = boxBottom + paddingBottom; // Default: bottom alignment

        if (style != null && "middle".equals(style.getVerticalAlign())) {
            // Center the text baseline within the available height
            float availableHeight = config.getHeight() - paddingTop - paddingBottom;
            textY = boxBottom + paddingBottom + (availableHeight - ascent) / 2 + ascent;
        } else if (style != null && "top".equals(style.getVerticalAlign())) {
            textY = boxBottom + config.getHeight() - paddingTop - descent;
        }

        // Handle text wrapping for long text
        float availableWidth = config.getWidth() - paddingLeft - paddingRight;
        java.util.List<String> lines = wrapText(text, font, fontSize, availableWidth);

        contentStream.beginText();
        contentStream.setFont(font, fontSize);

        // Adjust horizontal alignment
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i);
            float lineWidth = font.getStringWidth(line) / 1000 * fontSize;
            float lineX = textX;

            if (style != null && "center".equals(style.getTextAlign())) {
                lineX = x + (config.getWidth() - lineWidth) / 2;
            } else if (style != null && "right".equals(style.getTextAlign())) {
                lineX = x + config.getWidth() - lineWidth - paddingRight;
            }

            // Adjust Y for multi-line text
            float lineY = textY - (i * fontSize * 1.2f); // 1.2 is line spacing multiplier

            contentStream.newLineAtOffset(lineX, lineY);
            contentStream.showText(line);
            contentStream.newLineAtOffset(-lineX, -lineY); // Reset position
        }

        contentStream.endText();

        // Reset color to black
        contentStream.setNonStrokingColor(Color.BLACK);

        return baseY - config.getHeight();
    }

    /**
     * Wrap text to fit within specified width
     */
    private java.util.List<String> wrapText(String text, PDFont font, float fontSize, float maxWidth) throws IOException {
        java.util.List<String> lines = new java.util.ArrayList<>();

        if (text == null || text.isEmpty()) {
            return lines;
        }

        // Check if text fits in one line
        float textWidth = font.getStringWidth(text) / 1000 * fontSize;
        if (textWidth <= maxWidth) {
            lines.add(text);
            return lines;
        }

        // Split into words and wrap
        String[] words = text.split("\\s+");
        StringBuilder currentLine = new StringBuilder();

        for (String word : words) {
            String testLine = currentLine.length() == 0 ? word : currentLine + " " + word;
            float testWidth = font.getStringWidth(testLine) / 1000 * fontSize;

            if (testWidth <= maxWidth) {
                if (currentLine.length() > 0) {
                    currentLine.append(" ");
                }
                currentLine.append(word);
            } else {
                // Current line is full, start new line
                if (currentLine.length() > 0) {
                    lines.add(currentLine.toString());
                    currentLine = new StringBuilder(word);
                } else {
                    // Single word is too long, force it
                    lines.add(word);
                }
            }
        }

        // Add remaining text
        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }

        return lines;
    }

    /**
     * Render image field with flowing positioning
     */
    private float renderImageFieldFlowing(PDDocument document, PDPageContentStream contentStream, ReportTemplate template,
                                           ImageFieldConfig config, Object dataModel, float currentY) throws Exception {

        Object value = getNestedValue(dataModel, config.getDataPath());
        if (value == null) {
            return currentY;
        }

        String imageData = value.toString();
        if (config.isRemoveDataPrefix() && imageData.contains(",")) {
            imageData = imageData.substring(imageData.indexOf(",") + 1);
        }

        byte[] imageBytes;
        if (config.isDecodeBase64()) {
            imageBytes = Base64.getDecoder().decode(imageData);
        } else {
            imageBytes = imageData.getBytes();
        }

        try (ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes)) {
            var bufferedImage = ImageIO.read(bais);
            if (bufferedImage == null) {
                logger.warn("Could not read image data");
                return currentY;
            }

            PDImageXObject pdImage = PDImageXObject.createFromByteArray(document, imageBytes, "image");

            float imageWidth = pdImage.getWidth();
            float imageHeight = pdImage.getHeight();

            float x = template.getPage().getMarginLeft() + config.getX();
            float boxTop = currentY;
            float boxBottom = boxTop - config.getHeight();

            // Scale to fit
            float scaleX = config.getWidth() / imageWidth;
            float scaleY = config.getHeight() / imageHeight;
            float scale = Math.min(scaleX, scaleY);
            float scaledWidth = imageWidth * scale;
            float scaledHeight = imageHeight * scale;

            // Apply alignment
            float imageX = x;
            if ("center".equals(config.getHAlign())) {
                imageX = x + (config.getWidth() - scaledWidth) / 2;
            } else if ("right".equals(config.getHAlign())) {
                imageX = x + config.getWidth() - scaledWidth;
            }

            float imageY = boxBottom;
            if ("center".equals(config.getVAlign()) || "middle".equals(config.getVAlign())) {
                imageY = boxBottom + (config.getHeight() - scaledHeight) / 2;
            } else if ("top".equals(config.getVAlign())) {
                imageY = boxTop - scaledHeight;
            }

            contentStream.drawImage(pdImage, imageX, imageY, scaledWidth, scaledHeight);

            return boxBottom;
        }
    }

    /**
     * Render image field with absolute positioning within section
     */
    private void renderImageFieldAbsolute(PDDocument document, PDPageContentStream contentStream, ReportTemplate template,
                                           ImageFieldConfig config, Object dataModel, float sectionTop) throws Exception {

        Object value = getNestedValue(dataModel, config.getDataPath());
        if (value == null) {
            return;
        }

        String imageData = value.toString();
        if (config.isRemoveDataPrefix() && imageData.contains(",")) {
            imageData = imageData.substring(imageData.indexOf(",") + 1);
        }

        byte[] imageBytes;
        if (config.isDecodeBase64()) {
            imageBytes = Base64.getDecoder().decode(imageData);
        } else {
            imageBytes = imageData.getBytes();
        }

        try (ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes)) {
            var bufferedImage = ImageIO.read(bais);
            if (bufferedImage == null) {
                logger.warn("Could not read image data");
                return;
            }

            PDImageXObject pdImage = PDImageXObject.createFromByteArray(document, imageBytes, "image");

            float imageWidth = pdImage.getWidth();
            float imageHeight = pdImage.getHeight();

            float x = template.getPage().getMarginLeft() + config.getX();
            float boxTop = sectionTop - config.getY();
            float boxBottom = boxTop - config.getHeight();

            // Scale to fit
            float scaleX = config.getWidth() / imageWidth;
            float scaleY = config.getHeight() / imageHeight;
            float scale = Math.min(scaleX, scaleY);
            float scaledWidth = imageWidth * scale;
            float scaledHeight = imageHeight * scale;

            // Apply alignment
            float imageX = x;
            if ("center".equals(config.getHAlign())) {
                imageX = x + (config.getWidth() - scaledWidth) / 2;
            } else if ("right".equals(config.getHAlign())) {
                imageX = x + config.getWidth() - scaledWidth;
            }

            float imageY = boxBottom;
            if ("center".equals(config.getVAlign()) || "middle".equals(config.getVAlign())) {
                imageY = boxBottom + (config.getHeight() - scaledHeight) / 2;
            } else if ("top".equals(config.getVAlign())) {
                imageY = boxTop - scaledHeight;
            }

            contentStream.drawImage(pdImage, imageX, imageY, scaledWidth, scaledHeight);
        }
    }

    private float renderImageField(PDDocument document, PDPageContentStream contentStream, ReportTemplate template,
                                    ImageFieldConfig config, Object dataModel, float baseY) throws Exception {

        // Get image data
        Object value = getNestedValue(dataModel, config.getDataPath());
        if (value == null) {
            return baseY - config.getHeight(); // Still advance Y position
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
                return baseY - config.getHeight();
            }

            PDImageXObject pdImage = PDImageXObject.createFromByteArray(document, imageBytes, "image");

            // Get actual image dimensions
            float imageWidth = pdImage.getWidth();
            float imageHeight = pdImage.getHeight();

            // Calculate position (PDF coordinates from bottom)
            float x = template.getPage().getMarginLeft() + config.getX();
            float boxBottom = baseY - config.getHeight();

            // Calculate scaled dimensions to fit within the configured width/height while maintaining aspect ratio
            float scaleX = config.getWidth() / imageWidth;
            float scaleY = config.getHeight() / imageHeight;
            float scale = Math.min(scaleX, scaleY);

            float scaledWidth = imageWidth * scale;
            float scaledHeight = imageHeight * scale;

            // Apply horizontal alignment
            float imageX = x;
            if ("center".equals(config.getHAlign())) {
                imageX = x + (config.getWidth() - scaledWidth) / 2;
            } else if ("right".equals(config.getHAlign())) {
                imageX = x + config.getWidth() - scaledWidth;
            }

            // Apply vertical alignment
            float imageY = boxBottom;
            if ("center".equals(config.getVAlign()) || "middle".equals(config.getVAlign())) {
                imageY = boxBottom + (config.getHeight() - scaledHeight) / 2;
            } else if ("top".equals(config.getVAlign())) {
                imageY = boxBottom + config.getHeight() - scaledHeight;
            }

            // Draw image with proper dimensions
            contentStream.drawImage(pdImage, imageX, imageY, scaledWidth, scaledHeight);

            return baseY - config.getHeight();
        }
    }

    /**
     * Render table with absolute positioning within section
     */
    private void renderTableAbsolute(PDPageContentStream contentStream, ReportTemplate template,
                                      TableConfig config, Object dataModel, float sectionTop) throws Exception {

        Object dataValue = getNestedValue(dataModel, config.getDataPath());
        if (!(dataValue instanceof Collection)) {
            logger.warn("Table data path does not resolve to a collection: {}", config.getDataPath());
            return;
        }

        Collection<?> rows = (Collection<?>) dataValue;
        if (rows.isEmpty()) {
            return;
        }

        float startX = template.getPage().getMarginLeft() + config.getX();
        // Table top is at sectionTop - config.getY()
        float currentY = sectionTop - config.getY();

        // Render header
        if (config.getHeaderRow() != null) {
            currentY = renderTableHeaderRow(contentStream, template, config, dataModel, startX, currentY);
        }

        // Render data rows
        int rowIndex = 0;
        for (Object row : rows) {
            currentY = renderTableDataRowInternal(contentStream, template, config, row, rowIndex, startX, currentY);
            rowIndex++;
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
            currentY = renderTableHeaderRow(contentStream, template, config, dataModel, startX, currentY);
        }

        // Render data rows
        int rowIndex = 0;
        for (Object row : rows) {
            currentY = renderTableDataRowInternal(contentStream, template, config, row, rowIndex, startX, currentY);
            rowIndex++;
        }

        return currentY;
    }

    private float renderTableHeaderRow(PDPageContentStream contentStream, ReportTemplate template,
                                        TableConfig config, Object dataModel, float startX, float startY) throws Exception {

        TableConfig.HeaderRowConfig headerConfig = config.getHeaderRow();

        float currentX = startX;
        float y = startY;

        for (TableConfig.ColumnConfig column : headerConfig.getColumns()) {
            String headerText = column.getLabel();
            if (headerText == null && column.getLabelDataPath() != null) {
                Object value = getNestedValue(dataModel, column.getLabelDataPath());
                headerText = value != null ? value.toString() : "";
            }

            if (headerText != null) {
                // Each header column has its own style
                StyleConfig columnStyle = column.getStyleRef() != null ?
                    template.getStyles().get(column.getStyleRef()) : null;

                renderTableCell(contentStream, template, headerText, columnStyle,
                    currentX, y, column.getWidth(), headerConfig.getHeight(), false);
            }

            currentX += column.getWidth();
        }

        return startY - headerConfig.getHeight();
    }

    private float renderTableDataRowInternal(PDPageContentStream contentStream, ReportTemplate template,
                                              TableConfig config, Object row, int rowIndex, float startX, float startY) throws Exception {

        TableConfig.DataRowConfig dataConfig = config.getDataRow();

        // Get first column's style to calculate height (all columns should have same font)
        StyleConfig firstColumnStyle = null;
        if (!dataConfig.getColumns().isEmpty()) {
            TableConfig.ColumnConfig firstColumn = dataConfig.getColumns().get(0);
            firstColumnStyle = firstColumn.getStyleRef() != null ?
                template.getStyles().get(firstColumn.getStyleRef()) : null;
        }

        // Calculate required row height based on cell content
        float requiredHeight = dataConfig.getMinHeight();
        FontConfig fontConfig = firstColumnStyle != null && firstColumnStyle.getFontRef() != null ?
            template.getFonts().get(firstColumnStyle.getFontRef()) : null;
        if (fontConfig == null) {
            fontConfig = new FontConfig();
        }
        PDFont font = resolveFont(fontConfig);
        float fontSize = fontConfig.getSize();
        float paddingLeft = firstColumnStyle != null && firstColumnStyle.getPadding() != null ? firstColumnStyle.getPadding().getLeft() : 0;
        float paddingRight = firstColumnStyle != null && firstColumnStyle.getPadding() != null ? firstColumnStyle.getPadding().getRight() : 0;
        float paddingTop = firstColumnStyle != null && firstColumnStyle.getPadding() != null ? firstColumnStyle.getPadding().getTop() : 0;
        float paddingBottom = firstColumnStyle != null && firstColumnStyle.getPadding() != null ? firstColumnStyle.getPadding().getBottom() : 0;

        // Check each column for wrapped text and calculate max height needed
        for (TableConfig.ColumnConfig column : dataConfig.getColumns()) {
            String cellText = "";
            if (column.getDataPath() != null) {
                Object value = getNestedValue(row, column.getDataPath());
                cellText = value != null ? value.toString() : "";
            }

            if (cellText != null && !cellText.isEmpty()) {
                float availableWidth = column.getWidth() - paddingLeft - paddingRight;
                java.util.List<String> lines = wrapText(cellText, font, fontSize, availableWidth);
                float textHeight = lines.size() * fontSize * 1.2f + paddingTop + paddingBottom;
                if (textHeight > requiredHeight) {
                    requiredHeight = textHeight;
                }
            }
        }

        float currentX = startX;
        float y = startY;

        for (TableConfig.ColumnConfig column : dataConfig.getColumns()) {
            String cellText = "";
            if (column.getDataPath() != null) {
                Object value = getNestedValue(row, column.getDataPath());
                cellText = value != null ? value.toString() : "";
            }

            // Each data column has its own style
            StyleConfig columnStyle = column.getStyleRef() != null ?
                template.getStyles().get(column.getStyleRef()) : null;

            // Check for alternate row style based on column's conditional
            String backgroundColor = null;
            boolean isAlternate = false;
            if (config.isAlternateRowStyle() && columnStyle != null && columnStyle.getConditional() != null) {
                // Evaluate the condition to determine if this row should use alternate style
                String condition = columnStyle.getConditional().getCondition();
                if (condition != null && condition.contains("rowIndex")) {
                    // Simple evaluation: check if rowIndex % 2 != 0 or rowIndex % 2 == 0
                    if (condition.contains("% 2 != 0") && rowIndex % 2 != 0) {
                        backgroundColor = columnStyle.getConditional().getBackgroundColor();
                        isAlternate = true;
                    } else if (condition.contains("% 2 == 0") && rowIndex % 2 == 0) {
                        backgroundColor = columnStyle.getConditional().getBackgroundColor();
                        isAlternate = true;
                    }
                }
            }

            renderTableCell(contentStream, template, cellText, columnStyle,
                currentX, y, column.getWidth(), requiredHeight, isAlternate, backgroundColor);

            currentX += column.getWidth();
        }

        return startY - requiredHeight;
    }

    private void renderTableCell(PDPageContentStream contentStream, ReportTemplate template,
                                  String text, StyleConfig style, float x, float y, float width, float height,
                                  boolean isAlternate) throws IOException {
        renderTableCell(contentStream, template, text, style, x, y, width, height, isAlternate, null);
    }

    private void renderTableCell(PDPageContentStream contentStream, ReportTemplate template,
                                  String text, StyleConfig style, float x, float y, float width, float height,
                                  boolean isAlternate, String alternateBackground) throws IOException {

        // Calculate cell box (y is the top of the cell in PDF coordinates)
        float boxBottom = y - height;

        // Draw background
        String bgColor = style != null ? style.getBackgroundColor() : null;
        if (isAlternate && alternateBackground != null) {
            bgColor = alternateBackground;
        }

        if (bgColor != null) {
            Color color = parseColor(bgColor);
            contentStream.setNonStrokingColor(color);
            contentStream.addRect(x, boxBottom, width, height);
            contentStream.fill();
        }

        // Draw borders
        if (style != null && style.getBorder() != null && style.getBorder().getWidth() > 0) {
            drawBorders(contentStream, style.getBorder(), x, boxBottom, width, height);
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
            float paddingBottom = style != null && style.getPadding() != null ? style.getPadding().getBottom() : 0;
            float paddingRight = style != null && style.getPadding() != null ? style.getPadding().getRight() : 0;

            Color textColor = parseColor(fontConfig.getColor());
            contentStream.setNonStrokingColor(textColor);

            // Wrap text to fit within cell
            float availableWidth = width - paddingLeft - paddingRight;
            java.util.List<String> lines = wrapText(text, font, fontSize, availableWidth);

            // Calculate proper vertical position using font metrics
            float ascent = font.getFontDescriptor().getAscent() / 1000 * fontSize;
            float descent = font.getFontDescriptor().getDescent() / 1000 * fontSize;

            // Calculate starting Y position for text
            float availableHeight = height - paddingTop - paddingBottom;
            float totalTextHeight = (lines.size() - 1) * fontSize * 1.2f + fontSize; // Total height of text block
            float boxTop = boxBottom + height;

            // Start Y should position the BASELINE of the first line
            // For middle alignment, center the text block but ensure it doesn't touch borders
            float textBlockMiddle = boxBottom + paddingBottom + availableHeight / 2;
            float startY = textBlockMiddle + totalTextHeight / 2 - descent;

            // Ensure text doesn't extend above the top padding (avoid border overlap)
            float textTop = startY + ascent;  // Top of the first line
            float maxTop = boxTop - paddingTop;
            if (textTop > maxTop) {
                // Adjust startY down so text top aligns with padding
                startY = maxTop - ascent;
            }

            contentStream.beginText();
            contentStream.setFont(font, fontSize);

            // Render each line
            for (int i = 0; i < lines.size(); i++) {
                String line = lines.get(i);
                float textX = x + paddingLeft;

                // Apply horizontal alignment if needed
                if (style != null && "center".equals(style.getTextAlign())) {
                    float lineWidth = font.getStringWidth(line) / 1000 * fontSize;
                    textX = x + (width - lineWidth) / 2;
                } else if (style != null && "right".equals(style.getTextAlign())) {
                    float lineWidth = font.getStringWidth(line) / 1000 * fontSize;
                    textX = x + width - lineWidth - paddingRight;
                }

                float lineY = startY - (i * fontSize * 1.2f);

                contentStream.newLineAtOffset(textX, lineY);
                contentStream.showText(line);
                contentStream.newLineAtOffset(-textX, -lineY);
            }

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

        // Draw borders using rectangle stroking - this keeps the stroke centered on the edge
        // The stroke will extend half inward and half outward from the edge
        // Since we want the border inside, we use addRect and stroke()
        if (border.isTop() && border.isBottom() && border.isLeft() && border.isRight()) {
            // All borders - draw as a rectangle
            contentStream.addRect(x, y, width, height);
            contentStream.stroke();
        } else {
            // Individual borders
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
