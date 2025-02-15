<template>
    <div>
        <p-field-group
            :label="$t('IDENTITY.USER.NOTIFICATION.FORM.CHANNEL_NAME')"
            required
            :invalid-text="nameInvalidText"
            :invalid="isNameInvalid"
            class="base-info-input"
        >
            <template #default>
                <p-text-input v-model="channelName" class="block w-full" :invalid="isNameInvalid"
                              :placeholder="$t('IDENTITY.USER.NOTIFICATION.FORM.CHANNEL_NAME')" @input="onChangeChannelName"
                />
            </template>
        </p-field-group>
        <add-notification-level v-if="projectId" @change="onChangeLevel" />
        <p-json-schema-form
            :model="schemaModel" :schema="schema" :is-valid.sync="isSchemaModelValid"
            class="schema-form"
            @update:model="onChangeModel"
        />
        <div v-if="projectId && protocol === CHANNEL_TYPE.SPACEONE_USER">
            <p-field-group :label="$t('MENU.ADMINISTRATION_USER')" required>
                <template #default>
                    <add-notification-member-group :project-id="projectId" @change="onChangeMember" />
                </template>
            </p-field-group>
        </div>
    </div>
</template>

<script lang="ts">

import type { ComponentRenderProxy } from '@vue/composition-api';
import {
    computed, getCurrentInstance, onActivated, reactive, toRefs,
} from '@vue/composition-api';

import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import { ApiQueryHelper } from '@spaceone/console-core-lib/space-connector/helper';
import {
    PFieldGroup, PTextInput, PJsonSchemaForm,
} from '@spaceone/design-system';

import ErrorHandler from '@/common/composables/error/errorHandler';

import AddNotificationLevel from '@/services/notification/modules/AddNotificationLevel.vue';
import AddNotificationMemberGroup from '@/services/notification/modules/AddNotificationMemberGroup.vue';

const CHANNEL_TYPE = {
    AWS_SNS: 'AWSSNS',
    SLACK: 'Slack',
    SPACEONE_USER: 'SpaceONEUser',
} as const;
// type ChannelType = typeof CHANNEL_TYPE[keyof typeof CHANNEL_TYPE];

const PROTOCOL_TYPE = {
    INTERNAL: 'INTERNAL',
    EXTERNAL: 'EXTERNAL',
} as const;
// type ProtocolType = typeof PROTOCOL_TYPE[keyof typeof PROTOCOL_TYPE];

export default {
    name: 'AddNotificationData',
    components: {
        AddNotificationLevel,
        AddNotificationMemberGroup,
        PFieldGroup,
        PTextInput,
        PJsonSchemaForm,
    },
    props: {
        projectId: {
            type: String,
            default: '',
        },
        supportedSchema: {
            type: [String, Array],
            default: null,
        },
        protocolType: {
            type: String,
            default: '',
        },
        protocolId: {
            type: String,
            default: undefined,
        },
    },
    setup(props, { emit }) {
        const vm = getCurrentInstance()?.proxy as ComponentRenderProxy;
        const protocol = vm.$route.params.protocol;

        const state = reactive({
            channelName: undefined,
            notificationLevel: 'LV1',
            schemaModel: {},
            schema: {},
            isSchemaModelValid: false,
            nameInvalidText: computed(() => {
                if (state.channelName !== undefined && state.channelName.length === 0) {
                    return vm.$t('MONITORING.ALERT.ESCALATION_POLICY.FORM.NAME_REQUIRED');
                }
                if (state.channelName !== undefined && state.channelName.length > 40) {
                    return vm.$t('MONITORING.ALERT.ESCALATION_POLICY.FORM.NAME_INVALID_TEXT');
                }
                return undefined;
            }),
            isNameInvalid: computed(() => !!state.nameInvalidText),
            //
            isJsonSchema: computed(() => Object.keys(state.schema).length !== 0),
            isInputNotEmpty: computed(() => state.channelName !== undefined && Object.keys(state.schemaModel).length !== 0),
            isInputValid: computed(() => state.isInputNotEmpty && (state.isSchemaModelValid && !state.isNameInvalid)),
            isDataValid: computed(() => (!state.isJsonSchema && !state.isNameInvalid) || (state.isJsonSchema && state.isInputValid)),
            selectedMember: [],
        });

        const apiQuery = new ApiQueryHelper();
        apiQuery.setFilters([{ k: 'protocol_id', v: props.protocolId, o: '=' }]);
        const getSchema = async () => {
            try {
                const res = await SpaceConnector.client.notification.protocol.list({
                    query: apiQuery.data,
                });
                state.schema = res.results[0].plugin_info.metadata.data.schema;
            } catch (e) {
                ErrorHandler.handleError(e);
                state.schema = {};
            }
        };

        const emitChange = () => {
            emit('change', {
                channelName: state.channelName,
                data: (props.protocolType === PROTOCOL_TYPE.EXTERNAL) ? state.schemaModel : { users: state.selectedMember },
                level: state.notificationLevel,
                isValid: state.isDataValid,
            });
        };

        const onChangeChannelName = (value) => {
            state.channelName = value;
            emitChange();
        };

        const onChangeModel = (value) => {
            state.schemaModel = value;
            emitChange();
        };

        const onChangeMember = (value) => {
            state.selectedMember = value.users;
            emitChange();
        };

        const onChangeLevel = (value) => {
            state.notificationLevel = value.level;
            emitChange();
        };

        (async () => {
            if (props.supportedSchema && props.protocolType === PROTOCOL_TYPE.EXTERNAL) await getSchema();
        })();

        onActivated(() => {
            if (props.supportedSchema && props.protocolType === PROTOCOL_TYPE.EXTERNAL) getSchema();
        });

        return {
            protocol,
            CHANNEL_TYPE,
            ...toRefs(state),
            onChangeChannelName,
            onChangeModel,
            onChangeMember,
            onChangeLevel,
        };
    },

};
</script>

<style lang="postcss" scoped>
.base-info-input {
    max-width: 30rem;
    margin-top: 1.25rem;
}
.p-json-schema-form::v-deep {
    .json-schema-field-group {
        max-width: 30rem;
    }
}
</style>
