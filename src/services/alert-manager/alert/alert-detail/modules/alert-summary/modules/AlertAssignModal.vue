<template>
    <p-button-modal
        class="alert-assign-modal"
        :header-title="$t('MONITORING.ALERT.DETAIL.ASSIGN_MODAL_TITLE')"
        size="md"
        :disabled="!selectedUserID"
        :visible.sync="proxyVisible"
        :loading="modalLoading"
        @confirm="onClickReassign"
    >
        <template #body>
            <p-toolbox-table :excel-visible="false"
                             selectable
                             sortable
                             :multi-select="false"
                             :fields="fields"
                             :items="items"
                             :select-index.sync="selectIndex"
                             :loading="loading"
                             :total-count="totalCount"
                             @change="onChangeTable"
                             @refresh="onChangeTable()"
            >
                <template #col-resource_id-format="{ value }">
                    {{ users[value].name }}
                </template>
            </p-toolbox-table>
        </template>
    </p-button-modal>
</template>

<script lang="ts">

import {
    computed, reactive, toRefs,
} from '@vue/composition-api';

import { getApiQueryWithToolboxOptions } from '@spaceone/console-core-lib/component-util/toolbox';
import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import { ApiQueryHelper } from '@spaceone/console-core-lib/space-connector/helper';
import { PButtonModal, PToolboxTable } from '@spaceone/design-system';
import { uniqBy } from 'lodash';

import { store } from '@/store';
import { i18n } from '@/translations';

import { showSuccessMessage } from '@/lib/helper/notice-alert-helper';


import ErrorHandler from '@/common/composables/error/errorHandler';
import { useProxyValue } from '@/common/composables/proxy-state';

import { alertManagerStore } from '@/services/alert-manager/store';
import type { ProjectMember } from '@/services/alert-manager/type';


export default {
    name: 'AlertAssignModal',
    components: {
        PButtonModal,
        PToolboxTable,
    },
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
        projectId: {
            type: String,
            default: undefined,
        },
        alertId: {
            type: String,
            default: undefined,
        },
    },
    setup(props, { emit, root }) {
        const state = reactive({
            modalLoading: false,
            proxyVisible: useProxyValue('visible', props, emit),
            //
            loading: true,
            selectIndex: [] as number[],
            selectedUserID: computed(() => state.items[state.selectIndex]?.resource_id),
            fields: [
                { label: 'User ID', name: 'user_id', type: 'item' },
                { label: 'Name', name: 'resource_id', type: 'item' },
            ],
            items: [] as any,
            totalCount: 0,
            users: computed(() => store.state.reference.user.items),
        });

        const reassignMember = async () => {
            try {
                await alertManagerStore.dispatch('alert/updateAlertData', {
                    updateParams: {
                        assignee: state.selectedUserID,
                    },
                    alertId: props.alertId,
                });
                showSuccessMessage(i18n.t('MONITORING.ALERT.DETAIL.HEADER.ALT_S_ASSIGN_MEMBER'), '', root);
            } catch (e) {
                ErrorHandler.handleRequestError(e, i18n.t('MONITORING.ALERT.DETAIL.HEADER.ALT_E_ASSIGN_MEMBER'));
            } finally {
                state.proxyVisible = false;
            }
        };

        const onClickReassign = async () => {
            await reassignMember();
        };

        const assignApiQueryHelper = new ApiQueryHelper()
            .setPageStart(1).setPageLimit(15)
            .setSort('resource_id', true);

        let assignApiQuery = assignApiQueryHelper.data;

        const listMemberInProject = async () => {
            try {
                state.loading = true;
                const { results, total_count } = await SpaceConnector.client.identity.project.member.list({
                    project_id: props.projectId,
                    query: assignApiQuery,
                    include_parent_member: true,
                });
                const filteredResult = uniqBy(results, 'resource_id') as unknown as ProjectMember[];
                state.items = filteredResult.map<ProjectMember>(d => ({
                    ...d,
                    user_id: d.resource_id,
                }));
                state.totalCount = total_count;
            } catch (e) {
                ErrorHandler.handleError(e);
                state.items = [];
            } finally {
                state.loading = false;
            }
        };

        const onChangeTable = async (options: any = {}) => {
            assignApiQuery = getApiQueryWithToolboxOptions(assignApiQueryHelper, options) ?? assignApiQuery;
            await listMemberInProject();
        };

        // LOAD REFERENCE STORE
        (async () => {
            await Promise.allSettled([
                listMemberInProject(),
                store.dispatch('reference/user/load'),
            ]);
        })();

        return {
            ...toRefs(state),
            onClickReassign,
            onChangeTable,
        };
    },
};
</script>
