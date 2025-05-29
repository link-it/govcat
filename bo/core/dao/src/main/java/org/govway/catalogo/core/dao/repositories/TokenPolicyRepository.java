package org.govway.catalogo.core.dao.repositories;

import org.govway.catalogo.core.orm.entity.TokenPolicyEntity;
import org.springframework.data.jpa.repository.support.JpaRepositoryImplementation;

public interface TokenPolicyRepository extends JpaRepositoryImplementation<TokenPolicyEntity, Long> {
}
