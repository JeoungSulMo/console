import { forEach } from 'lodash';
import { Location } from 'vue-router';
import router from '@/routes';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(tz);

export type RouteQueryString = string | (string | null)[] | null | undefined;


/** QueryString Converter Helpers */
export const replaceUrlQuery = async (key: string, value: RouteQueryString) => {
    try {
        await router.replace({ query: { ...router.currentRoute.query, [key]: value } });
    } catch (e) {

    }
};

export const queryStringToStringArray = (queryString: RouteQueryString): string[] => {
    if (queryString === undefined || queryString === null) return [];
    if (typeof queryString === 'string') return [queryString];
    return queryString.reduce((res, d) => {
        if (d !== null) res.push(d);
        return res;
    }, [] as string[]);
};

export const locationQueryToString = (locationQuery: Location['query']): string => {
    if (!locationQuery) return '';
    const queryStrings: string[] = [];
    forEach(locationQuery, (v, k) => {
        if (k === 'filters') {
            let filters: string[] = locationQuery.filters as string[];
            filters = filters.map(d => `filters=${d}`);
            queryStrings.push(...filters);
        } else {
            queryStrings.push(`${k}=${v}`);
        }
    });
    return queryStrings.join('&');
};
