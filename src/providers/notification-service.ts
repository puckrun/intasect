// Third party library.
import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';

// Config.
import {AppConfig} from '../app/app.config';

// Utils
import {Util} from '../utils/util';

@Injectable()
export class NotificationService {
    private userDefaultAvatarImageUrl: string;

    constructor(private http: HttpClient,
        private domSanitizer: DomSanitizer,
        private appConfig: AppConfig,
        private util: Util) {
        this.userDefaultAvatarImageUrl = this.appConfig.get('USER_DEFAULT_AVATAR_IMAGE_URL');
    }

    getNotificationListForTop(position: number, isNeedRegistNotExistsReadStatus: boolean, keyWord?: string): any {
        let rowsPerpage = 10;
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/notification/get_notification_list_for_top_request.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                let cursorNode = this.util.selectXMLNode(objRequest, './/*[local-name()=\'cursor\']');
                this.util.setXMLAttribute(cursorNode, '', 'position', position);
                this.util.setXMLAttribute(cursorNode, '', 'numRows', rowsPerpage);

                this.util.setNodeText(objRequest, './/*[local-name()=\'isNeedRegistNotExistsReadStatus\']', isNeedRegistNotExistsReadStatus);
                if (keyWord) {
                    this.util.setNodeText(objRequest, './/*[local-name()=\'keyWord\']', keyWord);
                }
                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let notificationOutputs = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'NotificationOutputForTop\']');
                    let notifications = new Array();
                    for (let i = 0; i < notificationOutputs.length; i++) {
                        let notification = this.util.xml2json(notificationOutputs[i]).NotificationOutputForTop;
                        if (!notification.createUserAvatar || notification.createUserAvatar.toString().indexOf('data:image') !== 0) {
                            notification.createUserAvatar = this.userDefaultAvatarImageUrl;
                        }
                        this.util.fromNowForNotification(notification.publishStartDate).then(data => {
                            notification.publishStartDate = data;
                        });
                        notifications.push(notification);
                    }

                    resolve(notifications);
                });
            });
        });
    }

    getNotReadNotificationCountBySelf(): Promise<string> {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/notification/get_not_read_notification_count_by_self.xml').then((req: string) => {
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

    getNotificationDetailByNotificationID(notificationID: string): Promise<any> {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/notification/get_notification_detail_by_notification_id_request.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                this.util.setNodeText(objRequest, './/*[local-name()=\'notificationID\']', notificationID);

                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);

                    let notificationOutput = this.util.selectXMLNode(objResponse, './/*[local-name()=\'NotificationOutput\']');
                    let notification = this.util.xml2json(notificationOutput).NotificationOutput;
                    if (!notification.createUserAvatar || notification.createUserAvatar.toString().indexOf('data:image') !== 0) {
                        notification.createUserAvatar = this.userDefaultAvatarImageUrl;
                    }
                    this.util.fromNowForNotification(notification.publishStartDate).then((data: any) => {
                        notification.publishStartDate = data;
                    });

                    let attachFiles = [];
                    notification['attachImagesForDisplay'] = [];
                    notification['attachFilesForDownload'] = [];
                    let attachFileList = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'attachFileList\']');
                    for (let i = 0; i < attachFileList.length; i++) {
                        let attachFile = this.util.xml2json(attachFileList[i]).attachFileList;
                        if ((attachFile.attachmentName.toLowerCase().indexOf('.png') > 0
                            || attachFile.attachmentName.toLowerCase().indexOf('.jpg') > 0
                            || attachFile.attachmentName.toLowerCase().indexOf('.jpeg') > 0
                            || attachFile.attachmentName.toLowerCase().indexOf('.bmp') > 0)
                            && attachFile.attachmentSize <= 10 * 1024 * 1024) {
                            this.getRequestOfDownloadAttachmentByAttachmentID(attachFile.attachmentId).then((data) => {
                                let attachImageSrc = this.domSanitizer.bypassSecurityTrustUrl('data:image/jpeg;base64,' + data.downloadAttachmentByAttachmentId);
                                notification['attachImagesForDisplay'].push(attachImageSrc);
                            });
                        } else {
                            attachFile.attachmentSize = '(' + this.util.getFileSize(attachFile.attachmentSize) + ')';
                            notification['attachFilesForDownload'].push(attachFile);
                        }
                        attachFiles.push(attachFile);
                    }
                    notification.attachFileList = attachFiles;

                    resolve(notification);
                });
            });
        });
    }

    updateReadStatus(notificationID: string, status: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/notification/update_read_status.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                this.util.setNodeText(objRequest, './/*[local-name()=\'notificationId\']', notificationID);
                this.util.setNodeText(objRequest, './/*[local-name()=\'status\']', status);
                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    resolve('true');
                });
            });
        });
    }

    getRequestOfDownloadAttachmentByAttachmentID(attachmentID: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/notification/download_attachment_by_attachment_id.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                this.util.setNodeText(objRequest, './/*[local-name()=\'attachmentId\']', attachmentID);
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let returnOutPut = this.util.selectXMLNode(objResponse, './/*[local-name()=\'downloadAttachmentByAttachmentId\']');
                    let returnData = this.util.xml2json(returnOutPut).downloadAttachmentByAttachmentId;
                    resolve(returnData);
                });
            });
        });
    }
}