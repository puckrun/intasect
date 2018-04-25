import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { BrowserModule } from '@angular/platform-browser';
// import { CloudSettings, CloudModule } from '@ionic/cloud-angular';
import { IonicStorageModule } from '@ionic/storage';
import { MyApp } from './app.component';

import { Util } from '../utils/util';
import { CordysUtil } from '../utils/cordysutil';
import { XmlUtil } from '../utils/xmlutil';
import { AlertUtil } from '../utils/alertutil';
import { DateUtil } from '../utils/dateutil';
import { StorageUtil } from '../utils/storageutil';
import { AppConfig } from './app.config';
import { ShareService } from '../providers/share-service';
import { SurveyService } from '../providers/survey-service';

import { LoginPage } from '../pages/login/login';
import { PortalPage } from '../pages/portal/portal';
import { InfoPage } from '../pages/info/info';
import { BlogIndexPage } from '../pages/blog/index/index';
import { AddBlogPage } from '../pages/blog/add-blog/add-blog';
import { PreviewBlogPage } from '../pages/blog/preview-blog/preview-blog';
import { SelectUsersPage } from '../shared/components/select-users/select-users';
import { AddCommentPage } from '../pages/blog/add-comment/add-comment';
import { ImageSlidesPage } from '../shared/components/image-slides/image-slides';
import { BlogDetailPage } from '../pages/blog/detail/detail';
import { NotificationDetailPage } from '../pages/notification/detail/detail';
import { ProfileIndexPage } from '../pages/profile/index/index';
import { NotificationIndexPage } from '../pages/notification/index/index';
import { ScheduleIndexPage } from '../pages/schedule/index/index';
import { AboutPage } from '../pages/about/about';
import { DevicesPage } from '../pages/schedule/devices/devices';
import { ChangePasswordPage } from '../pages/profile/change-password/change-password';
import { ChangeAvatarPage } from '../pages/profile/change-avatar/change-avatar';
import { SelectDevicesPage } from '../pages/schedule/select-devices/select-devices';
import { EditEventPage } from '../pages/schedule/edit-event/edit-event';
import { EventDetailPage } from '../pages/schedule/event-detail/event-detail';
import { SelectUserPage } from '../pages/schedule/select-user/select-user';
import { SurveyDetailPage } from '../pages/survey/detail/detail';
import { SurveyIndexPage } from '../pages/survey/index/index';
import { OptionResultDetailPage } from '../pages/survey/option-result-detail/option-result-detail';
import { SurveyResultPage } from '../pages/survey/result/result';
import { SelectReadLimitTypePage } from '../pages/blog/add-blog/add-blog';
import { addressBookPage } from '../pages/addressbook/index/index';
import { AddressBookDetailPage } from '../pages/addressbook/detail/detail';


import { Badge } from '@ionic-native/badge';
import { AppVersion } from '@ionic-native/app-version';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { StatusBar } from '@ionic-native/status-bar';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { GoogleAnalytics } from '@ionic-native/google-analytics'
import { TranslateModule, TranslateLoader} from '@ngx-translate/core';

import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClientModule, HttpClient } from '@angular/common/http';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

// const cloudSettings: CloudSettings = {
//   'core': {
//     'app_id': '256ee45e'
//   }
// };

@NgModule({
  declarations: [
    MyApp,
    LoginPage,
    PortalPage,
    InfoPage,
    BlogIndexPage,
    AddBlogPage,
    PreviewBlogPage,
    SelectUsersPage,
    AddCommentPage,
    ImageSlidesPage,
    BlogDetailPage,
    NotificationDetailPage,
    ProfileIndexPage,
    NotificationIndexPage,
    ScheduleIndexPage,
    AboutPage,
    DevicesPage,
    ChangePasswordPage,
    ChangeAvatarPage,
    SelectDevicesPage,
    EditEventPage,
    EventDetailPage,
    SelectUserPage,
    SurveyDetailPage,
    SurveyIndexPage,
    OptionResultDetailPage,
    SurveyResultPage,
    SelectReadLimitTypePage,
    addressBookPage,
    AddressBookDetailPage

  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp, {
      tabsHideOnSubPages: true
    }),
    IonicStorageModule.forRoot({
      name: '__intalinx_mobile',
         driverOrder: ['indexeddb', 'sqlite', 'websql']
    }),
 
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
      }
    })
    // CloudModule.forRoot(cloudSettings)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    LoginPage,
    PortalPage,
    InfoPage,
    BlogIndexPage,
    AddBlogPage,
    PreviewBlogPage,
    SelectUsersPage,
    AddCommentPage,
    ImageSlidesPage,
    BlogDetailPage,
    NotificationDetailPage,
    ProfileIndexPage,
    NotificationIndexPage,
    ScheduleIndexPage,
    AboutPage,
    DevicesPage,
    ChangePasswordPage,
    ChangeAvatarPage,
    SelectDevicesPage,
    EditEventPage,
    EventDetailPage,
    SelectUserPage,
    SurveyDetailPage,
    SurveyIndexPage,
    OptionResultDetailPage,
    SurveyResultPage,
    SelectReadLimitTypePage,
    addressBookPage,
    AddressBookDetailPage
  ],
  providers: [
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    Storage,
    {
      provide: ShareService,
      useClass: ShareService,
      deps: [Badge]
    },
    Util,
    CordysUtil,
    XmlUtil,
    AlertUtil,
    DateUtil,
    StorageUtil,
    AppConfig,
    Badge,
    StatusBar,
    AppVersion,
    InAppBrowser,
    ScreenOrientation,
    GoogleAnalytics,
    SurveyService
  ]
})
export class AppModule { }

