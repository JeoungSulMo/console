<template>
    <section>
        <p-page-title
            :title="$t('IAM.POLICY.POLICY')"
            use-total-count
            :total-count="totalCount"
        >
            <template #extra>
                <router-link :to="{name: ADMINISTRATION_ROUTE.IAM.POLICY.CREATE._NAME}">
                    <p-button style-type="primary-dark"
                              name="ic_plus_bold"
                              :disabled="!hasManagePermission"
                    >
                        {{ $t('PLUGIN.COLLECTOR.MAIN.CREATE') }}
                    </p-button>
                </router-link>
            </template>
        </p-page-title>
        <policy-list-data-table :anchor-icon-visible="false" />
    </section>
</template>

<script lang="ts">
import {
    computed, reactive, toRefs,
} from '@vue/composition-api';

import { PPageTitle, PButton } from '@spaceone/design-system';

import { useManagePermissionState } from '@/common/composables/page-manage-permission';

import PolicyListDataTable from '@/services/administration/modules/PolicyListDataTable.vue';
import { ADMINISTRATION_ROUTE } from '@/services/administration/route-config';
import { administrationStore } from '@/services/administration/store';

export default {
    name: 'PolicyPage',
    components: {
        PPageTitle,
        PButton,
        PolicyListDataTable,
    },
    setup() {
        const state = reactive({
            totalCount: computed(() => administrationStore.state.policy.totalCount),
            hasManagePermission: useManagePermissionState(),
        });

        return {
            ...toRefs(state),
            ADMINISTRATION_ROUTE,
        };
    },
};
</script>
