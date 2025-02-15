<template>
    <div class="existing-dashboard">
        <p-divider />
        <h3>{{ $t('BILLING.COST_MANAGEMENT.DASHBOARD.CREATE.TEMPLATE.EXISTING_DASHBOARD') }}</h3>
        <div class="dashboard-list">
            <div v-for="(dashboardData, idx) in slicedDashboardData" :key="`$dashboard-${idx}-${getUUID()}`"
                 class="dashboard-item"
            >
                <p-select-card
                    :selected="selectedTemplate"
                    :value="dashboardData"
                    block
                    @change="handleDashboardChange"
                >
                    {{ dashboardData.name }}
                </p-select-card>
                <p-anchor
                    target="_blank"
                    :to=" { name: COST_EXPLORER_ROUTE.DASHBOARD._NAME,
                            params: { dashboardId: dashboardData.public_dashboard_id ? dashboardData.public_dashboard_id : dashboardData.user_dashboard_id } }"
                >
                    {{ $t('BILLING.COST_MANAGEMENT.DASHBOARD.CREATE.TEMPLATE.VIEW') }}
                </p-anchor>
            </div>
        </div>
        <p-text-pagination
            :this-page.sync="thisPage"
            :all-page="allPage"
            @pageChange="listDashboard"
        />
    </div>
</template>

<script lang="ts">
import { computed, reactive, toRefs } from '@vue/composition-api';

import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import {
    PAnchor, PSelectCard, PDivider, PTextPagination,
} from '@spaceone/design-system';

import { store } from '@/store';

import { getUUID } from '@/lib/component-util/getUUID';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { defaultLayoutData } from '@/services/cost-explorer/cost-dashboard/lib/config';
import type {
    DashboardInfo,
    PublicDashboardInfo,
    UserDashboardInfo,
} from '@/services/cost-explorer/cost-dashboard/type';
import { COST_EXPLORER_ROUTE } from '@/services/cost-explorer/route-config';
import { costExplorerStore } from '@/services/cost-explorer/store';

const PAGE_SIZE = 8;

export default {
    name: 'CostDashboardCreateWithDashboard',
    components: {
        PSelectCard,
        PAnchor,
        PTextPagination,
        PDivider,
    },

    setup() {
        const state = reactive({
            existingDashboardData: [] as Partial<DashboardInfo>[],
            slicedDashboardData: computed<Partial<DashboardInfo>[]>(() => {
                const startIndex = (state.thisPage * PAGE_SIZE) - PAGE_SIZE;
                const endIndex = state.thisPage * PAGE_SIZE;
                return state.existingDashboardData.slice(startIndex, endIndex);
            }),
            selectedTemplate: computed(() => costExplorerStore.state.dashboard.selectedTemplate),
            // pagination
            totalCount: 0,
            allPage: computed(() => Math.ceil(state.totalCount / PAGE_SIZE) || 1),
            thisPage: 1,
            userId: computed(() => store.state.user.userId),
        });

        const handleDashboardChange = (value: Partial<DashboardInfo>) => {
            costExplorerStore.commit('dashboard/setDashboardTemplate', value);
            costExplorerStore.commit('dashboard/setDefaultFilter', value.default_filter);
        };

        const listDashboard = async () => {
            try {
                const publicDashboardList = await SpaceConnector.client.costAnalysis.publicDashboard.list();
                const userDashboardList = await SpaceConnector.client.costAnalysis.userDashboard.list({
                    user_id: state.userId,
                });
                const dashboardList = [...publicDashboardList.results as PublicDashboardInfo[], ...userDashboardList.results as UserDashboardInfo[]];
                state.existingDashboardData = dashboardList.map(d => ({
                    ...d,
                    custom_layouts: d.custom_layouts,
                    default_filter: d.default_filter,
                    default_layout_id: d.default_layout_id,
                    name: d.name,
                }) as Partial<DashboardInfo>);
                state.totalCount = state.existingDashboardData.length ?? 0;
            } catch (e) {
                ErrorHandler.handleError(e);
                state.existingDashboardData = [];
            }
        };
        listDashboard();

        return {
            COST_EXPLORER_ROUTE,
            ...toRefs(state),
            defaultLayoutData,
            handleDashboardChange,
            getUUID,
            listDashboard,
        };
    },
};
</script>
<style lang="postcss" scoped>
.existing-dashboard {
    @apply flex flex-col;
    .p-divider {
        @apply w-full mb-6;
    }
    .dashboard-list {
        .dashboard-item {
            @apply flex flex-col justify-between row-gap-2 mb-4;
            .p-select-card {
                @apply flex-grow;
            }
            .p-anchor {
                @apply text-center text-blue-700;
            }
        }
    }
    .text-pagination {
        @apply ml-auto mr-auto;
    }
}
</style>
