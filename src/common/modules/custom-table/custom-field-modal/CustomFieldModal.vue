<template>
    <p-button-modal :visible.sync="proxyVisible"
                    :header-title="$t('COMMON.CUSTOM_FIELD_MODAL.TITLE')"
                    :scrollable="false"
                    :loading="loading"
                    :disabled="!isValid"
                    @confirm="updatePageSchema"
    >
        <template #body>
            <p-data-loader :loading="loading" :min-loading-time="500">
                <div class="contents-wrapper">
                    <section class="attribute-column-section">
                        <h3 class="section-title">
                            <template v-if="isValid">
                                {{ $t('COMMON.CUSTOM_FIELD_MODAL.ATTRIBUTE_COL') }}
                            </template>
                            <span v-else class="invalid-text">{{ $t('COMMON.CUSTOM_FIELD_MODAL.COL_REQUIRED') }}</span>
                            <p-button :outline="true" size="sm" style-type="gray900"
                                      @click="setColumnsDefault"
                            >
                                {{ $t('COMMON.CUSTOM_FIELD_MODAL.DEFAULT') }}
                            </p-button>
                        </h3>
                        <p-search v-model="search" :placeholder="$t('COMMON.CUSTOM_FIELD_MODAL.SEARCH_ATTRIBUTE_COL')" />
                        <div class="sort-wrapper">
                            <label>{{ $t('COMMON.CUSTOM_FIELD_MODAL.SORT_BY') }}</label>
                            <p-button size="sm" style-type="gray-border" font-weight="normal"
                                      @click="sortByRecommendation"
                            >
                                {{ $t('COMMON.CUSTOM_FIELD_MODAL.RECOMMEND_SORT') }}
                            </p-button>
                            <p-button size="sm" style-type="gray-border" font-weight="normal"
                                      @click="sortByAlphabet"
                            >
                                {{ $t('COMMON.CUSTOM_FIELD_MODAL.ALPHABETICAL_SORT') }}
                            </p-button>
                        </div>

                        <header>
                            <p-check-box :selected="isAllSelected" :value="true"
                                         @change="onChangeAllSelect"
                            />
                            <span class="text">{{ $t('COMMON.CUSTOM_FIELD_MODAL.COL_NAME') }}</span>
                        </header>

                        <div class="column-items-wrapper">
                            <draggable v-model="allColumns" draggable=".draggable-item" ghost-class="ghost">
                                <column-item v-for="(column, idx) in allColumns" :key="`${column.key}-${idx}`"
                                             v-model="selectedAllColumnKeys"
                                             :item="column"
                                             :search-text="search"
                                />
                            </draggable>
                        </div>
                    </section>

                    <section>
                        <h3 class="section-title">
                            {{ $t('COMMON.CUSTOM_FIELD_MODAL.TAG_COL') }}
                            <p-button :outline="true" size="sm" style-type="gray900"
                                      @click="clearSelectedTags"
                            >
                                {{ $t('COMMON.CUSTOM_FIELD_MODAL.CLEAR_ALL') }}
                            </p-button>
                        </h3>
                        <keep-alive>
                            <select-tag-columns :all-tags="tagState.allTags"
                                                :loading="tagState.loading"
                                                :proxy-selected-keys.sync="selectedAllColumnKeys"
                            />
                        </keep-alive>
                    </section>
                </div>
            </p-data-loader>
        </template>
    </p-button-modal>
</template>

<script lang="ts">

import {
    computed, reactive, toRefs, watch,
} from '@vue/composition-api';


import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import { ApiQueryHelper } from '@spaceone/console-core-lib/space-connector/helper';
import {
    PButton, PButtonModal, PCheckBox, PDataLoader, PSearch,
} from '@spaceone/design-system';
import type { DynamicField } from '@spaceone/design-system/dist/src/data-display/dynamic/dynamic-field/type/field-schema';
import { camelCase, uniq } from 'lodash';
import draggable from 'vuedraggable';

import { i18n } from '@/translations';

import { showSuccessMessage } from '@/lib/helper/notice-alert-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';
import { useProxyValue } from '@/common/composables/proxy-state';
import { TAGS_OPTIONS, TAGS_PREFIX } from '@/common/modules/custom-table/custom-field-modal/config';
import ColumnItem from '@/common/modules/custom-table/custom-field-modal/modules/ColumnItem.vue';
import SelectTagColumns from '@/common/modules/custom-table/custom-field-modal/modules/SelectTagColumns.vue';

interface Props {
    visible: boolean;
    resourceType: string;
    options: any;
    isServerPage: boolean;
}

type SelectedColumnMap = Record<string, DynamicField>

/**
 * @description Merge two field lists. Duplicate check is performed based on key, and the field list given as the first parameter takes precedence.
 * @param fieldsA
 * @param fieldsB
 */
const mergeFields = (fieldsA: DynamicField[], fieldsB: DynamicField[]): DynamicField[] => {
    const allColumns: any[] = [...fieldsA];
    fieldsB.forEach((d) => {
        const isExist = fieldsA.some(c => c.key === d.key);
        if (!isExist) allColumns.push(d);
    });
    return allColumns;
};

export default {
    name: 'CustomFieldModal',
    components: {
        ColumnItem,
        SelectTagColumns,
        PButtonModal,
        PSearch,
        PButton,
        PCheckBox,
        PDataLoader,
        draggable,
    },
    model: {
        prop: 'visible',
        event: 'update:visible',
    },
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
        resourceType: {
            type: String,
            default: '',
            required: true,
        },
        options: {
            type: Object,
            default: () => ({}),
        },
        isServerPage: {
            type: Boolean,
            default: false,
        },
    },
    setup(props: Props, { emit, root }) {
        let schema: any = {};

        const state = reactive({
            proxyVisible: useProxyValue('visible', props, emit),
            search: '',
            isAllSelected: computed(() => state.selectedColumns.length === state.allColumns.length),
            loading: true,
            availableColumns: [] as DynamicField[], // all default fields including optional fields.
            currentColumns: [] as DynamicField[], // if custom fields exist, it will be custom fields. if custom fields don't exist, it will be default fields excluding optional fields.
            allColumns: [] as DynamicField[], // fields merged with availableColumns and currentColumns
            selectedColumnMap: {} as SelectedColumnMap,
            selectedColumns: computed<DynamicField[]>({
                get: () => state.allColumns.filter(d => !!state.selectedColumnMap[d.key]),
                set: (val: DynamicField[]) => {
                    const selectedMap: SelectedColumnMap = {};
                    const tagColumns: DynamicField[] = [];
                    val.forEach((d) => {
                        selectedMap[d.key] = d;
                        if (d.key.startsWith(TAGS_PREFIX)) tagColumns.push(d);
                    });

                    state.allColumns = mergeFields(state.allColumns, tagColumns)
                        .filter(d => (d.key.startsWith(TAGS_PREFIX) ? !!selectedMap[d.key] : true));
                    state.selectedColumnMap = selectedMap;
                },
            }),
            selectedAllColumnKeys: computed<string[]>({
                get: () => state.selectedColumns.map(d => d.key),
                set: (val: string[]) => {
                    state.selectedColumns = val.map((key) => {
                        if (key.startsWith(TAGS_PREFIX)) return { key, name: key, options: TAGS_OPTIONS } as DynamicField;
                        return state.availableColumns.find(col => col.key === key) ?? { key, name: key } as DynamicField;
                    });
                },
            }),
            recommendedSequenceMap: computed<Record<string, number>>(() => {
                const orderMap: Record<string, number> = {};
                state.availableColumns.forEach((d, i) => {
                    orderMap[d.key] = i;
                });
                return orderMap;
            }),
            isValid: computed(() => state.loading || state.selectedColumns.length > 0),
        });

        const sortByRecommendation = () => {
            state.allColumns = state.allColumns.sort((a, b) => {
                if (!state.selectedColumnMap[a.key]) return 1;
                if (!state.selectedColumnMap[b.key]) return -1;
                if (state.recommendedSequenceMap[a.key] === undefined) return 1;
                if (state.recommendedSequenceMap[b.key] === undefined) return -1;
                return state.recommendedSequenceMap[a.key] - (state.recommendedSequenceMap[b.key]);
            });
        };

        const sortByAlphabet = () => {
            state.allColumns = state.allColumns.sort((a, b) => {
                const nameA = a.name.toUpperCase();
                const nameB = b.name.toUpperCase();
                if (!state.selectedColumnMap[a.key]) return 1;
                if (!state.selectedColumnMap[b.key]) return -1;
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
        };

        const onChangeAllSelect = (val) => {
            if (val) {
                state.selectedColumns = [...state.allColumns];
            } else {
                state.selectedColumns = [];
            }
        };

        const getColumns = async (includeOptionalFields = false): Promise<DynamicField[]> => {
            try {
                const options: any = {
                    include_optional_fields: includeOptionalFields,
                };
                const { provider, cloudServiceGroup, cloudServiceType } = props.options;
                if (provider)options.provider = provider;
                if (cloudServiceGroup) options.cloud_service_group = cloudServiceGroup;
                if (cloudServiceType) options.cloud_service_type = cloudServiceType;

                const res = await SpaceConnector.client.addOns.pageSchema.get({
                    resource_type: props.isServerPage ? 'inventory.Server' : props.resourceType,
                    schema: 'table',
                    options,
                });

                schema = res;
                delete schema.options?.search;
                return res.options?.fields || [];
            } catch (e) {
                ErrorHandler.handleError(e);
                schema = {};
                return [];
            }
        };

        const setColumnsDefault = async () => {
            state.allColumns = state.availableColumns;
            state.selectedColumns = state.availableColumns.filter(d => !d.options?.is_optional);
            sortByRecommendation();
        };

        const updatePageSchema = async () => {
            state.loading = true;

            const data = { ...schema };
            if (!data.options) data.options = {};
            data.options.fields = state.selectedColumns;

            const options: any = {};
            const { provider, cloudServiceGroup, cloudServiceType } = props.options;
            if (provider) options.provider = provider;
            if (cloudServiceGroup) options.cloud_service_group = cloudServiceGroup;
            if (cloudServiceType) options.cloud_service_type = cloudServiceType;

            try {
                await SpaceConnector.client.addOns.pageSchema.update({
                    resource_type: props.isServerPage ? 'inventory.Server' : props.resourceType,
                    schema: 'table',
                    data,
                    options,
                });

                showSuccessMessage(i18n.t('COMMON.CUSTOM_FIELD_MODAL.ALT_S_UPDATE_COL'), '', root);
                emit('complete');
                state.proxyVisible = false;
            } catch (e) {
                ErrorHandler.handleRequestError(e, i18n.t('COMMON.CUSTOM_FIELD_MODAL.ALT_E_UPDATE_COL'));
            } finally {
                state.loading = false;
            }
        };

        const initColumns = async () => {
            state.loading = true;
            const [availableColumnRes, currentColumnRes] = await Promise.allSettled([getColumns(true), getColumns(false)]);
            state.availableColumns = availableColumnRes.status === 'fulfilled' ? availableColumnRes.value : [];
            state.currentColumns = currentColumnRes.status === 'fulfilled' ? currentColumnRes.value : [];
            state.allColumns = mergeFields(state.currentColumns, state.availableColumns);
            state.selectedColumns = [...state.currentColumns];
            state.loading = false;
        };

        /* Tags */
        const clearSelectedTags = () => {
            state.selectedAllColumnKeys = state.selectedAllColumnKeys.filter(d => !d.startsWith(TAGS_PREFIX));
        };

        const tagState = reactive({
            loading: true,
            allTags: [] as string[],
        });

        const tagsApiQueryHelper = new ApiQueryHelper().setOnly('tags.key');
        const getTags = async () => {
            tagState.loading = true;
            try {
                let api = SpaceConnector.client;
                props.resourceType.split('.').forEach((d) => {
                    api = api?.[camelCase(d)];
                });

                tagsApiQueryHelper.setFilters([]);
                const { provider, cloudServiceGroup, cloudServiceType } = props.options;
                if (provider) tagsApiQueryHelper.addFilter({ k: 'provider', v: provider, o: '=' });
                if (cloudServiceGroup) tagsApiQueryHelper.addFilter({ k: 'cloud_service_group', v: cloudServiceGroup, o: '=' });
                if (cloudServiceType) tagsApiQueryHelper.addFilter({ k: 'cloud_service_type', v: cloudServiceType, o: '=' });

                const { results } = await api.list({
                    query: tagsApiQueryHelper.data,
                });

                tagState.allTags = uniq(results.map(d => Object.keys(d.tags)).flat());
            } catch (e) {
                ErrorHandler.handleError(e);
                tagState.allTags = [];
            } finally {
                tagState.loading = false;
            }
        };

        watch([() => props.visible, () => props.resourceType], ([visible, resourceType]) => {
            if (visible && resourceType) {
                initColumns();
                if (tagState.allTags.length === 0) getTags();
            }
        }, { immediate: true });

        return {
            ...toRefs(state),
            tagState,
            sortByRecommendation,
            sortByAlphabet,
            onChangeAllSelect,
            setColumnsDefault,
            clearSelectedTags,
            updatePageSchema,
            TAGS_PREFIX,
        };
    },
};
</script>

<style lang="postcss" scoped>
.p-button-modal::v-deep {
    .modal-content {
        height: 100vh;
        .modal-body {
            @apply flex;
            .p-data-loader {
                @apply flex-grow;
                max-height: inherit;
            }
        }
    }
}
.contents-wrapper {
    display: flex;
    width: 100%;
    height: 100%;
    max-height: inherit;
    overflow: hidden;
}

section {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: inherit;
    overflow: hidden;
    &:first-of-type {
        margin-right: 2rem;
    }
    .section-title {
        @apply text-gray-900;
        display: flex;
        justify-content: space-between;
        font-size: 1.125rem;
        line-height: 155%;
        margin-bottom: 0.875rem;
        .invalid-text {
            @apply text-alert;
        }
        .p-button {
            flex-shrink: 0;
        }
    }
    .sort-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
        label {
            @apply text-gray-500;
            flex-grow: 1;
            font-size: 0.75rem;
            line-height: 1.5;
            font-weight: bold;
        }
        .p-button {
            flex-shrink: 0;
            &:first-of-type {
                margin-right: 0.5rem;
            }
        }
    }
}

@screen mobile {
    .contents-wrapper {
        display: block;
        overflow: auto;
        height: 100%;
    }
    section {
        max-height: none;
        &:first-of-type {
            margin-right: 0;
            margin-bottom: 2rem;
        }
    }
}

.attribute-column-section {
    .p-search {
        margin-bottom: 0.531rem;
    }
    header {
        @apply border-t border-b border-gray-900 text-gray-900;
        display: flex;
        align-items: center;
        padding: 0.375rem 0.5rem;
        font-weight: bold;
        line-height: 1.2;
        font-size: 0.875rem;
        .p-checkbox {
            margin-right: 0.25rem;
        }
        .text {
            line-height: 1.5;
        }
    }

    .column-items-wrapper {
        flex-grow: 1;
        overflow: auto;
    }
}

</style>
