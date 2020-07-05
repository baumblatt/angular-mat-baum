import { Component, OnInit } from '@angular/core';
import { onInfo } from "../../store/actions/messages.actions"
import { CoreState } from "../../store/reducers/feature.reducer";
import { Store } from "@ngrx/store";


@Component({
  selector: '<%= prefix %>-home',
  templateUrl: './home.container.html',
  styleUrls: ['./home.container.scss']
})
export class HomeContainer implements OnInit {

  constructor(private store: Store<CoreState>) { }

  ngOnInit(): void {
    this.store.dispatch(onInfo({message: 'Welcome to <%= name %>'}))
  }

}
