<template>
    <p-list-card v-if="visible && !loading && items.length !== 0"
                 :loading="loading" :items="items"
                 style-type="yellow500"
    >
        <template #header>
            <div class="header-wrapper" @click="onClickHeader">
                <p-i name="ic_state_duplicated" height="1.25rem" width="1.25rem"
                     color="inherit" class="icon"
                />
                <span class="text">{{ $t('PROJECT.DETAIL.NOW_HAPPENING_MAINTENANCE') }}</span>
                <p-i name="ic_delete" height="1.25rem" width="1.25rem"
                     color="inherit" class="close-button"
                />
            </div>
        </template>
        <template #item="{item}">
            <div>
                <span class="title">{{ item.title }}</span>
                <span>
                    {{ iso8601Formatter(item.start_time, timezone, TIME_FORMAT) }} ~
                    {{ iso8601Formatter(item.end_time, timezone, TIME_FORMAT) }}
                </span>
            </div>
        </template>
    </p-list-card>
</template>

<script lang="ts">
import { computed, reactive, toRefs } from '@vue/composition-api';

import { iso8601Formatter } from '@spaceone/console-core-lib';
import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import { ApiQueryHelper } from '@spaceone/console-core-lib/space-connector/helper';
import { PListCard, PI } from '@spaceone/design-system';

import { store } from '@/store';

import ErrorHandler from '@/common/composables/error/errorHandler';

const TIME_FORMAT = 'YYYY-MM-DD HH:mm';
export default {
    name: 'MaintenanceHappeningList',
    components: {
        PListCard,
        PI,
    },
    props: {
        projectId: {
            type: String,
            default: '',
        },
    },
    setup(props) {
        const state = reactive({
            loading: false,
            items: [],
            timezone: computed(() => store.state.user.timezone),
            visible: true,
        });

        /* API calls */
        const queryHelper = new ApiQueryHelper().setFilters([{
            k: 'state', v: 'OPEN', o: '=',
        }]);
        const query = queryHelper.data;
        const getMaintenanceWindows = async () => {
            if (state.loading) return;

            state.loading = true;
            try {
                const { results } = await SpaceConnector.client.monitoring.maintenanceWindow.list({
                    project_id: props.projectId,
                    query,
                });

                state.items = results;
            } catch (e) {
                ErrorHandler.handleError(e);
                state.items = [];
            } finally {
                state.loading = false;
            }
        };

        const onClickHeader = () => {
            state.visible = false;
        };

        /* Init */
        (async () => {
            await getMaintenanceWindows();
        })();

        return {
            ...toRefs(state),
            onClickHeader,
            iso8601Formatter,
            TIME_FORMAT,
            reload: () => {
                state.visible = true;
                getMaintenanceWindows();
            },
        };
    },
};
</script>

<style lang="postcss" scoped>
.header-wrapper {
    display: flex;
    align-items: center;
    cursor: pointer;
    .icon {
        margin-right: 0.25rem;
        flex-shrink: 0;
    }
    .text {
        flex-shrink: 0;
        flex-grow: 1;
    }
    .close-button {
        flex-shrink: 0;
    }
}

.title {
    @apply font-bold;
    margin-right: 0.5rem;
}
</style>
