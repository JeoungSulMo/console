<template>
    <p-button-modal
        :header-title="$t('MONITORING.ALERT.DETAIL.EDIT_MODAL_TITLE')"
        centered
        size="sm"
        fade
        :scrollable="false"
        backdrop
        :visible.sync="proxyVisible"
        :disabled="isNameInvalid"
        @confirm="onClickConfirm"
    >
        <template #body>
            <p-field-group :label="$t('PROJECT.DETAIL.MODAL_CREATE_PROJECT_LABEL')"
                           :invalid-text="nameInvalidText"
                           :invalid="isNameInvalid"
                           required
            >
                <template #default>
                    <p-text-input v-model="alertTitleInput" class="block w-full" :invalid="isNameInvalid"
                                  :placeholder="alertTitle"
                    />
                </template>
            </p-field-group>
        </template>
    </p-button-modal>
</template>

<script lang="ts">
import {
    computed, reactive, toRefs,
} from '@vue/composition-api';

import { PButtonModal, PFieldGroup, PTextInput } from '@spaceone/design-system';

import { i18n } from '@/translations';

import { showSuccessMessage } from '@/lib/helper/notice-alert-helper';


import ErrorHandler from '@/common/composables/error/errorHandler';
import { useProxyValue } from '@/common/composables/proxy-state';

import { alertManagerStore } from '@/services/alert-manager/store';


export default {
    name: 'AlertTitleEditModal',
    components: {
        PTextInput,
        PFieldGroup,
        PButtonModal,
    },
    directives: {
        focus: {
            inserted(el) {
                el.focus();
            },
        },
    },
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
        alertId: {
            type: String,
            default: null,
        },
        alertTitle: {
            type: String,
            default: null,
        },
    },
    setup(props, { emit, root }) {
        const state = reactive({
            loading: true,
            proxyVisible: useProxyValue('visible', props, emit),
            alertTitleInput: props.alertTitle,
            nameInvalidText: computed(() => {
                if (state.alertTitleInput.length === 0) {
                    return i18n.t('MONITORING.ALERT.ESCALATION_POLICY.FORM.NAME_REQUIRED');
                }
                // if (state.alertTitleInput.length > 40) {
                //     return i18n.t('MONITORING.ALERT.ESCALATION_POLICY.FORM.NAME_INVALID_TEXT');
                // }
                return undefined;
            }),
            isNameInvalid: computed(() => !!state.nameInvalidText),
        });

        const updateAlertTitle = async () => {
            try {
                state.loading = true;
                await alertManagerStore.dispatch('alert/updateAlertData', {
                    updateParams: {
                        title: state.alertTitleInput,
                    },
                    alertId: props.alertId,
                });
                showSuccessMessage(i18n.t('MONITORING.ALERT.DETAIL.HEADER.ALT_S_UPDATE_TITLE'), '', root);
            } catch (e) {
                ErrorHandler.handleRequestError(e, i18n.t('MONITORING.ALERT.DETAIL.HEADER.ALT_E_UPDATE_TITLE'));
            } finally {
                state.loading = false;
            }
        };
        const onClickConfirm = async () => {
            await updateAlertTitle();
            state.proxyVisible = false;
            emit('confirm');
        };
        return {
            ...toRefs(state),
            onClickConfirm,
        };
    },
};
</script>
