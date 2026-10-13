const escapeForRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Semble matches URLs exactly as saved, and users save many forms of the same preprint, e.g.
// https://doi.org/10.1101/2024.12.06.627200
// https://www.biorxiv.org/content/10.1101/2024.12.06.627200v2.full.pdf
// https://reader.openrxivlabs.org/content/10.1101/2024.12.06.627200v1?utm_source=biorxiv
// Semble's search is a substring match, so we must discard accidental matches
// such as 10.1101/390153 in 10.1101/3901534.
export const urlReferencesDoi = (doi: string) => (url: string): boolean => new RegExp(
  `(?:^|[/=:])${escapeForRegExp(doi)}(?:v\\d+)?(?![0-9a-z-])`,
  'i',
).test(url);
