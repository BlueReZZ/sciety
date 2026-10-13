import { URLSearchParams } from 'url';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as RA from 'fp-ts/ReadonlyArray';
import * as TE from 'fp-ts/TaskEither';
import { flow, pipe } from 'fp-ts/function';
import * as t from 'io-ts';
import {
  collectionContentsResponseCodec,
  collectionsResponseCodec,
  connectionsResponseCodec,
  librariesResponseCodec,
  notesResponseCodec,
  searchResponseCodec,
  sembleUserCodec,
} from './semble-response-codecs';
import { urlReferencesDoi } from './url-references-doi';
import { Logger } from '../../logger';
import * as DE from '../../types/data-error';
import * as PH from '../../types/publishing-history';
import {
  emptySembleActivity,
  SembleActivity,
  SembleCollection,
  SembleCollectionItem,
  SembleConnection,
  SembleNote,
  SembleSave,
  SembleUser,
} from '../../types/semble-activity';
import { decodeAndLogFailures } from '../decode-and-log-failures';
import { ExternalQueries } from '../external-queries';
import { QueryExternalService } from '../query-external-service';

const apiBase = 'https://api.semble.so/xrpc/network.cosmik';
const webBase = 'https://semble.so';
const pageSize = 50;
const maxUrlsPerPaper = 10;

const sembleHeaders = { 'X-Semble-Client': 'sciety' };

const toUser = (user: t.TypeOf<typeof sembleUserCodec>): SembleUser => ({
  name: user.name,
  handle: user.handle,
  profileUrl: `${webBase}/profile/${encodeURIComponent(user.handle)}`,
  avatarUrl: O.fromNullable(user.avatarUrl),
});

const semblePageUrl = (url: string) => `${webBase}/url?id=${encodeURIComponent(url)}`;

const rkeyOfAtUri = (uri: string) => uri.substring(uri.lastIndexOf('/') + 1);

const dedupeById = <A extends { id: string }>(items: ReadonlyArray<A>): ReadonlyArray<A> => [
  ...new Map(items.map((item) => [item.id, item])).values(),
];

const flattenAndDedupe = <A extends { id: string }>(items: ReadonlyArray<ReadonlyArray<A>>) => dedupeById(items.flat());

const referencesThisPaper = (history: PH.PublishingHistory, savedUrls: ReadonlyArray<string>) => (url: string) => (
  savedUrls.includes(url) || PH.getAllExpressionDois(history).some((doi) => urlReferencesDoi(doi)(url))
);

export const createFetchSembleActivity = (
  queryExternalService: QueryExternalService,
  logger: Logger,
): ExternalQueries['fetchSembleActivity'] => {
  const query = <C extends t.Mixed>(
    endpoint: string,
    codec: C,
    params: Record<string, string>,
  ): TE.TaskEither<DE.DataError, t.TypeOf<C>> => {
    const url = `${apiBase}.${endpoint}?${new URLSearchParams({ ...params, limit: String(pageSize) }).toString()}`;
    return pipe(
      url,
      queryExternalService('debug', sembleHeaders),
      TE.chainEitherKW(flow(
        decodeAndLogFailures(logger, codec, { url }),
        E.mapLeft(() => DE.unavailable),
      )),
    ) as TE.TaskEither<DE.DataError, t.TypeOf<C>>;
  };

  const softly = <A>(fallback: A) => (te: TE.TaskEither<DE.DataError, A>) => pipe(
    te,
    TE.orElse(() => TE.right(fallback)),
  );

  const findSavedUrls = (history: PH.PublishingHistory) => pipe(
    PH.getAllExpressionDois(history),
    TE.traverseArray((doi) => pipe(
      query('card.search', searchResponseCodec, { searchQuery: doi }),
      TE.map(({ urls }) => pipe(
        urls,
        RA.map((u) => u.url),
        RA.filter(urlReferencesDoi(doi)),
      )),
    )),
    TE.map(flow(RA.flatten, (urls) => [...new Set(urls)], (urls) => urls.slice(0, maxUrlsPerPaper))),
  );

  const fetchSaves = (url: string): TE.TaskEither<never, ReadonlyArray<SembleSave>> => pipe(
    query('card.getLibrariesForUrl', librariesResponseCodec, { url }),
    TE.map(({ libraries }) => libraries.map((library) => ({
      id: library.user.handle,
      user: toUser(library.user),
      savedAt: new Date(library.card.createdAt),
      semblePageUrl: semblePageUrl(url),
    }))),
    softly<ReadonlyArray<SembleSave>>([]),
  );

  const fetchNotes = (url: string): TE.TaskEither<never, ReadonlyArray<SembleNote>> => pipe(
    query('card.getNoteCardsForUrl', notesResponseCodec, { url }),
    TE.map(({ notes }) => notes.map((note) => ({
      id: note.id,
      author: toUser(note.author),
      text: note.note,
      createdAt: new Date(note.createdAt),
      semblePageUrl: semblePageUrl(url),
    }))),
    softly<ReadonlyArray<SembleNote>>([]),
  );

  const fetchConnections = (url: string): TE.TaskEither<never, ReadonlyArray<SembleConnection>> => pipe(
    query('connection.getForUrl', connectionsResponseCodec, { url, direction: 'both' }),
    TE.map(({ connections }) => connections.map(({ connection, source, target }): SembleConnection => {
      const ourSide = source.url === url ? 'outgoing' : 'incoming';
      const other = ourSide === 'outgoing' ? target : source;
      return {
        id: connection.id,
        curator: toUser(connection.curator),
        type: connection.type,
        note: O.fromNullable(connection.note),
        createdAt: new Date(connection.createdAt),
        direction: ourSide,
        otherUrl: other.url,
        otherTitle: O.fromNullable(other.metadata?.title),
      };
    })),
    softly<ReadonlyArray<SembleConnection>>([]),
  );

  const fetchOtherItems = (isThisPaper: (url: string) => boolean) => (collectionId: string) => pipe(
    query('collection.get', collectionContentsResponseCodec, { collectionId }),
    TE.map(({ urlCards }) => pipe(
      urlCards,
      RA.filter((card) => !isThisPaper(card.url)),
      RA.map((card) => ({ url: card.url, title: card.cardContent?.title ?? card.url })),
    )),
    softly<ReadonlyArray<SembleCollectionItem>>([]),
  );

  const fetchCollections = (isThisPaper: (url: string) => boolean) => (url: string) => pipe(
    query('collection.getForUrl', collectionsResponseCodec, { url }),
    TE.map(({ collections }) => collections),
    softly<ReadonlyArray<t.TypeOf<typeof collectionsResponseCodec>['collections'][number]>>([]),
    TE.chain(TE.traverseArray((collection) => pipe(
      collection.id,
      fetchOtherItems(isThisPaper),
      TE.map((otherItems): SembleCollection => ({
        id: collection.id,
        name: collection.name,
        owner: toUser(collection.author),
        href: `${webBase}/profile/${encodeURIComponent(collection.author.handle)}/collections/${rkeyOfAtUri(collection.uri)}`,
        semblePageUrl: semblePageUrl(url),
        otherItems,
        otherItemCount: otherItems.length,
      })),
    ))),
  );

  return (history) => pipe(
    findSavedUrls(history),
    TE.chainW((urls) => (urls.length === 0 ? TE.right(emptySembleActivity) : pipe(
      {
        saves: pipe(urls, TE.traverseArray(fetchSaves)),
        notes: pipe(urls, TE.traverseArray(fetchNotes)),
        connections: pipe(urls, TE.traverseArray(fetchConnections)),
        collections: pipe(urls, TE.traverseArray(fetchCollections(referencesThisPaper(history, urls)))),
      },
      (parts) => pipe(
        parts.saves,
        TE.bindTo('saves'),
        TE.bind('notes', () => parts.notes),
        TE.bind('connections', () => parts.connections),
        TE.bind('collections', () => parts.collections),
      ),
      TE.map((all): SembleActivity => ({
        // the same person may have saved several URL variants of the same paper
        saves: [...new Map(
          all.saves.flat().sort((a, b) => a.savedAt.getTime() - b.savedAt.getTime()).map((s) => [s.id, s]),
        ).values()],
        notes: flattenAndDedupe(all.notes),
        connections: flattenAndDedupe(all.connections),
        collections: flattenAndDedupe(all.collections),
      })),
    ))),
  );
};
