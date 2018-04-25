// Third party library.
import {Component} from '@angular/core';
import {NavController, AlertController, ModalController, NavParams} from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

// Config.
import {AppConfig} from '../../../app/app.config';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {ScheduleService} from '../../../providers/schedule-service';
import {UserService} from '../../../providers/user-service';
import {ShareService} from '../../../providers/share-service';

// Pages.
import {SelectUsersPage} from '../../../shared/components/select-users/select-users';
import {SelectDevicesPage} from '../select-devices/select-devices';

import * as moment from 'moment';

@Component({
    selector: 'page-schedule-edit-event',
    templateUrl: 'edit-event.html',
    providers: [ScheduleService,
        UserService,
        Util,
        SelectUsersPage,
        SelectDevicesPage]
})

export class EditEventPage {
    public visibilityPublic: string;
    public visibilityConfidential: string;
    public visibilityPrivate: string;
    public visibilities: any;
    public repeatEveryDay: string;
    public repeatEveryWeek: string;
    public repeatEveryMonth: string;
    public weeklySelections: any;
    public monthlySelections: any;
    public repeatRules: any;
    public categories: any;
    public selectedRepeatRules: any;
    public sendDataToEditEvent: any;
    public sendDataToAddEvent: any;
    public receivedData: any;
    public isNewEvent: boolean;
    public event: any;
    public initEvent: any;
    public participants: any;
    public startTime: any;
    public endTime: any;
    public repeatStartTime: any;
    public repeatEndTime: any;
    public devices: any;
    public minDisplayDate: string = this.appConfig.get('DATETIME_YEAR_MONTH_DAY_MIN');
    public maxDisplayDate: string = this.appConfig.get('DATETIME_YEAR_MONTH_DAY_MAX');
    public minuteValues: string = this.appConfig.get('DATETIME_MINUTE_VALUES');
    public isSavedOrChecked: boolean = false;
    public hadChangedEndTime: boolean = false;

    constructor(private nav: NavController,
        private params: NavParams,
        private alertCtrl: AlertController,
        private modalCtrl: ModalController,
        private translate: TranslateService,
        private scheduleService: ScheduleService,
        private util: Util,
        private appConfig: AppConfig,
        private userService: UserService,
        private share: ShareService) {
        this.initTranslation();
        this.initData();
    }

    initTranslation() {
        this.translate.get(['app.schedule.visibility.public',
            'app.schedule.visibility.confidential',
            'app.schedule.visibility.private']).subscribe(message => {
                this.visibilityPublic = message['app.schedule.visibility.public'];
                this.visibilityConfidential = message['app.schedule.visibility.confidential'];
                this.visibilityPrivate = message['app.schedule.visibility.private'];
            });
        this.visibilities = [
            {
                value: 'public',
                description: this.visibilityPublic
            },
            {
                value: 'confidential',
                description: this.visibilityConfidential
            },
            {
                value: 'private',
                description: this.visibilityPrivate
            }
        ];
        this.translate.get(['app.schedule.repeatRules.daily',
            'app.schedule.repeatRules.weekly',
            'app.schedule.repeatRules.monthly']).subscribe(message => {
                this.repeatEveryDay = message['app.schedule.repeatRules.daily'];
                this.repeatEveryWeek = message['app.schedule.repeatRules.weekly'];
                this.repeatEveryMonth = message['app.schedule.repeatRules.monthly'];
            });
        this.weeklySelections = [];
        this.monthlySelections = [];

        for (let i = 1; i <= 7; i++) {
            let weekdayObject = {
                'value': i,
                'description': moment.weekdays(i)
            };
            this.weeklySelections.push(weekdayObject);
        }

        this.translate.get(['app.date.day']).subscribe(message => {
            let dayDescription = message['app.date.day'];

            for (let i = 1; i <= 31; i++) {
                let dateDescription = i + dayDescription;
                let dateObject = {
                    'value': i,
                    'description': dateDescription
                };
                this.monthlySelections.push(dateObject);
            }
        });

        this.repeatRules = [
            {
                'value': 'DAILY',
                'description': this.repeatEveryDay
            },
            {
                'value': 'WEEKLY',
                'description': this.repeatEveryWeek
            },
            {
                'value': 'MONTHLY',
                'description': this.repeatEveryMonth
            }
        ];
    }

    // Initial display data.
    initData() {
        this.scheduleService.getCategoryList().then(data => {
            // The 'action-sheet' option will be invalid, when the count of option over 6.
            this.categories = data;
            this.categories.unshift({
                'categoryID': '',
                'categoryName': '未選択'  // Adding a japanese select-option for the other data is japanese.
            });
        });
        this.selectedRepeatRules = {
            'rule': 'DAILY',
            'index': 1
        };

        // Just to get event will get the 'event' action, not our schedule.
        this.sendDataToEditEvent = this.params.get('sendDataToEditEvent');
        this.sendDataToAddEvent = this.params.get('sendDataToAddEvent');

        if (this.sendDataToEditEvent) {
            this.receivedData = this.sendDataToEditEvent;
            this.event = {
                'eventID': this.receivedData.eventID
            };
            this.getEventByEventID(this.event.eventID);
        } else {
            this.setDefaultDataForNewEvent();
        }
    }

    getEventByEventID(eventID) {
        this.isNewEvent = false;
        this.scheduleService.getEventByEventID(eventID).then((event: any) => {
            this.event = event;
            this.participants = event.Participant;

            if (this.event.isAllDay === 'true') {
                this.event.isAllDay = true;
            } else {
                this.event.isAllDay = false;
            }
            if (this.event.isRepeat === 'true') {
                this.transRepeatRuleToPerformanceData(event.repeatRule);
            } else {
                this.event.isRepeat = false;
                this.startTime = moment.unix(event.startTime).format();
                this.endTime = moment.unix(event.endTime).format();
            }
            this.getDevicesByDeviceIDs(event.deviceID);
            // To set some default value for updating data.
            this.event.isDeviceRepeatWarned = false;
            this.event.isEventRepeatWarned = false;
            this.initEvent = Object.assign({}, this.event);
        });
    }

    transRepeatRuleToPerformanceData(repeatRule) {
        let repeatRuleArray = repeatRule.split(';');
        this.selectedRepeatRules = {
            'rule': repeatRuleArray[0],
            'index': parseInt(repeatRuleArray[1])
        };
        this.repeatStartTime = {
            hour: repeatRuleArray[2].substring(0, 2),
            minute: repeatRuleArray[2].substring(2, 4)
        };
        this.repeatEndTime = {
            'hour': repeatRuleArray[3].substring(0, 2),
            'minute': repeatRuleArray[3].substring(2, 4)
        };

        if (this.receivedData.isFromRepeatToSpecial === false) {
            this.event.isFromRepeatToSpecial = false;
            this.event.isRepeat = true;
            this.startTime = moment.unix(this.event.startTime);
            this.endTime = moment.unix(this.event.endTime);
            this.startTime = moment(this.startTime).hour(this.repeatStartTime.hour).minute(this.repeatStartTime.minute).format();
            this.endTime = moment(this.endTime).hour(this.repeatEndTime.hour).minute(this.repeatEndTime.minute).format();
        } else {
            this.event.isFromRepeatToSpecial = true;
            this.event.isRepeat = false;
            this.event.parentEventID = this.event.eventID;
            this.startTime = moment(this.receivedData.selectedDay).hour(this.repeatStartTime.hour).minute(this.repeatStartTime.minute).format();
            this.endTime = moment(this.receivedData.selectedDay).hour(this.repeatEndTime.hour).minute(this.repeatEndTime.minute).format();
            this.event.oldStartTime = moment(this.startTime).unix();
            this.event.oldEndTime = moment(this.endTime).unix();
        }

        // set rule-index to 1, when the repeat rule is everyday.
        if (this.selectedRepeatRules.index === 0) {
            this.selectedRepeatRules.index = 1;
        }
    }

    getDevicesByDeviceIDs(deviceIDs) {
        this.scheduleService.getDeviceListByDeviceIDs(deviceIDs).then((data: any) => {
            this.devices = data;
        });
    }

    setDefaultDataForNewEvent() {
        this.isNewEvent = true;
        // 全画面からの選択した日付、'YYYY/MM/D' 
        let selectedDay = this.sendDataToAddEvent.selectedDay;
        let sYear = parseInt(selectedDay.substring(0, 4));
        let sMonth = parseInt(selectedDay.substring(5, 7)) - 1;
        let sDay = parseInt(selectedDay.substring(8, 10));

        // 開始時間をただいまの時間に設定し、日付は選択した日付に設定します。
        let now = moment().year(sYear).month(sMonth).date(sDay).format();
        this.setEndTimeAnHourLater(now);
        // Set the logined user as default participant.
        this.participants = [
            {
                'userID': this.share.user.userID,
                'userName': this.share.user.userName
            }];

        // Just used to page performance.
        this.devices = [];
        // The data object of update, but be used when add new event.
        this.event = {
            'eventID': '',
            'categoryID': '',
            'isAllDay': false,
            'isRepeat': false,
            'repeatRule': '',
            'startTime': '',
            'endTime': '',
            'deviceID': '',
            'visibility': 'public',
            'isReminder': '',
            'reminderRule': '',
            'title': '',
            'summary': '',
            'location': '',
            'status': '',
            'isDeviceRepeatWarned': false,
            'isEventRepeatWarned': false,
            'isFromRepeatToSpecial': false
        };
        this.initEvent = Object.assign({}, this.event);
    }

    setEndTimeAnHourLater(time) {
        let currentMinutes = time.substring(14, 16);
        let startMinutes = currentMinutes;
        if (currentMinutes < 10) {
            startMinutes = 0;
        } else if (currentMinutes < 20) {
            startMinutes = 15;
        } else if (currentMinutes < 40) {
            startMinutes = 30;
        } else if (currentMinutes < 50) {
            startMinutes = 45;
        } else {
            startMinutes = 0;
        }

        if (currentMinutes >= 50) {
            this.startTime = moment(time).minute(startMinutes).add(1, 'hours').format();
            startMinutes = 60;
        } else {
            this.startTime = moment(time).minute(startMinutes).format();
        }

        let endMinutes = startMinutes + 60;
        if (endMinutes < 60) {
            this.endTime = moment(time).minute(endMinutes).format();
        } else {
            endMinutes = endMinutes - 60;
            this.endTime = moment(time).minute(endMinutes).add(1, 'hours').format();
        }
    }
    changeStartDate() {
        if (!this.hadChangedEndTime) {
            this.setEndTimeAnHourLater(this.startTime);
        }
    }

    changeStartTime() {
        if (!this.hadChangedEndTime) {
            this.setEndTimeAnHourLater(this.startTime);
        }
    }

    changeRepeatStartTime() {
        if (!this.hadChangedEndTime) {
            this.setEndTimeAnHourLater(this.startTime);
        }
    }

    changeEndDate() {
        this.hadChangedEndTime = true;
    }

    changeEndTime() {
        this.hadChangedEndTime = true;
    }

    changeRepeatEndTime() {
        this.hadChangedEndTime = true;
    }

    changeIsAllDay(isAllDay) {
        if (isAllDay && this.event.isRepeat) {
            this.event.isRepeat = false;
        }
    }

    changeIsRepeat(isRepeat) {
        if (isRepeat && this.event.isAllDay) {
            this.event.isAllDay = false;
        }
    }

    // Calling the sub-page to select the paticipants.
    chooseParticipants() {
        this.translate.get('app.schedule.selectParticipants').subscribe(message => {
            let sendDataToSelectUsers = {
                'title': message,
                'selectedUsers': this.participants,
                'systemName': 'schedule'
            };
            let participantsModal = this.modalCtrl.create(SelectUsersPage, { 'sendDataToSelectUsers': sendDataToSelectUsers });
            participantsModal.onDidDismiss(data => {
                this.participants = data;
            });
            participantsModal.present();
        });
    }

    // Calling the sub-page to select the devices.
    chooseDevices() {
        let devicesModal = this.modalCtrl.create(SelectDevicesPage, { 'devices': this.devices });
        devicesModal.onDidDismiss(data => {
            this.devices = data;
            this.event.deviceID = '';
            for (let i = 0; i < data.length; i++) {
                this.event.deviceID += data[i].deviceID;
                if (i !== (data.length - 1)) {
                    this.event.deviceID += ',';
                }
            }
        });
        devicesModal.present();
    }

    // Remove the source temporarily because the bug of ionic2 beta.11.  Will add on beta.12.
    // ionViewWillLeave() {
    //     let isAnyChange = false;
    //     for (let key in this.initEvent) {
    //         if (this.initEvent[key] !== this.event[key]) {
    //             isAnyChange = true;
    //             break;
    //         }
    //     }
    //     if (!this.isSavedOrChecked && isAnyChange) {
    //         this.confirmSaveWarn();
    //     }
    // }

    // confirmSaveWarn() {
    //     this.translate.get('app.schedule.editEvent.message.undoChanged').subscribe(message => {
    //         let content = message;
    //         let that = this;
    //         let okHandler = function () {
    //             setTimeout(() => {
    //                 that.isSavedOrChecked = true;
    //                 that.nav.pop();
    //             }, 500);
    //         };
    //         this.util.presentConfirmModal(content, 'warning', okHandler);
    //     });
    // }

    saveEvent() {
        this.createSaveData().then(completed => {
            if (completed) {
                let isOk = this.checkBeforeSave();
                if (isOk) {
                    if (this.event.eventID === '') {
                        this.addEvent();
                    } else {
                        this.updateEvent();
                    }
                }
            }
        });
    }

    createSaveData() {
        return new Promise(resolve => {
            let saveStartTime: number;
            let saveEndTime: number;
            this.event.repeatRule = '';
            if (this.event.isRepeat) {
                saveStartTime = moment(this.startTime).hour(0).minute(0).second(0).unix();
                saveEndTime = moment(this.endTime).hour(0).minute(0).second(0).add(1, 'd').add(-1, 's').unix();

                this.event.repeatRule += this.selectedRepeatRules.rule;
                this.event.repeatRule += ';';
                if (this.selectedRepeatRules.rule === 'DAILY') {
                    this.event.repeatRule += '0;';
                } else {
                    this.event.repeatRule += this.selectedRepeatRules.index;
                    this.event.repeatRule += ';';
                }
                let repeatStartTime = moment(this.startTime).format('HHmm');
                let repeatEndTime = moment(this.endTime).format('HHmm');
                this.event.repeatRule += repeatStartTime;
                this.event.repeatRule += ';';
                this.event.repeatRule += repeatEndTime;
            } else if (this.event.isAllDay) {
                saveStartTime = moment(this.startTime).hour(0).minute(0).second(0).unix();
                saveEndTime = moment(this.endTime).hour(0).minute(0).second(0).add(1, 'd').add(-1, 's').unix();
            } else {
                saveStartTime = moment(this.startTime).second(0).unix();
                saveEndTime = moment(this.endTime).second(0).unix();
            }
            this.event.startTime = saveStartTime;
            this.event.endTime = saveEndTime;
            resolve(true);
        });
    }

    checkBeforeSave() {
        if (!this.checkTitle()) {
            return false;
        }
        if (!this.checkTime()) {
            return false;
        }
        if (!this.checkParticipants()) {
            return false;
        }
        return true;
    }

    checkTitle() {
        if (!this.event.title && this.util.deleteEmSpaceEnSpaceNewLineInCharacter(this.event.title) === '') {
            this.translate.get('app.schedule.editEvent.message.eventTitleNecessary').subscribe(message => {
                let errMsg = message;
                this.showError(errMsg);
            });
            return false;
        }
        return true;
    }

    checkTime() {
        if (this.event.isRepeat) {
            let repeatStartTime = moment(this.startTime).format('HHmm');
            let repeatEndTime = moment(this.endTime).format('HHmm');
            if (repeatStartTime >= repeatEndTime) {
                this.translate.get('app.schedule.editEvent.message.repeatEndTimeShouldBeLater').subscribe(message => {
                    let errMsg = message;

                    this.showError(errMsg);
                });
                return false;
            }
        }
        if (this.event.startTime >= this.event.endTime) {
            this.translate.get('app.schedule.editEvent.message.endTimeShouldBeLater').subscribe(message => {
                let errMsg = message;

                this.showError(errMsg);
            });
            return false;
        }
        return true;
    }

    checkParticipants() {
        if (this.participants && this.participants.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    addEvent() {
        this.scheduleService.addEvent(this.event, this.participants).then(data => {
            if (data === 'true') {
                this.isSavedOrChecked = true;
                this.sendDataToAddEvent.isRefreshFlag = true;
                this.nav.pop();
                this.util.googleAnalyticsTrackEvent('Schedule', 'add', 'event');
            } else {
                this.showError(data);
            }
        }, err => {
            let errMsg = err.faultstring;
            let faultCode = err.faultcode;
            if ((faultCode.indexOf('WARN002') > -1) || (faultCode.indexOf('WARN001') > -1)) {
                errMsg = this.convertWarningMessage(errMsg);
                this.confirmRepeatWarn(errMsg, faultCode, 'addEvent');
            } else {
                this.showError(errMsg);
            }
        });
    }

    updateEvent() {
        this.scheduleService.updateEvent(this.event, this.participants).then(data => {
            if (data === 'true') {
                this.isSavedOrChecked = true;
                this.sendDataToEditEvent.isRefreshFlag = true;
                this.nav.pop();
                this.util.googleAnalyticsTrackEvent('Schedule', 'update', 'event');
            } else {
                this.showError(data);
            }
        }, err => {
            let errMsg = err.faultstring;
            let faultCode = err.faultcode;
            if ((faultCode.indexOf('WARN002') > -1) || (faultCode.indexOf('WARN001') > -1)) {
                errMsg = this.convertWarningMessage(errMsg);
                this.confirmRepeatWarn(errMsg, faultCode, 'updateEvent');
            } else {
                this.showError(errMsg);
            }
        });
    }

    convertWarningMessage(oldMessage) {
        // oldMessage:
        // '下記の参加者は既に同じ時間帯の予定が入っています。\n王　茜: 1469412000~1469416500;スケジュールを登録しますか？'
        oldMessage = oldMessage.replace(/\n/g, '<br/>');
        let aMessages = oldMessage.split(';');
        let newMessage = '';
        for (let i = 0; i < aMessages.length - 1; i++) {
            let sWarningName = aMessages[i].split(': ')[0];
            let sStartEnd = aMessages[i].split(': ')[1];
            let sStart = sStartEnd.split('~')[0];
            let sEnd = sStartEnd.split('~')[1];
            newMessage += sWarningName + ': ' + moment.unix(sStart).format('YYYY/MM/DD HH:mm')
                + ' ~ ' + moment.unix(sEnd).format('YYYY/MM/DD HH:mm') + '<br/>';
        }
        newMessage += aMessages[aMessages.length - 1];
        // newMessage: 
        // 下記の参加者は既に同じ時間帯の予定が入っています。<br/>王　茜: 2016/07/14 08:45 ~ 2016/07/14 09:15<br/>スケジュールを登録しますか？'
        return newMessage;
    }

    confirmRepeatWarn(content, faultCode, type) {
        let that = this;
        let okHandler = function () {
            if (faultCode.indexOf('WARN002') > -1) {
                // The same people had have scheduling at selected peroid.
                that.event.isDeviceRepeatWarned = false;
                that.event.isEventRepeatWarned = true;
            } else if (faultCode.indexOf('WARN001') > -1) {
                // The same device had been used at selected peroid.
                that.event.isDeviceRepeatWarned = true;
                that.event.isEventRepeatWarned = true;
            }
            if (type === 'addEvent') {
                setTimeout(() => {
                    that.addEvent();
                }, 500);
            } else {
                setTimeout(() => {
                    that.updateEvent();
                }, 500);
            }
        };
        this.util.presentConfirmModal(content, 'warning', okHandler);
    }

    showError(errorMessage) {
        this.util.presentModal(errorMessage);
    }
}