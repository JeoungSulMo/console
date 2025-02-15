import type { Getter } from 'vuex';

import { languages } from '@/store/modules/user/config';

import type { PagePermissionTuple, PagePermissionType } from '@/lib/access-control/page-permission-helper';
import {
    getDefaultPagePermissionList,
    getPagePermissionMapFromRaw, getProperPermissionType,
    PAGE_PERMISSION_TYPE,
} from '@/lib/access-control/page-permission-helper';

import type { UserState } from './type';

export const isDomainOwner = (state: UserState): boolean => state.userType === 'DOMAIN_OWNER';
export const languageLabel = (state: UserState): string => languages[state.language as string] || state.language;
export const roleNames = (state: UserState): Array<string> => {
    const systemRoleNames: Array<string> = [];
    const domainRoleNames: Array<string> = [];
    const projectRoleNames: Array<string> = [];

    if (state.roles) {
        state.roles.forEach((role) => {
            if (role.roleType === 'SYSTEM') {
                systemRoleNames.push(role.name);
            } else if (role.roleType === 'DOMAIN') {
                domainRoleNames.push(role.name);
            } else {
                projectRoleNames.push(role.name); // 'PROJECT'
            }
        });
    }

    if (systemRoleNames.length > 0) {
        return systemRoleNames;
    }
    if (domainRoleNames.length > 0) {
        return domainRoleNames;
    }
    if (projectRoleNames.length > 0) {
        return projectRoleNames;
    }
    return ['No Role'];
};

export const hasDomainRole = (state: UserState): boolean => {
    if (state.roles) {
        return state.roles.some(role => role.roleType === 'DOMAIN');
    }

    return false;
};

export const hasPermission = (state: UserState): boolean => !!state.roles?.length;

export const pagePermissionList: Getter<UserState, any> = (state, getters): PagePermissionTuple[] => {
    if (getters.isDomainOwner) {
        return getDefaultPagePermissionList(true, true);
    }
    const roleBasePagePermissions = state.roles?.flatMap(role => role.pagePermissions) ?? [];
    const pagePermissionMap = getPagePermissionMapFromRaw(roleBasePagePermissions);
    // merge role based page permissions and default page permissions
    getDefaultPagePermissionList(false, getters.hasPermission).forEach(([page, permission]) => {
        pagePermissionMap[page] = getProperPermissionType(permission, pagePermissionMap[page]);
    });
    return Object.entries(pagePermissionMap);
};

export const pagePermissionMap: Getter<UserState, any> = (state, getters): Record<string, PagePermissionType> => {
    const result: Record<string, PagePermissionType> = {};
    getters.pagePermissionList.forEach(([page, permission]) => {
        if (!result[page]) result[page] = permission;
        else if (permission === PAGE_PERMISSION_TYPE.MANAGE) result[page] = PAGE_PERMISSION_TYPE.MANAGE;
    });
    return result;
};
