--- backup_govcat_before.sql	2025-04-01 16:08:39.739512102 +0200
+++ govcat.sql	2025-04-01 15:27:58.684637719 +0200
@@ -130,12 +130,16 @@
        id bigint not null,
         ambiente varchar(255) not null,
         auth_type varchar(255) not null,
+        data_creazione datetime,
+        data_ultima_modifica datetime,
         descrizione varchar(255),
         id_client varchar(255) not null,
         indirizzo_ip varchar(255),
         nome varchar(255) not null,
         stato varchar(255) not null,
+        id_richiedente bigint,
         id_soggetto bigint,
+        id_utente_ultima_modifica bigint,
         primary key (id)
     ) engine=InnoDB;
 
@@ -166,6 +170,8 @@
 
     create table domini (
        id bigint not null,
+        data_creazione datetime,
+        data_ultima_modifica datetime,
         deprecato bit not null,
         descrizione varchar(255),
         id_dominio varchar(255) not null,
@@ -176,7 +182,9 @@
         url_prefix_collaudo varchar(255),
         url_prefix_produzione varchar(255),
         visibilita varchar(255),
+        id_richiedente bigint,
         id_soggetto_referente bigint,
+        id_utente_ultima_modifica bigint,
         primary key (id)
     ) engine=InnoDB;
 
@@ -290,13 +298,17 @@
         aderente bit not null,
         codice_ente varchar(255),
         codice_fiscale_soggetto varchar(255),
+        data_creazione datetime,
+        data_ultima_modifica datetime,
         descrizione varchar(255),
         esterna bit not null,
         id_organizzazione varchar(255) not null,
         id_tipo_utente varchar(255),
         name varchar(255) not null,
         referente bit not null,
+        id_richiedente bigint,
         id_soggetto_default bigint,
+        id_utente_ultima_modifica bigint,
         primary key (id)
     ) engine=InnoDB;
 
@@ -561,6 +573,8 @@
     create table soggetti (
        id bigint not null,
         aderente bit not null,
+        data_creazione datetime,
+        data_ultima_modifica datetime,
         descrizione varchar(255),
         id_soggetto varchar(255) not null,
         nome varchar(255) not null,
@@ -572,6 +586,8 @@
         url_prefix_collaudo varchar(255),
         url_prefix_produzione varchar(255),
         id_organizzazione bigint,
+        id_richiedente bigint,
+        id_utente_ultima_modifica bigint,
         primary key (id)
     ) engine=InnoDB;
 
@@ -624,6 +640,8 @@
     create table utenti (
        id bigint not null,
         cognome varchar(255) not null,
+        data_creazione datetime,
+        data_ultima_modifica datetime,
         email varchar(255),
         email_aziendale varchar(255),
         id_utente binary(255) not null,
@@ -802,10 +820,20 @@
        references servizi (id);
 
     alter table client 
+       add constraint FKjeoo8rn0etqj4nui4vgp9wp5a 
+       foreign key (id_richiedente) 
+       references utenti (id);
+
+    alter table client 
        add constraint FKbwlm9ufru09qk0n9b9ps7blse 
        foreign key (id_soggetto) 
        references soggetti (id);
 
+    alter table client 
+       add constraint FKqia6tm9aws76o35k5ftybobb4 
+       foreign key (id_utente_ultima_modifica) 
+       references utenti (id);
+
     alter table client_adesioni 
        add constraint FKmcwfisjojst7fpu9gjea8yquk 
        foreign key (id_adesione) 
@@ -817,10 +845,20 @@
        references client (id);
 
     alter table domini 
+       add constraint FKcmyxwj74q7gvy2oot6w57jmr 
+       foreign key (id_richiedente) 
+       references utenti (id);
+
+    alter table domini 
        add constraint FK221i6p2llolaywqrnwxnujkfm 
        foreign key (id_soggetto_referente) 
        references soggetti (id);
 
+    alter table domini 
+       add constraint FKjp9nlievk275yipcmk3hy02ny 
+       foreign key (id_utente_ultima_modifica) 
+       references utenti (id);
+
     alter table erogazioni 
        add constraint FKbw3ig0049jar4yrctpie5qmow 
        foreign key (id_api) 
@@ -927,10 +965,20 @@
        references servizi (id);
 
     alter table organizations 
+       add constraint FKqt2s0xtds4w6kx20jyh8styol 
+       foreign key (id_richiedente) 
+       references utenti (id);
+
+    alter table organizations 
        add constraint FKloimwtc1e7op9g4gnvyjf7pw8 
        foreign key (id_soggetto_default) 
        references soggetti (id);
 
+    alter table organizations 
+       add constraint FKow2bsndmcgmvoqiic4tdyyvy5 
+       foreign key (id_utente_ultima_modifica) 
+       references utenti (id);
+
     alter table package_servizi 
        add constraint FKh9yhto7q1n5vc7aam8qkymwyl 
        foreign key (id_package) 
@@ -1011,6 +1059,16 @@
        foreign key (id_organizzazione) 
        references organizations (id);
 
+    alter table soggetti 
+       add constraint FK59gblgp3bnic2ncl0onhf0lr5 
+       foreign key (id_richiedente) 
+       references utenti (id);
+
+    alter table soggetti 
+       add constraint FK464gw5aqix6obapwcubo4wxaf 
+       foreign key (id_utente_ultima_modifica) 
+       references utenti (id);
+
     alter table stati_adesione 
        add constraint FKpyodgfo2voxlujhw1fbikvyne 
        foreign key (id_adesione) 
