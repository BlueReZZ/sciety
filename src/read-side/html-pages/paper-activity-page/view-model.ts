import { URL } from 'url';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { ArticleAuthors } from '../../../types/article-authors';
import { ArticleServer } from '../../../types/article-server';
import * as EL from '../../../types/evaluation-locator';
import { ExpressionDoi } from '../../../types/expression-doi';
import { HtmlFragment } from '../../../types/html-fragment';
import { ListId } from '../../../types/list-id';
import { SanitisedHtmlFragment } from '../../../types/sanitised-html-fragment';
import {
  SembleCollection, SembleConnection, SembleNote, SembleSave,
} from '../../../types/semble-activity';
import { CurationStatement } from '../../curation-statements';
import { ArticleCardViewModel } from '../shared-components/article-card';
import { GroupLinkWithLogoViewModel } from '../shared-components/group-link';
import { LanguageCode } from '../shared-components/lang-attribute';

export type GroupDetails = {
  name: string,
  href: string,
  avatarSrc: string,
};

export type EvaluationPublishedFeedItem = {
  type: 'evaluation-published',
  id: EL.EvaluationLocator,
  sourceHref: O.Option<URL>,
  publishedAt: Date,
  groupDetails: O.Option<GroupDetails>,
  digest: O.Option<SanitisedHtmlFragment>,
  digestLanguageCode: O.Option<LanguageCode>,
};

export type ExpressionPublishedFeedItem = {
  type: 'expression-published',
  source: URL,
  publishedAt: Date,
  server: O.Option<ArticleServer>,
  doi: ExpressionDoi,
  publishedTo: string,
};

export type CassyniSeminarPublishedFeedItem = {
  type: 'cassyni-seminar-published',
  publishedAt: Date,
  doiLink: string,
  videoLink: string,
  imageUrl: string,
  title: string,
  reviewedPaperDoi: ExpressionDoi,
};

export type SembleSavedFeedItem = {
  type: 'semble-saved',
  publishedAt: Date,
  save: SembleSave,
};

export type SembleNoteAddedFeedItem = {
  type: 'semble-note-added',
  publishedAt: Date,
  note: SembleNote,
};

export type SembleConnectionMadeFeedItem = {
  type: 'semble-connection-made',
  publishedAt: Date,
  connection: SembleConnection,
};

export type SembleFeedItem =
  | SembleSavedFeedItem
  | SembleNoteAddedFeedItem
  | SembleConnectionMadeFeedItem;

export type FeedItem =
  | EvaluationPublishedFeedItem
  | ExpressionPublishedFeedItem
  | CassyniSeminarPublishedFeedItem
  | SembleFeedItem;

type ListSummary = {
  listName: string,
  listId: ListId,
  listHref: string,
};

export type SaveArticleCta = {
  saveArticleHref: string,
};

type ContainingList = ListSummary;

export type LoggedInUserListManagement = E.Either<SaveArticleCta, ContainingList>;

export type ViewModel = {
  title: string,
  titleLanguageCode: O.Option<LanguageCode>,
  authors: ArticleAuthors,
  expressionFullTextHref: string,
  abstract: HtmlFragment,
  abstractLanguageCode: O.Option<LanguageCode>,
  evaluationCount: number,
  latestVersion: O.Option<Date>,
  latestActivity: O.Option<Date>,
  feedItemsByDateDescending: ReadonlyArray<FeedItem>,
  userListManagement: O.Option<LoggedInUserListManagement>,
  listedIn: ReadonlyArray<{ listId: ListId, listName: string, listOwnerName: string, listHref: string }>,
  listedInSembleCollections: ReadonlyArray<SembleCollection>,
  relatedArticles: O.Option<ReadonlyArray<ArticleCardViewModel>>,
  curationStatements: ReadonlyArray<CurationStatement>,
  reviewingGroups: ReadonlyArray<GroupLinkWithLogoViewModel>,
};
