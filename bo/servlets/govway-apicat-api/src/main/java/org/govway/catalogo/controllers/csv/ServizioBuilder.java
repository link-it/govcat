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
package org.govway.catalogo.controllers.csv;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.govway.catalogo.core.business.utils.EServiceBuilder;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

public class ServizioBuilder {

	private Logger logger = LoggerFactory.getLogger(ServizioBuilder.class);

	@Autowired
	private EServiceBuilder eServiceBuilder;

	public ServizioBuilder() {
	}

	private Collection<Servizio> toListEntries(ServizioEntity servizioEntity) {
		List<Servizio> serviziCSV = new ArrayList<>();

		this.logger.debug("Servizio: " + servizioEntity.getNome() + " v" + servizioEntity.getVersione());

		Set<ApiEntity> apiLst = servizioEntity.getApi();
		this.logger.debug("Servizio: " + servizioEntity.getNome() + " api size: " + apiLst.size());

		for(ApiEntity api: apiLst) {
			this.logger.debug("Servizio: " + servizioEntity.getNome() + " api: " + api.getNome());
			Servizio s = new Servizio();

			// Erogatore
			s.setErogatore(servizioEntity.getDominio().getSoggettoReferente().getNome());

			// Servizio
			s.setServizio(servizioEntity.getNome() + " v" + servizioEntity.getVersione());

			// API
			s.setApi(api.getNome() + " v" + api.getVersione());

			// Tipologia API (soap/rest)
			s.setTipoApi(api.getCollaudo() != null && api.getCollaudo().getProtocollo() != null
					&& api.getCollaudo().getProtocollo().toString().contains("WSDL") ? "soap" : "rest");

			// Modalità Autenticazione - get profiles from API authTypes
			String profili = api.getAuthType().stream()
					.map(at -> this.eServiceBuilder.getProfiloString(at.getProfilo()))
					.distinct()
					.collect(Collectors.joining(", "));
			s.setAutenticazioneStato(profili);

			// Stato Servizio
			s.setStatoServizio(processStato(servizioEntity.getStato()));

			// URL Invocazione
			s.setUrlInvocazioneCollaudo(this.eServiceBuilder.getUrlInvocazione(api, true));
			s.setUrlInvocazioneProduzione(this.eServiceBuilder.getUrlInvocazione(api, false));

			// Backend URL (Connettore)
			if(api.getCollaudo() != null) {
				s.setConnettoreCollaudo(api.getCollaudo().getUrl());
			}
			if(api.getProduzione() != null) {
				s.setConnettoreProduzione(api.getProduzione().getUrl());
			}

			serviziCSV.add(s);
		}

		return serviziCSV;
	}

	private String processStato(String stato) {
		if (stato == null || stato.isEmpty()) {
			return stato;
		}

		String result;

		if (stato.endsWith("_produzione_senza_collaudo")) {
			String prefix = stato.substring(0, stato.length() - "_produzione_senza_collaudo".length());
			prefix = prefix.replace("_", " ");
			result = capitalizeFirst(prefix) + " in produzione senza collaudo";
		} else if (stato.endsWith("_produzione")) {
			String prefix = stato.substring(0, stato.length() - "_produzione".length());
			prefix = prefix.replace("_", " ");
			result = capitalizeFirst(prefix) + " in produzione";
		} else if (stato.endsWith("_collaudo")) {
			String prefix = stato.substring(0, stato.length() - "_collaudo".length());
			prefix = prefix.replace("_", " ");
			result = capitalizeFirst(prefix) + " in collaudo";
		} else {
			result = capitalizeFirst(stato.replace("_", " "));
		}

		return result;
	}

	private String capitalizeFirst(String str) {
		if (str == null || str.isEmpty()) {
			return str;
		}
		return str.substring(0, 1).toUpperCase() + str.substring(1);
	}

	public byte[] getCSVEsteso(Collection<ServizioEntity> servizi) {

		Collection<Servizio> serviziCSV = new ArrayList<Servizio>();

		for(ServizioEntity servizio:servizi) {
			serviziCSV.addAll(toListEntries(servizio));
		}

		String csv = "";
		try {
			ServizioMapper servizioMapper = new ServizioMapper();
			csv = servizioMapper.writeValues(serviziCSV);
			if(csv.isEmpty()) {

				Servizio s = new Servizio();
				String header = servizioMapper.writeValues(Arrays.asList(s));

				int indexOfNewLine = header.indexOf('\n');

				return header.substring(0, indexOfNewLine).getBytes();
			} else {
				return csv.getBytes();
			}
		} catch(IOException e) {
			logger.error("Errore durante la serializzazione del CSV: " + e.getMessage(), e);
		}
		return "".getBytes();
	}

}
