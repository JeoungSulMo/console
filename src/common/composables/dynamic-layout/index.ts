import {
    computed, ComputedRef, reactive, ref, watch,
} from '@vue/composition-api';

import { makeDistinctValueHandler, makeEnumValueHandler, makeReferenceValueHandler } from '@spaceone/console-core-lib/component-util/query-search';
import { ValueHandlerMap } from '@spaceone/console-core-lib/component-util/query-search/type';
import { Filter } from '@spaceone/console-core-lib/space-connector/type';
import { KeyItemSet } from '@spaceone/design-system/dist/src/inputs/search/query-search/type';

import { store } from '@/store';

import { ConsoleSearchSchema } from '@/lib/component-util/dynamic-layout/type';


export function useQuerySearchPropsWithSearchSchema(
    searchSchema: ComputedRef<ConsoleSearchSchema[]>,
    resourceType: string,
    filters?: Filter[],
): [keyItemSets: ComputedRef<KeyItemSet[]>, valueHandlerMap: ComputedRef<ValueHandlerMap>] {
    const keyItemSets = ref<KeyItemSet[]>([]);
    const valueHandlerMap = ref<ValueHandlerMap>({});
    const storeState = reactive({
        Project: computed(() => store.state.reference.project.items),
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
    // LOAD REFERENCE STORE
    store.dispatch('reference/loadAll')
        .then(() => {
            watch(() => searchSchema.value, (after) => {
                // make querySearchProps
                keyItemSets.value = after.map(s => ({
                    title: s.title,
                    items: s.items.map((d) => {
                        let operators;
                        const keyItemSet: any = {
                            label: d.name, name: d.key, dataType: d.data_type, reference: d.reference,
                        };
                        if (d.enums) {
                            valueHandlerMap.value[d.key] = makeEnumValueHandler(d.enums);
                            operators = ['=', '!='];
                        } else if (d.reference) {
                            const splitReference = d.reference.split('.');
                            const reference = splitReference[splitReference.length - 1];
                            keyItemSet.valueSet = storeState[reference];
                            valueHandlerMap.value[d.key] = makeReferenceValueHandler(
                                d.reference,
                                d.data_type,
                            );
                            operators = ['=', '!='];
                        } else {
                            valueHandlerMap.value[d.key] = makeDistinctValueHandler(
                                resourceType,
                                d.key,
                                d.data_type,
                                filters,
                            );
                        }
                        keyItemSet.operators = operators;
                        return keyItemSet;
                    }),
                }));
            }, { immediate: true });
        });
    return [keyItemSets, valueHandlerMap];
}
