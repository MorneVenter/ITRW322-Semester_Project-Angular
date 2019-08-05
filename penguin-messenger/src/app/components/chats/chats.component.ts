import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { PublicChannel } from '../../models/publicChannel.model';
import * as firebase from 'firebase';
import Timestamp = firebase.firestore.Timestamp;
import { User, UserData} from '../../models/user.model';
import { Conversation, Message } from '../../models/message.model';


@Component({
  selector: 'app-chats',
  templateUrl: './chats.component.html',
  styleUrls: ['./chats.component.scss']
})
export class ChatsComponent implements OnInit {
  // Current public channel message that need to be transferred to global message model
  messages: Array<PublicChannel>;

  // All user data from firebase to add their display names and photos to the chats
  users: Array<UserData>;

  // Message being sent via input box
  msgValue = '';

  // Sidebar active conversation of active user
  conversations: Array<Conversation>;

  // Current active user
  activeUser: User;

  // Conversation based firebase directory messages (global message model)
  Messages: Array<Message>;


  constructor(private fbService: FirebaseService) {
    // Get active user data from local storage after login
    this.activeUser = JSON.parse(localStorage.getItem('user'));

    // Get user data for use within messages
    this.getUsers();

    // Set active user's open conversation in sidebar
    this.getConversations();

    // Get public channel messages
    this.getMessages();
  }

  ngOnInit() {
  }

  getMessages() {
  this.fbService.getPublicChannel().subscribe(responseData => {
    this.messages = responseData;
  });
  }

  sendMessage() {
    this.fbService.createMessage(this.msgValue, this.activeUser.uid);
    this.msgValue = '';
  }

  public getGoodDate(tstmp: Timestamp) {
    return tstmp.toDate();
  }

  getSenderImage(uid) {
    for (const user of this.users) {
      if (user.uid === uid) {
        return user.photoURL;
      }
    }
  }

  getChatType(isgroupchat: boolean) {
      if (isgroupchat) {
        return 'Group conversation.';
      } else {
        return 'Direct conversation.';
      }
  }

  getChatName(isgroupchat: boolean, name: string) {
    if (isgroupchat) {
      return name;
    } else {
      return 'still need to detect other person';
    }
  }

  getChatPicture(isgroupchat: boolean) {
    if (isgroupchat) {
      return name;
    } else {
      return 'still need to detect other person';
    }
  }

  getUsers() {
    this.fbService.getUsers().subscribe(responseData => {
      this.users = responseData;
    });
  }

  getConversations() {
    this.fbService.getConversations(this.activeUser.uid).subscribe(responseData => {
      this.conversations = responseData;
    });
  }
}
