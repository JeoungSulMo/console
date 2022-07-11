import { ComputedRef, onMounted } from '@vue/composition-api';


export const useLazyRenderingChart = (element?: ComputedRef<HTMLElement | null>, init?) => {
    const isComponentInViewPort = () => {
        if (!element?.value) return false;
        return element?.value?.getBoundingClientRect().top < window.innerHeight;
    };
    const checkChartRenderingPossible = () => {
        const real = isComponentInViewPort();

        if (real) {
            document.removeEventListener('wheel', checkChartRenderingPossible);
            init();
        }
    };

    onMounted(() => {
        checkChartRenderingPossible();
        document.addEventListener('wheel', checkChartRenderingPossible);
    });
};
