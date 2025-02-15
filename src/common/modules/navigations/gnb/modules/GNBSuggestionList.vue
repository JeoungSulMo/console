<template>
    <p-context-menu ref="contextMenuRef"
                    class="gnb-search-suggestion-list"
                    :menu="items"
                    no-select-indication
                    @keyup:up:end="$emit('move-focus-end', 'UPWARD')"
                    @keyup:down:end="$emit('move-focus-end', 'DOWNWARD')"
                    @keyup:esc="$emit('close')"
                    @focus="$emit('update:isFocused', true)"
                    @blur="$emit('update:isFocused', false)"
                    @select="handleSelect"
    >
        <template #header-title="{ item }">
            <div class="context-header">
                {{ item.label }}
            </div>
        </template>
        <template #item--format="{ item }">
            <div class="suggestion-item">
                <span class="image">
                    <p-lazy-img v-if="item.itemType === SUGGESTION_TYPE.CLOUD_SERVICE"
                                :src="item.icon || ''"
                                width="1rem" height="1rem"
                    />
                    <p-i v-else
                         :name="item.icon"
                         width="1rem" height="1rem"
                    />
                </span>
                <span class="texts">
                    <template v-if="item.parents">
                        <template v-for="(parent, pIdx) in item.parents">
                            <text-highlighting :key="`parent-${parent.label}-${pIdx}`"
                                               :term="inputText"
                                               :text="parent.label"
                            />
                            <span :key="`arrow-${pIdx}`">
                                <p-i name="ic_breadcrumb_arrow"
                                     width="1rem" height="1rem"
                                />
                            </span>
                        </template>
                    </template>
                    <text-highlighting :key="`leaf-${item.label}`"
                                       :term="inputText"
                                       :text="item.label"
                    />
                </span>
                <span class="favorite-button">
                    <favorite-button v-if="useFavorite"
                                     :item-id="item.name"
                                     :favorite-type="item.itemType"
                                     scale="0.65"
                    />
                </span>
            </div>
        </template>
        <template v-for="(_, slot) of $scopedSlots" #[slot]="scope">
            <slot :name="slot" v-bind="scope" />
        </template>
    </p-context-menu>
</template>

<script lang="ts">
import type { PropType } from '@vue/composition-api';
import {
    defineComponent, onUnmounted,
    reactive, toRefs, watch,
} from '@vue/composition-api';

import { PContextMenu, PI, PLazyImg } from '@spaceone/design-system';

import TextHighlighting from '@/common/components/text/text-highlighting/TextHighlighting.vue';
import FavoriteButton from '@/common/modules/favorites/favorite-button/FavoriteButton.vue';
import type { SuggestionItem } from '@/common/modules/navigations/gnb/modules/gnb-search/config';
import { SUGGESTION_TYPE } from '@/common/modules/navigations/gnb/modules/gnb-search/config';
import type { FocusingDirection } from '@/common/modules/navigations/gnb/modules/gnb-search/type';


interface Props {
    items: SuggestionItem[];
    inputText: string;
    isFocused: boolean;
    focusingDirection: FocusingDirection;
    useFavorite: boolean;
}

export default defineComponent<Props>({
    name: 'GNBSuggestionList',
    components: {
        TextHighlighting,
        FavoriteButton,
        PContextMenu,
        PLazyImg,
        PI,
    },
    props: {
        items: {
            type: Array as PropType<SuggestionItem[]>,
            default: () => [],
        },
        inputText: {
            type: String,
            default: '',
        },
        isFocused: {
            type: Boolean,
            default: false,
        },
        focusingDirection: {
            type: String as PropType<FocusingDirection>,
            default: undefined,
        },
        useFavorite: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }) {
        const state = reactive({
            contextMenuRef: null as null | any,
        });

        const handleSelect = (item, index) => {
            emit('select', item, index);
        };

        watch(() => props.isFocused, (isFocused) => {
            if (!state.contextMenuRef) return;
            if (!isFocused) return;
            if (props.focusingDirection === 'DOWNWARD') {
                state.contextMenuRef.focus(0);
            } else {
                state.contextMenuRef.focus(-1);
            }
        });

        onUnmounted(() => {
            emit('update:isFocused', false);
        });

        return {
            ...toRefs(state),
            SUGGESTION_TYPE,
            handleSelect,
        };
    },
});
</script>

<style lang="postcss" scoped>
.gnb-search-suggestion-list {
    @apply bg-white border-none;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    padding-bottom: 0.125rem;
    max-height: unset;

    &::v-deep {
        .context-header {
            margin-top: 0;
            margin-bottom: 0.25rem;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
        }

        .suggestion-item {
            display: flex;
            justify-content: space-between;
            width: 100%;
            .image {
                margin-right: 0.25rem;
                flex-shrink: 0;
            }
            .texts {
                flex-grow: 1;
            }
            .favorite-button {
                flex-shrink: 0;
            }
        }

        .p-context-menu-item {
            justify-content: flex-start;
            line-height: 1.75;
            padding: 0.25rem 0.5rem;
            .label-wrapper {
                overflow: visible;
            }

            &:focus {
                @apply border border-blue-400 rounded-xs;
                box-shadow: 0 0 0 0.125rem rgba(73, 167, 247, 0.2);
                outline: none;

                &:not(:hover):not(.disabled):not(.empty) {
                    @apply bg-white;
                }
            }
        }

        .context-divider {
            margin: 0.875rem -0.75rem 1rem;
        }
    }

    .matched-character {
        @apply text-blue-700 bg-blue-200;
    }
}
</style>
