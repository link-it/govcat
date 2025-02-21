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
package org.govway.catalogo.authorization;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.govway.catalogo.core.orm.entity.PackageServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.ConfigurazioneWorkflow;
import org.govway.catalogo.servlets.model.EntitaComplessaError;

public class PackageAuthorization extends AbstractServizioAuthorization {

	@Override
	protected void checkCampiObbligatori(List<ConfigurazioneClasseDato> datiObbligatori, ServizioEntity entity, String stato) {

		List<EntitaComplessaError> erroreLst = new ArrayList<>();

		if(datiObbligatori!=null) {
			for(ConfigurazioneClasseDato datoObbligatorio: datiObbligatori) {
				Map<String, EntitaComplessaError> errori = new HashMap<>();
				switch(datoObbligatorio) {
				case COLLAUDO:
					this.checkCampiObbligatoriCollaudo(entity, errori);
					this.checkCampiObbligatoriCollaudoComponente(entity, errori);
					break;
				case GENERICO:
					this.checkCampiObbligatoriGenerico(entity, errori);
					this.checkCampiObbligatoriGenericoComponente(entity, errori);
					break;
				case IDENTIFICATIVO:
					this.checkCampiObbligatoriIdentificativo(entity, errori);
					this.checkCampiObbligatoriIdentificativoComponente(entity, errori);
					break;
				case PRODUZIONE:
					this.checkCampiObbligatoriProduzione(entity, errori);
					this.checkCampiObbligatoriProduzioneComponente(entity, errori);
					break;
				case REFERENTI:
					this.checkCampiObbligatoriReferenti(entity, errori);
					break;
				case SPECIFICA:
					this.checkCampiObbligatoriSpecifica(entity, errori);
					this.checkCampiObbligatoriSpecificaComponente(entity, errori);
					break;
				case COLLAUDO_CONFIGURATO:
					this.checkCampiObbligatoriCollaudo(entity, errori);
					this.checkCampiObbligatoriCollaudoComponente(entity, errori);
					break;
				case PRODUZIONE_CONFIGURATO:
					this.checkCampiObbligatoriProduzione(entity, errori);
					this.checkCampiObbligatoriProduzioneComponente(entity, errori);
					break;
				default:
					break;
				}

				for(EntitaComplessaError errore: errori.values()) {
					errore.setDato(datoObbligatorio);
					if(errore.getCampi()!=null && !errore.getCampi().isEmpty()) {
						erroreLst.add(errore);
					}
				}
			}
		}
		
		if(erroreLst!=null && !erroreLst.isEmpty()) {
			throw new UpdateEntitaComplessaNonValidaSemanticamenteException("Forbidden", erroreLst);
		}
		
	}

	public void checkCampiObbligatoriReferenti(ServizioEntity entity,  Map<String, EntitaComplessaError> errore) {
	}


	private void checkCampiObbligatoriSpecificaComponente(ServizioEntity entity,
			Map<String, EntitaComplessaError> errori) {
		
	}

	private void checkCampiObbligatoriIdentificativoComponente(ServizioEntity entity,
			Map<String, EntitaComplessaError> errori) {
	}

	private void checkCampiObbligatoriGenericoComponente(ServizioEntity entity,
			Map<String, EntitaComplessaError> errori) {
	}

	private void checkCampiObbligatoriCollaudoComponente(ServizioEntity entity,
			Map<String, EntitaComplessaError> errori) {
		
		requirePositiveInteger(entity.getComponenti().size(), "servizio_non_presente", entity, errori);
		
		if(!entity.getComponenti().isEmpty()) {

			for(PackageServizioEntity componente: entity.getComponenti()) {
				if(passatoInCollaudo(componente.getServizio())) {
					return;
				}
			}
	
			requireNotNull(null, "servizio_pubblicato_collaudo_non_presente", entity, errori);
		}

	}

	private boolean passatoInCollaudo(ServizioEntity servizio) {
		return this.configurazione.getPackage().getStatiAdesioneConsentita().contains(servizio.getStato());
	}

	private void checkCampiObbligatoriProduzioneComponente(ServizioEntity entity,
			Map<String, EntitaComplessaError> errori) {
		
		requirePositiveInteger(entity.getComponenti().size(), "servizio_non_presente", entity, errori);
		
		if(!entity.getComponenti().isEmpty()) {
			for(PackageServizioEntity componente: entity.getComponenti()) {
				if(passatoInProduzione(componente.getServizio())) {
					return;
				}
			}

			requireNotNull(null, "servizio_pubblicato_produzione_non_presente", entity, errori);
		}
	}

	private boolean passatoInProduzione(ServizioEntity servizio) {
		return servizio.getStato().equals("pubblicato_produzione");
	}

	@Override
	public void authorizeModifica(ServizioEntity entity, List<ConfigurazioneClasseDato> classiDato) {
		this.coreAuthorization.requireAdmin();
		super.authorizeModifica(entity, classiDato);
		if(!entity.getApi().isEmpty()) {
			throw new NotAuthorizedException("Impossibile avere delle API associate a un servizio Package. Trovate " + entity.getApi().size());
		}
	}

	@Override
	protected ConfigurazioneWorkflow getWorkflow(ServizioEntity entity) {
		return this.configurazione.getPackage().getWorkflow();
	}

}