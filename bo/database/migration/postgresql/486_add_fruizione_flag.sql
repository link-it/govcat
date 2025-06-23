ALTER TABLE servizi ADD COLUMN fruizione BOOLEAN;
update servizi set fruizione = (select esterna from organizations where id = (select id_organizzazione from soggetti where id = (select id_soggetto_referente from domini where id = (select id_dominio from servizi s where s.id=servizi.id))));
ALTER TABLE servizi ALTER COLUMN fruizione SET NOT NULL;