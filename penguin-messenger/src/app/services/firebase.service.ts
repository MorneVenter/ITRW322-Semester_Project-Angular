import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {Post, Posts} from '../models/message.model';

@Injectable({
  providedIn: 'root'
})

export class FirebaseService {

  constructor(public db: AngularFirestore) {}

  public getPosts(): Observable<Post[]> {
    return this.db.collection<Posts>('Posts', ref => ref.orderBy('Date', 'desc')).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Post;
          const id = a.payload.doc.id;
          return { id, ...data };
        });
      })
    );
  }

  getPost(DocumentId) {
    return this.db.doc<Post>('Posts/' + DocumentId).valueChanges();
  }

  updateUser(DocumentId, value) {
    value.nameToSearch = value.name.toLowerCase();
    return this.db.collection('Posts').doc(DocumentId).set(value);
  }

  deleteUser(DocumentId) {
    return this.db.collection('Posts').doc(DocumentId).delete();
  }

  searchUsers(searchValue) {
    return this.db.collection('users', ref => ref.where('nameToSearch', '>=', searchValue)
      .where('nameToSearch', '<=', searchValue + '\uf8ff'))
      .snapshotChanges();
  }

  searchUsersByAge(value) {
    return this.db.collection('users', ref => ref.orderBy('age').startAt(value)).snapshotChanges();
  }


  createPost(author: string, authorrouterurl: string, contentmdurl: string, description: string,
             featured: boolean, imageurl: string, title: string) {
    return this.db.collection('Posts').add({
      Author: author,
      AuthorRouterUrl: authorrouterurl,
      ContentMdUrl: contentmdurl,
      Date: new Date(),
      Description: description,
      Featured: featured,
      HomeImageUrl: imageurl,
      Title: title
    });
  }
}

