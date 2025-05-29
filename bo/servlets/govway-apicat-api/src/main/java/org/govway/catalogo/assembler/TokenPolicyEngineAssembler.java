package org.govway.catalogo.assembler;

import org.govway.catalogo.core.orm.entity.TokenPolicyEntity.TipoPolicy;
import org.govway.catalogo.servlets.model.ConfigurazioneTipoPolicyEnum;

public class TokenPolicyEngineAssembler extends CoreEngineAssembler {

    public TipoPolicy toEntity(ConfigurazioneTipoPolicyEnum tipoPolicyEnum) {
        switch(tipoPolicyEnum) {
            case CODE_GRANT: return TipoPolicy.CODE_GRANT;
            case PDND: return TipoPolicy.PDND;
            case CLIENT_CREDENTIALS: return TipoPolicy.CLIENT_CREDENTIALS;
            case PDND_AUDIT: return TipoPolicy.PDND_AUDIT;
            case PDND_AUDIT_INTEGRITY: return TipoPolicy.PDND_AUDIT_INTEGRITY;
            case PDND_INTEGRITY: return TipoPolicy.PDND_INTEGRITY;
        }
        return null;
    }

    public ConfigurazioneTipoPolicyEnum toConfigurazioneTipoPolicyEnum(TipoPolicy tipoPolicy) {
        switch(tipoPolicy) {
            case CODE_GRANT: return ConfigurazioneTipoPolicyEnum.CODE_GRANT;
            case PDND: return ConfigurazioneTipoPolicyEnum.PDND;
            case CLIENT_CREDENTIALS: return ConfigurazioneTipoPolicyEnum.CLIENT_CREDENTIALS;
            case PDND_AUDIT: return ConfigurazioneTipoPolicyEnum.PDND_AUDIT;
            case PDND_AUDIT_INTEGRITY: return ConfigurazioneTipoPolicyEnum.PDND_AUDIT_INTEGRITY;
            case PDND_INTEGRITY: return ConfigurazioneTipoPolicyEnum.PDND_INTEGRITY;
        }
        return null;
    }
}
