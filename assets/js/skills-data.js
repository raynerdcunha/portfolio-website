/*
 * skills-data.js
 * Single source of truth for the Skills section (graph AND list view).
 *
 * Rules (keep it honest — interviewers WILL ask):
 *  - Only list a skill if at least one project, job or course in `uses` backs it.
 *  - Node size = number of entries in `uses`. Add a use, the node grows.
 *  - Keep the total under ~25 skills so the graph stays readable.
 */
window.RD_SKILLS = {
  clusters: [
    { id: 'lang',    label: 'Languages' },
    { id: 'web',     label: 'Web & Mobile' },
    { id: 'data',    label: 'Data & Databases' },
    { id: 'ai',      label: 'AI / ML' },
    { id: 'systems', label: 'Systems & Tools' }
  ],

  skills: [
    // Languages
    { id: 'python',  label: 'Python',     cluster: 'lang', uses: ['AI/ML research internship', 'DRA research', 'IEEE 33-bus dashboard', '124 LeetCode problems'] },
    { id: 'js',      label: 'JS', cluster: 'lang', uses: ['IEEE 33-bus dashboard', 'FlameoShell web demo', 'LRT Reporter (2nd place)', 'Active-Ape extension', 'Portfolio site'] },
    { id: 'c',       label: 'C / C++',    cluster: 'lang', uses: ['FlameoShell', 'IMU 3D Wheel (STM32)'] },
    { id: 'sql',     label: 'SQL',        cluster: 'lang', uses: ['IEEE 33-bus dashboard', '55 LeetCode SQL problems'] },
    { id: 'kotlin',  label: 'Kotlin',     cluster: 'lang', uses: ['Omakase or Not?'] },
    { id: 'bash',    label: 'Bash',       cluster: 'lang', uses: ['FlameoShell', 'Linux development'] },

    // Web & Mobile
    { id: 'htmlcss', label: 'HTML / CSS',      cluster: 'web', uses: ['This website', 'IEEE 33-bus dashboard', 'LRT Reporter', 'IMU 3D Wheel', 'Portfolio site'] },
    { id: 'fastapi', label: 'FastAPI',         cluster: 'web', uses: ['AI/ML research internship', 'IEEE 33-bus dashboard'] },
    { id: 'rest',    label: 'REST APIs',       cluster: 'web', uses: ['AI/ML research internship', 'IEEE 33-bus dashboard', 'Portfolio site weather (Open-Meteo)'] },
    { id: 'gsap',    label: 'GSAP',            cluster: 'web', uses: ['Portfolio site (Rayner\'s Domain)'] },
    { id: 'svgcanvas', label: 'SVG / Canvas',  cluster: 'web', uses: ['Portfolio site knowledge graph', 'Portfolio site animations'] },
    { id: 'seo',      label: 'SEO / Search Console', short: 'SEO', cluster: 'web', uses: ['Portfolio site (sitemap, robots.txt, llms.txt, Google Search Console)'] },
    { id: 'appsscript', label: 'Google Apps Script', short: 'Apps Script', cluster: 'web', uses: ['Portfolio site contact form'] },
    { id: 'node',    label: 'Node.js',         cluster: 'web', uses: ['IEEE 33-bus dashboard'] },
    { id: 'compose', label: 'Jetpack Compose', cluster: 'web', uses: ['Omakase or Not?'] },

    // Data & Databases
    { id: 'sqlite',  label: 'SQLite',         cluster: 'data', uses: ['IEEE 33-bus dashboard'] },
    { id: 'neo4j',   label: 'Neo4j / Cypher', cluster: 'data', uses: ['DRA research knowledge graph'] },
    { id: 'pandas',  label: 'pandas / NumPy', cluster: 'data', uses: ['AI/ML research internship', 'DRA research'] },

    // AI / ML
    { id: 'gnn',     label: 'Graph Neural Networks', short: 'GNNs', cluster: 'ai', uses: ['AI/ML research internship', 'IEEE 33-bus dashboard'] },
    { id: 'rl',      label: 'Reinforcement Learning', short: 'Reinforcement L.', cluster: 'ai', uses: ['AI/ML research internship'] },
    { id: 'agents',  label: 'LLM Agents / MCP', short: 'LLM Agents', cluster: 'ai', uses: ['AI/ML research internship', 'IEEE 33-bus dashboard', 'Vanderbilt Agentic AI certificate'] },
    { id: 'rag',     label: 'RAG',                cluster: 'ai', uses: ['DeepLearning.AI RAG certificate'] },

    // Systems & Tools
    { id: 'linux',   label: 'Linux / Unix', cluster: 'systems', uses: ['FlameoShell'] },
    { id: 'git',     label: 'Git / GitHub', cluster: 'systems', uses: ['Every project', 'Active-Ape (branching, PR reviews)', 'CodeSignal certificate', 'Portfolio site'] },
    { id: 'vercel',  label: 'Vercel', cluster: 'systems', uses: ['Portfolio site deployment', 'FlameoShell web demo'] },
    { id: 'cloudflare', label: 'Cloudflare DNS / DNSSEC', short: 'Cloudflare DNS', cluster: 'systems', uses: ['Portfolio site domain and DNS (DNSSEC, DMARC)'] },
    { id: 'stm32',   label: 'FreeRTOS / UART / I2C', short: 'FreeRTOS', cluster: 'systems', uses: ['IMU 3D Wheel', 'EcoCar electrical team'] }
  ],

  // Cross-cluster links: skills that are used together.
  links: [
    ['python', 'pandas'], ['python', 'fastapi'], ['python', 'neo4j'],
    ['js', 'htmlcss'], ['js', 'gsap'], ['js', 'svgcanvas'], ['js', 'appsscript'], ['git', 'vercel'], ['vercel', 'cloudflare'], ['htmlcss', 'seo'], ['js', 'node'],
    ['kotlin', 'compose'],
    ['sql', 'sqlite'],
    ['c', 'linux'], ['c', 'stm32'], ['bash', 'linux'],
    ['fastapi', 'rest'], ['node', 'rest'],
    ['python', 'gnn'], ['gnn', 'rl'],
    ['agents', 'fastapi'], ['agents', 'rag'],
    ['gnn', 'neo4j']
  ]
};
