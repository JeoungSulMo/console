<template>
    <p-button-modal
        :header-title="$t('PROJECT.DETAIL.ALERT.SET_NOTIFICATION_POLICY_MODAL_TITLE')"
        size="sm"
        fade
        :visible.sync="proxyVisible"
        @confirm="onClickConfirm"
    >
        <template #body>
            <div class="content-wrapper">
                <p>{{ $t('PROJECT.DETAIL.ALERT.SET_NOTIFICATION_MODAL_HELP_TEXT') }}</p>
                <p-select-card v-for="option in selectOptions" :key="option.name"
                               v-model="notificationUrgency"
                               :value="option.name"
                               :label="option.label"
                               :icon="option.icon"
                               :icon-color="urgencyColor"
                               block
                />
            </div>
        </template>
    </p-button-modal>
</template>

<script lang="ts">

import { reactive, toRefs, watch } from '@vue/composition-api';

import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import {
    PButtonModal, PSelectCard,
} from '@spaceone/design-system';


import { i18n } from '@/translations';

import { showSuccessMessage } from '@/lib/helper/notice-alert-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';
import { useProxyValue } from '@/common/composables/proxy-state';

import { red } from '@/styles/colors';

export default {
    name: 'ProjectNotificationPolicyUpdateModal',
    components: {
        PButtonModal,
        PSelectCard,
    },
    props: {
        projectId: {
            type: String,
            default: undefined,
        },
        visible: {
            type: Boolean,
            required: true,
        },
        selectOptions: {
            type: Array,
            default: () => ([]),
        },
        selectedOption: {
            type: String,
            default: undefined,
        },
    },
    setup(props, { emit, root }) {
        const state = reactive({
            proxyVisible: useProxyValue('visible', props, emit),
            notificationUrgency: undefined,
        });

        const onClickConfirm = async () => {
            try {
                await SpaceConnector.client.monitoring.projectAlertConfig.update({
                    project_id: props.projectId,
                    options: {
                        notification_urgency: state.notificationUrgency,
                    },
                });
                showSuccessMessage(i18n.t('PROJECT.DETAIL.ALERT.ALT_S_CHANGE_NOTIFICATION_POLICY'), '', root);
                emit('confirm');
            } catch (e) {
                ErrorHandler.handleRequestError(e, i18n.t('PROJECT.DETAIL.ALERT.ALT_E_CHANGE_NOTIFICATION_POLICY'));
            } finally {
                state.proxyVisible = false;
            }
        };

        watch([() => props.selectedOption, () => props.visible], ([selectedOption]) => {
            state.notificationUrgency = selectedOption;
        });

        return {
            ...toRefs(state),
            onClickConfirm,
            urgencyColor: red[400],
        };
    },
};
</script>

<style lang="postcss" scoped>
.content-wrapper {
    @apply grid gap-2;
    line-height: 1.6;
    padding: 1rem 0;
}
</style>
