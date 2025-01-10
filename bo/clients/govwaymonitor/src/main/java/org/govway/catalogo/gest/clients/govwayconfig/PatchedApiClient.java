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
package org.govway.catalogo.gest.clients.govwayconfig;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


import org.govway.catalogo.gest.clients.govwayconfig.api.ApiApi;
import org.govway.catalogo.gest.clients.govwayconfig.api.ApplicativiApi;
import org.govway.catalogo.gest.clients.govwayconfig.api.ErogazioniApi;
import org.govway.catalogo.gest.clients.govwayconfig.api.ErogazioniConfigurazioneApi;
import org.govway.catalogo.gest.clients.govwayconfig.impl.ApiClient;
import org.govway.catalogo.gest.clients.govwayconfig.impl.ApiException;
import org.govway.catalogo.gest.clients.govwayconfig.model.ApplicativoItem;
import org.govway.catalogo.gest.clients.govwayconfig.model.ControlloAccessiErogazioneAutorizzazioneApplicativi;
import org.govway.catalogo.gest.clients.govwayconfig.model.ControlloAccessiErogazioneAutorizzazioneApplicativo;
import org.govway.catalogo.gest.clients.govwayconfig.model.ErogazioneViewItem;
import okhttp3.MediaType;
import okhttp3.RequestBody;

public class PatchedApiClient extends ApiClient {

	public PatchedApiClient(Optional<String> username, Optional<String> password) {
		
		if (username.isPresent() && password.isPresent())
		{
			this.addDefaultHeader("Authorization", "Basic " + new String(Base64.getEncoder().encode((username.get()+":"+password.get()).getBytes())));
		}
		
		this.setJSON(new ExtendedJSON());
		
	}

    public RequestBody serialize(Object obj, String contentType) throws ApiException {
    	
    	if(obj instanceof String) {
    		return RequestBody.create(MediaType.parse(contentType), (String) obj);
    	} else {
    		return super.serialize(obj, contentType);
    	}
    }
}
