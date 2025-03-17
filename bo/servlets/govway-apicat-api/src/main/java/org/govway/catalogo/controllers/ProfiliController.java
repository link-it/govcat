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
package org.govway.catalogo.controllers;

import java.util.List;
import java.util.UUID;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.servlets.api.ProfiliApi;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.PagedModelItemDominio;
import org.govway.catalogo.servlets.model.PagedModelItemProfilo;
import org.govway.catalogo.servlets.model.PagedModelItemSoggetto;
import org.govway.catalogo.servlets.model.Profilo;
import org.govway.catalogo.servlets.model.ProfiloCreate;
import org.govway.catalogo.servlets.model.ProfiloUpdate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

@ApiV1Controller
public class ProfiliController implements ProfiliApi {

	//TODO deluca scommentare e creare queste classi ricalcando quelle di Utente, es UtenteService o UtenteDettaglioAssembler
//	@Autowired
//	private ProfiloService service;
//
//	@Autowired
//	private PagedResourcesAssembler<ProfiloEntity> pagedResourceAssembler;
//
//    @Autowired
//    private ProfiloDettaglioAssembler dettaglioAssembler;
//   
//    @Autowired
//    private ProfiloItemAssembler itemAssembler;   
//
//    @Autowired
//    private ProfiloEngineAssembler engineAssembler;   
//
//    @Autowired
//    private ProfiloAuthorization authorization;   

	@Autowired
	private Configurazione configurazione;
	
	@Autowired
	private RequestUtils requestUtils;
	
	private Logger logger = LoggerFactory.getLogger(ProfiliController.class);

	@Override
	public ResponseEntity<Profilo> createProfilo(ProfiloCreate profiloCreate) {
		// TODO deluca prendere spunto dal corrisponente metodo di UtentiController
		return null;
	}

	@Override
	public ResponseEntity<Void> deleteProfilo(UUID idProfilo) {
		// TODO deluca prendere spunto dal corrisponente metodo di UtentiController
		return null;
	}

	@Override
	public ResponseEntity<Profilo> getProfilo(UUID idProfilo) {
		// TODO deluca prendere spunto dal corrisponente metodo di UtentiController
		return null;
	}

	@Override
	public ResponseEntity<PagedModelItemProfilo> listProfili(String q, Integer page, Integer size, List<String> sort) {
		// TODO deluca prendere spunto dal corrisponente metodo di UtentiController
		return null;
	}

	@Override
	public ResponseEntity<Profilo> updateProfilo(UUID idProfilo, ProfiloUpdate profiloUpdate) {
		// TODO deluca prendere spunto dal corrisponente metodo di UtentiController
		return null;
	}

	@Override
	public ResponseEntity<Dominio> createDominioProfilo(UUID idProfilo) {
		// TODO deluca prendere spunto dal corrisponente metodo di DominiController.*ReferenteDominio
		return null;
	}

	@Override
	public ResponseEntity<Soggetto> createSoggettoProfilo(UUID idProfilo) {
		// TODO deluca prendere spunto dal corrisponente metodo di DominiController.*ReferenteDominio
		return null;
	}

	@Override
	public ResponseEntity<Void> deleteDominioProfilo(UUID idProfilo, UUID idDominio) {
		// TODO deluca prendere spunto dal corrisponente metodo di DominiController.*ReferenteDominio
		return null;
	}

	@Override
	public ResponseEntity<Void> deleteSoggettoProfilo(UUID idProfilo, UUID idSoggetto) {
		// TODO deluca prendere spunto dal corrisponente metodo di DominiController.*ReferenteDominio
		return null;
	}

	@Override
	public ResponseEntity<PagedModelItemDominio> listDominiProfilo(UUID idProfilo,
			String q,Integer page,
			Integer size,List<String> sort) {
		// TODO deluca prendere spunto dal corrisponente metodo di DominiController.*ReferenteDominio
		return null;
	}

	@Override
	public ResponseEntity<PagedModelItemSoggetto> listSoggettiProfilo(UUID idProfilo,
			String q,Integer page,
			Integer size,List<String> sort) {
		// TODO deluca prendere spunto dal corrisponente metodo di DominiController.*ReferenteDominio
		return null;
	}

}
