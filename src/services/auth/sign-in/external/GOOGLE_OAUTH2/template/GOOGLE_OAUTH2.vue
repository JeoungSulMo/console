<template>
    <div class="google-oauth-wrapper">
        <div id="g-sign-in-btn" />
    </div>
</template>

<script lang="ts">
import {
    defineComponent, onMounted,
} from '@vue/composition-api';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { loadAuth } from '@/services/auth/authenticator/loader';

export default defineComponent({
    name: 'GoogleSignIn',
    setup(props, context) {
        const onSignIn = () => {
            context.emit('sign-in');
        };
        const goToAdminSignIn = () => {
            context.emit('go-to-admin-sign-in');
        };

        onMounted(async () => {
            try {
                await loadAuth('GOOGLE_OAUTH2').signIn(onSignIn);
            } catch (e) {
                ErrorHandler.handleError(e);
            }
        });
        return {
            goToAdminSignIn,
        };
    },
});
</script>

<style lang="postcss" scoped>
#g-sign-in-btn {
    @apply border border-gray-900 rounded-xs;
    box-shadow: none;
    overflow: hidden;
    >>> .abcRioButtonIcon {
        display: inline-flex;
        float: none;
    }
    >>> .abcRioButtonContents {
        vertical-align: unset;
    }
    >>> span {
        @apply text-gray-900;
        line-height: 40px;
    }
}
</style>
