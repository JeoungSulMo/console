<template>
    <p-pane-layout class="role-create-page-access-form">
        <p-panel-top>
            {{ $t('IAM.ROLE.DETAIL.PAGE_ACCESS') }}
        </p-panel-top>
        <div class="page-access-menu">
            <div class="header-wrapper">
                <span class="left-part">{{ $t('IAM.ROLE.FORM.MENU') }}</span>
                <span class="right-part mr-6">{{ $t('IAM.ROLE.FORM.PERMISSION') }}</span>
            </div>
            <div class="content-wrapper">
                <template v-for="menu in formState.menuItems">
                    <div v-if="menu.id === 'all' || !hideAllMenu" :key="menu.id"
                         class="menu-wrapper"
                         :class="menu.id"
                    >
                        <role-update-page-access-menu-item :menu="menu" @update="handleUpdate" />
                        <template v-for="subMenu in menu.subMenuList">
                            <div v-if="menu.subMenuList && !menu.hideMenu && !hideAllMenu" :key="subMenu.id"
                                 class="sub-menu-wrapper"
                            >
                                <role-update-page-access-menu-item :menu="subMenu" is-sub-menu @update="handleUpdate" />
                            </div>
                        </template>
                    </div>
                </template>
            </div>
        </div>
    </p-pane-layout>
</template>

<script lang="ts">

import type { PropType } from '@vue/composition-api';
import {
    computed, reactive, toRefs, watch,
} from '@vue/composition-api';

import { PPaneLayout, PPanelTop } from '@spaceone/design-system';
import { find } from 'lodash';

import type { RawPagePermission } from '@/lib/access-control/page-permission-helper';
import {
    getPagePermissionMapFromRaw, PAGE_PERMISSION_TYPE,
} from '@/lib/access-control/page-permission-helper';

import { getPageAccessMenuList } from '@/services/administration/iam/role/lib/page-access-menu-list';
import type { PageAccessMenuItem } from '@/services/administration/iam/role/type';
import RoleUpdatePageAccessMenuItem
    from '@/services/administration/iam/role/update-role/modules/RoleUpdatePageAccessMenuItem.vue';


const getPagePermissions = (menuItems: PageAccessMenuItem[]): RawPagePermission[] => {
    const allItem = find(menuItems, { id: 'all' });
    if (allItem && allItem.isManaged) return [{ page: '*', permission: PAGE_PERMISSION_TYPE.MANAGE }];

    const results: RawPagePermission[] = [];
    menuItems.forEach((menu) => {
        if (menu.id === 'all' && menu.isViewed) results.push({ page: '*', permission: PAGE_PERMISSION_TYPE.VIEW });
        else if (menu.isManaged) results.push({ page: `${menu.id}.*`, permission: PAGE_PERMISSION_TYPE.MANAGE });
        else if (menu.isViewed) results.push({ page: `${menu.id}.*`, permission: PAGE_PERMISSION_TYPE.VIEW });
        if (menu.subMenuList?.length) {
            menu.subMenuList.forEach((subMenu) => {
                if (!menu.isManaged) {
                    if (subMenu.isManaged) results.push({ page: subMenu.id, permission: PAGE_PERMISSION_TYPE.MANAGE });
                    else if (!menu.isViewed && subMenu.isViewed) results.push({ page: subMenu.id, permission: PAGE_PERMISSION_TYPE.VIEW });
                }
            });
        }
    });
    return results;
};

export default {
    name: 'RoleUpdatePageAccessForm',
    components: {
        RoleUpdatePageAccessMenuItem,
        PPaneLayout,
        PPanelTop,
    },
    props: {
        initialPagePermissions: {
            type: Array as PropType<RawPagePermission[]>,
            default: () => ([]),
        },
    },
    setup(props, { emit }) {
        const formState = reactive({
            menuItems: getPageAccessMenuList([{
                id: 'all',
                translationIds: ['IAM.ROLE.FORM.ALL'],
                isViewed: false,
                isManaged: false,
                hideMenu: false,
            }]),
        });
        const state = reactive({
            hideAllMenu: computed(() => formState.menuItems.find(d => d.id === 'all')?.hideMenu),
            pagePermissions: computed<RawPagePermission[]>(() => getPagePermissions(formState.menuItems)),
        });

        /* Util */
        const updateMenuItems = (item: PageAccessMenuItem, key: string, val: boolean, parentItem?: PageAccessMenuItem) => {
            item[key] = val;
            if (key === 'isManaged') item.isViewed = val;
            if (parentItem && !val) {
                parentItem[key] = val;
                parentItem.isViewed = false;
            }
            if (item?.subMenuList?.length) {
                item.subMenuList.forEach((subMenu) => {
                    if (key === 'isViewed' && subMenu.isManaged) return;
                    if (key === 'isManaged') subMenu.isViewed = val;
                    subMenu[key] = val;
                });
            }
        };

        /* Event */
        const handleUpdate = (menuId: string, key: 'isViewed' | 'isManaged', val: boolean) => {
            const item = find(formState.menuItems, { id: menuId });
            if (item) {
                if (item.id === 'all') {
                    formState.menuItems.forEach((menu) => {
                        updateMenuItems(menu, key, val);
                    });
                } else {
                    const parentItem = find(formState.menuItems, { id: 'all' });
                    updateMenuItems(item, key, val, parentItem);
                }
            } else {
                formState.menuItems.forEach((menuItem) => {
                    if (menuItem?.subMenuList?.length) {
                        const subItem = find(menuItem.subMenuList, { id: menuId });
                        if (subItem) {
                            updateMenuItems(subItem, key, val, menuItem);
                        }
                    }
                });
            }
        };

        /* Watcher */
        watch(() => state.pagePermissions, (after) => {
            emit('update-form', after);
        });
        watch(() => props.initialPagePermissions, (initialPagePermissions) => {
            // init formState.menuItems
            const pagePermissions = getPagePermissionMapFromRaw(initialPagePermissions);
            // eslint-disable-next-line no-restricted-syntax
            for (const [itemId, key] of Object.entries(pagePermissions)) {
                const itemAttribute = (key === PAGE_PERMISSION_TYPE.MANAGE) ? 'isManaged' : 'isViewed';
                handleUpdate(itemId, itemAttribute, true);
            }
        });

        return {
            ...toRefs(state),
            formState,
            handleUpdate,
        };
    },
};
</script>

<style lang="postcss" scoped>
.role-create-page-access-form {
    @apply mx-0;
    max-width: 100%;

    .page-access-menu {
        @apply border border-gray-200 rounded-md;
        font-size: 0.875rem;
        line-height: 1.25;
        max-width: 43.5rem;
        margin: 0 1rem 2.5rem 1rem;

        .header-wrapper {
            @apply text-gray-500 border-b border-gray-200;
            display: flex;
            font-size: 0.75rem;
            line-height: 1.25;
            padding: 0.5rem 1rem;
        }
        .content-wrapper {
            height: 27.875rem;
            overflow-y: auto;
        }
        .menu-wrapper {
            @apply bg-gray-100 border border-gray-200 rounded-md;
            margin: 0.5rem 1rem;
            &.all {
                @apply bg-transparent border-none;
                margin: 0.5rem 1rem 0.5rem 0;
            }
            .sub-menu-wrapper {
                @apply bg-white rounded-md;
                margin: 0.25rem 0.5rem;
            }
        }
        .left-part {
            flex-grow: 1;
        }
        .right-part {
            width: 12.5rem;
        }
    }
}
</style>
