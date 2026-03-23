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
        Processing method: All processing happens locally in your browser.
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
    const hubRelatedGuides = guides.filter(guide => (guide.relatedTools || []).some(toolId => {
        const t = tools.find(tool => tool.id === toolId);
        return t && t.clusterId === cluster.id;
    }));

    const hubToolsHtml = `
        <section style="margin-bottom: 40px;">
            <h2 style="margin-bottom: 18px;">Popular ${cluster.label}</h2>
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
    hubHtml = hubHtml.replace(/\[PRE_GRID_HTML\]/g, buildBreadcrumbHtml(hubBreadcrumbs));
    if (hubRelatedGuides.length > 0) {
        const hubGuideHtml = `
        <section class="shadow-card" style="margin-top: 40px; padding: 30px;">
            <h2 style="margin-top: 0;">Guides That Support These Tools</h2>
            <p style="color:#64748b;">Use a guide when you need context, examples, and failure patterns before jumping into the tool.</p>
            <div style="display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr));">
                ${hubRelatedGuides.slice(0, 4).map(guide => `<a href="${guide.path}" style="display:block; padding:16px; border:1px solid #e2e8f0; border-radius:8px; text-decoration:none; color:inherit;"><h3 style="margin:0 0 8px 0; font-size:18px; color:#0056b3;">${guide.title}</h3><p style="margin:0; color:#475569; font-size:14px;">${guide.description}</p></a>`).join('')}
            </div>
        </section>`;
        hubHtml = hubHtml.replace(/\[POST_GRID_HTML\]/g, hubGuideHtml);
    } else {
        hubHtml = hubHtml.replace(/\[POST_GRID_HTML\]/g, '');
    }
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
    <h2 style="margin-top: 0;">Start With the Right Task</h2>
    <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <a href="/json/json-formatter/" style="padding:10px 14px; border:1px solid #dbeafe; border-radius:8px; text-decoration:none;">Format JSON</a>
        <a href="/text/text-analyzer/" style="padding:10px 14px; border:1px solid #dcfce7; border-radius:8px; text-decoration:none;">Analyze Text</a>
        <a href="/dev/slug-generator/" style="padding:10px 14px; border:1px solid #fde68a; border-radius:8px; text-decoration:none;">Generate a URL Slug</a>
        <a href="/guides/unicode-normalization/" style="padding:10px 14px; border:1px solid #e2e8f0; border-radius:8px; text-decoration:none;">NFC vs NFD Explained</a>
        <a href="/guides/json-formatting/" style="padding:10px 14px; border:1px solid #e2e8f0; border-radius:8px; text-decoration:none;">How to Format JSON</a>
        <a href="/guides/regex-debugging/" style="padding:10px 14px; border:1px solid #e2e8f0; border-radius:8px; text-decoration:none;">How to Debug Regex</a>
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
    <h2 style="margin-top: 0;">Why Teams Use FormatForge</h2>
    <p>FormatForge is built for practical debugging and publishing work. Use it to inspect API payloads, clean copied text, normalize Unicode, generate consistent URL slugs, and test regular expressions without sending sensitive data to a remote service.</p>
    <h3>FAQ</h3>
    <details style="margin-bottom:10px;"><summary style="cursor:pointer; font-weight:bold;">Does FormatForge upload my data?</summary><p>No. The core tools are designed to run locally in your browser.</p></details>
    <details style="margin-bottom:10px;"><summary style="cursor:pointer; font-weight:bold;">Which tools are best for JSON work?</summary><p>Start with JSON Formatter for readability, JSON Validator for syntax errors, and JSON Minifier for compact production payloads.</p></details>
    <details><summary style="cursor:pointer; font-weight:bold;">Is FormatForge only for developers?</summary><p>No. It is also useful for technical SEOs, content teams, analysts, and support teams who work with structured text.</p></details>
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
