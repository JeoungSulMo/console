<template>
    <div>
        <p-button-tab v-if="tabs.length > 0" :tabs="tabs" :active-tab="activeTab"
                      keep-alive-all
                      @change="onChangeTab"
        >
            <template v-for="(layout, i) in layouts" :slot="layout.name">
                <div :key="`${layout.name}-${i}`">
                    <p-dynamic-layout :type="layout.type"
                                      :options="layoutOptions"
                                      :data="data"
                                      :type-options="{
                                          loading,
                                          totalCount,
                                          timezone,
                                          selectIndex,
                                          keyItemSets,
                                          valueHandlerMap,
                                          language,
                                          excelVisible: false
                                      }"
                                      :field-handler="fieldHandler"
                                      v-on="dynamicLayoutListeners"
                    />
                </div>
            </template>
        </p-button-tab>
    </div>
</template>

<script lang="ts">
import type { ComponentRenderProxy } from '@vue/composition-api';
import {
    computed, getCurrentInstance, reactive, toRefs, watch,
} from '@vue/composition-api';

import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import { ApiQueryHelper } from '@spaceone/console-core-lib/space-connector/helper';
import { PDynamicLayout, PButtonTab } from '@spaceone/design-system';
import type {
    DynamicLayoutEventListener, DynamicLayoutFetchOptions, DynamicLayoutFieldHandler,
} from '@spaceone/design-system/dist/src/data-display/dynamic/dynamic-layout/type';
import type { DynamicLayout, DynamicLayoutType } from '@spaceone/design-system/dist/src/data-display/dynamic/dynamic-layout/type/layout-schema';
import type { TabItem } from '@spaceone/design-system/dist/src/navigation/tabs/tab/type';
import { find } from 'lodash';

import { store } from '@/store';

import {
    dynamicFieldsToExcelDataFields,
    getApiActionByLayoutType,
} from '@/lib/component-util/dynamic-layout';
import { FILE_NAME_PREFIX } from '@/lib/excel-export';
import { referenceFieldFormatter } from '@/lib/reference/referenceFieldFormatter';
import type { Reference } from '@/lib/reference/type';


import { useQuerySearchPropsWithSearchSchema } from '@/common/composables/dynamic-layout';
import ErrorHandler from '@/common/composables/error/errorHandler';

const defaultFetchOptions: DynamicLayoutFetchOptions = {
    sortBy: '',
    sortDesc: true,
    pageStart: 1,
    pageLimit: 15,
    queryTags: [],
    searchText: '',
};

export default {
    name: 'CloudServiceDetail',
    components: {
        PDynamicLayout,
        PButtonTab,
    },
    props: {
        cloudServiceId: {
            type: String,
            required: true,
        },
        provider: {
            type: String,
            required: true,
        },
        cloudServiceGroup: {
            type: String,
            required: true,
        },
        cloudServiceType: {
            type: String,
            required: true,
        },
        isServerPage: {
            type: Boolean,
            default: false,
        },
    },
    setup(props) {
        const vm = getCurrentInstance()?.proxy as ComponentRenderProxy;

        const layoutSchemaCacheMap = {};
        const fetchOptionsMap = {};
        const dataMap = {};

        const state = reactive({
            data: undefined as any,
            loading: true,
            totalCount: 0,
            timezone: computed(() => store.state.user.timezone),
            selectIndex: [] as number[],
            language: computed(() => store.state.user.language),

            // button tab
            tabs: computed<TabItem[]>(() => {
                const local = vm.$i18n.locale;
                return state.layouts.map(d => ({
                    label: vm.$t(d.options?.translation_id, local) || d.name,
                    name: d.name,
                }));
            }),
            activeTab: '',

            // schema
            layouts: [] as DynamicLayout[],
            layoutMap: computed(() => {
                const res = {};
                state.layouts.forEach((d) => {
                    res[d.name] = d;
                });
                return res;
            }),
            currentLayout: computed<DynamicLayout>(() => state.layoutMap[state.activeTab] || {}),
            apiType: computed(() => getApiActionByLayoutType(state.currentLayout.type)),
            layoutOptions: computed(() => {
                if (!state.currentLayout.options) return {};
                if (state.apiType === 'getData') {
                    return { ...state.currentLayout.options, root_path: undefined };
                }
                return state.currentLayout.options;
            }),
            fetchOptionKey: computed(() => `${state.currentLayout.name}/${state.currentLayout.type}`),
        });
        const { keyItemSets, valueHandlerMap } = useQuerySearchPropsWithSearchSchema(
            computed(() => state.currentLayout?.options?.search ?? []),
            'inventory.CloudService',
        );
        const getSchema = async () => {
            let layouts = layoutSchemaCacheMap[props.cloudServiceId];
            if (!layouts) {
                try {
                    const params: Record<string, any> = {
                        schema: 'details',
                        options: {
                            cloud_service_id: props.cloudServiceId,
                        },
                    };
                    if (props.isServerPage) {
                        params.resource_type = 'inventory.Server';
                    } else {
                        params.resource_type = 'inventory.CloudService';
                    }
                    const res = await SpaceConnector.client.addOns.pageSchema.get(params);

                    layouts = res.details;
                } catch (e) {
                    ErrorHandler.handleError(e);
                }
            }

            layoutSchemaCacheMap[props.cloudServiceId] = layouts;
            state.layouts = layouts || [];
            if (!find(state.tabs, { name: state.activeTab })) state.activeTab = state.tabs[0].name;
        };

        const apiQuery = new ApiQueryHelper();
        const getQuery = (): any => {
            const options = fetchOptionsMap[state.fetchOptionKey] || defaultFetchOptions;
            if (options.sortBy !== undefined) apiQuery.setSort(options.sortBy, options.sortDesc);
            if (options.pageLimit !== undefined) apiQuery.setPageLimit(options.pageLimit);
            if (options.pageStart !== undefined) apiQuery.setPageStart(options.pageStart);
            if (options.searchText !== undefined) apiQuery.setFilters([{ v: options.searchText }]);
            if (options.queryTags !== undefined) {
                apiQuery.setFiltersAsQueryTag(options.queryTags);
            }

            return apiQuery.data;
        };

        const getParams = (type?: DynamicLayoutType) => {
            const params: any = { cloud_service_id: props.cloudServiceId, query: getQuery() };

            if (type === 'list') delete params.query.sort;

            const keyPath = state.currentLayout.options?.root_path;
            if (keyPath) params.key_path = keyPath;

            return params;
        };


        const getData = async () => {
            state.data = dataMap[state.fetchOptionKey];
            try {
                const api = SpaceConnector.client.inventory.cloudService[state.apiType];
                const res = await api(getParams(state.currentLayout.type));

                if (res.total_count !== undefined) state.totalCount = res.total_count;

                state.data = state.apiType === 'getData' ? res.results : res;
            } catch (e) {
                ErrorHandler.handleError(e);
                state.data = undefined;
                state.totalCount = 0;
            }
            dataMap[state.fetchOptionKey] = state.data;
        };


        const dynamicLayoutListeners: Partial<DynamicLayoutEventListener> = {
            fetch(options) {
                fetchOptionsMap[state.fetchOptionKey] = options;
                getData();
            },
            select(selectIndex) {
                state.selectIndex = selectIndex;
            },
            async export() {
                const fields = state.currentLayout?.options?.fields;
                if (!fields) return;
                await store.dispatch('file/downloadExcel', {
                    url: '/inventory/cloud-service/get-data',
                    param: getParams(),
                    fields: dynamicFieldsToExcelDataFields(fields),
                    file_name_prefix: FILE_NAME_PREFIX.cloudService,
                });
            },
        };

        const fieldHandler: DynamicLayoutFieldHandler<Record<'reference', Reference>> = (field) => {
            if (field.extraData?.reference) {
                return referenceFieldFormatter(field.extraData.reference, field.data);
            }
            return {};
        };

        const loadSchemaAndData = async () => {
            state.loading = true;
            await getSchema();
            await getData();
            state.loading = false;
        };

        const onChangeTab = async (tab) => {
            state.activeTab = tab;
            await loadSchemaAndData();
        };

        watch(() => props.cloudServiceId, async (after, before) => {
            if (after && after !== before) {
                await loadSchemaAndData();
            }
        }, { immediate: false });

        (async () => {
            await loadSchemaAndData();
        })();

        return {
            ...toRefs(state),
            onChangeTab,
            dynamicLayoutListeners,
            fetchOptionsMap,
            fieldHandler,
            keyItemSets,
            valueHandlerMap,
        };
    },
};
</script>
