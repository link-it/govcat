import { INavData } from './gp-sidebar-nav';

export const navItemsMainMenu: INavData[] = [
  {
    title: true,
    label: 'APP.MENU.Services',
    path: 'servizi|servizi-generici',
    url: '/servizi',
    iconBs: 'grid-3x3-gap',
    permission: 'SERVICES',
    attributes: { disabled: false },
    children: [
      {
        label: 'APP.MENU.ServicesApi',
        path: 'servizi',
        url: '/servizi',
        icon: 'servizi',
        permission: 'DASHSERVICESBOARD',
        attributes: { disabled: false }
      },
      {
        label: 'APP.MENU.GenericServices',
        path: 'servizi-generici',
        url: '/servizi-generici',
        icon: 'servizi',
        permission: 'DASHSERVICESBOARD',
        attributes: { disabled: false }
      },
    ]
  },
  {
    title: true,
    label: 'APP.MENU.Subscriptions',
    path: 'adesioni',
    url: '/adesioni',
    iconBs: 'display',
    permission: 'MEMBERSHIPS',
    attributes: { disabled: false }
  }
];

export const navNotificationsMenu: INavData[] = [
  {
    title: true,
    label: 'APP.MENU.Notifications',
    path: 'notifications',
    url: '/notifications',
    icon: 'inbox',
    permission: 'NOTIFICATIONS',
    attributes: { disabled: false },
    counter: 'notifications'
  }
];

export const navItemsAdministratorMenu: INavData[] = [
  {
    path: 'empty',
    divider: true,
    label: 'APP.MENU.Empty'
  },
  {
    title: true,
    label: 'APP.MENU.Configurations',
    path: 'dashboard|gruppi|domini|client|soggetti|organizzazioni|utenti|classi-utente|pdnd|tassonomie',
    url: '/gruppi',
    iconBs: 'gear',
    permission: 'ADMINISTRATOR',
    children: [
      {
        label: 'APP.MENU.Dashboard',
        path: 'dashboard',
        url: '/dashboard',
        icon: 'dashboard',
        permission: 'DASHBOARD',
        attributes: { disabled: false }
      },
      {
        label: 'APP.MENU.Groups',
        path: 'gruppi',
        url: '/gruppi',
        icon: 'persons',
        permission: 'GROUPS',
        attributes: { disabled: false }
      },
      {
        label: 'APP.MENU.Domains',
        path: 'domini',
        url: '/domini',
        icon: 'domains',
        permission: 'DOMAINS',
        attributes: { disabled: false }
      },
      {
        label: 'APP.MENU.Subjects',
        path: 'soggetti',
        url: '/soggetti',
        iconBs: 'display',
        permission: 'SUBJECTS',
        attributes: { disabled: false }
      },
      {
        label: 'APP.MENU.Organizations',
        path: 'organizzazioni',
        url: '/organizzazioni',
        icon: 'organizations',
        permission: 'ORGANIZATIONS',
        attributes: { disabled: false }
      },
      {
        label: 'APP.MENU.Clients',
        path: 'client',
        url: '/client',
        icon: 'person',
        permission: 'CLIENTS',
        attributes: { disabled: false }
      },
      {
        label: 'APP.MENU.Users',
        path: 'utenti',
        url: '/utenti',
        icon: 'card_meusersmbership',
        permission: 'USERS',
        attributes: { disabled: false }
      },
      {
        label: 'APP.MENU.UserClasses',
        path: 'classi-utente',
        url: '/classi-utente',
        icon: 'classi-utente',
        permission: 'USER-CLASSES',
        attributes: { disabled: false }
      },
      {
        label: 'APP.MENU.Taxonomies',
        path: 'tassonomie',
        url: '/tassonomie',
        icon: 'taxonomies',
        permission: 'TAXONOMIES',
        attributes: { disabled: false }
      },
      {
        label: 'APP.MENU.Pdnd',
        path: 'pdnd',
        url: '/pdnd',
        icon: 'pdmd',
        permission: 'PDND',
        attributes: { disabled: false }
      },
      // {
      //   label: 'APP.MENU.Taxonomies',
      //   path: 'taxonomies',
      //   url: '/taxonomies',
      //   icon: 'taxonomies',
      //   permission: 'TAXONOMIES',
      //   attributes: { disabled: false }
      // }
    ]
  }
];
