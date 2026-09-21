import type { TerminalData } from "~/types";
import { WEBSITE_URL } from "~/utils";

const terminal: TerminalData[] = [
  {
    id: "about",
    title: "about",
    type: "folder",
    children: [
      {
        id: "about-bio",
        title: "bio.txt",
        type: "file",
        content: (
          <div className="py-1">
            <div>
              Hi, this is Trinh Chan Duy. I build production backends, AI-enabled
              products, and developer tools that make complex workflows feel simple.
            </div>
          </div>
        )
      },
      {
        id: "about-interests",
        title: "interests.txt",
        type: "file",
        content: (
          <ul className="list-disc">
            <li className="ml-4">Interests:</li>
            <li className="ml-8">AI coding agents and terminal interfaces</li>
            <li className="ml-8">Distributed systems and backend architecture</li>
            <li className="ml-8">Security research and competitive programming</li>
          </ul>
        )
      },
      {
        id: "about-who-cares",
        title: "who-cares.txt",
        type: "file",
        content:
          "Always interested in ambitious backend, AI tooling, and systems projects."
      },
      {
        id: "about-contact",
        title: "contact.txt",
        type: "file",
        content: (
          <ul className="list-disc ml-6">
            <li>
              Email:{" "}
              <a
                className="text-blue-300"
                href="mailto:trinhchanduy.30072005@gmail.com"
                target="_blank"
                rel="noreferrer"
              >
                trinhchanduy.30072005@gmail.com
              </a>
            </li>
            <li>
              Github:{" "}
              <a
                className="text-blue-300"
                href="https://github.com/bojackduy"
                target="_blank"
                rel="noreferrer"
              >
                @bojackduy
              </a>
            </li>
            <li>
              Personal Website:{" "}
              <a
                className="text-blue-300"
                href={WEBSITE_URL}
                target="_blank"
                rel="noreferrer"
              >
                {WEBSITE_URL}
              </a>
            </li>
          </ul>
        )
      }
    ]
  },
  {
    id: "about-dream",
    title: "my-dream.cpp",
    type: "file",
    content: (
      <div className="py-1">
        <div>
          <span className="text-yellow-400">while</span>(
          <span className="text-blue-400">sleeping</span>) <span>{"{"}</span>
        </div>
        <div>
          <span className="text-blue-400 ml-9">money</span>
          <span className="text-yellow-400">++</span>;
        </div>
        <div>
          <span>{"}"}</span>
        </div>
      </div>
    )
  }
];

export default terminal;
