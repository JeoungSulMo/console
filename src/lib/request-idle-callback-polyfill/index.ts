interface RequestIdleCallback {
    didTimeout?: boolean;
    timeRemaining?(): DOMHighResTimeStamp;
}

type RequestIdleCallbackId = number;

export const initRequestIdleCallback = () => {
    window.requestIdleCallback = window.requestIdleCallback
    || function (cb: (deadline: RequestIdleCallback) => any) {
        const start = Date.now();
        return setTimeout(() => {
            cb({
                didTimeout: false,
                timeRemaining() {
                    return Math.max(0, 50 - (Date.now() - start));
                },
            });
        }, 1);
    };

    window.cancelIdleCallback = window.cancelIdleCallback
    || function (id: RequestIdleCallbackId) {
        clearTimeout(id);
    };
};
