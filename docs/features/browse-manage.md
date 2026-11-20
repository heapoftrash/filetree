---
title: Browse & manage
icon: material/folder
---

# Browse & manage

Browse your files in a familiar folder layout. Create folders, rename, move, copy, and delete files. Deleted items go to a trash folder so you can recover them before permanent removal.

## Folder tree and views

- **Folder tree sidebar** — Navigate quickly through your directory structure. Expand and collapse folders. A **Recent** list remembers the last folders you opened (browser `localStorage`).
- **List view** — Table layout with name, size, modified date. Sort by column.
- **Grid view** — Card layout suited for images and documents; image files show lazy-loaded preview thumbnails.
- **Remembered preferences** — List vs grid view and table sort column/direction are saved in the browser (`localStorage`) and restored on the next visit.
- **Type filters** — Toolbar chips filter the current folder to Images, Video, Audio, or Docs (folders stay visible).
- **README preview** — Entering a folder that contains `README.md` / `readme.txt` opens it in the preview pane automatically.

## File operations

| Action | Description |
|--------|-------------|
| **Create folder** | Add new directories anywhere in the tree |
| **Rename** | Rename files and folders. Supports overwrite when a target already exists |
| **Move** | Move items between folders. Drag-and-drop or use the move dialog |
| **Copy** | Copy files and folders recursively. Supports overwrite and custom destination name |
| **Delete** | Move to trash by default; use permanent delete to skip trash |
| **Restore** | Restore items from trash to their original location |
| **Download** | Download single files or multiple items as a ZIP archive |
| **Copy link** | Copy a time-limited signed download URL for a file to the clipboard |
| **Copy path** | Copy the current folder path (or selected item path) to the clipboard |

## Trash

Deleted items are moved to a `.trash` folder under the root. Each deletion creates a timestamped subfolder (e.g. `.trash/1736940645/`) to avoid conflicts. You can browse trash, restore items, or permanently delete from within trash. Items in trash can be permanently removed with the permanent delete option.

## Context menu

Right-click a file or folder in list or grid view for Open/Preview, Download, Copy link, Copy path, Rename, Copy/Move to…, Restore (in trash), and Delete.

## Keyboard

- **Space** — Quick Look: open the selected file in fullscreen preview (toggle). Esc exits fullscreen, then closes the preview.
- **Enter** — Open the selected folder
- **Delete** — Delete the selection
- **Arrow keys** — Previous/next file while preview is open

## Drag and drop

- **Upload** — Drag files from your desktop into the browser to upload to the current folder. Empty folders show a drop zone with a choose-files button.
- **Move/Copy** — Drag items within the file tree to move or copy them between folders
