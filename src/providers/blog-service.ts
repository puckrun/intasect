// Third party library.
import {Injectable} from '@angular/core';
import {NavController} from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import {DomSanitizer} from '@angular/platform-browser';

// Config.
import {AppConfig} from '../app/app.config';

// Utils.
import {Util} from '../utils/util';

@Injectable()
export class BlogService {
    private userDefaultAvatarImageUrl = this.appConfig.get('USER_DEFAULT_AVATAR_IMAGE_URL');

    constructor(private translate: TranslateService,
        private domSanitizer: DomSanitizer,
        private nav: NavController,
        private util: Util,
        private appConfig: AppConfig) {
    }

    getCommunityListForTop(position: number, isNeedRegistNotExistsReply: boolean, keyWord?: string): any {
        let rowsPerpage = 10;
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/get_community_list_for_top_request.xml').then((req: string) => {

                let objRequest = this.util.parseXml(req);

                let cursorNode = this.util.selectXMLNode(objRequest, './/*[local-name()=\'cursor\']');
                this.util.setXMLAttribute(cursorNode, '', 'position', position);
                this.util.setXMLAttribute(cursorNode, '', 'numRows', rowsPerpage);

                this.util.setNodeText(objRequest, './/*[local-name()=\'isNeedRegistNotExistsReply\']', isNeedRegistNotExistsReply);
                if (keyWord) {
                    this.util.setNodeText(objRequest, './/*[local-name()=\'keyWord\']', keyWord);
                }

                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let communityOutputs = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'CommunityOutput\']');
                    let communities = new Array();
                    for (let i = 0; i < communityOutputs.length; i++) {
                        let community = this.util.xml2json(communityOutputs[i]).CommunityOutput;
                        if (!community.createUserAvatar || community.createUserAvatar.toString().indexOf('data:image') !== 0) {
                            community.createUserAvatar = this.userDefaultAvatarImageUrl;
                        }
                        this.util.fromNow(community.publishStartDate).then(data => {
                            community.publishStartDate = data;
                        });

                        communities.push(community);
                    }

                    resolve(communities);
                });
            });
        });
    }

    insertReplyContent(comment: any): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/insert_reply_content_request.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'communityID\']', comment.communityID);
                this.util.setNodeText(objRequest, './/*[local-name()=\'content\']', comment.content);
                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let insertReplyContent = this.util.selectXMLNode(objResponse, './/*[local-name()=\'insertReplyContent\']');
                    let returnData = this.util.xml2json(insertReplyContent).insertReplyContent.insertReplyContent;

                    resolve(returnData);
                });
            });
        });
    }

    // Getting the counting of unread blogs. 
    getNotReadCommunityCountBySelf(): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/get_not_read_community_count_by_self.xml').then((req: string) => {
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

    getCommunityDetailByCommunityID(communityID: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/get_community_detail_by_community_id_request.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                this.util.setNodeText(objRequest, './/*[local-name()=\'communityID\']', communityID);

                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);

                    let communityOutput = this.util.selectXMLNode(objResponse, './/*[local-name()=\'CommunityOutput\']');
                    let community = this.util.xml2json(communityOutput).CommunityOutput;
                    if (!community.createUserAvatar || community.createUserAvatar.toString().indexOf('data:image') !== 0) {
                        community.createUserAvatar = this.userDefaultAvatarImageUrl;
                    }

                    this.util.fromNow(community.createDate).then(data => {
                        community.createDate = data;
                    });

                    let attachFiles = [];
                    community['attachImagesForDisplay'] = [];
                    community['attachFilesForDownload'] = [];
                    let attachFileList = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'attachFileList\']');
                    for (let i = 0; i < attachFileList.length; i++) {
                        let attachFile = this.util.xml2json(attachFileList[i]).attachFileList;
                        if ((attachFile.attachmentName.toLowerCase().indexOf('.png') > 0
                            || attachFile.attachmentName.toLowerCase().indexOf('.jpg') > 0
                            || attachFile.attachmentName.toLowerCase().indexOf('.jpeg') > 0
                            || attachFile.attachmentName.toLowerCase().indexOf('.bmp') > 0)
                            && attachFile.attachmentSize <= 10 * 1024 * 1024) {
                            this.getRequestOfDownloadAttachmentByAttachmentID(attachFile.attachmentID).then((data) => {
                                let attachImageSrc = this.domSanitizer.bypassSecurityTrustUrl('data:image/jpeg;base64,' + data.downloadAttachmentByAttachmentId);
                                community['attachImagesForDisplay'].push(attachImageSrc);
                            });
                        } else {
                            attachFile.attachmentSize = '(' + this.util.getFileSize(attachFile.attachmentSize) + ')';
                            community['attachFilesForDownload'].push(attachFile);
                        }
                        attachFiles.push(attachFile);
                    }
                    community.attachFileList = attachFiles;
                    resolve(community);
                });
            });
        });
    }

    getReplyContentListByCommunityID(communityID: string, position: number): any {
        // Setting the number of per drag.
        let rowsPerpage = 5;
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/get_reply_content_list_by_community_id_request.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                let cursorNode = this.util.selectXMLNode(objRequest, './/*[local-name()=\'cursor\']');
                this.util.setXMLAttribute(cursorNode, '', 'position', position);
                this.util.setXMLAttribute(cursorNode, '', 'numRows', rowsPerpage);
                this.util.setNodeText(objRequest, './/*[local-name()=\'communityID\']', communityID);

                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);

                    let rreplyContentOutputs = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'ReplyContentOutput\']');
                    let replyContents = new Array();
                    for (let i = 0; i < rreplyContentOutputs.length; i++) {
                        let replyContent = this.util.xml2json(rreplyContentOutputs[i]).ReplyContentOutput;
                        if (!replyContent.userAvatar || replyContent.userAvatar.toString().indexOf('data:image') !== 0) {
                            replyContent.userAvatar = this.userDefaultAvatarImageUrl;
                        }
                        this.util.fromNow(replyContent.createDate).then(data => {
                            replyContent.createDate = data;
                        });

                        let attachFiles = [];
                        replyContent['attachImagesForDisplay'] = [];
                        replyContent['attachFilesForDownload'] = [];
                        let replyContentAttachFileList = replyContent.replyContentAttachFileList;
                        if (replyContentAttachFileList) {
                            for (let j = 0; j < replyContentAttachFileList.length; j++) {
                                let attachFile = replyContentAttachFileList[j];
                                if ((attachFile.replyContentAttachmentName.toLowerCase().indexOf('.png') > 0
                                    || attachFile.replyContentAttachmentName.toLowerCase().indexOf('.jpg') > 0
                                    || attachFile.replyContentAttachmentName.toLowerCase().indexOf('.jpeg') > 0
                                    || attachFile.replyContentAttachmentName.toLowerCase().indexOf('.bmp') > 0)
                                    && attachFile.replyContentAttachmentSize <= 10 * 1024 * 1024) {
                                    this.getRequestOfDownloadReplyContentAttachmentByreplyContentAttachmentID(attachFile.replyContentAttachmentID).then((data) => {
                                        let attachImageSrc = this.domSanitizer.bypassSecurityTrustUrl('data:image/jpeg;base64,' + data.downloadReplyContentAttachmentByreplyContentAttachmentID);
                                        replyContent['attachImagesForDisplay'].push(attachImageSrc);
                                    });
                                } else {
                                    attachFile.replyContentAttachmentSize = '(' + this.util.getFileSize(attachFile.replyContentAttachmentSize) + ')';
                                    replyContent['attachFilesForDownload'].push(attachFile);
                                }
                                attachFiles.push(attachFile);
                            }
                        }
                        replyContent.replyContentAttachFileList = attachFiles;

                        replyContents.push(replyContent);
                    }

                    let cursor = this.util.selectXMLNode(objResponse, './/*[local-name()=\'cursor\']');
                    cursor = this.util.xml2json(cursor);
                    if (cursor && cursor.cursor) {
                        cursor = cursor.cursor;
                    }
                    let result = {
                        'cursor': cursor.$,
                        'replyContents': replyContents
                    };
                    resolve(result);
                });
            });
        });
    }

    updateReplyStatus(communityID: string, status: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/update_reply_status.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                this.util.setNodeText(objRequest, './/*[local-name()=\'communityID\']', communityID);
                this.util.setNodeText(objRequest, './/*[local-name()=\'replystatus\']', status);
                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then(data => {
                    resolve('true');
                });
            });
        });
    }

    updateNewReplyFlag(communityID: string, status: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/update_new_reply_flag.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'communityID\']', communityID);
                this.util.setNodeText(objRequest, './/*[local-name()=\'newReplyFlag\']', status);
                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then(data => {
                    resolve('true');
                });
            });
        });
    }

    saveComment(comment: any): any {
        return new Promise(resolve => {
            if (comment.content && this.util.deleteEmSpaceEnSpaceNewLineInCharacter(comment.content) !== '') {
                this.insertReplyContent(comment).then(data => {
                    if (data === 'true') {
                        resolve(data);
                    }
                });
            } else {
                this.translate.get('app.blog.message.error.noContent').subscribe(message => {
                    this.util.presentModal(message);
                });
            }
        });
    }

    getRequestOfDownloadAttachmentByAttachmentID(attachmentID: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/download_attachment_by_attachment_id.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                this.util.setNodeText(objRequest, './/*[local-name()=\'attachmentID\']', attachmentID);
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

    getRequestOfDownloadReplyContentAttachmentByreplyContentAttachmentID(replyContentAttachmentID: string): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/download_reply_content_attachment_by_reply_content_attachment_id.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);

                this.util.setNodeText(objRequest, './/*[local-name()=\'replyContentAttachmentID\']', replyContentAttachmentID);
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let returnOutPut = this.util.selectXMLNode(objResponse, './/*[local-name()=\'downloadReplyContentAttachmentByreplyContentAttachmentID\']');
                    let returnData = this.util.xml2json(returnOutPut).downloadReplyContentAttachmentByreplyContentAttachmentID;
                    resolve(returnData);
                });
            });
        });
    }

    insertCommunity(community: any): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/insert_community.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'title\']', community.title);
                this.util.setNodeText(objRequest, './/*[local-name()=\'content\']', community.content);
                this.util.setNodeText(objRequest, './/*[local-name()=\'allMemberFlag\']', community.allMemberFlag);
                this.util.setNodeText(objRequest, './/*[local-name()=\'status\']', community.actionFlag);
                let communityInput = this.util.selectXMLNode(objRequest, './/*[local-name()=\'CommunityInput\']');
                let communityNamespace = 'http://schemas.intasect.co.jp/generictools/service/Community';
                let replyList = community.selectedUsers;
                if (community.allMemberFlag === 'FALSE') {
                    for (let i = 0; i < replyList.length; i++) {
                        let replyListNode = this.util.createXMLElement(communityInput, communityNamespace, 'replyList');
                        let userID = this.util.createXMLElement(replyListNode, communityNamespace, 'userID');
                        let userName = this.util.createXMLElement(replyListNode, communityNamespace, 'userName');
                        this.util.setTextContent(userID, replyList[i].userID);
                        this.util.appendXMLNode(userID, replyListNode);
                        this.util.setTextContent(userName, replyList[i].userName);
                        this.util.appendXMLNode(userName, replyListNode);
                        this.util.appendXMLNode(replyListNode, communityInput);
                    }
                }

                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then(data => {
                    resolve('true');
                });
            });
        });
    }

    getOrganizationList(): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/get_organization_list.xml').then((req: string) => {
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

    getUserList(): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/get_user_list.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'selType\']', 'ALL');
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let userOutputs = this.util.selectXMLNodes(objResponse, './/*[local-name()=\'UserOutput\']');
                    let usrs = new Array();
                    for (let i = 0; i < userOutputs.length; i++) {
                        let userOutput = this.util.xml2json(userOutputs[i]).UserOutput;
                        let user = userOutput;
                        user['isSelected'] = false;
                        user['assignOrgCd'] = userOutput.organization;
                        usrs.push(user);
                    }
                    resolve(usrs);
                });
            });
        });
    }
    deleteReplyContent(comment) {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/delete_reply_content.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'replyContentID\']', comment.replyContentID);
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then((data: string) => {
                    resolve(true);
                });
            });
        });
    }

    deleteCommunity(communityID) {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/delete_community.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'communityID\']', communityID);
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then((data: string) => {
                    resolve(true);
                });
            });
        });
    }

    updateCommunity(community: any): any {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/blog/update_community.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'title\']', community.title);
                this.util.setNodeText(objRequest, './/*[local-name()=\'content\']', community.content);
                this.util.setNodeText(objRequest, './/*[local-name()=\'allMemberFlag\']', community.allMemberFlag);
                this.util.setNodeText(objRequest, './/*[local-name()=\'status\']', community.actionFlag);
                let communityInput = this.util.selectXMLNode(objRequest, './/*[local-name()=\'CommunityInput\']');
                let communityNamespace = 'http://schemas.intasect.co.jp/generictools/service/Community';
                let replyList = community.selectedUsers;
                if (community.allMemberFlag === 'FALSE') {
                    for (let i = 0; i < replyList.length; i++) {
                        let replyListNode = this.util.createXMLElement(communityInput, communityNamespace, 'replyList');
                        let userID = this.util.createXMLElement(replyListNode, communityNamespace, 'userID');
                        let userName = this.util.createXMLElement(replyListNode, communityNamespace, 'userName');
                        this.util.setTextContent(userID, replyList[i].userID);
                        this.util.appendXMLNode(userID, replyListNode);
                        this.util.setTextContent(userName, replyList[i].userName);
                        this.util.appendXMLNode(userName, replyListNode);
                        this.util.appendXMLNode(replyListNode, communityInput);
                    }
                }

                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then(data => {
                    resolve('true');
                });
            });
        });
    }
}