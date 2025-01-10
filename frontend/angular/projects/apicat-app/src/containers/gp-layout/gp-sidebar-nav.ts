export interface INavAttributes {
    [propName: string]: any;
}

export interface INavBadge {
    text: string;
    variant: string;
    class?: string;
}

export interface INavLabel {
    class?: string;
    variant: string;
}

export interface INavData {
    label?: string;
    path?: string;
    url?: string | any[];
    href?: string;
    icon?: string;
    iconBs?: string;
    image?: string;
    title?: boolean;
    divider?: boolean;
    class?: string;
    attributes?: INavAttributes;
    permission?: string;
    children?: INavData[];
    expanded?: boolean;
    counter?: string;
}
