import { computed, reactive, ref } from '@vue/composition-api';

import { makeDistinctValueHandler, makeEnumValueHandler, makeReferenceValueHandler } from '@spaceone/console-core-lib/component-util/query-search';
import { Filter } from '@spaceone/console-core-lib/space-connector/type';
import { QuerySearchProps, KeyItemSet } from '@spaceone/design-system/dist/src/inputs/search/query-search/type';

import { store } from '@/store';

import { ConsoleSearchSchema } from '@/lib/component-util/dynamic-layout/type';

export function useQuerySearchPropsWithSearchSchema() {
    const keyItemSets = ref<KeyItemSet[]>([]);
    const valueHandlerMap = {};
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
    store.dispatch('reference/loadAll');
    return (
        schema: ConsoleSearchSchema[],
        resourceType: string,
        filters?: Filter[],
    ): Pick<QuerySearchProps, 'keyItemSets'|'valueHandlerMap'> => {
        keyItemSets.value = schema.map(s => ({
            title: s.title,
            items: s.items.map((d) => {
                let operators;
                const _keyItemSets: any = {
                    label: d.name, name: d.key, dataType: d.data_type, reference: d.reference,
                };
                if (d.enums) {
                    valueHandlerMap[d.key] = makeEnumValueHandler(d.enums);
                    operators = ['=', '!='];
                } else if (d.reference) {
                    const splitReference = d.reference.split('.');
                    const reference = splitReference[splitReference.length - 1];
                    _keyItemSets.valueSet = storeState[reference];
                    valueHandlerMap[d.key] = makeReferenceValueHandler(
                        d.reference,
                        d.data_type,
                    );
                    operators = ['=', '!='];
                } else {
                    valueHandlerMap[d.key] = makeDistinctValueHandler(
                        resourceType,
                        d.key,
                        d.data_type,
                        filters,
                    );
                }
                _keyItemSets.operators = operators;
                return _keyItemSets;
            }),
        }));
        return { keyItemSets: keyItemSets.value, valueHandlerMap };
    };
}
