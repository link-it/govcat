import { NgModule } from '@angular/core';

import { arrayLength } from './array-length/validator';
import { base64 } from './base64/validator';
import { creditCard } from './credit-card/validator';
import { dateISO } from './date-iso/validator';
import { date } from './date/validator';
import { digits } from './digits/validator';
import { email } from './email/validator';
import { equalTo } from './equal-to/validator';
import { equal } from './equal/validator';
import { gte } from './greater-than-equal/validator';
import { gt } from './greater-than/validator';
import { includedIn } from './included-in/validator';
import { json } from './json/validator';
import { lte } from './less-than-equal/validator';
import { lt } from './less-than/validator';
// import { maxDate } from './max-date/validator';
import { max } from './max/validator';
// import { minDate } from './min-date/validator';
import { min } from './min/validator';
import { notEqualTo } from './not-equal-to/validator';
import { notEqual } from './not-equal/validator';
import { notIncludedIn } from './not-included-in/validator';
import { notMatching } from './not-matching/validator';
import { number } from './number/validator';
import { property } from './property/validator';
import { rangeLength } from './range-length/validator';
import { range } from './range/validator';
import { url } from './url/validator';
// import { uuid } from './uuid/validator';
import { cf } from './codice-fiscale/validator';
import { oneOf } from './one-of/validator';
import { oneOfLength } from './one-of-length/validator';

export const CustomValidators = {
  arrayLength,
  base64,
  creditCard,
  date,
  dateISO,
  digits,
  email,
  equal,
  equalTo,
  gt,
  gte,
  includedIn,
  json,
  lt,
  lte,
  max,
  // maxDate,
  min,
  // minDate,
  notEqual,
  notEqualTo,
  notIncludedIn,
  notMatching,
  number,
  property,
  range,
  rangeLength,
  url,
  // uuid,
  cf,
  oneOf,
  oneOfLength
};

@NgModule({
  declarations: [],
  exports: []
})
export class CustomFormsModule { }
