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
package org.govway.catalogo.authorization;

import java.util.Map;
import java.util.UUID;

import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.DominioUpdate;
import org.springframework.beans.factory.annotation.Autowired;

public class DominioAuthorization extends DefaultAuthorization<DominioCreate,DominioUpdate,DominioEntity> {

	@Autowired
	private SoggettoService soggettoService;

	public DominioAuthorization() {
		super(EntitaEnum.DOMINIO);
	}

	@Override
	public void authorizeCreate(DominioCreate create) {
		OrganizzazioneEntity orgDominio = recuperaOrgDelSoggetto(create.getIdSoggettoReferente());
		try {
			super.authorizeCreate(create);
		} catch (NotAuthorizedException e) {
			if (this.coreAuthorization.getUtenteSessione() == null) {
				throw e;
			}
			requireAmmOrgSu(orgDominio);
			return;
		}
		// Anche per il path standard, se non è gestore/coordinatore (cioè utente_organizzazione)
		// occorre verificare che sia AMM_ORG dell'organizzazione del dominio.
		if (!this.coreAuthorization.isAdmin() && !this.coreAuthorization.isCoordinatore()) {
			requireAmmOrgSu(orgDominio);
		}
	}

	@Override
	public void authorizeUpdate(DominioUpdate update, DominioEntity entity) {
		// Se l'update tenta di cambiare il soggetto referente, la nuova org deve coincidere
		// con quella attuale del dominio (no spostamento del dominio fra organizzazioni
		// per AMM_ORG; per gestore/coordinatore il super non applica vincoli).
		OrganizzazioneEntity orgAttuale = entity.getSoggettoReferente().getOrganizzazione();
		try {
			super.authorizeUpdate(update, entity);
		} catch (NotAuthorizedException e) {
			if (this.coreAuthorization.getUtenteSessione() == null) {
				throw e;
			}
			requireAmmOrgSu(orgAttuale);
			requireSoggettoStessaOrg(update.getIdSoggettoReferente(), orgAttuale);
			return;
		}
		if (!this.coreAuthorization.isAdmin() && !this.coreAuthorization.isCoordinatore()) {
			requireAmmOrgSu(orgAttuale);
			requireSoggettoStessaOrg(update.getIdSoggettoReferente(), orgAttuale);
		}
	}

	@Override
	public void authorizeDelete(DominioEntity entity) {
		OrganizzazioneEntity orgAttuale = entity.getSoggettoReferente().getOrganizzazione();
		try {
			super.authorizeDelete(entity);
		} catch (NotAuthorizedException e) {
			if (this.coreAuthorization.getUtenteSessione() == null) {
				throw e;
			}
			requireAmmOrgSu(orgAttuale);
			return;
		}
		if (!this.coreAuthorization.isAdmin() && !this.coreAuthorization.isCoordinatore()) {
			requireAmmOrgSu(orgAttuale);
		}
	}

	@Override
	public void authorizeReferenteScrittura(DominioEntity entity) {
		OrganizzazioneEntity orgAttuale = entity.getSoggettoReferente().getOrganizzazione();
		try {
			super.authorizeReferenteScrittura(entity);
		} catch (NotAuthorizedException e) {
			if (this.coreAuthorization.getUtenteSessione() == null) {
				throw e;
			}
			requireAmmOrgSu(orgAttuale);
			return;
		}
		if (!this.coreAuthorization.isAdmin() && !this.coreAuthorization.isCoordinatore()) {
			requireAmmOrgSu(orgAttuale);
		}
	}

	private void requireAmmOrgSu(OrganizzazioneEntity orgDominio) {
		if (!this.coreAuthorization.hasRuoloInOrganizzazioneSessione(
				RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE)) {
			throw new NotAuthorizedException(ErrorCode.AUT_403);
		}
		OrganizzazioneEntity orgSessione = this.coreAuthorization.getOrganizzazioneSessione();
		if (orgSessione == null || !orgSessione.getId().equals(orgDominio.getId())) {
			throw new NotAuthorizedException(ErrorCode.AUT_403_AMM_ORG_DOMINIO_FUORI_ORG,
					Map.of("orgNome", orgDominio.getNome()));
		}
	}

	private void requireSoggettoStessaOrg(UUID idSoggettoNuovo, OrganizzazioneEntity orgAttuale) {
		if (idSoggettoNuovo == null) {
			return;
		}
		OrganizzazioneEntity orgNuova = recuperaOrgDelSoggetto(idSoggettoNuovo);
		if (!orgNuova.getId().equals(orgAttuale.getId())) {
			throw new NotAuthorizedException(ErrorCode.AUT_403_AMM_ORG_DOMINIO_FUORI_ORG,
					Map.of("orgNome", orgAttuale.getNome()));
		}
	}

	private OrganizzazioneEntity recuperaOrgDelSoggetto(UUID idSoggetto) {
		if (idSoggetto == null) {
			throw new NotAuthorizedException(ErrorCode.AUT_403);
		}
		SoggettoEntity soggetto = this.soggettoService.find(idSoggetto)
				.orElseThrow(() -> new NotFoundException(ErrorCode.SOG_404,
						Map.of("idSoggetto", idSoggetto.toString())));
		return soggetto.getOrganizzazione();
	}
}
