let index;
let idResourceMap;

window.onload = async () => {
  document.getElementById('search-index-resource').value = getLatestIndexUrl();
  document.getElementById('load-button')
    .addEventListener('click', async (e) => {
      e.preventDefault();
      document.getElementById('search-form').classList.add('hidden');
      document.getElementById('results').classList.add('hidden');
      const resource = document.getElementById('search-index-resource').value;
      saveLatestIndexUrl(resource);
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
      let results = index.search(search);

      if (idResourceMap) {
        results = results.map(result => idResourceMap[result]);
      }

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

  connectWithSolidExtension();
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

  if (keys.includes('idResourceMap')) {
    idResourceMap = indexImport['idResourceMap'];
    delete indexImport['idResourceMap'];
  }

  keys.forEach(key => {
    index.import(key, indexImport[key]);
  });
}

function connectWithSolidExtension() {
  // We try to connect to the extension.
  // Once we are connected we stop trying.
  // We try at most 15 times.
  // As far as I know there is no way to detect when the content script of the extension is injected and
  // has finished running.
  let counter = 1;
  const timeoutID = setTimeout(() => {
    if (counter >= 15) {
      clearInterval(timeoutID);
    }

    counter++;

    if (!window.solid) {
      console.log('Solid Authentication extension not detected.');
      return;
    }

    window.solid.onStatusChange(status => {
      status = JSON.parse(status);
      showWebID(status.webId);
    });

    window.solid.getStatus(status => {
      status = JSON.parse(status);
      showWebID(status.webId);
    });

    clearInterval(timeoutID);
  }, 1000);
}

function showWebID(webId) {
  const $webIdContainer = document.getElementById('webid-container');
  const $notLoggedIn = document.getElementById('webid-not-logged-in');
  const $webId = document.getElementById('webid');
  if (webId) {
    $webIdContainer.classList.remove('hidden');
    $notLoggedIn.classList.add('hidden');
    $webId.innerText = webId;
  } else {
    $webIdContainer.classList.add('hidden');
    $notLoggedIn.classList.remove('hidden');
  }
}

function getLatestIndexUrl() {
  return window.localStorage.getItem('latestIndexUrl');
}

function saveLatestIndexUrl(url) {
  window.localStorage.setItem('latestIndexUrl', url);
}
