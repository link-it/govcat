create sequence seq_domini_profili start with 1 increment by 1;
create sequence seq_profili start with 1 increment by 1;
create sequence seq_soggetti_profili start with 1 increment by 1;

    create table domini_profili (
       id bigint not null,
        id_dominio bigint,
        id_profilo bigint,
        primary key (id)
    );

    create table profili (
       id bigint not null,
        auth_type varchar(255) not null,
        canale_default varchar(255),
        codice_interno varchar(255) not null,
        codice_token_policy varchar(255),
        compatibilita varchar(255),
        etichetta varchar(255) not null,
        id_profilo binary not null,
        profilo_govway varchar(255),
        tipo_dominio varchar(255),
        primary key (id)
    );

    create table soggetti_profili (
       id bigint not null,
        id_profilo bigint,
        id_soggetto bigint,
        primary key (id)
    );

    alter table domini_profili
       add constraint UKecvfpulrjx1prnhmwgju48nb7 unique (id_dominio, id_profilo);

    alter table profili
       add constraint UK_q2rxjy3nwchjas7be857uuwap unique (codice_interno);

    alter table profili
       add constraint UK_t19j823sjhtnpfe8083p31ipn unique (id_profilo);

    alter table soggetti_profili
       add constraint UKlg1rwa7jti33bpjmhf6senvnl unique (id_soggetto, id_profilo);

    alter table domini_profili
       add constraint FKot6y30ccml4c75gljs8rui53
       foreign key (id_dominio)
       references domini;

    alter table domini_profili
       add constraint FK4yndokl5lnpwohu95f6q20vh3
       foreign key (id_profilo)
       references profili;

    alter table soggetti_profili
       add constraint FKpb93gpqj0ardu5p8qgp4esl0v
       foreign key (id_profilo)
       references profili;

    alter table soggetti_profili
       add constraint FK3s0rnk9pineqsnve62smy6sy
       foreign key (id_soggetto)
       references soggetti;