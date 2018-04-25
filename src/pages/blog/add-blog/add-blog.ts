// Third party library.
import {ViewChild, Component, NgZone, ElementRef} from '@angular/core';
import {NavController, ModalController, LoadingController, NavParams} from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

/// <reference path="./exif-ts/exif.d.ts" />
import * as EXIF from 'exif-ts/exif';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {BlogService} from '../../../providers/blog-service';
import {UserService} from '../../../providers/user-service';

// Pages.
import {PreviewBlogPage} from '../preview-blog/preview-blog';
import {SelectUsersPage} from '../../../shared/components/select-users/select-users';

@Component({
  selector: 'page-blog-add-blog',
  templateUrl: 'add-blog.html',
  providers: [
    BlogService,
    UserService,
    Util,
    SelectUsersPage
  ]
})
export class AddBlogPage {
  @ViewChild('fileInput') fileInput: ElementRef;
  public loading: any;
  public sendData: any;
  public isDisabled: boolean = true;
  public pictureName: string = 'picture';
  public pictureCount: number = 0;
  public allUsersType: string;
  public selectUsersType: string;
  public blog: any = {
    'title': '',
    'selectedUsers': [],
    'allMemberFlag': 'TRUE',
    'content': ''
  };
  public picture: any;
  public pictures: any = new Array();
  public readLimit = {
    'readLimitType': 'allUsers',
    'readLimitTypeName': ''
  };
  public sendDataToSelectReadLimitTypePage: any = {
    'isSelected': false,
    'readLimit': '',
    'selectedUsers': []
  };

  constructor(private nav: NavController,
    private params: NavParams,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private zone: NgZone,
    private blogService: BlogService,
    private translate: TranslateService,
    private userService: UserService,
    private util: Util) {

    this.sendData = this.params.get('sendData');
    this.sendDataToSelectReadLimitTypePage.selectedUsers.push(this.userService.getUser());
    this.getMultiMessageOfReadLimitTypeName();
  }

  getMultiMessageOfReadLimitTypeName(): void {
    this.translate.get(['app.common.readLimitType.allUsers', 'app.common.readLimitType.selectUsers']).subscribe(message => {
      this.allUsersType = message['app.common.readLimitType.allUsers'];
      this.selectUsersType = message['app.common.readLimitType.selectUsers'];
      this.readLimit.readLimitTypeName = this.allUsersType;
    });
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

  previewBlog(): void {
    let content = this.getRealContent();
    let previewBlog: any = {
      'title': this.blog.title,
      'selectedUsers': this.blog.selectedUsers,
      'content': content
    };
    let previewModal = this.modalCtrl.create(PreviewBlogPage, { 'previewBlog': previewBlog });
    previewModal.present();
  }

  saveBlog(): void {
    this.translate.get(['app.blog.isSaving']).subscribe(message => {
      let content = message['app.blog.isSaving'];
      this.loading = this.loadingCtrl.create({
        spinner: 'ios',
        content: content
      });
      this.loading.present();
    });
    this.isDisabled = true;
    let content = this.getRealContent();
    let saveBlog: any = {
      'title': this.blog.title,
      'selectedUsers': this.blog.selectedUsers,
      'content': content,
      'allMemberFlag': this.blog.allMemberFlag,
      'actionFlag': 'PUBLISH'
    };
    // this.saveBlog.selectedUsers.push();
    this.blogService.insertCommunity(saveBlog).then(data => {
      if (data === 'true') {
        this.sendData.isRefreshFlag = true;
        this.loading.dismiss();
        setTimeout(() => {
          this.nav.pop();
        }, 500);
        this.util.googleAnalyticsTrackEvent('Blog', 'add', 'blog');
      }
    });
  }

  getRealContent(): string {
    let content = this.util.replaceHtmlTagCharacter(this.blog.content);
    for (let i = 0; i < this.pictures.length; i++) {
      content = content + '<img src=\"' + this.pictures[i].pictureSrc + '\" />';
    }
    return content;
  }

  selectReadLimitType(): void {
    this.sendDataToSelectReadLimitTypePage.readLimit = this.readLimit;
    this.nav.push(SelectReadLimitTypePage, { 'sendDataToSelectReadLimitTypePage': this.sendDataToSelectReadLimitTypePage });
  }

  changeBlog(): void {
    if (this.blog.title && this.blog.content && (this.blog.allMemberFlag === 'TRUE' || this.sendDataToSelectReadLimitTypePage.selectedUsers.length > 0)) {
      this.isDisabled = null;
    } else {
      this.isDisabled = true;
    }
  }

  deletePicture(picture): void {
    let index = this.pictures.indexOf(picture, 0);
    if (index > -1) {
      this.pictures.splice(index, 1);
    }
  }

  ionViewWillEnter(): void {
    if (this.sendDataToSelectReadLimitTypePage.isSelected) {
      this.readLimit = this.sendDataToSelectReadLimitTypePage.readLimit;
      if (this.readLimit.readLimitType === 'selectUsers') {
        this.blog.allMemberFlag = 'FALSE';
        this.readLimit.readLimitTypeName = this.selectUsersType;
        this.blog.selectedUsers = this.sendDataToSelectReadLimitTypePage.selectedUsers;
      } else {
        this.blog.allMemberFlag = 'TRUE';
        this.readLimit.readLimitTypeName = this.allUsersType;
      }
    }
  }
}

@Component({
  template: `
  <ion-header>
    <ion-navbar>
      <ion-title>{{"app.common.setReadLimitType" | translate}}</ion-title>
      <ion-buttons end>
          <button ion-button (click)="setReadLimitType()">{{ "app.action.finish" | translate }}</button>
      </ion-buttons>
      </ion-navbar>
  </ion-header>
  <ion-content class="select-read-limit-type">
      <ion-list radio-group [(ngModel)]="readLimitType" (ionChange)="changeReadLimit()">
        <ion-item>
          <ion-label>{{"app.common.readLimitType.allUsers" | translate}}</ion-label>
          <ion-radio value="allUsers"></ion-radio>
        </ion-item>
        <button ion-item>
          <ion-label>{{"app.common.readLimitType.selectUsers" | translate}}<span [hidden]="readLimitType=='allUsers' || !selectedUsers">{{selectedUsers.length}}{{"app.common.person" | translate}}</span></ion-label>
          <ion-radio value="selectUsers">
          </ion-radio>
        </button>
      </ion-list>
      <ion-item [hidden]="readLimitType=='allUsers'">
        <h2>{{"app.common.selectedUserNames" | translate}}</h2>
        <div class="selected-users" *ngFor="let selectedUser of selectedUsers">{{selectedUser.userName}}</div>
      </ion-item>
    </ion-content>
  `
})
export class SelectReadLimitTypePage {
  public allUsersType: string;
  public selectUsersType: string;
  public readLimitType: string = '';
  public readLimitTypeName: string = '';
  public selectedUsers: any = [];
  public sendDataToSelectReadLimitTypePage: any;
  public isFirstTimeEnterPage: boolean = true;
  constructor(public nav: NavController, public params: NavParams, public modalCtrl: ModalController, public translate: TranslateService, public util: Util) {
    this.sendDataToSelectReadLimitTypePage = this.params.get('sendDataToSelectReadLimitTypePage');
    this.readLimitType = this.sendDataToSelectReadLimitTypePage.readLimit.readLimitType;
    this.selectedUsers = this.sendDataToSelectReadLimitTypePage.selectedUsers;
    this.sendDataToSelectReadLimitTypePage.isSelected = false;
  }

  setReadLimitType(): void {
    if (this.readLimitType === 'selectUsers' && (!this.selectedUsers || this.selectedUsers.length <= 0)) {
      this.translate.get('app.common.message.noUserSelected').subscribe(message => {
        this.util.presentModal(message);
      });
    } else {
      this.sendDataToSelectReadLimitTypePage.isSelected = true;
      this.sendDataToSelectReadLimitTypePage.readLimit.readLimitType = this.readLimitType;
      this.sendDataToSelectReadLimitTypePage.readLimit.readLimitTypeName = this.readLimitTypeName;
      this.sendDataToSelectReadLimitTypePage.selectedUsers = this.selectedUsers;
      this.nav.pop();
    }
  }

  changeReadLimit(): void {
    if (!this.isFirstTimeEnterPage) {
      if (this.readLimitType === 'selectUsers') {
        this.readLimitTypeName = this.selectUsersType;
        this.chooseUsers();
      } else {
        this.readLimitTypeName = this.allUsersType;
        this.selectedUsers = this.sendDataToSelectReadLimitTypePage.selectedUsers;
      }
    }
    this.isFirstTimeEnterPage = false;
  }

  chooseUsers(): void {
    this.translate.get('app.common.selectReaders').subscribe(message => {
      let sendDataToSelectUsers = {
        'title': message,
        'selectedUsers': this.selectedUsers,
        'systemName': 'blog'
      };
      let selectUsersModal = this.modalCtrl.create(SelectUsersPage, { 'sendDataToSelectUsers': sendDataToSelectUsers });
      selectUsersModal.onDidDismiss(data => {
        this.selectedUsers = data;
      });
      selectUsersModal.present();
    });
  }

  getMultiMessageOfReadLimitTypeName(): void {
    this.translate.get(['app.common.readLimitType.allUsers', 'app.common.readLimitType.selectUsers']).subscribe(message => {
      this.allUsersType = message['app.common.readLimitType.allUsers'];
      this.selectUsersType = message['app.common.readLimitType.selectUsers'];
    });
  }
}