// Third party library.
import {Component} from '@angular/core';
import {Platform, NavController} from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

// Utils.
import {Util} from '../../utils/util';

// Services.
import {AboutService} from '../../providers/about-service';

@Component({
    selector: 'page-about',
    templateUrl: 'about.html',
    providers: [
        AboutService
    ]
})

export class AboutPage {

    public version: string = 'latest';
    public latestVersion: string = 'latest';
    public upgradeUrl: string = '';

    constructor(private nav: NavController, private platform: Platform, private util: Util, private aboutService: AboutService, private translate: TranslateService) {
        this.getVersionInfo();
        this.getUpgradeUrl();
    }

    getVersionInfo(): void {
        this.aboutService.getVersion().then(data => {
            this.version = data;
        });

        this.aboutService.getLatestVersion().then(data => {
            this.latestVersion = data;
        });
    }

    getUpgradeUrl(): void {
        this.aboutService.getUpgradeUrl().then(data => {
            this.upgradeUrl = data;
        });
    }

    openUpgradeUrl(): boolean {
        if (this.version === this.latestVersion) {
            return false;
        }
    }
}
