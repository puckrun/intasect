// Third party library.
import {Injectable} from '@angular/core';
import {NavController} from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import {DomSanitizer} from '@angular/platform-browser';
import * as moment from 'moment';

// Config.
import {AppConfig} from '../app/app.config';

// Utils.
import {Util} from '../utils/util';

@Injectable()
export class SurveyService {
    private userDefaultAvatarImageUrl = this.appConfig.get('USER_DEFAULT_AVATAR_IMAGE_URL');

    constructor(private translate: TranslateService,
        private domSanitizationService: DomSanitizer,
        private nav: NavController,
        private util: Util,
        private appConfig: AppConfig) {
    }

    getSurveyListForTop(position: number, keyWord?: string): any {
        let rowsPerpage = 10;
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/survey/get_survey_list_for_top.xml').then((req: string) => {

                let objRequest = this.util.parseXml(req);

                let cursorNode = this.util.selectXMLNode(objRequest, './/*[local-name()=\'cursor\']');
                this.util.setXMLAttribute(cursorNode, '', 'position', position);
                this.util.setXMLAttribute(cursorNode, '', 'numRows', rowsPerpage);

                if (keyWord) {
                    this.util.setNodeText(objRequest, './/*[local-name()=\'keyWord\']', keyWord);
                }

                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let surveyOutputs = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'SurveyOutput\']');
                    let surveys = new Array();
                    for (let i = 0; i < surveyOutputs.length; i++) {
                        let survey = this.util.xml2json(surveyOutputs[i]).SurveyOutput;
                        if (!survey.createUserAvatar || survey.createUserAvatar.toString().indexOf('data:image') !== 0) {
                            survey.createUserAvatar = this.userDefaultAvatarImageUrl;
                        }
                        this.util.getDateWithYMDOrMDType(survey.startDate).then(data => {
                            survey.startDay = data;
                        });
                        let date = moment(survey.endDate, 'YYYY/MM/DDTHH:mm:ss.SSS');
                        if (survey.endDate.indexOf('T') < 0) {
                            date = moment(survey.endDate, 'YYYY/MM/DD HH:mm:ss');
                        }
                        // is in this day
                        if (moment(date).startOf('day').isSame(moment().startOf('day'))) {
                            this.translate.get('app.survey.untilToday').subscribe(message => {
                                survey.collectionStatus = message;
                                survey.isTodayCompleted = true;
                            });
                        } else {
                            let parameter = {
                                'days': date.diff(moment(), 'days'),
                            };
                            this.translate.get('app.survey.lastDays', parameter).subscribe(message => {
                                survey.collectionStatus = message;
                                survey.isTodayCompleted = false;
                            });
                        }
                        this.util.getDateWithYMDOrMDType(survey.endDate).then(data => {
                            survey.endDay = data;
                        });
                        surveys.push(survey);
                    }

                    // if (surveyOutputs.length < 10) {
                    //     let surveyNull: any;
                    //     for (let i = 0; i < 10 - surveyOutputs.length; i++) {
                    //         surveys.push(surveyNull);
                    //     }
                    // }
                    resolve(surveys);
                });
            });
        });
    }

    // Getting the counting of not read surveys. 
    getNotReadSurveyCountBySelf(): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/survey/get_not_read_survey_count_by_self.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let returnOutPut = this.util.selectXMLNode(objResponse, './/*[local-name()=\'return\']');
                    let returnData = this.util.xml2json(returnOutPut).return;
                    resolve(returnData);
                });
            });
        });
    }

    getSurveyDetailBySurveyID(surveyID: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/survey/get_survey_detail_by_survey_id_request.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'surveyID\']', surveyID);
                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);

                    let surveyOutput = this.util.selectXMLNode(objResponse, './/*[local-name()=\'SurveyOutput\']');
                    let survey = this.util.xml2json(surveyOutput).SurveyOutput;
                    if (!survey.createUserAvatar || survey.createUserAvatar.toString().indexOf('data:image') !== 0) {
                        survey.createUserAvatar = this.userDefaultAvatarImageUrl;
                    }
                    this.util.fromNow(survey.createDate).then(data => {
                        survey.createDate = data;
                    });
                    this.util.getDateWithYMDOrMDType(survey.startDate).then(data => {
                        survey.startDay = data;
                    });

                    let date = moment(survey.endDate, 'YYYY/MM/DDTHH:mm:ss.SSS');
                    if (survey.endDate.indexOf('T') < 0) {
                        date = moment(survey.endDate, 'YYYY/MM/DD HH:mm:ss');
                    }
                    // is in this day
                    if (moment(date).startOf('day').isSame(moment().startOf('day'))) {
                        this.translate.get('app.survey.untilToday').subscribe(message => {
                            survey.collectionStatus = message;
                            survey.isTodayCompleted = true;
                        });
                    } else {
                        let parameter = {
                            'days': date.diff(moment(), 'days'),
                        };
                        this.translate.get('app.survey.lastDays', parameter).subscribe(message => {
                            survey.collectionStatus = message;
                            survey.isTodayCompleted = false;
                        });
                    }

                    this.util.getDateWithYMDOrMDType(survey.endDate).then(data => {
                        survey.endDay = data;
                    });
                    let optionsNodes = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'options\']');
                    let options = new Array();
                    let selectedOption = '';
                    for (let i = 0; i < optionsNodes.length; i++) {
                        let option = this.util.xml2json(optionsNodes[i]).options;
                        if (option.checkedFlag === 'TRUE') {
                            option.isSelected = true;
                            selectedOption = option;
                        } else {
                            option.isSelected = false;
                            option.optionContent = '';
                        }
                        options.push(option);
                    }
                    survey.options = options;
                    survey.selectedOption = selectedOption;
                    resolve(survey);
                });
            });
        });
    }

    saveSurveyParticipantResult(surveyID, optionID, optionContent): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/survey/save_survey_participant_result.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                this.util.setNodeText(objRequest, './/*[local-name()=\'surveyID\']', surveyID);
                this.util.setNodeText(objRequest, './/*[local-name()=\'optionID\']', optionID);
                this.util.setNodeText(objRequest, './/*[local-name()=\'optionContent\']', optionContent);
                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then(data => {
                    resolve('true');
                });
            });
        });
    }

    getSurveyResultList(surveyID) {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/survey/get_survey_participant_result_list.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                this.util.setNodeText(objRequest, './/*[local-name()=\'surveyID\']', surveyID);
                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);

                    let surveyOptionOutputs = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'SurveyOptionOutput\']');
                    let returnData;
                    let surveyOptionResults = new Array();
                    let participantTotalCount = 0;
                    for (let i = 0; i < surveyOptionOutputs.length; i++) {
                        let participantResultNodes = this.util.selectXMLNodes(surveyOptionOutputs[i], './/*[local-name()=\'participantResults\']');
                        let participantResults = new Array();
                        for (let j = 0; j < participantResultNodes.length; j++) {
                            participantResults.push(this.util.xml2json(participantResultNodes[j]).participantResults);
                        }
                        participantTotalCount = participantTotalCount + participantResults.length;

                        let surveyOption = this.util.xml2json(surveyOptionOutputs[i]).SurveyOptionOutput;
                        surveyOption.participantResults = participantResults;

                        surveyOptionResults.push(surveyOption);
                    }
                    returnData = {
                        'surveyOptionResults': surveyOptionResults,
                        'participantTotalCount': participantTotalCount
                    };
                    resolve(returnData);
                });
            });
        });
    }

    updateParticipantStatus(surveyID: string, participantStaus: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/survey/update_uarticipant_status.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'surveyID\']', surveyID);
                this.util.setNodeText(objRequest, './/*[local-name()=\'participantStaus\']', participantStaus);
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then(data => {
                    resolve('true');
                });
            });
        });
    }
}