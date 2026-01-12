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
package org.govway.catalogo.core.services;

import java.util.function.Supplier;

import jakarta.persistence.EntityManager;

import org.govway.catalogo.core.dao.repositories.AdesioneRepository;
import org.govway.catalogo.core.dao.repositories.AllegatoApiRepository;
import org.govway.catalogo.core.dao.repositories.AllegatoServizioRepository;
import org.govway.catalogo.core.dao.repositories.ApiRepository;
import org.govway.catalogo.core.dao.repositories.CategoriaRepository;
import org.govway.catalogo.core.dao.repositories.ClasseUtenteRepository;
import org.govway.catalogo.core.dao.repositories.ClientRepository;
import org.govway.catalogo.core.dao.repositories.DocumentoRepository;
import org.govway.catalogo.core.dao.repositories.DominioRepository;
import org.govway.catalogo.core.dao.repositories.EstensioneClientRepository;
import org.govway.catalogo.core.dao.repositories.GruppoRepository;
import org.govway.catalogo.core.dao.repositories.MessaggioAdesioneRepository;
import org.govway.catalogo.core.dao.repositories.MessaggioServizioRepository;
import org.govway.catalogo.core.dao.repositories.NotificaRepository;
import org.govway.catalogo.core.dao.repositories.OrganizzazioneRepository;
import org.govway.catalogo.core.dao.repositories.PackageServizioRepository;
import org.govway.catalogo.core.dao.repositories.ReferenteAdesioneRepository;
import org.govway.catalogo.core.dao.repositories.ReferenteDominioRepository;
import org.govway.catalogo.core.dao.repositories.ReferenteServizioRepository;
import org.govway.catalogo.core.dao.repositories.ServizioGruppoRepository;
import org.govway.catalogo.core.dao.repositories.ServizioRepository;
import org.govway.catalogo.core.dao.repositories.SoggettoRepository;
import org.govway.catalogo.core.dao.repositories.TagRepository;
import org.govway.catalogo.core.dao.repositories.TassonomiaRepository;
import org.govway.catalogo.core.dao.repositories.UtenteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

public class AbstractService {
	
	@Autowired
	protected OrganizzazioneRepository orgRepo;
	@Autowired
	protected ClientRepository clientRepo;
	@Autowired
	protected EstensioneClientRepository estensioneClientRepo;
	@Autowired
	protected AllegatoApiRepository allegatoApiRepo;
	@Autowired
	protected AllegatoServizioRepository allegatoServizioRepo;
	@Autowired
	protected DocumentoRepository documentoRepo;
	@Autowired
	protected SoggettoRepository soggettoRepo;
	@Autowired
	protected ClasseUtenteRepository classeUtenteRepo;
	@Autowired
	protected UtenteRepository utenteRepo;
	@Autowired
	protected GruppoRepository gruppoRepo;
	@Autowired
	protected DominioRepository dominioRepo;
	@Autowired
	protected MessaggioServizioRepository messaggioServizioRepo;
	@Autowired
	protected MessaggioAdesioneRepository messaggioAdesioneRepo;
	@Autowired
	protected NotificaRepository notificaRepo;
	@Autowired
	protected ServizioRepository servizioRepo;
	@Autowired
	protected PackageServizioRepository packageServizioRepo;
	@Autowired
	protected ServizioGruppoRepository servizioGruppoRepo;
	@Autowired
	protected AdesioneRepository adesioneRepo;
	@Autowired
	protected ReferenteDominioRepository referenteDominioRepo;
	@Autowired
	protected ReferenteServizioRepository referenteServizioRepo;
	@Autowired
	protected ReferenteAdesioneRepository referenteAdesioneRepo;
	@Autowired
	protected TagRepository tagRepo;
	@Autowired
	protected TassonomiaRepository tassonomiaRepo;
	@Autowired
	protected CategoriaRepository categoriaRepo;
	@Autowired
	protected ApiRepository apiRepo;

	@Autowired
	protected JpaTransactionManager txManager;

	@Autowired
	protected EntityManager entityManager;

	private Logger logger = LoggerFactory.getLogger(AbstractService.class);

	// Questi metodi potranno diventare protected se non vogliamo che ci si acceda
	// dai vari ServiceImpl
	public <T> T runTransaction(Supplier<T> supplier) {

		TransactionStatus transaction = null;
		try {
		    TransactionTemplate template = new TransactionTemplate(this.txManager);
		    transaction = this.txManager.getTransaction(template);
		    T ret = supplier.get();
		    this.logger.info("Eseguo il commit...");    

		    this.txManager.commit(transaction);
		    this.logger.info("Commit effettuato");
		    return ret;

		} catch (Throwable e) {
		    if (transaction != null) {
		        this.logger.error("Eccezione durante la transazione " + transaction + ". Completed: " + transaction.isCompleted());
		        
		        if (!transaction.isCompleted()) {
		            this.logger.info("Eseguo il rollback...");     
		            this.txManager.rollback(transaction);
		            this.logger.info("Rollback eseguito");     
		        }
		    } else {
		        this.logger.error("Eccezione durante la transazione: transaction è null", e);
		    }
		    // TODO: Catchare le ecezioni relative ai metodi commit,rollback e
		 	// getTransaction
		    throw e; // Rilancia l'eccezione per non nascondere il problema
		}
	}

	public void runTransaction(Runnable runnable) {

		TransactionStatus transaction = null;
		try {
			TransactionTemplate template = new TransactionTemplate(this.txManager);
			transaction = this.txManager.getTransaction(template);
			runnable.run();
			this.logger.info("Eseguo il commit...");     
			this.entityManager.flush();
			this.txManager.commit(transaction);
			this.logger.info("Commit effettuato");
		} catch (Throwable e) {
			if (transaction != null) {
				this.logger.error("Eccezione durante la transazione " + transaction + ". Completed: " + transaction.isCompleted());     
				if (transaction != null && !transaction.isCompleted()) {
					this.logger.info("Eseguo il rollback...");     
					this.txManager.rollback(transaction);
					this.logger.info("Rollback eseguito");     
				}
			} else {
				this.logger.error("Eccezione durante la transazione: transaction è null", e);
			}
			// TODO: Catchare le ecezzioni relative ai metodi commit,rollback e
			// getTransaction
			throw (e);
		}

	}
	
}
