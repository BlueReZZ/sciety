import * as O from 'fp-ts/Option';
import { renderSembleFeedItem } from '../../../../../src/read-side/html-pages/paper-activity-page/render-as-html/render-semble-feed-items';
import { SembleUser } from '../../../../../src/types/semble-activity';

const user: SembleUser = {
  name: '<script>alert("name")</script>',
  handle: 'someone.example',
  profileUrl: 'https://semble.so/profile/someone.example',
  avatarUrl: O.some('https://cdn.example/avatar.jpg'),
};

const publishedAt = new Date('2026-07-17T15:48:13.791Z');

describe('render-semble-feed-items', () => {
  describe('given a note containing markup', () => {
    const html = renderSembleFeedItem({
      type: 'semble-note-added',
      publishedAt,
      note: {
        id: 'n1',
        author: user,
        text: '<img src=x onerror=alert(1)>\nsecond line',
        createdAt: publishedAt,
        semblePageUrl: 'https://semble.so/url?id=abc',
      },
    });

    it('escapes the note text and the author name', () => {
      expect(html).not.toContain('<img src=x');
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;<br>second line');
    });

    it('links to the author profile on Semble', () => {
      expect(html).toContain('href="https://semble.so/profile/someone.example"');
    });
  });

  describe('given a very long note', () => {
    const html = renderSembleFeedItem({
      type: 'semble-note-added',
      publishedAt,
      note: {
        id: 'n2', author: user, text: 'a'.repeat(5000), createdAt: publishedAt, semblePageUrl: 'https://semble.so/url?id=abc',
      },
    });

    it('truncates the note and links to the rest', () => {
      expect(html).not.toContain('a'.repeat(1001));
      expect(html).toContain('Read the whole note on Semble');
    });
  });

  describe('given an incoming connection', () => {
    const html = renderSembleFeedItem({
      type: 'semble-connection-made',
      publishedAt,
      connection: {
        id: 'c1',
        curator: user,
        type: 'SUPPLEMENT',
        note: O.none,
        createdAt: publishedAt,
        direction: 'incoming',
        otherUrl: 'https://doi.org/10.7717/peerj.21392',
        otherTitle: O.some('The published version'),
      },
    });

    it('describes the relationship in words, towards this preprint', () => {
      expect(html).toContain('<a href="https://doi.org/10.7717/peerj.21392">The published version</a> supplements this preprint.');
    });
  });

  describe('given an outgoing connection to a non-http URL', () => {
    const scriptUrl = ['javascript', 'alert(1)'].join(':');
    const html = renderSembleFeedItem({
      type: 'semble-connection-made',
      publishedAt,
      connection: {
        id: 'c2',
        curator: user,
        type: 'REFERENCES',
        note: O.none,
        createdAt: publishedAt,
        direction: 'outgoing',
        otherUrl: scriptUrl,
        otherTitle: O.none,
      },
    });

    it('does not render a link', () => {
      expect(html).not.toContain(`href="${scriptUrl}`);
      expect(html).toContain(`This preprint references ${scriptUrl}.`);
    });
  });

  describe('given a save', () => {
    const html = renderSembleFeedItem({
      type: 'semble-saved',
      publishedAt,
      save: {
        id: 's1', user, savedAt: publishedAt, semblePageUrl: 'https://semble.so/url?id=abc',
      },
    });

    it('links to the Semble page for the URL', () => {
      expect(html).toContain('<a href="https://semble.so/url?id=abc">Saved to a library on Semble</a>');
    });
  });
});
