/**
 * Created by linguanyu on 2017/02/20.
 */
import {Injectable} from '@angular/core';

// Config.
import {AppConfig} from '../app/app.config';

// Utils
import {Util} from '../utils/util';
@Injectable()
export class addressBookService{
    private userDefaultAvatarImageUrl: string;
    constructor(private util: Util, private appConfig: AppConfig){
        this.userDefaultAvatarImageUrl = this.appConfig.get('USER_DEFAULT_AVATAR_IMAGE_URL');
    }

    public getAddressBookList(companyCd:string,employeeNm:string):any{
       
        return new Promise(resolve => {
            this.util.getRequestXml('assets/requests/addressbook/getAddressBookInfomation.xml').then((req:string)=>{
              
                let requestXml = this.util.parseXml(req);
                let paraNode = this.util.selectXMLNode(requestXml,'.//*[local-name()=\'SearPara\']');
                this.util.setNodeText(paraNode, './/*[local-name()=\'companyCd\']', companyCd);
                this.util.setNodeText(paraNode, './/*[local-name()=\'employeeNm\']', employeeNm);
                let request = this.util.xml2string(requestXml);
                this.util.callCordysWebservice(request).then((data:string)=>{
                   
                    let responseXml = this.util.parseXml(data);
                    let AddressBookOutput = this.util.selectXMLNodes(responseXml,'.//*[local-name()=\'AddressBookOutput\']');
                    let addressBookList = new Array();
                    for(let i=0;i<AddressBookOutput.length;i++){
                        let addressBook = this.util.xml2json(AddressBookOutput[i]).AddressBookOutput;
                        addressBookList.push(addressBook);
                    }
                    let returnValue = new Array();
                    let returnArr = new Array();
                    this.getCompanyInfo().then((companies:any)=>{
                        for(let j=0;j<companies.length;j++){
                            returnValue.push(companies[j].companyNm);
                        }
                        for(let n=0;n<returnValue.length;n++){
                            let companyA = returnValue[n];
                            let tempArr = new Array();
                            let dataTemp:any = new Object();

                            dataTemp[companyA] =new Array();
                            for(let m=0; m<addressBookList.length;m++){
                                let companyB = addressBookList[m].companyNm;
                                if(companyA == companyB){
                                    tempArr.push(addressBookList[m]);
                                }
                            }
                            dataTemp[companyA] = tempArr;
                            returnArr.push(dataTemp);
                        }
                        resolve(returnArr);
                    })

                })
            })
        })
    }
    public getCompanyInfo():any{

        return new Promise(resolve => {
           
            let request = "<SOAP:Envelope xmlns:SOAP='http://schemas.xmlsoap.org/soap/envelope/'> "+"<SOAP:Body> "+"<GetCompanyList xmlns='http://schemas.intasect.co.jp/addressbook/service/SearchAddressBook' preserveSpace='no' qAccess='0' qValues='' /> "+"</SOAP:Body> "+" </SOAP:Envelope> ";
            this.util.callCordysWebservice(request).then((data:string)=>{
             
                let responseXml = this.util.parseXml(data);
                let CompanyList = this.util.selectXMLNodes(responseXml,'.//*[local-name()=\'CompanyList\']');
                let companies = new Array();
                for(let i=0;i<CompanyList.length;i++){
                    let company = this.util.xml2json(CompanyList[i]).CompanyList;
                    companies.push(company);
                }
                resolve(companies);
            })
        })
    }
    getAddressBookDetail(employeeCd: string): Promise<any> {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/addressbook/get_addressbook_detail.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'employeeCd\']', employeeCd);
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let addressBookOutput = this.util.selectXMLNode(objResponse, './/*[local-name()=\'AddressBookOutput\']');
                    let addressBook = this.util.xml2json(addressBookOutput).AddressBookOutput;
                    if (!addressBook.createUserAvatar || addressBook.createUserAvatar.toString().indexOf('data:image') !== 0) {
                        addressBook.createUserAvatar = this.userDefaultAvatarImageUrl;
                    }
                    resolve(addressBook);
                });
            });
        });
    }
    getUserDetails(userName:string): Promise<any> {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/addressbook/get_user_details.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'UserName\']', userName);
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let userOutput = this.util.selectXMLNode(objResponse, './/*[local-name()=\'User\']');
                    let originalUser = this.util.xml2json(userOutput).User;
                    let userAvatar = originalUser.ContactInformation.address;
                    if (!userAvatar) {
                        userAvatar = this.appConfig.get('USER_DEFAULT_AVATAR_IMAGE_URL');
                    }
                    let user = {
                        'userID': originalUser.UserName,
                        'userName': originalUser.Description,
                        'email': originalUser.ContactInformation.email,
                        'phone': originalUser.ContactInformation.phone,
                        'fax': originalUser.ContactInformation.fax,
                        'userAvatar': userAvatar,
                        'company': originalUser.ContactInformation.company
                    };
                    resolve(user);
                });
            });
        });
    }
}


