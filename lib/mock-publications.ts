export type ContentType = 'Research' | 'Hypothesis' | 'Essay' | 'Analysis';

export type Subject =
  | 'Economics & Markets'
  | 'Technology & AI'
  | 'Business & Organizations'
  | 'Society, Politics & Philosophy';

export interface ArticleSection {
  id: string;
  title: string;
  subtitle?: string;
  paragraphs: string[];
}

export interface Publication {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  contentType: ContentType;
  subject: Subject;
  publishedAt: string;
  readingTimeMinutes?: number;
  contentHtml?: string;
  pdfAttachment?: {
    url: string;
    filename: string;
    title?: string;
    pageCount?: number;
    fileSizeBytes?: number;
    fileSizeDisplay?: string;
  };
  introParagraphs?: string[];
  sections?: ArticleSection[];
}

export const ORDERED_CONTENT_TYPES: ContentType[] = [
  'Research',
  'Hypothesis',
  'Essay',
  'Analysis',
];

export const MOCK_PUBLICATIONS: Publication[] = [
  {
    id: 'pub-1',
    slug: 'quantitative-study-market-valuation-models',
    title: 'A Quantitative Study of Market Valuation Models',
    subtitle: 'Comparing mathematical models and historical valuation data.',
    contentType: 'Research',
    subject: 'Economics & Markets',
    publishedAt: '2025-01-20T00:00:00Z',
    readingTimeMinutes: 14,
    pdfAttachment: {
      url: '/sample-publication.pdf',
      filename: 'market-valuation-models.pdf',
      fileSizeBytes: 1840000,
    },
    introParagraphs: [
      'Dario Amodei is the CEO of Anthropic, a public benefit corporation dedicated to building AI systems that are steerable, interpretable and safe.',
      'Previously, Dario served as Vice President of Research at OpenAI, where he led the development of large language models like GPT-2 and GPT-3. He is also the co-inventor of reinforcement learning from human feedback. Before joining OpenAI, he worked at Google Brain as a Senior Research Scientist.',
      'Dario earned his doctorate degree in biophysics from Princeton University as a Hertz Fellow, and was a postdoctoral scholar at the Stanford University School of Medicine.',
    ],
    sections: [
      {
        id: 'surprising-empowerment',
        title: '2. A surprising and terrible empowerment',
        subtitle: 'Misuse for destruction',
        paragraphs: [
          'Let’s suppose that the problems of AI autonomy have been solved—we are no longer worried that the country of AI geniuses will go rogue and overpower humanity. The AI geniuses do what humans want them to do, and because they have enormous commercial value, individuals and organizations throughout the world can “rent” one or more AI geniuses to do various tasks for them.',
          'Under this assumption, who has access to the AI geniuses, and what do they want to do with them? The first category of concern is malicious misuse: human bad actors using powerful AI to cause harm, whether through biological weapons, cyber warfare, or kinetic disruptions.',
        ],
      },
      {
        id: 'curriculum-optimization',
        title: '3. Quantitative analysis of valuation trajectories',
        subtitle: 'Statistical modeling of long-term equilibria',
        paragraphs: [
          'When we apply rigorous statistical frameworks across century-scale asset returns, we observe that discount rate regimes dominate cash-flow variance over multi-decade holding periods.',
          'The historical record provides a clear cautionary note: valuation models that extrapolate recent liquidity regimes consistently underestimate tail risk during structural macroeconomic transitions.',
        ],
      },
      {
        id: 'empirical-findings',
        title: '4. Empirical evaluation across asset classes',
        paragraphs: [
          'Evaluating equities, fixed-income yields, and synthetic commodities reveals that non-linear correlation spikes occur precisely when diversification is most required by risk models.',
          'Mathematical modeling must incorporate dynamic correlation matrices rather than static historical averages to remain robust under systemic stress.',
        ],
      },
      {
        id: 'conclusion-outlook',
        title: '5. Institutional implications and forward outlook',
        paragraphs: [
          'Institutional capital allocators must transition from point-estimate forecasting toward resilient distributional boundaries. This necessitates structural humility in portfolio construction.',
        ],
      },
    ],
  },
  {
    id: 'pub-2',
    slug: 'hypothesis-next-bitcoin-cycle',
    title: 'A Hypothesis on the Next Bitcoin Cycle',
    subtitle: 'A tentative thesis about the next phase of the market.',
    contentType: 'Hypothesis',
    subject: 'Economics & Markets',
    publishedAt: '2026-02-28T00:00:00Z',
    readingTimeMinutes: 9,
    pdfAttachment: {
      url: '/sample-publication.pdf',
      filename: 'next-bitcoin-cycle.pdf',
      fileSizeBytes: 950000,
    },
    introParagraphs: [
      'Digital asset market cycles have historically synchronized with block reward subsidy halvings and global fiat liquidity expansion. As institutional custody and sovereign balance sheet considerations enter the fray, the underlying cycle mechanics are fundamentally decoupling from retail-driven speculative mania.',
    ],
    sections: [
      {
        id: 'liquidity-dynamics',
        title: '1. Macroeconomic liquidity and sovereign adoption',
        paragraphs: [
          'Global M2 expansion and central bank balance sheet contractions serve as the primary macro determinants for non-sovereign monetary store-of-value assets.',
        ],
      },
      {
        id: 'structural-shifts',
        title: '2. Structural shifts in institutional order routing',
        paragraphs: [
          'Exchange-traded products have permanently altered price discovery mechanisms, shifting marginal volume from offshore venues to domestic regulated clearinghouses.',
        ],
      },
    ],
  },
  {
    id: 'pub-3',
    slug: 'hypothesis-capital-allocation-decentralized-networks',
    title: 'A Hypothesis on Capital Allocation in Decentralized Networks',
    subtitle: 'A tentative thesis about capital formation and governance mechanisms.',
    contentType: 'Hypothesis',
    subject: 'Economics & Markets',
    publishedAt: '2026-02-10T00:00:00Z',
    readingTimeMinutes: 11,
    introParagraphs: [
      'Decentralized autonomous organizations and algorithmic treasuries promised disintermediated capital allocation. In practice, early implementations demonstrated severe principal-agent inefficiencies and voter apathy.',
    ],
    sections: [
      {
        id: 'governance-tribalism',
        title: '1. Governance dynamics and voter apathy',
        paragraphs: [
          'Token-weighted voting inherently concentrates governance power in the hands of lending protocols and venture custodians, leaving protocol stewardship vulnerable to economic extraction.',
        ],
      },
      {
        id: 'treasury-resilience',
        title: '2. Algorithmic treasury resilience',
        paragraphs: [
          'Sustainable protocol treasuries require asset-liability matching that avoids reflexively holding native governance tokens as primary reserve assets.',
        ],
      },
    ],
  },
  {
    id: 'pub-4',
    slug: 'how-ai-may-reshape-labor-market',
    title: 'How AI May Reshape the Labor Market',
    subtitle: 'An argument about productivity, work, and economic change.',
    contentType: 'Essay',
    subject: 'Technology & AI',
    publishedAt: '2026-01-20T00:00:00Z',
    readingTimeMinutes: 16,
    pdfAttachment: {
      url: '/sample-publication.pdf',
      filename: 'ai-labor-market.pdf',
      fileSizeBytes: 2120000,
    },
    introParagraphs: [
      'Dario Amodei is the CEO of Anthropic, a public benefit corporation dedicated to building AI systems that are steerable, interpretable and safe.',
      'Previously, Dario served as Vice President of Research at OpenAI, where he led the development of large language models like GPT-2 and GPT-3. He is also the co-inventor of reinforcement learning from human feedback. Before joining OpenAI, he worked at Google Brain as a Senior Research Scientist.',
      'Dario earned his doctorate degree in biophysics from Princeton University as a Hertz Fellow, and was a postdoctoral scholar at the Stanford University School of Medicine.',
    ],
    sections: [
      {
        id: 'introduction-abstract',
        title: 'Introduction and historical parallels',
        paragraphs: [
          'Every technological paradigm shift—from the mechanization of agriculture to the electrification of factories—has caused localized labor dislocation while generating unexpected downstream demand.',
          'However, artificial intelligence differs fundamentally: rather than augmenting or replacing physical exertion, it directly interfaces with cognitive and analytical workflows.',
        ],
      },
      {
        id: 'surprising-empowerment',
        title: '1. A surprising and terrible empowerment',
        subtitle: 'Cognitive automation and distribution of leverage',
        paragraphs: [
          'Let’s suppose that the problems of AI autonomy have been solved—we are no longer worried that the country of AI geniuses will go rogue and overpower humanity. The AI geniuses do what humans want them to do, and because they have enormous commercial value, individuals and organizations throughout the world can “rent” one or more AI geniuses to do various tasks for them.',
          'Under this assumption, who has access to the AI geniuses, and what do they want to do with them? The immediate economic consequence is an exponential increase in cognitive leverage for smaller operational teams.',
        ],
      },
      {
        id: 'knowledge-work-redesign',
        title: '2. The redesign of cognitive labor',
        subtitle: 'From task execution to architectural oversight',
        paragraphs: [
          'Junior knowledge workers historically developed domain mastery through thousands of hours of apprenticeship tasks: drafting summaries, assembling spreadsheets, and debugging boilerplate code.',
          'When these intermediate tasks become automated, organizations must reinvent the apprentice-to-master progression pipeline to avoid creating an insurmountable barrier to professional competency.',
        ],
      },
      {
        id: 'productivity-macroeconomics',
        title: '3. Productivity frontiers and macroeconomic impacts',
        paragraphs: [
          'Total factor productivity growth has remained stubbornly sluggish in developed economies for two decades despite digital saturation. AI could reignite productivity growth, but its gains risk severe geographic and corporate concentration without deliberate structural policy.',
        ],
      },
      {
        id: 'policy-frameworks',
        title: '4. Institutional frameworks for human-AI equilibrium',
        paragraphs: [
          'Sovereign states and educational systems must modernize curricular frameworks, moving away from rote memorization toward critical evaluation, synthesis, and systems thinking.',
        ],
      },
    ],
  },
  {
    id: 'pub-5',
    slug: 'why-software-alone-not-competitive-advantage',
    title: 'Why Software Alone Is Not a Competitive Advantage',
    subtitle: 'An essay about differentiation and business strategy.',
    contentType: 'Essay',
    subject: 'Business & Organizations',
    publishedAt: '2025-12-14T00:00:00Z',
    readingTimeMinutes: 12,
    introParagraphs: [
      'In the early decades of the commercial internet, writing reliable software was an extraordinary barrier to entry. Today, software development tools, frameworks, and AI copilots have radically compressed engineering timelines, commoditizing pure technical implementation.',
    ],
    sections: [
      {
        id: 'commoditization-code',
        title: '1. The commoditization of code',
        paragraphs: [
          'When code generation costs approach zero, the defensibility of a technology business pivots entirely toward proprietary data flywheels, regulatory licenses, and high-trust customer relationships.',
        ],
      },
      {
        id: 'distribution-moats',
        title: '2. Distribution and switching costs as enduring moats',
        paragraphs: [
          'Superior software without superior distribution routinely loses to incumbent platforms possessing deeply entrenched workflow dependencies.',
        ],
      },
    ],
  },
  {
    id: 'pub-6',
    slug: 'institutions-incentives-political-outcomes',
    title: 'Institutions, Incentives, and Political Outcomes',
    subtitle: 'An analysis of how institutions shape social outcomes.',
    contentType: 'Analysis',
    subject: 'Society, Politics & Philosophy',
    publishedAt: '2025-11-05T00:00:00Z',
    readingTimeMinutes: 18,
    introParagraphs: [
      'Institutions are the formal rules, informal norms, and enforcement mechanisms that structure repeated social and political interactions. When incentives diverge from collective welfare, institutional decay accelerates silently until systemic crises occur.',
    ],
    sections: [
      {
        id: 'institutional-decay',
        title: '1. The mechanics of bureaucratic inertia',
        paragraphs: [
          'Bureaucracies systematically optimize for self-preservation and budget expansion rather than original mandate fulfillment, resulting in ossification that resists external reform.',
        ],
      },
      {
        id: 'incentive-alignment',
        title: '2. Aligning long-term social welfare with political capital',
        paragraphs: [
          'Constitutional design must continually update feedback loops to penalize short-term electoral pandering and incentivize multi-generational capital investment.',
        ],
      },
    ],
  },
];

export function getAllPublications(): Publication[] {
  return MOCK_PUBLICATIONS;
}

export function getPublicationsGroupedByType(): Record<ContentType, Publication[]> {
  const grouped: Record<ContentType, Publication[]> = {
    Research: [],
    Hypothesis: [],
    Essay: [],
    Analysis: [],
  };

  for (const pub of MOCK_PUBLICATIONS) {
    if (grouped[pub.contentType]) {
      grouped[pub.contentType].push(pub);
    }
  }

  return grouped;
}

export function getPublicationBySlug(slug: string): Publication | undefined {
  return MOCK_PUBLICATIONS.find((pub) => pub.slug === slug);
}
