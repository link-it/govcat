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
package org.govway.catalogo.controllers;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.servlets.api.ConfigurazioneApi;
import org.govway.catalogo.servlets.model.Configurazione;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;

@ApiV1Controller
public class ConfigurazioneController implements ConfigurazioneApi {

	private Logger logger = LoggerFactory.getLogger(ConfigurazioneController.class);

	@Autowired
	private Configurazione configurazione;

	@Autowired
	private UtenteService utenteService;
	
	@Autowired
	private CoreAuthorization coreAuthorization;   

    @Value("${govcat.version:2.0.0}")
	private String version;
	

	@Override
	public ResponseEntity<Configurazione> getConfigurazione() {
		try {
			this.logger.info("Invocazione in corso ...");     
//			this.logger.info("username:"+requestUtils.getUsername());
//			this.logger.info("FirstName:"+requestUtils.getFirstName());
//			this.logger.info("LastName:"+requestUtils.getLastName());
//			this.logger.info("Email:"+requestUtils.getEmail());
//			this.logger.info("cf:"+requestUtils.getCf());
			this.logger.debug("Autorizzazione completata con successo");     
                        
			this.logger.info("Invocazione completata con successo");
			return ResponseEntity.ok(this.configurazione);
     
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<String> getStatus() {
		try {
			this.logger.info("Invocazione in corso ...");     

			long cnt = this.utenteService.count(new UtenteSpecification());
			
			this.logger.info("Accesso al database effettuato con successo, trovati ["+cnt+"] utenti");

			this.logger.info("Invocazione completata con successo");
			return ResponseEntity.ok().build();
     
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<String> getVersion() {
		try {
			this.logger.info("Invocazione in corso ...");     

			if(!this.coreAuthorization.isAnounymous()) {
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(this.version);
			} else {
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok().build();
			}
			
     
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

}
