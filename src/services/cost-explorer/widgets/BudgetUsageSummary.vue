<template>
    <cost-dashboard-card-widget-layout :title="name ? name : $t('BILLING.COST_MANAGEMENT.DASHBOARD.BUDGET_USAGE_SUMMARY')"
                                       :widget-link="widgetLink"
                                       :show-top-text="false"
                                       :print-mode="printMode"
    >
        <budget-stat :filters="queryStoreFilters" :period="period" :print-mode="printMode"
                     @rendered="handleRendered"
        />
    </cost-dashboard-card-widget-layout>
</template>

<script lang="ts">
import { computed, reactive, toRefs } from '@vue/composition-api';

import { QueryHelper } from '@spaceone/console-core-lib/query';
import type { QueryStoreFilter } from '@spaceone/console-core-lib/query/type';

import { CURRENCY } from '@/store/modules/display/config';

import BudgetStat from '@/services/cost-explorer/budget/modules/budget-stat/BudgetStat.vue';
import { getConvertedBudgetFilter } from '@/services/cost-explorer/cost-analysis/lib/helper';
import { COST_EXPLORER_ROUTE } from '@/services/cost-explorer/route-config';
import {
    getWidgetOption,
} from '@/services/cost-explorer/widgets/lib/widget-data-helper';
import CostDashboardCardWidgetLayout
    from '@/services/cost-explorer/widgets/modules/CostDashboardCardWidgetLayout.vue';
import type { WidgetProps } from '@/services/cost-explorer/widgets/type';


export default {
    name: 'BudgetUsageSummary',
    components: {
        CostDashboardCardWidgetLayout,
        BudgetStat,
    },
    props: {
        name: {
            type: String,
            default: undefined,
        },
        widgetId: {
            type: String,
            default: '',
        },
        options: {
            type: Object,
            default: () => ({}),
        },
        period: {
            type: Object,
            default: () => ({}),
        },
        filters: {
            type: Object,
            default: () => ({}),
        },
        currency: {
            type: String,
            default: CURRENCY.USD,
        },
        currencyRates: {
            type: Object,
            default: () => ({}),
        },
        printMode: {
            type: Boolean,
            default: false,
        },
    },
    setup(props: WidgetProps, { emit }) {
        const budgetQueryHelper = new QueryHelper();
        const state = reactive({
            widgetOptions: getWidgetOption(props.options, props.widgetId),
            queryStoreFilters: computed<QueryStoreFilter[]>(() => getConvertedBudgetFilter(props.filters)),
            widgetLink: computed(() => {
                if (props.printMode) return undefined;
                return {
                    name: COST_EXPLORER_ROUTE.BUDGET._NAME,
                    params: {},
                    query: {
                        filters: budgetQueryHelper.setFilters(state.queryStoreFilters).rawQueryStrings,
                    },
                };
            }),
        });

        const handleRendered = (...args) => {
            emit('rendered', ...args);
        };

        return {
            ...toRefs(state),
            handleRendered,
        };
    },
};
</script>
