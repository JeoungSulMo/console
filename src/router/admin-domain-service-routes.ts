import type { RouteConfig } from 'vue-router';

import { errorRoutes } from '@/router/error-routes';

import { ADMINISTRATION_ROUTE } from '@/services/administration/route-config';
import administrationRoute from '@/services/administration/routes';
import authRoutes from '@/services/auth/routes';

const TotalDashboardPage = () => import(/* webpackChunkName: "TotalDashboardPage" */ '@/services/total-dashboard/TotalDashboardPage.vue');


const ROOT_DOMAIN_ROUTE = Object.freeze({
    _NAME: 'root',
    DASHBOARD: { _NAME: 'dashboard' },
    IDENTITY: {
        _NAME: ADMINISTRATION_ROUTE._NAME,
        USER: ADMINISTRATION_ROUTE.IAM.USER,
    },
});


export const adminDomainServiceRoutes: RouteConfig[] = [
    ...authRoutes,
    {
        path: '/',
        name: ROOT_DOMAIN_ROUTE._NAME,
        redirect: '/dashboard',
        component: { template: '<router-view />' },
        children: [
            {
                path: 'dashboard',
                name: ROOT_DOMAIN_ROUTE.DASHBOARD._NAME,
                component: TotalDashboardPage,
            },
            administrationRoute,
        ] as RouteConfig[],
    },
    ...errorRoutes,
];
