
import * as firebase from 'firebase';
import Timestamp = firebase.firestore.Timestamp;

export interface Conversations {
  conversations?: (Conversation)[] | null;
}

export interface Conversation {
  description: string;
  isgroupchat: boolean;
  id: string;
  name: string;
  participants: string[];
  groupPhotoURL: string;
}

export interface Messages {
  messages?: (Message)[] | null;
}


export interface Message {
  datetime: Timestamp;
  message: string;
  uid: string;
}