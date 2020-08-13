import {Component, OnInit, ChangeDetectionStrategy, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: '<%= prefix %>-loading',
  templateUrl: './loading.dialog.html',
  styleUrls: ['./loading.dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingDialog implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: string) { }

  ngOnInit(): void {
  }

}
