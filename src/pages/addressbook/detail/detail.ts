// Third party library.
import {Component} from '@angular/core';
import {NavParams,ActionSheetController,AlertController} from 'ionic-angular';
import {Contacts,Contact, ContactField, ContactName} from 'ionic-native';
import {addressBookService} from '../../../providers/addressbook-service';
import { TranslateModule, TranslateLoader,TranslateService} from '@ngx-translate/core';
import {AppConfig} from '../../../app/app.config';

@Component({
    selector: 'page-detail',
    templateUrl: 'detail.html',
    providers: [
        addressBookService,
        AppConfig
    ]
})
export class AddressBookDetailPage {
    private employeeInfo:any={
        employeeCd:"",
        employeeNm:"",
        companyNm:"",
        departmentNm:"",
        email:"",
        mobilePhoneNo:"",
        photo:this.appConfig.get('USER_DEFAULT_AVATAR_IMAGE_URL')
    }

    private isLoadCompleted: boolean;
    constructor(private params: NavParams,
        private addressBookService: addressBookService,
        private actionSheetCtrl: ActionSheetController,
        private translate: TranslateService,
        private appConfig:AppConfig,
        private alertCtrl: AlertController
    ) {
        this.employeeInfo.employeeCd = this.params.get('employeeCd');
        this.getAddressBookDetail();
    }
    public getAddressBookDetail(): void {
        this.addressBookService.getAddressBookDetail(this.employeeInfo.employeeCd).then((data: any) => {
            let baseData = data;
            this.addressBookService.getUserDetails(this.employeeInfo.employeeCd).then(cordysData => {
                this.employeeInfo.photo = cordysData.userAvatar;
                this.employeeInfo.employeeNm = baseData.employeeNm;
                this.employeeInfo.companyNm = baseData.companyNm;
                this.employeeInfo.departmentNm = baseData.departmentNm;
                this.employeeInfo.email = baseData.email;
                this.employeeInfo.mobilePhoneNo = baseData.mobilePhoneNo;
                this.isLoadCompleted = true;
            })
        });
    }
    public addAddressBookToMobile(){
        let myContact:Contact  = Contacts.create();
        myContact.name = new ContactName(null, this.employeeInfo.employeeNm, null);
        myContact.phoneNumbers = [new ContactField('mobile', this.employeeInfo.mobilePhoneNo)];

        myContact.save().then(
            () => {
                this.translate.get(['app.addressBook.saveSuccess']).subscribe(message => {
                    this.alertPresent("成功",message['app.addressBook.saveSuccess'])
                })
            },
            (error: any) => {
                this.alertPresent("失败",error)
            }
        );
    }
    public popPhoneAction(){
        let actionSheet = this.actionSheetCtrl.create({
            title:"你可以",
            buttons:[
                {
                    text:"呼叫",
                    handler: () => {
                        window.open('tel:' + this.employeeInfo.mobilePhoneNo);
                    }
                },
                {
                    text:"添加到手机通讯录",
                    handler: () => {
                        this.addAddressBookToMobile();
                    }
                }
            ]
        })
        actionSheet.present();
    }
    private alertPresent(title:string,content:string){
        let alert = this.alertCtrl.create({
            title: title,
            subTitle: content,
            buttons: [{
                text: "OK",
            }]
        });
        alert.present();

    }
}