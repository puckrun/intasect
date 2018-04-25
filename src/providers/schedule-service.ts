// Third party library.
import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';

// Utils.
import {Util} from '../utils/util';

@Injectable()
export class ScheduleService {

    constructor(private http: HttpClient, private util: Util) {
    }

    getUserLocaleSettings(userID: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/schedule/get_user_settings.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                this.util.setNodeText(objRequest, './/*[local-name()=\'userID\']', userID);

                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let userSettings = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'UserSettingOutput\']');
                    let localeString = '';
                    if (userSettings.length > 0) {
                        let showJapanHoliday = this.util.getNodeText(userSettings[0], './/*[local-name()=\'isShowJapanHoiday\']');
                        let showChinaHoliday = this.util.getNodeText(userSettings[0], './/*[local-name()=\'isShowChinaHoliday\']');
                        let showAmericaHoliday = this.util.getNodeText(userSettings[0], './/*[local-name()=\'isShowAmericaHoliday\']');
                        // JP/CN/US
                        if (showJapanHoliday === 'true') {
                            localeString += 'JP;';
                        }
                        if (showChinaHoliday === 'true') {
                            localeString += 'CN;';
                        }
                        if (showAmericaHoliday === 'true') {
                            localeString += 'US;';
                        }
                    }
                    resolve(localeString);
                });
            });
        });
    }

    getIsAdmin(): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/schedule/get_user_details.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);

                    let oRoleNodes = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'Role\']');
                    let isAdmin = false;
                    if (oRoleNodes) {
                        for (let i = 0; i < oRoleNodes.length; i++) {
                            let role = this.util.getNodeText(oRoleNodes[i], '.');
                            if (role === 'MyCalAdmin') {
                                isAdmin = true;
                            }
                        }
                    }
                    resolve(isAdmin);
                });
            });
        });
    }

    getEventsForDevice(startTime: number, endTime: number): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/schedule/get_events_for_device_and_group.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                // startTime/endTime--
                // selType--value--device/group--'when set group, cannot get anything.
                this.util.setNodeText(objRequest, './/*[local-name()=\'startTime\']', startTime);
                this.util.setNodeText(objRequest, './/*[local-name()=\'endTime\']', endTime);
                this.util.setNodeText(objRequest, './/*[local-name()=\'selType\']', 'device');

                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let targetLists = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'TargetList\']');
                    let devicesAndEvents = {};
                    let deviceList = new Array();
                    let eventList = new Array();
                    let participantsOfEvent = new Array();

                    for (let i = 0; i < targetLists.length; i++) {
                        let targetIDString = this.util.getNodeText(targetLists[i], './/*[local-name()=\'targetID\']');
                        let targetNameString = this.util.getNodeText(targetLists[i], './/*[local-name()=\'targetName\']');

                        let eventLists = this.util.selectXMLNodes(targetLists[i], './/*[local-name()=\'eventList\']');
                        eventList = [];
                        for (let j = 0; j < eventLists.length; j++) {
                            participantsOfEvent = [];
                            let participantNodes = this.util.selectXMLNodes(eventLists[j], './/*[local-name()=\'Participant\']');
                            for (let k = 0; k < participantNodes.length; k++) {
                                let participant = this.util.xml2json(participantNodes[k]).Participant;
                                participantsOfEvent.push(participant.userName);
                            }
                            let eventObject = this.util.xml2json(eventLists[j]).eventList;
                            let showEventContent = {
                                'title': eventObject.title,
                                'participants': participantsOfEvent,
                                'deviceName': eventObject.deviceName,
                                'startTime': eventObject.startTime,
                                'endTime': eventObject.endTime,
                                'isSelf': eventObject.isSelf,
                                'visibility': eventObject.visibility
                            };
                            eventList.push(showEventContent);
                        }
                        let deviceObject = {
                            'targetID': targetIDString,
                            'targetName': targetNameString,
                            'events': eventList
                        };
                        deviceList.push(deviceObject);
                    }
                    devicesAndEvents = {
                        'devices': deviceList
                    };
                    resolve(devicesAndEvents);
                });
            });
        });
    }

    getSpecialDays(locale: string, fromDateTime: number, toDateTime: number): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/schedule/get_special_days.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                // locale--separator--';'. Avaliable value - JP/CN/US
                // start/end--type--timestamp 
                this.util.setNodeText(objRequest, './/*[local-name()=\'locale\']', locale);
                this.util.setNodeText(objRequest, './/*[local-name()=\'start\']', fromDateTime);
                this.util.setNodeText(objRequest, './/*[local-name()=\'end\']', toDateTime);

                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let holidayOutputs = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'HolidayOutput\']');
                    let holidays = new Array();
                    for (let i = 0; i < holidayOutputs.length; i++) {
                        holidays.push(this.util.xml2json(holidayOutputs[i]).HolidayOutput);
                    }
                    resolve(holidays);
                });
            });
        });
    }

    getSpecialDaysForMonthByStartTimeAndEndTimeAndLocal(locale: string, startTime: number, endTime: number) {
        return new Promise(resolve => {
            this.getSpecialDays(locale, startTime, endTime).then(holidays => {
                let holidaysByDays = new Map(Array<any>());
                holidays.forEach(function (holiday) {
                    let holidaysByDay: any = new Array();
                    let startDay = moment(holiday.startDay, 'X').format('YYYY/MM/D');
                    if (Number(holiday.startDay) >= startTime && Number(holiday.startDay) <= endTime) {
                        if (!holidaysByDays.has(startDay)) {
                            holidaysByDay.push(holiday);
                            holidaysByDays.set(startDay, holidaysByDay);
                        } else {
                            holidaysByDay = holidaysByDays.get(startDay);
                            holidaysByDay.push(holiday);
                        }
                    }
                });
                resolve(holidaysByDays);
            });
        });
    }

    // search events by seleted day.
    searchEventsBySelectedDay(startTime: number, endTime: number, userID: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/schedule/search_events.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'startTime\']', startTime);
                this.util.setNodeText(objRequest, './/*[local-name()=\'endTime\']', endTime);
                this.util.setNodeText(objRequest, './/*[local-name()=\'userID\']', userID);
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let eventOutputs = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'EventOutput\']');
                    let events = new Array();
                    for (let i = 0; i < eventOutputs.length; i++) {
                        let eventOutput = this.util.xml2json(eventOutputs[i]).EventOutput;
                        let startTime = moment(eventOutput.startTime, 'X').format('HH:mm');
                        let endTime = moment(eventOutput.endTime, 'X').format('HH:mm');
                        let isAllDay = eventOutput.isAllDay;
                        if (startTime >= eventOutput.startTime && endTime <= eventOutput.endTime) {
                            isAllDay = 'true';
                        } else if (startTime < eventOutput.startTime && endTime < eventOutput.endTime) {
                            endTime = '24:00';
                        } else if (endTime > eventOutput.endTime && startTime > eventOutput.startTime) {
                            startTime = '00:00';
                        }
                        let event = {
                            eventID: eventOutput.eventID,
                            startTime: startTime,
                            endTime: endTime,
                            title: eventOutput.title,
                            isAllDay: isAllDay
                        };
                        events.push(event);
                    }
                    resolve(events);
                });
            });
        });
    }

    // search events by month.
    searchEventsForMonthByStartTimeAndEndTimeAndUserID(startTime: number, endTime: number, userID: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/schedule/search_events.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'startTime\']', startTime);
                this.util.setNodeText(objRequest, './/*[local-name()=\'endTime\']', endTime);
                this.util.setNodeText(objRequest, './/*[local-name()=\'userID\']', userID);
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let eventOutputs = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'EventOutput\']');
                    let eventsByDays = new Map(Array<any>());
                    let startDate;
                    let endDate;
                    for (let i = 0; i < eventOutputs.length; i++) {
                        let eventOutput = this.util.xml2json(eventOutputs[i]).EventOutput;
                        let ouputStartTime = eventOutput.startTime;
                        let ouputEndTime = eventOutput.endTime;
                        // the start time is before the month
                        if (Number(ouputStartTime) < startTime) {
                            startDate = moment(moment(startTime.toString(), 'X').format('YYYY/MM/D'));
                        } else {
                            startDate = moment(moment(ouputStartTime, 'X').format('YYYY/MM/D'));
                        }
                        // the end time is after the month
                        if (Number(ouputEndTime) > endTime) {
                            endDate = moment(moment(endTime.toString(), 'X').format('YYYY/MM/D'));
                        } else {
                            endDate = moment(moment(ouputEndTime, 'X').format('YYYY/MM/D'));
                        }
                        let currentDate = startDate;
                        while (currentDate <= endDate) {
                            let startHourMinute = moment(ouputStartTime, 'X').format('HH:mm');
                            let endHourMinute = moment(ouputEndTime, 'X').format('HH:mm');
                            let isAllDay = eventOutput.isAllDay;
                            let currentDay = currentDate.format('YYYY/MM/D');
                            let currentDayStartTime = currentDate.unix();
                            let currentDayEndTime = (currentDate.add(1, 'days').subtract(1, 'seconds')).unix();

                            if (currentDayStartTime >= Number(ouputStartTime) && currentDayEndTime <= Number(ouputEndTime)) {
                                isAllDay = 'true';
                                startHourMinute = '00:00';
                                endHourMinute = '24:00';
                            } else if (currentDayStartTime < Number(ouputStartTime) && currentDayEndTime < Number(ouputEndTime)) {
                                endHourMinute = '24:00';
                            } else if (currentDayEndTime > Number(ouputEndTime) && currentDayStartTime > Number(ouputStartTime)) {
                                startHourMinute = '00:00';
                            }
                            // TODO: Dont use JSON.stringify and JSON.parse
                            let event: any = JSON.stringify(eventOutput);
                            event = JSON.parse(event);
                            event['ouputStartTime'] = ouputStartTime;
                            event['ouputEndTime'] = ouputEndTime;
                            event.startTime = startHourMinute;
                            event.endTime = endHourMinute;
                            event.isAllDay = isAllDay;
                            let eventsByDay: any = new Array();
                            if (!eventsByDays.has(currentDay)) {
                                eventsByDay.push(event);
                                eventsByDays.set(currentDay, eventsByDay);
                            } else {
                                eventsByDay = eventsByDays.get(currentDay);
                                eventsByDay.push(event);
                            }
                            currentDate.add(1, 'seconds');
                        }
                    }
                    resolve(eventsByDays);
                });
            });
        });
    }

    getEventByEventID(eventID: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/schedule/get_event_by_event_id.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'eventID\']', eventID);

                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let eventOutput = this.util.selectXMLNode(objResponse, './/*[local-name()=\'EventOutput\']');
                    let event = this.util.xml2json(eventOutput).EventOutput;
                    let participants = [];
                    let participantNodes = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'Participant\']');
                    for (let i = 0; i < participantNodes.length; i++) {
                        participants.push(this.util.xml2json(participantNodes[i]).Participant);
                    }
                    event.Participant = participants;
                    resolve(event);
                });
            });
        });

    }

    getCategoryList(): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/schedule/get_category_list.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let normalCategory = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'FixedCategory\']');
                    let otherCategories = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'OtherCategoryList\']');
                    let categories = new Array();
                    for (let i = 0; i < normalCategory.length; i++) {
                        categories.push(this.util.xml2json(normalCategory[i]).FixedCategory);
                    }
                    for (let i = 0; i < otherCategories.length; i++) {
                        categories.push(this.util.xml2json(otherCategories[i]).OtherCategoryList);
                    }
                    resolve(categories);
                });
            });
        });
    }

    getCategoryNameByCategoryID(categoryID: string): any {
        return new Promise(resolve => {
            this.getCategoryList().then((categories: any) => {
                let categoryName;
                categories.forEach(function (element) {
                    if (element.categoryID === categoryID) {
                        categoryName = element.categoryName;
                    }
                }, this);
                resolve(categoryName);
            });
        });
    }

    getDeviceListWithoutTranferToJson(): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/schedule/get_device_list.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let deviceOutputs = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'DeviceOutput\']');

                    resolve(deviceOutputs);
                });
            });
        });
    }

    getDeviceList(): any {
        return new Promise(resolve => {
            this.getDeviceListWithoutTranferToJson().then((deviceOutputs: string) => {
                let devices = [];
                for (let i = 0; i < deviceOutputs.length; i++) {
                    devices.push(this.util.xml2json(deviceOutputs[i]).DeviceOutput);
                }
                resolve(devices);
            });
        });
    }

    getDeviceListByDeviceIDs(deviceIDs: string): any {
        return new Promise(resolve => {
            let deviceIDArray: any;
            deviceIDArray = deviceIDs.split(',');
            this.getDeviceListWithoutTranferToJson().then((deviceOutputs: string) => {
                let deviceArray = [];
                for (let i = 0; i < deviceOutputs.length; i++) {
                    let device = this.util.xml2json(deviceOutputs[i]).DeviceOutput;
                    if (deviceIDArray.includes(device.deviceID)) {
                        deviceArray.push(device);
                    }
                }
                resolve(deviceArray);
            });
        });
    }

    getDevicesByDeviceIDs(deviceIDs: string): any {
        return new Promise(resolve => {
            let deviceIDsArray: any;
            deviceIDsArray = deviceIDs.split(',');

            this.getDeviceListWithoutTranferToJson().then((deviceOutputs: string) => {
                let deviceNames = new Array();
                for (let i = 0; i < deviceOutputs.length; i++) {
                    let device = this.util.xml2json(deviceOutputs[i]).DeviceOutput;
                    if (deviceIDsArray.includes(device.deviceID)) {
                        deviceNames.push(device.deviceName);
                    }
                }
                resolve(deviceNames);
            });
        });
    }

    addEvent(event: any, participants: any): any {
        return new Promise((resolve, reject) => {
            this.util.getRequestXml('./assets/requests/schedule/add_event.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                this.util.setNodeText(objRequest, './/*[local-name()=\'categoryID\']', event.categoryID);
                this.util.setNodeText(objRequest, './/*[local-name()=\'isAllDay\']', event.isAllDay);
                this.util.setNodeText(objRequest, './/*[local-name()=\'isRepeat\']', event.isRepeat);
                this.util.setNodeText(objRequest, './/*[local-name()=\'repeatRule\']', event.repeatRule);
                this.util.setNodeText(objRequest, './/*[local-name()=\'startTime\']', event.startTime);
                this.util.setNodeText(objRequest, './/*[local-name()=\'endTime\']', event.endTime);
                this.util.setNodeText(objRequest, './/*[local-name()=\'deviceID\']', event.deviceID);
                this.util.setNodeText(objRequest, './/*[local-name()=\'visibility\']', event.visibility);
                // this.util.setNodeText(objRequest, './/*[local-name()=\'isReminder\']', '');
                // this.util.setNodeText(objRequest, './/*[local-name()=\'reminderRule\']', '');
                this.util.setNodeText(objRequest, './/*[local-name()=\'title\']', event.title);
                this.util.setNodeText(objRequest, './/*[local-name()=\'summary\']', event.summary);
                this.util.setNodeText(objRequest, './/*[local-name()=\'location\']', event.location);
                this.util.setNodeText(objRequest, './/*[local-name()=\'status\']', event.status);
                this.util.setNodeText(objRequest, './/*[local-name()=\'isDeviceRepeatWarned\']', event.isDeviceRepeatWarned);
                this.util.setNodeText(objRequest, './/*[local-name()=\'isEventRepeatWarned\']', event.isEventRepeatWarned);
                // add paticipants to the request.
                let oEventOutput = this.util.selectXMLNode(objRequest, './/*[local-name()=\'EventOutput\']');
                let iLen = participants.length;

                // The namespace about schedule's participant
                let participantNamespace = 'http://schemas.intasect.co.jp/mycal/service/event';
                if (iLen > 0) {
                    for (let i = 0; i < iLen; i++) {
                        let curParticipant = participants[i];
                        let oParticipant = this.util.createXMLElement(oEventOutput, participantNamespace, 'Participant');
                        let ouserID = this.util.createXMLElement(oParticipant, participantNamespace, 'userID');
                        let oUserName = this.util.createXMLElement(oParticipant, participantNamespace, 'userName');
                        this.util.setTextContent(ouserID, curParticipant.userID);
                        this.util.appendXMLNode(ouserID, oParticipant);
                        this.util.setTextContent(oUserName, curParticipant.userName);
                        this.util.appendXMLNode(oUserName, oParticipant);
                        this.util.appendXMLNode(oParticipant, oEventOutput);
                    }
                }

                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req, true).then((data: string) => {
                    let objResponse = this.util.parseXml(data);

                    let returnObject = this.util.selectXMLNode(objResponse, './/*[local-name()=\'addEvent\']');
                    let returnData = this.util.xml2json(returnObject).addEvent.addEvent;
                    resolve(returnData);
                }, err => {
                    let errResponse = this.util.parseXml(err.error);

                    let faultCode = this.util.getNodeText(errResponse, './/*[local-name()=\'faultcode\']');
                    let faultString = this.util.getNodeText(errResponse, './/*[local-name()=\'faultstring\']');
                    let returnData = {
                        'faultcode': faultCode,
                        'faultstring': faultString
                    };
                    reject(returnData);
                });
            });
        });
    }

    updateEvent(event: any, participants: any): any {
        return new Promise((resolve, reject) => {
            this.util.getRequestXml('./assets/requests/schedule/update_event.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                this.util.setNodeText(objRequest, './/*[local-name()=\'eventID\']', event.eventID);
                this.util.setNodeText(objRequest, './/*[local-name()=\'categoryID\']', event.categoryID);
                this.util.setNodeText(objRequest, './/*[local-name()=\'isAllDay\']', event.isAllDay);
                this.util.setNodeText(objRequest, './/*[local-name()=\'isRepeat\']', event.isRepeat);
                this.util.setNodeText(objRequest, './/*[local-name()=\'repeatRule\']', event.repeatRule);
                this.util.setNodeText(objRequest, './/*[local-name()=\'startTime\']', event.startTime);
                this.util.setNodeText(objRequest, './/*[local-name()=\'endTime\']', event.endTime);
                this.util.setNodeText(objRequest, './/*[local-name()=\'deviceID\']', event.deviceID);
                this.util.setNodeText(objRequest, './/*[local-name()=\'visibility\']', event.visibility);
                // this.util.setNodeText(objRequest, './/*[local-name()=\'isReminder\']', '');
                // this.util.setNodeText(objRequest, './/*[local-name()=\'reminderRule\']', '');
                this.util.setNodeText(objRequest, './/*[local-name()=\'title\']', event.title);
                this.util.setNodeText(objRequest, './/*[local-name()=\'summary\']', event.summary);
                this.util.setNodeText(objRequest, './/*[local-name()=\'location\']', event.location);
                this.util.setNodeText(objRequest, './/*[local-name()=\'status\']', event.status);
                this.util.setNodeText(objRequest, './/*[local-name()=\'isDeviceRepeatWarned\']', event.isDeviceRepeatWarned);
                this.util.setNodeText(objRequest, './/*[local-name()=\'isEventRepeatWarned\']', event.isEventRepeatWarned);
                this.util.setNodeText(objRequest, './/*[local-name()=\'parentEventID\']', event.parentEventID);
                this.util.setNodeText(objRequest, './/*[local-name()=\'oldStartTime\']', event.oldStartTime);
                this.util.setNodeText(objRequest, './/*[local-name()=\'oldEndTime\']', event.oldEndTime);
                this.util.setNodeText(objRequest, './/*[local-name()=\'isFromRepeatToSpecial\']', event.isFromRepeatToSpecial);

                // add paticipants to the request.
                let oEventOutput = this.util.selectXMLNode(objRequest, './/*[local-name()=\'EventOutput\']');
                let iLen = participants.length;

                // The namespace about schedule's participant
                let participantNamespace = 'http://schemas.intasect.co.jp/mycal/service/event';
                if (iLen > 0) {
                    for (let i = 0; i < iLen; i++) {
                        let curParticipant = participants[i];
                        let oParticipant = this.util.createXMLElement(oEventOutput, participantNamespace, 'Participant');
                        let ouserID = this.util.createXMLElement(oParticipant, participantNamespace, 'userID');
                        let oUserName = this.util.createXMLElement(oParticipant, participantNamespace, 'userName');
                        this.util.setTextContent(ouserID, curParticipant.userID);
                        this.util.appendXMLNode(ouserID, oParticipant);
                        this.util.setTextContent(oUserName, curParticipant.userName);
                        this.util.appendXMLNode(oUserName, oParticipant);
                        this.util.appendXMLNode(oParticipant, oEventOutput);
                    }
                }

                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req, true).then((data: string) => {
                    let objResponse = this.util.parseXml(data);

                    let returnObject = this.util.selectXMLNode(objResponse, './/*[local-name()=\'updateEvent\']');
                    let returnData = this.util.xml2json(returnObject).updateEvent.updateEvent;
                    resolve(returnData);
                }, err => {

                    let errResponse = this.util.parseXml(err.error);

                    let faultCode = this.util.getNodeText(errResponse, './/*[local-name()=\'faultcode\']');
                    let faultString = this.util.getNodeText(errResponse, './/*[local-name()=\'faultstring\']');
                    let returnData = {
                        'faultcode': faultCode,
                        'faultstring': faultString
                    };
                    reject(returnData);
                });
            });
        });
    }

    deleteEvent(eventID: string, isFromRepeatToSpecial: string, startTime: string, endTime: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/schedule/delete_event.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'eventID\']', eventID);
                // delete the event of the selecte dday
                this.util.setNodeText(objRequest, './/*[local-name()=\'isFromRepeatToSpecial\']', '' + isFromRepeatToSpecial);
                if (isFromRepeatToSpecial) {
                    this.util.setNodeText(objRequest, './/*[local-name()=\'parentEventID\']', eventID);
                    this.util.setNodeText(objRequest, './/*[local-name()=\'oldStartTime\']', startTime);
                    this.util.setNodeText(objRequest, './/*[local-name()=\'oldEndTime\']', endTime);
                    this.util.setNodeText(objRequest, './/*[local-name()=\'startTime\']', -1);
                    this.util.setNodeText(objRequest, './/*[local-name()=\'endTime\']', -1);
                }
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then((data: string) => {
                    resolve('true');
                });
            });
        });
    }

    getDeviceListForSelect(): any {
        return new Promise(resolve => {
            this.getDeviceListWithoutTranferToJson().then((deviceOutputs: string) => {
                let devices = new Array();
                for (let i = 0; i < deviceOutputs.length; i++) {
                    let deviceOutput = this.util.xml2json(deviceOutputs[i]).DeviceOutput;
                    let device = deviceOutput;
                    device['isSelected'] = false;
                    devices.push(device);
                }
                resolve(devices);
            });
        });
    }

    getGroupListForCurrentUser(): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/schedule/get_group_list_for_current_user.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let groupNodeList = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'GroupOutput\']');
                    let groupList = new Array();
                    let userList = new Array();
                    for (let i = 0; i < groupNodeList.length; i++) {
                        let groupID = this.util.getNodeText(groupNodeList[i], './/*[local-name()=\'groupID\']');
                        let groupName = this.util.getNodeText(groupNodeList[i], './/*[local-name()=\'groupName\']');

                        userList = [];
                        let groupUserList = this.util.selectXMLNodes(groupNodeList[i], './/*[local-name()=\'GroupUserList\']');
                        for (let j = 0; j < groupUserList.length; j++) {
                            let userInfoWS = this.util.xml2json(groupUserList[j]).GroupUserList;
                            let userInfo = {
                                'userID': userInfoWS.groupUserID,
                                'userName': userInfoWS.groupUserName
                            };
                            userList.push(userInfo);
                        }
                        let groupWithUsers = {
                            'groupID': groupID,
                            'groupName': groupName,
                            'users': userList
                        };
                        groupList.push(groupWithUsers);
                    }
                    resolve(groupList);
                });
            });
        });
    }

    getOrganizationList(): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/schedule/get_organization_list.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let organizationOutputs = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'OrganizationOutput\']');
                    let orgs = new Array();
                    for (let i = 0; i < organizationOutputs.length; i++) {
                        orgs.push(this.util.xml2json(organizationOutputs[i]).OrganizationOutput);
                    }

                    orgs.forEach(function (element) {
                        if (element.parentOrganizationCode && element.parentOrganizationCode !== '') {
                            let curParentOrganizationCode = element.parentOrganizationCode;
                            for (let index = 0; index < orgs.length; index++) {
                                if (orgs[index].organizationCode === curParentOrganizationCode) {
                                    let parentOrganizationName = orgs[index].organizationName;
                                    let curOrganizationName = element.organizationName;
                                    element.organizationName = parentOrganizationName
                                        + '・' + curOrganizationName;
                                    break;
                                }
                            }
                        }
                    }, this);

                    resolve(orgs);
                });
            });
        });
    }

    getHumanResourceUserInfoList(): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/schedule/get_human_resource_user_info_list.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);

                    let userOutputs = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'UserOutput\']');
                    let usrs = new Array();
                    for (let i = 0; i < userOutputs.length; i++) {
                        let userOutput = this.util.xml2json(userOutputs[i]).UserOutput;
                        let user = userOutput;
                        user['isSelected'] = false;
                        user['userID'] = userOutput.userId;
                        usrs.push(user);
                    }
                    resolve(usrs);
                });
            });
        });
    }
}