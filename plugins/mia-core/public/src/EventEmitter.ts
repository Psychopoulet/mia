// types & interfaces

    type Listener<Args extends unknown[]> = (...args: Args) => void;

// component

/**
 * EventEmitter-like facade over the native DOM EventTarget.
 * Keeps the same EventMap shape as Node's EventEmitter (`"event": [args...]`).
 */
export default class EventEmitter<T extends { [K in keyof T]: unknown[] }> extends EventTarget {

    // private

        private readonly _wrappers: WeakMap<object, Map<string, EventListener>> = new WeakMap();

    // public methods

    public on<K extends keyof T & string>(event: K, listener: Listener<T[K]>): this {

        let byEvent: Map<string, EventListener> | undefined = this._wrappers.get(listener);

        if (!byEvent) {
            byEvent = new Map();
            this._wrappers.set(listener, byEvent);
        }

        let wrapper: EventListener | undefined = byEvent.get(event);

        if (!wrapper) {

            wrapper = (e: Event): void => {
                listener(...(e as CustomEvent<T[K]>).detail);
            };

            byEvent.set(event, wrapper);
            this.addEventListener(event, wrapper);

        }

        return this;

    }

    public off<K extends keyof T & string>(event: K, listener: Listener<T[K]>): this {

        const byEvent: Map<string, EventListener> | undefined = this._wrappers.get(listener);
        const wrapper: EventListener | undefined = byEvent?.get(event);

        if (byEvent && wrapper) {

            this.removeEventListener(event, wrapper);
            byEvent.delete(event);

            if (0 === byEvent.size) {
                this._wrappers.delete(listener);
            }

        }

        return this;

    }

    public once<K extends keyof T & string>(event: K, listener: Listener<T[K]>): this {

        const onceListener: Listener<T[K]> = (...args: T[K]): void => {

            this.off(event, onceListener);
            listener(...args);

        };

        return this.on(event, onceListener);

    }

    public emit<K extends keyof T & string>(event: K, ...args: T[K]): boolean {

        return this.dispatchEvent(new CustomEvent(event, {
            "detail": args
        }));

    }

}
