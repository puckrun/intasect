// Third party library.
import { Component, ViewChild } from '@angular/core';
import { NavController, ActionSheetController, NavParams, Content } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';

// Utils.
import { Util } from '../../../utils/util';

// Services.
import { BlogService } from '../../../providers/blog-service';
import { ShareService } from '../../../providers/share-service';
import { UserService } from '../../../providers/user-service';

// Pages.
import { AddCommentPage } from '../add-comment/add-comment';

@Component({
    selector: 'page-blog-detail',
    templateUrl: 'detail.html',
    providers: [UserService, BlogService, Util]
})
export class BlogDetailPage {
    @ViewChild(Content) pageContent: Content;
    public community: any;
    public id: string;
    public readStatus: string;
    public newReplyFlag: string;
    public sendDataForAddComment: any;
    public title: string;
    public content: any;
    public createDate: string;
    public createUserName: string;
    public createUserAvatar: string;
    public status: string;
    public readCount: string;
    public isLoadCompleted: boolean;
    public isScrollToTopButtonVisible: boolean;

    public comments: any;
    public commentCount: string;
    public attachFilesForDownload: any;
    public attachImagesForDisplay: any;
    public hasAttachFilesForDownload: boolean = false;

    public pageLoadTime: number;
    public imageClickEventBinded = false;
    public images: any;
    public sendData: any;
    public loginID: string;
    public createUserID: string;

    constructor(
        private domSanitizer: DomSanitizer,
        private nav: NavController,
        private params: NavParams,
        private actionSheetCtrl: ActionSheetController,
        private userService: UserService,
        private util: Util,
        private translate: TranslateService,
        private blogService: BlogService,
        private share: ShareService) {
        this.loginID = this.userService.getUserID();

        this.sendData = this.params.get('sendData');
        this.community = this.sendData.community;
        this.id = this.community.communityID;
        this.readStatus = this.community.readStatus;
        this.newReplyFlag = this.community.newReplyFlag;

        this.sendDataForAddComment = {
            'id': this.id,
            'isRefreshFlag': false,
            'unrepliedCommentcontent': ''
        };
        this.getCommunityDetailByCommunityID();
        this.getReplyContentListByCommunityID();
    }

    ngAfterViewChecked() {

    }

    addComment(): void {
        this.nav.push(AddCommentPage, { 'sendDataForAddComment': this.sendDataForAddComment });
    }

    getCommunityDetailByCommunityID(): void {
        this.blogService.getCommunityDetailByCommunityID(this.id).then((data: any) => {
            this.title = data.title;
            this.content = this.domSanitizer.bypassSecurityTrustHtml(data.content);
            this.createDate = data.createDate;
            this.createUserID = data.createUser;
            this.createUserName = data.createUserName;
            this.createUserAvatar = data.createUserAvatar;
            this.status = data.status;
            this.readCount = data.readCount;
            this.attachImagesForDisplay = data.attachImagesForDisplay;
            this.attachFilesForDownload = data.attachFilesForDownload;
            if (data.attachFilesForDownload.length > 0) {
                this.hasAttachFilesForDownload = true;
            }
            this.isLoadCompleted = true;
            this.isScrollToTopButtonVisible = false;
            if (this.status === 'PUBLISH' && this.newReplyFlag === 'TRUE') {
                this.updateNewReplyFlag();
            }
        });
    }

    getReplyContentListByCommunityID(): void {
        let position = 0;
        this.blogService.getReplyContentListByCommunityID(this.id, position).then((data: any) => {
            if (data) {
                this.comments = data.replyContents;
                this.commentCount = data.cursor.maxRows;
            }
        });
    }

    doInfinite(infiniteScroll): void {
        let position: number;
        if (this.comments) {
            position = this.comments.length;
        } else {
            position = 0;
        }

        this.blogService.getReplyContentListByCommunityID(this.id, position).then((data: any) => {
            if (data && data.replyContents[0]) {
                this.comments = this.comments.concat(data.replyContents);
            }
            infiniteScroll.complete();
        });
    }

    ionViewDidLoad(): void {
        this.pageLoadTime = new Date().getTime();
    }

    ionViewWillEnter(): void {
        let isRefreshFlag = this.sendDataForAddComment.isRefreshFlag;
        if (isRefreshFlag === true) {
            this.getReplyContentListByCommunityID();
        }
    }

    ionViewDidEnter(): void {
        let isRefreshFlag = this.sendDataForAddComment.isRefreshFlag;
        if (isRefreshFlag === true) {
            this.pageContent.scrollToBottom();
            this.sendDataForAddComment.unrepliedCommentcontent = '';
        }
    }

    ionViewWillLeave(): void {
        this.sendDataForAddComment.isRefreshFlag = false;
    }

    ionViewWillUnload(): void {
        let now = new Date().getTime();
        let pageLoadingTime = now - this.pageLoadTime;
        if (this.status === 'PUBLISH' && this.readStatus === 'NOT_READ' && pageLoadingTime >= 3000) {
            this.updateReplyStatus();
        }
        this.isLoadCompleted = false;
        this.isScrollToTopButtonVisible = false;
    }

    updateReplyStatus(): void {
        let readStatus = 'READ';
        this.blogService.updateReplyStatus(this.id, readStatus).then((data: string) => {
            if (data === 'true') {
                this.community.readStatus = readStatus;
                let blogNewInformationCount = this.share.blogNewInformationCount;
                this.share.blogNewInformationCount = blogNewInformationCount - 1;
            }
        });
    }

    updateNewReplyFlag(): void {
        let newReplyFlag = 'FALSE';
        this.blogService.updateNewReplyFlag(this.id, newReplyFlag).then((data: string) => {
            if (data === 'true') {
                this.community.newReplyFlag = newReplyFlag;
            }
        });
    }

    ngAfterViewInit(): void {
        this.pageContent.ionScroll.subscribe(() => {
            if (this.pageContent.scrollTop > 200) {
                this.isScrollToTopButtonVisible = true;
            } else {
                this.isScrollToTopButtonVisible = false;
            }
        });
    }

    scrollToDetailPageTop(): void {
        this.pageContent.scrollToTop();
    }

    showDeleteReplyContentConfirmMessage(comment) {
        this.translate.get('app.blog.message.warning.deleteReplyContent').subscribe(message => {
            let content = message;
            let okHandler = function (that) {
                return function () {
                    that.deleteReplyContent(comment)
                };
            };
            this.util.presentConfirmModal(content, 'warning', okHandler(this));
        });
    }

    deleteReplyContent(comment) {
        this.blogService.deleteReplyContent(comment).then(data => {
            if (data) {
                this.util.googleAnalyticsTrackEvent('Schedule', 'delete', 'comment');
                this.getReplyContentListByCommunityID();
            }
        });
    }

    showBlogOperations() {
        if (this.loginID === this.createUserID) {
            this.translate.get(['app.action.edit', 'app.action.delete',
                'app.action.cancel']).subscribe(message => {
                    // let editBlog = message['app.action.edit'];
                    let deleteBlog = message['app.action.delete'];
                    let cancelButton = message['app.action.cancel'];
                    let actionSheet = this.actionSheetCtrl.create({
                        buttons: [
                            // edit blog
                            // {
                            //     text: editBlog,
                            //     handler: () => {
                            //         this.showEditBlogPage();
                            //     }
                            // }, 
                            {
                                text: deleteBlog,
                                handler: () => {
                                    setTimeout(() => {
                                        this.showDeleteBlogConfirmMessage();
                                    }, 500);
                                }
                            }, {
                                text: cancelButton,
                                role: 'cancel',
                                handler: () => {

                                }
                            }
                        ]
                    });
                    actionSheet.present();
                });
        }
    }

    showDeleteBlogConfirmMessage() {
        this.translate.get('app.blog.message.warning.deleteBlog').subscribe(message => {
            let content = message;
            let okHandler = function (that) {
                return function () {
                    that.deleteCommunity();
                };
            };
            this.util.presentConfirmModal(content, 'warning', okHandler(this));
        });
    }

    deleteCommunity() {
        this.blogService.deleteCommunity(this.id).then(data => {
            if (data) {
                this.util.googleAnalyticsTrackEvent('Blog', 'delete', 'blog');
                this.sendData.isRefreshFlag = true;
                this.nav.pop();
            }
        });
    }

    showEditBlogPage() {

    }
}