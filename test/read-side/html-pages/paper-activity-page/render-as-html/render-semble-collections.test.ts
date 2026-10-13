import * as O from 'fp-ts/Option';
import { renderSembleCollections } from '../../../../../src/read-side/html-pages/paper-activity-page/render-as-html/render-semble-collections';
import { SembleCollection } from '../../../../../src/types/semble-activity';

const collection = (overrides: Partial<SembleCollection> = {}): SembleCollection => ({
  id: 'c1',
  name: 'Symbioses',
  owner: {
    name: 'Someone', handle: 'someone.example', profileUrl: 'https://semble.so/profile/someone.example', avatarUrl: O.none,
  },
  href: 'https://semble.so/profile/someone.example/collections/abc',
  semblePageUrl: 'https://semble.so/url?id=https%3A%2F%2Fdoi.org%2F10.1101%2Fx',
  otherItems: [],
  otherItemCount: 0,
  ...overrides,
});

describe('render-semble-collections', () => {
  describe('given no collections', () => {
    it('renders nothing', () => {
      expect(renderSembleCollections([])).toBe('');
    });
  });

  describe('given a collection with other items', () => {
    const html = renderSembleCollections([collection({
      otherItems: [
        { url: 'https://doi.org/10.7717/peerj.21392', title: 'A <i>Mediterranean</i> study <script>x</script>' },
        { url: ['javascript', 'void(0)'].join(':'), title: 'Not a link' },
      ],
      otherItemCount: 2,
    })]);

    it('lists the other items as links with markup stripped and escaped', () => {
      expect(html).toContain('<a href="https://doi.org/10.7717/peerj.21392">A Mediterranean study x</a>');
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<i>');
    });

    it('does not link non-http URLs', () => {
      expect(html).not.toContain('href="javascript:');
      expect(html).toContain('<li>Not a link</li>');
    });

    it('offers a button to discuss on the Atmosphere via the Semble page for the preprint', () => {
      expect(html).toContain('href="https://semble.so/url?id=https%3A%2F%2Fdoi.org%2F10.1101%2Fx">Discuss this on the Atmosphere</a>');
    });
  });

  describe('given a collection with many other items', () => {
    const items = Array.from({ length: 12 }, (_, i) => ({ url: `https://example.com/${i}`, title: `Item ${i}` }));
    const html = renderSembleCollections([collection({ otherItems: items, otherItemCount: 12 })]);

    it('shows the first five and says how many more there are', () => {
      expect(html).toContain('Item 4');
      expect(html).not.toContain('Item 5<');
      expect(html).toContain('and 7 more on Semble');
    });
  });

  describe('given a collection containing only the preprint', () => {
    it('says nothing else has been added', () => {
      expect(renderSembleCollections([collection()])).toContain('Nothing else has been added to this collection yet.');
    });
  });
});
