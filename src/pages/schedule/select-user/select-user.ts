// Third party library.
import {Component} from '@angular/core';
import {NavController, NavParams, ViewController} from 'ionic-angular';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {ScheduleService} from '../../../providers/schedule-service';
import {UserService} from '../../../providers/user-service';


@Component({
    selector: 'page-schedule-select-user',
    templateUrl: 'select-user.html',
    providers: [Util,
        ScheduleService,
        UserService]
})
export class SelectUserPage {
    public selectedUserCount = 0;
    public selectedUser: any = new Array();
    public allUsers: any;
    public allGroupUsers: any;
    public orgsWithUsers: any = new Array();
    public groupsWithUsers: any = new Array();
    public isSearching: boolean;
    public foundUserMembers: any;
    public groupingApproach: string = 'group';
    public isFirstLoadOrganizationInfo: boolean = true;
    public searchUserName: string;

    constructor(private nav: NavController,
        private viewCtrl: ViewController,
        private util: Util,
        private params: NavParams,
        private scheduleService: ScheduleService,
        private userService: UserService) {
        this.getGroupListForCurrentUser();
    }

    getGroupListForCurrentUser(): void {
        this.scheduleService.getGroupListForCurrentUser().then((data: any[]) => {
            this.groupsWithUsers = data;
            let allUsersInGroup = new Array();
            this.groupsWithUsers.forEach(function (groupWithUsers) {
                groupWithUsers.users.forEach(function (groupUser) {
                    groupUser.isSelected = false;
                    allUsersInGroup.push(groupUser);
                });
            });
            this.allGroupUsers = allUsersInGroup;
        });
    }

    getOrganizationAndUsers(): any {
        return new Promise(resolve => {
            this.scheduleService.getOrganizationList().then((orgs: any[]) => {
                this.scheduleService.getHumanResourceUserInfoList().then((users: any[]) => {
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
                    resolve(true);
                });
            });
        });
    }
    onSegmentChanged() {
        if (this.groupingApproach === 'group') {
            this.solveExistFinderAndSelected();
        } else {
            if (this.isFirstLoadOrganizationInfo) {
                this.getOrganizationAndUsers().then((data: boolean) => {
                    if (data) {
                        this.isFirstLoadOrganizationInfo = false;
                        this.solveExistFinderAndSelected();
                    }
                });
            } else {
                this.solveExistFinderAndSelected();
            }
        }
    }

    solveExistFinderAndSelected() {
        if (this.searchUserName && this.searchUserName.trim() !== '') {
            this.findUserByUserName(this.searchUserName);
        } else {
            this.isSearching = false;
        }
        if (this.selectedUserCount > 0) {
            this.solveTheSelectedUser(this.selectedUser);
        }
    }

    solveTheSelectedUser(user: any): void {
        if (this.groupingApproach === 'group') {
            for (let i = 0; i < this.allUsers.length; i++) {
                let everyUser = this.allUsers[i];
                if (everyUser.isSelected === true) {
                    everyUser.isSelected = false;
                    break;
                }
            }
            this.selectedUser = '';
            this.selectedUserCount = 0;
            for (let i = 0; i < this.groupsWithUsers.length; i++) {
                let groupWithUsers = this.groupsWithUsers[i].users;
                for (let j = 0; j < groupWithUsers.length; j++) {
                    let groupUser = groupWithUsers[j];
                    if (user.userID === groupUser.userID) {
                        groupUser.isSelected = true;
                        this.selectedUser = user;
                        this.selectedUserCount = 1;
                        break;
                    }
                }
            }
        } else {
            for (let i = 0; i < this.groupsWithUsers.length; i++) {
                let groupWithUsers = this.groupsWithUsers[i].users;
                for (let j = 0; j < groupWithUsers.length; j++) {
                    let groupUser = groupWithUsers[j];
                    if (groupUser.isSelected === true) {
                        groupUser.isSelected = false;
                        break;
                    }
                }
            }
            for (let i = 0; i < this.allUsers.length; i++) {
                let everyUser = this.allUsers[i];
                if (user.userID === everyUser.userID) {
                    everyUser.isSelected = true;
                    break;
                }
            }
            this.selectedUser = user;
            this.selectedUserCount = 1;
        }
    }

    findUsers(event: any): void {
        this.isSearching = true;
        let userName = event.target.value;
        this.searchUserName = userName;
        if (userName && userName.trim() !== '') {
            this.findUserByUserName(userName);
        } else {
            this.isSearching = false;
        }
    }

    findUserByUserName(userName) {
        if (this.groupingApproach === 'group') {
            this.foundUserMembers = this.allGroupUsers;
        } else {
            this.foundUserMembers = this.allUsers;
        }

        this.foundUserMembers = this.foundUserMembers.filter((user) => {
            return (user.userName.toLowerCase().indexOf(userName.toLowerCase()) > -1);
        });
    }

    changeSelectedUser(user: any): void {
        if (user.isSelected === true) {
            if (this.groupingApproach === 'group') {
                this.groupsWithUsers.forEach(function (groupWithUsers) {
                    groupWithUsers.users.forEach(function (groupUser) {
                        if (groupUser.isSelected === true && user.userID !== groupUser.userID) {
                            groupUser.isSelected = false;
                        }
                        if (user.userID === groupUser.userID && groupUser.isSelected === false) {
                            groupUser.isSelected = true;
                        }
                    });
                });
            } else {
                this.allUsers.forEach(function (everyUser) {
                    if (everyUser.isSelected === true && user.userID !== everyUser.userID) {
                        everyUser.isSelected = false;
                    }
                });
            }
            this.selectedUser = user;
            this.selectedUserCount = 1;
        } else {
            if (this.groupingApproach === 'group') {
                this.groupsWithUsers.forEach(function (groupWithUsers) {
                    groupWithUsers.users.forEach(function (groupUser) {
                        if (groupUser.isSelected === true) {
                            groupUser.isSelected = false;
                        }
                    });
                });
            }
            this.selectedUser = '';
            this.selectedUserCount = 0;
        }
    }

    close(): void {
        this.viewCtrl.dismiss();
    }

    selectUsers(): void {
        this.viewCtrl.dismiss(this.selectedUser);
    }
}
