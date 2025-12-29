create sequence seq_adesioni start with 1 increment by 1;
create sequence seq_allegati_api start with 1 increment by 1;
create sequence seq_allegati_servizi start with 1 increment by 1;
create sequence seq_api start with 1 increment by 1;
create sequence seq_api_auth_types start with 1 increment by 1;
create sequence seq_api_config start with 1 increment by 1;
create sequence seq_categorie start with 1 increment by 1;
create sequence seq_classi start with 1 increment by 1;
create sequence seq_client start with 1 increment by 1;
create sequence seq_client_adesioni start with 1 increment by 1;
create sequence seq_documenti start with 1 increment by 1;
create sequence seq_domini start with 1 increment by 1;
create sequence seq_erogazioni start with 1 increment by 1;
create sequence seq_estensioni_adesioni start with 1 increment by 1;
create sequence seq_estensioni_api start with 1 increment by 1;
create sequence seq_estensioni_client start with 1 increment by 1;
create sequence seq_gruppi start with 1 increment by 1;
create sequence seq_messaggi_adesioni start with 1 increment by 1;
create sequence seq_messaggi_servizi start with 1 increment by 1;
create sequence seq_notifiche start with 1 increment by 1;
create sequence seq_organizations start with 1 increment by 1;
create sequence seq_package_servizi start with 1 increment by 1;
create sequence seq_referenti_adesioni start with 1 increment by 1;
create sequence seq_referenti_domini start with 1 increment by 1;
create sequence seq_referenti_servizi start with 1 increment by 1;
create sequence seq_servizi start with 1 increment by 1;
create sequence seq_soggetti start with 1 increment by 1;
create sequence seq_stati_adesione start with 1 increment by 1;
create sequence seq_stati_servizio start with 1 increment by 1;
create sequence seq_tags start with 1 increment by 1;
create sequence seq_tassonomie start with 1 increment by 1;
create sequence seq_utenti start with 1 increment by 1;

    create table adesioni (
       id bigint not null,
        data_creazione timestamp,
        data_ultima_modifica timestamp,
        id_adesione varchar(255) not null,
        id_logico varchar(255),
        messaggio_configurazione varchar(255),
        search_terms varchar(255) not null,
        skip_collaudo boolean not null,
        stato varchar(255) not null,
        stato_configurazione varchar(255),
        tentativi integer,
        id_adesione_collaudo bigint,
        id_richiedente bigint,
        id_servizio bigint,
        id_soggetto bigint,
        id_utente_ultima_modifica bigint,
        primary key (id)
    );

    create table allegati_api (
       id bigint not null,
        tipologia varchar(255),
        visibilita varchar(255),
        id_api bigint,
        id_documento bigint,
        primary key (id)
    );

    create table allegati_messaggi_adesioni (
       id_messaggio bigint not null,
        id_allegato bigint not null,
        primary key (id_messaggio, id_allegato)
    );

    create table allegati_messaggi_servizi (
       id_messaggio bigint not null,
        id_allegato bigint not null,
        primary key (id_messaggio, id_allegato)
    );

    create table allegati_servizi (
       id bigint not null,
        tipologia varchar(255),
        visibilita varchar(255),
        id_documento bigint,
        id_servizio bigint,
        primary key (id)
    );

    create table api (
       id bigint not null,
        codice_asset varchar(255),
        descrizione longvarbinary,
        id_api varchar(255) not null,
        nome varchar(255) not null,
        ruolo varchar(255) not null,
        url_invocazione varchar(255),
        versione integer not null,
        id_config_collaudo bigint,
        id_config_produzione bigint,
        primary key (id)
    );

    create table api_auth_types (
       id bigint not null,
        note varchar(255),
        profilo varchar(255) not null,
        resources longvarbinary not null,
        id_api bigint not null,
        primary key (id)
    );

    create table api_config (
       id bigint not null,
        nome_gateway varchar(255),
        protocollo varchar(255) not null,
        url varchar(255),
        url_prefix varchar(255),
        versione_gateway integer,
        id_specifica bigint,
        primary key (id)
    );

    create table api_servizi (
       id_servizio bigint not null,
        id_api bigint not null,
        primary key (id_api, id_servizio)
    );

    create table categorie (
       id bigint not null,
        descrizione varchar(255),
        id_categoria varchar(255) not null,
        nome varchar(255),
        id_categoria_padre bigint,
        id_immagine bigint,
        id_tassonomia bigint not null,
        primary key (id)
    );

    create table categorie_servizi (
       id_categoria bigint not null,
        id_servizio bigint not null,
        primary key (id_servizio, id_categoria)
    );

    create table classi (
       id bigint not null,
        descrizione varchar(255),
        id_classe_utente varchar(255) not null,
        nome varchar(255) not null,
        primary key (id)
    );

    create table classi_domini (
       id_dominio bigint not null,
        id_classe bigint not null,
        primary key (id_dominio, id_classe)
    );

    create table classi_servizi (
       id_servizio bigint not null,
        id_classe bigint not null,
        primary key (id_servizio, id_classe)
    );

    create table client (
       id bigint not null,
        ambiente varchar(255) not null,
        auth_type varchar(255) not null,
        descrizione varchar(255),
        id_client varchar(255) not null,
        indirizzo_ip varchar(255),
        nome varchar(255) not null,
        stato varchar(255) not null,
        id_soggetto bigint,
        primary key (id)
    );

    create table client_adesioni (
       id bigint not null,
        ambiente varchar(255) not null,
        nome_proposto varchar(255),
        profilo varchar(255) not null,
        id_adesione bigint not null,
        id_client bigint,
        primary key (id)
    );

    create table documenti (
       id bigint not null,
        data_creazione timestamp not null,
        data_ultima_modifica timestamp,
        descrizione varchar(255),
        filename varchar(255) not null,
        rawdata longvarbinary not null,
        tipo varchar(255),
        utente_creazione varchar(255) not null,
        utente_ultima_modifica varchar(255),
        uuid varchar(255) not null,
        versione integer,
        primary key (id)
    );

    create table domini (
       id bigint not null,
        deprecato boolean not null,
        descrizione varchar(255),
        id_dominio varchar(255) not null,
        nome varchar(255) not null,
        skip_collaudo boolean not null,
        tag varchar(255),
        url_invocazione varchar(255),
        url_prefix_collaudo varchar(255),
        url_prefix_produzione varchar(255),
        visibilita varchar(255),
        id_soggetto_referente bigint,
        primary key (id)
    );

    create table erogazioni (
       id bigint not null,
        ambiente varchar(255) not null,
        indirizzi_ip varchar(255),
        stato varchar(255) not null,
        url varchar(255),
        id_api bigint,
        primary key (id)
    );

    create table erogazioni_adesioni (
       id_adesione bigint not null,
        id_erogazione bigint not null,
        primary key (id_adesione, id_erogazione)
    );

    create table estensioni_adesioni (
       id bigint not null,
        ambiente varchar(255) not null,
        gruppo varchar(255) not null,
        nome varchar(255) not null,
        valore varchar(255),
        id_adesioni bigint not null,
        id_api bigint,
        id_documento bigint,
        primary key (id)
    );

    create table estensioni_api (
       id bigint not null,
        gruppo varchar(255) not null,
        nome varchar(255) not null,
        valore varchar(255) not null,
        id_api bigint not null,
        primary key (id)
    );

    create table estensioni_client (
       id bigint not null,
        nome varchar(255),
        valore varchar(4000),
        id_client bigint,
        id_documento bigint,
        primary key (id)
    );

    create table gruppi (
       id bigint not null,
        descrizione varchar(255),
        descrizione_sintetica varchar(255),
        alberatura varchar(1000),
        id_gruppo varchar(255) not null,
        nome varchar(255) not null,
        tipo varchar(255) not null,
        id_gruppo_padre bigint,
        id_immagine bigint,
        primary key (id)
    );

    create table gruppi_servizi (
       id_servizio bigint not null,
        id_gruppo bigint not null,
        primary key (id_gruppo, id_servizio)
    );

    create table messaggi_adesioni (
       id bigint not null,
        data timestamp,
        oggetto varchar(255),
        testo varchar(255),
        uuid varchar(255),
        id_adesione bigint,
        id_utente bigint,
        primary key (id)
    );

    create table messaggi_servizi (
       id bigint not null,
        data timestamp,
        oggetto varchar(255),
        testo varchar(255),
        uuid varchar(255),
        id_servizio bigint,
        id_utente bigint,
        primary key (id)
    );

    create table notifiche (
       id bigint not null,
        data timestamp not null,
        id_entita varchar(255) not null,
        id_notifica varchar(255) not null,
        info_messaggio varchar(255),
        info_oggetto varchar(255),
        info_stato varchar(255),
        email_inviata boolean not null,
        ruoli varchar(255),
        stato varchar(255) not null,
        tipo varchar(255) not null,
        tipo_notifica varchar(255) not null,
        id_adesione bigint,
        id_destinatario bigint not null,
        id_mittente bigint not null,
        id_servizio bigint,
        primary key (id)
    );

    create table organizations (
       id bigint not null,
        aderente boolean not null,
        codice_ente varchar(255),
        codice_fiscale_soggetto varchar(255),
        descrizione varchar(255),
        esterna boolean not null,
        id_organizzazione varchar(255) not null,
        id_tipo_utente varchar(255),
        name varchar(255) not null,
        referente boolean not null,
        id_soggetto_default bigint,
        primary key (id)
    );

    create table package_servizi (
       id bigint not null,
        id_package bigint,
        id_servizio bigint,
        primary key (id)
    );

    create table referenti_adesioni (
       id bigint not null,
        tipo varchar(255),
        id_adesione bigint,
        id_referente bigint,
        primary key (id)
    );

    create table referenti_classi (
       id_classe bigint not null,
        id_referente bigint not null,
        primary key (id_classe, id_referente)
    );

    create table referenti_domini (
       id bigint not null,
        tipo varchar(255),
        id_dominio bigint,
        id_referente bigint,
        primary key (id)
    );

    create table referenti_servizi (
       id bigint not null,
        tipo varchar(255),
        id_referente bigint,
        id_servizio bigint,
        primary key (id)
    );

    create table servizi (
       id bigint not null,
        package boolean not null,
        adesione_consentita boolean,
        adesione_disabilitata boolean,
        fruizione boolean not null,
        data_creazione timestamp,
        data_ultima_modifica timestamp,
        descrizione varchar(4000),
        descrizione_sintetica varchar(255),
        id_servizio varchar(255) not null,
        multi_adesione boolean,
        nome varchar(255) not null,
        note varchar(1000),
        skip_collaudo boolean not null,
        stato varchar(255),
        termini_ricerca varchar(255),
        tipo varchar(255) not null,
        url_invocazione varchar(255),
        url_prefix_collaudo varchar(255),
        url_prefix_produzione varchar(255),
        versione varchar(255) not null,
        visibilita varchar(255),
        id_dominio bigint,
        id_immagine bigint,
        id_richiedente bigint,
        id_soggetto_interno bigint,
        id_utente_ultima_modifica bigint,
        primary key (id)
    );

    create table soggetti (
       id bigint not null,
        aderente boolean not null,
        descrizione varchar(255),
        id_soggetto varchar(255) not null,
        nome varchar(255) not null,
        nome_gateway varchar(255),
        referente boolean not null,
        skip_collaudo boolean not null,
        tipo_gateway varchar(255),
        url_invocazione varchar(255),
        url_prefix_collaudo varchar(255),
        url_prefix_produzione varchar(255),
        id_organizzazione bigint,
        primary key (id)
    );

    create table stati_adesione (
       id bigint not null,
        commento varchar(255),
        data timestamp not null,
        stato varchar(255) not null,
        uuid varchar(255) not null,
        id_adesione bigint,
        id_utente bigint,
        primary key (id)
    );

    create table stati_servizio (
       id bigint not null,
        commento varchar(255),
        data timestamp not null,
        stato varchar(255) not null,
        uuid varchar(255) not null,
        id_servizio bigint,
        id_utente bigint,
        primary key (id)
    );

    create table tag_servizi (
       id_servizio bigint not null,
        id_tag bigint not null,
        primary key (id_servizio, id_tag)
    );

    create table tags (
       id bigint not null,
        tag varchar(255) not null,
        primary key (id)
    );

    create table tassonomie (
       id bigint not null,
        descrizione varchar(255),
        id_tassonomia varchar(255) not null,
        nome varchar(255),
        obbligatorio boolean not null,
        visibile boolean not null,
        id_categoria_default bigint,
        id_immagine bigint,
        primary key (id)
    );

    create table utenti (
       id bigint not null,
        cognome varchar(255) not null,
        email varchar(255),
        email_aziendale varchar(255),
        id_utente varchar(255) not null,
        metadati binary(255),
        nome varchar(255) not null,
        note varchar(255),
        principal varchar(255) not null,
        referente_tecnico boolean not null,
        ruoli_notifiche_abilitate varchar(255),
        ruolo varchar(255),
        stato varchar(255) not null,
        telefono varchar(255),
        telefono_aziendale varchar(255),
        tipi_entita_notifiche_abilitate varchar(255),
        tipi_notifiche_abilitate varchar(255),
        id_organizzazione bigint,
        primary key (id)
    );

    create table utenti_classi (
       id_classe bigint not null,
        id_utente bigint not null,
        primary key (id_classe, id_utente)
    );

    alter table organizations 
       add constraint UK_p9pbw3flq9hkay8hdx3ypsldy unique (name);

    alter table soggetti 
       add constraint UK_cvjvc2d0vnadoonri9qpcaoxs unique (nome);

    alter table utenti 
       add constraint UK_83bc9wgqao3ad6r8y5sqxy9lq unique (id_utente);

    alter table utenti 
       add constraint UK_mvje76mmq8p7yyk5329geaucb unique (principal);

    alter table adesioni 
       add constraint FKt6ynph35hpekqnx5dxk27q710 
       foreign key (id_adesione_collaudo) 
       references adesioni;

    alter table adesioni 
       add constraint FKourftcc4ohulh7jxv05u5b8wo 
       foreign key (id_richiedente) 
       references utenti;

    alter table adesioni 
       add constraint FKisqa5b8n02f8s4hxp24yn9hvw 
       foreign key (id_servizio) 
       references servizi;

    alter table adesioni 
       add constraint FKkgd98cqqb0tydxw2arfi5md0q 
       foreign key (id_soggetto) 
       references soggetti;

    alter table adesioni 
       add constraint FK7hgo9mek6cyp0jc8m945nouwi 
       foreign key (id_utente_ultima_modifica) 
       references utenti;

    alter table allegati_api 
       add constraint FKiindawou2u4kwq33ylkd3fm8h 
       foreign key (id_api) 
       references api;

    alter table allegati_api 
       add constraint FKcnxyqvvmqssnw3vp0gw0yydc5 
       foreign key (id_documento) 
       references documenti;

    alter table allegati_messaggi_adesioni 
       add constraint FKgl25j521fe7nlj3n28qsmnk0l 
       foreign key (id_allegato) 
       references documenti;

    alter table allegati_messaggi_adesioni 
       add constraint FKtm2gd9ypeft4ps7tw8ydhkry 
       foreign key (id_messaggio) 
       references messaggi_adesioni;

    alter table allegati_messaggi_servizi 
       add constraint FK8fiq466owrmg0ynx59o826ngv 
       foreign key (id_allegato) 
       references documenti;

    alter table allegati_messaggi_servizi 
       add constraint FKsavmkyllhuhkdwco02qcrcnig 
       foreign key (id_messaggio) 
       references messaggi_servizi;

    alter table allegati_servizi 
       add constraint FKkohp7go404dhlgbbyemg32jv9 
       foreign key (id_documento) 
       references documenti;

    alter table allegati_servizi 
       add constraint FK1ujrerpd8kojg53rqoj9gpqsa 
       foreign key (id_servizio) 
       references servizi;

    alter table api 
       add constraint FKn1cgl7q7fd0pp6gk3jawyevp1 
       foreign key (id_config_collaudo) 
       references api_config;

    alter table api 
       add constraint FKmgywqwkn25vyj3aw04iwg7yc 
       foreign key (id_config_produzione) 
       references api_config;

    alter table api_auth_types 
       add constraint FK3feq3hmg02bg4kuec0m06lpmk 
       foreign key (id_api) 
       references api;

    alter table api_config 
       add constraint FKep29fbf56d7o5hso2yjpu6o4s 
       foreign key (id_specifica) 
       references documenti;

    alter table api_servizi 
       add constraint FKk09k2k9dofipwie7u91o38we3 
       foreign key (id_api) 
       references api;

    alter table api_servizi 
       add constraint FK7f0mx0aeftworal1f1vn0m3as 
       foreign key (id_servizio) 
       references servizi;

    alter table categorie 
       add constraint FKfuxidkrqi5a0aypyim5k6am0y 
       foreign key (id_categoria_padre) 
       references categorie;

    alter table categorie 
       add constraint FKmu4avrtn3m14my6baoc9h7e7v 
       foreign key (id_immagine) 
       references documenti;

    alter table categorie 
       add constraint FKcnwhesbrqg3a5pw78j2takdpw 
       foreign key (id_tassonomia) 
       references tassonomie;

    alter table categorie_servizi 
       add constraint FKq2v3krbnlfs4rh46lgqr4hx59 
       foreign key (id_servizio) 
       references servizi;

    alter table categorie_servizi 
       add constraint FKea10r8lhr0l1ydkupnflfg8k2 
       foreign key (id_categoria) 
       references categorie;

    alter table classi_domini 
       add constraint FKjxwk5mj6ytatytcs1t25iv5d8 
       foreign key (id_classe) 
       references classi;

    alter table classi_domini 
       add constraint FKec0moujsvfq2ck64vlrglcoat 
       foreign key (id_dominio) 
       references domini;

    alter table classi_servizi 
       add constraint FK9g8rmkdvxxb05f306sw480wdd 
       foreign key (id_classe) 
       references classi;

    alter table classi_servizi 
       add constraint FKbeifq20d8g18tg8nkh7jwv2fn 
       foreign key (id_servizio) 
       references servizi;

    alter table client 
       add constraint FKbwlm9ufru09qk0n9b9ps7blse 
       foreign key (id_soggetto) 
       references soggetti;

    alter table client_adesioni 
       add constraint FKmcwfisjojst7fpu9gjea8yquk 
       foreign key (id_adesione) 
       references adesioni;

    alter table client_adesioni 
       add constraint FKk86391fobv5cmynjbieous0ek 
       foreign key (id_client) 
       references client;

    alter table domini 
       add constraint FK221i6p2llolaywqrnwxnujkfm 
       foreign key (id_soggetto_referente) 
       references soggetti;

    alter table erogazioni 
       add constraint FKbw3ig0049jar4yrctpie5qmow 
       foreign key (id_api) 
       references api;

    alter table erogazioni_adesioni 
       add constraint FK1e5dxn5mivdk2n6o6n0gg21k1 
       foreign key (id_erogazione) 
       references erogazioni;

    alter table erogazioni_adesioni 
       add constraint FKexjj6plll8im1md9vdbusgr59 
       foreign key (id_adesione) 
       references adesioni;

    alter table estensioni_adesioni 
       add constraint FK8316l6saodsvogxd2aspj309f 
       foreign key (id_adesioni) 
       references adesioni;

    alter table estensioni_adesioni 
       add constraint FKfv6qoub3c1k95dplv5f7muop4 
       foreign key (id_api) 
       references api;

    alter table estensioni_adesioni 
       add constraint FKel2ldhvv2791e273b7ufnr081 
       foreign key (id_documento) 
       references documenti;

    alter table estensioni_api 
       add constraint FKje060tlr1ap9apeymd3ncxtb0 
       foreign key (id_api) 
       references api;

    alter table estensioni_client 
       add constraint FKilxe9r05e606dj3526d6cgmwl 
       foreign key (id_client) 
       references client;

    alter table estensioni_client 
       add constraint FKfoh9pyvly458hmnb69d1tmaia 
       foreign key (id_documento) 
       references documenti;

    alter table gruppi 
       add constraint FKlihg2xfq9b0uib6eqwf489xx1 
       foreign key (id_gruppo_padre) 
       references gruppi;

    alter table gruppi 
       add constraint FKob0w62l86ruqin2nk6epyuk2i 
       foreign key (id_immagine) 
       references documenti;

    alter table gruppi_servizi 
       add constraint FKoi1543rqinmxbi7xpnm5uoxqj 
       foreign key (id_gruppo) 
       references gruppi;

    alter table gruppi_servizi 
       add constraint FK7525ll7o9btjkm9hafohs8jv0 
       foreign key (id_servizio) 
       references servizi;

    alter table messaggi_adesioni 
       add constraint FKd1xhtwx9quntr56e9vttfaaob 
       foreign key (id_adesione) 
       references adesioni;

    alter table messaggi_adesioni 
       add constraint FKqw4nydau64dt3m9v5aaj42v9q 
       foreign key (id_utente) 
       references utenti;

    alter table messaggi_servizi 
       add constraint FK1aj1w8htchf54os664u8fqa9a 
       foreign key (id_servizio) 
       references servizi;

    alter table messaggi_servizi 
       add constraint FK8q7mt3qodwjs69ntpc4c7byed 
       foreign key (id_utente) 
       references utenti;

    alter table notifiche 
       add constraint FKkvmedpslgssyr97ram87m6ldk 
       foreign key (id_adesione) 
       references adesioni;

    alter table notifiche 
       add constraint FK3tbedfk08tsrwrvqslxjy8unq 
       foreign key (id_destinatario) 
       references utenti;

    alter table notifiche 
       add constraint FKe9f4oebgljwgptqxf3f6j1ybb 
       foreign key (id_mittente) 
       references utenti;

    alter table notifiche 
       add constraint FKeh5blxywnpu3e7uav772ntvtk 
       foreign key (id_servizio) 
       references servizi;

    alter table organizations 
       add constraint FKloimwtc1e7op9g4gnvyjf7pw8 
       foreign key (id_soggetto_default) 
       references soggetti;

    alter table package_servizi 
       add constraint FKh9yhto7q1n5vc7aam8qkymwyl 
       foreign key (id_package) 
       references servizi;

    alter table package_servizi 
       add constraint FKe3ksp404h7rirs670ltrdb0v6 
       foreign key (id_servizio) 
       references servizi;

    alter table referenti_adesioni 
       add constraint FKnvvjthwu6vi77u52bxfc04lmu 
       foreign key (id_adesione) 
       references adesioni;

    alter table referenti_adesioni 
       add constraint FK6ql4k8x82xdbyccj7se1qhyji 
       foreign key (id_referente) 
       references utenti;

    alter table referenti_classi 
       add constraint FK9r2q3kkqpbno216deves7krsv 
       foreign key (id_referente) 
       references utenti;

    alter table referenti_classi 
       add constraint FKd7e42pytly8q6bg8orivotlbq 
       foreign key (id_classe) 
       references classi;

    alter table referenti_domini 
       add constraint FK8pc1jrh2s8wfdvj0g54pbysqs 
       foreign key (id_dominio) 
       references domini;

    alter table referenti_domini 
       add constraint FK6pgchmdbhdjt45kd7w5elkjim 
       foreign key (id_referente) 
       references utenti;

    alter table referenti_servizi 
       add constraint FKnb3clee6lkdgdn2v8ob51w8yq 
       foreign key (id_referente) 
       references utenti;

    alter table referenti_servizi 
       add constraint FKmbrl3cmqnjpo10by0tjl47w6v 
       foreign key (id_servizio) 
       references servizi;

    alter table servizi 
       add constraint FK7q16h5otfqk3mglkqu7pvc3lc 
       foreign key (id_dominio) 
       references domini;

    alter table servizi 
       add constraint FKdxlwouv1h1l1kgn5rri85pln8 
       foreign key (id_immagine) 
       references documenti;

    alter table servizi 
       add constraint FKdse5f8oqiisxvbdxfejlmb6io 
       foreign key (id_richiedente) 
       references utenti;

    alter table servizi 
       add constraint FKm9mrqqw6i7k02sq5cam8gfk7p 
       foreign key (id_soggetto_interno) 
       references soggetti;

    alter table servizi 
       add constraint FKjt71ehed5a4yhdj7me77aoauj 
       foreign key (id_utente_ultima_modifica) 
       references utenti;

    alter table soggetti 
       add constraint FK4pof958g22ndf8gfkxdjcw3i7 
       foreign key (id_organizzazione) 
       references organizations;

    alter table stati_adesione 
       add constraint FKpyodgfo2voxlujhw1fbikvyne 
       foreign key (id_adesione) 
       references adesioni;

    alter table stati_adesione 
       add constraint FKg6a61so6v6s1sau9bhy2h4yj5 
       foreign key (id_utente) 
       references utenti;

    alter table stati_servizio 
       add constraint FK2iyph5sxn9esbp2yvu6f46ikm 
       foreign key (id_servizio) 
       references servizi;

    alter table stati_servizio 
       add constraint FKe4nr6931uans02ns3d1wecse2 
       foreign key (id_utente) 
       references utenti;

    alter table tag_servizi 
       add constraint FKkbtv2kae0hqx5exsm2uk1ph1m 
       foreign key (id_tag) 
       references tags;

    alter table tag_servizi 
       add constraint FKnofiepfwm56l3dbdejyvmi7tr 
       foreign key (id_servizio) 
       references servizi;

    alter table tassonomie 
       add constraint FKodc756lpntxuwu98x8lxah89h 
       foreign key (id_categoria_default) 
       references categorie;

    alter table tassonomie 
       add constraint FKbk99ff4rin2f2yfpdp3v1qa8v 
       foreign key (id_immagine) 
       references documenti;

    alter table utenti 
       add constraint FKtk0f93l8dh542beuq067og47g 
       foreign key (id_organizzazione) 
       references organizations;

    alter table utenti_classi 
       add constraint FKex0k12m8toic1bro46sxs96d7 
       foreign key (id_utente) 
       references utenti;

    alter table utenti_classi 
       add constraint FKigj8vdmpm1oxa225kimvega7v 
       foreign key (id_classe) 
       references classi;
