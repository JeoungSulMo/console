import {
    ComputedRef, onMounted, ref,
} from '@vue/composition-api';


export const useLazyRenderingChart = (element?: ComputedRef<HTMLElement | null>, init?) => {
    const isElementInViewport = ref(false);
    const isComponentInViewPort = () => {
        if (!element?.value) return false;
        return element?.value?.getBoundingClientRect().top < window.innerHeight;
    };
    const checkChartRenderingPossible = () => {
        const real = isComponentInViewPort();

        if (real) {
            console.log('du', element?.value?.getBoundingClientRect().top);
            document.removeEventListener('wheel', checkChartRenderingPossible);
            init();
            isElementInViewport.value = true;
        }
    };

    onMounted(() => {
        checkChartRenderingPossible();
        document.addEventListener('wheel', checkChartRenderingPossible);
    });
};
