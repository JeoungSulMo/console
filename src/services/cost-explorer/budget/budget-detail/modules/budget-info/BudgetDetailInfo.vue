<template>
    <section class="budget-detail-summary">
        <p-pane-layout class="summary-card">
            <span v-if="!loading" class="summary-title">
                {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.AMOUNT_PLANNING_TYPE') }} <span class="font-normal">({{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.PERIOD') }})</span>
            </span>
            <div v-if="!loading" class="flex justify-between">
                <p v-if="budgetData.time_unit === BUDGET_TIME_UNIT.TOTAL" class="summary-content">
                    <b>{{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.TOTAL_AMOUNT') }}</b> ({{ budgetData.start }} ~ {{ budgetData.end }})
                </p>
                <p v-else class="summary-content">
                    <b>{{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MONTHLY_PLANNING') }}</b> ({{ budgetData.start }} ~ {{ budgetData.end }})
                </p>
                <amount-planning-type-popover class="summary-content" :budget-data="budgetData">
                    <span class="view-all">{{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.DETAILS') }}</span>
                </amount-planning-type-popover>
            </div>
        </p-pane-layout>
        <p-pane-layout class="summary-card">
            <span class="summary-title">{{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.TARGET') }}</span>
            <p v-if="!loading" class="summary-content">
                <p-anchor v-if="budgetData.project_group_id || budgetData.project_id"
                          :to="referenceRouter(
                              (budgetData.project_id || budgetData.project_group_id),
                              { resource_type: budgetData.project_id ? 'identity.Project' : 'identity.ProjectGroup' })"
                >
                    {{ getTargetLabel(projects) }}
                </p-anchor>
            </p>
        </p-pane-layout>
        <p-pane-layout class="summary-card">
            <span class="summary-title">{{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.COST_TYPE') }}
                <span v-if="!loading" class="text-gray-900 font-normal">{{ costTypeMap[costTypeKey] }}</span>
            </span>
            <p v-if="!loading" class="summary-content cost-type">
                <span class="cost-type-content">{{ processedCostTypeValue }}</span>
                <budget-cost-type-popover
                    :cost-type-key="costTypeKey"
                    :cost-type-value="processedCostTypeValue"
                >
                    <span class="view-all">{{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.VIEW_ALL') }}</span>
                </budget-cost-type-popover>
            </p>
        </p-pane-layout>
    </section>
</template>

<script lang="ts">
import { computed, reactive, toRefs } from '@vue/composition-api';

import { PPaneLayout, PAnchor } from '@spaceone/design-system';

import { store } from '@/store';

import { CURRENCY } from '@/store/modules/display/config';
import type { ProjectReferenceMap } from '@/store/modules/reference/project/type';

import { currencyMoneyFormatter } from '@/lib/helper/currency-helper';
import { referenceRouter } from '@/lib/reference/referenceRouter';

import AmountPlanningTypePopover
    from '@/services/cost-explorer/budget/budget-detail/modules/budget-info/AmountPlanningTypePopover.vue';
import BudgetCostTypePopover
    from '@/services/cost-explorer/budget/budget-detail/modules/budget-info/BudgetCostTypePopover.vue';
import type { BudgetData, CostType } from '@/services/cost-explorer/budget/type';
import {
    BUDGET_TIME_UNIT,
} from '@/services/cost-explorer/budget/type';
import { costExplorerStore } from '@/services/cost-explorer/store';

const getKeyOfCostType = (costType: Record<CostType, string[]|null>) => Object.keys(costType).filter(k => (costType[k] !== null))[0];
const getValueOfCostType = (costType: Record<CostType, string[]|null>, costTypeKey: string) => costType[costTypeKey];

const costTypeMap = {
    region_code: 'Region',
    service_account_id: 'Service Account',
    provider: 'Provider',
    product: 'Product',
};

export default {
    name: 'BudgetDetailInfo',
    components: {
        AmountPlanningTypePopover,
        BudgetCostTypePopover,
        PPaneLayout,
        PAnchor,
    },
    props: {
        currency: {
            type: String,
            default: CURRENCY.USD,
        },
        currencyRates: {
            type: Object,
            default: () => ({}),
        },
    },
    setup() {
        const state = reactive({
            projects: computed<ProjectReferenceMap>(() => store.getters['reference/projectItems']),
            projectGroups: computed(() => store.state.reference.projectGroup.items),
            budgetData: computed<Partial<BudgetData>|null>(() => costExplorerStore.state.budget.budgetData),
            costTypeKey: computed(() => (state.budgetData ? getKeyOfCostType(state.budgetData.cost_types ?? {}) : '')),
            costTypeValue: computed(() => (state.budgetData ? getValueOfCostType(state.budgetData.cost_types ?? {}, state.costTypeKey) : [])),
            processedCostTypeValue: computed(() => state.costTypeValue?.join(', ') || 'All'),
            buttonRef: null as HTMLElement | null,
            balloonVisible: false,
            loading: computed(() => costExplorerStore.getters['budget/isBudgetLoading']),
        });

        const handleClickViewAll = () => {
            state.balloonVisible = true;
        };

        const getTargetLabel = (projects: ProjectReferenceMap) => {
            if (state.budgetData?.project_id) return projects[state.budgetData.project_id]?.label ?? '';
            if (state.budgetData?.project_group_id) return state.projectGroups[state.budgetData.project_group_id]?.label ?? '';
            return 'No Item';
        };


        // LOAD REFERENCE STORE
        (async () => {
            await Promise.allSettled([
                store.dispatch('reference/project/load'),
                store.dispatch('reference/projectGroup/load'),
            ]);
        })();

        return {
            ...toRefs(state),
            referenceRouter,
            handleClickViewAll,
            currencyMoneyFormatter,
            getTargetLabel,
            costTypeMap,
            BUDGET_TIME_UNIT,
        };
    },
};
</script>

<style lang="postcss" scoped>
.budget-detail-summary {
    @apply flex;
    column-gap: 1rem;
    .summary-card {
        width: 33%;
        min-height: 4.875rem;
        padding: 1rem 1rem;
    }
    .summary-title {
        @apply text-gray-500 font-bold;
        font-size: 0.875rem;
        line-height: 130%;
    }
    .summary-content {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        line-height: 120%;
        &.cost-type {
            @apply flex justify-between;
            position: relative;
            .cost-type-content {
                @apply truncate;
                max-width: calc(100% - 4rem);
                font-size: 0.875rem;
                line-height: 130%;
            }
        }
    }
    .view-all {
        @apply text-blue-700 cursor-pointer;
        font-size: 0.875rem;
        margin-left: 0.5rem;
        flex-shrink: 0;
    }

    @screen tablet {
        @apply flex-col;
        row-gap: 0.5rem;
        .summary-card {
            width: auto;
        }
    }
}
</style>
