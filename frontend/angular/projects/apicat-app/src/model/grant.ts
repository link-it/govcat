export type RightsEnum = 'lettura' | 'scrittura';

export const RightsEnum = {
    Lettura: 'lettura' as RightsEnum,
    Scrittura: 'scrittura' as RightsEnum
};

export interface Grant { 
  ruoli: string[];
  identificativo: RightsEnum,
  generico: RightsEnum,
  specifica: RightsEnum,
  referenti: RightsEnum,
  collaudo: RightsEnum,
  produzione: RightsEnum
}
