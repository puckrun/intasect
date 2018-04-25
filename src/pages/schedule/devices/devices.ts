// Third party library.
import {Component, ViewChild, ElementRef} from '@angular/core';
import * as moment from 'moment';
import {Platform, Content} from 'ionic-angular';
import { Brightness } from '@ionic-native/brightness';

// Config.
import {AppConfig} from '../../../app/app.config';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {ShareService} from '../../../providers/share-service';
import {ScheduleService} from '../../../providers/schedule-service';
import {UserService} from '../../../providers/user-service';

@Component({
    selector: 'page-schedule-devices',
    templateUrl: 'devices.html',
    providers: [
        Util,
        ScheduleService,
        UserService
    ]
})
export class DevicesPage {

    @ViewChild('pageContent') pageContent: Content;
    @ViewChild('ganttview') ganttview: ElementRef;
    @ViewChild('deviceList') deviceList: ElementRef;
    @ViewChild('deviceListHeader') deviceListHeader: ElementRef;
    @ViewChild('ganttviewSlide') ganttviewSlide: ElementRef;
    @ViewChild('ganttviewDayTimeHeader') ganttviewDayTimeHeader: ElementRef;
    @ViewChild('ganttviewFixedDate') ganttviewFixedDate: ElementRef;
    @ViewChild('nowLine') nowLine: ElementRef;


    // if nobody make an action, refresh whole page every 5 minutes.
    public refreshWholePageInterval: number = 60 * 5;
    // the width of one hour
    public oneHourWidth: number = 120;
    public eventHeight: number = 70;
    public deviceHeight: number = 70;
    public displayDaysNumber: number = 2;
    public ganttviewWidth: number;
    public fixedDateWidth: number;
    // start work at 7:00.
    public workStartTime: number = 7;

    // 
    public lastActionTime: number = moment().unix();
    public now: number = moment().unix();
    public isAdmin: boolean = false;
    public isLoadCompleted: boolean;
    public specialDays: any = new Array();
    public devices: any = new Array();
    public timeZone: string = 'UTC' + moment().format('Z');

    public displayDates: any;
    public fromDate: any;
    public fromDateTime: number;
    public toDate: any;
    public toDateTime: number;
    public showFixedDate: boolean = false;
    public fixedDate: any;
    public headerFixed: boolean = false;
    public isNeedShowNowLine: boolean = false;
    public nowLineStyle: any;
    public dateTimes: any = new Array();
    public minDisplayDate: string = this.appConfig.get('DATETIME_YEAR_MONTH_DAY_MIN');
    public maxDisplayDate: string = this.appConfig.get('DATETIME_YEAR_MONTH_DAY_MAX');

    constructor(private platform: Platform,
        private brightness: Brightness,
        private util: Util,
        private share: ShareService,
        private scheduleService: ScheduleService,
        private userService: UserService,
        private appConfig: AppConfig
    ) {

        this.platform.ready().then(() => {
            if (typeof Brightness !== undefined) {
                this.brightness.setBrightness(1);
                this.brightness.setKeepScreenOn(true);
            }
        });

        // initialize data
        this.initVariable();
        this.loadRemoteData();
        this.startAutoRefresh();
    }

    initVariable(): void {
        this.ganttviewWidth = 24 * this.displayDaysNumber * this.oneHourWidth;
        this.fromDate = this.getToday();
        this.setDisplayDates();
        for (let j = 0; j < 24; j++) {
            this.dateTimes.push(j + ':00');
        }
        this.fixedDate = this.displayDates[0];
    }

    getToday(): string {
        return moment.unix(this.now).format('YYYY-MM-DD');
    }

    loadRemoteData(): void {
        this.isLoadCompleted = false;

        this.scheduleService.getIsAdmin().then((data: boolean) => {
            this.isAdmin = data;
        });

        // to get user's settings.
        // Regardless the size of words, just to get the settings about locale. 
        let userID = this.userService.getUserID();
        this.scheduleService.getUserLocaleSettings(userID).then((locale: string) => {
            this.getSpecialDays(locale);
        });

        this.scheduleService.getEventsForDevice(this.fromDateTime, this.toDateTime).then((data: any) => {
            let devicesAndevents = data;
            this.devices = devicesAndevents.devices;
            let viewStartTime = this.fromDateTime;

            for (let i = 0; i < this.devices.length; i++) {
                let lineEvents = this.devices[i].events;
                for (let j = 0; j < lineEvents.length; j++) {
                    viewStartTime = this.fromDateTime;
                    if (j !== 0) {
                        lineEvents[j].eventMarginTop = '-' + this.eventHeight + 'px';
                    }
                    if (parseInt(lineEvents[j].startTime) > viewStartTime) {
                        viewStartTime = parseInt(lineEvents[j].startTime);
                    }
                    lineEvents[j].eventMarginLeft = this.calculateTimeWidth(this.fromDateTime, viewStartTime);
                    lineEvents[j].timeLength = this.calculateTimeWidth(viewStartTime, lineEvents[j].endTime);
                }
                this.devices[i].events = lineEvents;
            }

            this.setGanttviewSlideScrollToNow();
        });
    }

    startAutoRefresh(): void {
        let refreshEvent = function (that: any) {
            return setInterval(function () {
                // if nobody make an action, refresh whole page every 5 minutes.
                that.now = moment().unix();
                let pastTime = that.now - that.lastActionTime;
                if (pastTime >= that.refreshWholePageInterval) {
                    // reset fromDate to today.
                    that.fromDate = that.getToday();
                    that.refresh();
                }
            }, that.refreshWholePageInterval);
        };

        let refreshNowLine = function (that: any) {
            return setInterval(function () {
                that.setNowLineStyles();
            }, 1000 * 1);
        };
        refreshEvent(this);
        refreshNowLine(this);
    }

    getSpecialDays(locale: string): void {
        this.scheduleService.getSpecialDays(locale, this.fromDateTime, this.toDateTime).then((data: any) => {
            for (let i = 0; i < this.displayDaysNumber; i++) {
                for (let k = 0; k < data.length; k++) {
                    let currentDay = moment.unix(data[k].startDay).format('YYYY-MM-DD');
                    if (currentDay === this.displayDates[i].date) {
                        this.displayDates[i].isSepcialDay = true;
                    }
                }
            }
        });
    }

    setNowLineStyles(): any {
        if (this.getToday() === this.fromDate) {
            this.nowLine.nativeElement.style.marginLeft = this.calculateTimeWidth(this.fromDateTime, this.now);
            this.nowLine.nativeElement.style.height = this.ganttviewSlide.nativeElement.clientHeight + 'px';
        }
    }

    refresh(): void {
        this.lastActionTime = moment().unix();
        this.setDisplayDates();
        this.loadRemoteData();
    }

    ionViewDidLoad(): void {
        this.isLoadCompleted = false;
    }

    ngAfterViewInit(): void {
        this.pageContent.ionScroll.subscribe(() => {
            this.displayFixedHeader();
        });
    }

    displayFixedHeader() {
        this.lastActionTime = moment().unix();
        if (this.pageContent.scrollTop > this.ganttview.nativeElement.offsetTop) {
            this.deviceListHeader.nativeElement.style.top = this.pageContent.getContentDimensions().contentTop + 'px';
            this.deviceListHeader.nativeElement.className = 'device-list-header fixed-header';
            this.deviceListHeader.nativeElement.style.width = this.deviceList.nativeElement.clientWidth + 'px';

            this.ganttviewDayTimeHeader.nativeElement.style.top = this.pageContent.getContentDimensions().contentTop + 'px';
            this.ganttviewDayTimeHeader.nativeElement.style.width = this.ganttviewSlide.nativeElement.clientWidth + 'px';
            this.ganttviewDayTimeHeader.nativeElement.className = 'ganttview-day-time-header fixed-header';

            this.ganttviewFixedDate.nativeElement.style.position = 'fixed';
            this.headerFixed = true;
        } else {
            this.deviceListHeader.nativeElement.className = 'device-list-header';
            this.ganttviewDayTimeHeader.nativeElement.className = 'ganttview-day-time-header';
            this.ganttviewFixedDate.nativeElement.style.position = 'absolute';
            this.headerFixed = false;
        }

        this.onGanttviewSlideScrollLeft();
    }

    setGanttviewSlideScrollToNow() {
        if (this.getToday() === this.fromDate) {
            let minScrollLeft = (this.workStartTime - 2) * this.oneHourWidth;
            let transFromNow = this.calculateTimeWidth(this.fromDateTime, this.now);
            transFromNow = parseInt(transFromNow) - this.oneHourWidth * 2;
            if (transFromNow > minScrollLeft) {
                this.ganttviewSlide.nativeElement.scrollLeft = (transFromNow);
            } else {
                this.ganttviewSlide.nativeElement.scrollLeft = (minScrollLeft);
            }
        }
        this.isLoadCompleted = true;
    }

    resetGanttviewSlideScroll() {
        this.ganttviewSlide.nativeElement.scrollLeft = 0;
    }

    resetToToday() {
        this.fromDate = moment().format('YYYY-MM-DD');
        this.refresh();
    }

    selectPerviousDay() {
        this.fromDate = moment.unix(this.fromDateTime).add(-1, 'd').format('YYYY-MM-DD');
        this.refresh();
    }

    selectNextDay() {
        this.fromDate = moment.unix(this.fromDateTime).add(1, 'd').format('YYYY-MM-DD');
        this.refresh();
    }

    setDisplayDates() {
        this.isNeedShowNowLine = false;
        this.fromDateTime = moment(this.fromDate).hour(0).minute(0).second(0).unix();
        this.toDateTime = moment.unix(this.fromDateTime).add(this.displayDaysNumber - 1, 'd').unix();

        this.displayDates = new Array();
        for (let i = 0; i < this.displayDaysNumber; i++) {
            let date = moment.unix(this.fromDateTime).add(i, 'd');
            let displayDate = {
                date: date.format('YYYY-MM-DD'),  // ion-datetime cannot recognize '/', so should use '-' here.
                displayDate: moment(date).format('YYYY/MM/DD') + '(' + moment(date).format('ddd') + ')',
                isSepcialDay: false,
                isSaturday: moment(date).day() === 6,
                isSunday: moment(date).day() === 0
            };
            this.displayDates.push(displayDate);
        }

        this.toDate = this.displayDates[this.displayDaysNumber - 1].date;

        // if not display today, then reset scroll to 0. 
        if (this.fromDate !== this.getToday()) {
            this.resetGanttviewSlideScroll();
        }
    }

    onGanttviewSlideScrollLeft() {
        this.lastActionTime = moment().unix();
        this.syncGanttviewGridAndHeaderScrollLeft();
        this.displayFixedDate();
    }

    syncGanttviewGridAndHeaderScrollLeft() {
        if (this.headerFixed) {
            this.ganttviewDayTimeHeader.nativeElement.scrollLeft = this.ganttviewSlide.nativeElement.scrollLeft;
        }
    }

    displayFixedDate() {
        let scrollLeft = this.ganttviewSlide.nativeElement.scrollLeft;
        let oneDayWidth = this.oneHourWidth * 24;
        if (scrollLeft > 0) {
            let i = Math.floor(scrollLeft / oneDayWidth);
            // when scroll to the end of the day, if the left width is smaller than fixedDateWidth, then hide fix date.
            // If do not do that, the fix date will cover the next day text.
            if (((i + 1) * oneDayWidth - scrollLeft) < this.fixedDateWidth) {
                this.showFixedDate = false;
            } else {
                this.showFixedDate = true;
                this.fixedDate = this.displayDates[i];
                this.fixedDateWidth = this.ganttviewFixedDate.nativeElement.clientWidth;
            }
        } else {
            this.showFixedDate = false;
        }
    }

    calculateTimeWidth(startTimestamp, endTimestamp) {
        let peroidWidth: any = 0;
        if (startTimestamp < endTimestamp) {
            let secondsOfOneHour = 60 * 60;
            let spanMinutes = endTimestamp - startTimestamp;
            peroidWidth = spanMinutes / secondsOfOneHour * this.oneHourWidth;
            if (peroidWidth > this.ganttviewWidth) {
                peroidWidth = this.ganttviewWidth;
            }
        }
        peroidWidth = peroidWidth + 'px';
        return peroidWidth;
    }

    showDetail(eventInfo) {
        // this.lastActionTime = moment().unix();
        // let alert = Alert.create({
        //     subTitle: eventInfo.title,
        //     message: '予定詳細画面の実装を待っています......',
        //     buttons: ['ok']
        // });
        // this.share.nav.present(alert);
    }
}
