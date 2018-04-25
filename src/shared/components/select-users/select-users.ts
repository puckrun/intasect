// Third party library.
import {Component} from '@angular/core';
import {NavController, NavParams, ViewController} from 'ionic-angular';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {ScheduleService} from '../../../providers/schedule-service';
import {BlogService} from '../../../providers/blog-service';
import {UserService} from '../../../providers/user-service';

@Component({
    selector: 'page-components-select-users',
    templateUrl: 'select-users.html',
    providers: [
        UserService,
        ScheduleService,
        BlogService
    ]
})
export class SelectUsersPage {
    public originUsers: any;
    public selectedUsers: any = new Array();
    public selectedUsersCount: number;
    public allUsers: any;
    public orgsWithUsers: any = new Array();
    public isSearching: boolean;
    public foundUserMembers: any;
    public title: string;

    constructor(private nav: NavController,
        private viewCtrl: ViewController,
        private util: Util,
        private params: NavParams,
        private scheduleService: ScheduleService,
        private blogService: BlogService,
        private userService: UserService) {
        let sendDataToSelectUsers = this.params.get('sendDataToSelectUsers');
        this.title = sendDataToSelectUsers.title;
        this.originUsers = sendDataToSelectUsers.selectedUsers;
        let systemName = sendDataToSelectUsers.systemName;
        this.getOrganizationAndUsers(systemName).then(data => {
            this.selectedUsersCount = 0;
            this.setOriginSelectedUsers();
        });
    }

    getOrganizationAndUsers(systemName): any {
        return new Promise(resolve => {
            this.getOrganizationList(systemName).then((orgs: any[]) => {
                this.getUserList(systemName).then((users: any[]) => {
                    // all users
                    this.allUsers = users;
                    for (let i = 0; i < orgs.length; i++) {
                        let usersInOrg = new Array();
                        for (let j = 0; j < users.length; j++) {
                            if (orgs[i].organizationCode === users[j].assignOrgCd) {
                                usersInOrg.push(users[j]);
                            }
                        }
                        let orgWithUsers = {
                            organizationCode: orgs[i].organizationCode,
                            organizationName: orgs[i].organizationName,
                            users: usersInOrg
                        };
                        this.orgsWithUsers.push(orgWithUsers);
                    }
                    resolve('true');
                });
            });
        });
    }

    findUsers(event: any): void {
        this.isSearching = true;
        let userName = event.target.value;

        this.foundUserMembers = this.allUsers;
        if (userName && userName.trim() !== '') {
            this.foundUserMembers = this.foundUserMembers.filter((user) => {
                return (user.userName.toLowerCase().indexOf(userName.toLowerCase()) > -1);
            });
        } else {
            this.isSearching = false;
        }
    }

    changeSelectedUser(user: any): void {
        if (user.isSelected === true) {
            this.selectedUsers.push(user);
            this.selectedUsersCount++;
        } else {
            let index = this.selectedUsers.indexOf(user);
            if (index !== -1) {
                this.selectedUsers.splice(index, 1);
            }
            this.selectedUsersCount--;
        }
    }

    setOriginSelectedUsers(): void {
        for (let i = 0; i < this.originUsers.length; i++) {
            for (let j = 0; j < this.allUsers.length; j++) {
                if (this.originUsers[i].userID === this.allUsers[j].userID) {
                    this.allUsers[j].isSelected = true;
                    this.selectedUsersCount++;
                    this.selectedUsers.push(this.allUsers[j]);
                }
            }
        }
    }

    close(): void {
        this.viewCtrl.dismiss(this.originUsers);
    }

    selectUsers(): void {
        let sendUsers = new Array();
        this.selectedUsers.forEach(function (selectedUser) {
            let user = {
                'userID': selectedUser.userID,
                'userName': selectedUser.userName
            };
            sendUsers.push(user);
        });
        this.viewCtrl.dismiss(sendUsers);
    }

    getOrganizationList(systemName): any {
        return new Promise(resolve => {
            if (systemName === 'schedule') {
                this.scheduleService.getOrganizationList().then(orgs => {
                    resolve(orgs);
                });
            } else if (systemName === 'blog') {
                this.blogService.getOrganizationList().then(orgs => {
                    resolve(orgs);
                });
            }
        });
    }

    getUserList(systemName): any {
        return new Promise(resolve => {
            if (systemName === 'schedule') {
                this.scheduleService.getHumanResourceUserInfoList().then(usrs => {
                    resolve(usrs);
                });
            } else if (systemName === 'blog') {
                this.blogService.getUserList().then(usrs => {
                    resolve(usrs);
                });
            }
        });
    }
}
