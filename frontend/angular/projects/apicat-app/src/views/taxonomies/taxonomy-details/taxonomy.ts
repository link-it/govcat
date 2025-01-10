
export interface Categoria { 
  id_tassonomia: string;
  id_categoria: string;
  id_categoria_padre?: string;
  nome: string;
  nome_tassonomia: string;
  descrizione?: string;
  immagine?: string;
  figli?: Array<Categoria>;
}

export class Taxonomy {

  id_tassonomia: string | null = null;
  nome: string | null = null;
  descrizione: string | null = null;
  visibile: boolean = false;
  obbligatorio: boolean = false;
  immagine?: string;
  categorie?: Array<Categoria>;

  constructor(_data?: any) {
    if (_data) {
      for (const key in _data) {
        if (this.hasOwnProperty(key)) {
          if (_data[key] !== null && _data[key] !== undefined) {
            switch (key) {
              default:
                (this as any)[key] = _data[key];
            }
          }
        }
      }
    }
  }
}
