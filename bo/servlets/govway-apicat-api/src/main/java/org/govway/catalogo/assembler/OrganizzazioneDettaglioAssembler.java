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

import java.util.UUID;

import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.OrganizzazioneUpdate;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class OrganizzazioneDettaglioAssembler extends RepresentationModelAssemblerSupport<OrganizzazioneEntity, Organizzazione> {

	@Autowired
	private Configurazione configurazione;
	
	@Autowired
	private SoggettoDettaglioAssembler soggettoDettaglioAssembler;

	@Autowired
	private SoggettoItemAssembler soggettoItemAssembler;

	@Autowired
	private SoggettoService soggettoService;

	public OrganizzazioneDettaglioAssembler() {
		super(OrganizzazioniController.class, Organizzazione.class);
	}

	@Override
	public Organizzazione toModel(OrganizzazioneEntity entity) {
		
		Organizzazione dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);
		
		dettaglio.setIdOrganizzazione(UUID.fromString(entity.getIdOrganizzazione()));

		dettaglio.setVincolaAderente(isVincolaAderente(entity));
		dettaglio.setVincolaReferente(isVincolaReferente(entity));
		
		dettaglio.setCambioEsternaConsentito(isCambioConsentito(entity));
		
		if(entity.getSoggettoDefault()!=null) {
			dettaglio.setSoggettoDefault(this.soggettoItemAssembler.toLimitedModel(entity.getSoggettoDefault()));
		}

		return dettaglio;
	}
	
	private Boolean isCambioConsentito(OrganizzazioneEntity entity) {

		for(SoggettoEntity s: entity.getSoggetti()) {
			for(DominioEntity d: s.getDomini()) {
				
				boolean existsServizioNonArchiviato = d.getServizi().stream()
						.anyMatch(serv -> {
							return !serv.getStato().equals(this.configurazione.getServizio().getWorkflow().getStatoArchiviato());	
						});

				if(existsServizioNonArchiviato) {
					return false;
				}

				if(entity.isEsterna()) {
					if(d.getReferenti()!= null) {
						boolean referenteDiAltraOrg = d.getReferenti().stream()
								.anyMatch(r -> {
									return r.getTipo().equals(TIPO_REFERENTE.REFERENTE) && !entity.equals(r.getReferente().getOrganizzazione());	
								});
								
						if(referenteDiAltraOrg) {
							return false;
						}
					}
				}
			}	
		}
		
		return true;
	}

	private Boolean isVincolaReferente(OrganizzazioneEntity entity) {
		return entity.getSoggetti().stream().map(s -> this.soggettoDettaglioAssembler.isVincolaReferente(s)).reduce(Boolean.FALSE, Boolean::logicalOr);
	}

	private Boolean isVincolaAderente(OrganizzazioneEntity entity) {
		return entity.getSoggetti().stream().map(s -> this.soggettoDettaglioAssembler.isVincolaAderente(s)).reduce(Boolean.FALSE, Boolean::logicalOr);
	}

	public OrganizzazioneEntity toEntity(OrganizzazioneUpdate src, OrganizzazioneEntity entity) {
		BeanUtils.copyProperties(src, entity);

		if(src.isAderente() != null) {
			if(!src.isAderente() && entity.isAderente()) {
				if(isVincolaAderente(entity)) {
					throw new BadRequestException(ErrorCode.ORG_001);
				}
				
				for(SoggettoEntity s: entity.getSoggetti()) {
					s.setAderente(false);
				}
			}
		}
		
		entity.setAderente(src.isAderente());

		if(src.isReferente() != null) {
			if(!src.isReferente() && entity.isReferente()) {
				if(isVincolaReferente(entity)) {
					throw new BadRequestException(ErrorCode.ORG_001);
				}

				for(SoggettoEntity s: entity.getSoggetti()) {
					s.setReferente(false);
				}
			}
		}
		
		entity.setReferente(src.isReferente());
		
		if(src.isEsterna() != null) {
			
			if(src.isEsterna().booleanValue() != entity.isEsterna()) {
				if(!isCambioConsentito(entity)) {
					throw new BadRequestException(ErrorCode.ORG_001);
				}
			}
			
			entity.setEsterna(src.isEsterna());
		}

		if(src.getIdSoggettoDefault()!=null) {
			entity.setSoggettoDefault(this.soggettoService.find(src.getIdSoggettoDefault()).orElseThrow(() -> new NotFoundException(ErrorCode.ORG_005)));
		}
		
		if(configurazione.getOrganizzazione().isCodiceFiscaleEnteAbilitato()) {
			if(entity.getCodiceFiscaleSoggetto()==null) {
				throw new BadRequestException(ErrorCode.VAL_001);
			}
		}
		
		if(configurazione.getOrganizzazione().isCodiceEnteAbilitato()) {
			if(entity.getCodiceEnte()==null) {
				throw new BadRequestException(ErrorCode.VAL_001);
			}
		}
		
		if(configurazione.getOrganizzazione().isCodiceFiscaleEnteAbilitato()) {
			if(entity.getIdTipoUtente()==null) {
				throw new BadRequestException(ErrorCode.VAL_001);
			}
		}

		return entity;
	}
	
	
	public OrganizzazioneEntity toEntity(OrganizzazioneCreate src) {
		OrganizzazioneEntity entity = new OrganizzazioneEntity();
		BeanUtils.copyProperties(src, entity);
		
		entity.setAderente(src.isAderente());
		entity.setReferente(src.isReferente());
		entity.setEsterna(src.isEsterna());

		if(configurazione.getOrganizzazione().isCodiceFiscaleEnteAbilitato()) {
			if(entity.getCodiceFiscaleSoggetto()==null) {
				throw new BadRequestException(ErrorCode.VAL_001);
			}
		}
		
		if(configurazione.getOrganizzazione().isCodiceEnteAbilitato()) {
			if(entity.getCodiceEnte()==null) {
				throw new BadRequestException(ErrorCode.VAL_001);
			}
		}
		
		if(configurazione.getOrganizzazione().isCodiceFiscaleEnteAbilitato()) {
			if(entity.getIdTipoUtente()==null) {
				throw new BadRequestException(ErrorCode.VAL_001);
			}
		}

		entity.setIdOrganizzazione(UUID.randomUUID().toString());
		return entity;
	}



}
