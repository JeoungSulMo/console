<template>
    <div class="page-mask">
        <p-pane-layout class="page-wrapper">
            <div class="page-navigation">
                <div class="title-wrapper">
                    <p-icon-button name="ic_back"
                                   class="mr-2"
                                   @click="goBack()"
                    />
                    <div class="title">
                        {{ $t('PROJECT.LANDING.MANAGE_PROJECT_GROUP_MEMBER') }}
                    </div>
                </div>
            </div>
            <project-member-tab :is-project-group="true"
                                :project-group-id="groupId"
                                :manage-disabled="manageDisabled"
                                class="mt-8"
            />
        </p-pane-layout>
        <f-n-b class="fnb" />
    </div>
</template>

<script lang="ts">
import { PPaneLayout, PIconButton } from '@spaceone/design-system';

import FNB from '@/common/modules/navigations/FNB.vue';

import ProjectMemberTab from '@/services/project/project-detail/project-member/modules/ProjectMemberTab.vue';

export default {
    name: 'ProjectGroupMember',
    components: {
        FNB,
        PPaneLayout,
        PIconButton,
        ProjectMemberTab,
    },
    props: {
        groupId: {
            type: String,
            required: true,
        },
        manageDisabled: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }) {
        const goBack = () => {
            emit('close');
        };

        return {
            goBack,
        };
    },
};
</script>

<style lang="postcss" scoped>
.page-mask {
    position: absolute;
    display: flex;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    flex-direction: column;

    .page-wrapper {
        width: 100%;
        border: none;
        flex-grow: 1;
        padding: 2rem 1.5rem;
        .page-navigation {
            .title-wrapper {
                display: flex;
                .title {
                    font-size: 1.5rem;
                    font-weight: bold;
                    line-height: 1.2;
                }
            }
        }
        .member-tab::v-deep {
            .p-toolbox-table {
                @apply border border-gray-200 rounded-md;
                border-style: solid;
                padding-bottom: 2.5rem;
            }
        }
        .project-group-pane {
            min-height: 23.5rem;
            overflow-y: auto;
            padding-left: 1rem;
            margin: 1.5rem 0;
        }
    }
    .fnb {
        @apply flex-grow-0 border-none bg-white;
    }
}
</style>
