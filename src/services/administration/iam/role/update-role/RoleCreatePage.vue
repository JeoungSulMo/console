<template>
    <section class="role-create-page">
        <p-page-title
            child
            :title="$t('IAM.ROLE.FORM.CREATE_TITLE')"
            @goBack="$router.go(-1)"
        />
        <role-update-form @update-validation="handleFormValidate"
                          @update-form-data="handleUpdateForm"
        />
        <div class="text-right mt-4">
            <p-button style-type="gray-border" :outline="true" class="mr-4"
                      @click="$router.go(-1)"
            >
                {{ $t('IAM.ROLE.FORM.CANCEL') }}
            </p-button>
            <p-button style-type="primary-dark" :loading="loading" :disabled="!isAllValid"
                      @click="handleClickConfirm"
            >
                {{ $t('IAM.ROLE.FORM.CREATE') }}
            </p-button>
        </div>
    </section>
</template>

<script lang="ts">
import { reactive, toRefs } from '@vue/composition-api';

import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import { PPageTitle, PButton } from '@spaceone/design-system';


import { SpaceRouter } from '@/router';
import { i18n } from '@/translations';

import { showSuccessMessage } from '@/lib/helper/notice-alert-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';

import type { RoleData } from '@/services/administration/iam/role/type';
import RoleUpdateForm from '@/services/administration/iam/role/update-role/modules/RoleUpdateForm.vue';

export default {
    name: 'RoleCreatePage',
    components: {
        RoleUpdateForm,
        PPageTitle,
        PButton,
    },
    setup() {
        const state = reactive({
            loading: false,
            isAllValid: false,
            formData: {} as Partial<RoleData>,
        });
        const handleClickConfirm = async () => {
            state.loading = true;
            try {
                await SpaceConnector.client.identity.role.create(state.formData);
                showSuccessMessage(i18n.t('IAM.ROLE.FORM.ALT_S_CREATE_ROLE'), '');
                SpaceRouter.router.go(-1);
            } catch (e: any) {
                ErrorHandler.handleRequestError(e, i18n.t('IAM.ROLE.FORM.ALT_E_CREATE_ROLE'));
            } finally {
                state.loading = false;
            }
        };
        const handleFormValidate = (isAllValid) => { state.isAllValid = isAllValid; };
        const handleUpdateForm = (data: Partial<RoleData>) => {
            state.formData = data;
        };
        return {
            ...toRefs(state),
            handleClickConfirm,
            handleFormValidate,
            handleUpdateForm,
        };
    },

};
</script>

<style lang="postcss" scoped>
.role-create-page {
    @apply mx-0;
    max-width: 100%;
}
</style>
