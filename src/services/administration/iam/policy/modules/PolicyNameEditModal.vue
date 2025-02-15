<template>
    <section class="policy-name-edit-modal">
        <p-button-modal
            :visible.sync="proxyVisible"
            :header-title="$t('IAM.POLICY.MODAL.EDIT_TITLE')"
            size="sm"
            @confirm="handleConfirm"
        >
            <template #body>
                <p-field-group :label="$t('IAM.POLICY.MODAL.NAME')" required>
                    <p-text-input :value="policyNameInput" @input="handleNameEditInput" />
                </p-field-group>
            </template>
        </p-button-modal>
    </section>
</template>

<script lang="ts">
import { reactive, toRefs, watch } from '@vue/composition-api';

import { PButtonModal, PFieldGroup, PTextInput } from '@spaceone/design-system';

import { i18n } from '@/translations';

import { showSuccessMessage } from '@/lib/helper/notice-alert-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';
import { useProxyValue } from '@/common/composables/proxy-state';

import { administrationStore } from '@/services/administration/store';


export default {
    name: 'PolicyNameEditModal',
    components: {
        PButtonModal,
        PFieldGroup,
        PTextInput,
    },
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
        policyId: {
            type: String,
            default: '',
        },
        policyName: {
            type: String,
            default: '',
        },
    },
    setup(props, { emit }) {
        const state = reactive({
            loading: true,
            proxyVisible: useProxyValue('visible', props, emit),
            policyNameInput: props.policyName,
        });

        const handleNameEditInput = (nameEditInput: string) => { state.policyNameInput = nameEditInput; };

        const updatePolicyName = async () => {
            try {
                state.loading = true;
                await administrationStore.dispatch('policy/updatePolicyData', {
                    updateParams: {
                        name: state.policyNameInput,
                    },
                    policyId: props.policyId,
                });
                showSuccessMessage(i18n.t('IAM.POLICY.MODAL.ALT_S_UPDATE_POLICY'), '');
            } catch (e) {
                ErrorHandler.handleRequestError(e, i18n.t('IAM.POLICY.MODAL.ALT_E_UPDATE_POLICY'));
            } finally {
                state.loading = false;
            }
        };

        const handleConfirm = () => {
            updatePolicyName();
            state.proxyVisible = false;
        };

        watch(() => props.policyName, (policyName) => {
            state.policyNameInput = policyName;
        });

        return {
            ...toRefs(state),
            handleNameEditInput,
            handleConfirm,
            updatePolicyName,
        };
    },
};
</script>
<style lang="postcss" scoped>
.policy-name-edit-modal {
    .p-text-input {
        width: 100%;
    }
}
</style>
