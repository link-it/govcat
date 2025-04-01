--- backup_govcat_before.sql	2025-04-01 16:08:39.853513478 +0200
+++ govcat.sql	2025-04-01 15:27:58.815045258 +0200
@@ -162,12 +162,16 @@
        id number(19,0) not null,
         ambiente varchar2(255 char) not null,
         auth_type varchar2(255 char) not null,
+        data_creazione timestamp,
+        data_ultima_modifica timestamp,
         descrizione varchar2(255 char),
         id_client varchar2(255 char) not null,
         indirizzo_ip varchar2(255 char),
         nome varchar2(255 char) not null,
         stato varchar2(255 char) not null,
+        id_richiedente number(19,0),
         id_soggetto number(19,0),
+        id_utente_ultima_modifica number(19,0),
         primary key (id)
     );
 
@@ -198,6 +202,8 @@
 
     create table domini (
        id number(19,0) not null,
+        data_creazione timestamp,
+        data_ultima_modifica timestamp,
         deprecato number(1,0) not null,
         descrizione varchar2(255 char),
         id_dominio varchar2(255 char) not null,
@@ -208,7 +214,9 @@
         url_prefix_collaudo varchar2(255 char),
         url_prefix_produzione varchar2(255 char),
         visibilita varchar2(255 char),
+        id_richiedente number(19,0),
         id_soggetto_referente number(19,0),
+        id_utente_ultima_modifica number(19,0),
         primary key (id)
     );
 
@@ -322,13 +330,17 @@
         aderente number(1,0) not null,
         codice_ente varchar2(255 char),
         codice_fiscale_soggetto varchar2(255 char),
+        data_creazione timestamp,
+        data_ultima_modifica timestamp,
         descrizione varchar2(255 char),
         esterna number(1,0) not null,
         id_organizzazione varchar2(255 char) not null,
         id_tipo_utente varchar2(255 char),
         name varchar2(255 char) not null,
         referente number(1,0) not null,
+        id_richiedente number(19,0),
         id_soggetto_default number(19,0),
+        id_utente_ultima_modifica number(19,0),
         primary key (id)
     );
 
@@ -401,6 +413,8 @@
     create table soggetti (
        id number(19,0) not null,
         aderente number(1,0) not null,
+        data_creazione timestamp,
+        data_ultima_modifica timestamp,
         descrizione varchar2(255 char),
         id_soggetto varchar2(255 char) not null,
         nome varchar2(255 char) not null,
@@ -412,6 +426,8 @@
         url_prefix_collaudo varchar2(255 char),
         url_prefix_produzione varchar2(255 char),
         id_organizzazione number(19,0),
+        id_richiedente number(19,0),
+        id_utente_ultima_modifica number(19,0),
         primary key (id)
     );
 
@@ -464,6 +480,8 @@
     create table utenti (
        id number(19,0) not null,
         cognome varchar2(255 char) not null,
+        data_creazione timestamp,
+        data_ultima_modifica timestamp,
         email varchar2(255 char),
         email_aziendale varchar2(255 char),
         id_utente raw(255) not null,
@@ -642,10 +660,20 @@
        references servizi;
 
     alter table client 
+       add constraint FKjeoo8rn0etqj4nui4vgp9wp5a 
+       foreign key (id_richiedente) 
+       references utenti;
+
+    alter table client 
        add constraint FKbwlm9ufru09qk0n9b9ps7blse 
        foreign key (id_soggetto) 
        references soggetti;
 
+    alter table client 
+       add constraint FKqia6tm9aws76o35k5ftybobb4 
+       foreign key (id_utente_ultima_modifica) 
+       references utenti;
+
     alter table client_adesioni 
        add constraint FKmcwfisjojst7fpu9gjea8yquk 
        foreign key (id_adesione) 
@@ -657,10 +685,20 @@
        references client;
 
     alter table domini 
+       add constraint FKcmyxwj74q7gvy2oot6w57jmr 
+       foreign key (id_richiedente) 
+       references utenti;
+
+    alter table domini 
        add constraint FK221i6p2llolaywqrnwxnujkfm 
        foreign key (id_soggetto_referente) 
        references soggetti;
 
+    alter table domini 
+       add constraint FKjp9nlievk275yipcmk3hy02ny 
+       foreign key (id_utente_ultima_modifica) 
+       references utenti;
+
     alter table erogazioni 
        add constraint FKbw3ig0049jar4yrctpie5qmow 
        foreign key (id_api) 
@@ -767,10 +805,20 @@
        references servizi;
 
     alter table organizations 
+       add constraint FKqt2s0xtds4w6kx20jyh8styol 
+       foreign key (id_richiedente) 
+       references utenti;
+
+    alter table organizations 
        add constraint FKloimwtc1e7op9g4gnvyjf7pw8 
        foreign key (id_soggetto_default) 
        references soggetti;
 
+    alter table organizations 
+       add constraint FKow2bsndmcgmvoqiic4tdyyvy5 
+       foreign key (id_utente_ultima_modifica) 
+       references utenti;
+
     alter table package_servizi 
        add constraint FKh9yhto7q1n5vc7aam8qkymwyl 
        foreign key (id_package) 
@@ -851,6 +899,16 @@
        foreign key (id_organizzazione) 
        references organizations;
 
+    alter table soggetti 
+       add constraint FK59gblgp3bnic2ncl0onhf0lr5 
+       foreign key (id_richiedente) 
+       references utenti;
+
+    alter table soggetti 
+       add constraint FK464gw5aqix6obapwcubo4wxaf 
+       foreign key (id_utente_ultima_modifica) 
+       references utenti;
+
     alter table stati_adesione 
        add constraint FKpyodgfo2voxlujhw1fbikvyne 
        foreign key (id_adesione) 
