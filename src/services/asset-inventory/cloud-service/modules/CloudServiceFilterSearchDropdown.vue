<template>
    <div>
        <p-search-dropdown v-model="searchTerm"
                           :menu="menuItems"
                           :selected="selectedItems"
                           multi-selectable
                           use-fixed-menu-style
                           :exact-mode="false"
                           :handler="type === CLOUD_SERVICE_FILTER_KEY.REGION ? regionMenuHandler : undefined"
                           @update:selected="handleUpdateSelected"
                           @search="handleSearch"
        >
            <template v-if="type === CLOUD_SERVICE_FILTER_KEY.REGION" #menu-item--format="{item}">
                <div class="region-list-text">
                    <div class="region-type">
                        <text-highlighting class="region-provider" :style="{color: item.color}"
                                           :text="providers[item.provider] ? providers[item.provider].label : item.provider"
                                           :term="searchTerm"
                                           style-type="secondary"
                        />
                        <text-highlighting :text="item.regionName"
                                           :term="searchTerm"
                                           style-type="secondary"
                        />
                    </div>
                    <text-highlighting class="region-code"
                                       :text="item.continentLabel"
                                       :term="searchTerm"
                                       style-type="secondary"
                    />
                </div>
            </template>
        </p-search-dropdown>
    </div>
</template>

<script lang="ts">
import {
    computed, defineComponent, reactive, toRefs,
} from '@vue/composition-api';

import {
    PSearchDropdown,
} from '@spaceone/design-system';
import type {
    SearchDropdownMenuItem,
} from '@spaceone/design-system/dist/src/inputs/dropdown/search-dropdown/type';

import { store } from '@/store';

import type { ProviderReferenceMap } from '@/store/modules/reference/provider/type';
import type { SortedRegionReferenceItem } from '@/store/modules/reference/region/type';

import { getTextHighlightRegex } from '@/common/components/text/text-highlighting/helper';
import TextHighlighting from '@/common/components/text/text-highlighting/TextHighlighting.vue';

import { CLOUD_SERVICE_CATEGORY, CLOUD_SERVICE_FILTER_KEY } from '@/services/asset-inventory/cloud-service/lib/config';
import type { RegionMenuItem } from '@/services/asset-inventory/cloud-service/modules/lib/cloud-service-filter-helper';
import { getRegionFilterMenuItem } from '@/services/asset-inventory/cloud-service/modules/lib/cloud-service-filter-helper';
import { assetInventoryStore } from '@/services/asset-inventory/store';

const categoryItems = [
    { name: CLOUD_SERVICE_CATEGORY.SERVER, label: CLOUD_SERVICE_CATEGORY.SERVER },
    { name: CLOUD_SERVICE_CATEGORY.COMPUTE, label: CLOUD_SERVICE_CATEGORY.COMPUTE },
    { name: CLOUD_SERVICE_CATEGORY.CONTAINER, label: CLOUD_SERVICE_CATEGORY.CONTAINER },
    { name: CLOUD_SERVICE_CATEGORY.DATABASE, label: CLOUD_SERVICE_CATEGORY.DATABASE },
    { name: CLOUD_SERVICE_CATEGORY.NETWORKING, label: CLOUD_SERVICE_CATEGORY.NETWORKING },
    { name: CLOUD_SERVICE_CATEGORY.STORAGE, label: CLOUD_SERVICE_CATEGORY.STORAGE },
    { name: CLOUD_SERVICE_CATEGORY.SECURITY, label: CLOUD_SERVICE_CATEGORY.SECURITY },
    { name: CLOUD_SERVICE_CATEGORY.ANALYTICS, label: CLOUD_SERVICE_CATEGORY.ANALYTICS },
    { name: CLOUD_SERVICE_CATEGORY.APPLICATION_INTEGRATION, label: CLOUD_SERVICE_CATEGORY.APPLICATION_INTEGRATION },
    { name: CLOUD_SERVICE_CATEGORY.MANAGEMENT, label: CLOUD_SERVICE_CATEGORY.MANAGEMENT },
];


// interface AutocompleteResult<Data> {
//     name: string;
//     key: string;
//     data?: Data;
// }

// type RegionAutocompleteResult = AutocompleteResult<{
//     provider: string;
// }>


interface Props {
    type: string;
    selected: string[];
}

export default defineComponent<Props>({
    name: 'CloudServiceFilterSearchDropdown',
    components: {
        TextHighlighting,
        PSearchDropdown,
    },
    props: {
        type: {
            type: String,
            default: undefined,
        },
        selected: {
            type: Array,
            default: () => ([]),
        },
    },
    setup(props, { emit }) {
        const state = reactive({
            searchTerm: '',
            selectedItems: computed<SearchDropdownMenuItem[]>(() => props.selected.map(selectedName => ({
                name: selectedName,
                label: state.menuItems.find(d => d.name === selectedName)?.label || selectedName,
            }))),
            providers: computed<ProviderReferenceMap>(() => store.state.reference.provider.items),
            selectedProvider: computed(() => assetInventoryStore.state.cloudService.selectedProvider),
            sortedRegions: computed<SortedRegionReferenceItem[]>(() => {
                const regions: SortedRegionReferenceItem[] = store.getters['reference/region/regionsSortedByProvider'];
                if (state.selectedProvider === 'all') return regions;
                return regions.filter(r => r.data.provider === state.selectedProvider);
            }),
            regionItems: computed<RegionMenuItem[]>(() => state.sortedRegions.map(d => getRegionFilterMenuItem(d.id, store.state.reference.region.items, state.providers))),
            menuItems: computed<SearchDropdownMenuItem[]|RegionMenuItem[]>(() => {
                if (props.type === CLOUD_SERVICE_FILTER_KEY.SERVICE_CATEGORY) {
                    return categoryItems;
                } if (props.type === CLOUD_SERVICE_FILTER_KEY.REGION) {
                    return state.regionItems;
                }
                return [];
            }),
            menuLoading: false,
        });
        const regionMenuHandler = (inputText: string, list: RegionMenuItem[]) => {
            const trimmed = inputText?.trim();
            let results: RegionMenuItem[] = [...list];
            if (trimmed) {
                const regex = getTextHighlightRegex(inputText);
                results = results.filter(d => regex.test(d.label));
            }

            return {
                results,
                totalCount: state.regionItems.length,
            };
        };

        /* event */
        const handleSearch = (val: string) => {
            emit('update:selected', state.selectedItems.map(d => d.name).concat([val]));
        };

        const handleUpdateSelected = (selected: SearchDropdownMenuItem[]) => {
            emit('update:selected', selected.map(d => d.name));
        };

        // LOAD REFERENCE STORE
        (async () => {
            await Promise.allSettled([
                store.dispatch('reference/provider/load'),
                store.dispatch('reference/region/load'),
            ]);
        })();

        return {
            ...toRefs(state),
            CLOUD_SERVICE_FILTER_KEY,
            regionMenuHandler,
            handleSearch,
            handleUpdateSelected,
        };
    },
});
</script>

<style lang="postcss" scoped>
.region-list-text {
    @apply text-sm;
    width: 100%;
    display: flex;
    flex-direction: column;
    .region-type {
        padding-left: 0.25rem;
    }
    .region-provider {
        @apply mr-1;
    }
    .region-code {
        @apply text-gray-400;
        padding-left: 0.25rem;
    }
}
</style>
