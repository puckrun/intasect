// Third party library.
import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Platform} from 'ionic-angular';
import { AppVersion } from '@ionic-native/app-version';

// Config.
import {AppConfig} from '../app/app.config';

// Utils.
import {Util} from '../utils/util';

@Injectable()
export class AboutService {

    constructor(private http: HttpClient, private platform: Platform, private appVersion: AppVersion, private util: Util, private appConfig: AppConfig) {
    }

    getVersion(): any {
        return this.appVersion.getVersionNumber();
    }

    getLatestVersion(): any {
        return new Promise<string>(resolve => {
            // Get app version from pgyer.
            //let url = 'http://www.pgyer.com/apiv1/app/viewGroup';
            //let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
            //let parameters = 'aId=3faa45a6bbc5cb46c195ba94b01ac85a';
            //parameters += '&_api_key=61b73e850a3cc863a5d34dfe6d8bed85';

            //this.http.post(url, parameters, {
            //    headers: headers
            // })
            let url = this.appConfig.get('VERSION_URL_JAPAN');
            if (this.appConfig.get('IS_CHINA_SERVER')) {
                url = this.appConfig.get('VERSION_URL_CHINA');
            }
            
            this.http.get(url)
                .subscribe(data => {
                    resolve(data['version']);
                }, error => {
                    this.util.presentSystemErrorModal();
                });
        });
    }

    getUpgradeUrl(): Promise<string> {
        return new Promise<string>(resolve => {
            let url = this.appConfig.get('DOWNLOAD_URL_JAPAN');
            if (this.appConfig.get('IS_CHINA_SERVER')) {
                url = this.appConfig.get('DOWNLOAD_URL_CHINA');
            }
            resolve(url);
        });
    }
}

