// Third party library.
import {Component, ViewChild, NgZone, ElementRef} from '@angular/core';
import {NavController, NavParams, LoadingController} from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

/// <reference path="./exif-ts/exif.d.ts" />
import * as EXIF from 'exif-ts/exif';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {BlogService} from '../../../providers/blog-service';

@Component({
    selector: 'page-blog-add-comment',
    templateUrl: 'add-comment.html',
    providers: [
        BlogService,
        Util
    ]
})
export class AddCommentPage {
    @ViewChild('fileInput') fileInput: ElementRef;
    public pictures: any = new Array();
    public loading: any;
    public sendDataForAddComment: any;
    public id: string;
    public comment: any;
    public isDisabled: boolean;

    constructor(private nav: NavController, private params: NavParams, private zone: NgZone, private loadingCtrl: LoadingController, private translate: TranslateService, private blogService: BlogService, private util: Util) {
        this.sendDataForAddComment = this.params.get('sendDataForAddComment');
        this.id = this.sendDataForAddComment.id;
        this.comment = {
            communityID: this.id,
            content: this.sendDataForAddComment.unrepliedCommentcontent
        };
    }

    saveComment(): void {
        this.isDisabled = true;
        this.translate.get(['app.blog.isSaving']).subscribe(message => {
            let content = message['app.blog.isSaving'];
            this.loading = this.loadingCtrl.create({
                spinner: 'ios',
                content: content
            });
            this.loading.present();
        });
        this.isDisabled = true;
        let comment = {
            communityID: this.id,
            content: this.getRealContent()
        };
        this.blogService.saveComment(comment).then(data => {
            if (data === 'true') {
                this.sendDataForAddComment.isRefreshFlag = true;
                this.loading.dismiss();
                setTimeout(() => {
                    this.nav.pop();
                }, 500);
                this.util.googleAnalyticsTrackEvent('Blog', 'add', 'comment');
            } else {
                this.isDisabled = null;
            }
        });
    }

    ionViewWillLeave(): void {
        this.sendDataForAddComment.unrepliedCommentcontent = this.comment.content;
    }

    ionViewWillEnter(): void {
        this.changeContent();
    }

    changeContent(): void {
        if (this.comment.content && this.util.deleteEmSpaceEnSpaceNewLineInCharacter(this.comment.content) !== '') {
            this.isDisabled = null;
        } else {
            this.isDisabled = true;
        }
        this.autoResizeContent();
    }

    autoResizeContent(): void {
        let textarea = document.querySelector('.add-comment textarea');
        if (textarea.scrollHeight > 0) {
            // textarea.style.height = textarea.scrollHeight + 'px';
        }
    }

    addPicture(event): any {
        // There we used the (<any>param) to change the type of EventTarget to any. This should be re-discussion.
        let fileInput = (<any>event.currentTarget);
        for (let i = 0; i < fileInput.files.length; i++) {
            let file = fileInput.files[i];
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
        // clear fileinput after uploading picture
        this.fileInput.nativeElement.value = '';
    }

    render(file, src, other): void {
        EXIF.getData(file, function () {
            // get the Orientation of picture.
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
                    other.translate.get('app.blog.message.error.pictureTooLarge').subscribe(message => {
                        other.util.presentModal(message);
                    });
                    return false;
                }
                other.zone.run(() => {
                    let base64 = canvas.toDataURL('image/jpeg', quality);
                    other.pictureCount = other.pictureCount + 1;
                    other.picture = {
                        'pictureName': other.pictureName + other.pictureCount.toString(),
                        'pictureSrc': base64
                    };
                    other.pictures.push(other.picture);
                });
            };
            image.src = src;
        });
    }

    getRealContent(): string {
        let content = this.util.replaceHtmlTagCharacter(this.comment.content);
        for (let i = 0; i < this.pictures.length; i++) {
            content = content + '<img src=\"' + this.pictures[i].pictureSrc + '\" />';
        }
        return content;
    }

    deletePicture(picture): void {
        let index = this.pictures.indexOf(picture, 0);
        if (index > -1) {
            this.pictures.splice(index, 1);
        }
    }
}
