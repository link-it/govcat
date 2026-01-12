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
package org.govway.catalogo.assembler;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.GruppoEntity;
import org.govway.catalogo.servlets.model.Documento;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.DocumentoUpdate;
import org.govway.catalogo.servlets.model.GerarchiaGruppo;
import org.govway.catalogo.servlets.model.PathGruppo;
import org.govway.catalogo.servlets.model.TipoServizio;
import org.springframework.beans.factory.annotation.Autowired;

public class GruppoEngineAssembler extends CoreEngineAssembler {

	@Autowired
	private DocumentoAssembler documentoAssembler;

	public Documento getImmagine(GruppoEntity entity) {
		if(entity.getImmagine()== null) return null;
		return documentoAssembler.toModel(entity.getImmagine());
	}

	public String getAlberatura(GruppoEntity entity) {
		return getAlberatura(entity, 0);
	}

	public String getAlberatura(GruppoEntity entity, int index) {
		String delim = "#";
		
		String alberatura = (entity.getId() != null ? entity.getId() : "") + delim;
		
		if(entity.getGruppoPadre() != null) {
			alberatura += getAlberatura(entity.getGruppoPadre(), index+1);
		}

		if(index == 0) {
			alberatura = delim + alberatura;
		}
		
		return alberatura;
	}

	public DocumentoEntity toImmagine(DocumentoUpdate immagine, DocumentoEntity actual) {
		return documentoAssembler.toEntity(immagine, actual, this.getUtenteSessione());
	}

	public DocumentoEntity toImmagine(DocumentoCreate immagine) {
		if(immagine == null) return null;
		return documentoAssembler.toEntity(immagine, this.getUtenteSessione());
	}


	public String getLabelGruppo(GruppoEntity entity) {
		GerarchiaGruppo gerarchia = this.toGerarchiaGruppoModel(entity);
		
		List<String> gLst = new ArrayList<>();
		
		while(gerarchia != null) {
			gLst.add(0, gerarchia.getNome());
			gerarchia = gerarchia.getPadre();
		}
		
		StringBuffer sb = new StringBuffer();
		for(String s: gLst) {
//			if(sb.length() > 0) {
				sb.append("/");
//			}
			
			sb.append(s);
		}
		
		return sb.toString();
		
	}

	public GerarchiaGruppo toGerarchiaGruppoModel(GruppoEntity entity) {
		
		GerarchiaGruppo dettaglio = new GerarchiaGruppo();
		

		dettaglio.setIdGruppo(UUID.fromString(entity.getIdGruppo()));
		dettaglio.setNome(entity.getNome());
		
		if(entity.getGruppoPadre() != null) {
			dettaglio.setPadre(toGerarchiaGruppoModel(entity.getGruppoPadre()));
		}

		return dettaglio;
	}
	
	public List<PathGruppo> getPathGruppo(GruppoEntity gruppo) {
		List<PathGruppo> lst = new ArrayList<>();
		
		lst.add(getPath(gruppo));
		
		if(gruppo.getGruppoPadre()!=null) {
			lst.add(0, getPath(gruppo.getGruppoPadre()));
		}
		
		return lst;
	}

	private PathGruppo getPath(GruppoEntity gruppo) {
		PathGruppo p = new PathGruppo();
		
		p.setIdGruppo(UUID.fromString(gruppo.getIdGruppo()));
		p.setNome(gruppo.getNome());
		
		return p;
	}

	public org.govway.catalogo.core.orm.entity.TipoServizio toTipo(TipoServizio tipo) {
		if(tipo == null) return null;
		switch(tipo) {
		case API: return org.govway.catalogo.core.orm.entity.TipoServizio.API;
		case GENERICO: return org.govway.catalogo.core.orm.entity.TipoServizio.GENERICO;
		}
		return null;
	}

	public TipoServizio toTipo(org.govway.catalogo.core.orm.entity.TipoServizio tipo) {
		if(tipo == null) return null;
		switch(tipo) {
		case API: return TipoServizio.API;
		case GENERICO: return TipoServizio.GENERICO;
		}
		return null;
	}


}
