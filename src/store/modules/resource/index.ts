import project from './project';
import projectGroup from './project-group';
import serviceAccount from './service-account';
import cloudServiceType from './cloud-service-type';
import secret from './secret';
import collector from './collector';
import provider from './provider';
import region from './region';
import plugin from './plugin';
import user from './user';
import spotGroup from './spot-group';
import protocol from './protocol';
import webhook from './webhook';
import * as actions from './actions';

export default {
    namespaced: true,
    modules: {
        project,
        projectGroup,
        serviceAccount,
        cloudServiceType,
        secret,
        collector,
        provider,
        region,
        plugin,
        user,
        spotGroup,
        protocol,
        webhook,
    },
    actions,
};
