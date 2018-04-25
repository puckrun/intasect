// Third party library.
import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, Content, ViewController} from 'ionic-angular';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {BlogService} from '../../../providers/blog-service';
import {ShareService} from '../../../providers/share-service';

@Component({
    selector: 'page-blog-preview-blog',
    templateUrl: 'preview-blog.html',
    providers: [BlogService, Util]
})
export class PreviewBlogPage {
    @ViewChild(Content) pageContent: Content;

    public previewBlog: any;
    public title: string;
    public content: string;
    public isLoadCompleted: boolean;
    public isScrollToTopButtonVisible: boolean;
    public attachFiles: any;

    public pageLoadTime: number;

    constructor(private nav: NavController, private viewCtrl: ViewController, private params: NavParams, private blogService: BlogService, private share: ShareService) {
        this.previewBlog = this.params.get('previewBlog');
        this.title = this.previewBlog.title;
        this.content = this.previewBlog.content;
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

    scrollToDetailPageTop(): void {
        this.pageContent.scrollToTop();
    }

    close(): void {
        this.viewCtrl.dismiss();
    }
}