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
package org.govway.catalogo.assembler;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.security.Principal;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Optional;

import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.exception.RichiestaNonValidaSemanticamenteException;
import org.govway.catalogo.exception.ErrorCode;

public class CertificateUtils {
	
	public static void checkCertificate(DocumentoEntity documento) {
		try {
			getSubject(documento);
		} catch(Exception e) {
			throw new RichiestaNonValidaSemanticamenteException(ErrorCode.SYS_500, e);
		}
	}		
	
	public static String getSubject(DocumentoEntity documento) throws Exception {
		if(documento.getRawData().length == 0) {
			throw new Exception("certificato vuoto");
		}

		// Carica il certificato
		try(InputStream certificateFile = new ByteArrayInputStream(documento.getRawData())) {

			CertificateFactory certificateFactory = CertificateFactory.getInstance("X.509");
			X509Certificate certificate = (X509Certificate) certificateFactory.generateCertificate(certificateFile);

			// Ottieni il soggetto (subject) del certificato
			Principal subject = certificate.getSubjectDN();
			return subject.getName();
		}
	}		
	
	public static String getSubject(ClientEntity client, String idDocumento) throws Exception {

		if(idDocumento == null) {
			throw new Exception("ID documento null");
		}

		if(client == null) {
			throw new Exception("client null");
		}


		Optional<EstensioneClientEntity> allegato = client.getEstensioni().stream().filter(e -> e.getDocumento()!= null && e.getDocumento().getUuid().equals(idDocumento))
				.findAny();

		if(!allegato.isPresent()) {
			throw new Exception("Allegato con id ["+idDocumento+"] non presente nel client ["+client.getNome()+"/"+client.getSoggetto().getNome()+"]");
		}

		if(allegato.get().getDocumento() == null) {
			throw new Exception("Documento non presente nell'allegato con id ["+idDocumento+"] non presente nel client ["+client.getNome()+"/"+client.getSoggetto().getNome()+"]");
		}
		
		return getSubject(allegato.get().getDocumento());
	}

}
