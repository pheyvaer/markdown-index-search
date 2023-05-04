import {QueryEngine} from '@comunica/query-sparql-link-traversal-solid';
import fetch from 'node-fetch';
import FlexSearch from "flexsearch";
const { Index } = FlexSearch;
import fs from 'fs-extra';

const index = new Index();

main();

async function main() {
  const container = 'http://localhost:3000/notes/';
  const searchIndexResource = 'http://localhost:3000/notes/search-index';
  const resources = await getResources(container);

  console.log(resources);

  for (const resource of resources) {
    const md = await getMarkdown(resource);
    console.log(md);
    index.add(resource, md);
  }

  console.log(index.search('wooper'));
  console.log(index.search('test'));
  console.log(index.search());
  await exportIndexToFile('search-index.json');
  await exportIndexToResource(searchIndexResource);
}

async function getResources(container) {
  const myEngine = new QueryEngine();

  const bindingsStream = await myEngine.queryBindings(`
  PREFIX ldp: <http://www.w3.org/ns/ldp#>
SELECT * WHERE {
  <${container}> ldp:contains* ?resource.
}`, {
    sources: [container],
    lenient: true
  });

  const bindings = await bindingsStream.toArray();
  const resources = bindings.map(binding => binding.get('resource').id)
    .filter(resource => resource && !resource.endsWith('/'));

  return resources;
}

async function getMarkdown(url) {
  try {
    const response= await fetch(url, {
      headers: {
        accept: 'text/markdown'
      }
    });

    if (response.ok) {
      if (response.headers.get('content-type') !== 'text/markdown') {
        console.log(`${url} did not return Markdown.`);
        return null;
      }

      return await response.text();
    }

    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function exportIndexToFile(filename) {
  const indexExport = await exportIndex();
  fs.writeJson(filename, indexExport);
}

async function exportIndexToResource(url) {
  const indexExport = await exportIndex();

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(indexExport)
  })

  console.log('PUT', response.ok);
}

function exportIndex() {
  return new Promise(resolve => {
    const indexExport = {};

    index.export(function(key, data){
      indexExport[key] = data;
      if (Object.keys(indexExport).length === 4) {
        resolve(indexExport);
      }
    });
  });
}
