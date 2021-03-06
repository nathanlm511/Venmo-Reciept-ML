import React, { Component } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';

import './List.css';

class List extends Component {
  constructor() {
    super();
    this.state = {isOpen: false}
    /*
    this.state = {
      items: [{id: "1", name: "water", price: 14, percentage: 34, checked: false, slider: 0, otherPercentages: [12, 25, 30]},
                {id: "2", name: "milk", price: 24, percentage: 100, checked: false, slider: 0, otherPercentages: []},
                {id: "3", name: "grass", price: 9, percentage: 50, checked: false, slider: 0, otherPercentages: [50]}]
    
    }
    */
   this.finalConfirm = this.finalConfirm.bind(this);
   this.confirm = this.confirm.bind(this);
   this.closeModal = this.closeModal.bind(this);
  }

  customStyles = {
    content : {
      border: "none"
    },
    overlay: {zIndex: 1000}
  };

  componentWillMount() {
    const session_data = JSON.parse(window.localStorage.getItem("session_data"));
    const user_token = JSON.parse(window.localStorage.getItem("token"));
    
    console.log(session_data.items);
    
    console.log(session_data);

    let users = [];
    let items = [];
    let index = 0;
    let totalPrice = 0;
    let user_found = session_data.users.find(user => user.user_id == user_token.id);
    if (user_found) {
      session_data.current_user = user_found;
      users.push({name: user_found.name, id: user_found.id, num: index});
      index++;
      session_data.users = session_data.users.filter(user => user.user_id != user_token.id);
    }
    if (session_data.current_user == "") {
      users.push({name: user_token.username, id: user_token.id, num: index});
      index++;
    }
    if (session_data.users) {
      session_data.users.forEach(user => {
        users.push({name: user.name, id: user.id, num: index});
        index++;
      });
    }
    session_data.items.forEach(item => {
      let newItem = item;
      newItem.checked = false;
      newItem.slider = 0;
      newItem.otherPercentages = [];
      items.push(newItem);
      totalPrice += item.price;
    });
    if (!session_data.current_user == "") {
      session_data.current_user.bought_items.forEach(item => {
        let item_matched = items.find(e => e.id == item["Item ID"]);
        item_matched.slider = item.percent;
        item_matched.checked = true;
      });
    }
    index = 1;
    if (session_data.users) {
      session_data.users.forEach(user => {
        user.bought_items.forEach(item => {
          console.log(item);
          let item_matched = items.find(e => e.id == item["Item ID"]);
          item_matched.otherPercentages.push({id: index, percentage: item.percent});
        });
        index++;
      });  
    }  
    items.forEach(item => {
      let percentageSum = 0;
      item.otherPercentages.forEach(percentage => percentageSum += percentage.percentage);
      item.percentage = 100 - percentageSum;
    });
    this.setState({items:items, users: users, totalPrice: totalPrice});
  }

  check(id) {
    let newItems = this.state.items.slice();
    let i = newItems.findIndex(item => {
      return item.id == id;
    });
    let currentItem = newItems[i];

    if (currentItem.checked) {
      currentItem.checked = false;
      currentItem.slider = 0;
    }
    else if (currentItem.percentage != 0) {
      currentItem.checked = true;  
      currentItem.slider = 100;
    }
    console.log(currentItem.price);
    this.setState({items: newItems});
    console.log(this.state.items);
  }

  handleSlider(e, id) {
    let newItems = this.state.items.slice();
    let i = newItems.findIndex(item => {
      return item.id == id;
    });
    newItems[i].slider = e.target.value;
    this.setState({items: newItems});
  }

  confirm() {
    let itemsToDb = [];
    this.state.items.forEach(item => {
      let newItem = {};
      newItem.id = item.id;
      newItem.name = item.name;
      newItem.price = item.price;
      newItem.percentage = item.slider * item.percentage / 100;
      itemsToDb.push(newItem);
    });
    const user_token = JSON.parse(window.localStorage.getItem("token"));
    
    let current_user = {};
    current_user.name = user_token.username;
    current_user.id = user_token.id;
    current_user.items = itemsToDb;
    current_user.session_id = window.localStorage.getItem("session_id");
    console.log(current_user);

    let allPaid = true;
    this.state.items.forEach(item => {
      if (!(item.percentage == 0 || item.slider == 100)) {
        allPaid = false;
      }
    });
    axios.post("http://localhost:5000/add_user", {current_user: current_user, allPaid: allPaid})
    .then(res => {
      console.log(res.data);
    })
    .catch(err => console.log(err));
    this.setState({isOpen: true});
  }

  closeModal() {    
    this.setState({isOpen: false});
  }

  finalConfirm() {
    axios.post("http://localhost:5000/request_money", {session_id: window.localStorage.getItem("session_id"), venmo_token: window.localStorage.getItem("venmo_token")})
    .then(res => {
      console.log(res.data);
    })
    .catch(err => console.log(err));
  }

  render() {
    // check if user is authenticated
    if (!window.localStorage.getItem("token")) {
      console.log("user not authenticated");
      window.location = '/';
    }
    return (
      <div className="list">
        <div className="high-z">
        </div>
        <div className="list-header-container">
          <div className="list-title">
            Your Grocery List
          </div>
          <div className="session-link">{"Session URL: http://localhost:3000/login/" + window.localStorage.getItem("session_id")}</div>
          <div className="legend-container">
            {this.state.users.map((user) => {
              return (
              <div key={user.id} className="user-container">
                <div><span className="username-legend">{user.name}</span>is</div>
                <div className={"highlight-" + user.num + " circle"}></div>
              </div>
              )            
            })}
          </div>
        </div>
        <div className="list-body-container">
          <div className="reciept-container">
            {this.state.items.map((item) => {
              let leftTotal = item.percentage;
              let index = 0;
              return (
              <div key={item.id} className="item-container">
              <div className={item.checked ? 'check' : 'uncheck'} onClick={() => this.check(item.id)}/>
                <div className="item-box">    
                  <input style={{width: item.percentage + "%"}} type="range" min="0" max="100" 
                    value={item.slider} onChange={(e) => this.handleSlider(e, item.id)} className={item.checked ? 'slider' : "no-slider"}/>  
                  {item.otherPercentages.map((percent) => {
                    let tempLeft = leftTotal;
                    leftTotal += percent.percentage;
                    index++;
                    return <div className={"other-highlight highlight-" + percent.id} style={{left: tempLeft + "%", width: percent.percentage + "%"}}/>
                  })}
                  <div className="user-highlight highlight-0" style={{width: (item.percentage * item.slider / 100) + "%"}}/>
                  <div className="item-name">
                    {item.name}
                  </div>
                  <div className="item-price">
                    {"$" + item.price.toFixed(2)}
                  </div>
                </div>
                <div className={item.slider == 100 ? "item-percentage-green" : "item-percentage"}>
                  {Math.round(item.slider * item.percentage / 100)} %
                </div>
              </div>             
            )})}            
          </div>
          <div className="confirm-column">
            <div className="confirm-card">            
              <div className="confirm-price">
                {"Your total contribution is: $" + (this.state.items.reduce((accumulator, item) => (accumulator) + (item.price * item.percentage * item.slider / 100 / 100), 0)).toFixed(2)}
                <br></br>
                {"Out of a total of: $" + this.state.totalPrice.toFixed(2)}
                <br></br>
                {"You have a contribution of: " + ((this.state.items.reduce((accumulator, item) => (accumulator) + (item.price * item.percentage * item.slider / 100 / 100), 0)) / this.state.totalPrice * 100).toFixed(2) + "%"}
              </div>
              <div className="confirm-button" onClick={this.confirm}>
                CONFIRM
              </div>
            </div>  
          </div>
        </div>   
        <Modal
          style={this.customStyles}
          className="modal"
          isOpen={this.state.isOpen}
          onRequestClose={this.closeModal}>
            {JSON.parse(window.localStorage.getItem("session_data")).host != JSON.parse(window.localStorage.getItem("token")).phone ?
            
            <div className="modal-inside">
            You have succesfully confirmed your contribution! Feel free to stay and make changes to you confirmation!
                <div className="check-img" />
            </div>  :

            <div className="modal-inside">
            Send out Venmo requests for everyone's confirmed price by pressing the button below.
              <div className="confirm-button" onClick={this.finalConfirm}>
                  FINAL CONFIRMATION
                </div>
            </div> 
          
            }       
        </Modal>     
      </div>
    );
  }
}
export default List;