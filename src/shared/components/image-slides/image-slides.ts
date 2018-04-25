// Third party library.
import { Component } from '@angular/core';
import { NavController, NavParams, ActionSheetController, ToastController, Platform } from 'ionic-angular';
import { Base64ToGallery } from '@ionic-native/base64-to-gallery';
import { TranslateService } from '@ngx-translate/core';

// Utils.
import { Util } from '../../../utils/util';

@Component({
    selector: 'page-components-image-slides',
    templateUrl: 'image-slides.html',
    providers: [
        Base64ToGallery
    ]
})
export class ImageSlidesPage {
    public sendData: any;
    public images: any;
    public index = 0;
    public hasPluralPages = false;
    constructor(private nav: NavController, private actionSheetCtrl: ActionSheetController, private toastCtrl: ToastController, private params: NavParams, private util: Util, private translate: TranslateService, private platform: Platform, private base64ToGallery: Base64ToGallery) {
        this.sendData = this.params.get('sendData');
        this.images = Array.prototype.slice.call(this.sendData.images);
        let currentImage = this.sendData.currentImage;

        for (let i = 0; i < this.images.length; i++) {
            if (this.images[i].src === currentImage.src) {
                this.index = i;
            }
        }
        this.hasPluralPages = this.images.length > 1 ? true : false;
    }

    backToBlogDetail() {
        this.nav.pop();
    }

    showPictureOperations(image) {
        if (this.platform.is('cordova')) {
            this.translate.get(['app.action.savePicture',
                'app.action.cancel']).subscribe(message => {
                    let deleteEventOfSelectedDay = message['app.action.savePicture'];
                    let cancelButton = message['app.action.cancel'];
                    let actionSheet = this.actionSheetCtrl.create({
                        buttons: [
                            {
                                text: deleteEventOfSelectedDay,
                                handler: () => {
                                    this.savePicture(image);
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

    savePicture(image) {
        let base64Data;
        if (image.src.indexOf('data:image/jpeg;base64,') < 0) {
            let canvas = document.createElement('canvas');
            canvas.height = image.naturalHeight;
            canvas.width = image.naturalWidth;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            base64Data = canvas.toDataURL();
        } else {
            base64Data = image.src.replace('data:image/jpeg;base64,', '')
        }
        this.base64ToGallery.base64ToGallery(base64Data, {
            prefix: 'img_',
            mediaScanner: true
        }).then(
            res => (setTimeout(() => {
                this.showSuccessToast();
            }, 500)),
            err => this.showErrorPresent()
            );
    }

    showSuccessToast() {
        this.translate.get('app.blog.message.success.savePicture').subscribe(message => {
            let content = message;
            let toast = this.toastCtrl.create({
                message: content,
                duration: 3000,
                cssClass: 'middle'
            });
            toast.present();
        });
    }

    showErrorPresent() {
        this.translate.get('app.blog.message.error.savePicture').subscribe(message => {
            this.util.presentModal(message);
        });
    }
}