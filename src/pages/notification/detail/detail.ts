// Third party library.
import { Component, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { NavController, NavParams, ViewController, Content } from 'ionic-angular';
import { NotificationService } from '../../../providers/notification-service';
import { DomSanitizer } from '@angular/platform-browser';

// Services.
import { ShareService } from '../../../providers/share-service';

@Component({
    selector: 'page-notification-detail',
    templateUrl: 'detail.html',
    providers: [
        NotificationService
    ]
})

export class NotificationDetailPage {
    @ViewChild(Content) pageContent: Content;

    public notification: any;
    public id: string;
    public readStatus: string;
    // The detail data of event.
    public title: string;
    public content: any;
    public createUserId: string;
    public publishStartDate: string;
    public createUserAvatar: string;
    public createUserName: string;
    public status: string;
    public readCount: string;
    public isLoadCompleted: boolean;
    public isScrollToTopButtonVisible: boolean;
    // The number of milliseconds between midnight, January 1, 1970.
    public pageLoadTime: number;
    public attachFilesForDownload: any;
    public attachImagesForDisplay: any;
    public hasAttachFilesForDownload: boolean = false;

    constructor(
        private domSanitizer: DomSanitizer,
        private componentFactoryResolver: ComponentFactoryResolver,
        private nav: NavController,
        private params: NavParams,
        private notificationService: NotificationService,
        private view: ViewController,
        private share: ShareService) {
        this.notification = this.params.get('notification');
        this.id = this.notification.notificationID;
        this.readStatus = this.notification.readStatus;

        this.getNotificationDetailByNotificationID();
    }

    getNotificationDetailByNotificationID(): void {
        this.notificationService.getNotificationDetailByNotificationID(this.id).then((data: any) => {
            this.title = data.title;
            this.content = this.domSanitizer.bypassSecurityTrustHtml(data.content);
            this.createUserId = data.createUser;
            this.publishStartDate = data.publishStartDate;
            this.createUserAvatar = data.createUserAvatar;
            this.createUserName = data.createUserName;
            this.status = data.status;
            this.readCount = data.readCount;
            this.attachImagesForDisplay = data.attachImagesForDisplay;
            this.attachFilesForDownload = data.attachFilesForDownload;
            if (data.attachFilesForDownload.length > 0) {
                this.hasAttachFilesForDownload = true;
            }
            this.isLoadCompleted = true;
            this.isScrollToTopButtonVisible = false;

        });
    }

    ionViewDidLoad(): void {
        this.pageLoadTime = new Date().getTime();
    }

    ionViewWillUnload(): void {
        let now = new Date().getTime();
        let pageLoadingTime = now - this.pageLoadTime;
        if (this.status === 'PUBLISH' && this.readStatus === 'NOT_READ' && pageLoadingTime >= 3000) {
            this.updateReadStatus();
        }
        this.isLoadCompleted = false;
        this.isScrollToTopButtonVisible = false;
    }

    updateReadStatus(): void {
        let readStatus = 'READ';
        this.notificationService.updateReadStatus(this.id, readStatus).then((data: string) => {
            if (data === 'true') {
                this.notification.readStatus = readStatus;
                let notificationNewInformationCount = Number(this.share.notificationNewInformationCount);
                this.share.notificationNewInformationCount = notificationNewInformationCount - 1;
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
}