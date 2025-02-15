<template>
    <div class="wrap">
        <div class="error">
            <div class="error-contents">
                <p-lottie class="flex items-center justify-center"
                          name="lottie_floating-astronaut" auto
                          :size="20"
                />
                <p class="error-message">
                    {{ $t('COMMON.ERROR.NO_RESOURCE_MSG') }}
                </p>
                <router-link :to="serviceRoute.path">
                    <p-button style-type="primary" class="redirect-button">
                        {{ $t('COMMON.ERROR.NO_RESOURCE_GO_MAIN', {service: mainLabel}) }}
                    </p-button>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import type { ComponentRenderProxy } from '@vue/composition-api';
import {
    computed, getCurrentInstance, reactive, toRefs,
} from '@vue/composition-api';

import {
    PLottie, PButton,
} from '@spaceone/design-system';
import type { RouteConfig } from 'vue-router';

import { i18n } from '@/translations';

import { MENU_INFO_MAP } from '@/lib/menu/menu-info';

export default {
    name: 'NoResourcePage',
    components: {
        PButton,
        PLottie,
    },
    setup() {
        const vm = getCurrentInstance()?.proxy as ComponentRenderProxy;
        const state = reactive({
            serviceRoute: computed(() => vm.$route.matched[vm.$route.matched.length - 2]),
            mainLabel: computed(() => {
                const meta: RouteConfig['meta'] = state.serviceRoute.meta;
                if (!meta) return '';
                if (typeof meta.label === 'string') return meta.label;
                if (typeof meta.label === 'function') return meta.label(vm.$route);
                if (meta.menuId) {
                    const menuInfo = MENU_INFO_MAP[meta.menuId];
                    return menuInfo ? i18n.t(menuInfo.translationId) : '';
                }
                if (meta.translationId) return i18n.t(meta.translationId);
                return '';
            }),
        });

        return {
            ...toRefs(state),
        };
    },
};
</script>

<style lang="postcss" scoped>
.wrap {
    @apply flex flex-col;
    height: 100%;
}
.error {
    @apply m-auto flex-1 text-center;
    .error-contents {
        padding-top: calc(50% - 2.5rem);
        .error-message {
            @apply text-lg;
            line-height: 150%;
            a {
                @apply text-blue-700;
            }
        }
        .redirect-button {
            margin-top: 2rem;
        }
    }
}
</style>
