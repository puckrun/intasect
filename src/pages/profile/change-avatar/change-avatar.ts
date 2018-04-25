// Third party library.
import {ViewChild, Component, NgZone, ElementRef} from '@angular/core';
import {NavController, NavParams, ViewController, LoadingController, ToastController, Platform} from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
/// <reference path="./exif-ts/exif.d.ts" />
import * as EXIF from 'exif-ts/exif';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {UserService} from '../../../providers/user-service';
import {ShareService} from '../../../providers/share-service';

@Component({
    selector: 'page-profile-change-avatar',
    templateUrl: 'change-avatar.html',
    providers: [
        UserService,
        Util
    ]
})

export class ChangeAvatarPage {
    @ViewChild('fileInput') fileInput: ElementRef;

    public user: any;
    public isLoadCompleted: boolean;
    public initAvatar: string;
    public userAvatar: string;
    public isSelectChange: boolean;
    public selectedImageFile: string;
    public width: number;
    public height: number;
    public loading: any;

    constructor(private nav: NavController,
        private params: NavParams,
        private view: ViewController,
        private loadingCtrl: LoadingController,
        private toastCtrl: ToastController,
        private zone: NgZone,
        private platform: Platform,
        private userService: UserService,
        private translate: TranslateService,
        private share: ShareService,
        private util: Util) {

        this.user = this.params.get('user');
        this.isLoadCompleted = true;


        this.initAvatar = this.user.userAvatar;

        this.userAvatar = this.initAvatar;
        this.isSelectChange = false;
        this.selectedImageFile = '';

        this.userService = userService;

        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }

    onFileInputChange(event) {
        this.isLoadCompleted = false;
        this.translate.get(['app.profile.message.loading.avatarLoading']).subscribe(message => {
            let content = message['app.profile.message.loading.avatarLoading'];
            this.loading = this.loadingCtrl.create({
                spinner: 'ios',
                content: content
            });
            this.loading.present();
        });
        // There we used the (<any>param) to change the type of EventTarget to any. This should be re-discussion.
        let fileInput = (<any>event.currentTarget);
        let file = fileInput.files[0];

        if (file) {
            if (file.type && !/image/i.test(file.type)) {
                return false;
            }
            let reader = new FileReader();
            let wholeThis = this;
            reader.onload = function (e) {
                // There we used the (<any>param) to change the type of EventTarget to any. This should be re-discussion.
                wholeThis.render(file, (<any>e.target).result, wholeThis);
            };
            reader.readAsDataURL(file);
        }
    }

    render(file, src, other) {
        EXIF.getData(file, function () {
            // get the Orientation of avatar.
            let orientation = EXIF.getTag(this, 'Orientation');

            let image = new Image();
            image.onload = function () {
                let degree = 0, drawWidth, drawHeight, width, height;
                let scale = image.naturalWidth / image.naturalHeight;
                image.width = 1024;
                image.height = image.width / scale;
                drawWidth = image.width;
                drawHeight = image.height;
                let quality = 0;
                let canvas = document.createElement('canvas');

                canvas.width = width = drawWidth;
                canvas.height = height = drawHeight;
                let context = canvas.getContext('2d');

                switch (orientation) {
                    // take photo when home key is on the left of iphone
                    case 3:
                        degree = 180;
                        drawWidth = -width;
                        drawHeight = -height;
                        break;
                    // take photo when home key is on the bottom of iphone
                    case 6:
                        canvas.width = height;
                        canvas.height = width;
                        degree = 90;
                        drawWidth = width;
                        drawHeight = -height;
                        break;
                    // take photo when home key is on the top of iphone
                    case 8:
                        canvas.width = height;
                        canvas.height = width;
                        degree = 270;
                        drawWidth = -width;
                        drawHeight = height;
                        break;
                }
                // //user canvas to rotate the picture
                context.rotate(degree * Math.PI / 180);
                context.drawImage(image, 0, 0, drawWidth, drawHeight);
                if (file.size <= 500 * 1024) {
                    quality = 0.9;
                } else if (file.size > 500 * 1024 && file.size <= 6 * 1024 * 1024) {
                    quality = 0.8;
                } else if (file.size > 6 * 1024 * 1024 && file.size <= 8 * 1024 * 1024) {
                    quality = 0.7;

                } else {
                    other.loading.dismiss();
                    other.translate.get('app.profile.message.error.avatarTooLarge').subscribe(message => {
                        other.util.presentModal(message);
                    });
                    other.isSelectChange = false;
                    return false;
                }
                other.zone.run(() => {
                    let base64 = canvas.toDataURL('image/jpeg', quality);
                    other.userAvatar = base64;
                    other.isSelectChange = true;
                    other.isLoadCompleted = true;
                    other.loading.dismiss();
                });
            };
            image.src = src;
        });
    }

    changeUserAvatar() {
        this.isLoadCompleted = false;
        this.translate.get(['app.profile.message.loading.avatarUploading']).subscribe(message => {
            let content = message['app.profile.message.loading.avatarUploading'];
            let upLoading = this.loadingCtrl.create({
                spinner: 'ios',
                content: content
            });
            upLoading.present().then(() => {
                this.userService.changeUserAvatar(this.userAvatar).then(user => {
                    if (user) {
                        this.isSelectChange = false;
                        this.fileInput.nativeElement.value = '';
                        this.share.initializeUser(user);
                        this.translate.get(['app.profile.message.success.changeAvatar']).subscribe(message => {
                            let content = message['app.profile.message.success.changeAvatar'];
                            setTimeout(() => {
                                let toast = this.toastCtrl.create({
                                    message: content,
                                    duration: 3000,
                                    cssClass: 'middle'
                                });
                                toast.present();
                            }, 500);
                        });
                    }
                    upLoading.dismiss();
                    this.isLoadCompleted = true;
                }, function () {
                    upLoading.dismiss();
                });
            });
        });
    }

    resetUserAvatar() {
        this.userAvatar = this.initAvatar;
        this.fileInput.nativeElement.value = '';
        this.isSelectChange = false;
    }
}
