<template>
    <div class="gnb-search-dropdown">
        <slot name="search-input" />
        <p-data-loader :data="[...menuSuggestionItems, ...cloudServiceSuggestionItems]"
                       :loading="loading"
        >
            <g-n-b-suggestion-list v-show="!!menuSuggestionItems.length"
                                   :items="menuSuggestionItems"
                                   :input-text="inputText"
                                   :is-focused="focusingType === SUGGESTION_TYPE.MENU ? isFocused : false"
                                   :focusing-direction="focusingDirection"
                                   @move-focus-end="handleFocusEnd(SUGGESTION_TYPE.MENU, ...arguments)"
                                   @close="$emit('close')"
                                   @select="handleSelect"
            />
            <div v-if="inputText && menuTotalCount > searchLimit" class="too-many-results-wrapper">
                <div class="dim-wrapper" />
                <p>{{ $t('COMMON.GNB.SEARCH.TOO_MANY_RESULTS') }} <br> {{ $t('COMMON.GNB.SEARCH.TRY_SEARCH_AGAIN') }}</p>
            </div>
            <g-n-b-suggestion-list v-show="!!cloudServiceSuggestionItems.length"
                                   :items="cloudServiceSuggestionItems"
                                   :input-text="inputText"
                                   :is-focused="focusingType === SUGGESTION_TYPE.CLOUD_SERVICE ? isFocused : false"
                                   :focusing-direction="focusingDirection"
                                   @move-focus-end="handleFocusEnd(SUGGESTION_TYPE.CLOUD_SERVICE, ...arguments)"
                                   @close="$emit('close')"
                                   @select="handleSelect"
            />
            <div v-if="inputText && cloudServiceTotalCount > searchLimit" class="too-many-results-wrapper">
                <div class="dim-wrapper" />
                <p>{{ $t('COMMON.GNB.SEARCH.TOO_MANY_RESULTS') }} <br> {{ $t('COMMON.GNB.SEARCH.TRY_SEARCH_AGAIN') }}</p>
            </div>
            <template #no-data>
                <div v-if="isRecent" class="no-data">
                    <img src="@/assets/images/illust_microscope.svg" class="img-help">
                    <p class="no-data-text">
                        {{ $t('COMMON.GNB.SEARCH.HELP_TEXT') }}
                    </p>
                </div>
                <div v-else class="no-data">
                    <img src="@/assets/images/illust_ghost.svg" class="img-no-data">
                    <p class="no-data-text">
                        <i18n path="COMMON.GNB.SEARCH.NO_RESULT_1">
                            <template #inputText>
                                <em>{{ inputText }}</em>
                            </template>
                        </i18n>
                        <br>{{ $t('COMMON.GNB.SEARCH.NO_RESULT_2') }}
                    </p>
                </div>
            </template>
        </p-data-loader>
    </div>
</template>

<script lang="ts">
import type { PropType } from '@vue/composition-api';
import {
    computed,
    defineComponent,
    reactive, toRefs, watch,
} from '@vue/composition-api';

import { PDataLoader } from '@spaceone/design-system';

import { i18n } from '@/translations';

import { useProxyValue } from '@/common/composables/proxy-state';
import type { SuggestionItem, SuggestionType } from '@/common/modules/navigations/gnb/modules/gnb-search/config';
import { SUGGESTION_TYPE } from '@/common/modules/navigations/gnb/modules/gnb-search/config';
import type {
    DropdownItem, FocusingDirection,
} from '@/common/modules/navigations/gnb/modules/gnb-search/type';
import GNBSuggestionList from '@/common/modules/navigations/gnb/modules/GNBSuggestionList.vue';

interface Props {
    inputText: string;
    loading: boolean;
    items: DropdownItem[];
    isFocused: boolean;
    focusingDirection: FocusingDirection;
    isRecent: boolean;
    searchLimit: number;
}

export default defineComponent<Props>({
    name: 'GNBSearchDropdown',
    components: {
        GNBSuggestionList,
        PDataLoader,
    },
    props: {
        inputText: {
            type: String,
            default: '',
        },
        loading: {
            type: Boolean,
            default: false,
        },
        items: {
            type: Array as PropType<DropdownItem[]>,
            default: () => [],
        },
        isFocused: {
            type: Boolean,
            default: false,
        },
        focusingDirection: {
            type: String as PropType<FocusingDirection>,
            default: undefined,
        },
        isRecent: {
            type: Boolean,
            default: false,
        },
        searchLimit: {
            type: Number,
            default: 15,
        },
    },
    setup(props, { emit }) {
        const state = reactive({
            menuTotalCount: computed<undefined|number>(() => props.items?.find(d => d.itemType === SUGGESTION_TYPE.MENU)?.totalCount),
            cloudServiceTotalCount: computed<undefined|number>(() => props.items?.find(d => d.itemType === SUGGESTION_TYPE.CLOUD_SERVICE)?.totalCount),
            menuSuggestionItems: computed<SuggestionItem[]>(() => {
                let results: SuggestionItem[] = [];
                const menuItems = props.items?.find(d => d.itemType === SUGGESTION_TYPE.MENU);
                if (menuItems && menuItems.suggestionItems.length) {
                    results.push({ name: 'title', label: props.isRecent ? i18n.t('COMMON.GNB.SEARCH.RECENT_MENU') : i18n.t('COMMON.GNB.SEARCH.MENU'), type: 'header' });
                    results = results.concat(menuItems.suggestionItems);
                }
                return results;
            }),
            cloudServiceSuggestionItems: computed<SuggestionItem[]>(() => {
                let results: SuggestionItem[] = [];
                const cloudServiceItems = props.items?.find(d => d.itemType === SUGGESTION_TYPE.CLOUD_SERVICE);
                if (cloudServiceItems && cloudServiceItems.suggestionItems.length) {
                    if (state.menuSuggestionItems.length) results.push({ type: 'divider' });
                    results.push({ name: 'title', label: props.isRecent ? i18n.t('COMMON.GNB.SEARCH.RECENT_CLOUD_SERVICE') : i18n.t('COMMON.GNB.SEARCH.CLOUD_SERVICE'), type: 'header' });
                    results = results.concat(cloudServiceItems.suggestionItems);
                }
                return results;
            }),
            // focus
            proxyFocusingDirection: useProxyValue('focusingDirection', props, emit),
            focusingType: SUGGESTION_TYPE.MENU as SuggestionType,
        });

        /* Event */
        const handleSelect = (item: SuggestionItem, index: number) => {
            let itemIndex = index - 1; // extract header
            if (item.itemType === SUGGESTION_TYPE.CLOUD_SERVICE && state.menuSuggestionItems.length) itemIndex -= 1; // extract divider
            emit('select', itemIndex, item.itemType);
        };
        const handleFocusEnd = (type: SuggestionType, direction: FocusingDirection) => {
            if (type === SUGGESTION_TYPE.MENU) {
                if (direction === 'DOWNWARD' && state.cloudServiceSuggestionItems.length) {
                    state.proxyFocusingDirection = direction;
                    state.focusingType = SUGGESTION_TYPE.CLOUD_SERVICE;
                } else {
                    emit('move-focus-end');
                }
            } else if (type === SUGGESTION_TYPE.CLOUD_SERVICE) {
                if (direction === 'UPWARD' && state.menuSuggestionItems.length) {
                    state.proxyFocusingDirection = direction;
                    state.focusingType = SUGGESTION_TYPE.MENU;
                } else {
                    emit('move-focus-end');
                }
            }
        };

        /* Watcher */
        watch(() => props.isFocused, (isFocused) => {
            if (isFocused) {
                if (props.focusingDirection === 'DOWNWARD') {
                    state.focusingType = props.items[0].itemType;
                } else {
                    state.focusingType = props.items[props.items.length - 1].itemType;
                }
            }
        });

        return {
            ...toRefs(state),
            SUGGESTION_TYPE,
            handleSelect,
            handleFocusEnd,
        };
    },
});
</script>

<style lang="postcss" scoped>
.gnb-search-dropdown {
    @apply absolute bg-white rounded-xs border border-gray-200;
    display: flex;
    flex-direction: column;
    width: 27.5rem;
    padding-top: 1rem;
    top: 100%;
    right: 0;
    margin-top: 0.25rem;
    box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.08);

    .p-data-loader::v-deep {
        flex-grow: 1;
        .data-loader-container {
            max-height: calc(100vh - $gnb-height - 5rem);
            overflow-y: auto;
            padding-bottom: 1rem;
        }
    }

    .no-data {
        margin: 2.5rem 0;

        > img {
            @apply ml-auto mr-auto;

            &.img-help {
                width: 7.75rem;
                opacity: 0.7;
            }

            &.img-no-data {
                width: 6.44rem;
                opacity: 0.5;
            }
        }

        .no-data-text {
            @apply text-gray-400;
            margin-top: 1.5rem;
            font-size: 0.875rem;
            line-height: 1.5;
            em {
                @apply font-bold text-gray-500;
            }
        }
    }

    .too-many-results-wrapper {
        @apply text-gray-400;
        font-size: 0.75rem;
        line-height: 1.5;
        text-align: center;
        padding: 1rem 0.75rem;

        .dim-wrapper {
            position: relative;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, white 100%);
            height: 2rem;
            pointer-events: none;
            margin-top: -3rem;
            margin-bottom: 1rem;
        }
    }
}

@screen laptop {
    .gnb-search-dropdown {
        margin-top: -0.5rem;
        margin-right: -0.5rem;
    }
}

@screen mobile {
    .gnb-search-dropdown {
        @apply flex flex-col;
        position: fixed;
        top: $gnb-height;
        width: 100vw;
        height: calc(100vh - $gnb-height - 0.5rem);
        margin-top: -0.375rem;

        &::v-deep {
            .p-data-loader {
                @apply flex-grow;
                .data-loader-container {
                    @apply flex items-center;
                    .data-wrapper {
                        width: 100%;
                    }
                }
            }
        }
    }
}
</style>
