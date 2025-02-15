<template>
    <div>
        <p-select-dropdown class="more-button"
                           :items="moreMenuItems"
                           style-type="icon-button"
                           button-icon="ic_more"
                           menu-position="left"
                           @select="handleSelectMoreMenu"
        />
        <cost-dashboard-duplicate-modal
            :visible.sync="duplicateModalVisible"
            :dashboard="dashboard"
            :manage-disabled="manageDisabled"
        />
        <delete-modal :header-title="checkDeleteState.headerTitle"
                      :visible.sync="checkDeleteState.visible"
                      :loading="checkDeleteState.loading"
                      @confirm="handleDeleteDashboardConfirm"
        />
    </div>
</template>

<script lang="ts">
import { computed, reactive, toRefs } from '@vue/composition-api';

import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import { PSelectDropdown } from '@spaceone/design-system';
import { cloneDeep } from 'lodash';

import { SpaceRouter } from '@/router';
import { i18n } from '@/translations';

import DeleteModal from '@/common/components/modals/DeleteModal.vue';
import ErrorHandler from '@/common/composables/error/errorHandler';

import { DASHBOARD_TYPE } from '@/services/cost-explorer/cost-dashboard/lib/config';
import CostDashboardDuplicateModal
    from '@/services/cost-explorer/cost-dashboard/modules/CostDashboardDuplicateModal.vue';
import type { DashboardInfo } from '@/services/cost-explorer/cost-dashboard/type';
import { COST_EXPLORER_ROUTE } from '@/services/cost-explorer/route-config';
import { costExplorerStore } from '@/services/cost-explorer/store';

const MENU = Object.freeze({
    DUPLICATE: 'duplicate',
    DELETE: 'delete',
    SET_HOME: 'setHome',
} as const);

export default {
    name: 'CostDashboardMoreMenu',
    components: {
        CostDashboardDuplicateModal,
        PSelectDropdown,
        DeleteModal,
    },
    props: {
        dashboard: {
            type: Object as () => DashboardInfo,
            default: () => {},
        },
        dashboardId: {
            type: String,
            default: undefined,
        },
        manageDisabled: {
            type: Boolean,
            default: false,
        },
    },
    setup(props) {
        const defaultMenuItems = computed(() => [
            { name: MENU.DUPLICATE, label: i18n.t('BILLING.COST_MANAGEMENT.DASHBOARD.DUPLICATE'), disabled: false },
            { name: MENU.DELETE, label: i18n.t('BILLING.COST_MANAGEMENT.DASHBOARD.DELETE'), disabled: false },
            { name: MENU.SET_HOME, label: i18n.t('BILLING.COST_MANAGEMENT.DASHBOARD.SET_HOME'), disabled: false },
        ]);

        const state = reactive({
            moreMenuItems: computed(() => {
                const menuItems = cloneDeep(defaultMenuItems.value);
                if (state.homeDashboardId === props.dashboardId) {
                    menuItems[1].disabled = true;
                    menuItems[2].disabled = true;
                    return menuItems;
                }
                if (state.dashboardType === DASHBOARD_TYPE.PUBLIC && props.manageDisabled) {
                    if (state.homeDashboardId === props.dashboardId) {
                        menuItems[1].disabled = true;
                        menuItems[2].disabled = true;
                    }
                    menuItems[1].disabled = true;
                    return menuItems;
                }
                return defaultMenuItems.value;
            }),
            homeDashboardId: computed<string|undefined>(() => costExplorerStore.getters.homeDashboardId),
            duplicateModalVisible: false,
            dashboardType: computed(() => (Object.prototype.hasOwnProperty.call(props.dashboard, 'public_dashboard_id') ? DASHBOARD_TYPE.PUBLIC : DASHBOARD_TYPE.USER)),
        });

        const checkDeleteState = reactive({
            visible: false,
            headerTitle: i18n.t('BILLING.COST_MANAGEMENT.DASHBOARD.CHECK_DELETE_MODAL_TITLE'),
            loading: false,
        });

        const handleClickDeleteDashboard = () => {
            checkDeleteState.visible = true;
        };
        const handleDeleteDashboardConfirm = async () => {
            try {
                checkDeleteState.loading = true;
                if (props.dashboardId?.startsWith('user')) {
                    await SpaceConnector.client.costAnalysis.userDashboard.delete({
                        user_dashboard_id: props.dashboardId,
                    });
                } else {
                    await SpaceConnector.client.costAnalysis.publicDashboard.delete({
                        public_dashboard_id: props.dashboardId,
                    });
                }
                await costExplorerStore.dispatch('setDashboardList');
                await SpaceRouter.router.replace({ name: COST_EXPLORER_ROUTE._NAME });
            } catch (e) {
                ErrorHandler.handleRequestError(e, 'Failed to delete dashboard');
            } finally {
                checkDeleteState.loading = false;
                checkDeleteState.visible = false;
            }
        };


        const handleSelectMoreMenu = (item) => {
            if (item === MENU.SET_HOME && props.dashboardId) {
                costExplorerStore.dispatch('setHomeDashboard', props.dashboardId);
            } else if (item === MENU.DUPLICATE) {
                state.duplicateModalVisible = true;
            } else if (item === MENU.DELETE) {
                checkDeleteState.visible = true;
            }
        };
        return {
            ...toRefs(state),
            checkDeleteState,
            handleSelectMoreMenu,
            handleClickDeleteDashboard,
            handleDeleteDashboardConfirm,
        };
    },
};
</script>
