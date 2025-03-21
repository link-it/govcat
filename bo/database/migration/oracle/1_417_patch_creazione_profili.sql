create sequence seq_domini_profili start with 1 increment by  1;
create sequence seq_profili start with 1 increment by  1;
create sequence seq_soggetti_profili start with 1 increment by  1;

    create table domini_profili (
       id number(19,0) not null,
        id_dominio number(19,0),
        id_profilo number(19,0),
        primary key (id)
    );

    create table profili (
       id number(19,0) not null,
        auth_type varchar2(255 char) not null,
        canale_default varchar2(255 char),
        codice_interno varchar2(255 char) not null,
        codice_token_policy varchar2(255 char),
        compatibilita varchar2(255 char),
        etichetta varchar2(255 char) not null,
        id_profilo raw(255) not null,
        profilo_govway varchar2(255 char),
        tipo_dominio varchar2(255 char),
        primary key (id)
    );

    create table soggetti_profili (
       id number(19,0) not null,
        id_profilo number(19,0),
        id_soggetto number(19,0),
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