package testsuite;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Ruolo;

import org.govway.catalogo.core.orm.entity.UtenteEntity_;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity_;

class UtenteSpecificationTestable extends UtenteSpecification {

    @Override
    protected List<Predicate> _toPredicateList(Root<UtenteEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        List<Predicate> predLst = new ArrayList<>();

        getNome().ifPresent(nome -> 
            predLst.add(cb.equal(root.get("nome"), nome))
        );

        getIdUtente().ifPresent(id -> 
            predLst.add(cb.equal(root.get("idUtente"), id))
        );

        getStato().ifPresent(stato -> 
            predLst.add(cb.equal(root.get("stato"), stato))
        );

        if (getIdClassiUtente() != null) {
            if (!getIdClassiUtente().isEmpty()) {
                predLst.add(root.join("classi", JoinType.LEFT).in(getIdClassiUtente()));
            } else {
                predLst.add(cb.disjunction());
            }
        }

        getIdOrganizzazione().ifPresent(idOrg ->
            predLst.add(cb.equal(root.get("organizzazione").get("idOrganizzazione"), idOrg.toString()))
        );

        getEmail().ifPresent(email -> {
            List<Predicate> predLstQ = new ArrayList<>();
            String pattern = "%" + email.toUpperCase() + "%";
            predLstQ.add(cb.like(cb.upper(root.get("email")), pattern));
            predLstQ.add(cb.like(cb.upper(root.get("emailAziendale")), pattern));
            predLst.add(cb.or(predLstQ.toArray(new Predicate[0])));
        });

        getPrincipalLike().ifPresent(principalLike -> {
            String pattern = "%" + principalLike.toUpperCase() + "%";
            predLst.add(cb.like(cb.upper(root.get("principal")), pattern));
        });

        getPrincipal().ifPresent(principal -> 
            predLst.add(cb.equal(root.get("principal"), principal))
        );

        getReferenteTecnico().ifPresent(refTecnico ->
            predLst.add(cb.equal(root.get("referenteTecnico"), refTecnico))
        );

        // Il blocco sui ruoli è commentato come nell'originale
        return predLst;
    }
}
