/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
package org.govway.catalogo.core.dao.transactions;

import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

public class Transactions {
	
	private final JpaTransactionManager txManager;
	
	public Transactions(JpaTransactionManager txManager)
	{
		this.txManager = txManager;
	}

	public void runVoid(Runnable r)
	{
		TransactionStatus transaction = null;
		try 
		{	
			TransactionTemplate template = new TransactionTemplate(this.txManager);
			transaction = this.txManager.getTransaction(template);
			
			r.run();
			
			this.txManager.commit(transaction);
		}
		catch (Exception e)
		{
			if(transaction!= null)
			{
				this.txManager.rollback(transaction);
			}
			throw e;
		}
	}
	
	
	public<T> T run(NoCheckedExceptionCallable<T> r)
	{
		TransactionStatus transaction = null;
		try 
		{	
			TransactionTemplate template = new TransactionTemplate(this.txManager);
			transaction = this.txManager.getTransaction(template);
			
			T value = r.call();
			
			this.txManager.commit(transaction);
			return value;
		}
		catch (Exception e)
		{
			if(transaction!= null)
			{
				this.txManager.rollback(transaction);
			}
			throw e;
		}
		
	}
	
	
	@FunctionalInterface
	public interface NoCheckedExceptionCallable<R> 
	{
		R call();
	}
	
	
}
