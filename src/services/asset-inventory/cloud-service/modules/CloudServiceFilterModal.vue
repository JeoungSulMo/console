<template>
    <p-button-modal
        v-if="visible"
        class="cloud-service-filter-modal"
        :header-title="$t('INVENTORY.CLOUD_SERVICE.MAIN.MODAL.SET_FILTER')"
        :visible.sync="proxyVisible"
        :footer-reset-button-visible="true"
        @confirm="handleFormConfirm"
        @return="handleClearAll"
    >
        <template #body>
            <div class="select-filter-body">
                <div class="left-select-filter-section">
                    <p-collapsible-list
                        class="collapsible-list-section"
                        :items="filterItems"
                        toggle-type="switch"
                        :multi-unfoldable="true"
                        :unfolded-indices.sync="unfoldedIndices"
                    >
                        <template #default="{name, isCollapsed}">
                            <cloud-service-filter-search-dropdown v-if="!isCollapsed"
                                                                  :type="name"
                                                                  :selected="filters[name]"
                                                                  @update:selected="handleFilterUpdate(name, $event)"
                            />
                        </template>
                    </p-collapsible-list>
                </div>
                <div class="right-select-filter-section">
                    <div class="selected-filter-section">
                        <div class="title">
                            {{ $t('INVENTORY.CLOUD_SERVICE.MAIN.MODAL.SELECTED_FILTER') }} ({{ selectedItemsLength }})
                        </div>
                        <div v-if="selectedItemsLength" class="selected-tags-wrapper">
                            <template v-for="([filterName, items], idx) in Object.entries(selectedItemsMap)">
                                <p-tag v-for="(item, itemIdx) in items" :key="`selected-tag-${idx}-${item.name}`"
                                       @delete="handleDeleteTag(filterName, itemIdx)"
                                >
                                    <b>{{ filterLabels[filterName] }}: </b>{{ item.label }}
                                </p-tag>
                            </template>
                        </div>
                        <div v-else class="no-item-wrapper">
                            <p>{{ $t('INVENTORY.CLOUD_SERVICE.MAIN.MODAL.NO_FILTER_HELP_TEXT1') }}</p>
                            <p>{{ $t('INVENTORY.CLOUD_SERVICE.MAIN.MODAL.NO_FILTER_HELP_TEXT2') }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template #reset-button>
            {{ $t('INVENTORY.CLOUD_SERVICE.MAIN.MODAL.CLEAR_ALL') }}
        </template>
    </p-button-modal>
</template>

<script lang="ts">
import {
    computed, defineComponent, reactive, toRefs, watch,
} from '@vue/composition-api';

import {
    PButtonModal, PCollapsibleList, PTag,
} from '@spaceone/design-system';
import { sum } from 'lodash';
import type { TranslateResult } from 'vue-i18n';

import { store } from '@/store';
import { i18n } from '@/translations';

import type { ProviderReferenceMap } from '@/store/modules/reference/provider/type';
import type { RegionReferenceMap } from '@/store/modules/reference/region/type';

import { useProxyValue } from '@/common/composables/proxy-state';

import { CLOUD_SERVICE_FILTER_KEY } from '@/services/asset-inventory/cloud-service/lib/config';
import CloudServiceFilterSearchDropdown from '@/services/asset-inventory/cloud-service/modules/CloudServiceFilterSearchDropdown.vue';
import type { RegionMenuItem } from '@/services/asset-inventory/cloud-service/modules/lib/cloud-service-filter-helper';
import {
    getRegionFilterMenuItem,
} from '@/services/asset-inventory/cloud-service/modules/lib/cloud-service-filter-helper';
import type { CloudServiceFilterKey, CloudServiceFilterMap } from '@/services/asset-inventory/cloud-service/type';
import { assetInventoryStore } from '@/services/asset-inventory/store';

interface FilterItem {
    name: string;
    title: TranslateResult;
}

interface CategoryMenuItem { name: string; label: string }
type CloudServiceFilterItemsMap = {
    [CLOUD_SERVICE_FILTER_KEY.SERVICE_CATEGORY]: CategoryMenuItem[];
    [CLOUD_SERVICE_FILTER_KEY.REGION]: RegionMenuItem[];
}

interface Props {
    visible: boolean;
}

export default defineComponent<Props>({
    name: 'CloudServiceFilterModal',
    components: {
        CloudServiceFilterSearchDropdown,
        PButtonModal,
        PCollapsibleList,
        PTag,
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
            filterLabels: computed<Record<CloudServiceFilterKey, TranslateResult>>(() => ({
                [CLOUD_SERVICE_FILTER_KEY.SERVICE_CATEGORY]: i18n.t('INVENTORY.CLOUD_SERVICE.MAIN.MODAL.SERVICE_CATEGORY'),
                [CLOUD_SERVICE_FILTER_KEY.REGION]: i18n.t('INVENTORY.CLOUD_SERVICE.MAIN.MODAL.REGION'),
            })),
            filterItems: computed<FilterItem[]>(() => [
                { name: CLOUD_SERVICE_FILTER_KEY.SERVICE_CATEGORY, title: i18n.t('INVENTORY.CLOUD_SERVICE.MAIN.MODAL.SERVICE_CATEGORY') },
                { name: CLOUD_SERVICE_FILTER_KEY.REGION, title: i18n.t('INVENTORY.CLOUD_SERVICE.MAIN.MODAL.REGION') },
            ]),
            // references
            providers: computed<ProviderReferenceMap>(() => store.state.reference.provider.items),
            regions: computed<RegionReferenceMap>(() => store.state.reference.region.items),
            // asset inventory store data
            provider: computed(() => assetInventoryStore.state.cloudService.selectedProvider),
            categoryFilters: computed<CategoryMenuItem[]>(() => state.filters[CLOUD_SERVICE_FILTER_KEY.SERVICE_CATEGORY]?.map(d => ({ name: d, label: d }))),
            regionFilters: computed<RegionMenuItem[]>(() => state.filters[CLOUD_SERVICE_FILTER_KEY.REGION]?.map(d => getRegionFilterMenuItem(d, state.regions, state.providers))),
            filters: assetInventoryStore.state.cloudService.additionalFilters as CloudServiceFilterMap,
            selectedItemsMap: computed<CloudServiceFilterItemsMap>(() => ({
                [CLOUD_SERVICE_FILTER_KEY.SERVICE_CATEGORY]: state.categoryFilters,
                [CLOUD_SERVICE_FILTER_KEY.REGION]: state.regionFilters,
            })),
            selectedItemsLength: computed<number>(() => {
                const selectedValues = Object.values(state.selectedItemsMap as CloudServiceFilterItemsMap);
                return sum(selectedValues.map(v => v?.length || 0));
            }),
            unfoldedIndices: [] as number[],
            menuLoading: false,
        });

        /* util */
        const init = () => {
            const _unfoldedIndices: number[] = [];
            const originFilters = assetInventoryStore.state.cloudService.additionalFilters;
            state.filterItems.forEach((item, idx) => {
                if (originFilters[item.name]?.length) {
                    _unfoldedIndices.push(idx);
                }
            });
            state.unfoldedIndices = _unfoldedIndices;
            state.filters = { ...originFilters };
        };

        /* event */
        const handleDeleteTag = (filterName: string, itemIdx: number) => {
            const filters = { ...state.filters };
            const filterItems = [...filters[filterName]];
            filterItems.splice(itemIdx, 1);
            if (filterItems.length) {
                filters[filterName] = filterItems;
            } else {
                filters[filterName] = undefined;
            }
            state.filters = filters;
        };
        const handleFormConfirm = () => {
            assetInventoryStore.dispatch('cloudService/setAdditionalFilters', state.filters);
            emit('confirm');
            state.proxyVisible = false;
        };
        const handleClearAll = () => {
            state.filters = {};
            state.unfoldedIndices = [];
        };

        const handleFilterUpdate = (name: string, selected: string[]) => {
            state.filters = { ...state.filters, [name]: selected };
        };

        watch(() => state.unfoldedIndices, (after, before) => {
            if (after.length < before.length) {
                const filters = { ...state.filters };
                const deletedIndex: number = before.filter(idx => !after.includes(idx))[0];
                const deletedFilterName = state.filterItems[deletedIndex].name;
                filters[deletedFilterName] = undefined;
                state.filters = filters;
            }
        });
        watch(() => props.visible, (visible) => {
            if (visible) init();
        });
        watch(() => state.provider, (provider) => {
            if (!props.visible) return;
            if (provider === 'all') return;
            const regionFilters = state.filters[CLOUD_SERVICE_FILTER_KEY.REGION] ?? [];
            assetInventoryStore.dispatch('cloudService/setSelectedRegions', regionFilters.filter((r) => {
                const region = state.regions[r];
                if (!region) return false;
                return region.data.provider === provider;
            }));
        });

        // LOAD REFERENCE STORE
        (async () => {
            await Promise.allSettled([
                store.dispatch('reference/provider/load'),
                store.dispatch('reference/region/load'),
            ]);
        })();

        return {
            ...toRefs(state),
            handleFormConfirm,
            handleClearAll,
            handleDeleteTag,
            handleFilterUpdate,
        };
    },
});
</script>

<style lang="postcss" scoped>
.cloud-service-filter-modal {
    &.p-button-modal::v-deep {
        .modal-content {
            height: 48.75rem;
        }
    }
    .select-filter-body {
        @apply grid grid-cols-2 gap-4;

        @screen mobile {
            @apply grid grid-cols-1;
        }

        .left-select-filter-section {
            @apply bg-gray-100 border border-solid border-gray-200 rounded;
            padding: 0.5rem;
            .collapsible-list-section {
                @apply flex flex-wrap flex-col gap-1;
                ::v-deep .collapsible-item {
                    @apply bg-white rounded-none;
                    padding: 0 1rem;
                    > .p-collapsible-panel {
                        > .contents {
                            @apply rounded-lg bg-blue-100;
                            padding: 0.75rem;
                            margin-top: 0.25rem;
                        }
                    }
                }
            }
        }
        .right-select-filter-section {
            @apply flex flex-col flex-wrap gap-4;

            .selected-filter-section {
                @apply rounded-lg border-gray-200 border-solid;
                min-height: 11rem;
                border-width: 1px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                gap: 1rem;
                align-items: flex-start;
                padding: 1rem;

                .selected-tags-wrapper .p-tag {
                    margin-bottom: 0.5rem;
                }
                .no-item-wrapper {
                    @apply text-gray-300;
                    font-size: 0.875rem;
                    line-height: 1.6;
                }
            }
        }
    }
}
</style>
