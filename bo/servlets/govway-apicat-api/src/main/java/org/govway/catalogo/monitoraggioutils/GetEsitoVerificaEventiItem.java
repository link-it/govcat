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
package org.govway.catalogo.monitoraggioutils;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

public class GetEsitoVerificaEventiItem {

	private String gruppo;
	private List<Errore> listErrori = new ArrayList<>();
	
	public void addErrore(String descrizione, Date date) {
		Errore err = this.listErrori.stream().filter(e -> e.getDescrizione().equals(descrizione)).findAny().orElseGet(() -> {
			Errore e = new Errore();
			e.setDescrizione(descrizione);
			this.listErrori.add(e);
			return e;
		});
		
		err.getDates().add(date);
		
	}
	
	class Errore {
		private String descrizione;
		private List<Date> dates = new ArrayList<>();
		public String getDescrizione() {
			return descrizione;
		}
		public void setDescrizione(String descrizione) {
			this.descrizione = descrizione;
		}
		public List<Date> getDates() {
			return dates;
		}
		public void setDates(List<Date> dates) {
			this.dates = dates;
		}
		
		@Override
		public String toString() {
			return formatDates() + " " + this.descrizione;
		}
		
		private String formatDates() {
			SimpleDateFormat sdfData = new SimpleDateFormat("yyyy-MM-dd");
			SimpleDateFormat sdfOra = new SimpleDateFormat("HH:mm");
			
			if(this.dates.size() < 1) {
				return "";
			} else if(this.dates.size() == 1) {
				return formatDataOraSingola(sdfData.format(this.dates.get(0)), sdfOra.format(this.dates.get(0)));
			} else {
				Optional<Date> dateMinOptional = this.dates.stream()
		                .min(Date::compareTo);
				Date minDate = null;
				if(dateMinOptional.isPresent()) {
					minDate = dateMinOptional.get();
	
					String minDateString = sdfData.format(minDate);
					String minDateHourString = sdfOra.format(minDate);
					Optional<Date> dateMaxOptional = this.dates.stream()
			                .max(Date::compareTo);
					Date maxDate = null;
					if(dateMaxOptional.isPresent()) {
						maxDate = dateMaxOptional.get();
	
						String maxDateString = sdfData.format(maxDate);
						String maxDateHourString = sdfOra.format(maxDate);
						
						if(minDateString.equals(maxDateString)) {
							return formatDataConOraDoppia(minDateString, minDateHourString, maxDateHourString);
		//					return minDateString + " "+minDateHourString+" - "+maxDateHourString;
						} else {
							return formatDataOraDoppia(minDateString, minDateHourString, maxDateString, maxDateHourString);
		//					return minDateString+" "+minDateHourString+" - "+maxDateString+" "+maxDateHourString;
						}
					}
				}
				return "";
			}
		}
		
		private String formatDataOraSingola(String data, String ora) {
			return includeBrackets(formatDataOraInternal(data, ora));
		}
		
		private String includeBrackets(String dataora) {
			return "["+dataora+"]";
		}
		
		private String formatDataConOraDoppia(String data, String ora, String ora2) {
			String formatDataOra1 = formatDataOraInternal(data, ora);
			return includeBrackets(formatMeno(formatDataOra1, ora2));
		}
		
		private String formatDataOraDoppia(String data, String ora, String data2, String ora2) {
			String formatDataOra1 = formatDataOraInternal(data, ora);
			String formatDataOra2 = formatDataOraInternal(data2, ora2);
			return includeBrackets(formatMeno(formatDataOra1, formatDataOra2));
		}
		
		private String formatMeno(String data1, String data2) {
			return data1 + " - " + data2;
		}
		private String formatDataOraInternal(String data, String ora) {
			return data+" "+ora;
		}
		
	}

	public String getGruppo() {
		return gruppo;
	}

	public void setGruppo(String gruppo) {
		this.gruppo = gruppo;
	}

	@Override
	public String toString() {
		StringBuilder sb = new StringBuilder();
		
		sb.append("'"+this.gruppo+"'\n");
		
		for(Errore err: this.listErrori) {
			sb.append(err.toString()).append("\n");
		}
		
		return sb.toString();
	}

	public List<Errore> getListErrori() {
		return listErrori;
	}

	public void setListErrori(List<Errore> listErrori) {
		this.listErrori = listErrori;
	}
	
}
