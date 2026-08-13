KAEL — FINANCE ACADEMY SITE PACKAGE
===================================

This package is prepared for:
https://github.com/finance-academy/github.io/

The expected GitHub Pages address is:
https://finance-academy.github.io/github.io/

DEPLOYMENT
----------
1. Extract the ZIP.
2. Upload all extracted files and folders to the repository root on the main branch.
3. In GitHub, open Settings > Pages.
4. Under Build and deployment, choose Deploy from a branch, then main and / (root).
5. Save and wait for GitHub Pages to finish publishing.

The ZIP is intentionally packaged without an extra parent folder, so index.html
lands at the repository root after extraction.

ARTICLE PUBLISHING
------------------
The site is compatible with D:\publish_plugin\item_github.py.

The publishing integration depends on these paths and fields:

agent/publish-config.json
  - Identifies the GitHub Pages target.
  - contentSource must remain data/articles.json.
  - basePath must remain empty while the site is deployed at repository root.

data/articles.json
  - Stores the article archive and full article bodies.
  - New published entries are inserted by the publishing integration.

assets/
  - Stores the profile visual and any images added with an article.

article.html?id=ARTICLE_ID
  - Displays the article matching ARTICLE_ID.

The home page and article archive load data/articles.json automatically, keep
only published entries, sort them from newest to oldest, and render the current
article set. No article cards need to be edited by hand after publication.

MANUAL CONTENT REVIEW
---------------------
Before publishing, confirm that every article has a unique lowercase id and the
following fields: title, category, summary, readTime, date, tags, body and status.
Use status "published" for public articles. Draft and review entries are not
shown on the site.

JSON body fields supported by article.html:
intro, heading1, section1, quote, heading2, section2 and close.

Article text may contain the limited markup produced by the publishing
integration, including paragraphs, strong emphasis and images stored under
assets/. Other markup is reduced to safe text when displayed.

LOCAL PREVIEW
-------------
Use a local web server because browsers do not allow the required JSON requests
when pages are opened directly with file://.

No framework, package installation, build command or database is required.
