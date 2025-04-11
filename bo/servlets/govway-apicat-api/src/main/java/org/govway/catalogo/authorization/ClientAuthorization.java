package org.govway.catalogo.authorization;

import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.servlets.model.ClientCreate;
import org.govway.catalogo.servlets.model.ClientUpdate;

public class ClientAuthorization extends DefaultAuthorization<ClientCreate,ClientUpdate,ClientEntity> {
	@Override
	public void authorizeCreate(ClientCreate create) {
		authorizeWrite(EntitaEnum.CLIENT);
	}

	@Override
	public void authorizeUpdate(ClientUpdate update, ClientEntity entity) {
		authorizeWrite(EntitaEnum.CLIENT);
	}

	@Override
	public void authorizeDelete(ClientEntity entity) {
		authorizeWrite(EntitaEnum.CLIENT);
	}
}