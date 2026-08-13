(() => {
  'use strict';

  const endpoint = window.SITE_CONFIG?.contentEndpoint || 'data/articles.json';
  const archiveRoot = document.querySelector('#article-list');
  const latestRoot = document.querySelector('#latest-articles');
  const statusRoot = document.querySelector('#article-status');
  const filterRoot = document.querySelector('#article-filters');

  if (!archiveRoot && !latestRoot) return;

  const text = value => String(value ?? '');
  const decodeText = value => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text(value);
    return textarea.value;
  };
  const articleUrl = id => `article.html?id=${encodeURIComponent(text(id))}`;
  const articleNumber = index => String(index + 1).padStart(2, '0');
  const isPublished = article => article?.status == null || article.status === 'published';
  const byNewestDate = (left, right) => {
    const dateOrder = text(right?.date).localeCompare(text(left?.date));
    return dateOrder || text(left?.title).localeCompare(text(right?.title));
  };

  const makeElement = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value != null) element.textContent = decodeText(value);
    return element;
  };

  const renderCard = (article, index) => {
    const row = makeElement('article', 'publication');
    row.dataset.category = text(article.category);

    const visual = makeElement('a', `pub-visual visual-${index % 4 + 1}`);
    visual.href = articleUrl(article.id);
    visual.setAttribute('aria-label', `Read ${decodeText(article.title)}`);
    visual.append(makeElement('span', '', articleNumber(index)), makeElement('b', '', article.category || 'Article'));

    const copy = makeElement('div', 'pub-copy');
    copy.append(makeElement('span', 'eyebrow', [article.category, article.date].filter(Boolean).join(' · ')));

    const heading = makeElement('h3');
    const titleLink = makeElement('a', '', article.title || 'Untitled article');
    titleLink.href = articleUrl(article.id);
    heading.append(titleLink);
    copy.append(heading, makeElement('p', '', article.summary));

    const metadata = makeElement('div', 'pub-meta');
    if (article.readTime) metadata.append(makeElement('span', '', `${text(article.readTime)} read`));
    (Array.isArray(article.tags) ? article.tags : []).forEach(tag => metadata.append(makeElement('span', '', tag)));
    copy.append(metadata);

    const readLink = makeElement('a', 'text-link', 'Read article →');
    readLink.href = articleUrl(article.id);
    copy.append(readLink);
    row.append(visual, copy);
    return row;
  };

  const renderRows = (root, articles) => {
    root.replaceChildren(...articles.map(renderCard));
    root.setAttribute('aria-busy', 'false');
  };

  const renderFilters = (articles, onSelect) => {
    if (!filterRoot) return;
    const categories = [...new Set(articles.map(article => text(article.category).trim()).filter(Boolean))];
    const filters = ['all', ...categories];
    filterRoot.replaceChildren(...filters.map((filter, index) => {
      const button = makeElement('button', index === 0 ? 'active' : '', filter === 'all' ? 'All' : filter);
      button.type = 'button';
      button.dataset.filter = filter;
      button.setAttribute('aria-pressed', String(index === 0));
      button.addEventListener('click', () => {
        filterRoot.querySelectorAll('button').forEach(item => {
          const active = item === button;
          item.classList.toggle('active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        onSelect(filter);
      });
      return button;
    }));
  };

  const showError = root => {
    if (!root) return;
    const message = makeElement('div', 'content-message');
    message.append(makeElement('h2', '', 'Articles are temporarily unavailable.'), makeElement('p', '', 'Please refresh the page in a moment.'));
    root.replaceChildren(message);
    root.setAttribute('aria-busy', 'false');
  };

  fetch(endpoint, { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('Article data unavailable');
      return response.json();
    })
    .then(payload => {
      if (!Array.isArray(payload)) throw new Error('Article data must be an array');
      const articles = payload.filter(article => article && article.id && article.title && isPublished(article)).sort(byNewestDate);
      document.documentElement.dataset.articleCount = text(articles.length);

      if (latestRoot) renderRows(latestRoot, articles.slice(0, 3));
      if (archiveRoot) {
        renderRows(archiveRoot, articles);
        renderFilters(articles, category => {
          const matches = category === 'all' ? articles : articles.filter(article => article.category === category);
          renderRows(archiveRoot, matches);
          if (statusRoot) statusRoot.textContent = `${matches.length} article${matches.length === 1 ? '' : 's'}`;
        });
      }
      if (statusRoot) statusRoot.textContent = `${articles.length} article${articles.length === 1 ? '' : 's'}`;
    })
    .catch(() => {
      document.documentElement.dataset.articleCount = 'unavailable';
      showError(archiveRoot);
      showError(latestRoot);
      if (statusRoot) statusRoot.textContent = '';
    });
})();
