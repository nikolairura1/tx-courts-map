const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const results = {};
  for (let num = 2; num <= 15; num++) {
    let suffix = num === 2 ? 'nd' : num === 3 ? 'rd' : 'th';
    const baseUrl = `https://www.txcourts.gov/${num}${suffix}coa/about-the-court/justices/`;
    console.log(`Fetching ${baseUrl}`);
    const html = await get(baseUrl);
    // extract justice links
    const linkRegex = new RegExp(`<a href="/${num}${suffix}coa/about-the-court/justices/([^"]*)/">([^<]*)</a>`, 'g');
    let match;
    const justices = [];
    while ((match = linkRegex.exec(html)) !== null) {
      if ((match[1].startsWith('justice') || match[1].startsWith('chief-justice')) && match[2] !== 'Read more') {
        justices.push({ path: match[1], name: match[2] });
      }
    }
    results[num] = {};
    for (const justice of justices) {
      const justiceUrl = `https://www.txcourts.gov/${num}${suffix}coa/about-the-court/justices/${justice.path}/`;
      console.log(`Fetching ${justiceUrl}`);
      const jHtml = await get(justiceUrl);
      // extract img src
      const imgRegex = /<img src="(\/media\/[^"]*\.png)" alt="[^"]*"[^>]*>/;
      const imgMatch = jHtml.match(imgRegex);
      if (imgMatch) {
        results[num][justice.name] = `https://www.txcourts.gov${imgMatch[1]}`;
      } else {
        results[num][justice.name] = null;
      }
    }
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);