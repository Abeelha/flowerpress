# FlowerPress – Backend & Editor Shaping (MVP)

A second pass at the design with more info on the backend. May want to integrate this with DESIGN.md

## 0\) Scope (MVP)

* **Goal**: Markdown-first editor where you can **drop CSVs and images** → assets are **uploaded seamlessly** → editor injects **markdown references** → FlowerShow renders.  
* **Storage**: **Object storage (R2)** for all assets and the `README.md` (no heavy processing yet).  
* **Sync**: GitHub is optional/future; keep a clean seam so we can add “markdown to GitHub, assets to R2” later.

---

## 1\) Core Domain Concepts

* **Space** (à la GitBook): durable content container (lives even if a Site is deleted).  
    
  * Think: `space_id` (UUID), owner, created\_at.


* **Document**: a dataset page (the thing you edit). One `README.md` \+ asset files.  
    
  * Pathing: `spaces/{space_id}/{document_slug}/README.md`, plus sibling assets.


* **Site**: a publish target that *references* a Space (rendered by FlowerShow).

MVP: support **one Document per Space** to keep it ultra simple. (It already forces the multi-file shape we need.)

---

## 2\) Storage Layout (R2)

```
r2://Flowerpress/
  spaces/
    {space_id}/
      {document_slug}/
        README.md
        assets/
          image-<hash>.png
          data-<hash>.csv
```

* Use **content-addressed-ish** filenames to avoid collisions and enable dedupe later.  
* Keep paths predictable; return absolute public URLs (or signed URLs) to the editor immediately after upload.

---

## 3\) Editor/Backend Contract (clean seam)

Define a tiny, stable interface the editor can call—easy to **mock** during editor work, and easy to **swap** backends (R2-only now, GH later).

### Editor-side calls

* `saveMarkdown(spaceId, docSlug, markdown: string) -> {version, etag}`  
* `uploadAsset(spaceId, docSlug, file: Blob) -> {url, relPath, mediaType, hash}`  
* `listAssets(spaceId, docSlug) -> [{relPath, mediaType, size, updatedAt}]`  
* `getMarkdown(spaceId, docSlug) -> {markdown, version}`

For now these hit Next.js API routes that talk to R2 (we hold the keys; no client creds).

### API endpoints (Next.js)

* `POST /api/spaces/:spaceId/docs/:slug/markdown`  
* `POST /api/spaces/:spaceId/docs/:slug/assets` (multipart)  
* `GET  /api/spaces/:spaceId/docs/:slug/markdown`  
* `GET  /api/spaces/:spaceId/docs/:slug/assets`

Auth: simple session token/JWT now; later project-level roles.

---

## 4\) Embed Syntax (marks, not components)

Keep markdown **portable** and renderer-agnostic. Two marks:

1. **Images** → standard markdown:

```
![Alt text](./assets/image-<hash>.png)
```

2. **Tables from CSV** → a **short, explicit mark**:

```
{{table: ./assets/data-<hash>.csv}}
```

* Minimal, grep-able, and easy for FlowerShow to transform.  
* Later we can extend: `{{table: ./assets/data.csv | paginate=50 | freezeHeader=true}}`

Alternative (also fine): fenced code blocks, but the short curly form is cleaner for non-code authors.

---

## 5\) Upload Flow (happy path)

1. User drags a file into the editor.  
     
2. Editor calls `uploadAsset(...)`.  
     
3. API streams to R2, returns `{url, relPath, mediaType}`.  
     
4. Editor inserts the correct **mark** in the markdown at cursor:  
     
   * `image/*` → `![alt](./assets/...)`  
   * `text/csv` → `{{table: ./assets/...}}`

   

5. Editor’s **autosave** caches the doc locally; **Save/Publish** calls `saveMarkdown(...)`.

---

## 6\) Autosave & Versions

* **Local autosave** (IndexedDB or localStorage) every \~2s after idle to prevent loss.  
* Server `saveMarkdown` returns `{version, etag}`; the editor keeps the latest to avoid blind overwrites.  
* On conflict → simple “newer version exists” toast \+ offer to diff (future).

---

## 7\) Rendering (publish path)

* FlowerShow build step reads:  
    
  * `README.md` (markdown)  
  * replaces `{{table: ...}}` with an **interactive table** (client-side hydration minimal).  
  * standard images as usual.


* No CSV pre-processing yet; render directly (row/col infer with the table lib).

---

## 8\) Non-goals (MVP)

* No background ingestion pipeline (no schema inference, thumbnails, dedupe DB).  
* No real-time collaboration (Liveblocks later).  
* No GitHub sync (keep seam; add later: “markdown → GitHub, assets → R2”).

---

## 9\) Guardrails & Limits (sane defaults)

* Max file size: images 10 MB, CSV 25 MB (config).  
* Allowed types: `image/*`, `text/csv`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (XLS/XLSX → store now; table preview only for CSV in MVP).  
* Rate limits: per-user burst \+ daily to protect R2.

---

## 10\) Minimal Data Model (DB)

A thin relational table just to list Spaces/Documents (R2 is source of truth for content):

* `spaces(id, owner_id, created_at, name?)`  
* `documents(id, space_id, slug, title?, last_version?, updated_at)`  
* (Optional) `assets(space_id, doc_id, rel_path, media_type, size, hash, updated_at)` for listing without listing from R2.

MVP could skip `assets` table; list from R2 prefix when needed.

---

## 11\) Acceptance Criteria (MVP)

* I can create a **Space** and one **Document**.  
* I can type markdown; refresh the page and it’s still there (autosave).  
* I can **drag a PNG** → see it appear inline; the markdown shows `![...](/assets/...)`.  
* I can **drag a CSV** → an interactive table appears; markdown shows `{{table: ...}}`.  
* Clicking **Save** persists `README.md` to R2; reopening loads the exact content.  
* I can click **Publish**; FlowerShow renders a public page with the table \+ images.

---

## 12\) Editor Tech Notes (pragmatic)

* **BlockNote/TipTap** for the Notion-like UX.  
    
* Maintain a **markdown source of truth**:  
    
  * Use TipTap → Markdown serializer (ProseMirror↔Markdown).  
  * On asset insert, mutate the markdown string with the mark at cursor location (keeps it predictable).


* Keep **paste-from-clipboard image** support (read as Blob → `uploadAsset`).

---

## 13\) Future Hooks (not implemented now)

* **Processing pipeline** (CSV schema, stats, validation, thumbnails).  
* **GitHub**: `saveMarkdown` can branch to “push to GH” while `uploadAsset` remains R2.  
* **Collab**: Live cursors, presence, history timeline.  
* **Charts**: `{{chart: ./assets/data.csv | x=year | y=price | type=line}}`.
