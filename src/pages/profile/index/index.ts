// Third party library.
import {Component} from '@angular/core';
import {NavController, ViewController, Platform} from 'ionic-angular';
// Config.
import {AppConfig} from '../../../app/app.config';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {UserService} from '../../../providers/user-service';
import {ShareService} from '../../../providers/share-service';

// Pages
import {ChangePasswordPage} from '../change-password/change-password';
import {ChangeAvatarPage} from '../change-avatar/change-avatar';

@Component({
    selector: 'page-profile-index',
    templateUrl: 'index.html',
    providers: [
        UserService,
        Util
    ]
})
export class ProfileIndexPage {
    public userDefaultAvatarImageUrl: string;
    public user: any;
    public isLoadCompleted: boolean;

    constructor(private nav: NavController,
        private view: ViewController,
        private platform: Platform,
        private appConfig: AppConfig,
        private userService: UserService,
        private share: ShareService) {
        this.userDefaultAvatarImageUrl = this.appConfig.get('USER_DEFAULT_AVATAR_IMAGE_URL');

        this.user = {
            'userAvatar': this.userDefaultAvatarImageUrl
        };
    }

    ionViewWillEnter() {
        this.isLoadCompleted = false;
        this.userService.getUserDetails().then(data => {
            this.user = data;
            this.isLoadCompleted = true;
        });
    }

    openChangeAvatar(user: any) {
        this.nav.push(ChangeAvatarPage, {
            'user': user
        });
    }

    openChangePassword() {
        this.nav.push(ChangePasswordPage);
    }
}
