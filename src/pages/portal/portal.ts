// Third party library.
import { Component } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { TranslateService } from '@ngx-translate/core';

// Utils.
import { Util } from '../../utils/util';

// Config.
import { AppConfig } from '../../app/app.config';

// Services.
import { ShareService } from '../../providers/share-service';
import { AppsService } from '../../providers/apps-service';
import { UserService } from '../../providers/user-service';
import { BlogService } from '../../providers/blog-service';
import { AboutService } from '../../providers/about-service';
import { NotificationService } from '../../providers/notification-service';
import { SurveyService } from '../../providers/survey-service';
import { ScheduleService } from '../../providers/schedule-service';

import { InfoPage } from '../info/info';
import { ProfileIndexPage } from '../profile/index/index';
import { ScheduleIndexPage } from '../schedule/index/index';
import { AboutPage } from '../about/about';
import { DevicesPage } from '../schedule/devices/devices';
import { addressBookPage } from '../addressbook/index/index';


@Component({
    selector: 'page-portal',
    templateUrl: 'portal.html',
    providers: [
        AppsService,
        UserService,
        BlogService,
        NotificationService,
        SurveyService,
        ScheduleService,
        AboutService
    ]
})

export class PortalPage {

    public alias: string = '';

    public components = {
        'portal': PortalPage,
        'info': InfoPage,
        'profile': ProfileIndexPage,
        'schedule': ScheduleIndexPage,
        'about': AboutPage,
        'devices': DevicesPage,
        'personalInfo':addressBookPage
    };

    constructor(
        private platform: Platform,
        private iab: InAppBrowser,
        private nav: NavController,
        private appConfig: AppConfig,
        private util: Util,
        private share: ShareService,
        private translate: TranslateService,
        private aboutService: AboutService,
        private appsService: AppsService,
        private userService: UserService) {
        console.log('constructor')
        this.initializeUser().then(() => {
            console.log('initializeUser completed');
            this.initJPush().then(() => {
                console.log('initJPush');
                this.loadApplications();
                this.checkVersion();
            });
        });
        
        if (!this.share.showMenu) {
            this.share.showMenu = this.showMenu(this);
        }
    }

    checkVersion() {
        Promise.all([this.aboutService.getVersion(), this.aboutService.getLatestVersion()]).then(([version, latestVersion])=>{
            if (version !== latestVersion) {
                this.translate.get('app.message.warning.updateToNewVersion').subscribe(message => {
                    this.util.presentConfirmModal(message, 'warning', ()=>{
                        this.aboutService.getUpgradeUrl().then((url)=>{
                            let browser = this.iab.create(url, '_system');
                        });
                    }, ()=>{});
                });
            }
        });
    }

    initJPush(): Promise<void> {
        if (this.platform.is('cordova') && !this.appConfig.get('IS_TABLET')) {
            //启动极光推送
            if ((<any>window).plugins && (<any>window).plugins.jPushPlugin) {
                console.log('启动极光推送');
                (<any>window).plugins.jPushPlugin.init();
                return this.setAlias();
            }
        }
        return Promise.resolve();
    }

    setAlias(): Promise<void> {
        const that = this;
        return new Promise<void>((resolve, reject) => {
            console.log('设置alias' + that.alias);
            //设置Alias
            if (that.alias && that.alias.trim() != '') {
                (<any>window).plugins.jPushPlugin.setAlias(that.alias);
            }
            resolve();
        });
    }

    loadApplications() {
        return this.appsService.load().then((data: any) => {
            let menuIdNeedToRemove = [];

            // remove about page for web browser.
            if (!this.platform.is('cordova')) {
                menuIdNeedToRemove.push('about');
            }
            // remove notification, calendar, profile for real device.
            if (this.appConfig.get('IS_TABLET')) {
                menuIdNeedToRemove.push('blog');
                menuIdNeedToRemove.push('notification');
                menuIdNeedToRemove.push('survey');
                menuIdNeedToRemove.push('schedule');
                menuIdNeedToRemove.push('profile');
                menuIdNeedToRemove.push('about');
            } else if (this.platform.is('mobile')) {
                menuIdNeedToRemove.push('devices');
            }
            // remove unnecessary menu.
            for (let index = 0; index < data.length; index++) {
                let currentValue = data[index];
                for (let i = 0; i < menuIdNeedToRemove.length; i++) {
                    if (currentValue.componentsId === menuIdNeedToRemove[i]) {
                        data.splice(index, 1);
                        menuIdNeedToRemove.splice(i, 1);
                        index--;
                        break;
                    }
                }
            }

            this.share.initializeMenu(data);

            // set root page.
            if (!this.appConfig.get('IS_TABLET')) {
                // set root to blog.
                this.nav.setRoot(InfoPage);
            } else {
                // set root to devices on tablet
                this.nav.setRoot(DevicesPage);
            }
        });
    }

    initializeUser() {
        return new Promise(resolve => {
            console.log('initializeUser');
            this.userService.getUserDetails().then(data => {
                console.log('userService');
                this.alias = data.userID;
                this.share.initializeUser(data);
                resolve();
            });
        });
    }

    showMenu(that) {
        return function (menu) {
            if (menu.componentsId === 'biznavi') {
                that.util.getSAMLart().then((samlart: string) => {
                    // sso for biznavi.
                    let baseURL = that.appConfig.get('BASE_URL');
                    let baseURLChina = that.appConfig.get('BASE_URL_CHINA');
                    let url = that.appConfig.get('BIZNAVI_URL_JAPAN');
                    let samlArtifactStorageName = that.appConfig.get('SAML_ARTIFACT_STORAGE_NAME_JAPAN');
                    if (baseURL === baseURLChina) {
                        url = that.appConfig.get('BIZNAVI_URL_CHINA');
                        samlArtifactStorageName = that.appConfig.get('SAML_ARTIFACT_STORAGE_NAME_CHINA');
                    }
                    if (that.platform.is('cordova')) {
                        let browser = that.iab.create(url, '_blank', 'location=no,closebuttoncaption=X');
                        browser.on('loadstop').subscribe(event => {
                            let scriptHack = `
                              document.cookie = "${samlArtifactStorageName} = ${samlart}";
                            `;
                            browser.executeScript({ code: scriptHack });
                        });
                        browser.on('loadstart').subscribe(event => {
                            let scriptHack = `
                              document.cookie = "${samlArtifactStorageName} = ${samlart}";
                            `;
                            browser.executeScript({ code: scriptHack });
                        });
                    } else {
                        window.open(url, '_blank');
                    }
                });
            } else {
                that.nav.setRoot(that.components[menu.componentsId]);
            }
        };
    }
}
