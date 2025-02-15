<template>
    <div>
        <p-panel-top :use-total-count="true" :total-count="items.length">
            <template #default>
                {{ $t('COMMON.TAGS.TITLE') }}
            </template>
            <template #extra>
                <p-button style-type="primary-dark"
                          :disabled="disabled"
                          @click="editTag"
                >
                    {{ $t('COMMON.TAGS.EDIT') }}
                </p-button>
            </template>
        </p-panel-top>

        <p-data-table :fields="fields"
                      :items="items"
                      :loading="loading"
                      :col-copy="true"
                      beautify-text
        />
        <transition name="slide-up">
            <tags-overlay v-if="tagEditPageVisible"
                          :tags="tags"
                          :resource-id="resourceId"
                          :resource-key="resourceKey" :resource-type="resourceType"
                          @close="closeTag"
                          @update="updateTag"
            />
        </transition>
    </div>
</template>

<script lang="ts">

import type { ComponentRenderProxy } from '@vue/composition-api';
import {
    computed, reactive, toRefs, watch, getCurrentInstance,
} from '@vue/composition-api';


import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import { PDataTable, PPanelTop, PButton } from '@spaceone/design-system';
import { get, camelCase } from 'lodash';

import ErrorHandler from '@/common/composables/error/errorHandler';
import TagsOverlay from '@/common/modules/tags/tags-panel/modules/TagsOverlay.vue';

interface Props {
    resourceKey: string;
    resourceId: string;
    resourceType: string;
}
export default {
    name: 'TagsPanel',
    components: {
        PDataTable,
        PPanelTop,
        PButton,
        TagsOverlay,
    },
    props: {
        resourceKey: {
            type: String,
            default: '',
            required: true,
        },
        resourceId: {
            type: String,
            default: '',
            required: true,
        },
        resourceType: {
            type: String,
            default: '',
            required: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    setup(props: Props) {
        const vm = getCurrentInstance()?.proxy as ComponentRenderProxy;
        const apiKeys = computed(() => props.resourceType.split('.').map(d => camelCase(d)));
        const api = computed(() => get(SpaceConnector.client, apiKeys.value));

        const state = reactive({
            loading: true,
            tags: {},
            fields: computed(() => [
                { name: 'key', label: vm.$t('COMMON.TAGS.KEY'), type: 'item' },
                { name: 'value', label: vm.$t('COMMON.TAGS.VALUE'), type: 'item' },
            ]),
            items: computed(() => Object.keys(state.tags).map(k => ({ key: k, value: state.tags[k] }))),
        });
        const tagState = reactive({
            tagEditPageVisible: false,
        });

        /* api */
        const getTags = async () => {
            if (!api.value) {
                state.tags = {};
                state.loading = false;
                return;
            }

            try {
                const { tags } = await api.value.get({
                    [props.resourceKey]: props.resourceId,
                    query: { only: ['tags'] },
                });
                state.tags = tags;
            } catch (e) {
                state.tags = {};
                ErrorHandler.handleError(e);
            } finally {
                state.loading = false;
            }
        };

        /* event */
        const editTag = async () => {
            tagState.tagEditPageVisible = true;
        };
        const closeTag = async () => {
            tagState.tagEditPageVisible = false;
        };
        const updateTag = async () => {
            await getTags();
            tagState.tagEditPageVisible = false;
        };

        watch([() => props.resourceKey, () => props.resourceId, () => props.resourceType],
            async ([resourceKey, resourceId, resourceType]) => {
                if (resourceKey && resourceId && resourceType) {
                    await getTags();
                }
            }, { immediate: true });

        return {
            ...toRefs(state),
            ...toRefs(tagState),
            editTag,
            closeTag,
            updateTag,
        };
    },
};
</script>
<style lang="postcss" scoped>

/* transition */
.slide-up-enter-active {
    transition: all 0.3s ease;
}
.slide-up-leave-active {
    transition: all 0.3s ease-out;
}
.slide-up-enter, .slide-up-leave-to {
    transform: translateY(100px);
    opacity: 0;
}

.p-data-table {
    min-height: 10rem;
}
</style>
