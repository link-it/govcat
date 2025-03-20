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
import org.govway.catalogo.servlets.api.TokenPoliciesApi;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.PagedModelItemTokenPolicy;
import org.govway.catalogo.servlets.model.TokenPolicy;
import org.govway.catalogo.servlets.model.TokenPolicyCreate;
import org.govway.catalogo.servlets.model.TokenPolicyUpdate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

@ApiV1Controller
public class TokenPoliciesController implements TokenPoliciesApi {

//	@Autowired
//	private TokenPolicyService service;
//
//	@Autowired
//	private PagedResourcesAssembler<TokenPolicyEntity> pagedResourceAssembler;
//
//    @Autowired
//    private TokenPolicyDettaglioAssembler dettaglioAssembler;
//   
//    @Autowired
//    private TokenPolicyItemAssembler itemAssembler;   
//
//    @Autowired
//    private TokenPolicyEngineAssembler engineAssembler;   
//
//    @Autowired
//    private TokenPolicyAuthorization authorization;   

	@Autowired
	private Configurazione configurazione;
	
	@Autowired
	private RequestUtils requestUtils;
	
	private Logger logger = LoggerFactory.getLogger(TokenPoliciesController.class);

	@Override
	public ResponseEntity<TokenPolicy> createTokenPolicy(TokenPolicyCreate profiloCreate) {
		// TODO deluca
		return null;
	}

	@Override
	public ResponseEntity<Void> deleteTokenPolicy(UUID idTokenPolicy) {
		// TODO deluca
		return null;
	}

	@Override
	public ResponseEntity<TokenPolicy> getTokenPolicy(UUID idTokenPolicy) {
		// TODO deluca
		return null;
	}

	@Override
	public ResponseEntity<PagedModelItemTokenPolicy> listTokenPolicies(String q, Integer page, Integer size, List<String> sort) {
		// TODO deluca
		return null;
	}

	@Override
	public ResponseEntity<TokenPolicy> updateTokenPolicy(UUID idTokenPolicy, TokenPolicyUpdate profiloUpdate) {
		// TODO deluca
		return null;
	}

}
