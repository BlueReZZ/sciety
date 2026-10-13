import { urlReferencesDoi } from '../../../src/third-parties/fetch-semble-activity';

describe('url-references-doi', () => {
  const doi = '10.1101/2024.12.06.627200';

  describe.each([
    ['a doi.org link', 'https://doi.org/10.1101/2024.12.06.627200'],
    ['a versioned biorxiv link', 'https://www.biorxiv.org/content/10.1101/2024.12.06.627200v2'],
    ['a full text link', 'https://www.biorxiv.org/content/10.1101/2024.12.06.627200v1.full'],
    ['a pdf link', 'https://www.biorxiv.org/content/10.1101/2024.12.06.627200v1.full.pdf'],
    ['a link with a query string', 'https://reader.openrxivlabs.org/content/10.1101/2024.12.06.627200v1?utm_source=biorxiv'],
    ['a link differing only by case', 'https://doi.org/10.1101/2024.12.06.627200'.toUpperCase()],
  ])('given %s', (_, url) => {
    it('references the doi', () => {
      expect(urlReferencesDoi(doi)(url)).toBe(true);
    });
  });

  describe.each([
    ['a longer DOI that merely starts the same', 'https://doi.org/10.1101/2024.12.06.6272001'],
    ['a DOI with a suffix', 'https://doi.org/10.1101/2024.12.06.627200-extra'],
    ['an unrelated URL', 'https://example.com/'],
    ['a regexp lookalike', 'https://doi.org/10x1101/2024y12z06a627200'],
  ])('given %s', (_, url) => {
    it('does not reference the doi', () => {
      expect(urlReferencesDoi(doi)(url)).toBe(false);
    });
  });

  it('does not confuse a short numeric DOI with a longer one', () => {
    expect(urlReferencesDoi('10.1101/390153')('https://www.biorxiv.org/content/10.1101/3901534v1')).toBe(false);
    expect(urlReferencesDoi('10.1101/390153')('https://www.biorxiv.org/content/10.1101/390153v4')).toBe(true);
  });
});
