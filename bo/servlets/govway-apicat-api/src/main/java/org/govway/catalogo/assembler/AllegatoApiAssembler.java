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
import org.govway.catalogo.core.orm.entity.AllegatoApiEntity;
import org.govway.catalogo.core.orm.entity.AllegatoApiEntity.TIPOLOGIA;
import org.govway.catalogo.core.orm.entity.AllegatoApiEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.servlets.model.Allegato;
import org.govway.catalogo.servlets.model.AllegatoItemCreate;
import org.govway.catalogo.servlets.model.AllegatoUpdate;
import org.govway.catalogo.servlets.model.AllegatoUpdateNew;
import org.govway.catalogo.servlets.model.TipologiaAllegatoEnum;
import org.govway.catalogo.servlets.model.VisibilitaAllegatoEnum;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class AllegatoApiAssembler extends RepresentationModelAssemblerSupport<AllegatoApiEntity, Allegato> {

	@Autowired
	private DocumentoAllegatoAssembler documentoAllegatoAssembler;
	
	@Autowired
	private CoreEngineAssembler coreEngineAssembler;
	
	public AllegatoApiAssembler() {
		super(ServiziController.class, Allegato.class);
	}

	@Override
	public Allegato toModel(AllegatoApiEntity entity) {
		
		Allegato dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setTipologia(toTipologia(entity.getTipologia()));
		dettaglio.setVisibilita(toVisibilita(entity.getVisibilita()));
		
		dettaglio.setUuid(entity.getDocumento().getUuid());
		dettaglio.setUrl("/"+entity.getDocumento().getUuid()+"/download");
		dettaglio.setFilename(entity.getDocumento().getFilename());
		dettaglio.setDescrizione(entity.getDocumento().getDescrizione());
		dettaglio.setContentType(entity.getDocumento().getTipo());
		dettaglio.setData(entity.getDocumento().getDataCreazione().toInstant().atOffset(ZoneOffset.UTC));
		return dettaglio;
	}
	
	public AllegatoApiEntity toEntity(AllegatoItemCreate src, ApiEntity api) {
		AllegatoApiEntity entity = new AllegatoApiEntity();
		BeanUtils.copyProperties(src, entity);
		
		entity.setTipologia(toTipologia(src.getTipologia()));
		entity.setVisibilita(toVisibilita(src.getVisibilita()));
		
		DocumentoEntity docEntity = new DocumentoEntity();
		docEntity.setUuid(UUID.randomUUID().toString());
		docEntity.setDataCreazione(new Date());
		docEntity.setUtenteCreazione(coreEngineAssembler.getUtenteSessione().getPrincipal());
		docEntity.setRawData(Base64.getDecoder().decode(src.getContent()));
		docEntity.setTipo(src.getContentType());
		docEntity.setFilename(src.getFilename());
		entity.setDocumento(docEntity);
		
		entity.setApi(api);
		return entity;
	}
	
	public AllegatoApiEntity toEntity(AllegatoUpdate src, AllegatoApiEntity entity) {
		BeanUtils.copyProperties(src, entity);
		
		entity.setTipologia(toTipologia(src.getTipologia()));
		entity.setVisibilita(toVisibilita(src.getVisibilita()));
		
		entity.setDocumento(documentoAllegatoAssembler.toEntity(src.getContent(), coreEngineAssembler.getUtenteSessione()));
		entity.getDocumento().setDescrizione(src.getDescrizione());
		entity.getDocumento().setFilename(src.getFilename());
		
		return entity;
	}
	
	public AllegatoApiEntity toEntity(AllegatoUpdateNew src, AllegatoApiEntity actual) {
		AllegatoApiEntity entity = actual!= null ? actual: new AllegatoApiEntity();
		BeanUtils.copyProperties(src, entity);
		
		entity.setTipologia(toTipologia(src.getTipologia()));
		entity.setVisibilita(toVisibilita(src.getVisibilita()));
		
		DocumentoEntity docEntity = new DocumentoEntity();
		docEntity.setUuid(UUID.randomUUID().toString());
		docEntity.setDataCreazione(new Date());
		docEntity.setUtenteCreazione(coreEngineAssembler.getUtenteSessione().getPrincipal());
		docEntity.setRawData(Base64.getDecoder().decode(src.getContent()));
		entity.setDocumento(docEntity);
		
		return entity;
	}
	
	public TIPOLOGIA toTipologia(TipologiaAllegatoEnum tipologia) {
		if(tipologia == null) return null;
		switch(tipologia) {
		case GENERICO: return TIPOLOGIA.GENERICO;
		case SPECIFICA: return TIPOLOGIA.SPECIFICA;
		case SPECIFICA_COLLAUDO: return TIPOLOGIA.SPECIFICA_COLLAUDO;
		case SPECIFICA_PRODUZIONE: return TIPOLOGIA.SPECIFICA_PRODUZIONE;
		}
		
		return null;
	}
	
	public TipologiaAllegatoEnum toTipologia(TIPOLOGIA tipologia) {
		if(tipologia == null) return null;
		switch(tipologia) {
		case GENERICO: return TipologiaAllegatoEnum.GENERICO;
		case SPECIFICA: return TipologiaAllegatoEnum.SPECIFICA;
		case SPECIFICA_COLLAUDO: return TipologiaAllegatoEnum.SPECIFICA_COLLAUDO;
		case SPECIFICA_PRODUZIONE: return TipologiaAllegatoEnum.SPECIFICA_PRODUZIONE;
		}
		
		return null;
	}
	
	public VISIBILITA toVisibilita(VisibilitaAllegatoEnum visibilita) {
		if(visibilita == null) return null;
		switch(visibilita) {
		case PUBBLICO: return VISIBILITA.PUBBLICO;
		case ADESIONE: return VISIBILITA.ADESIONE;
		case SERVIZIO: return VISIBILITA.SERVIZIO;
		case GESTORE: return VISIBILITA.GESTORE;
		}
		
		return null;
	}
	
	public VisibilitaAllegatoEnum toVisibilita(VISIBILITA visibilita) {
		if(visibilita == null) return null;
		switch(visibilita) {
		case PUBBLICO: return VisibilitaAllegatoEnum.PUBBLICO;
		case ADESIONE: return VisibilitaAllegatoEnum.ADESIONE;
		case SERVIZIO: return VisibilitaAllegatoEnum.SERVIZIO;
		case GESTORE: return VisibilitaAllegatoEnum.GESTORE;
		}
		
		return null;
	}

}
