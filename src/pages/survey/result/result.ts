// Third party library.
import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
// import 'intl';
// import 'intl/locale-data/jsonp/ja';
// import 'intl/locale-data/jsonp/zh';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {SurveyService} from '../../../providers/survey-service';

// Pages.
import {SurveyDetailPage} from '../detail/detail';
import {OptionResultDetailPage} from '../option-result-detail/option-result-detail';

@Component({
    selector: 'page-survey-result',
    templateUrl: 'result.html',
    providers: [SurveyService, Util],
})
export class SurveyResultPage {
    public survey: any;
    public surveyID: string;
    public title: string;
    public status: string;
    public surveyOptionResults: any;
    public participantTotalCount: number;
    public isLoadCompleted: boolean = false;

    constructor(private nav: NavController, private params: NavParams, private util: Util, private surveyService: SurveyService) {
        let sendData = this.params.get('sendData');
        this.survey = sendData.survey;
        this.surveyID = this.survey.surveyID;
        this.title = this.survey.title;
        this.status = this.survey.status;
        this.getSurveyResultList();
    }

    getSurveyResultList() {
        this.surveyService.getSurveyResultList(this.surveyID).then((data: any) => {
            this.surveyOptionResults = data.surveyOptionResults;
            this.participantTotalCount = data.participantTotalCount;
            this.isLoadCompleted = true;
        });
    }

    showSurveyDetail() {
        this.nav.push(SurveyDetailPage, {
            'survey': this.survey
        });
    }

    showOptionResultDetailOfOption(surveyOptionResult) {
        if (surveyOptionResult.participantResults.length > 0) {
            this.nav.push(OptionResultDetailPage, {
                'surveyOptionResult': surveyOptionResult
            });
        }
    }
}
