<template>
    <widget-layout class="service-accounts">
        <template #title>
            <div class="top">
                <p class="title">
                    {{ $t('COMMON.WIDGETS.SERVICE_ACCOUNTS') }}
                </p>
                <router-link :to="{ name: ASSET_INVENTORY_ROUTE.SERVICE_ACCOUNT._NAME }" class="add-btn">
                    <p-i name="ic_plus" width="1rem" height="1rem"
                         color="inherit"
                    /> {{ $t('COMMON.WIDGETS.SERVICE_ACCOUNTS_ADD') }}
                </router-link>
            </div>
        </template>
        <div class="chart-container">
            <p-data-loader :loading="loading" :data="data" class="chart">
                <template #loader>
                    <div ref="loaderRef" class="w-full h-full" />
                </template>
                <template #no-data>
                    <div class="no-data-wrapper">
                        <img src="@/assets/images/illust_ghost.svg">
                    </div>
                </template>
                <div ref="chartRef" class="w-full h-full" />
            </p-data-loader>
        </div>
        <div class="legends">
            <template v-if="loading">
                <div v-for="v in skeletons" :key="v" class="flex items-center p-4">
                    <p-skeleton width="1.5rem" height="1.5rem" class="mr-4 flex-shrink-0" />
                    <p-skeleton class="flex-grow" />
                </div>
            </template>
            <p-data-table v-else
                          :loading="loading"
                          :fields="fields"
                          :items="data"
                          :bordered="false"
            >
                <template #col-provider-format="{ item }">
                    <router-link :to="getLink(item)">
                        <span :style="{color: item.color}" class="provider-label">{{ providers[item.provider].label }}</span>
                    </router-link>
                </template>
            </p-data-table>
        </div>
    </widget-layout>
</template>

<script lang="ts">
import {
    computed, reactive, toRefs, watch, onUnmounted,
} from '@vue/composition-api';

import * as am4charts from '@amcharts/amcharts4/charts';
import * as am4core from '@amcharts/amcharts4/core';
import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import {
    PDataLoader, PDataTable, PI, PSkeleton,
} from '@spaceone/design-system';
import { forEach, range, isEmpty } from 'lodash';
import type { Location } from 'vue-router';


import { store } from '@/store';
import { i18n } from '@/translations';

import config from '@/lib/config';

import WidgetLayout from '@/common/components/layouts/WidgetLayout.vue';
import ErrorHandler from '@/common/composables/error/errorHandler';

import {
    gray, violet, white,
} from '@/styles/colors';


import { ASSET_INVENTORY_ROUTE } from '@/services/asset-inventory/route-config';


const DEFAULT_COLOR = violet[200];

interface Data {
    provider?: string;
    color: string;
    service_account_count: number;
    href: string;
}

const CATEGORY_KEY = 'name';
const VALUE_KEY = 'service_account_count';

export default {
    name: 'ServiceAccounts',
    components: {
        WidgetLayout,
        PI,
        PDataTable,
        PSkeleton,
        PDataLoader,
    },
    props: {
        extraParams: {
            type: Object,
            default: () => ({}),
        },
    },
    setup(props) {
        const state = reactive({
            providers: computed(() => store.state.reference.provider.items),
            skeletons: range(4),
            loading: true,
            loaderRef: null,
            chartRef: null as HTMLElement | null,
            data: [] as Data[],
            chart: null as null | any,
            chartRegistry: {},
            fields: computed(() => [
                { name: 'provider', label: i18n.t('COMMON.WIDGETS.SERVICE_ACCOUNTS_PROVIDER') },
                { name: 'service_account_count', label: i18n.t('COMMON.WIDGETS.SERVICE_ACCOUNTS_ACCOUNT') },
            ]),
        });

        /* Util */
        const disposeChart = (ctx) => {
            if (state.chartRegistry[ctx]) {
                state.chartRegistry[ctx].dispose();
                delete state.chartRegistry[ctx];
            }
        };
        const drawChart = (ctx, isLoading = false) => {
            const createChart = () => {
                disposeChart(ctx);
                state.chartRegistry[ctx] = am4core.create(ctx, am4charts.PieChart);
                return state.chartRegistry[ctx];
            };
            const chart = createChart();
            state.chart = chart;
            if (!config.get('AMCHARTS_LICENSE.ENABLED')) chart.logo.disabled = true;
            chart.responsive.enabled = true;
            chart.innerRadius = am4core.percent(63);

            if (isLoading) {
                chart.data = [{
                    provider: 'Dummy',
                    service_account_count: 1000,
                    color: DEFAULT_COLOR,
                }];
            } else {
                chart.data = state.data;
            }

            const series = chart.series.create();
            series.slices.template.togglable = false;
            series.slices.template.clickable = false;
            series.dataFields.value = VALUE_KEY;
            series.dataFields.category = CATEGORY_KEY;
            series.slices.template.propertyFields.fill = 'color';
            series.slices.template.stroke = am4core.color(white);
            series.slices.template.strokeWidth = 2;
            series.slices.template.strokeOpacity = 1;
            series.slices.template.states.getKey('hover').properties.scale = 1;
            series.tooltip.disabled = true;
            series.ticks.template.disabled = true;
            series.labels.template.text = '';

            const label = new am4core.Label();
            label.parent = series;
            label.horizontalCenter = 'middle';
            label.verticalCenter = 'middle';
            label.fontSize = 25;
            label.fontWeight = 'lighter';
            label.fill = am4core.color(gray[900]);
            if (isLoading) {
                label.text = '';
            } else {
                label.text = '{values.value.sum}';
            }
        };

        const getLink = (data): Location => ({
            name: ASSET_INVENTORY_ROUTE.SERVICE_ACCOUNT._NAME,
            query: {
                provider: data.provider,
            },
        });


        /* Api */
        const getData = async () => {
            state.loading = true;
            const data: Data[] = [];
            try {
                const { results } = await SpaceConnector.client.statistics.topic.serviceAccountByProvider(props.extraParams);
                forEach(results, (d) => {
                    data.push({
                        ...d,
                        provider: d.provider,
                        color: state.providers[d.provider].color || '',
                        href: getLink(d),
                        service_account_count: d.service_account_count,
                    });
                });
                state.data = data;
            } catch (e) {
                state.data = [];
                ErrorHandler.handleError(e);
            } finally {
                state.loading = false;
            }
        };


        /* Init */
        (async () => {
            await store.dispatch('reference/provider/load', true);
        })();


        /* Watcher */
        watch(() => state.providers, (providers) => {
            if (!isEmpty(providers)) getData();
        }, { immediate: true });
        watch([() => state.loading, () => state.loaderRef, () => state.chartRef], ([loading, loaderCtx, chartCtx]) => {
            if (loading && loaderCtx) {
                drawChart(loaderCtx, true);
            }
            if (!loading && chartCtx) {
                drawChart(chartCtx, false);
            }
        }, { immediate: true });

        onUnmounted(() => {
            if (state.chart) state.chart.dispose();
        });

        return {
            ...toRefs(state),
            ASSET_INVENTORY_ROUTE,
            getLink,
        };
    },
};
</script>

<style lang="postcss" scoped>
.top {
    @apply flex justify-between items-center pb-4;
    .title {
        @apply text-gray-900;
        font-size: 1rem;
        line-height: 1.2;
        font-weight: bold;
    }
    .add-btn {
        @apply flex-shrink-0 flex justify-end items-center text-blue-600;
        line-height: 1.2;
        font-size: 0.75rem;
        &:hover {
            @apply text-blue-800;
        }
    }
}
.chart {
    height: 11.25rem;
    width: 100%;
}

.legends {
    @apply w-full flex-grow justify-center items-center m-auto overflow-y-auto;
}
.chart-container {
    @apply flex justify-center items-center mb-4;
    .p-data-loader::v-deep {
        .no-data-wrapper {
            display: flex;
            height: 100%;
            img {
                margin: auto;
            }
        }
    }
}
.p-data-table::v-deep {
    @apply rounded-xs;
    margin-top: 1rem;
    overflow-x: hidden;
    &.default th {
        @apply bg-gray-100 text-gray-400;
        height: 1.5rem;
        border: none;
        font-size: 0.75rem;
        width: 3.75rem;
    }
    td {
        width: 3.75rem;
        height: 2rem;
    }
}
.provider-label {
    &:hover {
        text-decoration: underline;
    }
}
</style>
