<template>
    <p-popover class="popover" position="bottom-end">
        <slot />
        <template #content>
            <div class="content-wrapper">
                <div class="header">
                    <span class="header-title">{{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.COST_TYPE') }}</span>
                    <span>{{ costTypeMap[costTypeKey] }}</span>
                </div>
                <hr class="divider">
                <div class="content">
                    {{ costTypeValue }}
                </div>
            </div>
        </template>
    </p-popover>
</template>

<script lang="ts">
import { PPopover } from '@spaceone/design-system';


const costTypeMap = {
    region_code: 'Region',
    service_account_id: 'Service Account',
    provider: 'Provider',
    product: 'Product',
};

export default {
    name: 'BudgetCostTypePopover',
    components: {
        PPopover,
    },
    props: {
        costTypeKey: {
            type: String,
            default: '',
        },
        costTypeValue: {
            type: String,
            default: undefined,
        },
    },
    setup() {
        return {
            costTypeMap,
        };
    },
};
</script>

<style lang="postcss" scoped>
.popover::v-deep {
    .popper {
        z-index: 1;
        width: 16.625rem;
    }
}
.content-wrapper {
    @apply flex flex-col;
    line-height: 125%;
    .header {
        font-size: 1rem;
        .header-title {
            @apply text-gray-500 font-bold;
            margin-right: 0.5rem;
        }
    }
    .divider {
        width: 12.375rem;
        margin-top: 0.75rem;
        margin-bottom: 0.75rem;
    }
    .content {
        font-size: 0.875rem;
        line-height: 125%;
    }
}
</style>
