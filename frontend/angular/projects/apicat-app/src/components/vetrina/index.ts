/*
 * Vetrina — componenti riusabili per le pagine "vetrina" di adesione
 * e servizio (read-only summary view). Niente dipendenze dirette ai
 * modelli OpenAPI: i parent espongono ViewModel adattati via mapper
 * (es. `toAdesioneVetrinaVM`).
 */
export { HeroImageComponent, LnkHeroKind } from './hero-image.component';
export { StatoChipComponent } from './stato-chip.component';
export {
  RefsComponent,
  LnkRefItem,
  gradientFor,
  initialsOf,
} from './refs.component';
export { EnvToggleComponent, EnvValue } from './env-toggle.component';
export { ApiRowComponent, LnkApiTag } from './api-row.component';
export { ActionBannerComponent, LnkActionBannerVariant } from './action-banner.component';
export {
  AdesioneVetrinaVM,
  VetrinaKV,
  VetrinaAuthEntry,
  VetrinaEndpointEntry,
  ToAdesioneVetrinaInput,
  toAdesioneVetrinaVM,
} from './adesione-vetrina.viewmodel';
