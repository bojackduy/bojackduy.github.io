import type { WebsitesData } from "~/types";
import { WEBSITE_URL } from "~/utils/constants";

const websites: WebsitesData = {
  favorites: {
    title: "My Links",
    sites: [
      {
        id: "my-website",
        title: "Portfolio",
        img: "img/sites/astral.svg",
        link: WEBSITE_URL,
        inner: true
      },
      {
        id: "opencode-loopd",
        title: "OpenCode Loopd",
        img: "img/sites/github.svg",
        link: "https://github.com/bojackduy/opencode-loopd"
      },
      {
        id: "opencode-telescope",
        title: "OpenCode Telescope",
        img: "img/sites/github.svg",
        link: "https://github.com/bojackduy/opencode-telescope"
      },
      {
        id: "my-github",
        title: "Github",
        img: "img/sites/github.svg",
        link: "https://github.com/bojackduy"
      },
      {
        id: "my-email",
        title: "Email",
        img: "img/sites/gmail.svg",
        link: "mailto:trinhchanduy.30072005@gmail.com"
      }
    ]
  },
  freq: {
    title: "Frequently Visited",
    sites: [
      {
        id: "github",
        title: "Github",
        img: "img/sites/github.svg",
        link: "https://github.com/"
      },
      {
        id: "lazyjira",
        title: "LazyJira",
        img: "img/sites/github.svg",
        link: "https://github.com/bojackduy/lazyjira"
      },
      {
        id: "leetcode",
        title: "LeetCode",
        img: "img/sites/leetcode.svg",
        link: "https://leetcode.com/u/bojackduy/"
      },
      {
        id: "lazyconfluence",
        title: "LazyConfluence",
        img: "img/sites/github.svg",
        link: "https://github.com/bojackduy/lazyconfluence"
      },
      {
        id: "opencode-learn",
        title: "OpenCode Learn",
        img: "img/sites/github.svg",
        link: "https://github.com/bojackduy/opencode-learn"
      },
      {
        id: "tetris-io",
        title: "Tetris IO",
        img: "img/sites/github.svg",
        link: "https://github.com/bojackduy/tetris-io"
      }
    ]
  }
};

export default websites;
