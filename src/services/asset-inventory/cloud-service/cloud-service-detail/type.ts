import { Tags } from '@/models';

export interface CloudServiceTypeInfo {
    cloud_service_type_id: string;
    cloud_service_type_key: string;
    name: string;
    provider: string;
    group: string;
    service_code: string;
    is_primary: boolean;
    is_major: boolean;
    resource_type: string;
    metadata: any;
    labels: string[];
    tags: Tags;
}

export interface CloudServiceDetailPageParams {
    provider: string;
    group: string;
    name?: string;
}

/* History Tab */
export const HISTORY_ACTION_MAP = {
    UPDATE: { label: 'Update', color: 'GREEN' },
    CREATE: { label: 'Created', color: 'BLUE' },
    DELETE: { label: 'Deleted', color: 'RED' },
} as const;
export interface DiffItem {
    key: string;
    previousValue?: any;
    changedValue: any;
    type: string;
}
export interface CloudServiceHistoryItem {
    recordId: string;
    date: string;
    title: string;
    action: string;
    diffItems?: DiffItem[];
    diffCount?: number;
}
