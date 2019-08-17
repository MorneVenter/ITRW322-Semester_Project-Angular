import {Component, OnInit, TemplateRef} from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import * as firebase from 'firebase';
import Timestamp = firebase.firestore.Timestamp;
import { User, UserData} from '../../models/user.model';
import { Conversation, Message, NewConversation } from '../../models/message.model';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { ChatService} from '../../services/chat.service';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {MessageTypeEnum} from '../../enums/messagetype.enum';
import {CryptoService} from '../../services/crypto.service';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {last} from 'rxjs/operators';


@Component({
  selector: 'app-chats',
  templateUrl: './chats.component.html',
  styleUrls: ['./chats.component.scss']
})
export class ChatsComponent implements OnInit {

  // All user data from firebase to add their display names and photos to the chats
  users: Array<UserData>;

  // Message being sent via input box
  msgValue = '';

  // New line comp
  newLine = '***';
  // Sidebar active conversation of active user
  conversations: Array<Conversation>;

  // Current active user
  activeUser: User;

  // Show select new chat global variables
  SelectNewConversation: boolean;
  ShowCreateGroupConversation = false;
  GroupCreationButton = 'Back To Start New Chat';
  GroupForm: FormGroup;
  IsCreateGroupIcon = false;

  // Show attachment popup menu
  showAttachmentMenu: boolean;

  modalRef: BsModalRef;

  // Selected conversation based firebase directory messages (global message model)
  Messages: Array<Message>;
  ConversationPhoto: string;
  ConversationName;
  ConversationPath;
  CurrentConversation: Conversation = {
    description: '',
    isgroupchat: false,
    id: '0',
    name: '',
    participants: null,
    groupPhotoURL: '',
    lastsentmessage: '',
    lastsentmessageuser: '',
    lastsentmessagedatetime: null,
    lastsentmessagetype: null
  };

  constructor(private firebaseService: FirebaseService,
              private afs: AngularFirestore,
              private chatService: ChatService,
              private modalService: BsModalService,
              private formBuilder: FormBuilder,
              private  cryptoService: CryptoService) {

    // Group form
    this.GroupForm = this.formBuilder.group({
      GroupName: ['', Validators.required],
      SelectedUsers: new FormArray([])
    });


    // Set the sidebar to active conversations
    this.SelectNewConversation = false;

    // Set popup menu to hide
    this.showAttachmentMenu = false;

    // Get active user data from local storage after login
    this.activeUser = JSON.parse(localStorage.getItem('user'));

    // Get user data for use within messages
    this.getUsers();

    // Set active user's open conversation in sidebar
    this.getActiveConversations();
  }

  // ------------------ Get data methods ------------------

  getUsers() {
    this.firebaseService.getUsers().subscribe(responseData => {
      this.users = responseData;
    });
  }

  getActiveConversations() {
    this.chatService.getConversations(this.activeUser.uid).subscribe(responseData => {
      this.conversations  = responseData;
    });
  }

  // ------------------ Start new chat methods ------------------
  ShowSelectNewConversation() {
    this.SelectNewConversation = true;
  }

  HideSelectNewConversation() {
    this.SelectNewConversation = false;
  }

  ShowCreateNewGroupConversation() {
    this.ShowCreateGroupConversation = true;
  }

  HideCreateNewGroupConversation() {
    this.ShowCreateGroupConversation = false;
  }

  CreateNewDirectConversation(selecteduseruid: string) {
    if (this.CheckIfDirectConversationExists(selecteduseruid)) {
      const id = this.afs.createId();
      this.SelectNewConversation = false;
      const conversationRef: AngularFirestoreDocument<any> = this.afs.doc(`conversations/${id}`);
      const Participants: string[] = [this.activeUser.uid, selecteduseruid];
      const conversation: NewConversation = {
        description: '',
        isgroupchat: false,
        name: '',
        participants: Participants,
        groupPhotoURL: '',
        lastsentmessage: 'New Conversation',
        lastsentmessageuser: '5',
        lastsentmessagedatetime: null,
        lastsentmessagetype: MessageTypeEnum.new_message
      };
      conversationRef.set(conversation, {
        merge: true
      });
      this.HideSelectNewConversation();
    } else {
      this.HideSelectNewConversation();
    }
  }

  CheckIfDirectConversationExists(selecteduseruid): boolean {
    for (const conversation of this.conversations) {
      if (!conversation.isgroupchat) {
        for (const participant of conversation.participants) {
          if (participant === selecteduseruid) {
            // Conversation exists!
            return false;
          }
        }
      }
    }
    // Create conversation!
    return true;
  }

  CreateNewGroupConversation() {
    const formArray: FormArray = this.GroupForm.get('SelectedUsers') as FormArray;
    if (formArray.length !== 0) {
      if (this.GroupForm.get('GroupName').value.toString().trim() !== '') {
        formArray.push(new FormControl(this.activeUser.uid));
        const id = this.afs.createId();
        this.SelectNewConversation = false;
        const conversationRef: AngularFirestoreDocument<any> = this.afs.doc(`conversations/${id}`);
        const conversation: NewConversation = {
          description: 'This is a new group conversation.',
          isgroupchat: true,
          name: this.GroupForm.get('GroupName').value,
          participants: this.GroupForm.get('SelectedUsers').value,
          groupPhotoURL: 'https://firebasestorage.googleapis.com/v0/b/itrw322-semester-project.appspot.com/o/defaults%2FdefaultUserPhoto.png?alt=media&token=5222876d-ea95-4cb9-a8a4-71d898c595d4',
          lastsentmessage: 'New Group Conversation',
          lastsentmessageuser: '5',
          lastsentmessagedatetime: null,
          lastsentmessagetype: MessageTypeEnum.new_message
        };
        conversationRef.set(conversation, {
          merge: true
        });
        this.HideCreateNewGroupConversation();
      }
    } else {
      this.HideCreateNewGroupConversation();
    }
  }

  // This method is used to add users dynamically to an array for use with group chat creation

  onCheckChange(event, useruid) {
    const formArray: FormArray = this.GroupForm.get('SelectedUsers') as FormArray;
    /* Selected */
    if (event.target.checked) {
      // Add a new control in the arrayForm
      formArray.push(new FormControl(useruid));
    } else {
      /* unselected */

      // find the unselected element
      let i = 0;

      formArray.controls.forEach((ctrl: FormControl) => {
        if (ctrl.value === useruid) {
          // Remove the unselected element from the arrayForm
          formArray.removeAt(i);
          return;
        }
        i++;
      });
    }
    if (formArray.length === 0) {
      this.GroupCreationButton = 'Back To Start New Chat';
      this.IsCreateGroupIcon = false;
    } else {
      this.GroupCreationButton = 'Create Group Chat';
      this.IsCreateGroupIcon = true;
    }
  }

  // ------------------ Set attachments to active ----------------------------

  SetAttachmentsMenu() {
      this.showAttachmentMenu = true;
  }

  setAttachmentsFale() {
    this.showAttachmentMenu = false;
  }

  // ------------------ Change to other active chat methods ------------------
  SetSelectedConversation(conversationid, conversationobject: Conversation) {
    this.Messages = null;
    this.ConversationPhoto = '';
    this.CurrentConversation = conversationobject;
    this.chatService.getConversationMessages(conversationid)
      .subscribe(responseData => {
        this.Messages = responseData;
        this.ConversationName = this.GetConversationName();

    });
  }

  GetConversationName(): string {
    if (this.CurrentConversation.isgroupchat) {
      this.ConversationPhoto = this.CurrentConversation.groupPhotoURL;
      return this.CurrentConversation.name;
    } else {
      if (this.CurrentConversation.participants[0] === this.activeUser.uid) {
        this.ConversationPhoto = this.getSenderImage(this.CurrentConversation.participants[1]);
        return this.getSenderName(this.CurrentConversation.participants[1]);
      } else {
        this.ConversationPhoto  = this.getSenderImage(this.CurrentConversation.participants[0]);
        return this.getSenderName(this.CurrentConversation.participants[0]);
      }
    }
  }

  // ------------------ In chat methods for functionality ------------------


  playNotificationSound(sendersUID, lastmessage): string {
    if (sendersUID !== this.activeUser.uid) {
     const audio = new Audio();
     audio.src = 'assets/message-sound.mp3';
     audio.load();
     audio.play();
    }
    return lastmessage;
  }

  sendMessage() {
    if (this.msgValue.trim() !== '') {
      this.chatService.sendConversationMessage(this.CurrentConversation.id, this.msgValue, this.activeUser.uid);
      this.msgValue = '';
    }
  }

  // ------------------ UI methods ------------------
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


  getSenderName(uid) {
    for (const user of this.users) {
      if (user.uid === uid) {
        return user.displayName;
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

  getChatName(isgroupchat: boolean, name: string, participants: string[]) {
    if (isgroupchat) {
      return name;
    } else {
      if (participants[0] === this.activeUser.uid) {
        return this.getSenderName(participants[1]);
      } else {
        return this.getSenderName(participants[0]);
      }
    }
  }

  getChatPhoto(isgroupchat: boolean, groupImage, participants: string[]) {
    if (isgroupchat) {
      return groupImage;
    } else {
      if (participants[0] === this.activeUser.uid) {
        return this.getSenderImage(participants[1]);
      } else {
        return this.getSenderImage(participants[0]);
      }
    }
  }

  getChatPicture(isgroupchat: boolean) {
    if (isgroupchat) {
      return name;
    } else {
      return 'still need to detect other person';
    }
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, { backdrop: true , keyboard: true});
  }

  ngOnInit() {
  }
}
