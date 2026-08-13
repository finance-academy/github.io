(() => {
  'use strict';

  const root = document.querySelector('#article-detail');
  if (!root) return;

  const endpoint = window.SITE_CONFIG?.contentEndpoint || 'data/articles.json';
  const requestedId = new URLSearchParams(window.location.search).get('id');
  const text = value => String(value ?? '');
  const decodeText = value => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text(value);
    return textarea.value;
  };
  const isPublished = article => article?.status == null || article.status === 'published';
  const allowedTags = new Set(['P', 'STRONG', 'IMG']);

  const makeElement = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value != null) element.textContent = decodeText(value);
    return element;
  };

  const sanitizeRichText = (value, wrapInParagraph = false) => {
    const template = document.createElement('template');
    template.innerHTML = wrapInParagraph ? `<p>${text(value)}</p>` : text(value);

    const clean = node => {
      const fragment = document.createDocumentFragment();
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          fragment.append(document.createTextNode(child.textContent || ''));
          return;
        }
        if (child.nodeType !== Node.ELEMENT_NODE || !allowedTags.has(child.tagName)) {
          if (child.childNodes?.length) fragment.append(clean(child));
          return;
        }
        const element = document.createElement(child.tagName.toLowerCase());
        if (child.tagName === 'IMG') {
          const source = child.getAttribute('src') || '';
          if (!/^assets\/[A-Za-z0-9._-]+$/.test(source)) return;
          element.src = source;
          element.alt = child.getAttribute('alt') || '';
          element.loading = 'lazy';
          element.decoding = 'async';
        } else {
          element.append(clean(child));
        }
        fragment.append(element);
      });
      return fragment;
    };

    return clean(template.content);
  };

  const appendRichSection = (container, value) => {
    if (!text(value).trim()) return;
    const section = makeElement('div', 'article-section');
    section.append(sanitizeRichText(value, true));
    if (!section.querySelector('p, img') && section.textContent.trim()) {
      const paragraph = makeElement('p', '', section.textContent);
      section.replaceChildren(paragraph);
    }
    container.append(section);
  };

  const renderArticle = article => {
    const body = article.body && typeof article.body === 'object' ? article.body : {};
    const backLink = makeElement('a', 'text-link', '← All articles');
    backLink.href = 'articles.html';

    const heading = makeElement('h1', '', article.title || 'Article');
    const description = makeElement('p', 'dek', article.summary);
    const metadata = makeElement('div', 'pub-meta');
    if (article.readTime) metadata.append(makeElement('span', '', `${text(article.readTime)} read`));
    (Array.isArray(article.tags) ? article.tags : []).forEach(tag => metadata.append(makeElement('span', '', tag)));

    const articleBody = makeElement('div', 'article-body');
    appendRichSection(articleBody, body.intro);
    if (body.heading1) articleBody.append(makeElement('h2', '', body.heading1));
    appendRichSection(articleBody, body.section1);
    if (text(body.quote).trim()) {
      const quote = document.createElement('blockquote');
      quote.append(sanitizeRichText(body.quote));
      articleBody.append(quote);
    }
    if (body.heading2) articleBody.append(makeElement('h2', '', body.heading2));
    appendRichSection(articleBody, body.section2);
    if (text(body.close).trim()) {
      const close = makeElement('div', 'closing-note');
      close.append(makeElement('strong', '', 'Closing note. '), sanitizeRichText(body.close));
      articleBody.append(close);
    }

    root.replaceChildren(
      backLink,
      makeElement('p', 'eyebrow', [article.category, article.date].filter(Boolean).join(' · ')),
      heading,
      description,
      metadata,
      articleBody
    );
    document.title = `${decodeText(article.title)} · Kael`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && article.summary) metaDescription.content = decodeText(article.summary);
  };

  const showMessage = (title, message) => {
    const backLink = makeElement('a', 'text-link', '← All articles');
    backLink.href = 'articles.html';
    root.replaceChildren(backLink, makeElement('h1', '', title), makeElement('p', 'dek', message));
  };

  if (!requestedId) {
    showMessage('Choose an article to read.', 'Browse the article archive to find the latest lessons and research notes.');
    return;
  }

  fetch(endpoint, { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('Article data unavailable');
      return response.json();
    })
    .then(payload => {
      if (!Array.isArray(payload)) throw new Error('Article data must be an array');
      const article = payload.find(item => item?.id === requestedId && isPublished(item));
      if (!article) {
        showMessage('Article not found.', 'This article may have moved or is no longer available.');
        return;
      }
      renderArticle(article);
    })
    .catch(() => showMessage('Article temporarily unavailable.', 'Please refresh the page in a moment.'));
})();
