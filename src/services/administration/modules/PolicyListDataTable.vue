<template>
    <section class="policy-list-data-table">
        <p-toolbox-table
            :exportable="false"
            :sortable="false"
            :searchable="!selectable"
            :refreshable="!selectable"
            search-type="query"
            :loading="loading"
            :fields="fields"
            :items="items"
            :query-tags="queryTags"
            :key-item-sets="keyItemSets"
            :value-handler-map="policySearchHandler.valueHandlerMap"
            :selectable="selectable"
            :select-index="selectedIndices"
            :pagination-visible="false"
            :page-size-changeable="false"
            @change="handleChange"
            @refresh="handleRefresh"
            @update:selectIndex="handleUpdateSelectIndex"
        >
            <template #toolbox-top>
                <slot name="panel-top" />
                <div class="filter">
                    <span class="filter-label">{{ $t('IAM.POLICY.FORM.TYPE') }}</span>
                    <p-select-status
                        v-for="(item, index) in policyTypeList"
                        :key="index"
                        v-model="selectedType"
                        :value="item.name"
                        @change="handleChangePolicyType"
                    >
                        {{ item.label }}
                    </p-select-status>
                </div>
            </template>
            <template #col-policy_type-format="{ value }">
                <p-badge outline :style-type="policyTypeBadgeColorFormatter(value)">
                    {{ value ? value : POLICY_TYPES.MANAGED }}
                </p-badge>
            </template>
            <template #col-policy_id-format="{ value, item }">
                <template v-if="value">
                    <p-anchor
                        :icon-visible="anchorIconVisible"
                        highlight
                        :to="{
                            name: ADMINISTRATION_ROUTE.IAM.POLICY.DETAIL._NAME,
                            params: { id: item.policy_id },
                            query: { type: item.policy_type }
                        }"
                    >
                        {{ value }}
                    </p-anchor>
                </template>
            </template>
            <template #col-created_at-format="{ value }">
                {{ policyCreatedAtFormatter(value, selectedType, timezone) }}
            </template>
            <template #toolbox-table-bottom>
                <slot name="toolbox-table-bottom" />
            </template>
        </p-toolbox-table>
    </section>
</template>

<script lang="ts">
import type { PropType } from '@vue/composition-api';
import {
    computed, reactive, toRefs, watch,
} from '@vue/composition-api';

import { setApiQueryWithToolboxOptions } from '@spaceone/console-core-lib/component-util/toolbox';
import type { ToolboxOptions } from '@spaceone/console-core-lib/component-util/toolbox/type';
import { ApiQueryHelper } from '@spaceone/console-core-lib/space-connector/helper';
import {
    PAnchor, PBadge, PSelectStatus, PToolboxTable,
} from '@spaceone/design-system';
import type { QueryTag } from '@spaceone/design-system/dist/src/inputs/search/query-search-tags/type';
import type { KeyItemSet } from '@spaceone/design-system/dist/src/inputs/search/query-search/type';
import { filter } from 'lodash';

import { SpaceRouter } from '@/router';
import { store } from '@/store';

import { replaceUrlQuery } from '@/lib/router-query-string';

import type { PolicyTypes } from '@/services/administration/iam/policy/lib/config';
import { POLICY_TYPES } from '@/services/administration/iam/policy/lib/config';
import {
    makeCustomValueHandler,
    policyCreatedAtFormatter,
    policyTypeBadgeColorFormatter,
} from '@/services/administration/iam/policy/lib/helper';
import type { PolicyDataModel } from '@/services/administration/iam/policy/lib/type';
import type { Policy } from '@/services/administration/iam/role/type';
import { ADMINISTRATION_ROUTE } from '@/services/administration/route-config';
import { administrationStore } from '@/services/administration/store';


const getFilteredItems = (queryTags: QueryTag[], policyList: PolicyDataModel[], selectedType: PolicyTypes): PolicyDataModel[] => {
    // 1. filter by type
    const _typeFilteredItems = filter(policyList, selectedType === POLICY_TYPES.ALL ? {} : { policy_type: selectedType });

    // 2. filter by query tags
    let results = [..._typeFilteredItems];
    queryTags.forEach((queryTag: any) => {
        const regex = RegExp(queryTag.value.name, 'i');
        results = filter(results, item => regex.test(item[queryTag.key?.name]));
    });
    return results;
};

export default {
    name: 'PolicyListDataTable',
    components: {
        PToolboxTable,
        PSelectStatus,
        PAnchor,
        PBadge,
    },
    props: {
        selectable: {
            type: Boolean,
            default: false,
        },
        anchorIconVisible: {
            type: Boolean,
            default: true,
        },
        initialPolicyList: {
            type: Array as PropType<Policy[]>,
            default: () => ([]),
        },
    },
    setup(props, { emit }) {
        const currentRoute = SpaceRouter.router.currentRoute;
        const policyListApiQueryHelper = new ApiQueryHelper().setFiltersAsRawQueryString(currentRoute.query?.filters);
        const keyItemSets: KeyItemSet[] = [{
            title: 'Properties',
            items: [
                { name: 'name', label: 'Name' },
                { name: 'policy_id', label: 'ID' },
            ],
        }];
        const state = reactive({
            loading: computed(() => administrationStore.state.policy.policyListLoading),
            policyList: computed(() => administrationStore.state.policy.policyList),
            policyTypeList: [
                { name: POLICY_TYPES.MANAGED, label: 'Managed' },
                { name: POLICY_TYPES.CUSTOM, label: 'Custom' },
                { name: POLICY_TYPES.ALL, label: 'All' },
            ],
            selectedType: currentRoute?.query?.policy_type ?? POLICY_TYPES.MANAGED as PolicyTypes,
            fields: [
                { name: 'name', label: 'Name' },
                { name: 'policy_type', label: 'Type' },
                { name: 'policy_id', label: 'ID', sortable: false },
                { name: 'tags.description', label: 'Description', sortable: false },
                { name: 'created_at', label: 'Created' },
            ],
            items: computed<PolicyDataModel[]>(() => {
                if (!state.policyList) return [];
                return getFilteredItems(state.queryTags, state.policyList, state.selectedType);
            }),
            timezone: computed(() => store.state.user.timezone),
            totalCount: computed(() => administrationStore.state.policy.totalCount),
            queryTags: policyListApiQueryHelper.setKeyItemSets(keyItemSets).queryTags as QueryTag[],
            selectedIdMap: {} as Record<string, PolicyTypes>,
            selectedIndices: computed(() => state.items.reduce((results, d, i) => {
                if (state.selectedIdMap[d.policy_id]) results.push(i);
                return results;
            }, [] as number[])),
        });
        const policySearchHandler = reactive({
            valueHandlerMap: computed(() => ({
                name: makeCustomValueHandler(state.items, 'name'),
                policy_id: makeCustomValueHandler(state.items, 'policy_id'),
            })),
        });

        /* Api */
        const listPolicies = async () => {
            await administrationStore.dispatch('policy/fetchPolicyList', policyListApiQueryHelper.data);
        };

        /* Event */
        const handleChange = async (options: ToolboxOptions = {}) => {
            setApiQueryWithToolboxOptions(policyListApiQueryHelper, options);
            if (options.queryTags !== undefined) {
                await replaceUrlQuery('filters', policyListApiQueryHelper.rawQueryStrings);
                state.queryTags = options.queryTags;
            }
        };

        // const handleExport = async () => {
        //     await store.dispatch('file/downloadExcel', {
        //         url: `/${policyTypeURIFormatter(state.selectedType)}/policy/list`,
        //         param: {
        //             include_parent_member: true,
        //             repository_id: state.selectedType === PolicyTypes.MANAGED ? DUMMY_REPO_ID : '',
        //             query: policyListApiQueryHelper.data,
        //         },
        //         fields: [
        //             { name: 'Name', key: 'name' },
        //             { name: 'Type', key: 'type' },
        //             { name: 'ID', key: 'policy_id' },
        //             { name: 'Description', key: 'tags' },
        //             { name: 'Created', key: 'created_at' },
        //         ],
        //         file_name_prefix: FILE_NAME_PREFIX.policy,
        //     });
        // };

        const handleRefresh = () => {
            state.selectedIdMap = [];
            emit('update-selected-policy-list', []);
            listPolicies();
        };

        const handleChangePolicyType = async () => {
            state.queryTags = [];
            await replaceUrlQuery('policy_type', state.selectedType);
        };

        const handleUpdateSelectIndex = (selectedIndices: number[]) => {
            const selectedIdMap: Record<string, PolicyTypes> = {};
            if (state.selectedType !== POLICY_TYPES.ALL) {
                const currentPolicyType = state.selectedType;
                Object.entries(state.selectedIdMap).forEach(([id, policyType]) => {
                    if (policyType !== currentPolicyType) {
                        selectedIdMap[id] = policyType as PolicyTypes;
                    }
                });
            }
            selectedIndices.forEach((idx) => {
                const item = state.items[idx];
                selectedIdMap[item.policy_id] = item.policy_type;
            });
            state.selectedIdMap = selectedIdMap;

            const selectedPolicyList = Object.entries(selectedIdMap).map(([id, policyType]) => ({
                policy_id: id,
                policy_type: policyType,
            }));
            emit('update-selected-policy-list', selectedPolicyList);
        };

        /* Watcher */
        watch(() => state.totalCount as number, (value: number) => {
            emit('update-total-count', value);
        });
        watch(() => props.initialPolicyList, (initialPolicyList: Policy[]) => {
            if (initialPolicyList.length) {
                emit('update-selected-policy-list', initialPolicyList);
            }
        });

        /* Init */
        (async () => {
            await listPolicies();
            const selectedIdMap = {};
            props.initialPolicyList.forEach((d) => {
                selectedIdMap[d.policy_id] = d.policy_type;
            });
            state.selectedIdMap = selectedIdMap;
        })();

        return {
            ...toRefs(state),
            policySearchHandler,
            ADMINISTRATION_ROUTE,
            POLICY_TYPES,
            policyTypeBadgeColorFormatter,
            policyCreatedAtFormatter,
            handleChange,
            handleRefresh,
            handleChangePolicyType,
            handleUpdateSelectIndex,
            keyItemSets,
        };
    },
};
</script>

<style lang="postcss" scoped>
.policy-list-data-table {
    @apply mx-0;
    max-width: 100%;
    .filter {
        @apply flex items-center;
        margin: 1.625rem 1rem 1.125rem;
        .filter-label {
            @apply text-gray-400;
            margin-right: 1rem;
            font-size: 0.875rem;
            line-height: 1.15;
        }
        .p-status {
            margin-right: 1rem;
        }
    }
}
.p-toolbox-table::v-deep {
    .p-toolbox {
        padding-top: 0;
    }
}
</style>
