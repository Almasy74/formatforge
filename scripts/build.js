const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const dataDir = path.join(rootDir, 'data');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Data Source
const toolsDataPath = path.join(dataDir, 'tools.json');
const guidesDataPath = path.join(dataDir, 'guides.json');

const rawData = fs.readFileSync(toolsDataPath, 'utf8');
const data = JSON.parse(rawData);
const tools = data.tools;
const site = data.site;
const clusters = data.clusters;

let guides = [];
if (fs.existsSync(guidesDataPath)) {
    guides = JSON.parse(fs.readFileSync(guidesDataPath, 'utf8'));
}

// Thin content guardrails
tools.forEach(tool => {
    if (!tool.flags.enabled) return;

    if (!tool.content.intro || tool.content.intro.length < 2) {
        throw new Error(`Build failed: Thin content in ${tool.id} - intro < 2 paragraphs`);
    }
    if (!tool.faq || tool.faq.length < 3) {
        throw new Error(`Build failed: Thin content in ${tool.id} - faq < 3 questions`);
    }
    if (!tool.seo.metaDescription || tool.seo.metaDescription.length < 120) {
        throw new Error(`Build failed: Thin content in ${tool.id} - metaDesc < 120 chars`);
    }

    // Related link integrity
    const allRelatedIds = [...tool.content.related.sameCluster, ...tool.content.related.crossCluster];
    allRelatedIds.forEach(id => {
        if (!tools.find(t => t.id === id)) {
            throw new Error(`Build failed: Related tool '${id}' in ${tool.id} does not exist`);
        }
    });
});

// Templates & Partials
const getFile = (filePath) => fs.readFileSync(filePath, 'utf8');
const template = getFile(path.join(srcDir, 'templates', 'tool-template.html'));
const homeTemplate = getFile(path.join(srcDir, 'templates', 'home-template.html'));
const pageTemplate = getFile(path.join(srcDir, 'templates', 'page-template.html'));
const guideTemplatePath = path.join(srcDir, 'templates', 'guide-template.html');
const guideTemplate = fs.existsSync(guideTemplatePath) ? getFile(guideTemplatePath) : '';
const headerPartial = getFile(path.join(srcDir, 'partials', 'header.html'));
const footerPartial = getFile(path.join(srcDir, 'partials', 'footer.html'));
const adsPartial = getFile(path.join(srcDir, 'partials', 'ads-placeholder.html'));

const BASE_URL = site.domain;
const generatedUrls = [];

function generateRelatedCluster(currentTool) {
    let relatedHtml = '';
    const allLinkedIds = [...currentTool.content.related.sameCluster, ...currentTool.content.related.crossCluster];

    allLinkedIds.forEach(id => {
        const linkTool = tools.find(t => t.id === id);
        if (linkTool && linkTool.flags.enabled) {
            relatedHtml += `<a href="${linkTool.path}" class="tool-card shadow-card" style="padding: 15px; border-radius: 8px; border: 1px solid #eee; display:flex; flex-direction:column; text-decoration:none; color:inherit; margin-bottom:10px;">
                <h3 style="margin:0 0 5px 0;">${linkTool.seo.h1}</h3>
                <p style="margin:0; font-size:0.9em; color:#666;">${linkTool.seo.subtitle}</p>
            </a>\n`;
        }
    });
    return relatedHtml;
}

function generateRelatedGuides(currentTool) {
    // Find guides that reference this tool
    const relatedGuides = guides.filter(g => g.relatedTools && g.relatedTools.includes(currentTool.id));

    if (relatedGuides.length === 0) return '';

    let html = `<section class="related-guides shadow-card" style="margin-top: 30px;">
        <h2>Learn More (Knowledge Base)</h2>
        <div style="display: grid; gap: 15px; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));">`;

    relatedGuides.forEach(guide => {
        html += `<a href="${guide.path}" style="padding: 15px; background: #fdfdfd; border-radius: 6px; border-left: 4px solid #0056b3; text-decoration: none; color: inherit; display: block;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #0056b3;">${guide.title}</h3>
            <p style="margin: 0; font-size: 13px; color: #555;">${guide.description}</p>
        </a>`;
    });

    html += `</div></section>`;
    return html;
}

console.log(`Building ${tools.filter(t => t.flags.enabled).length} tool pages...`);

tools.filter(t => t.flags.enabled).forEach(tool => {
    let cleanRoute = tool.path;
    if (site.canonicalTrailingSlash && !cleanRoute.endsWith('/')) {
        cleanRoute += '/';
    } else if (!site.canonicalTrailingSlash && cleanRoute.endsWith('/') && cleanRoute !== '/') {
        cleanRoute = cleanRoute.slice(0, -1);
    }

    // Path resolution
    const routeParts = cleanRoute.split('/').filter(Boolean);
    const destDir = path.join(publicDir, ...routeParts);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    let html = template;

    // Partials
    html = html.replace(/\[HEADER_PARTIAL\]/g, headerPartial);
    html = html.replace(/\[FOOTER_PARTIAL\]/g, footerPartial);
    html = html.replace(/\[ADS_PARTIAL\]/g, adsPartial);

    // SEO Variables
    html = html.replace(/\[PAGE_TITLE\]/g, tool.seo.title);
    html = html.replace(/\[META_DESCRIPTION\]/g, tool.seo.metaDescription);
    html = html.replace(/\[META_ROBOTS\]/g, tool.seo.robots || "index,follow");

    const canonicalUrl = tool.seo.canonical ? (BASE_URL + tool.seo.canonical) : (BASE_URL + cleanRoute);
    html = html.replace(/\[CANONICAL_URL\]/g, canonicalUrl);

    html = html.replace(/\[H1_TITLE\]/g, tool.seo.h1);
    html = html.replace(/\[SUBTITLE_DESCRIPTION\]/g, tool.seo.subtitle || '');

    // Content Blocks
    const introHtml = tool.content.intro.map(p => `<p>${p}</p>`).join('\n');
    html = html.replace(/\[SEO_INTRO_HTML\]/g, introHtml);

    if (tool.content.howTo) {
        const howToHtml = `<h2>${tool.content.howTo.heading}</h2><ol>${tool.content.howTo.steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
        html = html.replace(/\[HOW_TO_HTML\]/g, howToHtml);
    } else {
        html = html.replace(/\[HOW_TO_HTML\]/g, '');
    }

    if (tool.content.examples && tool.content.examples.items && tool.content.examples.items.length > 0) {
        let exHtml = `<div class="examples-block"><h2>${tool.content.examples.heading}</h2><div style="background:#f4f4f4; padding:15px; border-radius:8px;">`;
        tool.content.examples.items.forEach(ex => {
            exHtml += `<strong>Input:</strong><pre><code>${ex.input}</code></pre><strong>Output:</strong><pre><code>${ex.output}</code></pre>`;
        });
        exHtml += `</div></div>`;
        html = html.replace(/\[EXAMPLES_HTML\]/g, exHtml);
    } else {
        html = html.replace(/\[EXAMPLES_HTML\]/g, '');
    }

    // FAQs
    let faqHtml = '';
    let faqSchema = [];
    if (tool.faq && tool.faq.length > 0) {
        faqHtml = tool.faq.map(f => `<details style="margin-bottom:10px; background:#f9f9f9; padding:10px; border-radius:4px;"><summary style="cursor:pointer; font-weight:bold;">${f.q}</summary><p style="margin-top:10px;">${f.a}</p></details>`).join('');
        faqSchema = tool.faq.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f.a
            }
        }));
    }
    html = html.replace(/\[FAQ_HTML\]/g, faqHtml);

    // Schema JSON
    const schemaObj = {
        "@context": "https://schema.org",
        "@graph": []
    };
    if (tool.schema.webApp) {
        schemaObj["@graph"].push({
            "@type": "SoftwareApplication",
            "name": tool.seo.h1,
            "operatingSystem": "All",
            "applicationCategory": "DeveloperApplication"
        });
    }
    if (tool.schema.faqPage && faqSchema.length > 0) {
        schemaObj["@graph"].push({
            "@type": "FAQPage",
            "mainEntity": faqSchema
        });
    }
    if (tool.schema.howTo && tool.content.howTo) {
        schemaObj["@graph"].push({
            "@type": "HowTo",
            "name": tool.content.howTo.heading,
            "step": tool.content.howTo.steps.map((s, i) => ({
                "@type": "HowToStep",
                "text": s,
                "position": i + 1
            }))
        });
    }
    html = html.replace(/\[SCHEMA_JSON\]/g, JSON.stringify(schemaObj, null, 2));

    // Related cluster & Knowledge Guides
    html = html.replace(/\[RELATED_CLUSTER_HTML\]/g, generateRelatedCluster(tool));
    html = html.replace(/\[GUIDES_HTML\]/g, generateRelatedGuides(tool));
    html = html.replace(/\[SCRIPT_FILE\]/g, tool.ui.jsModule);

    // Write out the HTML file
    const destFile = path.join(destDir, 'index.html');
    fs.writeFileSync(destFile, html, 'utf8');

    generatedUrls.push(canonicalUrl);
});

// Generated Hub Directories
clusters.forEach(cluster => {
    let cleanRoute = cluster.hubPath;
    if (site.canonicalTrailingSlash && !cleanRoute.endsWith('/')) {
        cleanRoute += '/';
    } else if (!site.canonicalTrailingSlash && cleanRoute.endsWith('/') && cleanRoute !== '/') {
        cleanRoute = cleanRoute.slice(0, -1);
    }
    const routeParts = cleanRoute.split('/').filter(Boolean);
    const destDir = path.join(publicDir, ...routeParts);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    let hubHtml = homeTemplate;
    hubHtml = hubHtml.replace(/\[HEADER_PARTIAL\]/g, headerPartial);
    hubHtml = hubHtml.replace(/\[FOOTER_PARTIAL\]/g, footerPartial);

    hubHtml = hubHtml.replace(/FormatForge TextTools Hub/g, cluster.label);
    let desc = cluster.description || '';
    hubHtml = hubHtml.replace(/Fast, secure, client-side tools.*/g, desc);

    const hubToolsHtml = tools.filter(t => t.clusterId === cluster.id && t.flags.enabled).map(t => `
        <article class="tool-card shadow-card" style="padding: 20px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 20px;">
            <h2><a href="${t.path}" style="text-decoration: none; color: inherit;">${t.seo.h1}</a></h2>
            <p>${t.seo.subtitle}</p>
        </article>
    `).join('\n');

    hubHtml = hubHtml.replace(/\[TOOL_LIST_HTML\]/g, hubToolsHtml);

    fs.writeFileSync(path.join(destDir, 'index.html'), hubHtml, 'utf8');

    const canonicalUrl = BASE_URL + cleanRoute;
    generatedUrls.push(canonicalUrl);
});

// Generated Guides Hub
console.log('Generating knowledge hub index...');
const guidesHubTemplate = getFile(path.join(srcDir, 'templates', 'guides-hub-template.html'));
let guidesHubHtml = guidesHubTemplate
    .replace(/\[HEADER_HTML\]/g, headerPartial)
    .replace(/\[FOOTER_HTML\]/g, footerPartial);

const guidesListHtml = guides.map(guide => `
    <a href="${guide.path}" style="text-decoration: none; color: inherit; display: block; background: #fff; border: 1px solid var(--border-color); border-radius: 8px; transition: transform 0.2s ease, box-shadow 0.2s ease; overflow: hidden; height: 100%;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 10px 20px rgba(0,0,0,0.05)';" onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
        <div style="padding: 24px;">
            <div style="font-family: var(--mono-font); font-size: 11px; color: var(--primary-color); margin-bottom: 12px; opacity: 0.8;">[REFERENCE_GUIDE]</div>
            <h3 style="margin: 0 0 12px 0; font-family: var(--mono-font); font-size: 18px; line-height: 1.3;">${guide.title}</h3>
            <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">${guide.description}</p>
        </div>
        <div style="padding: 12px 24px; background: #f8fafc; border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
            <span style="font-family: var(--mono-font); font-size: 10px; color: #94a3b8;">${guide.relatedTools ? (guide.relatedTools.length + ' TOOLS LINKED') : 'MANUAL'}</span>
            <span style="font-family: var(--mono-font); font-size: 12px; color: var(--primary-color);">READ_GUIDE >></span>
        </div>
    </a>
`).join('\n');

guidesHubHtml = guidesHubHtml.replace(/\[GUIDE_LIST_HTML\]/g, guidesListHtml);
const guidesHubDir = path.join(publicDir, 'guides');
if (!fs.existsSync(guidesHubDir)) fs.mkdirSync(guidesHubDir, { recursive: true });
fs.writeFileSync(path.join(guidesHubDir, 'index.html'), guidesHubHtml, 'utf8');
generatedUrls.push(site.domain + '/guides/');

// Generated Guides
console.log('Generating knowledge guides...');
guides.forEach(guide => {
    let cleanRoute = guide.path;
    if (site.canonicalTrailingSlash && !cleanRoute.endsWith('/')) {
        cleanRoute += '/';
    } else if (!site.canonicalTrailingSlash && cleanRoute.endsWith('/') && cleanRoute !== '/') {
        cleanRoute = cleanRoute.slice(0, -1);
    }
    const routeParts = cleanRoute.split('/').filter(Boolean);
    const destDir = path.join(publicDir, ...routeParts);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    let html = guideTemplate;
    html = html.replace(/\[HEADER_PARTIAL\]/g, headerPartial);
    html = html.replace(/\[FOOTER_PARTIAL\]/g, footerPartial);
    html = html.replace(/\[LANGUAGE\]/g, site.defaultLocale);

    const canonicalUrl = BASE_URL + cleanRoute;
    html = html.replace(/\[CANONICAL_URL\]/g, canonicalUrl);
    html = html.replace(/\[TITLE\]/g, guide.title);
    html = html.replace(/\[META_DESCRIPTION\]/g, guide.description);

    // Read guide content
    const guideFile = path.join(dataDir, 'guides', guide.id + '.html');
    let guideContent = '';
    if (fs.existsSync(guideFile)) {
        guideContent = getFile(guideFile);
    } else {
        console.warn(`Warning: Missing content for guide ${guide.id}`);
    }
    html = html.replace(/\[GUIDE_CONTENT\]/g, guideContent);

    // Related Tools
    let relatedToolsHtml = '';
    if (guide.relatedTools && guide.relatedTools.length > 0) {
        guide.relatedTools.forEach(toolId => {
            const t = tools.find(x => x.id === toolId);
            if (t && t.flags.enabled) {
                relatedToolsHtml += `<li style="margin-bottom: 15px;"><a href="${t.path}" style="text-decoration: none; color: #0056b3; font-weight: bold; font-size: 15px;">${t.seo.h1}</a><div style="font-size: 13px; color: #666; margin-top: 4px;">${t.seo.subtitle}</div></li>`;
            }
        });
    }
    html = html.replace(/\[RELATED_TOOLS_HTML\]/g, relatedToolsHtml);

    // Basic Article Schema
    const schemaObj = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": guide.title,
        "description": guide.description,
        "url": canonicalUrl
    };
    html = html.replace(/\[SCHEMA_JSON\]/g, JSON.stringify(schemaObj, null, 2));

    const destFile = path.join(destDir, 'index.html');
    fs.writeFileSync(destFile, html, 'utf8');

    generatedUrls.push(canonicalUrl);
});

// Generate Homepage
console.log('Generating homepage (index.html)...');
let homeHtml = homeTemplate;
homeHtml = homeHtml.replace(/\[HEADER_PARTIAL\]/g, headerPartial);
homeHtml = homeHtml.replace(/\[FOOTER_PARTIAL\]/g, footerPartial);

const allToolsHtml = tools.filter(t => t.flags.enabled).map(t => `
    <article class="tool-card shadow-card" style="padding: 20px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 15px;">
        <h2><a href="${t.path}" style="text-decoration: none; color: #0056b3;">${t.seo.h1}</a></h2>
        <p>${t.seo.subtitle}</p>
        <div style="margin-top: 10px; font-size: 0.85em; color: #666;">
            <span style="background: #eee; padding: 3px 8px; border-radius: 4px; margin-right: 5px; text-transform: uppercase;">${t.clusterId}</span>
        </div>
    </article>
`).join('\n');

homeHtml = homeHtml.replace(/\[TOOL_LIST_HTML\]/g, allToolsHtml);

fs.writeFileSync(path.join(publicDir, 'index.html'), homeHtml, 'utf8');

// Generate Static Pages (Privacy, Contact, etc.)
console.log('Generating static pages...');
const pagesDir = path.join(srcDir, 'pages');
if (fs.existsSync(pagesDir)) {
    const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
    pageFiles.forEach(file => {
        const pageId = file.replace('.html', '');
        const pageContent = getFile(path.join(pagesDir, file));

        let pageHtml = pageTemplate;
        pageHtml = pageHtml.replace(/\[HEADER_PARTIAL\]/g, headerPartial);
        pageHtml = pageHtml.replace(/\[FOOTER_PARTIAL\]/g, footerPartial);

        // Very simple mapping for title and desc
        let title = pageId.charAt(0).toUpperCase() + pageId.slice(1);
        if (pageId === 'privacy') title = 'Privacy Policy';
        if (pageId === 'contact') title = 'Contact Us';

        pageHtml = pageHtml.replace(/\[PAGE_TITLE\]/g, title);
        pageHtml = pageHtml.replace(/\[PAGE_DESC\]/g, `FormatForge ${title} page.`);
        pageHtml = pageHtml.replace(/\[PAGE_URL\]/g, `/${pageId}`);
        pageHtml = pageHtml.replace(/\[PAGE_CONTENT\]/g, pageContent);

        const pageDestDir = path.join(publicDir, pageId);
        if (!fs.existsSync(pageDestDir)) fs.mkdirSync(pageDestDir, { recursive: true });
        fs.writeFileSync(path.join(pageDestDir, 'index.html'), pageHtml, 'utf8');

        generatedUrls.push(`${BASE_URL}/${pageId}`);
    });
}

// Generate Sitemap
console.log('Generating sitemap.xml...');
let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
sitemapXml += `  <url><loc>${BASE_URL}/</loc></url>\n`;
generatedUrls.forEach(url => {
    sitemapXml += `  <url><loc>${url}</loc></url>\n`;
});
sitemapXml += `</urlset>`;
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');

// Copy static assets
console.log('Copying static assets (CSS, JS)...');
const copyRecursiveSync = function (src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(function (childItemName) {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
};

copyRecursiveSync(path.join(srcDir, 'css'), path.join(publicDir, 'css'));
copyRecursiveSync(path.join(srcDir, 'js'), path.join(publicDir, 'js'));

const srcAssets = path.join(srcDir, 'assets');
if (fs.existsSync(srcAssets)) {
    copyRecursiveSync(srcAssets, path.join(publicDir, 'assets'));
}

console.log(`Build complete! ${tools.length} tool pages generated. ${clusters.length} hub pages. Sitemap and index.html saved.`);
