import type { BearData } from "~/types";

const bear: BearData[] = [
  {
    id: "profile",
    title: "Start Here",
    icon: "i-fa-solid:paw",
    md: [
      {
        id: "about-me",
        title: "About Me",
        file: "markdown/about-me.md",
        icon: "i-la:dragon",
        excerpt: "Backend engineer, AI tooling builder, and CS student"
      },
      {
        id: "resume",
        title: "Résumé",
        file: "markdown/resume.md",
        icon: "i-octicon:file",
        excerpt: "Experience, education, awards, and skills"
      },
      {
        id: "about-site",
        title: "About This Site",
        file: "markdown/about-site.md",
        icon: "i-octicon:browser",
        excerpt: "Something about this personal portfolio site..."
      }
    ]
  },
  {
    id: "experience",
    title: "Experience",
    icon: "i-carbon:enterprise",
    md: [
      {
        id: "experience-overview",
        title: "Experience Overview",
        file: "markdown/experience-overview.md",
        icon: "i-carbon:portfolio",
        excerpt: "Production systems at Tiger Tribe and Spartan"
      },
      {
        id: "hapbev",
        title: "B2B Order & Forecasting",
        file: "markdown/hapbev.md",
        icon: "i-carbon:data-base",
        excerpt: ".NET, PostgreSQL, CQRS, ERP integration"
      },
      {
        id: "playlab",
        title: "Retail Price Intelligence",
        file: "markdown/playlab.md",
        icon: "i-carbon:chart-line-data",
        excerpt: "NestJS, BullMQ, PostgreSQL, scraping providers"
      },
      {
        id: "dietfit",
        title: "DietFit",
        file: "markdown/dietfit.md",
        icon: "i-carbon:health-cross",
        excerpt: "AI nutrition coaching and weekly meal plans"
      },
      {
        id: "appsfy",
        title: "Appsfy",
        file: "markdown/appsfy.md",
        icon: "i-carbon:application-mobile",
        excerpt: "Mobile design intelligence and AI layouts"
      },
      {
        id: "reply2lead",
        title: "Reply2Lead",
        file: "markdown/reply2lead.md",
        icon: "i-carbon:chat-bot",
        excerpt: "AI-assisted lead conversion and social messaging"
      }
    ]
  },
  {
    id: "open-source",
    title: "Open Source",
    icon: "i-octicon:repo",
    md: [
      {
        id: "open-source-overview",
        title: "Open Source Overview",
        file: "markdown/open-source.md",
        icon: "i-icon-park-outline:github",
        excerpt: "Agent tooling, terminal workflows, and systems projects"
      },
      {
        id: "opencode-loopd",
        title: "OpenCode Loopd",
        file: "markdown/opencode-loopd.md",
        icon: "i-carbon:task-star",
        excerpt: "Autonomous background goal engine for OpenCode"
      },
      {
        id: "opencode-telescope",
        title: "OpenCode Telescope",
        file: "markdown/opencode-telescope.md",
        icon: "i-carbon:search-locate",
        excerpt: "Fast local search across AI coding history"
      },
      {
        id: "lazyjira",
        title: "LazyJira",
        file: "markdown/lazyjira.md",
        icon: "i-carbon:ibm-cloud-projects",
        excerpt: "Keyboard-first Jira workspace for the terminal"
      },
      {
        id: "lazyconfluence",
        title: "LazyConfluence",
        file: "markdown/lazyconfluence.md",
        icon: "i-carbon:document-view",
        excerpt: "Local-first Confluence reader with image rendering"
      },
      {
        id: "more-projects",
        title: "More Projects",
        file: "markdown/more-projects.md",
        icon: "i-carbon:overflow-menu-horizontal",
        excerpt: "Learning tools, worktree orchestration, Tetris, and networking"
      }
    ]
  }
];

export default bear;
