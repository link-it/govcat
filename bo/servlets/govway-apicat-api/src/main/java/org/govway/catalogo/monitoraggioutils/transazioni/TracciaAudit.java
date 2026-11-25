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
package org.govway.catalogo.monitoraggioutils.transazioni;

import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.govway.catalogo.servlets.monitor.model.ItemTransazioneAudit;
import org.govway.catalogo.servlets.monitor.model.TransazioneAudit;
import org.govway.catalogo.servlets.monitor.model.TransazioneAuditProprieta;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

/**
 * Informazioni di audit registrate da GovWay nella traccia di una transazione.
 *
 * La traccia e` l'XML restituito dal dettaglio della transazione (richiesta.traccia): le informazioni
 * di audit sono le proprieta` del protocollo con prefisso ProfiloSicurezzaAudit (pattern e schema dati)
 * e ProfiloSicurezzaMessaggioAudit- (claim del token di audit).
 */
public final class TracciaAudit {

	static final String PATTERN = "ProfiloSicurezzaAudit";
	static final String SCHEMA_DATI = "ProfiloSicurezzaAudit-SchemaDati";
	static final String PREFISSO_CLAIM = "ProfiloSicurezzaMessaggioAudit-";

	static final String USER_ID = PREFISSO_CLAIM + "userID";
	static final String USER_LOCATION = PREFISSO_CLAIM + "userLocation";
	static final String LOA = PREFISSO_CLAIM + "LoA";
	static final String PURPOSE_ID = PREFISSO_CLAIM + "PurposeId";
	static final String ISSUER = PREFISSO_CLAIM + "Issuer";
	static final String AUDIENCE = PREFISSO_CLAIM + "Audience";
	static final String MESSAGE_ID = PREFISSO_CLAIM + "MessageId";
	static final String KID = PREFISSO_CLAIM + "Kid";
	static final String ISSUED_AT = PREFISSO_CLAIM + "IssuedAt";
	static final String NOT_BEFORE = PREFISSO_CLAIM + "NotBefore";
	static final String EXPIRATION = PREFISSO_CLAIM + "Expiration";

	// GovWay registra le date come 2026-10-26_09:13:19.000, nell'ora locale e senza fuso orario
	private static final Pattern DATA_GOVWAY = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}_\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?$");

	private final Map<String, String> proprieta;

	private TracciaAudit(Map<String, String> proprieta) {
		this.proprieta = proprieta;
	}

	/**
	 * Legge le informazioni di audit dalla traccia. Restituisce null se la traccia e` assente
	 * o non contiene informazioni di audit.
	 */
	public static TracciaAudit parse(String traccia) throws IOException {
		if(traccia == null || traccia.isBlank()) {
			return null;
		}

		NodeList nodi;
		try {
			nodi = newDocumentBuilderFactory().newDocumentBuilder()
					.parse(new InputSource(new StringReader(traccia)))
					.getElementsByTagNameNS("*", "proprieta");
		} catch(ParserConfigurationException | SAXException e) {
			throw new IOException("Traccia della transazione non valida: " + e.getMessage(), e);
		}

		Map<String, String> proprieta = new LinkedHashMap<>();
		for(int i = 0; i < nodi.getLength(); i++) {
			Element el = (Element) nodi.item(i);
			String nome = el.getAttribute("nome");
			if(nome.startsWith(PATTERN) || nome.startsWith(PREFISSO_CLAIM)) {
				proprieta.put(nome, el.getAttribute("valore"));
			}
		}

		return proprieta.isEmpty() ? null : new TracciaAudit(proprieta);
	}

	private static DocumentBuilderFactory newDocumentBuilderFactory() throws ParserConfigurationException {
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		factory.setNamespaceAware(true);
		// nessuna risoluzione di DTD, schemi o entita` esterne (XXE): la traccia non ne prevede
		factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
		factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
		factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
		factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
		factory.setXIncludeAware(false);
		factory.setExpandEntityReferences(false);
		return factory;
	}

	/**
	 * Informazioni di audit mostrate nella lista delle transazioni.
	 */
	public ItemTransazioneAudit toItemTransazioneAudit() {
		ItemTransazioneAudit audit = new ItemTransazioneAudit();
		audit.setPattern(this.proprieta.get(PATTERN));
		audit.setUserId(this.proprieta.get(USER_ID));
		audit.setUserLocation(this.proprieta.get(USER_LOCATION));
		audit.setLoa(this.proprieta.get(LOA));
		return audit;
	}

	/**
	 * Tutte le informazioni di audit della traccia: i claim previsti dalle Linee Guida ModI nei campi
	 * dedicati, gli altri (es. schemi di audit personalizzati) in altre_proprieta.
	 */
	public TransazioneAudit toTransazioneAudit() {
		Map<String, String> altre = new LinkedHashMap<>(this.proprieta);

		TransazioneAudit audit = new TransazioneAudit();
		audit.setPattern(altre.remove(PATTERN));
		audit.setSchemaDati(altre.remove(SCHEMA_DATI));
		audit.setUserId(altre.remove(USER_ID));
		audit.setUserLocation(altre.remove(USER_LOCATION));
		audit.setLoa(altre.remove(LOA));
		audit.setPurposeId(altre.remove(PURPOSE_ID));
		audit.setIssuer(altre.remove(ISSUER));
		audit.setAudience(altre.remove(AUDIENCE));
		audit.setMessageId(altre.remove(MESSAGE_ID));
		audit.setKid(altre.remove(KID));
		audit.setIssuedAt(toData(altre.remove(ISSUED_AT)));
		audit.setNotBefore(toData(altre.remove(NOT_BEFORE)));
		audit.setExpiration(toData(altre.remove(EXPIRATION)));

		if(!altre.isEmpty()) {
			List<TransazioneAuditProprieta> lst = new ArrayList<>();
			altre.forEach((nome, valore) -> {
				TransazioneAuditProprieta p = new TransazioneAuditProprieta();
				p.setNome(toNomeProprieta(nome));
				p.setValore(valore);
				lst.add(p);
			});
			audit.setAltreProprieta(lst);
		}
		return audit;
	}

	/**
	 * Nome mostrato in altre_proprieta: senza il prefisso tecnico dei claim del token di audit
	 * (es. ProfiloSicurezzaMessaggioAudit-X509-Issuer diventa X509-Issuer). Gli altri nomi restano invariati.
	 */
	static String toNomeProprieta(String nome) {
		if(nome.startsWith(PREFISSO_CLAIM) && nome.length() > PREFISSO_CLAIM.length()) {
			return nome.substring(PREFISSO_CLAIM.length());
		}
		return nome;
	}

	/**
	 * Converte la data di GovWay in formato ISO senza fuso orario; un formato non riconosciuto resta invariato.
	 */
	static String toData(String valore) {
		if(valore == null || !DATA_GOVWAY.matcher(valore).matches()) {
			return valore;
		}
		return valore.replace('_', 'T');
	}
}
