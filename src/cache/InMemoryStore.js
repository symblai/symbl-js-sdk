import isNode from 'detect-node';

export default class InMemoryStore {
    // JavaScript runs in event loop so no need to ensure single instance as long as
    // same instance of underlying store is used to maintain the cache
    constructor() {

        if (isNode) {
            if (global.clientSdkStore) {
                this.store = global.clientSdkStore;
            } else {
                this.store = {};
                global.clientSdkStore = this.store;
            }
        } else {
            if (window) {
                if (window.clientSdkStore) {
                    this.store = window.clientSdkStore;
                } else {
                    this.store = {};
                    window.clientSdkStore = this.store;
                }
            }
        }

        this.get = this.get.bind(this);
        this.set = this.set.bind(this);
        this.remove = this.remove.bind(this);
    }

    contains(key) {
        return this.store.hasOwnProperty(key);
    }

    get(key) {
        return this.store[key];
    }

    set(key, value) {
        this.store[key] = value;
    }

    remove(key) {
        delete this.store[key];
    }



}