import type { QueryStoreFilter } from '@spaceone/console-core-lib/query/type';

import type { CloudServiceFilterMap, Period } from '@/services/asset-inventory/cloud-service/type';

export interface CloudServiceStoreState {
    selectedProvider: string;
    period?: Period;
    additionalFilters: CloudServiceFilterMap;
    searchFilters: QueryStoreFilter[];
}
