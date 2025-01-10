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

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.servlets.model.AuthTypeNoDati;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthType;
import org.govway.catalogo.servlets.model.DatiSpecificiClient;
import org.govway.catalogo.servlets.model.DatiSpecificiClientCreate;

public class NoDatiEstensioneClientAssembler extends AbstractEstensioneClientAssembler {

	@Override
	public Set<EstensioneClientEntity> getEstensioni(DatiSpecificiClientCreate src, ConfigurazioneAuthType configurazione) {
		return super.getEstensioni(src, configurazione);
	}

	@Override
	public DatiSpecificiClient getDatiSpecificiClient(Set<EstensioneClientEntity> estensioni) {
		return new AuthTypeNoDati();
	}

	@Override
	public List<String> getErroriConfigurabile(ClientEntity entity) {
		return new ArrayList<>();
	}

}
