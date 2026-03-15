import { visit } from 'unist-util-visit';
import { Node } from 'unist';

export interface WikiLinkNode extends Node {
  type: 'wikiLink';
  value?: string;
  data: {
    alias: string;
    permalink: string;
    exists: boolean;
    hName: string;
    hProperties: {
      className: string;
      href: string;
    };
    hChildren: [{ type: 'text'; value: string }];
  };
}

interface TextNode extends Node {
    type: 'text';
    value: string;
}

// A simple remark plugin to parse [[wikilinks]]
export default function remarkWikilink() {
  return (tree: Node) => {
    visit(tree, 'text', (node: Node, index, parent: any) => {
      const textNode = node as TextNode;
      if (!textNode.value) return;

      const wikiLinkRegex = /\[\[(.*?)\]\]/g;
      const matches = Array.from(textNode.value.matchAll(wikiLinkRegex));
      
      if (matches.length === 0) return;

      const newChildren: Node[] = [];
      let lastIndex = 0;

      matches.forEach((match: RegExpMatchArray) => {
        const textBefore = textNode.value.substring(lastIndex, match.index ?? 0);
        if (textBefore) {
          newChildren.push({ type: 'text', value: textBefore } as TextNode);
        }

        const linkText = match[1];
        const [page, ...aliasParts] = linkText.split('|');
        const alias = aliasParts.length > 0 ? aliasParts.join('|') : page;

        const permalink = page.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        // XSS PROTECTION: Validate permalink doesn't start with dangerous protocols
        if (permalink.startsWith('javascript') || permalink.startsWith('data') || permalink.startsWith('vbscript')) {
          console.error(`[XSS] Blocked dangerous wikilink: ${permalink}`);
          // Replace with safe text node instead
          newChildren.push({ type: 'text', value: `[[${linkText}]]` } as TextNode);
          return;
        }

        newChildren.push({
          type: 'wikiLink',
          value: match[0],
          data: {
            alias: alias.trim(),
            permalink: `/brain/notes/${permalink}`,
            exists: true,
            hName: 'a',
            hProperties: {
              className: 'text-primary font-medium hover:underline cursor-pointer decoration-primary/50 underline-offset-4',
              href: `/brain/notes/${permalink}`,
              'data-wikilink': 'true',
            },
            hChildren: [{ type: 'text', value: alias.trim() }],
          },
        } as unknown as Node);

        lastIndex = (match.index ?? 0) + match[0].length;
      });

      const textAfter = textNode.value.substring(lastIndex);
      if (textAfter) {
        newChildren.push({ type: 'text', value: textAfter } as TextNode);
      }

      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
}
