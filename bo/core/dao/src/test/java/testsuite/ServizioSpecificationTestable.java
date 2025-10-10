package testsuite;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.govway.catalogo.core.dao.specifications.ServizioSpecification;
import org.govway.catalogo.core.orm.entity.AdesioneEntity_;
import org.govway.catalogo.core.orm.entity.ApiEntity_;
import org.govway.catalogo.core.orm.entity.CategoriaEntity_;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity_;
import org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.DominioEntity_;
import org.govway.catalogo.core.orm.entity.GruppoEntity_;
import org.govway.catalogo.core.orm.entity.PackageServizioEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteServizioEntity_;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity_;
import org.govway.catalogo.core.orm.entity.ServizioGruppoEntity;
import org.govway.catalogo.core.orm.entity.TagEntity_;
import org.govway.catalogo.core.orm.entity.TipoServizio;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity_;
import org.springframework.data.jpa.domain.Specification;

class ServizioSpecificationTestable extends ServizioSpecification {

	@Override
    protected List<Predicate> _toPredicateList(Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        List<Predicate> predLst = new ArrayList<>();

        query.distinct(true); 

        getQ().ifPresent(q -> {
            List<Predicate> predLstQ = new ArrayList<>();
            String pattern = "%" + q.toUpperCase() + "%";
            predLstQ.add(cb.like(cb.upper(root.get(ServizioEntity_.nome)), pattern)); 
            predLstQ.add(cb.like(cb.upper(root.get(ServizioEntity_.descrizione)), pattern));
            predLstQ.add(cb.like(cb.upper(root.get(ServizioEntity_.descrizioneSintetica)), pattern));
            predLst.add(cb.or(predLstQ.toArray(new Predicate[0])));
        });
        /*
        getTipoComponente().ifPresent(tipo ->
            predLst.add(cb.equal(root.get(ServizioGruppoEntity_.tipoComponente), tipo))
        );

        getGruppo().ifPresent(gruppo ->
            predLst.add(cb.equal(root.get(ServizioGruppoEntity_.gruppo).get(GruppoEntity_.idGruppo), gruppo.toString()))
        );

        getGruppoPadreNull().ifPresent(isNull -> {
            if (isNull) {
                predLst.add(cb.isNull(root.get(ServizioGruppoEntity_.gruppo)));
            } else {
                predLst.add(cb.isNotNull(root.get(ServizioGruppoEntity_.gruppo)));
            }
        });
         
        getUtente().ifPresent(utente -> {
            List<Predicate> predListMieiServizi = new ArrayList<>();
            if (utente.getId() != null) {
                predListMieiServizi.add(cb.equal(root.join(ServizioEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.referenti, JoinType.LEFT).get(ReferenteServizioEntity_.referente), utente));
                predListMieiServizi.add(cb.equal(root.join(ServizioEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.dominio, JoinType.LEFT).join(DominioEntity_.referenti, JoinType.LEFT).get(ReferenteDominioEntity_.referente), utente));
                predListMieiServizi.add(cb.equal(root.join(ServizioEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.classi, JoinType.LEFT).join(ClasseUtenteEntity_.utentiAssociati, JoinType.LEFT), utente));
                predListMieiServizi.add(cb.equal(root.join(ServizioEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.dominio, JoinType.LEFT).join(DominioEntity_.classi, JoinType.LEFT).join(ClasseUtenteEntity_.utentiAssociati, JoinType.LEFT), utente));
                predListMieiServizi.add(cb.equal(root.join(ServizioEntity_.servizio, JoinType.LEFT).get(ServizioEntity_.richiedente), utente));
                predListMieiServizi.add(cb.literal(utente.getId()).in(root.join(ServizioEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.adesioni, JoinType.LEFT).join(AdesioneEntity_.referenti, JoinType.LEFT).join(ReferenteAdesioneEntity_.referente, JoinType.LEFT)));
                predListMieiServizi.add(cb.literal(utente.getId()).in(root.join(ServizioEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.adesioni, JoinType.LEFT).get(AdesioneEntity_.richiedente)));
            }

            List<Predicate> predsStati = new ArrayList<>();
            for (String stato : getStatiAderibili()) {
                predsStati.add(cb.equal(root.get(ServizioEntity_.stato), stato));
            }

            List<Predicate> predLstPubblico = new ArrayList<>();
            //predLstPubblico.add(getVisibilitaFilter(VISIBILITA.PUBBLICO, root, cb));
            predLstPubblico.add(cb.or(predsStati.toArray(new Predicate[0])));

            List<Predicate> predLstUtente = new ArrayList<>();
            if (!predListMieiServizi.isEmpty()) {
                predLstUtente.add(cb.or(predListMieiServizi.toArray(new Predicate[0])));
            }
            predLstUtente.add(cb.and(predLstPubblico.toArray(new Predicate[0])));
            predLst.add(cb.or(predLstUtente.toArray(new Predicate[0])));

            Predicate visibilitaNonComponente = cb.not(cb.equal(root.get(ServizioEntity_.visibilita), VISIBILITA.COMPONENTE));
            Predicate visibilitaNull = cb.isNull(root.get(ServizioEntity_.visibilita));
            predLst.add(cb.or(visibilitaNull, visibilitaNonComponente));
        });
         */
        if (getUtenteAdmin().isPresent() && !getUtenteAdmin().get()) {
            predLst.add(cb.notEqual(root.get(ServizioEntity_.stato), "archiviato"));
        }
        /*
        getVisibilita().ifPresent(v ->
            predLst.add(getVisibilitaFilter(v, root, cb))
        );
		*/
        return predLst;
    }
	/*
    private Predicate getVisibilitaFilter(VISIBILITA visibilita, Root<ServizioGruppoEntity> root, CriteriaBuilder cb) {
        Predicate statoServizio = cb.equal(root.get(ServizioEntity_.visibilita), visibilita); 
        Predicate statoNull = cb.isNull(root.get(ServizioEntity_.visibilita)); 
        Predicate statoDominio = cb.equal(root.join(ServizioEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.dominio, JoinType.LEFT).get(DominioEntity_.visibilita), visibilita);
        return cb.or(statoServizio, cb.and(statoNull, statoDominio));
    }
	*/
    public List<String> getStatiAderibili() {
        return List.of(
            "pubblicato_collaudo",
            "richiesto_produzione",
            "autorizzato_produzione",
            "in_configurazione_produzione",
            "pubblicato_produzione"
        );
    }
}