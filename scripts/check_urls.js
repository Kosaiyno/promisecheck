const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/124.0.0.0 Safari/537.36";

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function check(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    const html = await res.text();
    const text = stripHtml(html);

    console.log(`${url}`);
    console.log(`  HTTP ${res.status} | html=${html.length} chars | text=${text.length} chars`);

    if (res.status !== 200) {
      console.log("  WARNING: non-200 status");
    }
    if (text.length < 200) {
      console.log("  WARNING: too little readable text");
    }
  } catch (err) {
    console.log(`${url}`);
    console.log(`  FETCH ERROR: ${err.message}`);
  }
}

async function main() {
  const urls = process.argv.slice(2);

  if (urls.length === 0) {
    console.error("Usage: node scripts/check_urls.js <url1> [url2 ...]");
    process.exit(1);
  }

  for (const url of urls) {
    await check(url);
  }
}

main();
