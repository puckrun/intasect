// Third party library.
import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Badge } from '@ionic-native/badge';
import {Platform} from 'ionic-angular';

// Services.
import {ShareService} from './share-service';
import {BlogService} from './blog-service';
import {NotificationService} from './notification-service';
import {SurveyService} from './survey-service';

// Utils.
import {Util} from '../utils/util';

@Injectable()
export class AppsService {

    constructor(private http: HttpClient,
        private badge: Badge,
        private platform: Platform,
        private share: ShareService,
        private blogService: BlogService,
        private notificationService: NotificationService,
        private surveyService: SurveyService,
        private util: Util) {

    }

    load() {
        // don't have the data yet
        return new Promise(resolve => {
            if (this.platform.is('cordova')) {
                // Clear badge.
                this.badge.clear();
                this.util.setJPushBadge(0);
            }

            // We're using Angular Http provider to request the data,
            // then on the response it'll map the JSON data to a parsed JS object.
            // Next we process the data and resolve the promise with the new data.
            this.http.get('./assets/mocks/appsservice/load.json')
                .subscribe(data => {
                    // we've got back the raw data, now generate the core schedule data
                    // and save the data for later reference
                    // let items = Array.from(data);
                    this.getNewInformationCount();
                    resolve(data);
                });
        });
    }

    getNewInformationCount() {
        this.blogService.getNotReadCommunityCountBySelf().then((data: string) => {
            if (data) {
                this.share.blogNewInformationCount = Number(data);
            }
        });
        this.notificationService.getNotReadNotificationCountBySelf().then((data: string) => {
            if (data) {
                this.share.notificationNewInformationCount = Number(data);
            }
        });
        this.surveyService.getNotReadSurveyCountBySelf().then((data: string) => {
            if (data) {
                this.share.surveyNewInformationCount = Number(data);
            }
        });
    }
}

