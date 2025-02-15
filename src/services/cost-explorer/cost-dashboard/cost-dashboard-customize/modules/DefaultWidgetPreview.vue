<template>
    <cost-dashboard-customize-widget-preview :layout="layout">
        <template #chart>
            <div class="info-item">
                <div class="type">
                    <p-label>{{ $t('BILLING.COST_MANAGEMENT.DASHBOARD.CUSTOMIZE.ADD_WIDGET_MODAL.TYPE') }}</p-label>
                    <p-anchor highlight
                              :href="thumbnailLink"
                    >
                        {{ $t('BILLING.COST_MANAGEMENT.DASHBOARD.CUSTOMIZE.ADD_WIDGET_MODAL.VIEW_PREVIEW') }}
                    </p-anchor>
                </div>
                <div class="image-wrapper">
                    <p-lazy-img :src="assetUrlConverter(chartThumbnail)" width="232px" height="10rem" />
                </div>
            </div>
        </template>
    </cost-dashboard-customize-widget-preview>
</template>

<script lang="ts">
import { computed, reactive, toRefs } from '@vue/composition-api';

import { PAnchor, PLabel, PLazyImg } from '@spaceone/design-system';

import { assetUrlConverter } from '@/lib/helper/asset-helper';

import CostDashboardCustomizeWidgetPreview
    from '@/services/cost-explorer/cost-dashboard/cost-dashboard-customize/modules/CostDashboardCustomizeWidgetPreview.vue';
import type { WidgetInfo } from '@/services/cost-explorer/cost-dashboard/type';


export default {
    name: 'DefaultWidgetPreview',
    components: {
        CostDashboardCustomizeWidgetPreview,
        PLabel,
        PLazyImg,
        PAnchor,
    },
    props: {
        selectedWidget: {
            type: Object as () => WidgetInfo,
            default: () => ({}),
        },
    },

    setup(props) {
        const state = reactive({
            chartThumbnail: computed(() => `https://spaceone-custom-assets.s3.ap-northeast-2.amazonaws.com/console-assets/widget/tn--${props.selectedWidget?.options?.chart_img}.png`),
            thumbnailLink: computed(() => `https://spaceone-custom-assets.s3.ap-northeast-2.amazonaws.com/console-assets/widget/${props.selectedWidget?.options?.chart_img}.png`),
            chartType: computed(() => props.selectedWidget?.options?.chart_type ?? ''),
            layout: computed(() => props.selectedWidget?.options?.layout),
        });
        return {
            ...toRefs(state),
            assetUrlConverter,
        };
    },
};
</script>
<style lang="postcss" scoped>
.info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 0.5rem;
    .type {
        @apply w-full inline-flex justify-between;
    }
    .p-anchor {
        @apply items-center;
    }
}
.image-wrapper {
    img {
        margin: 0 auto;
    }
}
</style>
