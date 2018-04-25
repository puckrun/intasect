// Third party library.
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

// Config.
import { AppConfig } from '../app/app.config';

@Injectable()
export class StorageUtil {

    constructor(private appConfig: AppConfig, private storage: Storage) {

    }

    set(key, value) {
        return this.storage.set(key, value);
    }

    get(key) {
        return this.storage.get(key);
    }

    remove(key) {
        this.storage.remove(key);
    }
}