package org.govway.catalogo.core.dao.specifications;

import org.govway.catalogo.core.orm.entity.TokenPolicyEntity;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

public class TokenPolicySpecification implements Specification<TokenPolicyEntity> {
    @Override
    public Predicate toPredicate(Root<TokenPolicyEntity> root, CriteriaQuery<?> query, CriteriaBuilder criteriaBuilder) {
        return null;
    }
}
