// Third party library.
import {Injectable} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import 'moment/locale/ja';
import 'moment/locale/zh-cn';

@Injectable()
export class DateUtil {

    constructor(private translate: TranslateService) {
    }

    transferCordysDateStringToUTC(v: string): any {
        let fields = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(v);
        fields[2] = String(Number(fields[2]) - 1); // month is zero based
        return new Date(Date.UTC(Number(fields[1]), Number(fields[2]), Number(fields[3]), Number(fields[4]), Number(fields[5]), Number(fields[6])));
    }

    getUTCDate(): string {
        let oDate = new Date();

        // handle date part
        let dateSep = '-';
        let day = oDate.getUTCDate();
        let month = oDate.getUTCMonth() + 1;
        let sDay = (day < 10) ? '0' + day : day;
        let sMonth = (month < 10) ? '0' + month : month;
        let sValue = oDate.getUTCFullYear() + dateSep + sMonth + dateSep + sDay + 'T';

        // handle time part
        let timeSep = ':';
        let hours = oDate.getUTCHours();
        let minutes = oDate.getUTCMinutes();
        let seconds = oDate.getUTCSeconds();
        let sHours = (hours < 10) ? '0' + hours : hours;
        let sMinutes = (minutes < 10) ? '0' + minutes : minutes;
        let sSeconds = (seconds < 10) ? '0' + seconds : seconds;
        sValue += sHours + timeSep + sMinutes + timeSep + sSeconds + 'Z';

        return sValue;
    }

    fromNow(cordysDate: string): Promise<string> {
        return this.fromNowCoreLogic(cordysDate);
    }

    fromNowForNotification(cordysDate: string): Promise<string> {
        return this.fromNowCoreLogic(cordysDate, true);
    }

    fromNowCoreLogic(cordysDate: string, hideTime = false): Promise<string> {
        return new Promise(resolve => {
            let date = moment(cordysDate, 'YYYY/MM/DDTHH:mm:ss.SSS');
            if (cordysDate.indexOf('T') < 0) {
                date = moment(cordysDate, 'YYYY/MM/DD HH:mm:ss');
            }

            // clone date and set 12:00 am
            let dateWithoutTime = moment(date).startOf('day');
            // today 12:00 am
            let nowWithoutTime = moment().startOf('day');

            // after today 12:00 am
            if (nowWithoutTime.isSame(dateWithoutTime)) {
                if (hideTime) {
                    this.translate.get('app.date.today').subscribe(message => {
                        resolve(message);
                    });
                } else {
                    resolve(date.fromNow());
                }
            }

            // after yesterday 12:00 am
            // 昨日 12:00 / 昨天 12:00 / Yesterday 12:00
            if (moment(nowWithoutTime).subtract(1, 'days').isSame(dateWithoutTime)) {
                this.translate.get('app.date.yesterday').subscribe(message => {
                    if (hideTime) {
                        resolve(message);
                    } else {
                        resolve(message + date.format('H:mm'));
                    }
                });
            }

            // yesterday 12:00am ~ last week 12:00 am
            // X曜日 / 星期X / Mon.
            if (moment(nowWithoutTime).subtract(1, 'days').isAfter(dateWithoutTime) &&
                (moment(nowWithoutTime).subtract(7, 'days').isSame(dateWithoutTime) ||
                    moment(nowWithoutTime).subtract(7, 'days').isBefore(dateWithoutTime))) {
                resolve(moment.weekdays(date.day()));
            }

            // 182days(half of a year) before 12:00am ~ last week 12:00 am
            // M月d日 / M月d日 / Mnd/d
            if (moment(nowWithoutTime).subtract(7, 'days').isAfter(dateWithoutTime) &&
                (moment(nowWithoutTime).subtract(182, 'days').isSame(dateWithoutTime) ||
                    moment(nowWithoutTime).subtract(182, 'days').isBefore(dateWithoutTime))) {
                let parameter = {
                    'MM': (date.month() + 1),
                    'DD': date.date()
                };
                this.translate.get('app.date.MMDD', parameter).subscribe(message => {
                    resolve(message);
                });
            }

            // 183days before 12:00am
            if (moment(nowWithoutTime).subtract(182, 'days').isAfter(dateWithoutTime)) {
                let parameter = {
                    'YYYY': date.year(),
                    'MM': (date.month() + 1)
                };
                this.translate.get('app.date.YYYYMM', parameter).subscribe(message => {
                    resolve(message);
                });
            }
        });
    }
    getDateWithYMDOrMDType(cordysDate: string) {
        return new Promise(resolve => {
            let date = moment(cordysDate, 'YYYY/MM/DDTHH:mm:ss.SSS');
            if (cordysDate.indexOf('T') < 0) {
                date = moment(cordysDate, 'YYYY/MM/DD HH:mm:ss');
            }

            // is in this year
            if (moment(date).startOf('year').isSame(moment().startOf('year'))) {
                let parameter = {
                    'MM': (date.month() + 1),
                    'DD': date.date()
                };
                this.translate.get('app.date.MMDD', parameter).subscribe(message => {
                    resolve(message);
                });
            } else {
                resolve(moment(date).format('LL'));
            }

        });
    }
}