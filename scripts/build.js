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
const OG_IMAGE_URL = `${BASE_URL}/assets/images/formatforge_logo.png`;
const sitemapUrls = new Set();
const clusterMap = new Map(clusters.map(cluster => [cluster.id, cluster]));
const guideHubSeo = {
    title: 'Guides for JSON, Unicode, Regex and Text Cleaning | FormatForge',
    metaDescription: 'Technical guides for JSON formatting, Unicode normalization, regex debugging, text cleaning, and data conversion. Built to support hands-on tool workflows.',
    h1: 'Technical Guides for Text, JSON and Developer Workflows',
    intro: 'Use these guides when you need the why and the fix. Each guide explains a specific technical problem, then points you to the right FormatForge tool to solve it.'
};
const staticPageMeta = {
    about: {
        title: 'About FormatForge | Privacy-First Developer Tools',
        description: 'FormatForge is an independent, privacy-first workshop for text, JSON, and developer tools that run locally in your browser.',
        canonical: '/about/',
        robots: 'index,follow',
        schemaType: 'AboutPage',
        heading: 'About FormatForge'
    },
    privacy: {
        title: 'Privacy Policy | FormatForge',
        description: 'Privacy information for FormatForge, including how browser-based tools handle user data and what is not uploaded to the server.',
        canonical: '/privacy/',
        robots: 'noindex,follow',
        schemaType: 'WebPage',
        heading: 'Privacy Policy'
    },
    terms: {
        title: 'Terms of Use | FormatForge',
        description: 'Terms governing the use of FormatForge tools, guides, and website content.',
        canonical: '/terms/',
        robots: 'noindex,follow',
        schemaType: 'WebPage',
        heading: 'Terms of Use'
    },
    contact: {
        title: 'Contact FormatForge',
        description: 'Contact FormatForge for feedback, support, and suggestions for new text, JSON, or developer tools.',
        canonical: '/contact/',
        robots: 'index,follow',
        schemaType: 'ContactPage',
        heading: 'Contact FormatForge'
    }
};

const clusterLandingContent = {
    text: {
        quickAnswer: 'Use these tools when text is messy, structurally uneven, or hard to reuse. The strongest entry points are Remove Line Breaks for copied text, Text Analyzer for structure and timing, and HTML Cleaner for pasted markup.',
        workflowHeading: 'Common Text Workflows',
        workflowCards: [
            {
                title: 'Fix copied text from PDFs or docs',
                description: 'Remove hard line breaks, preserve paragraphs when needed, and make pasted text usable again.',
                toolId: 'remove-line-breaks',
                guideId: 'remove-line-breaks'
            },
            {
                title: 'Measure draft length and structure',
                description: 'Check word count, reading time, sentence density, and paragraph balance before publishing.',
                toolId: 'text-analyzer',
                guideId: 'text-cleaning'
            },
            {
                title: 'Strip noisy markup before reuse',
                description: 'Clean HTML, remove inline styles, and extract the content you actually need.',
                toolId: 'html-cleaner',
                guideId: 'text-cleaning'
            }
        ],
        chooserHeading: 'Choose the Right Text Tool',
        chooserRows: [
            { situation: 'Copied text looks broken or full of hard returns', toolId: 'remove-line-breaks', reason: 'Best when the structure is mostly right but line endings are wrong.' },
            { situation: 'You need counts, reading time, or structural feedback', toolId: 'text-analyzer', reason: 'Best for content QA, SEO reviews, scripts, prompts, and editorial checks.' },
            { situation: 'The source contains tags, inline styles, or pasted HTML', toolId: 'html-cleaner', reason: 'Best when the problem is markup noise rather than plain-text formatting.' }
        ],
        guideIds: ['text-cleaning', 'remove-line-breaks', 'hidden-unicode-characters']
    },
    dev: {
        quickAnswer: 'Use these tools when the problem is not raw content but the way strings behave in URLs, tokens, regex, or browser-safe encodings. Start with the slug generator for publishing workflows and the regex tester for pattern failures.',
        workflowHeading: 'Common Developer Workflows',
        workflowCards: [
            {
                title: 'Create clean slugs before publishing',
                description: 'Turn titles into stable, readable URL slugs and avoid messy punctuation or inconsistent separators.',
                toolId: 'smart-slug-generator',
                guideId: 'seo-friendly-url-slugs'
            },
            {
                title: 'Debug a regex that behaves oddly',
                description: 'Test the pattern live, inspect matches, and check flags before touching production code.',
                toolId: 'regex-visual-explainer',
                guideId: 'regex-debugging'
            },
            {
                title: 'Handle URL-safe strings and encoded values',
                description: 'Escape URL components, decode Base64, inspect JWT payloads, and avoid Unicode-related surprises in transport-safe strings.',
                toolId: 'url-encoder-decoder',
                guideId: 'unicode-normalization'
            }
        ],
        chooserHeading: 'Choose the Right Developer Tool',
        chooserRows: [
            { situation: 'You need a readable, SEO-safe URL slug', toolId: 'smart-slug-generator', reason: 'Best for titles, category URLs, product pages, and documentation slugs.' },
            { situation: 'A regex matches the wrong text or fails on real input', toolId: 'regex-visual-explainer', reason: 'Best for visual testing, group inspection, and token-by-token debugging.' },
            { situation: 'A string must be safely encoded or decoded', toolId: 'url-encoder-decoder', reason: 'Best when the problem is escaping, transport, or browser-safe encoding.' }
        ],
        guideIds: ['seo-friendly-url-slugs', 'regex-debugging', 'unicode-normalization']
    },
    json: {
        quickAnswer: 'JSON tools overlap only if the job is unclear. Use the formatter when JSON is valid but unreadable, the validator when JSON is broken, the minifier when the payload is valid and ready for production, and converters when you need to move between formats.',
        workflowHeading: 'Common JSON Workflows',
        workflowCards: [
            {
                title: 'Fix broken JSON from an API or config file',
                description: 'Validate the payload, locate the exact syntax error, then repair it before formatting.',
                toolId: 'json-validator',
                guideId: 'json-parse-errors'
            },
            {
                title: 'Make valid JSON readable',
                description: 'Pretty-print payloads for debugging, code review, docs, or handoff to another team.',
                toolId: 'json-formatter',
                guideId: 'json-formatting'
            },
            {
                title: 'Ship compact JSON to production',
                description: 'Remove whitespace only after the payload is already valid and debugged.',
                toolId: 'json-minifier',
                guideId: 'json-formatting'
            }
        ],
        chooserHeading: 'Choose the Right JSON Tool',
        chooserRows: [
            { situation: 'The payload throws an error and will not parse', toolId: 'json-validator', reason: 'Best for locating syntax failures such as trailing commas, bad quotes, or missing brackets.' },
            { situation: 'The payload is valid but hard to inspect', toolId: 'json-formatter', reason: 'Best for turning compact JSON into readable, indented output.' },
            { situation: 'The payload is valid and you want the smallest possible output', toolId: 'json-minifier', reason: 'Best for compact transfer or storage after debugging is complete.' }
        ],
        guideIds: ['json-formatting', 'json-parse-errors', 'data-format-conversion']
    }
};

const homepageWorkflowCards = [
    {
        title: 'Fix broken JSON',
        description: 'Use the validator to locate syntax errors, then jump to the guide for the most common parse failures.',
        primaryPath: '/json/json-validator/',
        primaryLabel: 'Open JSON Validator',
        secondaryPath: '/guides/json-parse-errors/',
        secondaryLabel: 'See common parse errors'
    },
    {
        title: 'Analyze text',
        description: 'Check word count, characters, reading time, and structure before publishing or reusing text.',
        primaryPath: '/text/text-analyzer/',
        primaryLabel: 'Open Text Analyzer',
        secondaryPath: '/guides/text-cleaning/',
        secondaryLabel: 'Read the text cleaning guide'
    },
    {
        title: 'Create clean slugs',
        description: 'Generate stable URL slugs and handle punctuation, spaces, and accented characters correctly.',
        primaryPath: '/dev/slug-generator/',
        primaryLabel: 'Open Slug Generator',
        secondaryPath: '/guides/seo-friendly-url-slugs/',
        secondaryLabel: 'Read the slug guide'
    },
    {
        title: 'Debug regex',
        description: 'Test the pattern live, inspect matches, and fix flags, escaping, or greedy behavior.',
        primaryPath: '/dev/regex-tester-explainer/',
        primaryLabel: 'Open Regex Tester',
        secondaryPath: '/guides/regex-debugging/',
        secondaryLabel: 'Read the regex debugging guide'
    },
    {
        title: 'Format valid JSON',
        description: 'Pretty-print payloads for debugging, docs, and handoff when the JSON is already valid.',
        primaryPath: '/json/json-formatter/',
        primaryLabel: 'Open JSON Formatter',
        secondaryPath: '/guides/json-formatting/',
        secondaryLabel: 'Read the JSON formatting guide'
    },
    {
        title: 'Normalize Unicode',
        description: 'Understand NFC vs NFD, fix hidden character issues, and avoid equality or slug inconsistencies.',
        primaryPath: '/guides/unicode-normalization/',
        primaryLabel: 'Read the Unicode guide',
        secondaryPath: '/guides/hidden-unicode-characters/',
        secondaryLabel: 'Check hidden character issues'
    }
];

function normalizeRoute(route) {
    if (site.canonicalTrailingSlash && !route.endsWith('/')) {
        return `${route}/`;
    }
    if (!site.canonicalTrailingSlash && route.endsWith('/') && route !== '/') {
        return route.slice(0, -1);
    }
    return route;
}

function absoluteUrl(route) {
    return `${BASE_URL}${normalizeRoute(route)}`;
}

function addSitemapUrl(url, robots = 'index,follow') {
    if ((robots || 'index,follow').includes('noindex')) {
        return;
    }
    sitemapUrls.add(url);
}

function buildBreadcrumbItems(items) {
    return items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
    }));
}

function buildBreadcrumbHtml(items) {
    const html = items.map((item, index) => {
        if (index === items.length - 1) {
            return `<span style="color: var(--primary-color);">${item.name}</span>`;
        }
        return `<a href="${item.path}">${item.name}</a>`;
    }).join(' / ');
    return `<nav aria-label="Breadcrumb" style="font-family: var(--mono-font); font-size: 12px; margin-bottom: 20px; opacity: 0.7;">${html}</nav>`;
}

function buildBaseOrganizationGraph() {
    return [
        {
            '@type': 'Organization',
            '@id': `${BASE_URL}/#organization`,
            name: site.name,
            url: `${BASE_URL}/`,
            logo: `${BASE_URL}/assets/images/formatforge_logo.png`
        },
        {
            '@type': 'WebSite',
            '@id': `${BASE_URL}/#website`,
            url: `${BASE_URL}/`,
            name: site.name,
            publisher: {
                '@id': `${BASE_URL}/#organization`
            }
        }
    ];
}

function applyMetaPlaceholders(html, meta) {
    return html
        .replace(/\[META_ROBOTS\]/g, meta.robots || 'index,follow')
        .replace(/\[CANONICAL_URL\]/g, meta.canonicalUrl)
        .replace(/\[OG_TITLE\]/g, meta.ogTitle)
        .replace(/\[OG_DESCRIPTION\]/g, meta.ogDescription)
        .replace(/\[OG_URL\]/g, meta.ogUrl)
        .replace(/\[OG_TYPE\]/g, meta.ogType || 'website')
        .replace(/\[OG_IMAGE\]/g, OG_IMAGE_URL);
}

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

function getToolById(id) {
    return tools.find(tool => tool.id === id && tool.flags.enabled);
}

function getGuideById(id) {
    return guides.find(guide => guide.id === id);
}

function renderWorkflowCards(items) {
    return items.map((item) => {
        const tool = item.toolId ? getToolById(item.toolId) : null;
        const guide = item.guideId ? getGuideById(item.guideId) : null;
        const toolLink = tool ? `<a href="${tool.path}" style="display:inline-block; margin-right:10px; margin-top:10px; font-weight:600; text-decoration:none; color:#0056b3;">${tool.seo.h1}</a>` : '';
        const guideLink = guide ? `<a href="${guide.path}" style="display:inline-block; margin-top:10px; color:#475569; text-decoration:none;">${guide.title}</a>` : '';
        return `<article class="shadow-card" style="padding:20px; border:1px solid #e2e8f0; border-radius:8px;">
            <h3 style="margin:0 0 10px 0;">${item.title}</h3>
            <p style="margin:0; color:#475569;">${item.description}</p>
            <div style="margin-top:8px;">${toolLink}${guideLink}</div>
        </article>`;
    }).join('');
}

function renderChooserRows(items) {
    return items.map((item) => {
        const tool = getToolById(item.toolId);
        if (!tool) return '';
        return `<div style="padding:18px 0; border-top:1px solid #e2e8f0;">
            <p style="margin:0 0 6px 0; font-weight:600;">${item.situation}</p>
            <p style="margin:0 0 6px 0;"><a href="${tool.path}" style="text-decoration:none; color:#0056b3; font-weight:700;">Use ${tool.seo.h1}</a></p>
            <p style="margin:0; color:#475569;">${item.reason}</p>
        </div>`;
    }).join('');
}

function renderGuideCards(guideIds) {
    return guideIds.map((guideId) => getGuideById(guideId)).filter(Boolean).map((guide) => `<a href="${guide.path}" style="display:block; padding:16px; border:1px solid #e2e8f0; border-radius:8px; text-decoration:none; color:inherit;">
        <h3 style="margin:0 0 8px 0; font-size:18px; color:#0056b3;">${guide.title}</h3>
        <p style="margin:0; color:#475569; font-size:14px;">${guide.description}</p>
    </a>`).join('');
}

console.log(`Building ${tools.filter(t => t.flags.enabled).length} tool pages...`);

tools.filter(t => t.flags.enabled).forEach(tool => {
    const cleanRoute = normalizeRoute(tool.path);

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

    const canonicalUrl = tool.seo.canonical ? absoluteUrl(tool.seo.canonical) : absoluteUrl(cleanRoute);
    html = html.replace(/\[CANONICAL_URL\]/g, canonicalUrl);
    html = html.replace(/\[OG_TITLE\]/g, tool.seo.title);
    html = html.replace(/\[OG_DESCRIPTION\]/g, tool.seo.metaDescription);
    html = html.replace(/\[OG_URL\]/g, canonicalUrl);
    html = html.replace(/\[OG_IMAGE\]/g, OG_IMAGE_URL);

    html = html.replace(/\[H1_TITLE\]/g, tool.seo.h1);
    html = html.replace(/\[SUBTITLE_DESCRIPTION\]/g, tool.seo.subtitle || '');

    const toolCluster = clusterMap.get(tool.clusterId);
    const toolBreadcrumbs = [
        { name: 'Home', path: '/', url: `${BASE_URL}/` },
        { name: toolCluster ? toolCluster.label : 'Tools', path: toolCluster ? normalizeRoute(toolCluster.hubPath) : '/', url: toolCluster ? absoluteUrl(toolCluster.hubPath) : `${BASE_URL}/` },
        { name: tool.seo.h1, path: cleanRoute, url: canonicalUrl }
    ];
    html = html.replace(/\[BREADCRUMBS_HTML\]/g, buildBreadcrumbHtml(toolBreadcrumbs));

    // Content Blocks
    const aeoHeaderHtml = `
<div class="aeo-capability-header shadow-card" style="margin-bottom: 25px; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; background-color: #fafbfc;">
    <h2 style="font-size: 1.25em; margin-top: 0; margin-bottom: 12px; color: var(--header-color);">What this tool does</h2>
    <p style="margin-bottom: 15px; font-size: 1.05em; color: var(--text-color);">${tool.content.aeoDescription}</p>
    
    <div style="display: flex; gap: 30px; font-size: 0.95em; margin-bottom: 15px;">
        <div><strong>Input formats:</strong> ${tool.content.ioFormats ? tool.content.ioFormats.input : 'Text / Data'}</div>
        <div><strong>Output formats:</strong> ${tool.content.ioFormats ? tool.content.ioFormats.output : 'Text / Data'}</div>
    </div>
    
    <div class="privacy-badge" style="display: inline-flex; align-items: center; background-color: #dcfce7; color: #14532d; padding: 8px 14px; border-radius: 6px; font-weight: bold; font-size: 0.9em; margin-top: 5px;">
        <svg style="width:18px; height:18px; margin-right:8px;" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2l6 3v4c0 4.418-2.686 8-6 8s-6-3.582-6-8V5l6-3zm0 2.236L5.5 6.472v2.528c0 3.328 2.016 6.136 4.5 6.136s4.5-2.808 4.5-6.136V6.472L10 4.236z" clip-rule="evenodd"></path></svg>
        Runs locally in your browser.
    </div>
</div>
`;
    html = html.replace(/\[AEO_HEADER_TMPL\]/g, aeoHeaderHtml);

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
        "@graph": [
            ...buildBaseOrganizationGraph(),
            {
                "@type": "BreadcrumbList",
                "itemListElement": buildBreadcrumbItems(toolBreadcrumbs)
            }
        ]
    };
    if (tool.schema.webApp) {
        schemaObj["@graph"].push({
            "@type": "SoftwareApplication",
            "url": canonicalUrl,
            "name": tool.seo.h1,
            "description": tool.content.aeoDescription || tool.seo.metaDescription,
            "operatingSystem": "Web",
            "applicationCategory": "DeveloperApplication",
            "applicationSubCategory": toolCluster ? toolCluster.label : 'Developer Tools',
            "isAccessibleForFree": true,
            "browserRequirements": "Requires a modern JavaScript-enabled browser.",
            "featureList": tool.content.capabilities || []
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

    addSitemapUrl(canonicalUrl, tool.seo.robots || 'index,follow');
});

// Generated Hub Directories
clusters.forEach(cluster => {
    const cleanRoute = normalizeRoute(cluster.hubPath);
    const routeParts = cleanRoute.split('/').filter(Boolean);
    const destDir = path.join(publicDir, ...routeParts);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    let hubHtml = homeTemplate;
    hubHtml = hubHtml.replace(/\[HEADER_PARTIAL\]/g, headerPartial);
    hubHtml = hubHtml.replace(/\[FOOTER_PARTIAL\]/g, footerPartial);

    // Hub-specific SEO fields
    const hubSeo = cluster.seo || {};
    const canonicalUrl = absoluteUrl(cleanRoute);
    hubHtml = hubHtml.replace(/\[HUB_TITLE\]/g, hubSeo.title || `${cluster.label} | FormatForge`);
    hubHtml = hubHtml.replace(/\[HUB_META_DESCRIPTION\]/g, hubSeo.metaDescription || cluster.description || '');
    hubHtml = hubHtml.replace(/\[HUB_CANONICAL_URL\]/g, canonicalUrl);
    hubHtml = hubHtml.replace(/\[HUB_H1\]/g, hubSeo.h1 || cluster.label);
    hubHtml = hubHtml.replace(/\[HUB_INTRO\]/g, hubSeo.intro || cluster.description || '');
    hubHtml = hubHtml.replace(/\[META_ROBOTS\]/g, 'index,follow');
    hubHtml = hubHtml.replace(/\[OG_TITLE\]/g, hubSeo.title || `${cluster.label} | FormatForge`);
    hubHtml = hubHtml.replace(/\[OG_DESCRIPTION\]/g, hubSeo.metaDescription || cluster.description || '');
    hubHtml = hubHtml.replace(/\[OG_URL\]/g, canonicalUrl);
    hubHtml = hubHtml.replace(/\[OG_TYPE\]/g, 'website');
    hubHtml = hubHtml.replace(/\[OG_IMAGE\]/g, OG_IMAGE_URL);

    const hubBreadcrumbs = [
        { name: 'Home', path: '/', url: `${BASE_URL}/` },
        { name: cluster.label, path: cleanRoute, url: canonicalUrl }
    ];
    const hubContent = clusterLandingContent[cluster.id] || {};

    const hubToolsHtml = `
        <section style="margin-bottom: 40px;">
            <h2 style="margin-bottom: 10px;">All ${cluster.label}</h2>
            <p style="margin: 0 0 18px 0; color:#64748b;">Each page below owns a different task. Pick the tool that matches the job instead of starting with the wrong workflow.</p>
            <div style="display:grid; gap:20px;">
    ` + tools.filter(t => t.clusterId === cluster.id && t.flags.enabled).map(t => `
        <article class="tool-card shadow-card" style="padding: 20px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;"><a href="${t.path}" style="text-decoration: none; color: inherit;">${t.seo.h1}</a></h3>
            <p>${t.seo.subtitle}</p>
        </article>
    `).join('\n') + `
            </div>
        </section>
    `;

    hubHtml = hubHtml.replace(/\[TOOL_LIST_HTML\]/g, hubToolsHtml);
    const hubPreGridHtml = `
        ${buildBreadcrumbHtml(hubBreadcrumbs)}
        <section class="shadow-card" style="padding: 24px; margin-bottom: 30px;">
            <h2 style="margin-top: 0;">Quick Answer</h2>
            <p style="margin:0; color:#475569;">${hubContent.quickAnswer || (hubSeo.intro || cluster.description || '')}</p>
        </section>
        ${(hubContent.workflowCards || []).length > 0 ? `<section class="shadow-card" style="padding: 30px; margin-bottom: 30px;">
            <h2 style="margin-top: 0;">${hubContent.workflowHeading}</h2>
            <div style="display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr));">
                ${renderWorkflowCards(hubContent.workflowCards)}
            </div>
        </section>` : ''}`;
    hubHtml = hubHtml.replace(/\[PRE_GRID_HTML\]/g, hubPreGridHtml);

    const hubPostGridHtml = `
        ${(hubContent.chooserRows || []).length > 0 ? `<section class="shadow-card" style="margin-top: 40px; padding: 30px;">
            <h2 style="margin-top: 0;">${hubContent.chooserHeading}</h2>
            <div>${renderChooserRows(hubContent.chooserRows)}</div>
        </section>` : ''}
        ${(hubContent.guideIds || []).length > 0 ? `<section class="shadow-card" style="margin-top: 40px; padding: 30px;">
            <h2 style="margin-top: 0;">Guides That Support This Hub</h2>
            <p style="color:#64748b;">Use a guide when the real need is context, failure patterns, or implementation detail before you open the tool.</p>
            <div style="display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr));">
                ${renderGuideCards(hubContent.guideIds)}
            </div>
        </section>` : ''}`;
    hubHtml = hubHtml.replace(/\[POST_GRID_HTML\]/g, hubPostGridHtml);
    hubHtml = hubHtml.replace(/\[SCHEMA_JSON\]/g, JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
            ...buildBaseOrganizationGraph(),
            {
                '@type': 'CollectionPage',
                'name': hubSeo.h1 || cluster.label,
                'url': canonicalUrl,
                'description': hubSeo.metaDescription || cluster.description || ''
            },
            {
                '@type': 'BreadcrumbList',
                'itemListElement': buildBreadcrumbItems(hubBreadcrumbs)
            }
        ]
    }, null, 2));

    fs.writeFileSync(path.join(destDir, 'index.html'), hubHtml, 'utf8');

    addSitemapUrl(canonicalUrl);
});

// Generated Guides Hub
console.log('Generating knowledge hub index...');
const guidesHubTemplate = getFile(path.join(srcDir, 'templates', 'guides-hub-template.html'));
let guidesHubHtml = guidesHubTemplate
    .replace(/\[HEADER_HTML\]/g, headerPartial)
    .replace(/\[FOOTER_HTML\]/g, footerPartial);
guidesHubHtml = guidesHubHtml.replace(/\[HUB_TITLE\]/g, guideHubSeo.title);
guidesHubHtml = guidesHubHtml.replace(/\[HUB_META_DESCRIPTION\]/g, guideHubSeo.metaDescription);
guidesHubHtml = guidesHubHtml.replace(/\[HUB_CANONICAL_URL\]/g, absoluteUrl('/guides/'));
guidesHubHtml = guidesHubHtml.replace(/\[HUB_H1\]/g, guideHubSeo.h1);
guidesHubHtml = guidesHubHtml.replace(/\[HUB_INTRO\]/g, guideHubSeo.intro);
guidesHubHtml = guidesHubHtml.replace(/\[META_ROBOTS\]/g, 'index,follow');
guidesHubHtml = guidesHubHtml.replace(/\[OG_TITLE\]/g, guideHubSeo.title);
guidesHubHtml = guidesHubHtml.replace(/\[OG_DESCRIPTION\]/g, guideHubSeo.metaDescription);
guidesHubHtml = guidesHubHtml.replace(/\[OG_URL\]/g, absoluteUrl('/guides/'));
guidesHubHtml = guidesHubHtml.replace(/\[OG_IMAGE\]/g, OG_IMAGE_URL);
guidesHubHtml = guidesHubHtml.replace(/\[SCHEMA_JSON\]/g, JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
        ...buildBaseOrganizationGraph(),
        {
            '@type': 'CollectionPage',
            'name': guideHubSeo.h1,
            'url': absoluteUrl('/guides/'),
            'description': guideHubSeo.metaDescription
        },
        {
            '@type': 'BreadcrumbList',
            'itemListElement': buildBreadcrumbItems([
                { name: 'Home', url: `${BASE_URL}/` },
                { name: 'Guides', url: absoluteUrl('/guides/') }
            ])
        }
    ]
}, null, 2));

const guidesListHtml = guides.map(guide => `
    <a href="${guide.path}" style="text-decoration: none; color: inherit; display: block; background: #fff; border: 1px solid var(--border-color); border-radius: 8px; transition: transform 0.2s ease, box-shadow 0.2s ease; overflow: hidden; height: 100%;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 10px 20px rgba(0,0,0,0.05)';" onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
        <div style="padding: 24px;">
            <div style="font-family: var(--mono-font); font-size: 11px; color: var(--primary-color); margin-bottom: 12px; opacity: 0.8;">REFERENCE GUIDE</div>
            <h3 style="margin: 0 0 12px 0; font-family: var(--mono-font); font-size: 18px; line-height: 1.3;">${guide.title}</h3>
            <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">${guide.description}</p>
        </div>
        <div style="padding: 12px 24px; background: #f8fafc; border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
            <span style="font-family: var(--mono-font); font-size: 10px; color: #94a3b8;">${guide.relatedTools ? (guide.relatedTools.length + ' TOOLS LINKED') : 'MANUAL'}</span>
            <span style="font-family: var(--mono-font); font-size: 12px; color: var(--primary-color);">READ GUIDE &gt;&gt;</span>
        </div>
    </a>
`).join('\n');

guidesHubHtml = guidesHubHtml.replace(/\[GUIDE_LIST_HTML\]/g, guidesListHtml);
const guidesHubDir = path.join(publicDir, 'guides');
if (!fs.existsSync(guidesHubDir)) fs.mkdirSync(guidesHubDir, { recursive: true });
fs.writeFileSync(path.join(guidesHubDir, 'index.html'), guidesHubHtml, 'utf8');
addSitemapUrl(absoluteUrl('/guides/'));

// Generated Guides
console.log('Generating knowledge guides...');
guides.forEach(guide => {
    const cleanRoute = normalizeRoute(guide.path);
    const routeParts = cleanRoute.split('/').filter(Boolean);
    const destDir = path.join(publicDir, ...routeParts);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    let html = guideTemplate;
    html = html.replace(/\[HEADER_PARTIAL\]/g, headerPartial);
    html = html.replace(/\[FOOTER_PARTIAL\]/g, footerPartial);
    html = html.replace(/\[LANGUAGE\]/g, site.defaultLocale);

    const canonicalUrl = absoluteUrl(cleanRoute);
    html = html.replace(/\[CANONICAL_URL\]/g, canonicalUrl);
    html = html.replace(/\[TITLE\]/g, guide.title);
    html = html.replace(/\[META_DESCRIPTION\]/g, guide.description);
    html = html.replace(/\[META_ROBOTS\]/g, guide.robots || 'index,follow');
    html = html.replace(/\[OG_TITLE\]/g, `${guide.title} | FormatForge Guides`);
    html = html.replace(/\[OG_DESCRIPTION\]/g, guide.description);
    html = html.replace(/\[OG_URL\]/g, canonicalUrl);
    html = html.replace(/\[OG_IMAGE\]/g, OG_IMAGE_URL);

    const guideBreadcrumbs = [
        { name: 'Home', path: '/', url: `${BASE_URL}/` },
        { name: 'Guides', path: '/guides/', url: absoluteUrl('/guides/') },
        { name: guide.title, path: cleanRoute, url: canonicalUrl }
    ];
    html = html.replace(/\[BREADCRUMBS_HTML\]/g, buildBreadcrumbHtml(guideBreadcrumbs));

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
        "@graph": [
            ...buildBaseOrganizationGraph(),
            {
                "@type": "Article",
                "headline": guide.title,
                "description": guide.description,
                "url": canonicalUrl,
                "mainEntityOfPage": canonicalUrl,
                "inLanguage": site.defaultLocale,
                "author": {
                    "@id": `${BASE_URL}/#organization`
                }
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": buildBreadcrumbItems(guideBreadcrumbs)
            }
        ]
    };
    html = html.replace(/\[SCHEMA_JSON\]/g, JSON.stringify(schemaObj, null, 2));

    const destFile = path.join(destDir, 'index.html');
    fs.writeFileSync(destFile, html, 'utf8');

    addSitemapUrl(canonicalUrl, guide.robots || 'index,follow');
});

// Generate Homepage
console.log('Generating homepage (index.html)...');
let homeHtml = homeTemplate;
homeHtml = homeHtml.replace(/\[HEADER_PARTIAL\]/g, headerPartial);
homeHtml = homeHtml.replace(/\[FOOTER_PARTIAL\]/g, footerPartial);

// Homepage SEO fields
homeHtml = homeHtml.replace(/\[HUB_TITLE\]/g, 'FormatForge — Text & Data Tools for Developers | Format, Validate, Convert');
homeHtml = homeHtml.replace(/\[HUB_META_DESCRIPTION\]/g, 'Free browser-based tools for JSON formatting, text cleaning, encoding, regex testing, and data conversion. Privacy-first — all processing runs locally, no data uploads.');
homeHtml = homeHtml.replace(/\[HUB_CANONICAL_URL\]/g, BASE_URL + '/');
homeHtml = homeHtml.replace(/\[HUB_H1\]/g, 'Text & Data Tools for Developers — In Your Browser');
homeHtml = homeHtml.replace(/\[HUB_INTRO\]/g, 'FormatForge is a privacy-first developer workshop with free online tools for JSON formatting, text cleaning, data conversion, encoding, and regex debugging. Every tool runs entirely in your browser — no logins, no uploads, no tracking.');

homeHtml = homeHtml.replace('FormatForge — Text & Data Tools for Developers | Format, Validate, Convert', 'Free Online Text, JSON & Developer Tools | FormatForge');
homeHtml = homeHtml.replace('Free browser-based tools for JSON formatting, text cleaning, encoding, regex testing, and data conversion. Privacy-first — all processing runs locally, no data uploads.', 'Format JSON, validate payloads, analyze text, generate SEO-friendly slugs, debug regex, and convert data locally in your browser. No uploads, no login.');
homeHtml = homeHtml.replace('Text & Data Tools for Developers — In Your Browser', 'Free Online Text, JSON & Developer Tools');
homeHtml = homeHtml.replace('FormatForge is a privacy-first developer workshop with free online tools for JSON formatting, text cleaning, data conversion, encoding, and regex debugging. Every tool runs entirely in your browser — no logins, no uploads, no tracking.', 'FormatForge helps you format JSON, validate payloads, analyze text, generate URL slugs, debug regex, and convert structured data directly in the browser. It is built for practical work: fast output, clear structure, and local processing by default.');
homeHtml = homeHtml.replace(/\[META_ROBOTS\]/g, 'index,follow');
homeHtml = homeHtml.replace(/\[OG_TITLE\]/g, 'Free Online Text, JSON & Developer Tools | FormatForge');
homeHtml = homeHtml.replace(/\[OG_DESCRIPTION\]/g, 'Format JSON, validate payloads, analyze text, generate SEO-friendly slugs, debug regex, and convert data locally in your browser. No uploads, no login.');
homeHtml = homeHtml.replace(/\[OG_URL\]/g, `${BASE_URL}/`);
homeHtml = homeHtml.replace(/\[OG_TYPE\]/g, 'website');
homeHtml = homeHtml.replace(/\[OG_IMAGE\]/g, OG_IMAGE_URL);
const getTagStyle = (cluster) => {
    switch ((cluster || '').toLowerCase()) {
        case 'json': return 'background: #e3f2fd; color: #003c8f;'; // Light blue, dark blue text
        case 'text': return 'background: #e8f5e9; color: #1b5e20;'; // Light green, dark green text
        case 'seo': return 'background: #fff3e0; color: #e65100;';  // Light orange, dark orange text
        case 'developer': return 'background: #f3e5f5; color: #4a148c;'; // Light purple, dark purple text
        default: return 'background: #eee; color: #333;';
    }
};

const allToolsHtml = clusters.map(cluster => {
    const clusterTools = tools.filter(t => t.flags.enabled && t.clusterId === cluster.id);
    return `
    <section style="margin-bottom: 40px;">
        <h2 style="margin-bottom: 18px;">${cluster.label}</h2>
        <div style="display:grid; gap:15px;">
            ${clusterTools.map(t => `
                <article class="tool-card shadow-card" style="padding: 20px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 15px;">
                    <h3 style="margin-top: 0;"><a href="${t.path}" style="text-decoration: none; color: #0056b3;">${t.seo.h1}</a></h3>
                    <p>${t.seo.subtitle}</p>
                    <div style="margin-top: 10px; font-size: 0.85em; font-weight: 600;">
                        <span style="${getTagStyle(t.clusterId)} padding: 3px 8px; border-radius: 4px; margin-right: 5px; text-transform: uppercase;">${t.clusterId}</span>
                    </div>
                </article>
            `).join('\n')}
        </div>
    </section>`;
}).join('\n');

homeHtml = homeHtml.replace(/\[TOOL_LIST_HTML\]/g, allToolsHtml);
homeHtml = homeHtml.replace(/\[PRE_GRID_HTML\]/g, `
<section class="shadow-card" style="padding: 24px; margin-bottom: 30px;">
    <h2 style="margin-top: 0;">Best Starting Points</h2>
    <p style="margin:0 0 18px 0; color:#475569;">If you are new to the site, start here. These are the clearest first paths for the most common jobs.</p>
    <div style="display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr));">
        ${homepageWorkflowCards.slice(0, 4).map((card) => `<article class="shadow-card" style="padding:20px; border:1px solid #e2e8f0; border-radius:8px;">
            <h3 style="margin:0 0 10px 0;">${card.title}</h3>
            <p style="margin:0; color:#475569;">${card.description}</p>
            <div style="margin-top:12px;">
                <a href="${card.primaryPath}" style="display:inline-block; margin-right:10px; font-weight:700; text-decoration:none; color:#0056b3;">${card.primaryLabel}</a>
                <a href="${card.secondaryPath}" style="display:inline-block; color:#475569; text-decoration:none;">${card.secondaryLabel}</a>
            </div>
        </article>`).join('')}
    </div>
</section>`);
homeHtml = homeHtml.replace(/\[POST_GRID_HTML\]/g, `
<section class="shadow-card" style="padding: 30px; margin-top: 30px;">
    <h2 style="margin-top: 0;">Popular Guides</h2>
    <p style="color:#64748b;">Start with the guide if you need the why, then jump into the tool for the actual fix.</p>
    <div style="display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr));">
        ${guides.filter(guide => ['unicode-normalization', 'json-formatting', 'regex-debugging', 'text-cleaning'].includes(guide.id)).map(guide => `<a href="${guide.path}" style="display:block; padding:16px; border:1px solid #e2e8f0; border-radius:8px; text-decoration:none; color:inherit;"><h3 style="margin:0 0 8px 0; font-size:18px; color:#0056b3;">${guide.title}</h3><p style="margin:0; color:#475569; font-size:14px;">${guide.description}</p></a>`).join('')}
    </div>
</section>
<section class="shadow-card" style="padding: 30px; margin-top: 30px;">
    <h2 style="margin-top: 0;">Use the Right Path</h2>
    <div style="display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr));">
        <div style="padding:18px; border:1px solid #e2e8f0; border-radius:8px;">
            <h3 style="margin:0 0 8px 0;">Broken JSON</h3>
            <p style="margin:0; color:#475569;">Start with <a href="/json/json-validator/">JSON Validator</a>. If the payload is valid and you only need readability, switch to <a href="/json/json-formatter/">JSON Formatter</a>.</p>
        </div>
        <div style="padding:18px; border:1px solid #e2e8f0; border-radius:8px;">
            <h3 style="margin:0 0 8px 0;">Messy Text</h3>
            <p style="margin:0; color:#475569;">Start with <a href="/text/remove-line-breaks/">Remove Line Breaks</a> for pasted text or <a href="/text/html-cleaner/">HTML Cleaner</a> if the problem is markup noise.</p>
        </div>
        <div style="padding:18px; border:1px solid #e2e8f0; border-radius:8px;">
            <h3 style="margin:0 0 8px 0;">Unicode or Slug Issues</h3>
            <p style="margin:0; color:#475569;">Read <a href="/guides/unicode-normalization/">NFC vs NFD</a> first, then use the <a href="/dev/slug-generator/">Slug Generator</a> for consistent URL output.</p>
        </div>
        <div style="padding:18px; border:1px solid #e2e8f0; border-radius:8px;">
            <h3 style="margin:0 0 8px 0;">Regex Problems</h3>
            <p style="margin:0; color:#475569;">Use the <a href="/dev/regex-tester-explainer/">Regex Tester</a> for live inspection and the <a href="/guides/regex-debugging/">Regex Debugging guide</a> for failure patterns.</p>
        </div>
    </div>
</section>`);
homeHtml = homeHtml.replace(/\[SCHEMA_JSON\]/g, JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
        ...buildBaseOrganizationGraph(),
        {
            '@type': 'WebPage',
            name: 'Free Online Text, JSON & Developer Tools',
            url: `${BASE_URL}/`,
            description: 'Format JSON, validate payloads, analyze text, generate SEO-friendly slugs, debug regex, and convert data locally in your browser.'
        }
    ]
}, null, 2));

fs.writeFileSync(path.join(publicDir, 'index.html'), homeHtml, 'utf8');
addSitemapUrl(`${BASE_URL}/`);

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

        const meta = staticPageMeta[pageId] || {
            title: `${pageId.charAt(0).toUpperCase() + pageId.slice(1)} | FormatForge`,
            description: `FormatForge ${pageId} page.`,
            canonical: `/${pageId}/`,
            robots: 'index,follow',
            schemaType: 'WebPage',
            heading: pageId.charAt(0).toUpperCase() + pageId.slice(1)
        };
        const canonicalUrl = absoluteUrl(meta.canonical);
        const pageBreadcrumbs = [
            { name: 'Home', path: '/', url: `${BASE_URL}/` },
            { name: meta.heading, path: meta.canonical, url: canonicalUrl }
        ];

        pageHtml = pageHtml.replace(/\[TITLE_TAG\]/g, meta.title);
        pageHtml = pageHtml.replace(/\[PAGE_TITLE\]/g, meta.heading);
        pageHtml = pageHtml.replace(/\[PAGE_DESC\]/g, meta.description);
        pageHtml = pageHtml.replace(/\[PAGE_CONTENT\]/g, pageContent);
        pageHtml = pageHtml.replace(/\[BREADCRUMBS_HTML\]/g, buildBreadcrumbHtml(pageBreadcrumbs));
        pageHtml = applyMetaPlaceholders(pageHtml, {
            robots: meta.robots,
            canonicalUrl,
            ogTitle: meta.title,
            ogDescription: meta.description,
            ogUrl: canonicalUrl,
            ogType: 'website'
        });
        pageHtml = pageHtml.replace(/\[SCHEMA_JSON\]/g, JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
                ...buildBaseOrganizationGraph(),
                {
                    '@type': meta.schemaType,
                    name: meta.heading,
                    url: canonicalUrl,
                    description: meta.description
                },
                {
                    '@type': 'BreadcrumbList',
                    itemListElement: buildBreadcrumbItems(pageBreadcrumbs)
                }
            ]
        }, null, 2));

        const pageDestDir = path.join(publicDir, pageId);
        if (!fs.existsSync(pageDestDir)) fs.mkdirSync(pageDestDir, { recursive: true });
        fs.writeFileSync(path.join(pageDestDir, 'index.html'), pageHtml, 'utf8');

        addSitemapUrl(canonicalUrl, meta.robots);
    });
}

// Generate Sitemap
console.log('Generating sitemap.xml...');
let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
Array.from(sitemapUrls).sort().forEach(url => {
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

// Copy root static files (like ads.txt)
const srcStatic = path.join(srcDir, 'static');
if (fs.existsSync(srcStatic)) {
    fs.readdirSync(srcStatic).forEach(file => {
        fs.copyFileSync(path.join(srcStatic, file), path.join(publicDir, file));
    });
}

console.log(`Build complete! ${tools.length} tool pages generated. ${clusters.length} hub pages. Sitemap and index.html saved.`);
