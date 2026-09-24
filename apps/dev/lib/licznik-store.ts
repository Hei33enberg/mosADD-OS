/**
 * LICZNIK — singleton księgi paragonów dla apps/dev.
 * Plik NDJSON append-only w data/ (gitignored). Adapter do Supabase
 * wpięty zostanie po FINALE apki (fala wdrożeniowa).
 */
import path from 'node:path';
import { JsonFileReceiptsStore } from '@mosadd/licznik';

const DATA_FILE = path.join(process.cwd(), 'data', 'licznik-paragony.jsonl');

export const licznikStore = new JsonFileReceiptsStore(DATA_FILE);
