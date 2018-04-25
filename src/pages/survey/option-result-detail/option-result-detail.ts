import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';

@Component({
  selector: 'page-survey-option-result-detail',
  templateUrl: 'option-result-detail.html',
})
export class OptionResultDetailPage {
  public surveyOptionResult: any;

  constructor(private navCtrl: NavController, private params: NavParams) {
    this.surveyOptionResult = this.params.get('surveyOptionResult');
  }
}
