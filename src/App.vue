<template>
    <div v-cloak id="app">
        <template v-if="$store.state.display.isInitialized">
            <p-notice-alert group="noticeTopLeft" position="top left" />
            <p-notice-alert group="noticeTopRight" position="top right" />
            <p-notice-alert group="noticeBottomLeft" position="bottom left" />
            <p-notice-alert group="noticeBottomRight" position="bottom right" />
            <p-toast-alert group="toastTopCenter" position="top center" />
            <top-notification />
            <template v-if="showGNB">
                <g-n-b class="gnb" />
                <div class="app-body">
                    <p-sidebar :visible="$store.state.display.visibleSidebar"
                               :style-type="$store.getters['display/sidebarProps'].styleType"
                               :size="$store.getters['display/sidebarProps'].size"
                               :hide-close-button="$store.getters['display/sidebarProps'].disableButton"
                               :disable-scroll="$store.getters['display/sidebarProps'].disableScroll"
                               @close="$store.dispatch('display/hideSidebar')"
                    >
                        <main class="main">
                            <portal-target name="top-notification"
                                           :slot-props="{hasDefaultMessage: true}"
                            />
                            <router-view />
                        </main>
                        <template #title>
                            <portal-target v-if="$store.state.display.sidebarType === SIDEBAR_TYPE.info" name="info-title" />
                            <portal-target v-else-if="$store.state.display.sidebarType === SIDEBAR_TYPE.widget" name="widget-title" />
                            <portal-target v-else name="handbook-title" />
                        </template>
                        <template #sidebar>
                            <portal-target v-if="$store.state.display.sidebarType === SIDEBAR_TYPE.info" name="info-contents" />
                            <portal-target v-else-if="$store.state.display.sidebarType === SIDEBAR_TYPE.widget" name="widget-contents" />
                            <portal-target v-else name="handbook-contents" />
                        </template>
                    </p-sidebar>
                </div>
            </template>
            <router-view v-else />
            <p-icon-modal :visible="isExpired"
                          emoji
                          :header-title="$t('COMMON.SESSION_MODAL.SESSION_EXPIRED')"
                          :button-text="$t('COMMON.SESSION_MODAL.SIGNIN')"
                          button-type="primary-dark"
                          :outline="false"
                          @clickButton="goToSignIn"
            />
            <!--            <survey-modal />-->
        </template>
        <!-- Iframe for file download -->
        <iframe class="hidden"
                :src="$store.state.file.downloadSource" width="1" height="1"
        />
        <!-- Modal for Cross Browsing -->
        <recommended-browser-modal v-if="showsBrowserRecommendation()" />
    </div>
</template>

<script lang="ts">
import type { ComponentRenderProxy } from '@vue/composition-api';
import {
    computed,
    defineComponent, getCurrentInstance, reactive, toRefs,
} from '@vue/composition-api';

import {
    PNoticeAlert, PToastAlert, PIconModal, PSidebar,
} from '@spaceone/design-system';
import type { Location } from 'vue-router';

import { store } from '@/store';

import { SIDEBAR_TYPE } from '@/store/modules/display/config';

import { getRouteAccessLevel } from '@/lib/access-control';
import { ACCESS_LEVEL } from '@/lib/access-control/config';
import { supportsBrowser } from '@/lib/helper/cross-browsing-helper';

import RecommendedBrowserModal from '@/common/modules/modals/RecommendedBrowserModal.vue';
import GNB from '@/common/modules/navigations/gnb/GNB.vue';
import TopNotification from '@/common/modules/portals/TopNotification.vue';


import { AUTH_ROUTE } from '@/services/auth/route-config';
// import SurveyModal from '@/common/modules/survey/SurveyModal.vue';


export default defineComponent({
    name: 'App',
    components: {
        // SurveyModal,
        RecommendedBrowserModal,
        TopNotification,
        GNB: GNB as any,
        PNoticeAlert,
        PToastAlert,
        PIconModal: PIconModal as any,
        PSidebar,
    },
    setup() {
        const vm = getCurrentInstance()?.proxy as ComponentRenderProxy;

        const state = reactive({
            showGNB: computed(() => vm.$route.matched[0]?.name === 'root'),
            isExpired: computed(() => vm.$store.state.error.visibleSessionExpiredError && getRouteAccessLevel(vm.$route) >= ACCESS_LEVEL.AUTHENTICATED),
        });

        const goToSignIn = () => {
            const res: Location = {
                name: AUTH_ROUTE.SIGN_OUT._NAME,
                query: { nextPath: vm.$route.fullPath },
            };
            vm.$router.push(res);
            store.commit('error/setVisibleSessionExpiredError', false);
        };
        const showsBrowserRecommendation = () => !supportsBrowser() && !window.localStorage.getItem('showBrowserRecommendation');

        return {
            ...toRefs(state),
            goToSignIn,
            SIDEBAR_TYPE,
            showsBrowserRecommendation,
        };
    },
});

</script>

<style lang="postcss">
#app {
    @apply bg-gray-100;
    display: flex;
    flex-direction: column;
    overflow-y: hidden;
    width: 100vw;
    height: 100vh;

    .gnb {
        position: fixed;
        width: 100%;
        height: $gnb-height;
        z-index: 100;
        flex-shrink: 0;
        top: 0;
    }
    .app-body {
        display: flex;
        flex-wrap: wrap;
        flex-direction: column;
        overflow-y: hidden;
        width: 100%;
        height: calc(100vh - $(gnb-height));
        margin-top: $gnb-height;
        flex-grow: 1;
        .p-sidebar .non-sidebar-wrapper {
            min-height: 100%;
        }
        .main {
            display: flex;
            flex-direction: column;
            height: 100%;
            margin: 0;
            overflow-x: hidden;
            overflow-y: auto;
        }
    }
}
</style>
