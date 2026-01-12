/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
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
package org.govway.catalogo.monitoraggioutils;

public class DurationFormatUtilities {

	/**
	 * Converte unix_timestamp in stringa
	 * 
	 * @param time unix_timestamp
	 * @param millisecondiCheck Se true verranno indicati anche i millisecondi
	 * @return String unix_timestamp
	 */
	public static String convertSystemTimeIntoStringMillisecondi(long time,boolean millisecondiCheck){
		return convertSystemTimeIntoStringMillisecondi(time, millisecondiCheck, true, ":",".","");
	}
	public static String convertSystemTimeIntoStringMillisecondi(long time,boolean millisecondiCheck, boolean printZeroValues, 
			String separatorUnit,String separatorMs, String separatorValue){
		/**System.out.println("VALORE PASSATO: ["+time+"]");*/
		long millisecondi = time % 1000;
		/**System.out.println("Millisecondi (Valore%1000): ["+millisecondi+"]");*/
		long diff = (time)/1000;
		/**System.out.println("Diff... (valore/1000) ["+diff+"]");*/
		long ore = diff/3600;
		/**System.out.println("Ore... (diff/3600) ["+ore+"]");*/
		long minuti = (diff%3600) / 60;
		/**System.out.println("Minuti... (diff%3600) / 60 ["+minuti+"]");*/
		long secondi = (diff%3600) % 60;
		/**System.out.println("Secondi... (diff%3600) % 60 ["+secondi+"]");*/
		StringBuilder bf = new StringBuilder();

		long giorni = ore/24;
		long oreRimaste = ore%24;

		if(giorni>0){
			bf.append(giorni);
			bf.append(separatorValue);
			bf.append("d");
		}
		else{
			// Nothing
		}

		if(giorni>0){
			if(oreRimaste>0){
				if(bf.length()>0){
					bf.append(separatorUnit);
				}
				bf.append(oreRimaste);
				bf.append(separatorValue);
				bf.append("h");
			}else{
				if(printZeroValues && bf.length()>0){
					bf.append(separatorUnit);
					bf.append("0");
					bf.append(separatorValue);
					bf.append("h");
				}
			}
		}
		else{
			if(ore>0){
				if(bf.length()>0){
					bf.append(separatorUnit);
				}
				bf.append(ore);
				bf.append(separatorValue);
				bf.append("h");
			}else{
				if(printZeroValues && bf.length()>0){
					bf.append(separatorUnit);
					bf.append("0");
					bf.append(separatorValue);
					bf.append("h");
				}
			}
		}


		if(minuti>0){
			if(bf.length()>0){
				bf.append(separatorUnit);
			}
			bf.append(minuti);
			bf.append(separatorValue);
			bf.append("m");
		}else{
			if(printZeroValues && bf.length()>0){
				bf.append(separatorUnit);
				bf.append("0");
				bf.append(separatorValue);
				bf.append("m");
			}
		}

		if(secondi>0){
			if(bf.length()>0){
				bf.append(separatorUnit);
			}
			bf.append(secondi);
			bf.append(separatorValue);
			bf.append("s");
		}
		else{
			if(printZeroValues && bf.length()>0){
				bf.append(separatorUnit);
				bf.append("0");
				bf.append(separatorValue);
				bf.append("s");
			}
		}

		if(millisecondiCheck){
			if(millisecondi>0 || (millisecondi==0 && printZeroValues)){
				if(bf.length()>0){
					bf.append(separatorMs);
				}
				bf.append(millisecondi);
				bf.append(separatorValue);
				bf.append("ms");
			}
			else{
				if(printZeroValues && bf.length()>0){
					bf.append(separatorMs);
					bf.append("0");
					bf.append(separatorValue);
					bf.append("ms");
				}
			}
		}


		if(bf.length()==0){
			bf.append("conversione non riuscita");
		}

		return bf.toString();
	}

}
