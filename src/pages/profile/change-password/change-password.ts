// Third party library.
import {Component} from '@angular/core';
import {NavController, ViewController} from 'ionic-angular';
// import {NgForm} from '@angular/common';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {UserService} from '../../../providers/user-service';

@Component({
    selector: 'page-profile-change-password',
    templateUrl: 'change-password.html',
    providers: [
        UserService,
        Util
    ]
})
export class ChangePasswordPage {
    public user: any;
    public isDisabled: boolean = true;

    constructor(private nav: NavController,
        private view: ViewController,
        private util: Util,
        private userService: UserService) {

        this.user = {
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        };
    }

    updateProfile(profileForm) {
        this.isDisabled = true;
        this.userService.updateProfile(this.user).then(data => {
            if (data === true) {
                // refresh password in storage.
                this.util.isAutoLogin().then((isAutoLogin: boolean) => {
                    if (isAutoLogin) {
                        this.util.setPassword(this.user.confirmPassword);
                    }
                });
                this.nav.pop();
            }
        });
    }

    changePassword() {
        if (this.user.oldPassword && this.user.newPassword && this.user.confirmPassword) {
            this.isDisabled = null;
        } else {
            this.isDisabled = true;
        }
    }
}