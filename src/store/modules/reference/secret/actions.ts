import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import type { Action } from 'vuex';

import { REFERENCE_LOAD_TTL } from '@/store/modules/reference/config';
import type { SecretReferenceMap, SecretReferenceState } from '@/store/modules/reference/secret/type';

import ErrorHandler from '@/common/composables/error/errorHandler';

let lastLoadedTime = 0;

export const load: Action<SecretReferenceState, any> = async ({ state, commit }, lazyLoad = false): Promise<void|Error> => {
    const currentTime = new Date().getTime();

    if (
        (lazyLoad && Object.keys(state.items).length > 0)
        || (lastLoadedTime !== 0 && currentTime - lastLoadedTime < REFERENCE_LOAD_TTL)
    ) return;
    lastLoadedTime = currentTime;

    try {
        const response = await SpaceConnector.client.secret.secret.list({
            query: {
                only: ['secret_id', 'name'],
            },
        }, { timeout: 3000 });
        const secrets: SecretReferenceMap = {};

        response.results.forEach((secretInfo: any): void => {
            secrets[secretInfo.secret_id] = {
                label: secretInfo.name,
                name: secretInfo.name,
            };
        });

        commit('setSecrets', secrets);
    } catch (e) {
        ErrorHandler.handleError(e);
    }
};

export const sync: Action<SecretReferenceState, any> = ({ state, commit }, secretInfo): void => {
    const secrets: SecretReferenceMap = {
        ...state.items,
        [secretInfo.secret_id]: {
            label: secretInfo.name,
            name: secretInfo.name,
        },
    };
    commit('setSecrets', secrets);
};
