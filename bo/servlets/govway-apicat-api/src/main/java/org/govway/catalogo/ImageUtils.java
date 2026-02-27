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
package org.govway.catalogo;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;

import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.DocumentoUpdate;
import org.govway.catalogo.servlets.model.DocumentoUpdateNew;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility per la validazione e il ridimensionamento delle immagini.
 */
public class ImageUtils {

	private static final Logger logger = LoggerFactory.getLogger(ImageUtils.class);

	/** Tipi MIME consentiti per le immagini */
	private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
			"image/jpeg",
			"image/jpg",
			"image/png"
	);

	/** Percentuale di ridimensionamento per le immagini (0.0 - 1.0) */
	private static final double RESIZE_PERCENTAGE = 0.7;

	/** Qualità di compressione JPEG (0.0 - 1.0, dove 1.0 è massima qualità) */
	private static final float JPEG_QUALITY = 0.8f;

	private ImageUtils() {
		// Utility class
	}

	/**
	 * Valida e processa un'immagine in creazione.
	 *
	 * @param immagine l'immagine da validare e processare
	 * @param maxSizeMB dimensione massima in megabytes
	 * @return l'immagine processata (eventualmente ridimensionata)
	 * @throws BadRequestException se l'immagine non supera la validazione
	 */
	public static DocumentoCreate validateAndProcessImage(DocumentoCreate immagine, Integer maxSizeMB) {
		if (immagine == null || immagine.getContent() == null) {
			return immagine;
		}

		// Valida il tipo di contenuto
		validateContentType(immagine.getContentType());

		// Decodifica il contenuto base64
		byte[] imageData = decodeBase64Content(immagine.getContent());

		// Valida la dimensione
		validateSize(imageData, maxSizeMB);

		// Ridimensiona l'immagine
		byte[] processedData = resizeImage(imageData, immagine.getContentType());

		// Se l'immagine processata è più grande o uguale dell'originale, usa l'originale
		if (processedData.length >= imageData.length) {
			logger.info("Immagine non ridotta: originale {} bytes, processata {} bytes - mantengo originale",
					imageData.length, processedData.length);
			return immagine;
		}

		// Crea un nuovo DocumentoCreate con l'immagine ridimensionata
		DocumentoCreate result = new DocumentoCreate();
		result.setContent(Base64.getEncoder().encodeToString(processedData));
		result.setContentType(immagine.getContentType());
		result.setFilename(immagine.getFilename());

		logger.info("Immagine ridimensionata: {} bytes -> {} bytes (riduzione del {}%)",
				imageData.length, processedData.length,
				Math.round((1 - (double) processedData.length / imageData.length) * 100));

		return result;
	}

	/**
	 * Valida e processa un'immagine in aggiornamento.
	 * Gestisce solo DocumentoUpdateNew che contiene effettivamente i dati dell'immagine.
	 *
	 * @param immagine l'immagine da validare e processare
	 * @param maxSizeMB dimensione massima in megabytes
	 * @return l'immagine processata (eventualmente ridimensionata)
	 * @throws BadRequestException se l'immagine non supera la validazione
	 */
	public static DocumentoUpdate validateAndProcessImage(DocumentoUpdate immagine, Integer maxSizeMB) {
		if (immagine == null) {
			return immagine;
		}

		// Solo DocumentoUpdateNew contiene effettivamente i dati dell'immagine
		if (!(immagine instanceof DocumentoUpdateNew)) {
			return immagine;
		}

		DocumentoUpdateNew immagineNew = (DocumentoUpdateNew) immagine;

		if (immagineNew.getContent() == null) {
			return immagine;
		}

		// Valida il tipo di contenuto
		validateContentType(immagineNew.getContentType());

		// Decodifica il contenuto base64
		byte[] imageData = decodeBase64Content(immagineNew.getContent());

		// Valida la dimensione
		validateSize(imageData, maxSizeMB);

		// Ridimensiona l'immagine
		byte[] processedData = resizeImage(imageData, immagineNew.getContentType());

		// Se l'immagine processata è più grande dell'originale, usa l'originale
		if (processedData.length >= imageData.length) {
			return immagine;
		}

		// Crea un nuovo DocumentoUpdateNew con l'immagine ridimensionata
		DocumentoUpdateNew result = new DocumentoUpdateNew();
		result.setTipoDocumento(immagineNew.getTipoDocumento());
		result.setContent(Base64.getEncoder().encodeToString(processedData));
		result.setContentType(immagineNew.getContentType());
		result.setFilename(immagineNew.getFilename());

		logger.info("Immagine ridimensionata: {} bytes -> {} bytes (riduzione del {}%)",
				imageData.length, processedData.length,
				Math.round((1 - (double) processedData.length / imageData.length) * 100));

		return result;
	}

	/**
	 * Valida il tipo di contenuto dell'immagine.
	 *
	 * @param contentType il tipo MIME del contenuto
	 * @throws BadRequestException se il tipo non è supportato
	 */
	private static void validateContentType(String contentType) {
		if (contentType == null) {
			throw new BadRequestException(ErrorCode.IMG_400_FORMAT,
					Map.of("contentType", "null"));
		}

		String normalizedType = contentType.toLowerCase().trim();
		if (!ALLOWED_MIME_TYPES.contains(normalizedType)) {
			throw new BadRequestException(ErrorCode.IMG_400_FORMAT,
					Map.of("contentType", contentType));
		}
	}

	/**
	 * Valida la dimensione dell'immagine.
	 *
	 * @param imageData i dati dell'immagine
	 * @param maxSizeMB dimensione massima in megabytes
	 * @throws BadRequestException se la dimensione eccede il limite
	 */
	private static void validateSize(byte[] imageData, Integer maxSizeMB) {
		if (maxSizeMB == null || maxSizeMB <= 0) {
			return; // Nessun limite configurato
		}

		long maxBytes = (long) maxSizeMB * 1024 * 1024;
		if (imageData.length > maxBytes) {
			throw new BadRequestException(ErrorCode.IMG_400_SIZE,
					Map.of("size", String.valueOf(imageData.length / (1024 * 1024)) + " MB",
							"maxSize", maxSizeMB + " MB"));
		}
	}

	/**
	 * Decodifica il contenuto base64.
	 *
	 * @param base64Content il contenuto in base64
	 * @return i bytes decodificati
	 * @throws BadRequestException se il contenuto non è un base64 valido
	 */
	private static byte[] decodeBase64Content(String base64Content) {
		try {
			return Base64.getDecoder().decode(base64Content);
		} catch (IllegalArgumentException e) {
			throw new BadRequestException(ErrorCode.IMG_400_FORMAT,
					Map.of("error", "Contenuto base64 non valido"));
		}
	}

	/**
	 * Ridimensiona un'immagine mantenendo le proporzioni.
	 * Se l'immagine non può essere letta o elaborata, restituisce i dati originali.
	 *
	 * @param imageData i dati dell'immagine originale
	 * @param contentType il tipo MIME dell'immagine
	 * @return i dati dell'immagine ridimensionata, o i dati originali se non elaborabile
	 */
	private static byte[] resizeImage(byte[] imageData, String contentType) {
		try {
			// Leggi l'immagine
			BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(imageData));
			if (originalImage == null) {
				// Non è stato possibile leggere l'immagine, restituisce i dati originali
				logger.debug("Impossibile leggere l'immagine, verrà salvata senza ridimensionamento");
				return imageData;
			}

			// Calcola le nuove dimensioni
			int originalWidth = originalImage.getWidth();
			int originalHeight = originalImage.getHeight();
			int newWidth = (int) (originalWidth * RESIZE_PERCENTAGE);
			int newHeight = (int) (originalHeight * RESIZE_PERCENTAGE);

			// Assicurati che le dimensioni siano almeno 1 pixel
			newWidth = Math.max(1, newWidth);
			newHeight = Math.max(1, newHeight);

			// Crea l'immagine ridimensionata
			BufferedImage resizedImage = new BufferedImage(newWidth, newHeight,
					isPng(contentType) ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);

			Graphics2D g2d = resizedImage.createGraphics();
			g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
			g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
			g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
			g2d.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
			g2d.dispose();

			// Scrivi l'immagine nel formato originale
			ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
			boolean isPngFormat = isPng(contentType);
			String formatName = isPngFormat ? "png" : "jpg";

			byte[] result;
			if (isPngFormat) {
				// Per PNG, usa ImageIO.write() semplice - il resize da solo riduce le dimensioni
				if (!ImageIO.write(resizedImage, formatName, outputStream)) {
					logger.debug("Impossibile scrivere l'immagine PNG");
					return imageData;
				}
				result = outputStream.toByteArray();
				logger.info("Immagine PNG elaborata: dimensioni {}x{} -> {}x{}, bytes {} -> {}",
						originalWidth, originalHeight, newWidth, newHeight,
						imageData.length, result.length);
			} else {
				// Per JPEG, usa compressione configurabile
				Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName(formatName);
				if (!writers.hasNext()) {
					logger.debug("Nessun writer disponibile per il formato {}", formatName);
					return imageData;
				}

				ImageWriter writer = writers.next();
				try (ImageOutputStream ios = ImageIO.createImageOutputStream(outputStream)) {
					writer.setOutput(ios);

					ImageWriteParam param = writer.getDefaultWriteParam();
					if (param.canWriteCompressed()) {
						param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
						param.setCompressionQuality(JPEG_QUALITY);
						logger.info("Compressione JPEG applicata: quality={}", JPEG_QUALITY);
					}

					writer.write(null, new IIOImage(resizedImage, null, null), param);
				} finally {
					writer.dispose();
				}

				result = outputStream.toByteArray();
				logger.info("Immagine JPEG elaborata: dimensioni {}x{} -> {}x{}, bytes {} -> {}",
						originalWidth, originalHeight, newWidth, newHeight,
						imageData.length, result.length);
			}

			return result;

		} catch (IOException e) {
			// In caso di errore, restituisce i dati originali
			logger.debug("Errore durante il ridimensionamento dell'immagine, verrà salvata senza ridimensionamento", e);
			return imageData;
		}
	}

	/**
	 * Verifica se il tipo di contenuto è PNG.
	 *
	 * @param contentType il tipo MIME
	 * @return true se è PNG, false altrimenti
	 */
	private static boolean isPng(String contentType) {
		return contentType != null && contentType.toLowerCase().contains("png");
	}
}
