import {
  SingleSeries,
  MultiSeries,
  Series
} from '@swimlane/ngx-charts';

import { countries } from './countries';

export const single: SingleSeries = [
  {
    name: 'Germany',
    value: 40632,
    extra: {
      code: 'de'
    }
  },
  {
    name: 'United States',
    value: 50000,
    extra: {
      code: 'us'
    }
  },
  {
    name: 'France',
    value: 36745,
    extra: {
      code: 'fr'
    }
  },
  {
    name: 'United Kingdom',
    value: 36240,
    extra: {
      code: 'uk'
    }
  },
  {
    name: 'Spain',
    value: 33000,
    extra: {
      code: 'es'
    }
  },
  {
    name: 'Italy',
    value: 35800,
    extra: {
      code: 'it'
    }
  }
];

export const multi: MultiSeries = [
  {
    name: 'Germany',
    series: [
      {
        name: '2010',
        value: 40632,
        extra: {
          code: 'de'
        }
      },
      {
        name: '2000',
        value: 36953,
        extra: {
          code: 'de'
        }
      },
      {
        name: '1990',
        value: 31476,
        extra: {
          code: 'de'
        }
      }
    ]
  },
  {
    name: 'United States',
    series: [
      {
        name: '2010',
        value: 0,
        extra: {
          code: 'us'
        }
      },
      {
        name: '2000',
        value: 45986,
        extra: {
          code: 'us'
        }
      },
      {
        name: '1990',
        value: 37060,
        extra: {
          code: 'us'
        }
      }
    ]
  },
  {
    name: 'France',
    series: [
      {
        name: '2010',
        value: 36745,
        extra: {
          code: 'fr'
        }
      },
      {
        name: '2000',
        value: 34774,
        extra: {
          code: 'fr'
        }
      },
      {
        name: '1990',
        value: 29476,
        extra: {
          code: 'fr'
        }
      }
    ]
  },
  {
    name: 'United Kingdom',
    series: [
      {
        name: '2010',
        value: 36240,
        extra: {
          code: 'uk'
        }
      },
      {
        name: '2000',
        value: 32543,
        extra: {
          code: 'uk'
        }
      },
      {
        name: '1990',
        value: 26424,
        extra: {
          code: 'uk'
        }
      }
    ]
  }
];

export function generateData(seriesLength: number, includeMinMaxRange: boolean, dataPoints: number = 5): MultiSeries {
  const results: MultiSeries = [];

  const domain: Date[] = []; // array of time stamps in milliseconds

  for (let j = 0; j < dataPoints; j++) {
    // random dates between Sep 12, 2016 and Sep 24, 2016
    domain.push(new Date(Math.floor(1473700105009 + Math.random() * 1000000000)));
  }

  for (let i = 0; i < seriesLength; i++) {
    const country = countries[Math.floor(Math.random() * countries.length)];
    const series: Series = {
      name: country.name,
      series: []
    };

    for (let j = 0; j < domain.length; j++) {
      const value = Math.floor(2000 + Math.random() * 5000);
      // let timestamp = Math.floor(1473700105009 + Math.random() * 1000000000);
      const timestamp = domain[j];
      if (includeMinMaxRange) {
        const errorMargin = 0.02 + Math.random() * 0.08;

        series.series.push({
          value,
          name: timestamp,
          min: Math.floor(value * (1 - errorMargin)),
          max: Math.ceil(value * (1 + errorMargin))
        });
      } else {
        series.series.push({
          value,
          name: timestamp
        });
      }
    }

    results.push(series);
  }
  return results;
}
