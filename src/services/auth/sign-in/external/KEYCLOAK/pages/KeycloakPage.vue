<template>
    <fragment />
</template>

<script lang="ts">
import type { ComponentRenderProxy } from '@vue/composition-api';
import { defineComponent, getCurrentInstance, onMounted } from '@vue/composition-api';

import { SpaceRouter } from '@/router';
import { store } from '@/store';

import { isUserAccessibleToRoute } from '@/lib/access-control';

import { loadAuth } from '@/services/auth/authenticator/loader';
import { DASHBOARD_ROUTE } from '@/services/dashboard/route-config';

export default defineComponent({
    name: 'KeycloakPage',
    beforeRouteEnter(to, from, next) {
        if (from?.meta.isSignInPage) {
            next((vm) => {
                vm.$router.replace({
                    query: { ...to.query, nextPath: from.query.nextPath },
                }).catch(() => {});
            });
        } else next();
    },
    props: {
        visible: {
            type: Boolean,
            default: undefined,
        },
        nextPath: {
            type: String,
            default: undefined,
        },
    },
    setup(props) {
        const vm = getCurrentInstance()?.proxy as ComponentRenderProxy;

        const onSignIn = async () => {
            if (!props.nextPath) {
                await vm.$router.push({ name: DASHBOARD_ROUTE._NAME });
                return;
            }

            const resolvedRoute = SpaceRouter.router.resolve(props.nextPath);
            const isAccessible = isUserAccessibleToRoute(resolvedRoute.route, store.getters['user/pagePermissionList']);
            if (isAccessible) {
                await vm.$router.push(props.nextPath);
            } else {
                await vm.$router.push({ name: DASHBOARD_ROUTE._NAME });
            }
        };

        onMounted(async () => {
            await loadAuth('KEYCLOAK').signIn(onSignIn);
        });
    },
});
</script>
