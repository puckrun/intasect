// Third party library.
import {Injectable} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {AlertController} from 'ionic-angular';

// Services.
import {ShareService} from '../providers/share-service';

@Injectable()
export class AlertUtil {
    constructor(private translate: TranslateService, private alertCtrl: AlertController, private share: ShareService) {
    }

    presentConfirmModal(content, level = 'error', okHandler?, noHandler?): void {
        this.translate.get(['app.message.' + level + '.title', 'app.action.yes', 'app.action.no']).subscribe(message => {
            let title = message['app.message.' + level + '.title'];
            let yes = message['app.action.yes'];
            let no = message['app.action.no'];

            let alert = this.alertCtrl.create({
                title: title,
                subTitle: content,
                buttons: [{
                    text: yes,
                    handler: okHandler
                },
                    {
                        text: no,
                        handler: noHandler
                    }]
            });
            alert.present();
        });
    }



    presentModal(content, level = 'error'): void {
        this.translate.get(['app.message.' + level + '.title', 'app.action.ok']).subscribe(message => {
            let title = message['app.message.' + level + '.title'];
            let ok = message['app.action.ok'];

            let alert = this.alertCtrl.create({
                title: title,
                subTitle: content,
                buttons: [ok]
            });
            alert.present();
        });
    }

    presentSystemErrorModal(): void {
        if (typeof this.share.alertForSystemError === undefined) {
            this.translate.get(['app.message.error.title', 'app.message.error.systemError', 'app.action.ok']).subscribe(message => {
                let title = message['app.message.error.title'];
                let ok = message['app.action.ok'];
                let content = message['app.message.error.systemError'];

                let alert = this.alertCtrl.create({
                    title: title,
                    subTitle: content,
                    buttons: [
                        {
                            text: ok,
                            handler: data => {
                                this.share.alertForSystemError = undefined;
                            }
                        }
                    ]
                });
                this.share.alertForSystemError = alert;
                alert.present();
            });
        }
    }
}