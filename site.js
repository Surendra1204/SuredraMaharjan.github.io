// Fills the page from data/site.json (edited in the Website section of the personal app).
// Per-paper citation counts are read live from OpenAlex (free, no key); Scholar and Scopus totals are typed in.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = v => v === '' || v == null || isNaN(+v) ? null : +v;
  const fmtN = n => Number(n).toLocaleString('en-US');
  const fmtDate = s => { const d = s && new Date(s + 'T00:00:00'); return d && !isNaN(d) ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''; };

  $('year').textContent = new Date().getFullYear();

  // ---------- theme: device setting until you pick one ----------
  const btn = $('themeBtn');
  const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const label = () => btn.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
  label();
  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
  });

  // ---------- small line icons (generic shapes, not brand logos) ----------
  const ICON = {
    scholar: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/>',
    scopus: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    orcid: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9v6M12 9h2a3 3 0 0 1 0 6h-2z"/>',
    github: '<path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6.2 0C6.6 2.8 5.6 3.1 5.6 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.2 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  };
  const icon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

  fetch('data/site.json', { cache: 'no-cache' }).then(r => r.json()).then(render).catch(() => {
    $('pubList').innerHTML = '<p class="muted">The publication list could not be loaded. See Google Scholar for the full list.</p>';
  });

  function render(s) {
    // ---------- profile ----------
    $('pName').textContent = s.name;
    $('pHeadline').textContent = s.headline;
    $('pFocus').innerHTML = (s.focus || []).map(f => `<li>${esc(f)}</li>`).join('');
    $('pAffils').innerHTML = (s.affiliations || []).map(a => a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.name)}</a>` : `<span>${esc(a.name)}</span>`).join('');
    const L = s.links || {};
    const links = [
      L.scholar && ['scholar', 'Google Scholar', L.scholar, true],
      L.scopus && ['scopus', 'Scopus', L.scopus],
      L.orcid && ['orcid', 'ORCID', L.orcid],
      L.github && ['github', 'GitHub', L.github],
      L.linkedin && ['linkedin', 'LinkedIn', L.linkedin],
      s.email && ['email', 'Email', 'mailto:' + s.email],
    ].filter(Boolean);
    $('pLinks').innerHTML = links.map(([k, t, u, primary]) => `<a class="lbtn${primary ? ' primary' : ''}" href="${esc(u)}"${u.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener"'}>${icon(k)}${t}</a>`).join('');
    if (L.scholar) $('scholarLink').href = L.scholar; else $('pubNote').hidden = true;
    // Contact cards: university email, Gmail, phone, location (each shown only when filled in)
    const C = s.contact || {};
    const CI = {
      mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
      phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
      pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    };
    const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CI[k]}</svg>`;
    const tel = p => String(p).replace(/[^\d+]/g, '');
    const items = [
      s.email && ['mail', 'University email', `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`, s.email],
      C.gmail && ['mail', 'Personal email', `<a href="mailto:${esc(C.gmail)}">${esc(C.gmail)}</a>`, C.gmail],
      C.phone && ['phone', 'Phone', `<a href="tel:${esc(tel(C.phone))}">${esc(C.phone)}</a>`, C.phone],
      C.location && ['pin', 'Location', C.mapUrl ? `<a href="${esc(C.mapUrl)}" target="_blank" rel="noopener">${esc(C.location)}</a>` : esc(C.location), ''],
    ].filter(Boolean);
    $('contactList').innerHTML = items.map(([k, label, value, copy]) => `<li class="contact-item"><span class="ci-icon">${svg(k)}</span>
      <span class="ci-text"><span class="ci-label">${label}</span><span class="ci-value">${value}</span></span>
      ${copy ? `<button class="ci-copy" type="button" data-copy="${esc(copy)}" aria-label="Copy ${esc(label.toLowerCase())}">Copy</button>` : ''}</li>`).join('');
    $('contactList').addEventListener('click', async e => {
      const b = e.target.closest('[data-copy]'); if (!b) return;
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copied ✓'; } catch { b.textContent = 'Select it to copy'; }
      setTimeout(() => { b.textContent = 'Copy'; }, 1600);
    });
    // Location also under the affiliations in the profile card
    if (C.location) $('pAffils').insertAdjacentHTML('afterend', `<p class="p-loc">${svg('pin')}${esc(C.location)}</p>`);

    // ---------- about ----------
    $('aboutText').innerHTML = (s.about || []).map(p => `<p>${esc(p)}</p>`).join('');
    $('topics').innerHTML = (s.topics || []).map(t => `<li>${esc(t)}</li>`).join('');

    // ---------- publications ----------
    const pubs = (s.publications || []).filter(p => p.show !== false).sort((a, b) => b.year - a.year || (a.type === 'journal' ? -1 : 1) - (b.type === 'journal' ? -1 : 1));
    const me = String(s.name || '').toLowerCase();
    const isMe = a => a.toLowerCase().replace(/\s+/g, ' ') === me || /^surendra (man )?maharjan$/i.test(a.trim());
    $('cAll').textContent = pubs.length;
    $('cJ').textContent = pubs.filter(p => p.type === 'journal').length;
    $('cC').textContent = pubs.filter(p => p.type === 'conference').length;
    let filter = 'all';
    const cites = {};
    // "Wenzhao Li" → "Li, W."; "John D. Bolten" → "Bolten, J.D."; "Hesham El-Askary" → "El-Askary, H."
    const parts = a => { const w = String(a).replace(/\s+/g, ' ').trim().split(' '); return { family: w.pop() || '', given: w }; };
    const short = a => { const { family, given } = parts(a); return given.length ? `${family}, ${given.map(g => g.split('-').map(x => x[0].toUpperCase() + '.').join('-')).join('')}` : family; };
    const andJoin = xs => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
    // Harvard-style reference, your name in bold
    function reference(p) {
      const au = andJoin((p.authors || []).map(a => isMe(a) ? `<b>${esc(short(a))}</b>` : esc(short(a))));
      const pages = p.number ? (/[–-]/.test(p.number) ? `pp.${esc(p.number)}` : `p.${esc(p.number)}`) : '';
      const tail = p.type === 'conference' ? [`In <i>${esc(p.venue)}</i>`, pages] : [`<i>${esc(p.venue)}</i>`, p.volume ? esc(p.volume) : '', pages];
      return `${au}, ${p.year}. ${esc(p.title)}. ${tail.filter(Boolean).join(', ')}.`;
    }
    // BibTeX entry for "Download Bibtex"
    function bibtex(p) {
      const first = parts((p.authors || ['paper'])[0]).family.toLowerCase().replace(/[^a-z]/g, '');
      const word = (String(p.title).toLowerCase().match(/[a-z]{4,}/g) || ['paper']).find(w => !/^(with|from|into|using|through|the|and|for)$/.test(w)) || 'paper';
      const key = `${first}${p.year}${word}`;
      // Braces would break the entry; LaTeX needs "\&" for an ampersand
      const bt = s => String(s).replace(/[{}]/g, '').replace(/\\?&/g, '\\&');
      const f = [
        ['title', `{${bt(p.title)}}`],
        ['author', (p.authors || []).map(a => { const { family, given } = parts(a); return given.length ? `${family}, ${given.join(' ')}` : family; }).join(' and ')],
        [p.type === 'conference' ? 'booktitle' : 'journal', p.venue],
        p.type !== 'conference' && p.volume ? ['volume', p.volume] : null,
        p.number ? ['pages', String(p.number).replace('–', '--')] : null,
        ['year', p.year],
        p.doi ? ['doi', p.doi] : null,
      ].filter(Boolean);
      return `@${p.type === 'conference' ? 'inproceedings' : 'article'}{${key},\n${f.map(([k, v]) => `  ${k} = {${bt(v)}}`).join(',\n')}\n}\n`;
    }
    const LINK = '<svg class="ttl-link" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>';
    function drawPubs() {
      const list = pubs.filter(p => filter === 'all' || p.type === filter);
      const years = [...new Set(list.map(p => p.year))];
      $('pubList').innerHTML = years.map(y => `<h3 class="year">${y}</h3><ol class="pubs">${list.filter(p => p.year === y).map(p => {
        const i = pubs.indexOf(p);
        const doiUrl = p.doi ? 'https://doi.org/' + p.doi : (p.url || '');
        const c = p.doi ? cites[p.doi.toLowerCase()] : null;
        const paper = p.pdf || doiUrl;
        return `<li class="pub">
          <h3 class="pub-title">${doiUrl ? `<a href="${esc(doiUrl)}" target="_blank" rel="noopener">${esc(p.title)} ${LINK}</a>` : esc(p.title)}</h3>
          <p class="pub-in">Published in <i>${esc(p.venue)}</i>, ${p.year}</p>
          <p class="pub-ref">${reference(p)}</p>
          <p class="pub-links">${paper ? `<a href="${esc(paper)}" target="_blank" rel="noopener">Download Paper</a> <span aria-hidden="true">|</span> ` : ''}<a href="#" data-bib="${i}">Download Bibtex</a>${c > 0 ? ` <span class="cites" title="Citations counted by OpenAlex">· Cited by ${fmtN(c)}</span>` : ''}</p>
        </li>`;
      }).join('')}</ol>`).join('') || '<p class="muted">No publications in this group yet.</p>';
    }
    drawPubs();
    $('pubList').addEventListener('click', e => {
      const a = e.target.closest('[data-bib]'); if (!a) return;
      e.preventDefault();
      const p = pubs[+a.dataset.bib], text = bibtex(p);
      const url = URL.createObjectURL(new Blob([text], { type: 'application/x-bibtex' }));
      const dl = document.createElement('a');
      dl.href = url; dl.download = `${text.match(/\{([^,]+),/)[1]}.bib`;
      document.body.appendChild(dl); dl.click(); dl.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    });
    document.querySelector('.seg').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      filter = b.dataset.f;
      document.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b));
      drawPubs();
    });

    // ---------- metrics (typed-in Scholar/Scopus + counted ones) ----------
    const m = s.metrics || {}, sc = m.scholar || {}, sp = m.scopus || {};
    const rv = s.reviewing || {};
    const tiles = [];
    const tile = (val, lbl, note, href) => tiles.push(`<div class="metric"><b>${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${fmtN(val)}</a>` : fmtN(val)}</b><span>${esc(lbl)}</span>${note ? `<small>${esc(note)}</small>` : ''}</div>`);
    if (num(sc.citations) != null) tile(num(sc.citations), 'Citations · Google Scholar', sc.updated ? 'Updated ' + fmtDate(sc.updated) : '', L.scholar);
    if (num(sc.hIndex) != null) tile(num(sc.hIndex), 'h-index · Google Scholar', num(sc.i10) != null ? `i10-index ${sc.i10}` : '', L.scholar);
    if (num(sp.citations) != null) tile(num(sp.citations), 'Citations · Scopus', sp.updated ? 'Updated ' + fmtDate(sp.updated) : '', L.scopus);
    if (num(sp.hIndex) != null) tile(num(sp.hIndex), 'h-index · Scopus', num(sp.documents) != null ? `${sp.documents} documents` : '', L.scopus);
    tile(pubs.length, 'Publications', `${pubs.filter(p => p.type === 'journal').length} journal articles`);
    if (rv.totalReviews) tile(rv.totalReviews, 'Peer reviews', `for ${(rv.journals || []).length} journals`);
    $('metrics').innerHTML = tiles.join(''); $('metrics').hidden = !tiles.length;

    // ---------- live citation counts from OpenAlex ----------
    const dois = pubs.map(p => p.doi).filter(Boolean);
    if (dois.length) {
      const url = 'https://api.openalex.org/works?per-page=100&select=doi,cited_by_count&filter=doi:' + dois.map(d => encodeURIComponent(d.toLowerCase())).join('|');
      fetch(url).then(r => r.ok ? r.json() : null).then(j => {
        if (!j) return;
        for (const w of j.results || []) cites[String(w.doi || '').replace('https://doi.org/', '').toLowerCase()] = w.cited_by_count;
        drawPubs();
      }).catch(() => {});
    }

    // ---------- peer review ----------
    const js = rv.journals || [];
    if (!js.length) { $('reviewing').hidden = true; document.querySelector('.nav a[href="#reviewing"]').hidden = true; }
    else {
      const groups = new Map();
      for (const j of js) { const k = j.publisher || 'Other'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(j); }
      const order = ['Elsevier', 'Springer Nature'];
      const keys = [...groups.keys()].sort((a, b) => (order.indexOf(a) + 1 || 9) - (order.indexOf(b) + 1 || 9) || a.localeCompare(b));
      const cls = k => k === 'Elsevier' ? 'els' : k === 'Springer Nature' ? 'spr' : '';
      $('reviewBody').innerHTML = `
        <div class="rv-summary">
          <div><b>${fmtN(rv.totalReviews)}</b><span>reviews</span></div>
          <div><b>${js.length}</b><span>journals</span></div>
          <div><b>${keys.length}</b><span>publisher${keys.length === 1 ? '' : 's'}</span></div>
        </div>
        <div class="rv-groups">${keys.map(k => {
          const g = groups.get(k).sort((a, b) => b.reviews - a.reviews || a.journal.localeCompare(b.journal));
          const n = g.reduce((t, j) => t + j.reviews, 0);
          return `<div class="rv-group ${cls(k)}"><h3>${esc(k)}<span>${n} review${n === 1 ? '' : 's'}</span></h3>
            <ul>${g.map(j => `<li><i>${esc(j.journal)}</i><span>${j.reviews}</span></li>`).join('')}</ul></div>`;
        }).join('')}</div>
        ${rv.updated ? `<p class="muted small" style="margin:12px 0 0">Updated ${esc(fmtDate(rv.updated))}. Counts include revised manuscripts reviewed again.</p>` : ''}`;
    }

    // ---------- education & experience ----------
    const tl = (items, title, org) => items.map(e => `<li>
      <div class="tl-head"><div class="tl-title">${esc(title(e))}</div><div class="tl-when">${esc(e.years || '')}</div></div>
      <div class="tl-org">${esc(org(e))}</div>${e.note ? `<div class="tl-note">${esc(e.note)}</div>` : ''}
      ${(e.points || []).length ? `<ul class="tl-points">${e.points.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${e.projects ? `<div class="tl-projects"><b>Key projects:</b> ${esc(e.projects)}</div>` : ''}</li>`).join('');
    const edu = s.education || [], exp = s.experience || [];
    $('eduList').innerHTML = tl(edu, e => [e.degree, e.field].filter(Boolean).join(', '), e => [e.institution, e.place].filter(Boolean).join(' · '));
    $('expList').innerHTML = tl(exp, e => e.role, e => [e.org, e.place].filter(Boolean).join(' · '));
    if (!edu.length) { $('education').hidden = true; document.querySelector('.nav a[href="#education"]').hidden = true; }
    if (!exp.length) { $('experience').hidden = true; document.querySelector('.nav a[href="#experience"]').hidden = true; }

    // ---------- one section at a time: the menu switches between them ----------
    // The address keeps the section (#publications…), so links to a section and the Back button work
    const navLinks = [...document.querySelectorAll('.nav a')];
    const blocks = [...document.querySelectorAll('main .block')];
    function showSection() {
      const want = (location.hash || '#about').slice(1);
      const target = blocks.find(b => b.id === want && !b.dataset.empty) || blocks[0];
      blocks.forEach(b => b.classList.toggle('active', b === target));
      $('metrics').classList.toggle('active', target.id === 'about' && !$('metrics').hidden);
      navLinks.forEach(a => { const on = a.getAttribute('href') === '#' + target.id; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      document.title = (target.id === 'about' ? '' : target.querySelector('h2').textContent + ' · ') + 'Surendra Maharjan';
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    // A section with nothing in it is left out of the menu
    for (const id of ['reviewing', 'education', 'experience']) if ($(id).hidden) { $(id).dataset.empty = '1'; $(id).hidden = false; }
    window.addEventListener('hashchange', showSection);
    document.querySelector('.brand').addEventListener('click', e => { e.preventDefault(); history.pushState(null, '', location.pathname); showSection(); });
    document.documentElement.classList.add('paged');
    showSection();
  }
})();
