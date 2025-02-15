import type { ComputedRef } from '@vue/composition-api';
import {
    computed, reactive,
} from '@vue/composition-api';

import { makeDistinctValueHandler, makeEnumValueHandler, makeReferenceValueHandler } from '@spaceone/console-core-lib/component-util/query-search';
import type { KeyItem, ValueHandlerMap } from '@spaceone/console-core-lib/component-util/query-search/type';
import type { Filter } from '@spaceone/console-core-lib/space-connector/type';
import type { KeyItemSet } from '@spaceone/design-system/dist/src/inputs/search/query-search/type';
import { debouncedWatch } from '@vueuse/core';

import { store } from '@/store';

import type { ConsoleSearchSchema } from '@/lib/component-util/dynamic-layout/type';


const getKeyItemSets = (schemaList: ConsoleSearchSchema[], storeState): KeyItemSet[] => {
    const keyItemSets: KeyItemSet[] = [];
    schemaList.forEach((schema) => {
        const keyItems: KeyItem[] = [];
        schema.items.forEach((item) => {
            const keyItem: any = {
                label: item.name,
                name: item.key,
                dataType: item.data_type,
                reference: item.reference,
            };
            if (item.enums || item.reference) {
                keyItem.operators = ['=', '!='];
            }
            if (item.reference) {
                const splitReference = item.reference.split('.');
                const reference = splitReference[splitReference.length - 1];
                keyItem.valueSet = storeState[reference];
            }
            keyItems.push(keyItem);
        });
        const keyItemSet: KeyItemSet = {
            title: schema.title,
            items: keyItems,
        };
        keyItemSets.push(keyItemSet);
    });
    return keyItemSets;
};
const getValueHandlerMap = (schemaList: ConsoleSearchSchema[], resourceType: string, filters?: Filter[]): ValueHandlerMap => {
    const valueHandlerMap: ValueHandlerMap = {};
    schemaList.forEach((schema) => {
        schema.items.forEach((item) => {
            if (item.enums) {
                valueHandlerMap[item.key] = makeEnumValueHandler(item.enums);
            } else if (item.reference) {
                valueHandlerMap[item.key] = makeReferenceValueHandler(item.reference, item.data_type);
            } else {
                valueHandlerMap[item.key] = makeDistinctValueHandler(resourceType, item.key, item.data_type, filters);
            }
        });
    });
    return valueHandlerMap;
};

/**
 * @name useQuerySearchPropsWithSearchSchema
 * @description A hook that returns props(keyItemSets, valueHandlerMap) necessary for DynamicLayoutQuerySearch component using search schema.
 *              Loading all reference store values inside the hook.
 * @param searchSchema
 * @param resourceType
 * @param filters
 */
export function useQuerySearchPropsWithSearchSchema(
    searchSchema: ComputedRef<ConsoleSearchSchema[]>,
    resourceType: string,
    filters?: Filter[],
): { keyItemSets: ComputedRef<KeyItemSet[]>, valueHandlerMap: ComputedRef<ValueHandlerMap>, isAllLoaded: ComputedRef<boolean> } {
    (async () => {
        await store.dispatch('reference/loadAll');
    })();
    const storeState = reactive({
        Project: computed(() => store.getters['reference/projectItems']),
        ProjectGroup: computed(() => store.state.reference.projectGroup.items),
        ServiceAccount: computed(() => store.state.reference.serviceAccount.items),
        CloudServiceType: computed(() => store.state.reference.cloudServiceType.items),
        Secret: computed(() => store.state.reference.secret.items),
        Collector: computed(() => store.state.reference.collector.items),
        Provider: computed(() => store.state.reference.provider.items),
        Region: computed(() => store.state.reference.region.items),
        Plugin: computed(() => store.state.reference.plugin.items),
        User: computed(() => store.state.reference.user.items),
        Protocol: computed(() => store.state.reference.protocol.items),
        Webhook: computed(() => store.state.reference.webhook.items),
    });

    const state = reactive({
        keyItemSets: [] as KeyItemSet[],
    });


    debouncedWatch([() => searchSchema.value, () => store.state.reference.isAllLoaded], (watchValue) => {
        if (!watchValue) return;
        const [schema, isAllLoaded] = watchValue;
        if (isAllLoaded && schema.length) {
            state.keyItemSets = getKeyItemSets(schema, storeState);
        }
    }, { immediate: true, debounce: 200 });

    return {
        isAllLoaded: computed(() => store.state.reference.isAllLoaded),
        keyItemSets: computed(() => state.keyItemSets),
        valueHandlerMap: computed(() => getValueHandlerMap(searchSchema.value, resourceType, filters)),
    };
}
