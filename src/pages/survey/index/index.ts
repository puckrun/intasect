// Third party library.
import {Component, ViewChild} from '@angular/core';
import {NavController, Content} from 'ionic-angular';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {SurveyService} from '../../../providers/survey-service';
import {ShareService} from '../../../providers/share-service';

// Pages.
import {SurveyDetailPage} from '../detail/detail';
import {SurveyResultPage} from '../result/result';

@Component({
    selector: 'page-survey-index',
    templateUrl: 'index.html',
    providers: [
        SurveyService,
        Util
    ]
})
export class SurveyIndexPage {
    @ViewChild(Content) pageContent: Content;

    public sendData: any;
    public isLoadCompleted: boolean;
    public surveyListForTop: any[] = [];
    public keyWord: string;
    public isFirstTimeLoad: boolean;
    public isShowSearchBar: boolean;

    public isScrollToTopButtonVisible: boolean;

    constructor(private nav: NavController, private surveyService: SurveyService, private share: ShareService) {
        this.sendData = {
            'isRefreshFlag': false
        };
        this.keyWord = null;
        this.getSurveyListForTop();
        this.getSurveyNewInformationCount();
        this.isFirstTimeLoad = true;
        this.isShowSearchBar = false;
    }

    ionViewDidLoad(): void {
        this.isLoadCompleted = false;
    }

    ionViewWillEnter(): void {
        if (this.sendData.isRefreshFlag) {
            this.isLoadCompleted = false;
            this.keyWord = null;
            this.getSurveyListForTop();
            this.getSurveyNewInformationCount();
            this.isFirstTimeLoad = true;
            this.isShowSearchBar = false;
        }
        this.sendData.isRefreshFlag = false;
    }

    openDetail(survey): void {
        if (survey.status === 'COMPLETION') {
            let sendData = {
                'survey': survey
            };
            this.nav.push(SurveyResultPage, {
                'sendData': sendData
            });
        } else {
            this.nav.push(SurveyDetailPage, {
                'survey': survey
            });
        }
    }

    doRefresh(refresher): void {
        let isRefresh = true;
        this.keyWord = null;
        this.isFirstTimeLoad = true;
        this.isShowSearchBar = false;
        this.getSurveyListForTop(refresher, isRefresh);
        this.getSurveyNewInformationCount();
    }

    doInfinite(infiniteScroll): void {
        let position = this.surveyListForTop.length;
        this.surveyService.getSurveyListForTop(position, this.keyWord).then((data: any) => {
            if (data && data.length > 0) {
                this.surveyListForTop = this.surveyListForTop.concat(data);
            }
            infiniteScroll.complete();
        });
    }

    getSurveyListForTop(refresher?: any, isRefresh?: boolean): void {
        let position = 0;
        this.surveyService.getSurveyListForTop(position, this.keyWord).then((data: any) => {
            this.surveyListForTop = data;
            this.isLoadCompleted = true;
            this.isScrollToTopButtonVisible = false;
            if (isRefresh) {
                refresher.complete();
            }
            if (this.isFirstTimeLoad && data.length > 9) {
                this.pageContent.scrollTo(0, 46);
                this.isShowSearchBar = true;
                this.isFirstTimeLoad = false;
            }
        });
    }

    getSurveyNewInformationCount() {
        this.surveyService.getNotReadSurveyCountBySelf().then((data: string) => {
            if (data) {
                this.share.surveyNewInformationCount = Number(data);
            }
        });
    }

    ngAfterViewInit(): void {
        this.pageContent.ionScroll.subscribe(() =>{
            if (this.pageContent.scrollTop > 200) {
                this.isScrollToTopButtonVisible = true;
            } else {
                this.isScrollToTopButtonVisible = false;
            }
        });
    }

    scrollToIndexPageTop(): void {
        this.pageContent.scrollToTop();
    }

    serachSurveys(event: any): void {
        this.keyWord = event.target.value;
        this.getSurveyListForTop();
    }
}
