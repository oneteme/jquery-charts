import { VisualSnapshotStorage } from './visual-snapshot.storage';
import {
  DuplicateVisualSnapshotLabelError,
  VISUAL_SNAPSHOT_SCHEMA_VERSION,
  VISUAL_SNAPSHOT_STORAGE_KEY,
  VisualSnapshot,
  VisualSnapshotDraft,
} from './visual-snapshot.model';

class MemoryStorage {
  private readonly data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

class FailingWriteStorage extends MemoryStorage {
  override setItem(): void {
    throw new Error('QuotaExceededError');
  }
}

function draft(label: string, overrides: Partial<VisualSnapshotDraft> = {}): VisualSnapshotDraft {
  return {
    type: 'table',
    label,
    config: {},
    state: {},
    data: [],
    warnings: [],
    ...overrides,
  };
}

function snapshot(id: string, label: string, updatedAt: string): VisualSnapshot {
  return {
    id,
    schemaVersion: VISUAL_SNAPSHOT_SCHEMA_VERSION,
    type: 'chart',
    label,
    createdAt: updatedAt,
    updatedAt,
    config: {},
    state: {},
    data: [],
    warnings: [],
  };
}

describe('VisualSnapshotStorage', () => {
  let memory: MemoryStorage;
  let storage: VisualSnapshotStorage;

  beforeEach(() => {
    memory = new MemoryStorage();
    storage = new VisualSnapshotStorage({ storage: memory as unknown as Storage });
  });

  describe('create', () => {
    it('stores a snapshot with a generated id, schema version and timestamps', () => {
      const created = storage.create(draft('Vue initiale'));
      expect(created.id).toBeTruthy();
      expect(created.schemaVersion).toBe(VISUAL_SNAPSHOT_SCHEMA_VERSION);
      expect(created.createdAt).toBe(created.updatedAt);
      expect(storage.get(created.id)).toEqual(created);
    });

    it('normalises the label by trimming and collapsing whitespace', () => {
      expect(storage.create(draft('  Vue   du   jour ')).label).toBe('Vue du jour');
    });

    it('rejects an empty or whitespace-only label', () => {
      expect(() => storage.create(draft(''))).toThrowError(/label is required/);
      expect(() => storage.create(draft('   '))).toThrowError(/label is required/);
    });

    it('rejects a label already used, ignoring case and extra spaces', () => {
      storage.create(draft('Vue Test'));
      expect(() => storage.create(draft('  vue   test '))).toThrowError(DuplicateVisualSnapshotLabelError);
    });

    it('lists the most recently created snapshot first', () => {
      const first = storage.create(draft('Premier'));
      const second = storage.create(draft('Second'));
      expect(storage.list().map(s => s.id)).toEqual([second.id, first.id]);
    });

    it('throws when the serialized collection exceeds maxBytes and stores nothing', () => {
      const limited = new VisualSnapshotStorage({ storage: memory as unknown as Storage, maxBytes: 50 });
      expect(() => limited.create(draft('Trop grand', { data: ['x'.repeat(200)] })))
        .toThrowError(/storage limit exceeded/);
      expect(memory.getItem(VISUAL_SNAPSHOT_STORAGE_KEY)).toBeNull();
    });

    it('wraps write failures in a persistence error', () => {
      const failing = new VisualSnapshotStorage({ storage: new FailingWriteStorage() as unknown as Storage });
      expect(() => failing.create(draft('Vue'))).toThrowError(/Unable to persist visual snapshots/);
    });
  });

  describe('list and sorting', () => {
    it('sorts snapshots by updatedAt, most recent first', () => {
      memory.setItem(VISUAL_SNAPSHOT_STORAGE_KEY, JSON.stringify({
        schemaVersion: VISUAL_SNAPSHOT_SCHEMA_VERSION,
        snapshots: [
          snapshot('old', 'Ancienne', '2026-01-01T10:00:00.000Z'),
          snapshot('recent', 'Récente', '2026-03-01T10:00:00.000Z'),
        ],
      }));
      expect(storage.list().map(s => s.id)).toEqual(['recent', 'old']);
    });

    it('returns an empty list when nothing is stored', () => {
      expect(storage.list()).toEqual([]);
    });
  });

  describe('isLabelAvailable', () => {
    it('reports whether a normalised label is free', () => {
      storage.create(draft('Vue A'));
      expect(storage.isLabelAvailable('vue   a')).toBeFalse();
      expect(storage.isLabelAvailable('Vue B')).toBeTrue();
    });

    it('ignores the excluded snapshot id so a snapshot can keep its own label', () => {
      const created = storage.create(draft('Vue A'));
      expect(storage.isLabelAvailable('Vue A', created.id)).toBeTrue();
    });

    it('treats an empty label as unavailable', () => {
      expect(storage.isLabelAvailable('   ')).toBeFalse();
    });
  });

  describe('get', () => {
    it('returns null for an unknown id', () => {
      expect(storage.get('unknown')).toBeNull();
    });
  });

  describe('replace', () => {
    it('updates the stored snapshot and keeps its id and creation date', () => {
      const created = storage.create(draft('Vue', { config: { granularity: 'day' } }));
      storage.replace({ ...created, config: { granularity: 'hour' } });
      const stored = storage.get(created.id)!;
      expect(stored.config).toEqual({ granularity: 'hour' });
      expect(stored.createdAt).toBe(created.createdAt);
    });

    it('throws for an unknown snapshot', () => {
      const created = storage.create(draft('Vue'));
      expect(() => storage.replace({ ...created, id: 'missing' })).toThrowError(/Unknown visual snapshot/);
    });

    it('rejects an invalid snapshot', () => {
      const created = storage.create(draft('Vue'));
      expect(() => storage.replace({ ...created, type: 'pie' as unknown as 'table' })).toThrowError(/Invalid visual snapshot/);
    });
  });

  describe('rename', () => {
    it('changes the label of the snapshot', () => {
      const created = storage.create(draft('Ancien nom'));
      storage.rename(created.id, '  Nouveau   nom ');
      expect(storage.get(created.id)!.label).toBe('Nouveau nom');
    });

    it('rejects a label used by another snapshot', () => {
      storage.create(draft('Déjà pris'));
      const other = storage.create(draft('Autre'));
      expect(() => storage.rename(other.id, 'déjà  pris')).toThrowError(DuplicateVisualSnapshotLabelError);
    });

    it('ignores an empty label and keeps the current one', () => {
      const created = storage.create(draft('Vue'));
      storage.rename(created.id, '   ');
      expect(storage.get(created.id)!.label).toBe('Vue');
    });

    it('throws for an unknown snapshot', () => {
      expect(() => storage.rename('missing', 'Nom')).toThrowError(/Unknown visual snapshot/);
    });
  });

  describe('remove and clear', () => {
    it('removes only the requested snapshot', () => {
      const keep = storage.create(draft('Garder'));
      const drop = storage.create(draft('Supprimer'));
      storage.remove(drop.id);
      expect(storage.list().map(s => s.id)).toEqual([keep.id]);
    });

    it('does nothing when removing an unknown id', () => {
      const keep = storage.create(draft('Garder'));
      storage.remove('missing');
      expect(storage.list().map(s => s.id)).toEqual([keep.id]);
    });

    it('clear removes the whole collection key', () => {
      storage.create(draft('Vue'));
      storage.clear();
      expect(memory.getItem(VISUAL_SNAPSHOT_STORAGE_KEY)).toBeNull();
      expect(storage.list()).toEqual([]);
    });
  });

  describe('unreadable storage', () => {
    it('reads an empty list when the stored JSON is invalid', () => {
      memory.setItem(VISUAL_SNAPSHOT_STORAGE_KEY, '{not json');
      expect(storage.list()).toEqual([]);
    });

    it('accepts a new snapshot after invalid JSON was stored', () => {
      memory.setItem(VISUAL_SNAPSHOT_STORAGE_KEY, '{not json');
      expect(storage.create(draft('Après corruption')).label).toBe('Après corruption');
    });

    it('keeps invalid JSON in the backup key before freeing the active key', () => {
      memory.setItem(VISUAL_SNAPSHOT_STORAGE_KEY, '{not json');
      storage.list();
      expect(memory.getItem(`${VISUAL_SNAPSHOT_STORAGE_KEY}.backup`)).toBe('{not json');
      expect(memory.getItem(VISUAL_SNAPSHOT_STORAGE_KEY)).toBeNull();
    });

    it('keeps a snapshot payload from another schema version in the backup key', () => {
      const legacy = JSON.stringify({ schemaVersion: VISUAL_SNAPSHOT_SCHEMA_VERSION + 1, snapshots: [] });
      memory.setItem(VISUAL_SNAPSHOT_STORAGE_KEY, legacy);
      expect(storage.list()).toEqual([]);
      expect(memory.getItem(`${VISUAL_SNAPSHOT_STORAGE_KEY}.backup`)).toBe(legacy);
      expect(memory.getItem(VISUAL_SNAPSHOT_STORAGE_KEY)).toBeNull();
    });

    it('leaves the active key untouched when the backup cannot be written', () => {
      const failingBackup = new (class extends MemoryStorage {
        override setItem(key: string, value: string): void {
          if (key.endsWith('.backup')) throw new Error('QuotaExceededError');
          super.setItem(key, value);
        }
      })();
      failingBackup.setItem(VISUAL_SNAPSHOT_STORAGE_KEY, '{not json');
      const guarded = new VisualSnapshotStorage({ storage: failingBackup as unknown as Storage });
      expect(guarded.list()).toEqual([]);
      expect(failingBackup.getItem(VISUAL_SNAPSHOT_STORAGE_KEY)).toBe('{not json');
    });

    it('does not write the backup when the stored payload is valid', () => {
      storage.create(draft('Valide'));
      storage.list();
      expect(memory.getItem(`${VISUAL_SNAPSHOT_STORAGE_KEY}.backup`)).toBeNull();
    });
  });

  it('uses a custom storage key', () => {
    const custom = new VisualSnapshotStorage({ storage: memory as unknown as Storage, storageKey: 'custom_key' });
    custom.create(draft('Vue'));
    expect(memory.getItem('custom_key')).not.toBeNull();
    expect(memory.getItem(VISUAL_SNAPSHOT_STORAGE_KEY)).toBeNull();
  });
});
