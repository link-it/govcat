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

import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.ConfigurazioneWorkflow;
import org.govway.catalogo.servlets.model.EntitaComplessaError;
import org.govway.catalogo.servlets.model.ServizioCreate;

public class ServizioAuthorization extends AbstractServizioAuthorization {

	@Override
	protected void checkCampiObbligatori(List<ConfigurazioneClasseDato> datiObbligatori, ServizioEntity servizio, String stato) {

		List<EntitaComplessaError> erroreLst = new ArrayList<>();

		if(datiObbligatori!=null) {
			for(ConfigurazioneClasseDato datoObbligatorio: datiObbligatori) {
				Map<String, EntitaComplessaError> errori = new HashMap<>();
				switch(datoObbligatorio) {
				case COLLAUDO:
					this.checkCampiObbligatoriCollaudo(servizio, errori);
					this.checkCampiObbligatoriCollaudoApi(servizio, errori);
					break;
				case GENERICO:
					this.checkCampiObbligatoriGenerico(servizio, errori);
					this.checkCampiObbligatoriGenericoApi(servizio, errori);
					break;
				case IDENTIFICATIVO:
					this.checkCampiObbligatoriIdentificativo(servizio, errori);
					this.checkCampiObbligatoriIdentificativoApi(servizio, errori);
					break;
				case PRODUZIONE:
					this.checkCampiObbligatoriProduzione(servizio, errori);
					this.checkCampiObbligatoriProduzioneApi(servizio, errori);
					break;
				case REFERENTI:
					this.checkCampiObbligatoriReferenti(servizio, errori);
					break;
				case SPECIFICA:
					this.checkCampiObbligatoriSpecifica(servizio, errori);
					this.checkCampiObbligatoriSpecificaApi(servizio, errori);
					break;
				case COLLAUDO_CONFIGURATO:
					this.checkCampiObbligatoriCollaudo(servizio, errori);
					this.checkCampiObbligatoriCollaudoApi(servizio, errori);
					break;
				case PRODUZIONE_CONFIGURATO:
					this.checkCampiObbligatoriProduzione(servizio, errori);
					this.checkCampiObbligatoriProduzioneApi(servizio, errori);
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
			throw new UpdateEntitaComplessaNonValidaSemanticamenteException(ErrorCode.VAL_422_COMPLEX, erroreLst);
		}
		
	}

	public void checkCampiObbligatoriIdentificativoApi(ServizioEntity entity,  Map<String, EntitaComplessaError> errore) {
		for(ApiEntity api: entity.getApi()) {
			checkCampiObbligatoriIdentificativoApi(api, errore);
		}
	}

	public void checkCampiObbligatoriGenericoApi(ServizioEntity entity, Map<String, EntitaComplessaError> errore) {
		for(ApiEntity api: entity.getApi()) {
			checkCampiObbligatoriGenericoApi(api, errore);
		}
	}

	public void checkCampiObbligatoriSpecificaApi(ServizioEntity entity,  Map<String, EntitaComplessaError> errore) {

		requirePositiveInteger(entity.getApi().size(), "api", entity, errore);

		for(ApiEntity api: entity.getApi()) {
			checkCampiObbligatoriSpecificaApi(api, errore);
		}
	}

	public void checkCampiObbligatoriCollaudoApi(ServizioEntity entity,  Map<String, EntitaComplessaError> errore) {
		for(ApiEntity api: entity.getApi()) {
			checkCampiObbligatoriCollaudoApi(api, errore);
		}
	}

	public void checkCampiObbligatoriProduzioneApi(ServizioEntity entity,  Map<String, EntitaComplessaError> errore) {
		for(ApiEntity api: entity.getApi()) {
			checkCampiObbligatoriProduzioneApi(api, errore);
		}
	}


	@Override
	public void authorizeCreate(ServizioCreate create) {
		this.coreAuthorization.requireReferenteTecnico();
	}

	@Override
	public void authorizeModifica(ServizioEntity entity, List<ConfigurazioneClasseDato> classiDato) {
		this.authorizeAnything();
		super.authorizeModifica(entity, classiDato);
		if(!entity.getComponenti().isEmpty()) {
			throw new NotAuthorizedException(ErrorCode.AUT_403);
		}
	}

	@Override
	public void authorizeList() {
		this.authorizeAnything();
	}

	@Override
	protected ConfigurazioneWorkflow getWorkflow(ServizioEntity entity) {
		return this.configurazione.getServizio().getWorkflow();
	}

}