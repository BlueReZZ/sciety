import { sequenceS } from 'fp-ts/Apply';
import * as O from 'fp-ts/Option';
import * as RA from 'fp-ts/ReadonlyArray';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { constructContainingList } from './construct-containing-list';
import { constructRelatedArticles } from './construct-related-articles';
import { constructUserListManagement } from './construct-user-list-management';
import { feedSummary } from './feed-summary';
import { getFeedItemsByDateDescending } from './get-feed-items-by-date-descending';
import { CanonicalExpressionDoi, toDoiUrl } from '../../../../types/expression-doi';
import { ExpressionFrontMatter } from '../../../../types/expression-front-matter';
import { toHtmlFragment } from '../../../../types/html-fragment';
import { emptySembleActivity } from '../../../../types/semble-activity';
import { UserId } from '../../../../types/user-id';
import { constructFrontMatter } from '../../../construct-front-matter';
import { constructCurationStatements } from '../../../curation-statements';
import { findAllListsContainingPaper } from '../../../find-all-lists-containing-paper';
import { constructReviewingGroups } from '../../../reviewing-groups';
import { ConstructViewModel } from '../../construct-view-model';
import { detectLanguage } from '../../shared-components/lang-attribute';
import { ViewModel } from '../view-model';

const constructAbstract = (abstract: ExpressionFrontMatter['abstract']) => pipe(
  abstract,
  O.matchW(
    () => ({
      abstract: toHtmlFragment('No abstract available'),
      abstractLanguageCode: O.none,
    }),
    (a) => ({
      abstract: a,
      abstractLanguageCode: detectLanguage(a),
    }),
  ),
);

type Params = {
  latestExpressionDoi: CanonicalExpressionDoi,
  user: O.Option<{ id: UserId }>,
};

export const constructViewModel: ConstructViewModel<Params, ViewModel> = (dependencies) => (params) => pipe(
  params.latestExpressionDoi,
  dependencies.fetchPublishingHistory,
  TE.chainW((publishingHistory) => pipe(
    dependencies.fetchSembleActivity(publishingHistory),
    // Semble is a bonus source of activity, its unavailability must never break the page
    TE.getOrElse(() => T.of(emptySembleActivity)),
    TE.rightTask,
    TE.map((sembleActivity) => ({ publishingHistory, sembleActivity })),
  )),
  TE.chain(({ publishingHistory, sembleActivity }) => pipe(
    {
      frontMatter: pipe(
        publishingHistory,
        constructFrontMatter(dependencies),
      ),
      feedItemsByDateDescending: pipe(
        getFeedItemsByDateDescending(dependencies)(publishingHistory, sembleActivity),
        TE.rightTask,
      ),
      relatedArticles: pipe(
        constructRelatedArticles(publishingHistory, dependencies),
        TE.rightTask,
      ),
      curationStatements: pipe(
        constructCurationStatements(dependencies, publishingHistory),
        TE.rightTask,
      ),
      publishingHistory: TE.right(publishingHistory),
      sembleActivity: TE.right(sembleActivity),
    },
    sequenceS(TE.ApplyPar),
  )),
  TE.map((partial) => ({
    ...partial.frontMatter,
    titleLanguageCode: detectLanguage(partial.frontMatter.title),
    ...constructAbstract(partial.frontMatter.abstract),
    userListManagement: constructUserListManagement(params.user, dependencies, params.latestExpressionDoi),
    expressionFullTextHref: toDoiUrl(params.latestExpressionDoi),
    feedItemsByDateDescending: partial.feedItemsByDateDescending,
    ...feedSummary(partial.feedItemsByDateDescending),
    listedIn: pipe(
      partial.publishingHistory,
      findAllListsContainingPaper(dependencies),
      RA.map(constructContainingList(dependencies)),
    ),
    listedInSembleCollections: partial.sembleActivity.collections,
    relatedArticles: partial.relatedArticles,
    curationStatements: pipe(
      partial.curationStatements,
      RA.map((curationStatementWithGroupAndContent) => ({
        ...curationStatementWithGroupAndContent,
        fullText: curationStatementWithGroupAndContent.statement,
        fullTextLanguageCode: curationStatementWithGroupAndContent.statementLanguageCode,
      })),
    ),
    reviewingGroups: constructReviewingGroups(dependencies, partial.publishingHistory),
  })),
);
