<template>
    <div class="project-alert">
        <alert-data-table
            :project-id="id"
            :alert-state="alertState"
            :urgency="urgency"
            :assigned="assigned"
            :filters="filters"
            :manage-disabled="!hasManagePermission"
            keep-alive
            @update="onUpdateTable"
            @change-list="onChangeList"
        />
    </div>
</template>

<script lang="ts">
import type { ComponentRenderProxy } from '@vue/composition-api';
import {
    getCurrentInstance,
    onActivated, reactive, toRefs,
} from '@vue/composition-api';

import { QueryHelper } from '@spaceone/console-core-lib/query';

import { store } from '@/store';

import { useManagePermissionState } from '@/common/composables/page-manage-permission';

import AlertDataTable from '@/services/alert-manager/alert/modules/AlertDataTable.vue';
import { ALERT_STATE_FILTER, ALERT_URGENCY, ASSIGNED_STATE } from '@/services/alert-manager/lib/config';
import type { AlertListPageUrlQuery, AlertListTableFilters } from '@/services/alert-manager/type';

export default {
    name: 'ProjectAlertListPage',
    components: {
        AlertDataTable,
    },
    props: {
        id: {
            type: String,
            default: '',
        },
    },
    setup() {
        const vm = getCurrentInstance()?.proxy as ComponentRenderProxy;
        const tagQueryHelper = new QueryHelper().setFiltersAsRawQueryString(vm.$route.query.filters);
        const state = reactive({
            alertState: vm.$route.query.state ?? ALERT_STATE_FILTER.OPEN,
            urgency: vm.$route.query.urgency ?? ALERT_URGENCY.ALL,
            assigned: vm.$route.query.assigned ?? ASSIGNED_STATE.ALL,
            filters: tagQueryHelper.filters,
            hasManagePermission: useManagePermissionState(),
        });

        /* util */
        const replaceAlertListPageUrlQuery = (query: AlertListPageUrlQuery) => {
            vm.$router.replace({
                query: {
                    ...vm.$route.query,
                    ...query,
                },
            }).catch(() => {});
        };
        const onUpdateTable = (changed: Partial<AlertListTableFilters>) => {
            const query: AlertListPageUrlQuery = {};
            if (changed.state) {
                state.alertState = changed.state;
                query.state = changed.state;
            }
            if (changed.urgency) {
                state.urgency = changed.urgency;
                query.urgency = changed.urgency;
            }
            if (changed.assigned) {
                state.assigned = changed.assigned;
                query.assigned = changed.assigned;
            }
            if (changed.filters) {
                tagQueryHelper.setFilters(changed.filters);
                query.filters = tagQueryHelper.rawQueryStrings;
            }
            replaceAlertListPageUrlQuery(query);
        };

        const onChangeList = () => {
            store.dispatch('service/projectDetail/getAlertCounts');
        };

        onActivated(() => {
            state.alertState = vm.$route.query.state ?? ALERT_STATE_FILTER.OPEN;
            state.urgency = vm.$route.query.urgency ?? ALERT_URGENCY.ALL;
            state.assigned = vm.$route.query.assigned ?? ASSIGNED_STATE.ALL;
            state.filters = tagQueryHelper.setFiltersAsRawQueryString(vm.$route.query.filters).filters;
        });

        return {
            ...toRefs(state),
            onUpdateTable,
            onChangeList,
        };
    },
};
</script>

<style lang="postcss" scoped>
.project-alert::v-deep {
    .p-toolbox-table {
        @apply border-0;
        .p-data-table {
            th:nth-child(8), td:nth-child(8) {
                @apply hidden;
            }
        }
    }
}
</style>
