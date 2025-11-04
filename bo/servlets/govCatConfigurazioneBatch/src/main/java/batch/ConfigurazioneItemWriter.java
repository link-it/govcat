package batch;

import jakarta.persistence.EntityManager;

import org.govway.catalogo.core.dao.repositories.AdesioneRepository;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ConfigurazioneItemWriter implements ItemWriter<AdesioneEntity> {

	@Autowired
	private AdesioneRepository entityRepository;
	@Autowired
	protected EntityManager entityManager;

    private static final Logger logger = LoggerFactory.getLogger(ConfigurazioneItemWriter.class);

    @Override
    public void write(Chunk<? extends AdesioneEntity> items) throws Exception {
        for (AdesioneEntity entityAdesione : items) {
            entityRepository.save(entityAdesione);
            entityManager.clear();

        }
    }
}