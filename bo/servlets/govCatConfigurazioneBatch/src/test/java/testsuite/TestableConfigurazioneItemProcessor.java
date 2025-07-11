package testsuite;

import org.govway.catalogo.core.configurazione.IConfigurazioneExecutor;

import batch.ConfigurazioneItemProcessor;

public class TestableConfigurazioneItemProcessor extends ConfigurazioneItemProcessor {
    private final IConfigurazioneExecutor fakeExecutor;

    public TestableConfigurazioneItemProcessor(
        String statoConfJson,
        IConfigurazioneExecutor fakeExecutor
    ) {
        super(statoConfJson);
        this.fakeExecutor = fakeExecutor;
    }

    @Override
    public IConfigurazioneExecutor configurazioneExecutor() {
        return fakeExecutor;
    }
}
