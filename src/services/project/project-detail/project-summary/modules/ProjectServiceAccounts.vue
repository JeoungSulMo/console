<template>
    <widget-layout :title="$t('COMMON.WIDGETS.SERVICE_ACCOUNT_TABLE.TITLE')" class="service-accounts-table">
        <p-data-table :fields="fields"
                      :sortable="false"
                      :selectable="false"
                      :bordered="false"
                      :loading="loading"
                      :items="items"
        >
            <template #col-provider-format="{ value }">
                <router-link :to="value.to" class="link-text" :style="{color: value.color}">
                    {{ value.label }}
                </router-link>
            </template>
            <template #col-service_account-format="{ value }">
                <router-link :to="value.to" class="link-text">
                    {{ value.label }}
                </router-link>
            </template>
            <template #col-server-format="{ value }">
                <router-link :to="value.to" class="link-text">
                    {{ value.count }}
                </router-link>
            </template>
            <template #col-database-format="{ value }">
                <router-link :to="value.to" class="link-text">
                    {{ value.count }}
                </router-link>
            </template>
            <template #col-storage-format="{ value }">
                <router-link :to="value.to" class="link-text">
                    {{ value.count }}
                </router-link>
            </template>
        </p-data-table>
    </widget-layout>
</template>

<script lang="ts">
import {
    computed, reactive, toRefs, watch,
} from '@vue/composition-api';

import { byteFormatter } from '@spaceone/console-core-lib';
import { QueryHelper } from '@spaceone/console-core-lib/query';
import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import { PDataTable } from '@spaceone/design-system';
import { isEmpty } from 'lodash';
import type { Location } from 'vue-router';

import { store } from '@/store';
import { i18n } from '@/translations';

import { arrayToQueryString, primitiveToQueryString } from '@/lib/router-query-string';

import WidgetLayout from '@/common/components/layouts/WidgetLayout.vue';
import ErrorHandler from '@/common/composables/error/errorHandler';

import { ASSET_INVENTORY_ROUTE } from '@/services/asset-inventory/route-config';


export const DATA_TYPE = {
    SERVER: 'SERVER',
    DATABASE: 'DATABASE',
    STORAGE: 'STORAGE',
} as const;
enum CLOUD_SERVICE_LABEL {
    SERVER = 'Server',
    DATABASE = 'Database',
    STORAGE = 'Storage',
}

interface TableColumnData {
    label?: string;
    count?: number;
    color?: string;
    to: Location;
}
interface Item {
    [key: string]: TableColumnData;
}

export default {
    name: 'ProjectServiceAccounts',
    components: {
        WidgetLayout,
        PDataTable,
    },
    props: {
        projectId: {
            type: String,
            default: undefined,
        },
    },
    setup(props) {
        const queryHelper = new QueryHelper();

        const state = reactive({
            loading: true,
            providers: computed(() => store.state.reference.provider.items),
            items: [] as Item[],
            fields: computed(() => [
                { name: 'provider', label: i18n.t('COMMON.WIDGETS.SERVICE_ACCOUNT_TABLE.PROVIDER') },
                { name: 'service_account', label: i18n.t('COMMON.WIDGETS.SERVICE_ACCOUNT_TABLE.ACCOUNT_NAME') },
                { name: 'server', label: i18n.t('COMMON.WIDGETS.SERVICE_ACCOUNT_TABLE.SERVER') },
                { name: 'database', label: i18n.t('COMMON.WIDGETS.SERVICE_ACCOUNT_TABLE.DATABASE') },
                { name: 'storage', label: i18n.t('COMMON.WIDGETS.SERVICE_ACCOUNT_TABLE.STORAGE') },
            ]),
        });

        /* Util */
        const getLocation = (type, provider, serviceAccountId) => {
            queryHelper.setFilters([
                { k: 'collection_info.service_accounts', v: serviceAccountId, o: '=' },
                { k: 'project_id', o: '=', v: props.projectId },
            ]);

            const location: Location = {
                name: ASSET_INVENTORY_ROUTE.CLOUD_SERVICE._NAME,
                query: {
                    provider: primitiveToQueryString(provider),
                    service: CLOUD_SERVICE_LABEL[type],
                    filters: queryHelper.rawQueryStrings,
                },
            };
            return location;
        };
        const getConvertedData = (rawData): Item[] => rawData.map(item => ({
            provider: {
                label: state.providers[item.provider]?.label,
                color: state.providers[item.provider]?.color,
                to: {
                    name: ASSET_INVENTORY_ROUTE.SERVICE_ACCOUNT._NAME,
                    query: { provider: item.provider },
                },
            },
            service_account: {
                label: item.service_account_name,
                to: {
                    name: ASSET_INVENTORY_ROUTE.SERVICE_ACCOUNT._NAME,
                    query: {
                        provider: item.provider,
                        filters: arrayToQueryString([item.service_account_id]),
                    },
                },
            },
            server: {
                count: item.server_count || 0,
                to: getLocation(DATA_TYPE.SERVER, item.provider, item.service_account_id),
            },
            database: {
                count: item.database_count || 0,
                to: getLocation(DATA_TYPE.DATABASE, item.provider, item.service_account_id),
            },
            storage: {
                count: byteFormatter(item.storage_size) || 0,
                to: getLocation(DATA_TYPE.STORAGE, item.provider, item.service_account_id),
            },
        }));

        /* api */
        const getData = async () => {
            state.loading = true;
            try {
                const { results } = await SpaceConnector.client.statistics.topic.serviceAccountSummary({
                    project_id: props.projectId,
                });
                state.items = getConvertedData(results);
            } catch (e) {
                ErrorHandler.handleError(e);
                state.items = [];
            } finally {
                state.loading = false;
            }
        };

        // LOAD REFERENCE STORE
        (async () => {
            await store.dispatch('reference/provider/load');
        })();

        /* Watcher */
        watch(() => state.providers, (providers) => {
            // todo: have to change to reference getters
            if (!isEmpty(providers)) {
                getData();
            }
        }, { immediate: true });


        return {
            ...toRefs(state),
        };
    },
};
</script>

<style lang="postcss" scoped>
.service-accounts-table {
    .p-data-table::v-deep {
        @apply rounded-xs;
        min-height: 5rem;
        margin-top: 0.75rem;

        th {
            @apply bg-gray-100 text-gray-400;
            height: 1.5rem;
            border: none;
            font-size: 0.75rem;
            font-weight: bold;
        }
        td {
            height: 2rem;
            .link-text {
                &:hover {
                    text-decoration: underline;
                }
            }
        }
    }
}
</style>
