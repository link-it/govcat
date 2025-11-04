package batch;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.govway.catalogo.core.dao.repositories.AdesioneRepository;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IntermediateStateService {
	@Autowired
	private AdesioneRepository entityRepository;
    private static final Logger logger = LoggerFactory.getLogger(IntermediateStateService.class);

	@Autowired
	protected EntityManager entityManager;


    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateIntermediateState(AdesioneEntity entity) {
    	
        entityRepository.save(entity);
    }
}

