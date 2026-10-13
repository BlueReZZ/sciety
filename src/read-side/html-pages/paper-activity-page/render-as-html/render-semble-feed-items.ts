import { htmlEscape } from 'escape-goat';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { HtmlFragment, toHtmlFragment } from '../../../../types/html-fragment';
import { SembleUser } from '../../../../types/semble-activity';
import { templateDate } from '../../shared-components/date';
import {
  SembleConnectionMadeFeedItem, SembleFeedItem, SembleNoteAddedFeedItem, SembleSavedFeedItem,
} from '../view-model';

const maxNoteLength = 1000;

const connectionTypeVerbs: Record<string, string> = {
  SUPPORTS: 'supports',
  OPPOSES: 'opposes',
  ADDRESSES: 'addresses',
  HELPFUL: 'is helpful for',
  LEADS_TO: 'leads to',
  RELATED: 'is related to',
  SUPPLEMENT: 'supplements',
  EXPLAINER: 'explains',
  SAME_AS: 'is the same as',
  REFERENCES: 'references',
};

const describeConnectionType = (type: string) => connectionTypeVerbs[type] ?? 'is connected to';

const isHttpUrl = (url: string) => /^https?:\/\//i.test(url);

const renderUserLink = (user: SembleUser) => `<a href="${htmlEscape(user.profileUrl)}">${htmlEscape(user.name)}</a>`;

const renderAvatar = (user: SembleUser) => pipe(
  user.avatarUrl,
  O.match(
    () => '',
    (avatarUrl) => `<img class="activity-feed__item__avatar" src="${htmlEscape(avatarUrl)}" alt="" loading="lazy">`,
  ),
);

const renderHeader = (user: SembleUser, title: string, publishedAt: Date) => `
  <header class="activity-feed__item__header">
    ${renderAvatar(user)}
    <div class="activity-feed__item__meta">
      <div class="activity-feed__item__title">
        ${title}
      </div>
      ${templateDate(publishedAt, 'activity-feed__item__date')}
    </div>
  </header>
`;

const renderSaved = (feedItem: SembleSavedFeedItem) => `
  <div class="activity-feed__item__contents">
    ${renderHeader(
    feedItem.save.user,
    `<a href="${htmlEscape(feedItem.save.semblePageUrl)}">Saved to a library on Semble</a> by ${renderUserLink(feedItem.save.user)}`,
    feedItem.publishedAt,
  )}
  </div>
`;

const renderNoteBody = (text: string, semblePageUrl: string) => {
  const truncated = text.length > maxNoteLength;
  const shown = truncated ? `${text.substring(0, maxNoteLength)}…` : text;
  return `
    <div class="activity-feed__item__body">
      <p>${htmlEscape(shown).replace(/\n/g, '<br>')}</p>
      ${truncated ? `<p><a href="${htmlEscape(semblePageUrl)}">Read the whole note on Semble.</a></p>` : ''}
    </div>
  `;
};

const renderNoteAdded = (feedItem: SembleNoteAddedFeedItem) => `
  <div class="activity-feed__item__contents">
    ${renderHeader(
    feedItem.note.author,
    `<a href="${htmlEscape(feedItem.note.semblePageUrl)}">Note added on Semble</a> by ${renderUserLink(feedItem.note.author)}`,
    feedItem.publishedAt,
  )}
    ${renderNoteBody(feedItem.note.text, feedItem.note.semblePageUrl)}
  </div>
`;

const renderOtherLink = (connection: SembleConnectionMadeFeedItem['connection']) => {
  const label = htmlEscape(pipe(connection.otherTitle, O.getOrElse(() => connection.otherUrl)));
  return isHttpUrl(connection.otherUrl)
    ? `<a href="${htmlEscape(connection.otherUrl)}">${label}</a>`
    : label;
};

const renderConnectionSentence = (connection: SembleConnectionMadeFeedItem['connection']) => {
  const verb = describeConnectionType(connection.type);
  return connection.direction === 'incoming'
    ? `${renderOtherLink(connection)} ${verb} this preprint.`
    : `This preprint ${verb} ${renderOtherLink(connection)}.`;
};

const renderConnectionMade = (feedItem: SembleConnectionMadeFeedItem) => `
  <div class="activity-feed__item__contents">
    ${renderHeader(
    feedItem.connection.curator,
    `Connection made on Semble by ${renderUserLink(feedItem.connection.curator)}`,
    feedItem.publishedAt,
  )}
    <div class="activity-feed__item__body">
      <p>${renderConnectionSentence(feedItem.connection)}</p>
      ${pipe(
    feedItem.connection.note,
    O.match(
      () => '',
      (note) => `<p>${htmlEscape(note.substring(0, maxNoteLength))}</p>`,
    ),
  )}
    </div>
  </div>
`;

export const renderSembleFeedItem = (feedItem: SembleFeedItem): HtmlFragment => {
  switch (feedItem.type) {
    case 'semble-saved':
      return toHtmlFragment(renderSaved(feedItem));
    case 'semble-note-added':
      return toHtmlFragment(renderNoteAdded(feedItem));
    case 'semble-connection-made':
      return toHtmlFragment(renderConnectionMade(feedItem));
  }
};
