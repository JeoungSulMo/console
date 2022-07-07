<template>
    <div ref="container">
        <slot v-if="isLoading" />
    </div>
</template>

<script lang="ts">
import {
    ComponentRenderProxy,
    getCurrentInstance,
    onMounted, reactive, toRefs,
} from '@vue/composition-api';

export default {
    name: 'ViewPortLoading',
    setup() {
        const vm = getCurrentInstance()?.proxy as ComponentRenderProxy;

        const state = reactive({
            isLoading: false,
            container: null as HTMLElement | null,
        });

        const isComponentInViewPort = () => {
            console.log(state.container?.getBoundingClientRect().top, window.innerHeight);
            if (!state.container) return false;
            return state.container?.getBoundingClientRect().top < window.innerHeight;
        };
        const checkChartRenderingPossible = () => {
            const real = isComponentInViewPort();
            console.log('checkChartRenderingPossible', real);
            console.log('render target: ', vm.$parent.$options.name);
            if (real) {
                document.removeEventListener('wheel', checkChartRenderingPossible);
                console.log('render complete: ', vm.$parent.$options.name);
                state.isLoading = true;
            }
        };

        onMounted(() => {
            checkChartRenderingPossible();
            document.addEventListener('wheel', checkChartRenderingPossible);
        });

        return {
            ...toRefs(state),
        };
    },
};
</script>
