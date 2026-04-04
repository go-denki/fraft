import { Collection } from "../utils";
import { SaveCollectionInput } from "./SaveCollectionInput";
import styles from "../App.module.css";

interface CollectionsSidebarProps {
  collections: Collection[];
  selectedId: string;
  isDirty: boolean;
  saveInputVisible: boolean;
  saveInputValue: string;
  onSaveInputVisibleChange: (visible: boolean) => void;
  onSaveInputValueChange: (value: string) => void;
  onSaveCollection: () => void;
  onClickCollection: (id: string) => void;
  onDeleteCollection: (id: string) => void;
}

export function CollectionsSidebar({
  collections,
  selectedId,
  isDirty,
  saveInputVisible,
  saveInputValue,
  onSaveInputVisibleChange,
  onSaveInputValueChange,
  onSaveCollection,
  onClickCollection,
  onDeleteCollection,
}: CollectionsSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarTitle}>Collections</span>
        <div className={styles.sidebarActions}>
          <button
            className={styles.sidebarAddBtn}
            title="Save current config as a new collection"
            onClick={() => onSaveInputVisibleChange(true)}
          >
            +
          </button>
        </div>
      </div>

      <SaveCollectionInput
        visible={saveInputVisible}
        value={saveInputValue}
        onChange={onSaveInputValueChange}
        onSave={onSaveCollection}
        onCancel={() => {
          onSaveInputVisibleChange(false);
          onSaveInputValueChange("");
        }}
      />

      <ul className={styles.collectionList}>
        {collections.length === 0 && (
          <li className={styles.collectionEmpty}>No saved collections</li>
        )}
        {collections.map((col) => (
          <li
            key={col.id}
            className={`${styles.collectionItem} ${
              selectedId === col.id ? styles.collectionItemActive : ""
            }`}
            onClick={() => onClickCollection(col.id)}
          >
            <span className={styles.collectionItemName}>{col.name}</span>
            {selectedId === col.id && isDirty && (
              <span className={styles.dirtyDot} title="Unsaved changes" />
            )}
            <button
              className={styles.collectionItemDel}
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCollection(col.id);
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
