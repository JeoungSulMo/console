<template>
    <section class="right-contents-container">
        <p-pane-layout class="main-table-wrapper">
            <article class="table-header">
                <div class="left-section">
                    <p-button style-type="secondary-dark"
                              icon="ic_plus_bold"
                              :disabled="disableCreateBtn"
                              @click="openAPIKeyConfirmModal"
                              @confirm="confirm"
                    >
                        {{ $t('IDENTITY.USER.MAIN.CREATE_API_KEY') }}
                    </p-button>
                    <p-select-dropdown class="dropdown-btn"
                                       :items="dropdownMenu"
                                       :disabled="disabled"
                                       @select="onSelectDropdown"
                    >
                        {{ $t('IDENTITY.USER.MAIN.ACTION') }}
                    </p-select-dropdown>
                </div>
                <div class="table-desc">
                    {{ $t('IDENTITY.USER.MAIN.API_TABLE_DESC') }}
                </div>
            </article>
            <p-data-table
                :items="items"
                :loading="loading"
                :fields="fields"
                :select-index.sync="selectedIndex"
                :striped="false"
                :selectable="true"
                :multi-select="false"
            >
                <template #col-state-format="{value}">
                    <p-status v-bind="userStateFormatter(value)" class="capitalize" />
                </template>
                <template #col-created_at-format="{value}">
                    {{ iso8601Formatter(value, timezone) }}
                </template>
            </p-data-table>
        </p-pane-layout>
        <user-a-p-i-key-modal v-if="visible && !modalState.loading"
                              :visible.sync="visible"
                              :api-key-item="modalState.items"
                              :endpoints="modalState.endpoints"
                              @clickButton="confirm"
        />
        <p-table-check-modal
            :fields="checkModalState.fields"
            :mode="checkModalState.mode"
            :items="selectedItems"
            :header-title="checkModalState.title"
            :sub-title="checkModalState.subTitle"
            :theme-color="checkModalState.themeColor"
            :loading="checkModalState.loading"
            size="md"
            :visible.sync="checkModalState.visible"
            @confirm="checkModalConfirm"
        >
            <template #col-state-format="{value}">
                <p-status v-bind="userStateFormatter(value)" class="capitalize" />
            </template>
            <template #col-created_at-format="{value}">
                {{ iso8601Formatter(value, timezone) }}
            </template>
        </p-table-check-modal>
    </section>
</template>

<script lang="ts">
import type { ComponentRenderProxy, UnwrapRef } from '@vue/composition-api';
import {
    computed, getCurrentInstance, reactive, toRefs, watch,
} from '@vue/composition-api';

import { iso8601Formatter } from '@spaceone/console-core-lib';
import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import { ApiQueryHelper } from '@spaceone/console-core-lib/space-connector/helper';
import {
    PButton, PDataTable, PPaneLayout, PTableCheckModal, PStatus, PSelectDropdown,
} from '@spaceone/design-system';
import type { MenuItem } from '@spaceone/design-system/dist/src/inputs/context-menu/type';
import type { TranslateResult } from 'vue-i18n';


import type { TimeStamp } from '@/models';
import { store } from '@/store';

import {
    showSuccessMessage, showLoadingMessage, hideLoadingMessage,
} from '@/lib/helper/notice-alert-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { userStateFormatter } from '@/services/administration/iam/user/lib/helper';
import UserAPIKeyModal from '@/services/my-page/my-account/user-api-key/modules/APIKeyModal.vue';

export interface APIKeyItem {
    api_key: string;
    api_key_id: string;
    created_at: TimeStamp;
    domain_id?: string;
    last_accessed_at?: TimeStamp;
    state?: string;
    user_id?: string;
}

interface ModalItem {
    loading?: boolean;
    items: APIKeyItem;
    endpoints: any;
}

interface EndpointItem {
    endpoint: string;
    name: string;
    service: string;
    state?: string;
    version?: string;
}

export default {
    name: 'UserAPIKey',
    components: {
        UserAPIKeyModal,
        PStatus,
        PPaneLayout,
        PButton,
        PSelectDropdown,
        PDataTable,
        PTableCheckModal,
    },
    props: {
        userId: {
            type: String,
            default: '',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    setup(props) {
        const vm = getCurrentInstance()?.proxy as ComponentRenderProxy;
        const state = reactive({
            loading: false,
            fields: [
                { name: 'api_key_id', label: 'API Key ID' },
                { name: 'state', label: 'State' },
                { name: 'created_at', label: 'Created' },
            ],
            items: [] as APIKeyItem[],
            selectedIndex: [],
            selectedItems: computed(() => state.selectedIndex.map(i => state.items[i])),
            dropdownMenu: computed(() => ([
                {
                    type: 'item', name: 'enable', label: vm.$t('IDENTITY.USER.MAIN.ENABLE'), disabled: state.selectedIndex.length !== 1,
                },
                { type: 'divider' },
                {
                    type: 'item', name: 'disable', label: vm.$t('IDENTITY.USER.MAIN.DISABLE'), disabled: state.selectedIndex.length !== 1,
                },
                { type: 'divider' },
                {
                    type: 'item', name: 'delete', label: vm.$t('IDENTITY.USER.MAIN.DELETE'), disabled: state.selectedIndex.length !== 1,
                },
            ] as MenuItem[])),
            visible: false,
            user: props.userId || '',
            timezone: computed(() => store.state.user.timezone),
            disableCreateBtn: computed(() => state.items.length >= 2 || props.disabled),
        });

        const modalState: UnwrapRef<ModalItem> = reactive({
            loading: false,
            items: [] as unknown as APIKeyItem,
            endpoints: {},
        });

        const checkModalState = reactive({
            fields: computed(() => [
                { name: 'api_key_id', label: 'API Key ID' },
                { name: 'state', label: 'State' },
                { name: 'created_at', label: 'Created' },
            ]),
            mode: '',
            items: {} as APIKeyItem,
            title: '' as TranslateResult,
            subTitle: '' as TranslateResult,
            themeColor: undefined as string | undefined,
            visible: false,
            loading: false,
        });

        const onSelect = async (index) => {
            state.selectedIndex = index;
        };

        const apiQueryHelper = new ApiQueryHelper();
        const listAPIKey = async (userId) => {
            state.loading = true;
            try {
                apiQueryHelper.setSort('created_at')
                    .setFilters([{ k: 'user_id', v: userId, o: '=' }]);

                const res = await SpaceConnector.client.identity.apiKey.list({
                    query: apiQueryHelper.data,
                });
                state.items = res.results;
            } catch (e) {
                ErrorHandler.handleError(e);
                state.items = [];
            } finally {
                state.loading = false;
            }
        };

        const openAPIKeyConfirmModal = async () => {
            try {
                modalState.loading = true;
                showLoadingMessage('Create API Key', '', vm.$root);
                const resp = await SpaceConnector.client.identity.apiKey.create({
                    user_id: state.user,
                });
                modalState.items = resp;
                state.visible = true;
            } catch (e) {
                ErrorHandler.handleRequestError(e, vm.$t('IDENTITY.USER.API_KEY.ALT_E_CREATE_SCHEDULER'));
            } finally {
                modalState.loading = false;
                hideLoadingMessage(vm.$root);
                await listAPIKey(state.user);
            }
        };

        const confirm = () => {
            state.visible = false;
        };

        const enableAPIKey = async (item) => {
            try {
                await SpaceConnector.client.identity.apiKey.enable({
                    api_key_id: item[0].api_key_id,
                });
                showSuccessMessage(vm.$t('IDENTITY.USER.MAIN.ALT_S_ENABLE_API_KEY'), '', vm.$root);
            } catch (e) {
                ErrorHandler.handleRequestError(e, vm.$t('IDENTITY.USER.MAIN.ALT_S_ENABLE_API_KEY'));
            } finally {
                await listAPIKey(state.user);
                checkModalState.visible = false;
            }
        };

        const disableAPIKey = async (item) => {
            try {
                await SpaceConnector.client.identity.apiKey.disable({
                    api_key_id: item[0].api_key_id,
                });
                showSuccessMessage(vm.$t('IDENTITY.USER.MAIN.ALT_S_DISABLE_API_KEY'), '', vm.$root);
            } catch (e) {
                ErrorHandler.handleRequestError(e, vm.$t('IDENTITY.USER.MAIN.ALT_E_DISABLE_API_KEY'));
            } finally {
                await listAPIKey(state.user);
                checkModalState.visible = false;
            }
        };

        const deleteAPIKey = async (item) => {
            try {
                await SpaceConnector.client.identity.apiKey.delete({
                    api_key_id: item[0].api_key_id,
                });
                showSuccessMessage(vm.$t('IDENTITY.USER.MAIN.ALT_S_DELETE_API_KEY'), '', vm.$root);
            } catch (e) {
                ErrorHandler.handleRequestError(e, vm.$t('IDENTITY.USER.MAIN.ALT_E_DELETE_API_KEY'));
            } finally {
                state.selectedIndex = [];
                await listAPIKey(state.user);
                checkModalState.visible = false;
            }
        };

        const onClickEnable = async () => {
            checkModalState.mode = 'enable';
            checkModalState.title = vm.$t('IDENTITY.USER.API_KEY.ENABLE_MODAL_TITLE') as string;
            checkModalState.subTitle = vm.$tc('IDENTITY.USER.API_KEY.ENABLE_MODAL_DESC', state.selectedIndex.length);
            checkModalState.themeColor = 'safe';
            checkModalState.visible = true;
        };

        const onClickDisable = async () => {
            checkModalState.mode = 'disable';
            checkModalState.title = vm.$t('IDENTITY.USER.API_KEY.DISABLE_MODAL_TITLE') as string;
            checkModalState.subTitle = vm.$tc('IDENTITY.USER.API_KEY.DISABLE_MODAL_DESC', state.selectedIndex.length);
            checkModalState.themeColor = 'alert';
            checkModalState.visible = true;
        };

        const onClickDelete = async () => {
            checkModalState.mode = 'delete';
            checkModalState.title = vm.$t('IDENTITY.USER.API_KEY.DELETE_MODAL_TITLE') as string;
            checkModalState.subTitle = vm.$tc('IDENTITY.USER.API_KEY.DELETE_MODAL_DESC', state.selectedIndex.length);
            checkModalState.themeColor = 'alert';
            checkModalState.visible = true;
        };

        const onSelectDropdown = (name) => {
            switch (name) {
            case 'enable': onClickEnable(); break;
            case 'disable': onClickDisable(); break;
            case 'delete': onClickDelete(); break;
            default: break;
            }
        };

        const checkModalConfirm = async (item) => {
            checkModalState.loading = true;
            if (checkModalState.mode === 'delete') await deleteAPIKey(item);
            else if (checkModalState.mode === 'enable') await enableAPIKey(item);
            else if (checkModalState.mode === 'disable') await disableAPIKey(item);
            checkModalState.loading = false;
        };

        const listEndpoints = async () => {
            state.loading = true;
            try {
                const { results } = await SpaceConnector.client.identity.endpoint.list();
                const filteredEndpointItem: EndpointItem[] = results.filter(d => d.service === 'inventory' || d.service === 'statistics' || d.service === 'monitoring'
                    || d.service === 'cost-analysis' || d.service === 'notification') || [];

                const endpoints = {};
                filteredEndpointItem.forEach((data) => {
                    const service = data.service;
                    const link = data.endpoint;
                    endpoints[service] = link;
                });
                modalState.endpoints = {
                    endpoints,
                };
            } catch (e) {
                ErrorHandler.handleError(e);
                modalState.endpoints = {};
            } finally {
                state.loading = false;
            }
        };

        watch(() => props.userId, async (after) => {
            if (after) {
                state.user = after;
                await listAPIKey(state.user);
            }
        }, { immediate: true });

        (async () => {
            await listAPIKey(state.user);
            await listEndpoints();
        })();

        return {
            ...toRefs(state),
            modalState,
            checkModalState,
            iso8601Formatter,
            userStateFormatter,
            onSelect,
            onSelectDropdown,
            checkModalConfirm,
            openAPIKeyConfirmModal,
            confirm,
        };
    },

};
</script>

<style lang="postcss" scoped>
.main-table-wrapper {
    width: 100%;
    height: 100%;
    margin-bottom: 1rem;
}

.table-header {
    display: flex;
    justify-content: space-between;
    padding-left: 1rem;
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
    .left-section {
        display: inherit;
    }
    .dropdown-btn {
        margin-left: 1rem;
    }
    .table-desc {
        @apply text-gray-500;
        padding-right: 1rem;
        font-size: 0.875rem;
        line-height: 150%;
    }
}
</style>
