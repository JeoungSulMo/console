<template>
    <div class="project-select-dropdown">
        <p-search-dropdown :loading="loading"
                           :visible-menu.sync="visibleMenu"
                           :is-focused.sync="isFocused"
                           :type="multiSelectable ? undefined : 'radioButton'"
                           :multi-selectable="multiSelectable"
                           :exact-mode="false"
                           :use-fixed-menu-style="useFixedMenuStyle"
                           :invalid="invalid"
                           :disabled="disabled"
                           :placeholder="$t('COMMON.PROJECT_SELECT_DROPDOWN.PLACEHOLDER')"
                           :selected.sync="selectedItems"
                           :readonly="true"
                           :disable-delete-all="true"
                           @update:visible-menu="handleUpdateVisibleMenu"
                           @delete-tag="handleDeleteTag"
        >
            <template #menu-no-data-format>
                <div />
            </template>
            <template #menu-menu>
                <p-tree :edit-options="{disabled: true}"
                        :drag-options="{disabled: true}"
                        :toggle-options="toggleOptions"
                        :select-options="selectOptions"
                        :data-setter="dataSetter"
                        :data-getter="dataGetter"
                        :data-fetcher="dataFetcher"
                        @init="handleTreeInit"
                        @change-select="handleTreeChangeSelect"
                >
                    <template #data="{node}">
                        <span class="ml-1">{{ node.data.name }}</span>
                    </template>
                    <template #toggle-right="{node, path}">
                        <span>
                            <component :is="selectComponent"
                                       v-if="(node.data.item_type === 'PROJECT' && projectSelectable) || (node.data.item_type === 'PROJECT_GROUP' && projectGroupSelectable)"
                                       :selected="selectedProjects" :value="node.data"
                                       :predicate="predicate"
                                       class="mr-1"
                                       @change="handleChangeSelectState(node, path, ...arguments)"
                            />
                            <p-i :name="node.data.item_type === 'PROJECT_GROUP' ? 'ic_tree_project-group' : 'ic_tree_project'"
                                 width="1rem" height="1rem"
                            />
                        </span>
                    </template>
                </p-tree>
            </template>
        </p-search-dropdown>
    </div>
</template>

<script lang="ts">
import {
    computed, reactive, toRefs, watch,
} from '@vue/composition-api';

import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import {
    PCheckBox, PI, PRadio, PSearchDropdown, PSelectDropdown, PTag, PTree,
} from '@spaceone/design-system';
import type { MenuItem } from '@spaceone/design-system/dist/src/inputs/context-menu/type';


import { store } from '@/store';

import type { ProjectReferenceMap } from '@/store/modules/reference/project/type';
import type { ReferenceMap } from '@/store/modules/reference/type';

import ErrorHandler from '@/common/composables/error/errorHandler';

import type { ProjectGroup } from '@/services/asset-inventory/service-account/type';
import type { ProjectItemResp, ProjectTreeItem, ProjectTreeRoot } from '@/services/project/type';

export default {
    name: 'ProjectSelectDropdown',
    components: {
        PSearchDropdown,
        PSelectDropdown,
        PTag,
        PTree,
        PRadio,
        PCheckBox,
        PI,
    },
    props: {
        selectedProjectIds: {
            type: Array,
            default: () => [],
        },
        multiSelectable: {
            type: Boolean,
            default: false,
        },
        invalid: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        projectSelectable: {
            type: Boolean,
            default: false,
        },
        projectGroupSelectable: {
            type: Boolean,
            default: false,
        },
        useFixedMenuStyle: {
            type: Boolean,
            default: true,
        },
    },
    setup(props, { emit }) {
        const state = reactive({
            loading: true,
            visibleMenu: false,
            isFocused: false,
            root: null as ProjectTreeRoot|null,
            projects: computed<ProjectReferenceMap>(() => store.getters['reference/projectItems']),
            // selected states
            selectedProjectItems: [] as ProjectTreeItem[],
            selectedProjects: computed<ProjectItemResp[]>(() => state.selectedProjectItems.map(d => d.node.data)),
            _selectedProjectIds: [...props.selectedProjectIds] as string[],
            selectedItems: computed<MenuItem[]>({
                get() {
                    const items: ReferenceMap = {
                        ...state.projects,
                        ...store.state.reference.projectGroup.items,
                    };
                    return state._selectedProjectIds.map(id => ({
                        name: id,
                        label: items[id]?.label,
                    }));
                },
                set(val) {
                    state._selectedProjectIds = val.map(d => d.name);
                },
            }),
            selectComponent: computed(() => {
                if (props.multiSelectable) return PCheckBox;
                return PRadio;
            }),
        });

        const getSearchPath = async (id: string|undefined, type: string|undefined): Promise<string[]> => {
            if (!id) return [];
            try {
                const res = await SpaceConnector.client.identity.project.tree.search({
                    item_id: id,
                    item_type: type,
                });
                return res.open_path || [];
            } catch (e) {
                ErrorHandler.handleError(e);
                return [];
            }
        };

        const findNodes = async () => {
            if (!state.root) return;

            const pathList: string[][] = await Promise.all(props.selectedProjectIds.map(d => getSearchPath(d, props.projectGroupSelectable ? 'PROJECT_GROUP' : 'PROJECT')));
            const predicateList = pathList.map(paths => paths.map(d => (data => data.id === d)));
            await state.root.fetchAndFindNodes(predicateList);
        };

        /* Tree props */
        const predicate = (current, data) => current?.id === data.id;
        const toggleOptions = {
            validator: node => node.data.item_type === 'PROJECT_GROUP' && (node.data.has_child || node.children.length > 0),
            toggleOnNodeClick: true,
        };
        const selectOptions = computed(() => ({
            multiSelectable: props.multiSelectable,
            validator({ data }) {
                return props.projectGroupSelectable ? true : data.item_type === 'PROJECT';
            },
        }));
        const dataSetter = (text, node) => {
            node.data.name = text;
        };
        const dataGetter = node => node.data.name;
        const dataFetcher = async (node): Promise<ProjectGroup[]> => {
            try {
                const params: any = {
                    sort: { key: 'name', desc: false },
                    item_type: 'ROOT',
                    check_child: true,
                };

                if (!props.projectSelectable) params.exclude_type = 'PROJECT';

                if (node.data?.id && node.data?.item_type) {
                    params.item_id = node.data.id;
                    params.item_type = node.data.item_type;
                }

                const { items } = await SpaceConnector.client.identity.project.tree(params);
                return items;
            } catch (e) {
                ErrorHandler.handleError(e);
                return [];
            }
        };


        /* Handlers */
        const handleTreeInit = async (root) => {
            state.root = root;

            state.loading = true;
            if (props.selectedProjectIds.length) {
                await findNodes();
            } else {
                await root.fetchData();
            }
            state.loading = false;
        };

        const handleTreeChangeSelect = (selected: ProjectTreeItem[]) => {
            if (!props.multiSelectable && state.selectedProjectItems === selected) return;

            state.selectedProjectItems = selected;
            state._selectedProjectIds = state.selectedProjects.map(d => d.id);

            if (!props.multiSelectable) {
                if (state.visibleMenu) state.visibleMenu = false;
                if (state.isFocused) state.isFocused = false;
            }

            emit('select', state.selectedProjects);
        };

        const handleChangeSelectState = (node, path, selected, value) => {
            if (state.root) state.root.changeSelectState(node, path, value);
        };

        const handleDeleteTag = (_, index: number) => {
            if (state.selectedProjectItems[index]) {
                const { node, path } = state.selectedProjectItems[index];
                if (state.root) state.root.changeSelectState(node, path, false);
            }
        };

        const handleUpdateVisibleMenu = (value) => {
            if (!value) emit('close');
        };

        /* Watchers */
        watch(() => props.selectedProjectIds, async (after, before) => {
            if (after !== state._selectedProjectIds) {
                findNodes();

                /* when findNodes() has node delete function, this will be deprecated */
                if (after.length < before.length) {
                    const deletedId = before.filter(d => !after.includes(d))[0];
                    const deletedIdx = state._selectedProjectIds.indexOf(deletedId);
                    handleDeleteTag(deletedId, deletedIdx);
                }
            }
        });

        watch(() => state._selectedProjectIds, (selectedProjectIds) => {
            if (selectedProjectIds !== props.selectedProjectIds) {
                emit('update:selectedProjectIds', selectedProjectIds);
            }
        });

        /* init */
        (async () => {
            await Promise.allSettled([
                // LOAD REFERENCE STORE
                store.dispatch('reference/project/load'),
                store.dispatch('reference/projectGroup/load'),
            ]);
        })();
        return {
            ...toRefs(state),
            predicate,
            toggleOptions,
            selectOptions,
            dataSetter,
            dataGetter,
            dataFetcher,
            handleTreeInit,
            handleTreeChangeSelect,
            handleChangeSelectState,
            handleDeleteTag,
            handleUpdateVisibleMenu,
        };
    },
};
</script>

<style lang="postcss" scoped>
.project-select-dropdown {
    .p-select-dropdown::v-deep {
        display: block;
        width: 100%;
        .dropdown-button {
            width: 100%;
        }
    }
    .tag-wrapper {
        display: flex;
        flex-wrap: wrap;
    }
    .p-tree::v-deep {
        padding: 0.25rem;
        .toggle-right {
            @apply flex-shrink-0;
        }
    }

    .tag-box {
        @apply text-gray-900;
        margin-top: 0.625rem;
        .p-tag {
            margin-bottom: 0.5rem;
        }
    }
}
</style>
