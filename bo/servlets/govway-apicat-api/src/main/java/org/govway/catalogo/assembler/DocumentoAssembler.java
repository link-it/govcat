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
package org.govway.catalogo.assembler;

import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.tika.Tika;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.DocumentoService;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.Documento;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.DocumentoSingolo;
import org.govway.catalogo.servlets.model.DocumentoUpdate;
import org.govway.catalogo.servlets.model.DocumentoUpdate.TipoDocumentoEnum;
import org.govway.catalogo.servlets.model.DocumentoUpdateId;
import org.govway.catalogo.servlets.model.DocumentoUpdateNew;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class DocumentoAssembler extends RepresentationModelAssemblerSupport<DocumentoEntity, Documento> {

	@Autowired
	private DocumentoService service;

	@Autowired
	private Tika tika;

	public DocumentoAssembler() {
		super(ServiziController.class, Documento.class);
	}
	@Override
	public Documento toModel(DocumentoEntity entity) {
	    // Chiama il nuovo metodo con versione null
	    return toModel(entity, null);
	}

	// Nuovo metodo con due parametri
	public Documento toModel(DocumentoEntity entity, Long versioneSpecificata) {
	    Documento dettaglio = instantiateModel(entity);

	    // Copia delle proprietà generali
	    BeanUtils.copyProperties(entity, dettaglio);
	    dettaglio.setVersione(entity.getVersione());
	    dettaglio.setUuid(UUID.fromString(entity.getUuid()));
	    dettaglio.setContentType(entity.getTipo());
	    dettaglio.setFilename(entity.getFilename());

	    // Recupera lo storico dei documenti
	    List<DocumentoEntity> storicoEntities = service.findAll(entity.getUuid());

	    // Se è stata specificata una versione
	    if (versioneSpecificata != null) {
	        Optional<DocumentoEntity> documentoConVersione = storicoEntities.stream()
	            .filter(doc -> doc.getVersione().longValue() == versioneSpecificata)
	            .findFirst();

	        // Se il documento con la versione specificata è trovato
	        if (documentoConVersione.isPresent()) {
	            // Sovrascrivi il dettaglio con il documento specifico trovato
	            DocumentoEntity specificDocument = documentoConVersione.get();
	            BeanUtils.copyProperties(specificDocument, dettaglio);
	        } else {
	            // Gestire il caso in cui la versione specificata non è trovata (opzionale)
	            throw new NotFoundException(ErrorCode.DOC_404);
	        }
	    }

	    // Converti le versioni storiche in DocumentoSingolo
	    List<DocumentoSingolo> storico = storicoEntities.stream()
	            .map(this::toModelDocumentoSingolo)
	            .collect(Collectors.toList());

	    dettaglio.setStorico(storico);
	    
	    return dettaglio;
	}
	
	public DocumentoSingolo toModelDocumentoSingolo(DocumentoEntity entity) {
		
		DocumentoSingolo dettaglio = new DocumentoSingolo();

		BeanUtils.copyProperties(entity, dettaglio);
		
		dettaglio.setUuid(UUID.fromString(entity.getUuid()));
		dettaglio.setContentType(entity.getTipo());
		dettaglio.setFilename(entity.getFilename());
		dettaglio.setVersione(entity.getVersione());
		
		return dettaglio;
	}
	
	public DocumentoEntity toEntity(DocumentoCreate src, UtenteEntity u) {
		DocumentoEntity entity = new DocumentoEntity();
		
		entity.setUuid(UUID.randomUUID().toString());
		entity.setDataCreazione(new Date());
		entity.setUtenteCreazione(u.getPrincipal());
		entity.setVersione(1);

		if(src.getFilename()!=null) {
			entity.setFilename(src.getFilename());
		} else {
			entity.setFilename("N_A_");
		}
		
		if(src.getContentType() != null) {
			entity.setTipo(src.getContentType());
		} else {
			String contentType = this.tika.detect(src.getContent());
			entity.setTipo(contentType);
		}
		
		if(src.getContent()!=null) {
			entity.setRawData(Base64.getDecoder().decode(src.getContent()));
		}
		
		return entity;
	}
	
	public DocumentoEntity toEntity(DocumentoUpdate documento, DocumentoEntity actual, UtenteEntity u) {
		if(documento == null) return null;
		
		
		if(documento.getTipoDocumento().equals(TipoDocumentoEnum.UUID)) {
			String uuid = ((DocumentoUpdateId)documento).getUuid().toString();

			DocumentoEntity entity = this.service.find(uuid)
					.orElseThrow(() -> new NotFoundException(ErrorCode.DOC_404));
			
			return entity;			
		} else if(documento.getTipoDocumento().equals(TipoDocumentoEnum.UUID_COPIA)) {
				String uuid = ((DocumentoUpdateId)documento).getUuid().toString();

				DocumentoEntity entity = this.service.find(uuid)
						.orElseThrow(() -> new NotFoundException(ErrorCode.DOC_404));
				
				DocumentoUpdateNew documentoUpdateNew = new DocumentoUpdateNew();
				
				documentoUpdateNew.setContent(Base64.getEncoder().encodeToString(entity.getRawData()));
				documentoUpdateNew.setContentType(entity.getTipo());
				documentoUpdateNew.setFilename(entity.getFilename());
				
				return this.toEntity(documentoUpdateNew, null, u);
			} else {
			return this.toEntity((DocumentoUpdateNew)documento, actual, u);
		}
	}

	
	public DocumentoEntity toEntity(DocumentoUpdateNew src, DocumentoEntity actual, UtenteEntity u) {
		DocumentoEntity entity = actual != null ? actual : new DocumentoEntity();
		
		if(actual == null) {
			entity.setDataCreazione(new Date());
			entity.setUtenteCreazione(u.getPrincipal());
			entity.setUuid(UUID.randomUUID().toString());
	        entity.setVersione(1);
		} else {
			entity = new DocumentoEntity();
	        entity.setDataCreazione(actual.getDataCreazione());
	        entity.setUtenteCreazione(actual.getUtenteCreazione());
	        entity.setUuid(actual.getUuid());
	        entity.setVersione(actual.getVersione() + 1); // Incrementa la versione
			
			entity.setDataUltimaModifica(new Date());
			entity.setUtenteUltimaModifica(u.getPrincipal());
		}
		
		if(src.getFilename()!=null) {
			entity.setFilename(src.getFilename());
		} else {
			entity.setFilename("N_A_");
		}

		String contentType = (src.getContentType() != null && !src.getContentType().isEmpty()) 
			    ? src.getContentType() 
			    : this.tika.detect(src.getContent());

		entity.setTipo(contentType);

		entity.setRawData(Base64.getDecoder().decode(src.getContent()));
		
		return entity;
	}
	
}
