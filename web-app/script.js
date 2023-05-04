const searchIndexResource = 'http://localhost:3000/notes/search-index';

let index;

window.onload = async () => {
  document.getElementById('load-button')
    .addEventListener('click', async (e) => {
      e.preventDefault();
      document.getElementById('search-form').classList.add('hidden');
      document.getElementById('results').classList.add('hidden');
      const resource = document.getElementById('search-index-resource').value;
      try {
        document.getElementById('load-status').innerText = 'Loading...';
        document.getElementById('load-status').classList.remove('hidden');
        await loadIndex(resource);
        document.getElementById('search-form').classList.remove('hidden');
        document.getElementById('load-status').classList.add('hidden');
      } catch (e) {
        document.getElementById('load-status').innerText = e.message;
        document.getElementById('load-status').classList.remove('hidden');
      }
    });

  document.getElementById('search-button')
    .addEventListener('click', (e) => {
      e.preventDefault();
      const search = document.getElementById('search-input').value;
      const results = index.search(search);

      const $ul = document.getElementById('results');
      $ul.innerHTML = '';

      if (results.length === 0) {
        $ul.classList.add('hidden');
        document.getElementById('search-status').innerText = 'No Markdown files found.';
        document.getElementById('search-status').classList.remove('hidden');
        return;
      }

      $ul.classList.remove('hidden');
      document.getElementById('search-status').classList.add('hidden');

      results.forEach(result => {
        $ul.innerHTML += `<li class="list-group-item">${result} <span class="hidden">(Link copied.)</span></li>`
      });

      const items = Array.from(document.querySelectorAll('li.list-group-item'));
      items.forEach(item => {
        item.addEventListener('click', () => {
          navigator.clipboard.writeText(item.innerText);
          item.querySelector('span').classList.remove('hidden');

          setTimeout(() => {
            item.querySelector('span').classList.add('hidden');
          }, 5000);
        });
      })
    });
};

async function loadIndex(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    console.error(response.status);

    throw new Error('Loading index failed with HTTP status code ' + response.status);
  }

  if (response.headers.get('content-type') !== 'application/json') {
    throw new Error('Loading index failed because Content-Type is not application/json.');
  }

  index = new FlexSearch.Index();
  const indexImport = await response.json();

  const keys = Object.keys(indexImport);
  if (!keys.includes('reg')
    || !keys.includes('cfg')) {
    throw new Error('Loading index failed because index is invalid.');
  }

  keys.forEach(key => {
    index.import(key, indexImport[key]);
  });
}

