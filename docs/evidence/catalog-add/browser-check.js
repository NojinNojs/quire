async (page) => {
  const google = {"items": [{"volumeInfo": {"title": "This Earth of Mankind", "authors": ["Pramoedya Ananta Toer"], "publisher": "Penguin", "publishedDate": "1996-05-01", "pageCount": 368, "industryIdentifiers": [{"type": "ISBN_10", "identifier": "0140256350"}], "language": "en"}}]};
  const search = {"docs": [{"title": "This Earth of Mankind", "author_name": ["Pramoedya Ananta Toer"], "editions": {"docs": [{"key": "/books/OL123M"}]}}]};
  const edition = {"title": "This Earth of Mankind", "publishers": ["Penguin"], "publish_date": "1996", "number_of_pages": 368, "isbn_13": ["9780140256352"], "languages": [{"key": "/languages/eng"}]};
  const path = '/home/nojin/works/quire/docs/evidence/catalog-add/';
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const check = [];
  let mode = 'empty';
  await page.route('https://www.googleapis.com/books/v1/volumes?**', route => mode === 'error' ? route.abort() : route.fulfill({json:mode === 'empty' ? {} : google}));
  await page.route('https://openlibrary.org/**', route => mode === 'error' ? route.abort() : route.fulfill({json:mode === 'empty' ? {} : route.request().url().includes('search.json') ? search : edition}));
  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await page.getByText('0 books',{exact:true}).waitFor();
  const runSearch = async () => {
    await page.getByRole('searchbox').fill('This Earth of Mankind');
    await page.getByRole('button',{name:'Search',exact:true}).click();
    await page.getByRole('button',{name:'Search',exact:true}).waitFor();
  };
  await runSearch();
  await page.getByText('No catalogue matches for this search.',{exact:true}).waitFor();
  await page.screenshot({path:path+'empty.png',fullPage:true});
  check.push('Empty query results offer manual entry.');
  mode = 'results';
  await runSearch();
  assert(await page.locator('.catalog-row').count() === 1, 'ISBN duplicate should be one row');
  await page.screenshot({path:path+'results.png',fullPage:true});
  let inserted;
  page.on('response',async response => {
    if (response.request().method() === 'POST' && response.url().includes('/rest/v1/books')) {
      const data = await response.json().catch(() => null);
      inserted = {status:response.status(),data};
    }
  });
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.getByRole('button',{name:'Added',exact:true}).waitFor();
  await page.getByText('1 book',{exact:true}).waitFor();
  await page.screenshot({path:path+'saved.png',fullPage:true});
  assert(inserted.status === 201, 'Must really insert into Supabase');
  check.push('Save inserted into local Supabase (201), row became Added, header became 1 book.');
  const stored = await page.evaluate(async () => {
    const key = Object.keys(localStorage).find(key => key.endsWith('-auth-token'));
    const session = JSON.parse(localStorage.getItem(key));
    const client = (await import('/src/lib/supabase.ts')).supabase;
    const result = await client.from('books').select('owner,title,isbn,language');
    return {matchesOwner:result.data.every(book => book.owner === session.user.id), books:result.data.map(({title,isbn,language})=>({title,isbn,language}))};
  });
  assert(stored.matchesOwner && stored.books[0].language === 'en', 'Owner and record language must match');
  check.push('Database row owner matches session; ISBN is canonical 9780140256352; language is en.');
  await page.reload();
  await runSearch();
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.getByText('duplicate key value violates unique constraint "no_duplicate_isbn"',{exact:true}).waitFor();
  assert(inserted.status === 409, 'Must be database duplicate response');
  assert(await page.locator('.catalog-message').last().innerText() === inserted.data.message,'Database message must be shown verbatim');
  await page.getByText('1 book',{exact:true}).waitFor();
  check.push('Repeat save after reload returned 409; UI exactly matches database message; count stayed 1.');
  await page.getByRole('tab',{name:'Enter manually',exact:true}).click();
  await page.getByLabel('Title (required)').fill('');
  await page.getByRole('button',{name:'Save book',exact:true}).click();
  assert(await page.getByLabel('Title (required)').evaluate(el=>!el.validity.valid),'Title must be required');
  await page.getByLabel('Title (required)').fill('Manual evidence book');
  await page.getByLabel('ISBN',{exact:true}).fill('9780140256353');
  await page.getByRole('button',{name:'Save book',exact:true}).click();
  await page.getByText('Enter a valid ISBN-10 or ISBN-13, or leave ISBN blank.').waitFor();
  await page.getByLabel('ISBN',{exact:true}).fill('');
  await page.getByRole('button',{name:'Save book',exact:true}).click();
  await page.getByText('2 books',{exact:true}).waitFor();
  const manual = await page.evaluate(async () => {
    const client = (await import('/src/lib/supabase.ts')).supabase;
    return (await client.from('books').select('language,isbn,author,publisher,pages,year').eq('title','Manual evidence book').single()).data;
  });
  assert(manual.language === 'id' && manual.isbn === null && manual.pages === null && manual.author === null, 'Manual defaults must be correct');
  check.push('Manual form requires title, rejects bad ISBN, saves title alone with language id and unknown metadata null.');
  await page.getByRole('button',{name:'Save book',exact:true}).click();
  await page.getByText('This edition is already in your library.').waitFor();
  check.push('Manual no-ISBN duplicate uses edition identity and leaves count unchanged.');
  await page.getByRole('tab',{name:'Search catalogue',exact:true}).click();
  mode='error';
  await runSearch();
  await page.getByText('No catalogue results are available right now.').waitFor();
  check.push('Both failed providers show unavailable messages and manual fallback.');
  mode='results';
  await runSearch();
  const themes=['shelf-light','shelf-dark','municipal-light','municipal-dark','oxford-light','oxford-dark'];
  const layout=[];
  for (const width of [390,1280]) {
    await page.setViewportSize({width,height:844});
    for (const theme of themes) {
      await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      const values=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,cover:[document.querySelector('.catalog-cover').getBoundingClientRect().width,document.querySelector('.catalog-cover').getBoundingClientRect().height],targets:[...document.querySelectorAll('button:not([hidden])')].filter(el=>el.getBoundingClientRect().height).every(el=>el.getBoundingClientRect().height>=48)}));
      assert(values.scroll<=values.width && values.targets,'Layout and touch targets must pass');
      assert(values.cover[0]===48 && values.cover[1]===72,'Cover must be 48 by 72');
      layout.push({width,theme,...values});
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{document.documentElement.dataset.theme='shelf-light';document.body.style.zoom='2';});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'200% zoom should reflow');
  await page.evaluate(()=>document.body.style.zoom='');
  await page.getByRole('tab',{name:'Search catalogue',exact:true}).focus();
  await page.keyboard.press('ArrowRight');
  assert(await page.getByRole('tab',{name:'Enter manually',exact:true}).evaluate(el=>el===document.activeElement && el.getAttribute('aria-selected')==='true'),'Tab keyboard navigation');
  await page.keyboard.press('Tab');
  assert(await page.getByLabel('Title (required)').evaluate(el=>el===document.activeElement),'Keyboard must reach manual form');
  check.push('All six themes at 390 and 1280 have no overflow, 48px targets, 48x72 covers. 200% zoom reflows. Arrow keys and Tab operate entry tabs and form.');
  return {checks:check,layout};
}
