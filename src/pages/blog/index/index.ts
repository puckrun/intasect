// Third party library.
import {Component, ViewChild} from '@angular/core';
import {NavController, Content} from 'ionic-angular';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {BlogService} from '../../../providers/blog-service';
import {ShareService} from '../../../providers/share-service';

// Pages.
import {BlogDetailPage} from '../detail/detail';
import {AddBlogPage} from '../add-blog/add-blog';

@Component({
    selector: 'page-blog-index',
    templateUrl: 'index.html',
    providers: [
        BlogService,
        Util
    ]
})
export class BlogIndexPage {
    @ViewChild(Content) pageContent: Content;

    public sendData: any;
    public isLoadCompleted: boolean;
    public communityListForTop: any[] = [];
    public keyWord: string;
    public isFirstTimeLoad: boolean;
    public isShowSearchBar: boolean;
    public isScrollToTopButtonVisible: boolean;

    constructor(private nav: NavController, private blogService: BlogService, private share: ShareService) {
        this.sendData = {
            'isRefreshFlag': false
        };
        this.keyWord = null;
        this.getCommunityListForTop();
        this.getBlogNewInformationCount();
        this.isFirstTimeLoad = true;
        this.isShowSearchBar = false;
    }

    ionViewDidLoad(): void {
        this.isLoadCompleted = false;
    }

    ionViewWillEnter(): void {
        if (this.sendData.isRefreshFlag) {
            this.isLoadCompleted = false;
            this.keyWord = null;
            this.getCommunityListForTop();
            this.getBlogNewInformationCount();
            this.isFirstTimeLoad = true;
        }
        this.sendData.isRefreshFlag = false;
    }

    openDetail(community): void {
        this.sendData = {
            'community': community,
            'isRefreshFlag': false
        };
        this.nav.push(BlogDetailPage, {
            'sendData': this.sendData
        });
    }

    doRefresh(refresher): void {
        let isRefresh = true;
        this.keyWord = null;
        this.isFirstTimeLoad = true;
        this.isShowSearchBar = false;
        this.getCommunityListForTop(refresher, isRefresh);
        this.getBlogNewInformationCount();
    }

    doInfinite(infiniteScroll): void {
        let position = this.communityListForTop.length;
        let isNeedRegistNotExistsReply = false;
        this.blogService.getCommunityListForTop(position, isNeedRegistNotExistsReply, this.keyWord).then((data: any) => {
            if (data && data.length > 0) {
                this.communityListForTop = this.communityListForTop.concat(data);
            }
            infiniteScroll.complete();
        });
    }

    getCommunityListForTop(refresher?: any, isRefresh?: boolean): void {
        let position = 0;
        let isNeedRegistNotExistsReply = true;
        this.blogService.getCommunityListForTop(position, isNeedRegistNotExistsReply, this.keyWord).then((data: any) => {
            this.communityListForTop = data;
            this.isLoadCompleted = true;
            this.isScrollToTopButtonVisible = false;
            if (isRefresh) {
                refresher.complete();
            }
            if (this.isFirstTimeLoad && data.length > 9) {
                this.pageContent.scrollTo(0, 46);
                this.isShowSearchBar = true;
                this.isFirstTimeLoad = false;
            }
        });
    }

    getBlogNewInformationCount() {
        this.blogService.getNotReadCommunityCountBySelf().then((data: string) => {
            if (data) {
                this.share.blogNewInformationCount = Number(data);
            }
        });
    }

    ngAfterViewInit(): void {
        this.pageContent.ionScroll.subscribe(() =>{
            if (this.pageContent.scrollTop > 200) {
                this.isScrollToTopButtonVisible = true;
            } else {
                this.isScrollToTopButtonVisible = false;
            }
        });
    }

    scrollToIndexPageTop(): void {
        this.pageContent.scrollToTop();
    }

    addBlog(): void {
        this.nav.push(AddBlogPage, { 'sendData': this.sendData });
    }
    serachBlogs(event: any): void {
        this.keyWord = event.target.value;
        this.getCommunityListForTop();
    }
}