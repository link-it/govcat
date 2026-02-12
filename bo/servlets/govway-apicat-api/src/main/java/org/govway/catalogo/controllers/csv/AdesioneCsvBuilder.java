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
import java.util.Set;
import java.util.stream.Collectors;

import org.govway.catalogo.core.business.utils.EServiceBuilder;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.servlets.model.Configurazione;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

public class AdesioneCsvBuilder {

	private Logger logger = LoggerFactory.getLogger(AdesioneCsvBuilder.class);

	@Autowired
	private EServiceBuilder eServiceBuilder;

	@Autowired
	private Configurazione configurazione;

	public AdesioneCsvBuilder() {
	}

	private AdesioneCsv toListEntry(AdesioneEntity adesione) {

		this.logger.debug("Adesione: " + adesione.getIdLogico() + " stato: " + adesione.getStato());

		if(!this.configurazione.getAdesione().getStatiSchedaAdesione().contains(adesione.getStato())) {
			this.logger.debug("Adesione: " + adesione.getIdLogico() + " in stato: " + adesione.getStato()+" non consentito per l'export. Stati consentiti ["+this.configurazione.getAdesione().getStatiSchedaAdesione()+"]");
			return null;
		}

		this.logger.debug("Adesione: " + adesione.getIdLogico() + " stato: " + adesione.getStato() +" OK");

		ServizioEntity servizioEntity = adesione.getServizio();

		boolean hasCollaudo = hasCollaudo(adesione.getStato());
		boolean hasProduzione = hasProduzione(adesione.getStato());

		AdesioneCsv a = new AdesioneCsv();

		// Soggetto Erogatore
		a.setErogatore(servizioEntity.getDominio().getSoggettoReferente().getNome());

		// Servizio
		a.setServizio(servizioEntity.getNome() + " v" + servizioEntity.getVersione());

		// Soggetto Aderente
		a.setAderente(adesione.getSoggetto().getOrganizzazione().getNome());

		// Identificativo Adesione
		a.setIdAdesione(adesione.getIdLogico());

		// Stato Adesione
		a.setStatoAdesione(processStato(adesione.getStato()));

		// Referenti
		a.setReferenteRegionaleAdesione(getReferentiString(adesione.getReferenti()));
		a.setReferenteTecnicoAdesione(getReferentiTecniciString(adesione.getReferenti()));

		if(hasCollaudo) {
			ClientAdesioneEntity cCollaudo = getClient(adesione, AmbienteEnum.COLLAUDO);
			if(cCollaudo != null) {
				a.setAutenticazioneStato(this.eServiceBuilder.getProfiloString(cCollaudo.getProfilo()));
				a.setApplicativiAutorizzatiCollaudo(cCollaudo.getClient() != null ? cCollaudo.getClient().getNome() : null);
			}
		}

		if(hasProduzione) {
			ClientAdesioneEntity cProduzione = getClient(adesione, AmbienteEnum.PRODUZIONE);
			if(cProduzione != null) {
				a.setAutenticazioneStato(this.eServiceBuilder.getProfiloString(cProduzione.getProfilo()));
				a.setApplicativiAutorizzatiProduzione(cProduzione.getClient() != null ? cProduzione.getClient().getNome() : null);
			}
		}

		return a;
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

	private boolean hasCollaudo(String stato) {
		return !stato.contains("senza_collaudo");
	}

	private boolean hasProduzione(String stato) {
		return stato.contains("produzione");
	}

	private ClientAdesioneEntity getClient(AdesioneEntity adesione, AmbienteEnum ambiente) {
		return adesione.getClient().stream()
				.filter(ca -> ca.getAmbiente().equals(ambiente))
				.findFirst()
				.orElse(null);
	}

	private static String getReferentiString(Set<ReferenteAdesioneEntity> referenti) {
		return getGenericReferentiString(referenti, TIPO_REFERENTE.REFERENTE);
	}

	private static String getReferentiTecniciString(Set<ReferenteAdesioneEntity> referenti) {
		return getGenericReferentiString(referenti, TIPO_REFERENTE.REFERENTE_TECNICO);
	}

	private static String getGenericReferentiString(Set<ReferenteAdesioneEntity> referenti, TIPO_REFERENTE tipo) {
		return referenti.stream().filter(r -> r.getTipo().equals(tipo))
				.map(r -> r.getReferente().getEmailAziendale())
				.collect(Collectors.joining("\n"));
	}

	public byte[] getCSV(Collection<AdesioneEntity> adesioni) {
		Collection<AdesioneCsv> adesioniCSV = new ArrayList<>();

		for(AdesioneEntity adesione: adesioni) {
			AdesioneCsv entry = toListEntry(adesione);
			if(entry != null) {
				adesioniCSV.add(entry);
			}
		}

		String csv = "";
		try {
			AdesioneCsvMapper adesioneMapper = new AdesioneCsvMapper();
			csv = adesioneMapper.writeValues(adesioniCSV);
			if(csv.isEmpty()) {
				AdesioneCsv a = new AdesioneCsv();
				String header = adesioneMapper.writeValues(Arrays.asList(a));

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
