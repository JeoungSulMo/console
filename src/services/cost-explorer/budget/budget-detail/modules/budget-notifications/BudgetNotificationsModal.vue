<template>
    <p-button-modal
        :header-title="$t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.SET_BUDGET_NOTIFICATIONS_CONDITION')"
        centered
        size="md"
        fade
        :scrollable="false"
        backdrop
        :visible.sync="proxyVisible"
        class="budget-notifications-modal"
        @confirm="handleConfirm"
    >
        <template #body>
            <div class="desc">
                <p>{{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.BUDGET_NOTI_HELP_TEXT') }}</p>
                <p-anchor :text="$t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.SET_NOTIFICATION_CHANNEL')"
                          :to="{
                              name: PROJECT_ROUTE.DETAIL.TAB.NOTIFICATIONS._NAME,
                              params: {
                                  id: budgetTargetId
                              }
                          }"
                          highlight
                />
            </div>
            <p-button icon="ic_plus_bold" :outline="true"
                      style-type="gray900"
                      @click="handleAddCondition"
            >
                {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.ADD_CONDITION') }}
            </p-button>
            <section class="condition-wrapper">
                <p v-if="conditions.length > 0" class="condition-header">
                    <span>{{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.UNIT') }}</span>
                    <span>{{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.THRESHOLD') }}</span>
                    <span>{{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.TYPE') }}</span>
                </p>
                <template v-for="(condition, idx) of conditions">
                    <div :key="`condition-${idx}`" class="condition-input-wrapper">
                        <p-select-dropdown v-model="condition.unit"
                                           class="condition"
                                           :items="units"
                                           use-fixed-menu-style
                        />
                        <span class="align-middle">&gt;</span>
                        <p-text-input v-model="condition.threshold"
                                      class="condition"
                                      :placeholder="condition.unit === NOTIFICATION_UNIT.ACTUAL_COST
                                          ? '$1000' : '50'"
                        >
                            <template #right-extra>
                                <span v-if="condition.unit === NOTIFICATION_UNIT.PERCENT" class="text-gray-400">%</span>
                            </template>
                        </p-text-input>
                        <p-select-dropdown v-model="condition.notification_type"
                                           class="condition"
                                           :items="types"
                                           use-fixed-menu-style
                        >
                            <span :class="{'text-alert': condition.notification_type === NOTIFICATION_TYPE.CRITICAL}">
                                {{ types.find(d => d.name === condition.notification_type).label }}
                            </span>
                        </p-select-dropdown>
                        <p-icon-button name="ic_trashcan"
                                       class="delete-button"
                                       @click="handleDeleteCondition(idx)"
                        />
                    </div>
                </template>
            </section>
        </template>
    </p-button-modal>
</template>

<script lang="ts">
import {
    computed, reactive, toRefs,
} from '@vue/composition-api';

import {
    PButtonModal, PTextInput, PAnchor, PButton, PSelectDropdown, PIconButton,
} from '@spaceone/design-system';
import cloneDeep from 'lodash/cloneDeep';

import { i18n } from '@/translations';

import ErrorHandler from '@/common/composables/error/errorHandler';
import { useProxyValue } from '@/common/composables/proxy-state';

import { costExplorerStore } from '@/services/cost-explorer/store';
import { PROJECT_ROUTE } from '@/services/project/route-config';


const NOTIFICATION_UNIT = Object.freeze({
    PERCENT: 'PERCENT',
    ACTUAL_COST: 'ACTUAL_COST',
});
type NotificationUnit = keyof typeof NOTIFICATION_UNIT;

const NOTIFICATION_TYPE = {
    CRITICAL: 'CRITICAL',
    WARNING: 'WARNING',
};
type NotificationType = keyof typeof NOTIFICATION_TYPE;

interface Condition {
    unit?: NotificationUnit;
    threshold?: number | null;
    notification_type?: NotificationType;
}

export default {
    name: 'BudgetNotificationsModal',
    components: {
        PButtonModal,
        PAnchor,
        PButton,
        PTextInput,
        PSelectDropdown,
        PIconButton,
    },
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
        budgetTargetId: {
            type: String,
            default: undefined,
        },
    },
    setup(props, { emit }) {
        const state = reactive({
            loading: true,
            proxyVisible: useProxyValue('visible', props, emit),
            conditions: cloneDeep(costExplorerStore.state.budget.budgetData?.notifications) as Condition[],
            units: computed(() => ([
                {
                    name: NOTIFICATION_UNIT.ACTUAL_COST,
                    label: i18n.t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.ACTUAL_COST'),
                },
                {
                    name: NOTIFICATION_UNIT.PERCENT,
                    label: i18n.t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.BUDGET_USAGE', { symbol: '%' }),
                },
            ])),
            types: computed(() => ([
                {
                    name: NOTIFICATION_TYPE.WARNING,
                    label: i18n.t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.WARNING'),
                },
                {
                    name: NOTIFICATION_TYPE.CRITICAL,
                    label: i18n.t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.CRITICAL'),
                },
            ])),
            thresholdPlaceholder: '',
            budgetId: computed(() => costExplorerStore.state.budget.budgetData?.budget_id),
        });

        const handleAddCondition = () => {
            state.conditions.push({
                unit: 'ACTUAL_COST',
                threshold: null,
                notification_type: 'WARNING',
            });
        };

        const handleDeleteCondition = (idx) => {
            const conditions = [...state.conditions];
            conditions.splice(idx, 1);
            state.conditions = conditions;
        };

        const setBudgetAlert = async () => {
            try {
                await costExplorerStore.dispatch('budget/updateBudgetNotifications', {
                    budgetId: state.budgetId,
                    notifications: state.conditions,
                });
            } catch (e) {
                ErrorHandler.handleError(e);
            }
        };

        const handleConfirm = async () => {
            await setBudgetAlert();
            state.proxyVisible = false;
            emit('confirm');
        };

        return {
            ...toRefs(state),
            handleAddCondition,
            handleConfirm,
            handleDeleteCondition,
            NOTIFICATION_UNIT,
            NOTIFICATION_TYPE,
            PROJECT_ROUTE,
        };
    },
};
</script>

<style lang="postcss" scoped>
.budget-notifications-modal::v-deep .modal-content .header .modal-header {
    height: auto;
    min-height: 3.5rem;
}
.desc {
    margin-bottom: 1rem;
    line-height: 1.6;
}
.condition-wrapper {
    display: flex;
    flex-direction: column;
    row-gap: 0.5rem;
    margin-top: 1rem;
    margin-bottom: 4rem;
    .condition-header {
        @apply font-bold;
        display: flex;
        gap: 0.5rem;
        padding-right: 2.5rem;
        font-size: 0.875rem;
        line-height: 140%;
        span {
            width: 12.25rem;
            &:first-of-type {
                width: 13.25rem;
            }
        }
    }
    .condition-input-wrapper {
        @apply inline-flex flex-wrap items-center;
        gap: 0.5rem;
        width: 100%;
        padding-right: 1.875rem;
        .condition {
            min-width: 7rem;
            width: 12.125rem;
            max-width: 12.25rem;

            @screen mobile {
                width: 7rem;
            }
        }
    }
}

@screen tablet {
    .condition-wrapper {
        margin-bottom: 1rem;
        .condition-header {
            @apply hidden;
        }
        .condition-input-wrapper {
            @apply bg-gray-100 rounded-xs;
            padding: 0.5rem;
        }
    }
}

@screen mobile {
    .desc {
        margin-top: 2rem;
    }
}
</style>
