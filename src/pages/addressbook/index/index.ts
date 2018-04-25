/**
 * Created by linguanyu on 2017/02/15.
 */
import {Component} from   '@angular/core';
import {NavController} from 'ionic-angular';

import {addressBookService} from '../../../providers/addressbook-service';
import {AddressBookDetailPage} from '../detail/detail'
@Component({
    selector: 'page-index',
    templateUrl:'index.html',
    providers:[addressBookService]
})
export class addressBookPage{
    addressBookList :any = new Array();
    companyArr :any = new Array();
    companyArrAll:any = new Array();
    searchParam:string="";
    temp :any="";
    selectedCompany:any="";
    constructor(private addressbookservice:addressBookService,private nav:NavController){
        this.initialize();
    }
    //初始化
    public initialize(){
        this.addressbookservice.getAddressBookList('','').then((data:any)=>{
        
            this.addressBookList = data;
            console.log( this.addressBookList);
            this.getCompanies();
        })
    }
    public getCompanies(){
        this.addressbookservice.getCompanyInfo().then((data:any)=>{
            this.companyArr = data;
            this.companyArrAll = data;
            console.log(this.companyArrAll)

        })
    }
    public getCompanyEmployee(company:string):any {
        let returnValue = new Array();
        for(let i=0;i<this.addressBookList.length;i++){
            if(Object.keys(this.addressBookList[i]).indexOf(company)==0){
                returnValue = this.addressBookList[i][company];
            }
        }
        return returnValue;
    }
    //跳转详细画面
    public openEmployeePage(employee){
      
        this.nav.push(AddressBookDetailPage,{'employeeCd':employee.employeeCd});
    }
    //点击search按钮
    public searchEmployee(){
        let selectValue = this.selectedCompany;
        this.addressbookservice.getAddressBookList(selectValue,this.searchParam).then((data:any)=>{
            this.addressBookList = data;
            let company = new Array();
            let responseArr = new Array();
            responseArr = data ;
            if(responseArr.length>0){
                for(let i=0;i<responseArr.length;i++){
                    let temp = Object.keys(responseArr[i]).toString();
                    if(responseArr[i][temp].length>0){
                        company.push(temp);
                    }
                }
            }
            this.addressbookservice.getCompanyInfo().then((data:any)=>{
                this.companyArr = new Array();
                this.companyArr.length=0;
                for(let j=0;j<company.length;j++){
                    for(let i=0;i<data.length;i++){
                        if(company[j] ==data[i].companyNm){
                            this.companyArr.push(data[i]);
                        }
                    }
                }
            })
        })
    }
}
