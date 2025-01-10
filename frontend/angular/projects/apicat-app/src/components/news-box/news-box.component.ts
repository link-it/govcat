import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-news-box',
  templateUrl: './news-box.component.html',
  styleUrls: ['./news-box.component.scss']
})
export class NewsBoxComponent implements OnInit {

  @Input() title: string = 'Title';
  @Input() content: string = 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Tenetur exercitationem dolorum molestiae ullam perferendis.';
  @Input() link: string = 'https://www.link.it';
  @Input() buttonText: string = 'Go';
  @Input() showClose: boolean = false;
  @Input() showBottonLink: boolean = true;

  constructor() { }

  ngOnInit() {
  }

}
