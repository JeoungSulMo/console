<template>
    <div class="gnb-recent-favorite" @click.stop>
        <span class="menu-button" tabindex="0">
            <p-i class="menu-icon"
                 name="ic_recent_and_favorite"
                 height="1.5rem" width="1.5rem"
                 color="inherit"
                 @click.stop="handleClickButton"
            />
        </span>
        <p-tab v-show="proxyVisibleDropdown"
               :tabs="tabs"
               :active-tab.sync="activeTab"
        >
            <template #recent>
                <g-n-b-recent :visible="proxyVisibleDropdown && activeTab === 'recent'"
                              @close="handleCloseDropdown"
                />
            </template>
            <template #favorite>
                <g-n-b-favorite @close="handleCloseDropdown" />
            </template>
        </p-tab>
    </div>
</template>

<script lang="ts">
import { computed, reactive, toRefs } from '@vue/composition-api';


import {
    PI, PTab,
} from '@spaceone/design-system';
import type { TabItem } from '@spaceone/design-system/dist/src/navigation/tabs/tab/type';
import vClickOutside from 'v-click-outside';

import { i18n } from '@/translations';

import { useProxyValue } from '@/common/composables/proxy-state';
import GNBFavorite from '@/common/modules/navigations/gnb/modules/gnb-recent-favorite/modules/GNBFavorite.vue';
import GNBRecent from '@/common/modules/navigations/gnb/modules/gnb-recent-favorite/modules/GNBRecent.vue';


export default {
    name: 'GNBRecentFavorite',
    components: {
        GNBRecent,
        GNBFavorite,
        PI,
        PTab,
    },
    directives: {
        clickOutside: vClickOutside.directive,
    },
    props: {
        visibleDropdown: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }) {
        const state = reactive({
            proxyVisibleDropdown: useProxyValue('visibleDropdown', props, emit),
            tabs: computed(() => ([
                { label: i18n.t('COMMON.GNB.RECENT.RECENT'), name: 'recent', keepAlive: true },
                { label: i18n.t('COMMON.GNB.FAVORITES.FAVORITES'), name: 'favorite', keepAlive: true },
            ] as TabItem[])),
            activeTab: 'recent',
        });

        /* Event */
        const handleClickOutside = () => {
            state.proxyVisibleDropdown = false;
        };
        const handleClickButton = () => {
            state.proxyVisibleDropdown = !state.proxyVisibleDropdown;
        };
        const handleCloseDropdown = () => {
            state.proxyVisibleDropdown = false;
        };

        return {
            ...toRefs(state),
            handleClickOutside,
            handleClickButton,
            handleCloseDropdown,
        };
    },
};
</script>
<style lang="postcss" scoped>
.gnb-recent-favorite {
    @apply relative;

    .menu-button {
        @apply text-gray-500;
        line-height: $gnb-height;
        cursor: pointer;
        margin-left: 1.25rem;

        &.opened {
            @apply text-violet-400;
        }

        @media (hover: hover) {
            &:hover {
                @apply text-violet-400;
            }
        }
    }
    .p-tab::v-deep {
        @apply absolute bg-white rounded-xs border border-gray-200;
        display: flex;
        flex-direction: column;
        width: 27.5rem;
        min-height: auto;
        top: 100%;
        right: 0;
        box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.08);
        margin-top: -0.5rem;
        margin-right: -0.5rem;
        .tab-pane {
            padding-bottom: 0;
        }
    }
}
</style>
