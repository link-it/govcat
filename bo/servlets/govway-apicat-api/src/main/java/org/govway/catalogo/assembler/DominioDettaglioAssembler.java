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

import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.core.dao.repositories.AdesioneRepository;
import org.govway.catalogo.core.dao.repositories.ServizioRepository;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.ClasseUtenteService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.RichiestaNonValidaSemanticamenteException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.DominioUpdate;
import org.govway.catalogo.servlets.model.VisibilitaDominioEnum;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class DominioDettaglioAssembler extends RepresentationModelAssemblerSupport<DominioEntity, Dominio> {

	/** Parametro dell'errore che indica il campo della richiesta coinvolto */
	private static final String CAMPO = "campo";

	@Autowired
	private SoggettoItemAssembler soggettoItemAssmbler;
	
	@Autowired
	private SoggettoService soggettoService;
	
	@Autowired
	private DominioEngineAssembler engine;
	
	@Autowired
	private ClasseUtenteService classeUtenteService;

	@Autowired
	private ClasseUtenteItemAssembler classeUtenteItemAssembler;

	@Autowired
	private ServizioRepository servizioRepository;

	@Autowired
	private AdesioneRepository adesioneRepository;

	@Autowired
	private Configurazione configurazione;

	public DominioDettaglioAssembler() {
		super(DominiController.class, Dominio.class);
	}

	@Override
	public Dominio toModel(DominioEntity entity) {
		
		Dominio dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdDominio(UUID.fromString(entity.getIdDominio()));
		dettaglio.setDeprecato(entity.isDeprecato());
		dettaglio.setVincolaSkipCollaudo(isVincolaSkipCollaudo(entity));
		dettaglio.setMultiAdesione(entity.isMultiAdesione());
		dettaglio.setAdesioneDisabilitata(entity.isAdesioneDisabilitata());

		dettaglio.setSoggettoReferente(this.soggettoItemAssmbler.toModel(entity.getSoggettoReferente()));
		dettaglio.setVisibilita(this.engine.toVisibilita(entity.getVisibilita()));
		dettaglio.setClassi(classeUtenteItemAssembler.toCollectionModel(entity.getClassi()).getContent().stream().collect(Collectors.toList()));
		return dettaglio;
	}
	
	public DominioEntity toEntity(DominioUpdate src, DominioEntity entity) {
		BeanUtils.copyProperties(src, entity);

		// deprecato e` facoltativo nel contratto: se non indicato resta invariato
		if(src.isDeprecato() != null) {
			entity.setDeprecato(src.isDeprecato());
		}

		SoggettoEntity soggetto = soggettoService.find(src.getIdSoggettoReferente()).orElseThrow(() -> new NotFoundException(ErrorCode.SOG_404, Map.of("idSoggetto", src.getIdSoggettoReferente().toString())));

		if(!soggetto.isReferente()) {
			throw new BadRequestException(ErrorCode.SOG_400_NOT_REFERENTE, Map.of("nomeSoggetto", soggetto.getNome(), CAMPO, "id_soggetto_referente"));
		}

		entity.setSoggettoReferente(soggetto);

		if(src.isSkipCollaudo() != null) {
			if(!src.isSkipCollaudo() && entity.isSkipCollaudo()) {
				if(isVincolaSkipCollaudo(entity)) {
					throw new BadRequestException(ErrorCode.GEN_400_SKIP_COLLAUDO, Map.of(CAMPO, "skip_collaudo"));
				}
			}
			setSkipCollaudo(src.isSkipCollaudo(), entity);
		}
		
		if(entity.isSkipCollaudo() && !entity.getSoggettoReferente().isSkipCollaudo()) {
			throw new RichiestaNonValidaSemanticamenteException(ErrorCode.VAL_422, Map.of(CAMPO, "skip_collaudo"));
		}

		entity.setVisibilita(this.engine.toVisibilita(src.getVisibilita()));
		if(src.getClassi()!= null) {
			entity.getClassi().clear();
			for(UUID classe: src.getClassi()) {
				entity.getClassi().add(this.classeUtenteService.findByIdClasseUtente(classe)
						.orElseThrow(() -> new NotFoundException(ErrorCode.CLS_404, java.util.Map.of("idClasseUtente", classe.toString()))));
			}
		} else {
			entity.getClassi().clear();
		}

		// Opzioni di adesione: se non indicate restano invariate. Attivarle richiede che tutti i
		// servizi del dominio le abbiano gia` attive, perche` i servizi devono ereditarle.
		if(src.isMultiAdesione() != null) {
			if(src.isMultiAdesione() && !entity.isMultiAdesione()) {
				long servizi = this.servizioRepository.countNonMultiAdesioneByDominioId(entity.getId());
				if(servizi > 0) {
					throw new BadRequestException(ErrorCode.DOM_400_MULTI_ADESIONE, Map.of("nome", entity.getNome(), "numeroServizi", String.valueOf(servizi)));
				}
			}
			entity.setMultiAdesione(src.isMultiAdesione());
		}

		if(isConsentiNonSottoscrivibile()) {
			if(src.isAdesioneDisabilitata() != null) {
				if(src.isAdesioneDisabilitata() && !entity.isAdesioneDisabilitata()) {
					long servizi = this.servizioRepository.countAdesioneAbilitataByDominioId(entity.getId());
					if(servizi > 0) {
						throw new BadRequestException(ErrorCode.DOM_400_ADESIONE_DISABILITATA, Map.of("nome", entity.getNome(), "numeroServizi", String.valueOf(servizi)));
					}
				}
				entity.setAdesioneDisabilitata(src.isAdesioneDisabilitata());
			}
		} else {
			entity.setAdesioneDisabilitata(false);
		}
		return entity;
	}

	private boolean isConsentiNonSottoscrivibile() {
		return this.configurazione.getServizio() != null &&
				Boolean.TRUE.equals(this.configurazione.getServizio().isConsentiNonSottoscrivibile());
	}

	/**
	 * Lo skip collaudo del dominio non e` disattivabile se lo usano servizi del dominio o adesioni
	 * (non archiviate) ai suoi servizi: entrambi lo ricevono dal dominio (Issue 478).
	 */
	private boolean isVincolaSkipCollaudo(DominioEntity entity) {
		// Esistenza via query invece di entity.getServizi().stream().anyMatch(...): quest'ultimo
		// materializzava tutti i servizi del dominio ad ogni assemblaggio (collo nelle liste, dove
		// i domini grossi hanno centinaia di servizi e il dominio viene assemblato per ogni elemento).
		return entity.isSkipCollaudo() &&
				(this.servizioRepository.existsSkipCollaudoByDominioId(entity.getId()) ||
				this.adesioneRepository.existsSkipCollaudoByDominioIdNonArchiviate(entity.getId(),
						this.configurazione.getAdesione().getWorkflow().getStatoArchiviato()));
	}

	private void setSkipCollaudo(Boolean skipCollaudo, DominioEntity entity) {
		entity.setSkipCollaudo(skipCollaudo);

		if(entity.isSkipCollaudo() && !entity.getSoggettoReferente().isSkipCollaudo()) {
			throw new BadRequestException(ErrorCode.GEN_400_SKIP_COLLAUDO, Map.of(CAMPO, "skip_collaudo"));
		}
	}
	

	
	
	public DominioEntity toEntity(DominioCreate src) {
		DominioEntity entity = new DominioEntity();
		BeanUtils.copyProperties(src, entity);
		
		// deprecato e` facoltativo nel contratto: se non indicato vale false
		entity.setDeprecato(Boolean.TRUE.equals(src.isDeprecato()));
		entity.setIdDominio(UUID.randomUUID().toString());
		SoggettoEntity soggetto = soggettoService.find(src.getIdSoggettoReferente()).orElseThrow(() -> new NotFoundException(ErrorCode.SOG_404, Map.of("idSoggetto", src.getIdSoggettoReferente().toString())));

		if(!soggetto.isReferente()) {
			throw new BadRequestException(ErrorCode.SOG_400_NOT_REFERENTE, Map.of("nomeSoggetto", soggetto.getNome(), CAMPO, "id_soggetto_referente"));
		}

		entity.setSoggettoReferente(soggetto);
		entity.setVisibilita(this.engine.toVisibilita(src.getVisibilita()));
		
		setSkipCollaudo(src.isSkipCollaudo(), entity);

		if(src.getClassi()!= null) {
			entity.getClassi().clear();
			for(UUID classe: src.getClassi()) {
				entity.getClassi().add(this.classeUtenteService.findByIdClasseUtente(classe)
						.orElseThrow(() -> new NotFoundException(ErrorCode.CLS_404, java.util.Map.of("idClasseUtente", classe.toString()))));
			}
		} else {
			entity.getClassi().clear();
		}

		entity.setMultiAdesione(Boolean.TRUE.equals(src.isMultiAdesione()));
		entity.setAdesioneDisabilitata(isConsentiNonSottoscrivibile() && Boolean.TRUE.equals(src.isAdesioneDisabilitata()));

		return entity;
	}

	public VISIBILITA toVisibilita(VisibilitaDominioEnum visibilita) {
		return engine.toVisibilita(visibilita);
	}



}
