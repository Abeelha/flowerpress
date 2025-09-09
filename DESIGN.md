# DESIGN

🔑 **User experience in one sentence**: *As easy as writing a Substack post, but with CSVs that turn into tables and images that just work — all persisted as markdown + assets.*

## User Stories (MVP)

**As a data curator, I want to…**

1. **\[An editor to easily\] Write a markdown README** with headings, paragraphs, links, and lists. (without necessarily even knowing markdown)  
     
2. **Drop an image file** into the editor:  
     
   * Backend: store image as `image.png` in same dataset folder.  
   * Markdown: insert `![alt text](./image.png)`.  
   * Frontend: display inline.

3. **Drop a CSV file** into the editor:  
     
   * Backend: store as `data.csv` in same dataset folder.  
   * Markdown: insert reference (e.g. `{{table: data.csv}}`).  
   * Frontend: render as interactive table (sortable, filterable).

4. **Publish the document** so others can view it as a data-rich web page.
   
5. **Come back later and edit** — add more notes, update data, refine narrative.

---

## Core UX Principles

* **Markdown-first**: every document \= persisted as a `README.md`.  
* **Inline preview, stored separately**: assets (CSV, images) live alongside, referenced in markdown.  
* **Frictionless drop-in**: images/CSVs drag-drop → instantly embedded.  
* **Simple structure** (per dataset/project):

```
dataset-name/
  README.md
  chart.png
  data.csv
```

## Architecture (MVP)

* **Frontend editor**:  
  * BlockNote/TipTap → Notion-like editing, markdown persistence.  
  * Drag-drop for CSV/images.  
* **Backend storage**:  
  * Markdown file \+ assets → persisted in object storage (e.g. Cloudflare R2, S3).  
  * Metadata → optional (dataset title, tags).  
* **Rendering**:  
  * Markdown → static HTML (via FlowerShow pipeline).  
  * CSV → rendered as interactive table (using DataTables or similar).  
  * Images → rendered inline.

## 6 Out of Scope (Future Extensions)

* Data visualizations/charts (Observable-style).  
* SQL queries \+ live data connections (Evidence.dev style).  
* Marketplace features (selling datasets).  
* Collaborative editing / real-time presence (Liveblocks).


## FlowerPress MVP workflow

How a user would interact with the system, step by step to publish a Data-Rich Document.

### Step 1. Open Editor

* User clicks **“New Document”**.
* Editor opens with a blank markdown canvas:

```markdown
# Untitled Document
```

---

### Step 2. Write Narrative in Markdown

* User types directly in editor (markdown syntax supported, or toolbar for bold/italic/links).

```markdown
# Global Oil Prices (1990–2025)

This dataset tracks crude oil prices over the last 35 years.  
Source: U.S. Energy Information Administration.
```

---

### Step 3. Drop in a CSV

* User drags `oil-prices.csv` into the editor.
* **Backend action**:

  * File stored as `oil-prices.csv` in same folder.
  * Markdown updated with special embed syntax:

```markdown
# Global Oil Prices (1990–2025)

This dataset tracks crude oil prices over the last 35 years.  
Source: U.S. Energy Information Administration.

{{table: oil-prices.csv}}
```

* **Frontend rendering**:

  * Displays an interactive table (sortable, filterable).
  * Example:

| Year | Price (USD/barrel) |
| ---- | ------------------ |
| 1990 | 23.19              |
| 1991 | 20.03              |
| 1992 | 19.25              |

---

### Step 4. Drop in an Image

* User drags `oil-chart.png` into the editor.
* **Backend action**:

  * File stored as `oil-chart.png`.
  * Markdown updated:

```markdown
![Oil price trend](./oil-chart.png)
```

* **Frontend rendering**: image displayed inline.

### Step 5. Publish

* User clicks **“Publish”**.
* Florist generates output as:

  * **Folder structure**:

    ```
    global-oil-prices/
      README.md
      oil-prices.csv
      oil-chart.png
    ```
  * **Web page rendering**:

    * Title + markdown text.
    * Interactive table from CSV.
    * Inline image preview.

### Step 6. Return & Edit

* User reopens document.
* Markdown + assets loaded back into editor.
* User can add commentary, update CSV, or replace image.
* Republishing overwrites files, keeping clean structure.

---

# Appendix: Inspirations

* **Evidence.dev** → markdown \+ data storytelling.  
* **ObservableHQ.com** → data-first interactive docs.  
* **Substack** → effortless publishing flow.  
* **GitHub README** → simple repo-based structure.
