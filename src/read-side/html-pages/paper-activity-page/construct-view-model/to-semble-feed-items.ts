import { SembleActivity } from '../../../../types/semble-activity';
import { SembleFeedItem } from '../view-model';

export const toSembleFeedItems = (activity: SembleActivity): ReadonlyArray<SembleFeedItem> => [
  ...activity.saves.map((save) => ({
    type: 'semble-saved' as const,
    publishedAt: save.savedAt,
    save,
  })),
  ...activity.notes.map((note) => ({
    type: 'semble-note-added' as const,
    publishedAt: note.createdAt,
    note,
  })),
  ...activity.connections.map((connection) => ({
    type: 'semble-connection-made' as const,
    publishedAt: connection.createdAt,
    connection,
  })),
];
