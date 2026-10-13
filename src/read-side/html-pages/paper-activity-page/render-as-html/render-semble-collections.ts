import { htmlEscape } from 'escape-goat';
import * as RA from 'fp-ts/ReadonlyArray';
import { HtmlFragment, toHtmlFragment } from '../../../../types/html-fragment';
import { SembleCollection } from '../../../../types/semble-activity';
import { ViewModel } from '../view-model';

const maxItemsShownPerCollection = 5;

// Titles come from Crossref-style metadata and can contain markup such as <i>.
const toPlainText = (title: string) => title.replace(/<[^>]*>/g, '');

const isHttpUrl = (url: string) => /^https?:\/\//i.test(url);

const renderItem = (item: SembleCollection['otherItems'][number]) => {
  const title = htmlEscape(toPlainText(item.title));
  return isHttpUrl(item.url)
    ? `<li><a href="${htmlEscape(item.url)}">${title}</a></li>`
    : `<li>${title}</li>`;
};

const renderCollection = (collection: SembleCollection) => {
  const shown = collection.otherItems.slice(0, maxItemsShownPerCollection);
  const hiddenCount = collection.otherItemCount - shown.length;
  return `
    <div class="semble-collections__collection">
      <h3 class="semble-collections__collection-name">
        <a href="${htmlEscape(collection.href)}">${htmlEscape(collection.name)}</a>
        <span class="semble-collections__owner">(${htmlEscape(collection.owner.name)})</span>
      </h3>
      ${shown.length === 0 ? '<p>Nothing else has been added to this collection yet.</p>' : `
      <ul role="list" class="semble-collections__items">
        ${shown.map(renderItem).join('')}
      </ul>`}
      ${hiddenCount > 0 ? `<p><a href="${htmlEscape(collection.href)}">and ${hiddenCount} more on Semble</a></p>` : ''}
    </div>
  `;
};

export const renderSembleCollections = (collections: ViewModel['listedInSembleCollections']): HtmlFragment => {
  if (!RA.isNonEmpty(collections)) {
    return toHtmlFragment('');
  }
  return toHtmlFragment(`
    <section class="semble-collections">
      <h2 class="article-actions-heading">Also in these Semble collections</h2>
      ${collections.map(renderCollection).join('')}
      <a class="discuss-on-atmosphere-button" href="${htmlEscape(collections[0].semblePageUrl)}">Discuss this on the Atmosphere</a>
    </section>
  `);
};
