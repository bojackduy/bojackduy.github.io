import type { AppsData } from "~/types";

const apps: AppsData[] = [
  {
    id: "launchpad",
    title: "Apps",
    desktop: false,
    img: "img/icons/apps.png"
  },
  {
    id: "bear",
    title: "Portfolio",
    desktop: true,
    width: 860 * 1.3,
    height: 500 * 1.5,
    show: true,
    img: "img/icons/bear.png",
    content: <Bear />
  },
  {
    id: "typora",
    title: "Typora",
    desktop: true,
    disabled: true,
    width: 600,
    height: 580,
    y: -20,
    img: "img/icons/typora.png",
    content: <Typora />
  },
  {
    id: "safari",
    title: "Links",
    desktop: true,
    width: 1024,
    height: 640,
    minWidth: 375,
    minHeight: 200,
    x: -20,
    img: "img/icons/safari.png",
    content: <Safari />
  },
  {
    id: "terminal",
    title: "Terminal",
    desktop: true,
    width: 960,
    height: 600,
    img: "img/icons/terminal.png",
    content: <Terminal />
  },
  {
    id: "github",
    title: "GitHub",
    desktop: false,
    img: "img/icons/github.png",
    link: "https://github.com/bojackduy"
  }
];

export default apps;
