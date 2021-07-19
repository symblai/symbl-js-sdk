import isNode from 'detect-node';
import InMemoryStore from './InMemoryStore';

export default class Cache {

    constructor() {
        if (isNode) {
            this.cacheStore = new InMemoryStore();
        } else {
            // TODO: Add Session Store based store
            this.cacheStore = new InMemoryStore();
        }

        this.get = this.get.bind(this);
        this.set = this.set.bind(this);
        this.remove = this.remove.bind(this);
        this.contains = this.contains.bind(this);
    }

    contains(key) {
        return this.cacheStore.contains(key);
    }

    get(key) {
        return this.cacheStore.get(key);
    }

    set(key, value) {
        this.cacheStore.set(key, value);
    }

    remove(key) {
        this.cacheStore.remove(key);
    }
}