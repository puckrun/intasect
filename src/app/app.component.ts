import { Component, ViewChild } from '@angular/core';
import { Platform, Config, MenuController, Nav, LoadingController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { StatusBar } from '@ionic-native/status-bar';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
// import { Deploy } from '@ionic/cloud-angular';

// Config.
import { AppConfig } from './app.config';

// Services.
import { ShareService } from '../providers/share-service';

import { Util } from '../utils/util';

// Pages.
import { LoginPage } from '../pages/login/login';
import { PortalPage } from '../pages/portal/portal';

@Component({
    selector: 'page-app',
    templateUrl: 'app.html',
})
export class MyApp {
    @ViewChild(Nav) nav: Nav;

    public userLang;
    public menus;
    // make HelloIonicPage the root (or first) page
    public rootPage: any;
    public user: any = {
        'userAvatar': null
    };

    constructor(private translate: TranslateService,
        private platform: Platform,
        private statusBar: StatusBar,
        private screenOrientation: ScreenOrientation,
        private config: Config,
        private menu: MenuController,
        private loadingCtrl: LoadingController,
        private appConfig: AppConfig,
        private util: Util,
        private share: ShareService) {
        this.platform.ready().then(() => {
            this.initializeTranslate();
            this.initializeApp();
        });
    }

    initializeApp() {
        // set default server.
        if (this.userLang.indexOf('zh') >= 0) {
           
            this.appConfig.set('BASE_URL', this.appConfig.get('BASE_URL_CHINA'));
            this.appConfig.set('GOOGLE_ANALYTICS_TRACK_ID', this.appConfig.get('GOOGLE_ANALYTICS_TRACK_ID_CHINA'));
        } else {
            this.appConfig.set('BASE_URL', this.appConfig.get('BASE_URL_JAPAN'));
            this.appConfig.set('GOOGLE_ANALYTICS_TRACK_ID', this.appConfig.get('GOOGLE_ANALYTICS_TRACK_ID_JAPAN'));
        }
        this.util.isAutoLogin().then((isAutoLogin: boolean) => {
            if (isAutoLogin) {
                this.util.getServer().then((server: string) => {
                    this.appConfig.set('BASE_URL', server);
                });
            }
        });

        this.share.nav = this.nav;
        if (this.platform.is('cordova')) {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            this.statusBar.backgroundColorByHexString('#7B1FA2');

            if (this.appConfig.get('IS_TABLET')) {
                this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE);
            }
        }

        this.user.userAvatar = this.appConfig.get('USER_DEFAULT_AVATAR_IMAGE_URL');
        this.getBackButtonText().then(message => {
            this.config.set('ios', 'backButtonText', message);
        });

        this.share.initializeMenu = this.initializeMenu(this);
        this.share.initializeUser = this.initializeUser(this);
        this.share.redirectLoginPage = this.redirectLoginPage(this, LoginPage);
        this.share.platform = this.platform;
        this.share.util = this.util;
        this.util.googleAnalyticsStartTrackerWithId();
        this.share.nav.viewDidEnter.subscribe((args) => {
            this.util.googleAnalyticsTrackView(args.component.name);
        });

        // auto login.
        this.util.loggedOn().then((isLoggedOn: boolean) => {
            if (isLoggedOn) {
                this.rootPage = PortalPage;
            } else {
                this.rootPage = LoginPage;
            }
        });
    }

    getBackButtonText() {
        return new Promise(resolve => {
            this.translate.get('app.action.back').subscribe(message => {
                resolve(message);
            });
        });
    }

    initializeTranslate() {
        // initialize translate library
        this.userLang = navigator.language.toLowerCase();
        this.appConfig.set('USER_LANG', this.userLang);
        this.translate.use(this.userLang);
    }

    initializeMenu(that) {
        return function (menus) {
            that.menus = menus;
        };
    }

    initializeUser(that) {
        return function (user) {
            that.user = user;
            that.share.user = user;
        };
    }

    redirectLoginPage(that, loginPage) {
        return function () {
            return that.share.nav.setRoot(loginPage);
        };
    }

    openPage(item) {
        // close the menu when clicking a link from the menu
        this.menu.close();
        // navigate to the new page if it is not the current page
        if (this.share.showMenu) {
            this.share.showMenu(item);
        }
    }

    logout() {
        this.menu.close();
        this.translate.get('app.message.warning.logout').subscribe(message => {
            let content = message;
            let okHandler = function (that) {
                return function () {
                    that.util.logout().then(() => {
                        that.share.nav.setRoot(LoginPage);
                    });
                };
            };
            this.util.presentConfirmModal(content, 'warning', okHandler(this));
        });
    }
}
