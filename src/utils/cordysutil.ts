// Third party library.
import {Injectable} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Config.
import {AppConfig} from '../app/app.config';

// Utils.
import {AlertUtil} from './alertutil';
import {DateUtil} from './dateutil';
import {XmlUtil} from './xmlutil';
import {StorageUtil} from './storageutil';

// Services.
import {ShareService} from '../providers/share-service';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class CordysUtil {
    constants: any = {
        GATEWAY_URL: 'com.eibus.web.soap.Gateway.wcp',
        PRE_LOGIN_INFO_URL: 'com.eibus.sso.web.authentication.PreLoginInfo.wcp',
        SAMLART_NAME: 'SAMLart',
        CLIENT_ATTRIBUTES_SCHEMA_NAMESPACE: 'http://schemas.cordys.com/General/ClientAttributes/',
        SOAP_NAMESPACE: 'http://schemas.xmlsoap.org/soap/envelope/',
        I18N_NAMESPACE: 'http://www.w3.org/2005/09/ws-i18n',
        CORDSY_NAMESPACE: 'http://schemas.cordys.com/General/1.0/',
        WSSE_NAMESPACE: 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd',
        WSU_NAMESPACE: 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd',
        SAMLPROTOCOL_NAMESPACE: 'urn:oasis:names:tc:SAML:1.0:protocol',
        SAML_NAMESPACE: 'urn:oasis:names:tc:SAML:1.0:assertion',
        ARTIFACT_UNBOUND_MESSAGE_CODE: 'Cordys.WebGateway.Messages.WG_Artifact_Unbound'
    };

    constructor(private http: HttpClient, private translate: TranslateService, private appConfig: AppConfig, private xmlUtil: XmlUtil, private alertUtil: AlertUtil, private dateUtil: DateUtil, private storageUtil: StorageUtil, private share: ShareService) {
    }

    getRequestXml(url: string) {
        return new Promise(resolve => {
            this.http.get(url, { headers: new HttpHeaders({ 'Accept': 'application/xml' }), responseType: 'text' })
                .subscribe(data => {
                    resolve(data);
                });
        });
    }

    callCordysWebserviceUseAnonymous(request: any) {
        let useAnonymous = true;
        return this.callCordysWebserviceUseAnonymousShowError(request, useAnonymous);
    }

    callCordysWebserviceUseAnonymousShowError(request: any, useAnonymous: boolean) {
        let hideError = false;
        return this.callCordysWebservice(request, hideError, useAnonymous);
    }

    callCordysWebservice(request: any, hideError: boolean = false, useAnonymous: boolean = false) {
      
        return new Promise((resolve, reject) => {
            if (useAnonymous) {
             
                this.getCallCordysWebserviceURL(useAnonymous).then((url: string) => {
                    this.http.post(url, request, { headers: new HttpHeaders({ 'Accept': 'application/xml' }), responseType: 'text' })
                        .subscribe(data => {
                            resolve(data);
                        }, error => {
                            if (error.status === 500 && error.type === 2) {
                                if (!hideError) {
                                    let responseText = error.error;
                                    let responseNode = this.xmlUtil.parseXML(responseText);
                                    this.alertUtil.presentModal(this.xmlUtil.getNodeText(responseNode, './/*[local-name()=\'faultstring\']'));
                                }
                            } else {
                                this.alertUtil.presentSystemErrorModal();
                            }
                            reject(error);
                        });
                });
            } else {
                this.loggedOn().then((result: boolean) => {
                    if (!result) {
                        // redirect to Login page.
                        this.share.redirectLoginPage();
                        // TODO
                        reject(false);
                    }
                }).then(() => {
                    return this.getCallCordysWebserviceURL(useAnonymous);
                }).then((url: string) => {
                    this.http.post(url, request, { headers: new HttpHeaders({ 'Accept': 'application/xml' }), responseType: 'text' })
                        .subscribe(data => {
                            resolve(data);
                        }, error => {
                            if (error.status === 500 && error.type === 2) {
                                let responseText = error.error;
                                let responseNode = this.xmlUtil.parseXML(responseText);
                                let messageCode = this.xmlUtil.getNodeText(responseNode, './/*[local-name()=\'MessageCode\']');
                                // when samlart became invalid
                                if (this.constants.ARTIFACT_UNBOUND_MESSAGE_CODE === messageCode) {
                                    // 1. remove samlart
                                    this.removeSAMLart().then(() => {
                                        // 2. try to login again
                                        return this.loggedOn();
                                    }).then((reLoginResult: boolean) => {
                                        // 3. if login success, call webservice again
                                        if (reLoginResult) {
                                            this.callCordysWebservice(request, hideError, useAnonymous).then((data: any) => {
                                                resolve(data);
                                            });
                                        } else {
                                            // 4. login faild, remove stored password and redirect to login
                                            this.removePassword();
                                            this.share.redirectLoginPage().then(() => {
                                                this.translate.get('app.message.error.faildToLogin').subscribe(message => {
                                                    this.alertUtil.presentModal(message);
                                                });
                                            });
                                            reject(error);
                                        }
                                    });
                                } else if (!hideError) {
                                    // show error                                    
                                    this.alertUtil.presentModal(this.xmlUtil.getNodeText(responseNode, './/*[local-name()=\'faultstring\']'));
                                    // TODO
                                    reject(error);
                                } else {
                                    reject(error);
                                }
                            } else {
                                reject(error);
                            }
                        });
                });
            }
        });
    }

    callCordysWebserviceWithUrl(url, request) {
        return new Promise(resolve => {
            this.http.post(url, request, { headers: new HttpHeaders({ 'Accept': 'application/xml' }), responseType: 'text' })
                .subscribe(data => {
                    resolve(data);
                }, error => {

                });
        });
    }

    getCallCordysWebserviceURL(useAnonymous?: boolean) {
      
        let url = this.appConfig.get('BASE_URL') + this.appConfig.get('GATEWAY_URL');
        if (!useAnonymous) {
            return this.getSAMLart().then((samlart: string) => {
                url = url + '?' + this.appConfig.get('SAMLART_NAME') + '=' + samlart;
                url = url + '&language=' + this.appConfig.get('USER_LANG');
                return url;
            });
        } else {
            url = url + '?language=' + this.appConfig.get('USER_LANG');
            return Promise.resolve(url);
        }
    }

    authenticate(userId, password): Promise<boolean> {
        if (!userId || !password) {
            return Promise.resolve(false);
        } else {
            return new Promise(resolve => {
                this.getRequestXml('./assets/requests/saml_assertion_request.xml').then((req: string) => {

                    let samlRequest = this.xmlUtil.parseXML(req);
                    this.xmlUtil.setXMLNamespaces(samlRequest, {
                        'SOAP': this.constants.SOAP_NAMESPACE,
                        'wsse': this.constants.WSSE_NAMESPACE,
                        'wsu': this.constants.WSU_NAMESPACE,
                        'samlp': this.constants.SAMLPROTOCOL_NAMESPACE,
                        'saml': this.constants.SAML_NAMESPACE
                    });

                    let createRequestID = function () {
                        // wdk XXX: use guid generator?
                        let gid = 'a'; // XML validation requires that the request ID does not start with a number
                        for (let i = 0; i < 32; i++) {
                            gid += Math.floor(Math.random() * 0xF).toString(0xF) + (i === 8 || i === 12 || i === 16 || i === 20 ? '-' : '');
                        }
                        return gid;
                    };

                    // set RequestID, IssueInstant and NameIdentifier
                    this.xmlUtil.selectXMLNode(samlRequest, 'SOAP:Envelope/SOAP:Body/samlp:Request').setAttribute('RequestID', createRequestID());
                    this.xmlUtil.selectXMLNode(samlRequest, 'SOAP:Envelope/SOAP:Body/samlp:Request').setAttribute('IssueInstant', this.dateUtil.getUTCDate());
                    this.xmlUtil.setNodeText(samlRequest, './/saml:NameIdentifier', userId);

                    // Remove security node if no wsse username is used 
                    if (password == null) password = '';

                    this.xmlUtil.setNodeText(samlRequest, './/wsse:Username', userId);
                    this.xmlUtil.setNodeText(samlRequest, './/wsse:Password', password);

                    req = this.xmlUtil.xml2string(samlRequest);

                    let hideError = true;
                    let useAnonymous = true;
                    this.callCordysWebservice(req, hideError, useAnonymous).then((data: string) => {
                        let samlResponse = this.xmlUtil.parseXML(data);
                        this.xmlUtil.setXMLNamespaces(samlResponse, {
                            'SOAP': this.constants.SOAP_NAMESPACE,
                            'wsse': this.constants.WSSE_NAMESPACE,
                            'wsu': this.constants.WSU_NAMESPACE,
                            'samlp': this.constants.SAMLPROTOCOL_NAMESPACE,
                            'saml': this.constants.SAML_NAMESPACE
                        });

                        let assertions = this.xmlUtil.selectXMLNode(samlResponse, './/saml:Assertion');
                        let authenticationResult = false;
                        let samlArtifact;
                        let notOnOrAfterDate;
                        if (assertions != null) {
                            samlArtifact = this.xmlUtil.getNodeText(samlResponse, './/samlp:AssertionArtifact', null);
                            if (samlArtifact) {
                                let notOnOrAfterString = this.xmlUtil.getNodeText(samlResponse, './/saml:Conditions/@NotOnOrAfter', null);
                                if (notOnOrAfterString) {
                                    notOnOrAfterDate = this.dateUtil.transferCordysDateStringToUTC(notOnOrAfterString);
                                    authenticationResult = true;
                                }
                                /*
                                if (sso.useSamlUrlArtifact){
                                    system.parameters[SAMLART_NAME] = artifact;
                                }
                                */
                            }
                        }
                        if (authenticationResult) {
                            this.setSAMLart(samlArtifact, notOnOrAfterDate).then(() => {
                                resolve(true);
                            });
                        } else {
                            resolve(false);
                        }
                    }, (error: any) => {
                        resolve(false);
                    });
                });
            });
        }
    }

    loggedOn(): Promise<boolean> {
        return this.getSAMLart().then((samlart: string) => {
                let isLoggedOn = false;
                isLoggedOn = (samlart !== null && samlart !== '' && samlart !== 'null');
                if (!isLoggedOn) {
                    return this.isAutoLogin().then((isAutoLogin: boolean) => {
                        if (isAutoLogin) {
                           return Promise.all([this.getLoginID(), this.getPassword(), this.getServer()]).then((values: any) => {
                                return this.authenticate(values[0], values[1]);
                            });
                        } else {
                            return Promise.resolve(false);
                        }
                    });
                } else {
                    return Promise.resolve(true);
                }
            });
    }

    logout() {
        return Promise.all([
            this.disableAutoLogin(),
            this.removeLoginID(),
            this.removePassword(),
            this.removeSAMLart()
        ]);
    }

    enableAutoLogin(loginID, password, server) {
        return Promise.all([
            this.storageUtil.set(this.appConfig.get('AUTO_LOGIN_STORAGE_NAME'), true),
            this.setLoginID(loginID),
            this.setPassword(password),
            this.setServer(server)
        ]);
    }

    disableAutoLogin() {
        return this.storageUtil.remove(this.appConfig.get('AUTO_LOGIN_STORAGE_NAME'));
    }

    isAutoLogin(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.storageUtil.get(this.appConfig.get('AUTO_LOGIN_STORAGE_NAME')).then((result: boolean) => {
                if (result) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });    
    }

    setLoginID(value) {
        return this.storageUtil.set(this.appConfig.get('LOGIN_ID_STORAGE_NAME'), value);
    }

    setPassword(value) {
        return this.storageUtil.set(this.appConfig.get('PASSWORD_STORAGE_NAME'), value);
    }

    setServer(value) {
        this.appConfig.set('BASE_URL', value);
        return this.storageUtil.set(this.appConfig.get('SERVER_STORAGE_NAME'), value);
    }

    getLoginID() {
        return this.storageUtil.get(this.appConfig.get('LOGIN_ID_STORAGE_NAME'));
    }

    getPassword() {
        return this.storageUtil.get(this.appConfig.get('PASSWORD_STORAGE_NAME'));
    }

    getServer() {
        return this.storageUtil.get(this.appConfig.get('SERVER_STORAGE_NAME')).then(value => {
            this.appConfig.set('BASE_URL', value);
            return value;
        });
    }

    removeLoginID() {
        return this.storageUtil.remove(this.appConfig.get('LOGIN_ID_STORAGE_NAME'));
    }

    removePassword() {
        return this.storageUtil.remove(this.appConfig.get('PASSWORD_STORAGE_NAME'));
    }

    removeServer() {
        return this.storageUtil.remove(this.appConfig.get('SERVER_STORAGE_NAME'));
    }

    setSAMLart(value, notOnOrAfter) {
        let p1 = this.storageUtil.set(this.appConfig.get('SAML_ARTIFACT_STORAGE_NAME'), value);
        let p2 = this.storageUtil.set(this.appConfig.get('SAML_NOT_ON_AFTER_STORAGE_NAME'), notOnOrAfter);
        return Promise.all([p1, p2]);
    }

    getSAMLart(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.hasSAMLart().then((result: boolean) => {
                if (result) {
                    this.storageUtil.get(this.appConfig.get('SAML_ARTIFACT_STORAGE_NAME')).then((samlArtifact: any) => {
                        resolve(samlArtifact);
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }

    getSAMLartExpireDate(): Promise<any> {
        return this.storageUtil.get(this.appConfig.get('SAML_NOT_ON_AFTER_STORAGE_NAME'));
    }

    removeSAMLart(): Promise<boolean> {
        let p1 = this.storageUtil.remove(this.appConfig.get('SAML_ARTIFACT_STORAGE_NAME'));
        let p2 = this.storageUtil.remove(this.appConfig.get('SAML_NOT_ON_AFTER_STORAGE_NAME'));
        return Promise.all([p1, p2]).then(() => {
            return true;
        });
    }

    hasSAMLart(): Promise<boolean> {
        return this.getSAMLartExpireDate().then((expireDate: any) => {
            if (!expireDate || new Date(expireDate) < new Date()) {
                this.removeSAMLart();
                return Promise.resolve(false);
            } else {
                return Promise.resolve(true);
            }
        });
    }
}