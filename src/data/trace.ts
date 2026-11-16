// All site content lives here. Every figure comes from the LinkedIn profile
// or a repo README; nothing is invented. Edit text here, not in components.

export type SpanKind = "group" | "role" | "engagement" | "project";

export interface Link {
  label: string;
  href: string;
}

export interface Span {
  id: string;
  title: string;
  kind: SpanKind;
  /** One-line result shown in the row. Required unless kind is "group". */
  summary?: string;
  /** "YYYY-MM-DD". Roles and projects only. */
  start?: string;
  /** "YYYY-MM-DD", or null for present. */
  end?: string | null;
  description?: string;
  metric?: string;
  stack?: string[];
  links?: Link[];
  pipeline?: string[];
  status?: string;
  caveat?: string;
  children?: Span[];
}

export interface Eval {
  name: string;
  issuer: string;
}

export interface Headline {
  value: string;
  label: string;
}

export const profile = {
  name: "Reuben Alex",
  role: "Associate AI/ML Engineer at 66degrees",
  location: "Bengaluru, India",
  tagline: "I build AI agents that run inside real enterprise systems.",
  headline: [
    { value: "80%", label: "faster IT ticket closure" },
    { value: "~$600K", label: "saved on leases" },
    { value: "3rd of 245", label: "Arize track, Google Cloud Rapid Agent Hackathon" },
  ] as Headline[],
  email: "reubenalexa@gmail.com",
  github: "https://github.com/Reuben-Alex",
  linkedin: "https://www.linkedin.com/in/reuben-alex-3968b62a2/",
};

export const DEFAULT_SPAN_ID = "clintrace";

export const career: Span = {
  id: "career",
  title: "Career",
  kind: "group",
  children: [
    {
      id: "mu_sigma_trainee",
      title: "Internship Trainee, Mu Sigma",
      kind: "role",
      summary: "Internship Trainee at Mu Sigma",
      start: "2023-01-01",
      end: "2024-09-01",
      description: "Internship Trainee at Mu Sigma, on site in India.",
      stack: ["IT business analysis"],
    },
    {
      id: "sixtysix_degrees",
      title: "66degrees",
      kind: "group",
      children: [
        {
          id: "intern_sam2",
          title: "AI/ML Intern, 66degrees",
          kind: "role",
          summary: "Tower space utilisation up 30%",
          start: "2024-09-01",
          end: "2025-06-01",
          description:
            "Built a computer vision pipeline on Meta's SAM2 that segments antennas, RRUs, cabling and mounts from tower site imagery, and maps how much tower space is in use so equipment can be planned better.",
          metric: "30% better tower space utilisation",
          stack: ["SAM2", "Computer vision", "Python"],
        },
        {
          id: "associate_engineer",
          title: "Associate AI/ML Engineer, 66degrees",
          kind: "role",
          summary: "Multi-agent systems in production, across 6 client engagements",
          start: "2025-06-01",
          end: null,
          description:
            "I design and deploy multi-agent systems on Google ADK, Vertex AI and Gemini Enterprise for enterprise clients, and work directly with client teams on requirements, demos and rollout. 66degrees is a Google Cloud AI Partner of the Year.",
          metric: "6 client engagements",
          stack: [
            "Google ADK",
            "Vertex AI",
            "Gemini Enterprise",
            "RAG",
            "NL-to-SQL",
            "OCR",
            "BigQuery",
            "Python",
          ],
          children: [
            {
              id: "it_hr_multi_agent",
              title: "IT and HR multi-agent assistant",
              kind: "engagement",
              summary: "Manual IT ticket closure time down 80%",
              description:
                "A multi-agent system on Google ADK, integrated with ServiceNow and SAP SuccessFactors, so employees can raise IT tickets and ask HR benefits questions in one conversation.",
              metric: "80% less manual ticket closure time",
              stack: ["Google ADK", "ServiceNow", "SAP SuccessFactors"],
            },
            {
              id: "lease_agent",
              title: "Lease and pricing agent, manufacturing",
              kind: "engagement",
              summary: "800+ leases tracked, close to $600,000 saved",
              description:
                "A unified agent on Gemini Enterprise for a manufacturing client. It flags upcoming lease expirations so the client avoids premium re-leasing costs, and uses purchase order data to inform sale pricing.",
              metric: "Close to $600,000 saved",
              stack: ["Gemini Enterprise"],
            },
            {
              id: "contact_centre_dashboard",
              title: "Contact Centre Intelligence dashboard",
              kind: "engagement",
              summary: "Handle time down 45%, used by 1000+ agents",
              description:
                "A Contact Centre Intelligence dashboard embedded in Genesys that gives support agents real-time predictive insights and KPIs.",
              metric: "45% lower handle time",
              stack: ["Genesys", "Predictive insights"],
            },
            {
              id: "healthcare_voice_bot",
              title: "Healthcare voice bot, proof of value",
              kind: "engagement",
              summary: "Inbound patient calls across 30+ intents",
              description:
                "A proof-of-value voice bot on Dialogflow CX for a healthcare company. It handles inbound patient calls and answers questions about payment statements and refunds.",
              metric: "30+ call intents",
              stack: ["Dialogflow CX"],
            },
          ],
        },
      ],
    },
    {
      id: "side_projects",
      title: "Side projects",
      kind: "group",
      children: [
        {
          id: "clintrace",
          title: "ClinTrace",
          kind: "project",
          summary: "ED triage agent · 3rd of 245, Arize track",
          start: "2026-06-08",
          end: "2026-06-09",
          description:
            "An emergency department triage agent, built solo. It turns free-text nursing intake into an ESI level, red-flag alerts and a routing order, and traces every step in Arize Phoenix. Nurses approve or override each decision, and those overrides recalibrate clinically similar future cases without retraining the model. Deployed on Vertex AI Agent Engine and validated on real CDC emergency department data.",
          metric:
            "3rd of 245 final-round submissions in the Arize track of the Google Cloud Rapid Agent Hackathon",
          stack: [
            "Google ADK",
            "Vertex AI Agent Engine",
            "Gemini",
            "Arize Phoenix",
            "Cloud Run",
            "BigQuery",
          ],
          pipeline: ["parse", "assess", "route", "feedback", "audit"],
          links: [{ label: "GitHub", href: "https://github.com/Reuben-Alex/ClinTrace" }],
        },
        {
          id: "re_entry",
          title: "Re-entry",
          kind: "project",
          summary: "Proves smart-contract bugs by exploiting them, then verifies the fix",
          start: "2026-10-16",
          end: "2026-10-23",
          description:
            "An agent that compiles a contract into a local sandbox, writes an exploit from scratch, runs it, and feeds the real revert reason into the next attempt. It reports a bug only once the exploit has worked, then patches the contract and replays the same exploit to confirm the fix holds. Everything runs on toy contracts in an isolated local chain.",
          metric: "Agent-generated 5 of 13",
          stack: ["NVIDIA Nemotron", "Nebius Token Factory", "Tavily", "Anvil", "Solidity", "Python"],
          pipeline: ["find", "prove", "fix", "verify"],
          caveat:
            "The misses are published: two wins needed a hand-written fallback and six targets had no working exploit in the benchmark pass. All 13 control contracts correctly came back clean.",
          links: [{ label: "GitHub", href: "https://github.com/Reuben-Alex/re-entry" }],
        },
        {
          id: "trellis",
          title: "Trellis",
          kind: "project",
          summary: "Statement of Work to a deployable Google Cloud repo",
          start: "2026-11-10",
          end: "2026-11-10",
          description:
            "An interactive CLI that reads a client Statement of Work, works out which building blocks it implies, interviews you about the gaps and flags what will not work for that client. It then generates a client repo from reusable, official assets, and merges later documents in without discarding the team's changes.",
          metric: "254 passing tests",
          stack: ["Python", "Gemini", "Terraform", "Google Cloud"],
          pipeline: ["ingest", "assess", "scaffold", "update"],
          status: "alpha · private repo",
        },
        {
          id: "revenant",
          title: "Revenant",
          kind: "project",
          summary: "Early-warning map for wildfires that survive the winter",
          start: "2026-11-02",
          end: "2026-11-11",
          description:
            "A map of \"zombie\" wildfires: fires that smoulder underground through winter and re-emerge in spring. A spring hotspot counts as a revenant if it lies within about 1 km of last year's fire scar and appears within 50 days of the snow leaving it. The rule follows Scholten et al. (Nature, 2021).",
          stack: ["NASA FIRMS", "VIIRS", "Python", "Kiro"],
          status: "in development",
          caveat:
            "Historical results are approximate, and only 2024 beat the chance baseline. The app says so.",
          links: [{ label: "GitHub", href: "https://github.com/Reuben-Alex/Revenant" }],
        },
      ],
    },
  ],
};

export const evals: Eval[] = [
  { name: "Professional Machine Learning Engineer", issuer: "Google Cloud" },
  { name: "Generative AI Leader", issuer: "Google Cloud" },
  {
    name: "Certified Partner Specialist: Gemini Enterprise Deployment",
    issuer: "Google Cloud Partner",
  },
  {
    name: "Certified Partner Specialist: Gemini Enterprise Agent Development",
    issuer: "Google Cloud Partner",
  },
  { name: "Forward Deployed Engineer", issuer: "Badge, 4-day programme" },
];
