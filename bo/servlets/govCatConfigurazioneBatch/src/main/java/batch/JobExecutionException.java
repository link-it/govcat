package batch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class JobExecutionException extends Exception {
	

	private static final long serialVersionUID = 1L;
	private final Logger log = LoggerFactory.getLogger(getClass());

	public JobExecutionException(String message) {
        super(message);
		log.error(message);
    }

}
