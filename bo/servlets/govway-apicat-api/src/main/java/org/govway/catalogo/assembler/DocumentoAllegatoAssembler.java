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

import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.DocumentoService;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.AllegatoMessaggio;
import org.govway.catalogo.servlets.model.AllegatoMessaggioCreate;
import org.govway.catalogo.servlets.model.AllegatoUpdateNew;
import org.govway.catalogo.servlets.model.DocumentoUpdate;
import org.govway.catalogo.servlets.model.DocumentoUpdate.TipoDocumentoEnum;
import org.govway.catalogo.servlets.model.DocumentoUpdateId;
import org.govway.catalogo.servlets.model.DocumentoUpdateNew;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;


public class DocumentoAllegatoAssembler extends RepresentationModelAssemblerSupport<DocumentoEntity, AllegatoMessaggio> {

	@Autowired
	private DocumentoService service;
	
	public DocumentoAllegatoAssembler() {
		super(ServiziController.class, AllegatoMessaggio.class);
	}

	@Override
	public AllegatoMessaggio toModel(DocumentoEntity entity) {
		
		AllegatoMessaggio dettaglio = instantiateModel(entity);

//		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setUuid(entity.getUuid());
		dettaglio.setData(entity.getDataCreazione().toInstant().atOffset(ZoneOffset.UTC));
		dettaglio.setFilename(entity.getFilename());
		dettaglio.setContentType(entity.getTipo());
		dettaglio.setUrl(null);
		
		return dettaglio;
	}
	
	public DocumentoEntity toEntity(AllegatoMessaggioCreate src, UtenteEntity utente) {
		DocumentoEntity entity = new DocumentoEntity();
		BeanUtils.copyProperties(src, entity);
		entity.setUuid(UUID.randomUUID().toString());
		entity.setDataCreazione(new Date());
		entity.setUtenteCreazione(utente.getPrincipal());
		entity.setRawData(Base64.getDecoder().decode(src.getContent()));
		return entity;
	}

	public DocumentoEntity toEntity(AllegatoUpdateNew src, UtenteEntity utente) {
		DocumentoEntity entity = new DocumentoEntity();
		BeanUtils.copyProperties(src, entity);
		entity.setUuid(UUID.randomUUID().toString());
		entity.setDataCreazione(new Date());
		entity.setUtenteCreazione(utente.getPrincipal());
		entity.setRawData(Base64.getDecoder().decode(src.getContent()));
		
		return entity;
	}

	public DocumentoEntity toEntity(DocumentoUpdate documento, UtenteEntity utente) {
		if(documento.getTipoDocumento().equals(TipoDocumentoEnum.NUOVO)) {
			return toEntityFromNew((DocumentoUpdateNew)documento, utente);
		} else {
			String uuid = ((DocumentoUpdateId)documento).getUuid().toString();
			return this.service.find(uuid)
					.orElseThrow(() -> new NotFoundException(ErrorCode.DOC_404));
		}
	}

	public DocumentoEntity toEntityFromNew(DocumentoUpdateNew src, UtenteEntity utente) {
		DocumentoEntity entity = new DocumentoEntity();
		BeanUtils.copyProperties(src, entity);
		entity.setUuid(UUID.randomUUID().toString());
		entity.setDataCreazione(new Date());
		entity.setUtenteCreazione(utente.getPrincipal());
		entity.setRawData(Base64.getDecoder().decode(src.getContent()));
		if(src.getFilename()!=null) {
			entity.setFilename(src.getFilename());
		}
		
		return entity;
	}

}
