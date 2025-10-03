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
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.core.services.ClientService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.CertificatoClient;
import org.govway.catalogo.servlets.model.CertificatoClientCreate;
import org.govway.catalogo.servlets.model.CertificatoClientFornito;
import org.govway.catalogo.servlets.model.CertificatoClientFornitoCreate;
import org.govway.catalogo.servlets.model.CertificatoClientRichiestoCn;
import org.govway.catalogo.servlets.model.CertificatoClientRichiestoCnCreate;
import org.govway.catalogo.servlets.model.CertificatoClientRichiestoCsr;
import org.govway.catalogo.servlets.model.CertificatoClientRichiestoCsrCreate;
import org.govway.catalogo.servlets.model.ConfigurazioneAuthType;
import org.govway.catalogo.servlets.model.ConfigurazioneCertificato;
import org.govway.catalogo.servlets.model.DatiSpecificiClient;
import org.govway.catalogo.servlets.model.DatiSpecificiClientCreate;
import org.govway.catalogo.servlets.model.RateLimiting;
import org.govway.catalogo.servlets.model.RateLimitingPeriodoEnum;
import org.govway.catalogo.servlets.model.TipoCertificatoEnum;
import org.springframework.beans.factory.annotation.Autowired;

public abstract class AbstractEstensioneClientAssembler implements IEstensioneClientAssembler {

	
	@Autowired
	private DocumentoAssembler documentoAssembler;
	
	@Autowired
	private CoreEngineAssembler coreEngineAssembler;
	
	@Autowired
	protected ClientService clientService;
	
	@Override
	public String checkDuplicati(Set<EstensioneClientEntity> estensioni) {
		// TODO Auto-generated method stub
		return null;
	}

	protected void populateDatiSpecifici(DatiSpecificiClient specSrc, Set<EstensioneClientEntity> estensioni) {
		if(existsProperty(estensioni, RATE_LIMITING_QUOTA_PROPERTY)) {
			RateLimiting rateLimiting = new RateLimiting();
			rateLimiting.setPeriodo(RateLimitingPeriodoEnum.fromValue(getTextProperty(estensioni, RATE_LIMITING_PERIODO_PROPERTY)));
			rateLimiting.setQuota(Integer.parseInt(getTextProperty(estensioni, RATE_LIMITING_QUOTA_PROPERTY)));
			specSrc.setRateLimiting(rateLimiting);
		}

		if(existsProperty(estensioni, FINALITA_PROPERTY)) {
			specSrc.setFinalita(UUID.fromString(getTextProperty(estensioni, FINALITA_PROPERTY)));
		}

	}

	@Override
	public Set<EstensioneClientEntity> getEstensioni(DatiSpecificiClientCreate src,
			ConfigurazioneAuthType configurazione) {
		Set<EstensioneClientEntity> hashSet = new HashSet<>();
		
		if(src.getRateLimiting()!=null) {
			EstensioneClientEntity eRateLimitingQuota = new EstensioneClientEntity();
			eRateLimitingQuota.setNome(RATE_LIMITING_QUOTA_PROPERTY);
			eRateLimitingQuota.setValore(src.getRateLimiting().getQuota() + "");
			hashSet.add(eRateLimitingQuota);

			EstensioneClientEntity eRateLimitingPeriodo = new EstensioneClientEntity();
			eRateLimitingPeriodo.setNome(RATE_LIMITING_PERIODO_PROPERTY);
			eRateLimitingPeriodo.setValore(src.getRateLimiting().getPeriodo().toString());
			hashSet.add(eRateLimitingPeriodo);
		}
		
		if(src.getFinalita()!=null) {
			EstensioneClientEntity eRateLimitingQuota = new EstensioneClientEntity();
			eRateLimitingQuota.setNome(FINALITA_PROPERTY);
			eRateLimitingQuota.setValore(src.getFinalita().toString());
			hashSet.add(eRateLimitingQuota);
		}
		
		
		return hashSet;
	}
	
	private List<String> getErroriConfigurabileCertificatoFornito(CertificatoClientFornito c, String nome) {

		List<String> lst = new ArrayList<>();
		if(c == null || c.getCertificato() == null) {
			lst.add("certificato_"+nome);
		}
		return lst;

	}

	private List<String> getErroriConfigurabileCertificatoRichiestoCn(CertificatoClientRichiestoCn c, String nome) {

		List<String> lst = new ArrayList<>();
		if(c.getCertificato() == null) {
			lst.add("certificato_"+nome);
		}
		return lst;

	}

	private List<String> getErroriConfigurabileCertificatoRichiestoCsr(CertificatoClientRichiestoCsr c, String nome) {

		List<String> lst = new ArrayList<>();
		if(c.getCertificato() == null) {
			lst.add("certificato_"+nome);
		}
		return lst;
	}

	protected List<String> getErroriConfigurabileCertificato(CertificatoClient c, String nome) {
		if(c instanceof CertificatoClientFornito) {
			return getErroriConfigurabileCertificatoFornito(((CertificatoClientFornito)c), nome);
		} else if (c instanceof CertificatoClientRichiestoCn) {
			return getErroriConfigurabileCertificatoRichiestoCn(((CertificatoClientRichiestoCn)c), nome);
		} else if (c instanceof CertificatoClientRichiestoCsr) {
			return getErroriConfigurabileCertificatoRichiestoCsr(((CertificatoClientRichiestoCsr)c), nome);
		}
		
		return new ArrayList<>();
	}


	protected DocumentoEntity getDocumentoProperty(Set<EstensioneClientEntity> estensioni, String propertyName) {
		return estensioni.stream().filter(e -> e.getNome().equals(propertyName))
		.findAny().orElseThrow(() -> new InternalException(ErrorCode.SYS_001))
		.getDocumento();
	}

	protected String getTextProperty(Set<EstensioneClientEntity> estensioni, String propertyName) {
		return estensioni.stream().filter(e -> e.getNome().equals(propertyName))
		.findAny().orElseThrow(() -> new InternalException(ErrorCode.SYS_001))
		.getValore();
	}

	protected boolean existsProperty(Set<EstensioneClientEntity> estensioni, String propertyName) {
		return estensioni.stream().filter(e -> e.getNome().equals(propertyName))
		.findAny().isPresent();
	}

	protected Set<EstensioneClientEntity> getEstensioniCertificato(CertificatoClientCreate certificato,
			String nomeCertificato, ConfigurazioneCertificato configurazione) {

		switch(certificato.getTipoCertificato()) {
		case FORNITO: return getEstensioniCertificatoFornito(((CertificatoClientFornitoCreate)certificato), nomeCertificato, configurazione);
		case RICHIESTO_CN: return getEstensioniCertificatoRichiestoCN(((CertificatoClientRichiestoCnCreate)certificato), nomeCertificato, configurazione);
		case RICHIESTO_CSR: return getEstensioniCertificatoRichiestoCSR(((CertificatoClientRichiestoCsrCreate)certificato), nomeCertificato, configurazione);
		}

		throw new InternalException(ErrorCode.SYS_001, java.util.Map.of("tipoCertificato", certificato.getTipoCertificato().toString()));
	}
	
	private String CERTIFICATO_CSR_PROPERTY = "CERTIFICATO";
	private String CSR_RICHIESTA_PROPERTY = "CSR_RICHIESTA";
	private String CSR_MODULO_RICHIESTA_PROPERTY = "CSR_MODULO_RICHIESTA";
	private String CERTIFICATO_CN_PROPERTY = "CERTIFICATO";
	private String CN_PROPERTY = "CN";
	private String CERTIFICATO_PROPERTY = "CERTIFICATO";
	private String RATE_LIMITING_QUOTA_PROPERTY = "RATE_LIMITING_QUOTA";
	private String RATE_LIMITING_PERIODO_PROPERTY = "RATE_LIMITING_PERIODO";
	private String FINALITA_PROPERTY = "FINALITA";

	protected Set<EstensioneClientEntity> getEstensioniCertificatoRichiestoCSR(CertificatoClientRichiestoCsrCreate certificato, String nomeCertificato, ConfigurazioneCertificato configurazione) {
		if(!configurazione.isCsr()) {
			throw new BadRequestException(ErrorCode.VAL_001);
		}

		Set<EstensioneClientEntity> lst = new HashSet<>();
		
		EstensioneClientEntity csrRichiesta = new EstensioneClientEntity();
		csrRichiesta.setNome(getNomeProperty(nomeCertificato, CSR_RICHIESTA_PROPERTY));
		csrRichiesta.setDocumento(documentoAssembler.toEntity(certificato.getRichiesta(), null, coreEngineAssembler.getUtenteSessione()));
		lst.add(csrRichiesta);

		if(configurazione.isCsrModulo()) {
			EstensioneClientEntity csrModuloRichiesta = new EstensioneClientEntity();
			csrModuloRichiesta.setNome(getNomeProperty(nomeCertificato, CSR_MODULO_RICHIESTA_PROPERTY));
			csrModuloRichiesta.setDocumento(documentoAssembler.toEntity(certificato.getModuloRichiesta(), null, coreEngineAssembler.getUtenteSessione()));
			lst.add(csrModuloRichiesta);
		}
		
		if(certificato.getCertificato()!=null) {
			EstensioneClientEntity csrCertificato = new EstensioneClientEntity();
			csrCertificato.setNome(getNomeProperty(nomeCertificato, CERTIFICATO_CSR_PROPERTY));
			csrCertificato.setDocumento(documentoAssembler.toEntity(certificato.getCertificato(), null, coreEngineAssembler.getUtenteSessione()));
			lst.add(csrCertificato);

		}
		
		return lst;
	}

	
	protected String getNomeProperty(String... properties) {
		return String.join("_", Arrays.asList(properties));
	}
	
	protected Set<EstensioneClientEntity> getEstensioniCertificatoRichiestoCN(CertificatoClientRichiestoCnCreate certificato, String nomeCertificato, ConfigurazioneCertificato configurazione) {
		if(!configurazione.isCn()) {
			throw new BadRequestException(ErrorCode.VAL_001);
		}

		Set<EstensioneClientEntity> lst = new HashSet<>();
		
		EstensioneClientEntity cn = new EstensioneClientEntity();
		cn.setNome(getNomeProperty(nomeCertificato, CN_PROPERTY));
		cn.setValore(certificato.getCn());
		lst.add(cn);
		
		if(certificato.getCertificato()!=null) {
			EstensioneClientEntity csrCertificato = new EstensioneClientEntity();
			csrCertificato.setNome(getNomeProperty(nomeCertificato, CERTIFICATO_CN_PROPERTY));
			csrCertificato.setDocumento(documentoAssembler.toEntity(certificato.getCertificato(), null, coreEngineAssembler.getUtenteSessione()));
			CertificateUtils.checkCertificate(csrCertificato.getDocumento());
			lst.add(csrCertificato);

		}
		

		return lst;
	}
	
	protected Set<EstensioneClientEntity> getEstensioniCertificatoFornito(CertificatoClientFornitoCreate certificato, String nomeCertificato, ConfigurazioneCertificato configurazione) {
		
		if(!configurazione.isFile()) {
			throw new BadRequestException(ErrorCode.VAL_001);
		}
		Set<EstensioneClientEntity> lst = new HashSet<>();
		
		EstensioneClientEntity eCertificato = new EstensioneClientEntity();
		eCertificato.setNome(getNomeProperty(nomeCertificato, CERTIFICATO_PROPERTY));
		eCertificato.setDocumento(documentoAssembler.toEntity(certificato.getCertificato(), null, coreEngineAssembler.getUtenteSessione()));

		CertificateUtils.checkCertificate(eCertificato.getDocumento());
		lst.add(eCertificato);
		
		return lst;
	}
	
	protected CertificatoClient getCertificato(Set<EstensioneClientEntity> estensioni, String nomeCertificato) {
		if(existsProperty(estensioni, getNomeProperty(nomeCertificato, CN_PROPERTY))) {
			CertificatoClientRichiestoCn certificato = new CertificatoClientRichiestoCn();
			certificato.setTipoCertificato(TipoCertificatoEnum.RICHIESTO_CN);
			certificato.setCn(getTextProperty(estensioni, getNomeProperty(nomeCertificato, CN_PROPERTY)));
			if(existsProperty(estensioni, getNomeProperty(nomeCertificato, CERTIFICATO_CN_PROPERTY))) {
				certificato.setCertificato(documentoAssembler.toModel(getDocumentoProperty(estensioni, getNomeProperty(nomeCertificato, CERTIFICATO_CN_PROPERTY))));
			}			
			return certificato;
		} else if(existsProperty(estensioni, getNomeProperty(nomeCertificato, CSR_RICHIESTA_PROPERTY))) {
			CertificatoClientRichiestoCsr certificato = new CertificatoClientRichiestoCsr();
			certificato.setTipoCertificato(TipoCertificatoEnum.RICHIESTO_CSR);
			certificato.setRichiesta(documentoAssembler.toModel(getDocumentoProperty(estensioni, getNomeProperty(nomeCertificato, CSR_RICHIESTA_PROPERTY))));
			
			if(existsProperty(estensioni, getNomeProperty(nomeCertificato, CSR_MODULO_RICHIESTA_PROPERTY))) {
				certificato.setModuloRichiesta(documentoAssembler.toModel(getDocumentoProperty(estensioni, getNomeProperty(nomeCertificato, CSR_MODULO_RICHIESTA_PROPERTY))));	
			}

			if(existsProperty(estensioni, getNomeProperty(nomeCertificato, CERTIFICATO_CSR_PROPERTY))) {
				certificato.setCertificato(documentoAssembler.toModel(getDocumentoProperty(estensioni, getNomeProperty(nomeCertificato, CERTIFICATO_CSR_PROPERTY))));
			}			
			
			return certificato;
		} else if(existsProperty(estensioni, getNomeProperty(nomeCertificato, CERTIFICATO_PROPERTY))) {
			CertificatoClientFornito certificato = new CertificatoClientFornito();
			certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
			certificato.setCertificato(documentoAssembler.toModel(getDocumentoProperty(estensioni, getNomeProperty(nomeCertificato, CERTIFICATO_PROPERTY))));

			return certificato;
		}

		throw new InternalException(ErrorCode.SYS_001, java.util.Map.of("nomeCertificato", nomeCertificato));
	}

}
