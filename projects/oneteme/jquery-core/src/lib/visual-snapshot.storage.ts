import {
  isVisualSnapshot,
  VISUAL_SNAPSHOT_DEFAULT_MAX_BYTES,
  VISUAL_SNAPSHOT_SCHEMA_VERSION,
  VISUAL_SNAPSHOT_STORAGE_KEY,
  VisualSnapshot,
  VisualSnapshotDraft,
  VisualSnapshotCollection,
  VisualSnapshotStorageOptions,
  DuplicateVisualSnapshotLabelError,
} from './visual-snapshot.model';

export class VisualSnapshotStorage {
  private readonly storage: Storage | null;
  private readonly storageKey: string;
  private readonly maxBytes: number;

  constructor(options: VisualSnapshotStorageOptions = {}) {
    this.storage = options.storage ?? getBrowserStorage();
    this.storageKey = options.storageKey ?? VISUAL_SNAPSHOT_STORAGE_KEY;
    this.maxBytes = options.maxBytes ?? VISUAL_SNAPSHOT_DEFAULT_MAX_BYTES;
  }

  list(): VisualSnapshot[] {
    return this.readCollection().snapshots
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  get(snapshotId: string): VisualSnapshot | null {
    return this.readCollection().snapshots.find(snapshot => snapshot.id === snapshotId) ?? null;
  }

  isLabelAvailable(label: string, excludeSnapshotId?: string): boolean {
    const normalizedLabel = normalizeLabelKey(label);
    if (!normalizedLabel) return false;
    return !this.readCollection().snapshots.some(snapshot =>
      snapshot.id !== excludeSnapshotId && normalizeLabelKey(snapshot.label) === normalizedLabel,
    );
  }

  create(snapshot: VisualSnapshotDraft): VisualSnapshot {
    const normalizedLabel = normalizeLabel(snapshot.label);
    if (!normalizedLabel) throw new Error('A visual snapshot label is required.');
    const collection = this.readCollection();
    if (!this.isLabelAvailable(normalizedLabel)) {
      throw new DuplicateVisualSnapshotLabelError(normalizedLabel);
    }
    const now = new Date().toISOString();
    const created: VisualSnapshot = {
      ...snapshot,
      label: normalizedLabel,
      id: createId(),
      schemaVersion: VISUAL_SNAPSHOT_SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
    };
    this.writeCollection({
      schemaVersion: VISUAL_SNAPSHOT_SCHEMA_VERSION,
      snapshots: [created, ...collection.snapshots],
    });
    return created;
  }

  replace(snapshot: VisualSnapshot): void {
    if (!isVisualSnapshot(snapshot)) throw new Error('Invalid visual snapshot');
    const snapshots = this.readCollection().snapshots;
    const index = snapshots.findIndex(item => item.id === snapshot.id);
    if (index === -1) throw new Error(`Unknown visual snapshot: ${snapshot.id}`);
    snapshots[index] = { ...snapshot, updatedAt: new Date().toISOString() };
    this.writeCollection({ schemaVersion: VISUAL_SNAPSHOT_SCHEMA_VERSION, snapshots });
  }

  rename(snapshotId: string, label: string): void {
    const snapshot = this.get(snapshotId);
    if (!snapshot) throw new Error(`Unknown visual snapshot: ${snapshotId}`);
    const normalizedLabel = normalizeLabel(label);
    if (!normalizedLabel) return;
    if (!this.isLabelAvailable(normalizedLabel, snapshotId)) {
      throw new DuplicateVisualSnapshotLabelError(normalizedLabel);
    }
    this.replace({ ...snapshot, label: normalizedLabel });
  }

  remove(snapshotId: string): void {
    this.writeCollection({
      schemaVersion: VISUAL_SNAPSHOT_SCHEMA_VERSION,
      snapshots: this.readCollection().snapshots.filter(snapshot => snapshot.id !== snapshotId),
    });
  }

  clear(): void {
    try {
      this.storage?.removeItem(this.storageKey);
    } catch {
      // Storage peut être indisponible en mode privé ou dans un contexte bloqué.
    }
  }

  private readCollection(): VisualSnapshotCollection {
    if (!this.storage) return emptyCollection();
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return emptyCollection();
      const parsed: unknown = JSON.parse(raw);
      if (!isCollection(parsed)) {
        this.clear();
        return emptyCollection();
      }
      return parsed;
    } catch {
      return emptyCollection();
    }
  }

  private writeCollection(collection: VisualSnapshotCollection): void {
    if (!this.storage) throw new Error('Visual snapshot storage is unavailable');
    const serialized = JSON.stringify(collection);
    if (serialized.length > this.maxBytes) {
      throw new Error(`Visual snapshot storage limit exceeded (${this.maxBytes} bytes)`);
    }
    try {
      this.storage.setItem(this.storageKey, serialized);
    } catch (error) {
      throw new Error(`Unable to persist visual snapshots: ${String(error)}`);
    }
  }
}

function normalizeLabel(label: string): string {
  return label.trim().replace(/\s+/g, ' ');
}

function normalizeLabelKey(label: string): string {
  return normalizeLabel(label).toLowerCase();
}

function isCollection(value: unknown): value is VisualSnapshotCollection {
  if (!value || typeof value !== 'object') return false;
  const collection = value as Partial<VisualSnapshotCollection>;
  return collection.schemaVersion === VISUAL_SNAPSHOT_SCHEMA_VERSION
    && Array.isArray(collection.snapshots)
    && collection.snapshots.every(isVisualSnapshot);
}

function emptyCollection(): VisualSnapshotCollection {
  return { schemaVersion: VISUAL_SNAPSHOT_SCHEMA_VERSION, snapshots: [] };
}

function getBrowserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Utilise le fallback si randomUUID est indisponible.
  }
  return `snapshot-${Date.now()}-${fallbackId++}`;
}

let fallbackId = 0;
