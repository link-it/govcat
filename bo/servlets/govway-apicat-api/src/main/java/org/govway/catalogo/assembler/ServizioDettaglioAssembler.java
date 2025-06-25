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
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.ServizioAuthorization;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.GruppoEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.orm.entity.StatoServizioEntity;
import org.govway.catalogo.core.orm.entity.TagEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.ClasseUtenteService;
import org.govway.catalogo.core.services.DominioService;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.RichiestaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.DatiGenericiServizioUpdate;
import org.govway.catalogo.servlets.model.Grant;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.IdentificativoServizioUpdate;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.StatoUpdate;
import org.govway.catalogo.servlets.model.VisibilitaServizioEnum;
import org.govway.catalogo.servlets.model.TipoServizio;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.hateoas.server.mvc.WebMvcLinkBuilder;

public class ServizioDettaglioAssembler extends RepresentationModelAssemblerSupport<ServizioEntity, Servizio> {

	@Autowired
	private DominioService dominioService;

	@Autowired
	private SoggettoService soggettoService;

	@Autowired
	private ServizioService servizioService;

	@Autowired
	private ClasseUtenteService classeUtenteService;

	@Autowired
	private ServizioEngineAssembler engine;

	@Autowired
	private ClasseUtenteItemAssembler classeUtenteItemAssembler;

	@Autowired
	private UtenteItemAssembler utenteItemAssembler;

	@Autowired
	private SoggettoItemAssembler soggettoItemAssembler;

	@Autowired
	private ReferenteServizioAssembler referenteServizioAssembler;

	@Autowired
	private GruppoDettaglioAssembler gruppoDettaglioAssembler;

	@Autowired
	private Configurazione configurazione;
	
	@Autowired
	private ServizioAuthorization servizioAuthorization;   

	@Autowired
	private CoreAuthorization coreAuthorization;   

	public ServizioDettaglioAssembler() {
		super(ServiziController.class, Servizio.class);
	}

	@Override
	public Servizio toModel(ServizioEntity entity) {
		
		Servizio dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		if(entity.getStato().equals(configurazione.getServizio().getWorkflow().getStatoArchiviato())) {
			dettaglio.setStatoPrecedente(this.servizioAuthorization.getStatoPrecedente(entity));
		}
		
		dettaglio.setPackage(entity.is_package());

		dettaglio.setImmagine(engine.getImmagine(entity));
		dettaglio.setVincolaSkipCollaudo(isVincolaSkipCollaudo(entity));
		
		dettaglio.setIdServizio(UUID.fromString(entity.getIdServizio()));

		List<Gruppo> gruppi = new ArrayList<>();
		if(entity.getGruppi()!=null) {
			for(GruppoEntity g: entity.getGruppi()) {
				gruppi.add(gruppoDettaglioAssembler.toModel(g));
			}
		}
		dettaglio.setDominio(engine.getDominio(entity));
		dettaglio.setTipo(engine.toTipo(entity.getTipo()));
		
		dettaglio.setEliminabile(engine.isEliminabile(entity));
		
		if(entity.getSoggettoInterno()!=null) {
			dettaglio.setSoggettoInterno(soggettoItemAssembler.toModel(entity.getSoggettoInterno()));
		}
		
		dettaglio.setDataCreazione(entity.getDataCreazione().toInstant().atOffset(ZoneOffset.UTC));
		if(entity.getDataUltimaModifica()!=null) {
			dettaglio.setDataUltimaModifica(entity.getDataUltimaModifica().toInstant().atOffset(ZoneOffset.UTC));
		}

		dettaglio.setUtenteRichiedente(utenteItemAssembler.toModel(entity.getRichiedente()));
		
		if(entity.getUtenteUltimaModifica()!=null) {
			dettaglio.setUtenteUltimaModifica(utenteItemAssembler.toModel(entity.getUtenteUltimaModifica()));
		}
		
		try {

			if(dettaglio.getImmagine()!=null) {
				Link link = WebMvcLinkBuilder.
						linkTo(Class.forName(ServiziController.class.getName()).getMethod("getImmagineServizio", UUID.class), dettaglio.getIdServizio()).withRel("immagine");
				
				dettaglio.add(link);
			}
		} catch (NoSuchMethodException | SecurityException | ClassNotFoundException e) {
			throw new RuntimeException(e);
		}

		dettaglio.setVisibilita(engine.toVisibilita(entity.getVisibilita()));
		dettaglio.setClassi(classeUtenteItemAssembler.toCollectionModel(entity.getClassi()).getContent().stream().collect(Collectors.toList()));
		
		if(!entity.getTags().isEmpty()) {
			List<String> tags = new ArrayList<>();
			for(TagEntity tag: entity.getTags()) {
				tags.add(tag.getTag());
			}
			dettaglio.setTags(tags);
		}
		
		dettaglio.setAdesioneDisabilitata(entity.isAdesioneDisabilitata());
		dettaglio.setMultiAdesione(entity.isMultiAdesione());
		dettaglio.setFruizione(entity.isFruizione());

		return dettaglio;
	}
	
	public ServizioEntity toEntity(IdentificativoServizioUpdate src, ServizioEntity entity) {
		BeanUtils.copyProperties(src, entity);
		
		if(src.isSkipCollaudo() != null) {
			if(!src.isSkipCollaudo() && entity.isSkipCollaudo()) {
				if(isVincolaSkipCollaudo(entity)) {
					throw new BadRequestException("Impossibile disabilitare skip collaudo nel Servizio ["+entity.getNome()+" " + entity.getVersione()+"], in quanto associato ad almeno una adesione con skip collaudo abilitato");
				}
			}
			setSkipCollaudo(src.isSkipCollaudo(), entity);
		}

		entity.setFruizione(Boolean.TRUE.equals(src.isFruizione()));

		if(src.getIdDominio()!=null) {
			saveDominioServizio(src.getIdDominio(), src.getIdSoggettoInterno(), entity);
		} else {
			entity.setDominio(null);
		}
		
		entity.set_package(src.isPackage());
		entity.setVisibilita(engine.toVisibilita(src.getVisibilita(), !entity.is_package()));

		org.govway.catalogo.core.orm.entity.TipoServizio tipo = engine.toTipo(src.getTipo());
		
		if(!tipo.equals(entity.getTipo())) {
			if(!entity.getGruppi().isEmpty()) {
				throw new RichiestaNonValidaSemanticamenteException("Impossibile cambiare il Tipo per il Servizio["+entity.getNome()+" " + entity.getVersione() + "]. "+entity.getGruppi().size()+" Gruppi associati");
			}
			if(!entity.getApi().isEmpty()) {
				throw new RichiestaNonValidaSemanticamenteException("Impossibile cambiare il Tipo per il Servizio["+entity.getNome()+" " + entity.getVersione() + "]. "+entity.getApi().size()+" API associate");
			}
			
			entity.setTipo(tipo);
		}


		if(src.getClassi()!= null) {
			entity.getClassi().clear();
			for(UUID classe: src.getClassi()) {
				entity.getClassi().add(this.classeUtenteService.findByIdClasseUtente(classe)
						.orElseThrow(() -> new NotFoundException("ClasseUtente ["+classe+"] non trovata")));
			}
		} else {
			entity.getClassi().clear();
		}
		
		if(this.configurazione.getServizio().isConsentiNonSottoscrivibile() != null && 
				this.configurazione.getServizio().isConsentiNonSottoscrivibile()) {
			if(src.isAdesioneDisabilitata() != null) {
				entity.setAdesioneDisabilitata(src.isAdesioneDisabilitata());
			} else {
				entity.setAdesioneDisabilitata(false);
			}
		} else {
			entity.setAdesioneDisabilitata(false);
		}

		if(entity.getVisibilita() != null && entity.getVisibilita().equals(VISIBILITA.COMPONENTE)) {
			// imposto package e adesione consentita a false
			entity.set_package(false);
			entity.setAdesioneDisabilitata(true);
		}

		entity.setMultiAdesione(src.isMultiAdesione());

		setUltimaModifica(entity);
		return entity;
	}

	private void saveDominioServizio(UUID idDominio, UUID idSoggetto, ServizioEntity entity) {
		DominioEntity newDominio = dominioService.find(idDominio).
				orElseThrow(() -> new NotFoundException("Dominio ["+idDominio+"] non trovato"));
		
		if(entity.isFruizione()) {
			if(idSoggetto==null) {
				throw new RichiestaNonValidaSemanticamenteException("Dominio ["+newDominio.getNome()+"] esterno e soggetto interno non specificato");
			}
			
			SoggettoEntity soggettoInterno = this.soggettoService.find(idSoggetto).
					orElseThrow(() -> new NotFoundException("Soggetto ["+idSoggetto+"] non trovato"));
			
			if(entity.isFruizione()) {
				throw new RichiestaNonValidaSemanticamenteException("Il soggetto interno ["+soggettoInterno.getNome()+"] deve appartenere a una organizzazione interna");
			}
			
			entity.setSoggettoInterno(soggettoInterno);

		}

		if(newDominio.equals(entity.getDominio())) {
			return;
		}
		
		entity.setDominio(newDominio);
		
		if(entity.isSkipCollaudo() && !entity.getDominio().isSkipCollaudo()) {
			throw new RichiestaNonValidaSemanticamenteException("Impossibile salvare il servizio ["+entity.getNome()+" " + entity.getVersione()+"]. Skip collaudo abilitato sul Servizio e non sul Dominio ["+entity.getDominio().getNome()+"]");
		}
		
		if(entity.getDominio().isDeprecato() && !this.coreAuthorization.isAdmin()) {
			throw new RichiestaNonValidaSemanticamenteException("Impossibile salvare il servizio ["+entity.getNome()+" " + entity.getVersione()+"]. Dominio ["+entity.getDominio().getNome()+"] deprecato");
		}
		
	}
	
	public ServizioEntity toEntity(DatiGenericiServizioUpdate src, ServizioEntity entity) {
		BeanUtils.copyProperties(src, entity);

		if(src.getTags()!= null) {
			for(String tag: src.getTags()) {
				entity.getTags().add(this.servizioService.getTag(tag));
			}
		} else {
			entity.getTags().clear();
		}
		
		entity.setImmagine(engine.toImmagine(src.getImmagine(), entity.getImmagine()));
		setUltimaModifica(entity);
		return entity;
	}
	
	private boolean isVincolaSkipCollaudo(ServizioEntity entity) {
		return entity.getAdesioni().stream().anyMatch(a -> a.isSkipCollaudo());
	}

	private void setSkipCollaudo(Boolean skipCollaudo, ServizioEntity entity) {
		entity.setSkipCollaudo(skipCollaudo);

		if(entity.isSkipCollaudo() && !entity.getDominio().isSkipCollaudo()) {
			throw new BadRequestException("Impossibile impostare skip collaudo sul Servizio ["+entity.getNome()+" "+entity.getVersione()+"], in quanto il Dominio ["+entity.getDominio().getNome()+"] non lo consente");
		}
	}

	public ServizioEntity toEntity(StatoUpdate src, ServizioEntity entity) {
		BeanUtils.copyProperties(src, entity);
		
		StatoServizioEntity e = new StatoServizioEntity();
		BeanUtils.copyProperties(src, e);

		e.setUuid(UUID.randomUUID().toString());
		e.setServizio(entity);
		e.setData(new Date());
		e.setUtente(engine.getUtenteSessione());
		entity.getStati().add(e);
		setUltimaModifica(entity);
		return entity;
	}
	
	
	public void setUltimaModifica(ServizioEntity entity) {
		entity.setDataUltimaModifica(new Date());
		entity.setUtenteUltimaModifica(engine.getUtenteSessione());
	}

	public ServizioEntity toEntity(ServizioCreate src) {
		ServizioEntity entity = new ServizioEntity();
		BeanUtils.copyProperties(src, entity);
		entity.setIdServizio(UUID.randomUUID().toString());
		if(src.getVisibilita() != null) {
			entity.setVisibilita(engine.toVisibilita(src.getVisibilita(), !src.isPackage()));
		}
		if(configurazione.getServizio()!= null &&
				configurazione.getServizio().getWorkflow()!= null &&
				configurazione.getServizio().getWorkflow().getStatoIniziale()!=null) {
			entity.setStato(configurazione.getServizio().getWorkflow().getStatoIniziale());
		}

		UtenteEntity utenteSessione = engine.getUtenteSessione();

		entity.setTipo(engine.toTipo(src.getTipo()));

		entity.setFruizione(Boolean.TRUE.equals(src.isFruizione()));

		if(src.getIdDominio()!=null) {
			saveDominioServizio(src.getIdDominio(), src.getIdSoggettoInterno(), entity);
		}
		
		setSkipCollaudo(src.isSkipCollaudo(), entity);
		
		if(src.getImmagine()!=null) {
			entity.setImmagine(engine.toImmagine(src.getImmagine()));
		}
		
		if(src.getTags()!= null) {
			for(String tag: src.getTags()) {
				entity.getTags().add(this.servizioService.getTag(tag));
			}
		} else {
			entity.getTags().clear();
		}
		
		if(src.getClassi()!= null) {
			entity.getClassi().clear();
			for(UUID classe: src.getClassi()) {
				entity.getClassi().add(this.classeUtenteService.findByIdClasseUtente(classe)
						.orElseThrow(() -> new NotFoundException("ClasseUtente ["+classe+"] non trovata")));
			}
		} else {
			entity.getClassi().clear();
		}

		if(src.getReferenti()!=null) {
			for(ReferenteCreate referente: src.getReferenti()) {
				entity.getReferenti().add(referenteServizioAssembler.toEntity(referente, entity));
			}
		} else {
			if(!src.isPackage()) {
				throw new BadRequestException("Referenti non possono essere null su un Servizio non Package");
			}
		}
		
		if(this.configurazione.getServizio().isConsentiNonSottoscrivibile() != null && 
				this.configurazione.getServizio().isConsentiNonSottoscrivibile()) {
			if(src.isAdesioneDisabilitata() != null) {
				entity.setAdesioneDisabilitata(src.isAdesioneDisabilitata());
			} else {
				entity.setAdesioneDisabilitata(false);
			}
		} else {
			entity.setAdesioneDisabilitata(false);
		}

		entity.set_package(src.isPackage());

		if(entity.getVisibilita() != null && entity.getVisibilita().equals(VISIBILITA.COMPONENTE)) {
			// imposto package e adesione consentita a false
			entity.set_package(false);
			entity.setAdesioneDisabilitata(true);
		}

		entity.setMultiAdesione(src.isMultiAdesione() != null ? src.isMultiAdesione(): false);

		entity.setDataCreazione(new Date());
		entity.setRichiedente(utenteSessione);
		
		return entity;
	}

	public VISIBILITA toVisibilita(VisibilitaServizioEnum visibilita, boolean consentiComponente) {
		return engine.toVisibilita(visibilita, consentiComponente);
	}

	public Grant toGrant(ServizioEntity entity) {
		return servizioAuthorization.getGrant(entity);
	}

	public org.govway.catalogo.core.orm.entity.TipoServizio toTipo(TipoServizio tipo) {
		return engine.toTipo(tipo);
	}

}
