<template>
    <div class="escalation-policy-form">
        <p-field-group
            :label="$t('MONITORING.ALERT.ESCALATION_POLICY.FORM.NAME_LABEL')"
            required
            :invalid="!isNameValid"
            :invalid-text="nameInvalidText"
        >
            <p-text-input v-model="inputModel.name"
                          :invalid="!isNameValid"
                          class="w-1/2"
            />
        </p-field-group>
        <p-field-group
            v-if="showScope"
            :label="$t('MONITORING.ALERT.ESCALATION_POLICY.FORM.SCOPE_LABEL')"
            required
        >
            <template #default>
                <div v-if="mode === ACTION.create">
                    <p-radio v-for="(item, idx) in scopes" :key="idx"
                             :selected="item.value"
                             :value="inputModel.scope"
                             @change="onChangeScope(item.value)"
                    >
                        <span class="radio-label">{{ item.label }}</span>
                    </p-radio>
                </div>
            </template>
            <template #label-extra>
                <span v-if="mode === ACTION.update" class="scope-text">
                    <span>{{ scopeLabels[inputModel.scope] || inputModel.scope }}</span>
                    <span v-if="inputModel.scope === SCOPE.project">
                        (<p-anchor :to="referenceRouter(inputModel.project_id,{ resource_type: 'identity.Project' })"
                                   :text="projects[inputModel.project_id] ? projects[inputModel.project_id].label : inputModel.project_id"
                                   highlight
                                   class="align-top"
                        />)
                    </span>
                </span>
            </template>
        </p-field-group>
        <p-field-group v-if="showScope && inputModel.scope === SCOPE.project && mode === ACTION.create"
                       class="project-field"
                       required
                       :invalid="!isProjectValid"
                       :invalid-text="projectInvalidText"
        >
            <template #label>
                <span>{{ $t('MONITORING.ALERT.ESCALATION_POLICY.FORM.PROJECT_LABEL') }}</span>
                <p-anchor class="link-text"
                          :to="{ name: PROJECT_ROUTE._NAME }"
                          :text="$t('MONITORING.ALERT.ESCALATION_POLICY.FORM.GO_CREATE_PROJECT')"
                          highlight
                />
            </template>
            <project-select-dropdown project-selectable :invalid="!isProjectValid" @select="onSelectProject" />
        </p-field-group>
        <p-field-group
            :label="$t('MONITORING.ALERT.ESCALATION_POLICY.FORM.FINISH_CONDITION_LABEL')"
            required
        >
            <p-radio v-for="(item, idx) in finishConditions" :key="idx"
                     :selected="item.value"
                     :value="inputModel.finish_condition"
                     @change="onChangeFinishCondition(item.value)"
            >
                {{ item.label }}
            </p-radio>
        </p-field-group>
        <p-field-group
            :label="$t('MONITORING.ALERT.ESCALATION_POLICY.FORM.ESCALATION_RULES_LABEL')"
            required
        >
            <template #help>
                <span class="help-text">
                    {{ $t('MONITORING.ALERT.ESCALATION_POLICY.FORM.ESCALATION_RULES_HELP_TEXT') }}
                </span>
            </template>
            <escalation-rules-input-form
                :scope="inputModel.scope"
                :rules.sync="inputModel.rules"
                :repeat-count.sync="inputModel.repeat_count"
                :project-id="inputModel.project_id"
            />
        </p-field-group>
    </div>
</template>

<script lang="ts">
import {
    computed, reactive, toRefs, watch,
} from '@vue/composition-api';

import {
    PAnchor, PFieldGroup, PRadio, PTextInput,
} from '@spaceone/design-system';
import { cloneDeep } from 'lodash';


import { store } from '@/store';
import { i18n } from '@/translations';

import { referenceRouter } from '@/lib/reference/referenceRouter';

import { useProxyValue } from '@/common/composables/proxy-state';
import ProjectSelectDropdown from '@/common/modules/project/ProjectSelectDropdown.vue';

import EscalationRulesInputForm from '@/services/alert-manager/escalation-policy/modules/EscalationRulesInputForm.vue';
import { ACTION, FINISH_CONDITION, SCOPE } from '@/services/alert-manager/lib/config';
import type { EscalationPolicyFormModel } from '@/services/alert-manager/type';
import { PROJECT_ROUTE } from '@/services/project/route-config';


const DEFAULT_REPEAT_COUNT = 0;
const DEFAULT_NOTIFICATION_LEVEL = 'LV1';

export default {
    name: 'EscalationPolicyForm',
    components: {
        EscalationRulesInputForm,
        ProjectSelectDropdown,
        PFieldGroup,
        PTextInput,
        PRadio,
        PAnchor,
    },
    props: {
        mode: {
            type: String,
            default: undefined,
        },
        showScope: {
            type: Boolean,
            default: true,
        },
        escalationPolicy: {
            type: Object,
            default: undefined,
        },
        projectId: {
            type: String,
            default: undefined,
        },
        /* sync */
        isAllValid: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }) {
        const state = reactive({
            projects: computed(() => store.getters['reference/projectItems']),
            proxyIsAllValid: useProxyValue('isAllValid', props, emit),
            //
            inputModel: {
                name: undefined as undefined | string,
                scope: SCOPE.global,
                rules: [{ notification_level: DEFAULT_NOTIFICATION_LEVEL, escalate_minutes: undefined }],
                finish_condition: FINISH_CONDITION.acknowledged,
                repeat_count: DEFAULT_REPEAT_COUNT,
                project_id: props.projectId,
            } as EscalationPolicyFormModel,
            showValidation: false,
            isNameValid: computed(() => !state.nameInvalidText),
            nameInvalidText: computed(() => {
                if (typeof state.inputModel.name === 'undefined') return undefined;
                if (!state.inputModel.name) {
                    return i18n.t('MONITORING.ALERT.ESCALATION_POLICY.FORM.NAME_REQUIRED');
                }
                if (state.inputModel.name.length > 40) {
                    return i18n.t('MONITORING.ALERT.ESCALATION_POLICY.FORM.NAME_INVALID_TEXT');
                }
                return undefined;
            }),
            isProjectValid: computed(() => !state.projectInvalidText),
            projectInvalidText: computed(() => {
                if (!state.showValidation) return undefined;
                if (state.inputModel.scope === SCOPE.global) return undefined;
                if (!state.inputModel.project_id) {
                    return i18n.t('MONITORING.ALERT.ESCALATION_POLICY.FORM.PROJECT_REQUIRED');
                }
                return undefined;
            }),
            scopeLabels: computed(() => ({
                [SCOPE.global]: i18n.t('MONITORING.ALERT.ESCALATION_POLICY.FORM.GLOBAL'),
                [SCOPE.project]: i18n.t('MONITORING.ALERT.ESCALATION_POLICY.FORM.PROJECT'),
            })),
            scopes: computed(() => [
                {
                    label: i18n.t('MONITORING.ALERT.ESCALATION_POLICY.FORM.GLOBAL'), value: SCOPE.global,
                }, {
                    label: i18n.t('MONITORING.ALERT.ESCALATION_POLICY.FORM.PROJECT'), value: SCOPE.project,
                },
            ]),
            finishConditions: computed(() => [
                {
                    label: i18n.t('MONITORING.ALERT.ESCALATION_POLICY.FORM.ACKNOWLEDGED'), value: FINISH_CONDITION.acknowledged,
                }, {
                    label: i18n.t('MONITORING.ALERT.ESCALATION_POLICY.FORM.RESOLVED'), value: FINISH_CONDITION.resolved,
                },
            ]),
        });

        /* util */
        const initInputModel = () => {
            if (props.mode === ACTION.create) {
                state.inputModel.name = undefined;
                state.inputModel.scope = SCOPE.global;
                state.inputModel.rules = [{ notification_level: DEFAULT_NOTIFICATION_LEVEL, escalate_minutes: undefined }];
                state.inputModel.finish_condition = FINISH_CONDITION.acknowledged;
                state.inputModel.project_id = props.projectId;
                state.inputModel.repeat_count = DEFAULT_REPEAT_COUNT;
                state.proxyIsAllValid = false;
            } else if (props.mode === ACTION.update && props.escalationPolicy) {
                state.inputModel = cloneDeep(props.escalationPolicy);
                state.proxyIsAllValid = true;
            }
        };

        /* event */
        const onChangeInputModel = () => {
            // state.showValidation = true;
            state.proxyIsAllValid = state.isNameValid && state.isProjectValid;
            emit('change', state.inputModel);
        };
        const onChangeScope = (value) => {
            state.inputModel.scope = value;
            if (value === SCOPE.global) state.inputModel.project_id = undefined;
        };
        const onChangeFinishCondition = (value) => {
            state.inputModel.finish_condition = value;
        };
        const onSelectProject = (selected) => {
            state.inputModel.project_id = selected[0]?.id;
        };

        watch([() => props.mode, () => props.escalationPolicy], () => {
            initInputModel();
        }, { immediate: true });

        watch(() => state.inputModel, () => {
            onChangeInputModel();
        }, { deep: true });

        // LOAD REFERENCE STORE
        (async () => {
            await store.dispatch('reference/project/load');
        })();

        return {
            ...toRefs(state),
            referenceRouter,
            SCOPE,
            ACTION,
            PROJECT_ROUTE,
            onChangeScope,
            onChangeFinishCondition,
            onSelectProject,
        };
    },
};
</script>

<style lang="postcss" scoped>
.escalation-policy-form {
    .project-field::v-deep {
        .label-box {
            display: block;
            .form-label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                .link-text {
                    font-weight: normal;
                    font-size: 0.75rem;
                }
            }
        }
    }
    .p-text-input {
        .input-container {
            @apply rounded-md;
        }
    }
    .p-radio {
        &:first-of-type {
            margin-right: 1.125rem;
        }
    }
    .scope-text {
        text-transform: capitalize;
        font-weight: normal;
        padding-left: 0.5rem;
        .p-anchor {
            vertical-align: top;
        }
    }
    .help-text {
        @apply text-gray-900;
        font-size: 0.875rem;
    }
}
</style>
