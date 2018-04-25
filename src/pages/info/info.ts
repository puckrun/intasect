import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BlogIndexPage } from '../blog/index/index';
import { NotificationIndexPage } from '../notification/index/index';
import { SurveyIndexPage } from '../survey/index/index';

// Services.
import {ShareService} from '../../providers/share-service';

@Component({
  selector: 'page-info',
  templateUrl: 'info.html'
})
export class InfoPage {

  blogIndex = BlogIndexPage;
  notificationIndex = NotificationIndexPage;
  surveyIndex = SurveyIndexPage;

  constructor(private navCtrl: NavController, private share: ShareService) { }

  ionViewDidLoad() {

  }

}