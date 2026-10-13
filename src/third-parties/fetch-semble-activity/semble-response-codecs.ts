import * as t from 'io-ts';

export const sembleUserCodec = t.intersection([
  t.type({
    name: t.string,
    handle: t.string,
  }),
  t.partial({
    avatarUrl: t.string,
  }),
]);

const pagination = t.type({ hasMore: t.boolean });

export const searchResponseCodec = t.type({
  urls: t.array(t.type({ url: t.string })),
}, 'sembleSearchResponseCodec');

export const librariesResponseCodec = t.type({
  libraries: t.array(t.type({
    user: sembleUserCodec,
    card: t.type({
      id: t.string,
      createdAt: t.string,
    }),
  })),
  pagination,
}, 'sembleLibrariesResponseCodec');

export const notesResponseCodec = t.type({
  notes: t.array(t.type({
    id: t.string,
    note: t.string,
    author: sembleUserCodec,
    createdAt: t.string,
  })),
  pagination,
}, 'sembleNotesResponseCodec');

const connectedUrl = t.intersection([
  t.type({ url: t.string }),
  t.partial({ metadata: t.partial({ title: t.string }) }),
]);

export const connectionsResponseCodec = t.type({
  connections: t.array(t.type({
    connection: t.intersection([
      t.type({
        id: t.string,
        type: t.string,
        createdAt: t.string,
        curator: sembleUserCodec,
      }),
      t.partial({ note: t.string }),
    ]),
    source: connectedUrl,
    target: connectedUrl,
  })),
  pagination,
}, 'sembleConnectionsResponseCodec');

export const collectionsResponseCodec = t.type({
  collections: t.array(t.type({
    id: t.string,
    uri: t.string,
    name: t.string,
    author: sembleUserCodec,
  })),
  pagination,
}, 'sembleCollectionsResponseCodec');

export const collectionContentsResponseCodec = t.type({
  urlCards: t.array(t.intersection([
    t.type({ url: t.string }),
    t.partial({ cardContent: t.partial({ title: t.string }) }),
  ])),
  pagination,
}, 'sembleCollectionContentsResponseCodec');
