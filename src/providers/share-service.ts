import { Badge } from '@ionic-native/badge';
import {Platform} from 'ionic-angular';
// Utils.
import {Util} from '../utils/util';

export class ShareService {

    public platform: Platform;
    public util : Util;
    private _notificationNewInformationCount: number = 0;
    private _blogNewInformationCount: number = 0;
    private _surveyNewInformationCount: number = 0;

    public initializeMenu: any;
    public initializeUser: any;
    public redirectLoginPage: any;
    public showMenu: any;
    public alertForSystemError: any;
    public nav: any;
    public user: any;

    constructor(private badge: Badge) {

    }

    set notificationNewInformationCount(count: number) {
        this._notificationNewInformationCount = count;
        if (this.platform.is('cordova')) {
            this.badge.clear();
            this.badge.set(this._notificationNewInformationCount + this._blogNewInformationCount + this._surveyNewInformationCount);
            this.util.setJPushBadge(this._notificationNewInformationCount + this._blogNewInformationCount + this._surveyNewInformationCount);
        }
    }

    get notificationNewInformationCount(): number {
        return this._notificationNewInformationCount;
    }

    set blogNewInformationCount(count: number) {
        this._blogNewInformationCount = count;
        if (this.platform.is('cordova')) {
            this.badge.clear();
            this.badge.set(this._notificationNewInformationCount + this._blogNewInformationCount + this._surveyNewInformationCount);
            this.util.setJPushBadge(this._notificationNewInformationCount + this._blogNewInformationCount + this._surveyNewInformationCount);
        }
    }

    get blogNewInformationCount(): number {
        return this._blogNewInformationCount;
    }

    set surveyNewInformationCount(count: number) {
        this._surveyNewInformationCount = count;
        if (this.platform.is('cordova')) {
            this.badge.clear();
            this.badge.set(this._notificationNewInformationCount + this._blogNewInformationCount + this._surveyNewInformationCount);
            this.util.setJPushBadge(this._notificationNewInformationCount + this._blogNewInformationCount + this._surveyNewInformationCount);
        }
    }

    get surveyNewInformationCount(): number {
        return this._surveyNewInformationCount;
    }
}