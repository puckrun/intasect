import {Injectable} from '@angular/core';

@Injectable()
export class AppConfig {
    private config: any = {
        'IS_TABLET': false,
        'IS_JAPAN_SERVER': true,
        'IS_CHINA_SERVER': false,
        'BASE_URL': 'https://iscsys.intasect.co.jp/home/InternalSystem/',
        'BASE_URL_JAPAN': 'https://iscsys.intasect.co.jp/home/InternalSystem/',
        'BASE_URL_CHINA': 'http://test.intalinx.cn/home/intalinxcloud/', 
       /*  'BASE_URL_CHINA': 'http://192.168.50.68/home/AddressBook/', */
        'BIZNAVI_URL_JAPAN': 'https://iscsys.intasect.co.jp/biznavi/#/todo/1',
        'BIZNAVI_URL_CHINA': 'http://www.intalinx.cn/biznavi/#/todo/1',
        'DOWNLOAD_GATEWAY_URL': 'com.eibus.web.tools.download.Download.wcp',
        'GATEWAY_URL': 'com.eibus.web.soap.Gateway.wcp',
        'PRE_LOGIN_INFO_URL': 'com.eibus.sso.web.authentication.PreLoginInfo.wcp',
        'SAMLART_NAME': 'SAMLart',
        'SAML_ARTIFACT_STORAGE_NAME_JAPAN': 'production_SAMLart',
        'SAML_ARTIFACT_STORAGE_NAME_CHINA': 'defaultinst_SAMLart',
        'SAML_NOT_ON_AFTER_STORAGE_NAME': 'notOnAfter',
        'AUTO_LOGIN_STORAGE_NAME': 'autoLogin',
        'LOGIN_ID_STORAGE_NAME': 'loginID',
        'PASSWORD_STORAGE_NAME': 'password',
        'SERVER_STORAGE_NAME': 'server',
        'USER_DEFAULT_AVATAR_IMAGE_URL': 'assets/img/default',
        'VERSION_URL_JAPAN' : 'https://intasect.github.io/version.json',
        'VERSION_URL_CHINA' : 'https://intalinx.oschina.io/version.json',
        'DOWNLOAD_URL_JAPAN' : 'https://intasect.github.io',
        'DOWNLOAD_URL_CHINA' : 'https://intalinx.oschina.io',
        'USER_LANG': 'en-US',
        'GOOGLE_ANALYTICS_TRACK_ID': 'UA-81438804-1',
        'GOOGLE_ANALYTICS_TRACK_ID_JAPAN': 'UA-81438804-1',
        'GOOGLE_ANALYTICS_TRACK_ID_CHINA': 'UA-81699991-1',
        'DATETIME_YEAR_MONTH_DAY_MIN': '2014-01-01',
        'DATETIME_YEAR_MONTH_DAY_MAX': '2020-12-31',
        'DATETIME_MINUTE_VALUES': '00, 15, 30, 45'
    };
    get(key: string): any {
        return this.config[key];
    }
    set(key: string, value: any): void {
        this.config[key] = value;
    }
}