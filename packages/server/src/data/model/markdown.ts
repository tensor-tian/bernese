import Debug from "@bernese/shared/src/debug";
import codeSegmentation from "../../utils/code-segmentation";
import jieba from "nodejieba";
import { marked } from "marked";

const debug = Debug();
const walkTokens = (token: marked.Token) => {
  if (token.type === "code") {
    token.text = codeSegmentation(token.text, token.lang);
  }
};
function renderBlock(text: string) {
  return jieba.cutForSearch(text).join(" ") + "\n";
}
function renderInline(text: string) {
  return jieba.cutForSearch(text).join(" ");
}

const renderer: Record<string, (...args: any[]) => string> = {
  code: (code: string, language: string) => {
    return `\`\`\`${language}\n${code}\`\`\`\n`;
  },
  hr: () => {
    return "\n";
  },
  br: () => {
    return "\n";
  },

  checkbox: () => "",
};

[
  "strong",
  "em",
  "codespan",
  "del",
  "html",
  "text",
  "link",
  "image",
  "br",
  "tablecell",
].forEach((prop) => (renderer[prop] = renderInline.bind(renderer)));

[
  "blockquote",
  "heading",
  "list",
  "listitem",
  "paragraph",
  "table",
  "tablerow",
].forEach((prop) => (renderer[prop] = renderBlock.bind(renderer)));

marked.use({ walkTokens, renderer });

export default function cutMarkdownForSearch(md: string) {
  const segmented = marked.parse(md);
  debug("segmented:", segmented);
  return segmented;
}
