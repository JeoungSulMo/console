<template>
    <p-field-group :label="$t('BILLING.COST_MANAGEMENT.BUDGET.FORM.BASE_INFO.LABEL_TARGET')"
                   :invalid="!disableValidation && invalidState.selectedTargets"
                   :invalid-text="invalidTexts.selectedTargets"
                   required
    >
        <project-select-dropdown :selected-project-ids="selectedTargets"
                                 :invalid="!disableValidation && invalidState.selectedTargets"
                                 project-selectable
                                 project-group-selectable
                                 :multi-selectable="multiSelectable"
                                 @update:selectedProjectIds="setForm('selectedTargets', $event)"
                                 @close="validate('selectedTargets')"
        />
    </p-field-group>
</template>

<script lang="ts">
import { defineComponent, watch } from '@vue/composition-api';

import { PFieldGroup } from '@spaceone/design-system';
import { debounce } from 'lodash';

import { i18n } from '@/translations';

import { useFormValidator } from '@/common/composables/form-validator';
import ProjectSelectDropdown from '@/common/modules/project/ProjectSelectDropdown.vue';


interface Props {
    targets: string[];
    multiSelectable?: boolean;
    disableValidation?: boolean;
}
export default defineComponent<Props>({
    name: 'BudgetTargetSelect',
    components: {
        PFieldGroup,
        ProjectSelectDropdown,
    },
    props: {
        targets: {
            type: Array,
            default: () => [],
        },
        multiSelectable: {
            type: Boolean,
            default: false,
        },
        disableValidation: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }) {
        const {
            forms: {
                selectedTargets,
            },
            setForm,
            invalidState,
            invalidTexts,
            isAllValid,
            validate,
        } = useFormValidator({
            selectedTargets: [] as string[],
        }, {
            selectedTargets(value: string[]) { return value.length ? '' : i18n.t('BILLING.COST_MANAGEMENT.BUDGET.FORM.BASE_INFO.REQUIRED_TARGET'); },
        });

        watch([() => selectedTargets.value, () => isAllValid.value], debounce(([targets, isValid]) => {
            const target: string[]|string = props.multiSelectable ? targets : targets[0];
            emit('update', target, isValid);
        }, 300), { immediate: true });

        return {
            selectedTargets,
            invalidState,
            invalidTexts,
            setForm,
            validate,
        };
    },
});
</script>
