import { Component, OnInit } from '@angular/core';
import { onInfo } from "../../store/actions/msg.actions"
import { CoreState } from "../../store/reducers/feature.reducer";
import { Store } from "@ngrx/store";


@Component({
  selector: '<%= prefix %>-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private store: Store<CoreState>) { }

  ngOnInit(): void {
    this.store.dispatch(onInfo({message: 'Welcome to <%= name %>'}))
  }

}
