package testsuite;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.govway.catalogo.core.dao.specifications.TassonomiaSpecification;
import org.govway.catalogo.core.orm.entity.TassonomiaEntity;

class TassonomiaSpecificationTestable extends TassonomiaSpecification {

    @Override
    protected List<Predicate> _toPredicateList(Root<TassonomiaEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        List<Predicate> predLst = new ArrayList<>();

        getQ().ifPresent(q -> {
            List<Predicate> predLstQ = new ArrayList<>();
            String pattern = "%" + q.toUpperCase() + "%";
            predLstQ.add(cb.like(cb.upper(root.get("descrizione")), pattern));
            predLstQ.add(cb.like(cb.upper(root.get("nome")), pattern));
            predLst.add(cb.or(predLstQ.toArray(new Predicate[0])));
        });

        getNome().ifPresent(nome -> 
            predLst.add(cb.equal(root.get("nome"), nome))
        );

        getIdTassonomia().ifPresent(id ->
        predLst.add(cb.equal(root.get("idTassonomia"), id))
        );

        getVisibile().ifPresent(visibile -> 
            predLst.add(cb.equal(root.get("visibile"), visibile))
        );

        getObbligatorio().ifPresent(obbligatorio -> 
            predLst.add(cb.equal(root.get("obbligatorio"), obbligatorio))
        );

        return predLst;
    }

}
