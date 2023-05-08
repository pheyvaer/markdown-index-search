import {QueryEngine} from '@comunica/query-sparql-link-traversal-solid';
import FlexSearch from "flexsearch";
const { Index } = FlexSearch;
import fs from 'fs-extra';
import {getAuthenticatedFetch} from "./lib/client-credentials.js";
import path from "path";

const configPath = path.join(process.cwd(), 'config.json');
const fetch = await getAuthenticatedFetch(configPath);
const index = new Index();
const idResourceMap = {};

main();

async function main() {
  const {container, searchIndexResource} = await fs.readJson(configPath);
  const resources = await getResources(container);

  console.log(resources);
  let counter = 0;

  for (const resource of resources) {
    const md = await getMarkdown(resource);

    if (md) {
      idResourceMap[counter] = resource;
      index.add(counter, md);
      counter ++;
    }
  }

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
    lenient: true,
    fetch
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
        indexExport['idResourceMap'] = idResourceMap;
        resolve(indexExport);
      }
    });
  });
}
