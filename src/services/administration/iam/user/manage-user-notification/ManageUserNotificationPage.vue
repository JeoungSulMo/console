<template>
    <div class="manage-notification-page">
        <p-breadcrumbs class="flex-grow" :routes="routeState.routes" />
        <p-page-title child :title="$t('IDENTITY.USER.MAIN.NOTIFICATION')"
                      @goBack="goToUserManagement"
        />
        <notification-channel-list :manage-disabled="!isManageable" />
    </div>
</template>

<script lang="ts">
import type { ComponentRenderProxy } from '@vue/composition-api';
import {
    computed, getCurrentInstance, reactive, toRefs,
} from '@vue/composition-api';

import { PBreadcrumbs, PPageTitle } from '@spaceone/design-system';

import { store } from '@/store';
import { i18n } from '@/translations';

import { ADMINISTRATION_ROUTE } from '@/services/administration/route-config';
import NotificationChannelList from '@/services/notification/modules/NotificationChannelList.vue';

export default {
    name: 'ManageNotificationPage',
    components: {
        NotificationChannelList, PBreadcrumbs, PPageTitle,
    },
    setup() {
        const vm = getCurrentInstance()?.proxy as ComponentRenderProxy;
        const state = reactive({
            isManageable: computed(() => store.getters['user/isDomainOwner'] || store.getters['user/hasDomainRole']),
        });
        const routeState = reactive({
            routes: computed(() => ([
                { name: 'Administration', to: { name: ADMINISTRATION_ROUTE._NAME } },
                { name: 'IAM', to: { name: ADMINISTRATION_ROUTE.IAM._NAME } },
                { name: 'User Management', to: { name: ADMINISTRATION_ROUTE.IAM.USER._NAME } },
                { name: i18n.t('IDENTITY.USER.NOTIFICATION.MANAGE_CHANNEL') },
            ])),
        });
        const goToUserManagement = () => {
            vm.$router.push({ name: ADMINISTRATION_ROUTE.IAM.USER._NAME });
        };
        return {
            ...toRefs(state),
            routeState,
            goToUserManagement,
        };
    },
};
</script>
