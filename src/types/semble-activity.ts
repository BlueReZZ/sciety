import * as O from 'fp-ts/Option';

export type SembleUser = {
  name: string,
  handle: string,
  profileUrl: string,
  avatarUrl: O.Option<string>,
};

export type SembleSave = {
  id: string,
  user: SembleUser,
  savedAt: Date,
  semblePageUrl: string,
};

export type SembleNote = {
  id: string,
  author: SembleUser,
  text: string,
  createdAt: Date,
  semblePageUrl: string,
};

export type SembleConnection = {
  id: string,
  curator: SembleUser,
  type: string,
  note: O.Option<string>,
  createdAt: Date,
  direction: 'incoming' | 'outgoing',
  otherUrl: string,
  otherTitle: O.Option<string>,
};

export type SembleCollectionItem = {
  url: string,
  title: string,
};

export type SembleCollection = {
  id: string,
  name: string,
  owner: SembleUser,
  href: string,
  semblePageUrl: string,
  otherItems: ReadonlyArray<SembleCollectionItem>,
  otherItemCount: number,
};

export type SembleActivity = {
  saves: ReadonlyArray<SembleSave>,
  notes: ReadonlyArray<SembleNote>,
  connections: ReadonlyArray<SembleConnection>,
  collections: ReadonlyArray<SembleCollection>,
};

export const emptySembleActivity: SembleActivity = {
  saves: [],
  notes: [],
  connections: [],
  collections: [],
};
