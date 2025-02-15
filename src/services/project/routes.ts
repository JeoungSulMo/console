import type { RouteConfig } from 'vue-router';

import { ACCESS_LEVEL } from '@/lib/access-control/config';
import { MENU_ID } from '@/lib/menu/config';

import { PROJECT_ROUTE } from '@/services/project/route-config';

const ProjectPage = () => import(/* webpackChunkName: "ProjectPage" */ '@/services/project/ProjectPage.vue');
const ProjectDetailPage = () => import(/* webpackChunkName: "ProjectDetailPage" */ '@/services/project/project-detail/ProjectDetailPage.vue');

const ProjectDashboardPage = () => import(/* webpackChunkName: "ProjectDashboardPage" */ '@/services/project/project-detail/project-summary/ProjectSummaryPage.vue');
const ProjectMemberPage = () => import(/* webpackChunkName: "ProjectMemberPage" */ '@/services/project/project-detail/project-member/ProjectMemberPage.vue');
const ProjectAlertPage = () => import(/* webpackChunkName: "ProjectAlertPage" */ '@/services/project/project-detail/project-alert/ProjectAlertPage.vue');
const ProjectNotificationsPage = () => import(/* webpackChunkName: "ProjectNotificationsPage" */ '@/services/project/project-detail/project-notification/ProjectNotificationPage.vue');
const ProjectTagPage = () => import(/* webpackChunkName: "ProjectTagPage" */ '@/services/project/project-detail/project-tag/ProjectTagPage.vue');
// eslint-disable-next-line max-len
const ProjectAlertEventRulePage = () => import(/* webpackChunkName: "ProjectAlertEventRulePage" */ '@/services/project/project-detail/project-alert/project-alert-event-rule/ProjectAlertEventRulePage.vue');
const AddNotificationPage = () => import(/* webpackChunkName: "AddNotificationPage" */ '@/services/notification/notification-add/NotificationAddPage.vue');

const ProjectAlertListPage = () => import(/* webpackChunkName: "ProjectAlertListPage" */ '@/services/project/project-detail/project-alert/project-alert-list/ProjectAlertListPage.vue');
// eslint-disable-next-line max-len
const ProjectMaintenanceWindowPage = () => import(/* webpackChunkName: "ProjectMaintenanceWindowPage" */ '@/services/project/project-detail/project-alert/project-maintenance-window/ProjectMaintenanceWindowPage.vue');
const ProjectWebhookPage = () => import(/* webpackChunkName: "ProjectWebhookPage" */ '@/services/project/project-detail/project-alert/project-webhook/ProjectWebhookPage.vue');
const ProjectAlertSettingsPage = () => import(/* webpackChunkName: "ProjectAlertSettingsPage" */ '@/services/project/project-detail/project-alert/project-alert-settings/ProjectAlertSettingsPage.vue');

export default {
    path: 'project',
    meta: { menuId: MENU_ID.PROJECT },
    component: { template: '<router-view />' },
    children: [
        {
            path: '/',
            name: PROJECT_ROUTE._NAME,
            meta: { accessLevel: ACCESS_LEVEL.VIEW_PERMISSION },
            props: true,
            component: ProjectPage,
        },
        {
            path: ':id',
            name: PROJECT_ROUTE.DETAIL._NAME,
            meta: { accessLevel: ACCESS_LEVEL.VIEW_PERMISSION },
            redirect: ':id/summary',
            props: true,
            component: { template: '<keep-alive><router-view /></keep-alive>' },
            children: [
                {
                    path: '/',
                    name: PROJECT_ROUTE.DETAIL.TAB._NAME,
                    redirect: 'summary',
                    props: true,
                    component: ProjectDetailPage,
                    children: [
                        {
                            path: 'summary',
                            name: PROJECT_ROUTE.DETAIL.TAB.SUMMARY._NAME,
                            props: true,
                            component: ProjectDashboardPage,
                        },
                        {
                            path: 'member',
                            name: PROJECT_ROUTE.DETAIL.TAB.MEMBER._NAME,
                            props: true,
                            component: ProjectMemberPage,
                        },
                        {
                            path: 'alert',
                            name: PROJECT_ROUTE.DETAIL.TAB.ALERT._NAME,
                            redirect: 'alert/alert',
                            props: true,
                            component: ProjectAlertPage,
                            children: [
                                {
                                    path: 'alert',
                                    name: PROJECT_ROUTE.DETAIL.TAB.ALERT.ALERT._NAME,
                                    props: true,
                                    component: ProjectAlertListPage,
                                },
                                {
                                    path: 'maintenance-window',
                                    name: PROJECT_ROUTE.DETAIL.TAB.ALERT.MAINTENANCE_WINDOW._NAME,
                                    props: true,
                                    component: ProjectMaintenanceWindowPage,
                                },
                                {
                                    path: 'webhook',
                                    name: PROJECT_ROUTE.DETAIL.TAB.ALERT.WEBHOOK._NAME,
                                    props: true,
                                    component: ProjectWebhookPage,
                                },
                                {
                                    path: 'settings',
                                    name: PROJECT_ROUTE.DETAIL.TAB.ALERT.SETTINGS._NAME,
                                    props: true,
                                    component: ProjectAlertSettingsPage,
                                },
                            ],
                        },
                        {
                            path: 'notification',
                            name: PROJECT_ROUTE.DETAIL.TAB.NOTIFICATIONS._NAME,
                            props: true,
                            component: ProjectNotificationsPage,
                        },
                        {
                            path: 'tag',
                            name: PROJECT_ROUTE.DETAIL.TAB.TAG._NAME,
                            props: true,
                            component: ProjectTagPage,
                        },
                        {
                            path: '*',
                            redirect: 'summary',
                        },
                    ],
                },
                {
                    path: 'event-rule',
                    name: PROJECT_ROUTE.DETAIL.EVENT_RULE._NAME,
                    props: route => ({ projectId: route.params.id }),
                    component: ProjectAlertEventRulePage,
                },
                {
                    path: 'notification/:protocol/:protocolId/:userId',
                    name: PROJECT_ROUTE.DETAIL.TAB.NOTIFICATIONS.ADD._NAME,
                    component: AddNotificationPage,
                    props: true,
                },
            ],
        },
    ],
} as RouteConfig;
