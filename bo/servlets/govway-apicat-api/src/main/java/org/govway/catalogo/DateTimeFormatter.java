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
package org.govway.catalogo;

import java.text.ParseException;
import java.util.Locale;

import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormatterBuilder;
import org.springframework.format.Formatter;

public class DateTimeFormatter implements Formatter<DateTime> {

	private org.joda.time.format.DateTimeFormatter formatter;
	
	public DateTimeFormatter(String pattern) {
		this.formatter = new DateTimeFormatterBuilder().appendPattern(pattern).toFormatter();
	}

	@Override
	public DateTime parse(String text, Locale locale) throws ParseException { 
		return DateTime.parse(text, this.formatter); 

	} 
	@Override
	public String print(DateTime object, Locale locale) {
		return object.toString(this.formatter);
	} 
}
