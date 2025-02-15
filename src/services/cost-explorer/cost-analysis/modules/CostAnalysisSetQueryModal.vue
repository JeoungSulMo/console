<template>
    <p-button-modal
        :header-title="$t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.SET_QUERY')"
        :visible.sync="proxyVisible"
        size="sm"
        @confirm="handleFormConfirm"
    >
        <template #body>
            <div class="set-query-modal-body">
                <div class="input-wrapper">
                    <p class="input-title">
                        {{ $t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.GRANULARITY') }}
                    </p>
                    <p-select-dropdown
                        class="select-input-box"
                        use-fixed-menu-style
                        :items="granularityItems"
                        :selected="granularity"
                        @select="handleSelectGranularity"
                    />
                </div>
                <div v-if="granularity !== GRANULARITY.ACCUMULATED" class="input-wrapper">
                    <p class="input-title">
                        {{ $t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.STACK') }}
                    </p>
                    <p-toggle-button sync
                                     :value="stack"
                                     @change="handleToggleStack"
                    />
                </div>
                <div class="input-wrapper">
                    <p class="input-title">
                        {{ $t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.CURRENCY') }}
                    </p>
                    <p class="input-description">
                        Global setting
                    </p>
                    <p-select-dropdown
                        class="select-input-box"
                        :items="currencyItems"
                        :selected="currency"
                        use-fixed-menu-style
                        @select="handleSelectCurrency"
                    />
                </div>
            </div>
        </template>
    </p-button-modal>
</template>

<script lang="ts">
import {
    computed, reactive, toRefs, watch,
} from '@vue/composition-api';

import {
    PButtonModal,
    PSelectDropdown,
    PToggleButton,
} from '@spaceone/design-system';
import type { MenuItem } from '@spaceone/design-system/dist/src/inputs/context-menu/type';

import { store } from '@/store';
import { i18n } from '@/translations';

import type { Currency } from '@/store/modules/display/config';
import { CURRENCY_SYMBOL } from '@/store/modules/display/config';

import { useProxyValue } from '@/common/composables/proxy-state';

import { getInitialDates } from '@/services/cost-explorer/cost-analysis/lib/helper';
import { GRANULARITY } from '@/services/cost-explorer/lib/config';
import { costExplorerStore } from '@/services/cost-explorer/store';
import type { Granularity } from '@/services/cost-explorer/type';


export default {
    name: 'CostAnalysisSetQueryModal',
    components: {
        PButtonModal,
        PSelectDropdown,
        PToggleButton,
    },
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }) {
        const state = reactive({
            proxyVisible: useProxyValue('visible', props, emit),
            granularity: '' as Granularity,
            stack: false,
            currency: '' as Currency,
            granularityItems: computed<MenuItem[]>(() => ([
                {
                    type: 'item',
                    name: GRANULARITY.ACCUMULATED,
                    label: i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.ACCUMULATED'),
                },
                {
                    type: 'item',
                    name: GRANULARITY.DAILY,
                    label: i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.DAILY'),
                },
                {
                    type: 'item',
                    name: GRANULARITY.MONTHLY,
                    label: i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.MONTHLY'),
                },
                {
                    type: 'item',
                    name: GRANULARITY.YEARLY,
                    label: i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.YEARLY'),
                },
            ])),
            currencyItems: computed<MenuItem[]>(() => Object.keys(store.state.display.currencyRates).map(currency => ({
                type: 'item',
                name: currency,
                label: `${CURRENCY_SYMBOL[currency]}${currency}`,
            }))),
        });

        const handleFormConfirm = async () => {
            if (costExplorerStore.state.costAnalysis.granularity !== state.granularity) {
                await costExplorerStore.commit('costAnalysis/setPeriod', getInitialDates());
            }
            costExplorerStore.commit('costAnalysis/setGranularity', state.granularity);
            costExplorerStore.commit('costAnalysis/setStack', state.stack);
            store.commit('display/setCurrency', state.currency);

            state.proxyVisible = false;
        };
        const handleSelectGranularity = (granularity: string) => {
            state.granularity = granularity;
        };
        const handleSelectCurrency = (currency: Currency) => {
            state.currency = currency;
        };
        const handleToggleStack = ({ value }) => {
            state.stack = value;
        };

        watch(() => state.proxyVisible, (after) => {
            if (after) {
                state.granularity = costExplorerStore.state.costAnalysis.granularity;
                state.stack = costExplorerStore.state.costAnalysis.stack;
                state.currency = store.state.display.currency;
            }
        });

        return {
            ...toRefs(state),
            GRANULARITY,
            handleFormConfirm,
            handleSelectGranularity,
            handleSelectCurrency,
            handleToggleStack,
        };
    },
};

</script>


<style scoped lang="postcss">
.set-query-modal-body {
    margin-bottom: 2rem;
    .input-wrapper {
        .input-title {
            @apply font-bold;
            margin-top: 1rem;
            margin-bottom: 0.375rem;
            font-size: 0.875rem;
            line-height: 140%;
        }
        .select-input-box {
            width: 100%;
        }
        .input-description {
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
        }
    }
}
</style>
