<template>
    <fragment>
        <h3>{{ $t('BILLING.COST_MANAGEMENT.DASHBOARD.CREATE.TEMPLATE.FILTER') }}</h3>
        <p-check-box v-model="includesFilter" :disabled="!isDashboardTemplate">
            {{ $t('BILLING.COST_MANAGEMENT.DASHBOARD.CREATE.TEMPLATE.APPLIED_FILTER') }}
        </p-check-box>
        <p-button size="sm" style-type="gray-border"
                  :disabled="!isDashboardTemplate"
                  class="ml-2"
                  @click="handleClickFilterButton"
        >
            {{ $t('BILLING.COST_MANAGEMENT.DASHBOARD.CREATE.TEMPLATE.VIEW_FILTER') }}
        </p-button>
        <view-filter-modal :visible.sync="defaultFilterModalVisible"
                           :selected-filters="defaultFilter"
        />
    </fragment>
</template>

<script lang="ts">
import { computed, reactive, toRefs } from '@vue/composition-api';

import {
    PButton, PCheckBox,
} from '@spaceone/design-system';
import { has } from 'lodash';

import ViewFilterModal from '@/services/cost-explorer/cost-dashboard/modules/ViewFilterModal.vue';
import { costExplorerStore } from '@/services/cost-explorer/store';

export default {
    name: 'CostDashboardCreateDefaultFilter',
    components: {
        ViewFilterModal,
        PCheckBox,
        PButton,
    },

    setup() {
        const state = reactive({
            includesFilter: computed({
                get() {
                    return costExplorerStore.state.dashboard.includesFilter ?? false;
                },
                set(value) {
                    costExplorerStore.commit('dashboard/setIncludesFilter', value);
                },
            }),
            defaultFilterModalVisible: false,
            defaultFilter: computed(() => costExplorerStore.state.dashboard.defaultFilter ?? {}),
            isDashboardTemplate: computed(() => has(costExplorerStore.state.dashboard.selectedTemplate, 'public_dashboard_id')
                || has(costExplorerStore.state.dashboard.selectedTemplate, 'user_dashboard_id')),
        });

        const handleClickFilterButton = () => {
            state.defaultFilterModalVisible = true;
        };

        return {
            ...toRefs(state),
            handleClickFilterButton,
        };
    },
};
</script>
