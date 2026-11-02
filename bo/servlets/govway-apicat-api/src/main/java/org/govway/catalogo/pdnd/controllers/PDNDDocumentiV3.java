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
package org.govway.catalogo.pdnd.controllers;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.govway.catalogo.servlets.pdnd.v3.client.api.GatewayApi;
import org.govway.catalogo.servlets.pdnd.v3.client.api.impl.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import okhttp3.Call;
import okhttp3.MultipartReader;
import okhttp3.Response;
import okhttp3.ResponseBody;

/**
 * Scarica dall'API PDND v3 i file di un descrittore: i documenti allegati e l'interfaccia.
 *
 * La PDND non restituisce il file da solo ma un multipart (schema {@code FileDownloadMultipart})
 * che ne trasporta anche nome e content type. Il client generato non sa deserializzare il
 * multipart, quindi le due operazioni sono invocate attraverso la chiamata costruita dal client
 * - che conserva indirizzo, autenticazione e intestazioni configurate - mentre la risposta viene
 * letta qui.
 */
public class PDNDDocumentiV3 {

	/** Nomi delle parti del multipart restituito dalla PDND. */
	private static final String PARTE_FILE = "file";
	private static final String PARTE_NOME = "filename";
	private static final String PARTE_CONTENT_TYPE = "contentType";

	/** Nome attribuito all'interfaccia, che la PDND restituisce senza metadati propri. */
	private static final String NOME_INTERFACCIA = "interface";

	private Logger logger = LoggerFactory.getLogger(PDNDDocumentiV3.class);

	private GatewayApi gatewayApiClient;

	public PDNDDocumentiV3(GatewayApi gatewayApiClient) {
		this.gatewayApiClient = gatewayApiClient;
	}

	public ResponseEntity<Resource> scaricaDocumento(UUID eserviceId, UUID descriptorId, UUID documentId)
			throws ApiException {

		return scarica(this.gatewayApiClient.downloadEServiceDescriptorDocumentCall(eserviceId, descriptorId,
				documentId, null), documentId.toString());
	}

	public ResponseEntity<Resource> scaricaInterfaccia(UUID eserviceId, UUID descriptorId) throws ApiException {
		return scarica(this.gatewayApiClient.downloadEServiceDescriptorInterfaceCall(eserviceId, descriptorId, null),
				NOME_INTERFACCIA);
	}

	/**
	 * @param nomePredefinito nome da attribuire al file quando la risposta non lo riporta
	 */
	private ResponseEntity<Resource> scarica(Call call, String nomePredefinito) throws ApiException {
		try(Response response = call.execute()) {
			ResponseBody body = response.body();

			if(!response.isSuccessful()) {
				throw new ApiException(response.message(), response.code(), response.headers().toMultimap(),
						body != null ? body.string() : null);
			}

			if(body == null) {
				throw new ApiException("Risposta priva di corpo", response.code(), response.headers().toMultimap(),
						null);
			}

			Documento documento = isMultipart(body.contentType())
					? leggiMultipart(body, nomePredefinito)
					: leggiCorpo(response, body, nomePredefinito);

			this.logger.debug("Scaricato il file [{}] di [{}] byte", documento.nome, documento.contenuto.length);

			return toResponseEntity(documento);
		} catch(IOException e) {
			throw new ApiException(e);
		}
	}

	private boolean isMultipart(okhttp3.MediaType contentType) {
		return contentType != null && MediaType.MULTIPART_FORM_DATA.getType().equals(contentType.type())
				&& MediaType.MULTIPART_FORM_DATA.getSubtype().equals(contentType.subtype());
	}

	private Documento leggiMultipart(ResponseBody body, String nomePredefinito) throws IOException, ApiException {
		Documento documento = new Documento();

		try(MultipartReader reader = new MultipartReader(body)) {
			MultipartReader.Part parte = reader.nextPart();
			while(parte != null) {
				try(MultipartReader.Part corrente = parte) {
					leggiParte(corrente, documento);
				}
				parte = reader.nextPart();
			}
		}

		if(documento.contenuto == null) {
			throw new ApiException("Il multipart restituito dalla PDND non contiene la parte ["+ PARTE_FILE +"]");
		}

		if(documento.nome == null) {
			documento.nome = nomePredefinito;
		}

		return documento;
	}

	private void leggiParte(MultipartReader.Part parte, Documento documento) throws IOException {
		ContentDisposition disposizione = toContentDisposition(parte.headers().get(HttpHeaders.CONTENT_DISPOSITION));
		if(disposizione == null) {
			return;
		}

		if(PARTE_FILE.equals(disposizione.getName())) {
			documento.contenuto = parte.body().readByteArray();
			if(documento.nome == null) {
				documento.nome = disposizione.getFilename();
			}
		} else if(PARTE_NOME.equals(disposizione.getName())) {
			documento.nome = parte.body().readUtf8();
		} else if(PARTE_CONTENT_TYPE.equals(disposizione.getName())) {
			documento.contentType = parte.body().readUtf8();
		}
	}

	/**
	 * La specifica PDND prevede una risposta multipart: se il file arriva da solo, il corpo viene
	 * preso cosi' com'e' e i metadati si ricavano dalle intestazioni della risposta.
	 */
	private Documento leggiCorpo(Response response, ResponseBody body, String nomePredefinito) throws IOException {
		Documento documento = new Documento();

		documento.contenuto = body.bytes();
		documento.contentType = body.contentType() != null ? body.contentType().toString() : null;

		ContentDisposition disposizione =
				toContentDisposition(response.headers().get(HttpHeaders.CONTENT_DISPOSITION));
		documento.nome = disposizione != null && disposizione.getFilename() != null
				? disposizione.getFilename()
				: nomePredefinito;

		return documento;
	}

	private ContentDisposition toContentDisposition(String intestazione) {
		if(intestazione == null) {
			return null;
		}

		try {
			return ContentDisposition.parse(intestazione);
		} catch(IllegalArgumentException e) {
			this.logger.debug("Content-Disposition [{}] non interpretabile: {}", intestazione, e.getMessage());
			return null;
		}
	}

	private ResponseEntity<Resource> toResponseEntity(Documento documento) {
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION,
						ContentDisposition.attachment().filename(documento.nome, StandardCharsets.UTF_8).build().toString())
				.contentType(toMediaType(documento.contentType))
				.contentLength(documento.contenuto.length)
				.body(new ByteArrayResource(documento.contenuto));
	}

	private MediaType toMediaType(String contentType) {
		if(contentType == null || contentType.isBlank()) {
			return MediaType.APPLICATION_OCTET_STREAM;
		}

		try {
			return MediaType.parseMediaType(contentType);
		} catch(InvalidMediaTypeException e) {
			this.logger.debug("Content type [{}] non interpretabile: {}", contentType, e.getMessage());
			return MediaType.APPLICATION_OCTET_STREAM;
		}
	}

	/** Contenuto e metadati di un file scaricato dalla PDND. */
	private static class Documento {
		private byte[] contenuto;
		private String nome;
		private String contentType;
	}
}
