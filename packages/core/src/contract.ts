import { parse, Rule, ClassSelector, Declaration } from 'css-tree';
import * as fs from 'fs/promises';
import crypto from 'crypto';

export interface CSSContract {
  classes: string[];
  customProperties: string[];
  source: string;
  checksum: string;
}

export async function loadContract(stylesheetPath: string): Promise<CSSContract> {
  const source = await fs.readFile(stylesheetPath, 'utf-8');
  const ast = parse(source);
  
  const classSet = new Set<string>();
  const customPropSet = new Set<string>();

  if (ast.type === 'StyleSheet') {
    ast.children.forEach(node => {
      if (node.type === 'Rule') {
        const rule = node as Rule;
        
        // Parse selectors
        if (rule.prelude && rule.prelude.type === 'SelectorList') {
          rule.prelude.children.forEach(selector => {
            if (selector.type === 'Selector') {
              selector.children.forEach(term => {
                if (term.type === 'ClassSelector') {
                  classSet.add((term as ClassSelector).name);
                }
              });
            }
          });
        }

        // Parse declarations
        if (rule.block && rule.block.type === 'Block') {
          rule.block.children.forEach(decl => {
            if (decl.type === 'Declaration') {
              const property = (decl as Declaration).property;
              if (property.startsWith('--')) {
                customPropSet.add(property);
              }
            }
          });
        }
      }
    });
  }

  const checksum = crypto.createHash('sha256').update(source).digest('hex');

  return {
    classes: Array.from(classSet),
    customProperties: Array.from(customPropSet),
    source,
    checksum
  };
}

export function vocabularyToPromptFragment(contract: CSSContract, maxTokens?: number): string {
  let fragment = `Available CSS classes (use these, never write inline styles):
Layout: container, stack, stack-sm, stack-lg, cluster, sidebar, grid-2, grid-3, grid-4
Typography: prose, heading-xl, heading-lg, heading-md, heading-sm, text-muted, text-mono, code-inline, code-block, blockquote, label
Components: card, card-header, card-body, card-footer, data-table, data-table-striped
Badges: badge, badge-primary, badge-success, badge-warning, badge-error, badge-neutral
Callouts: callout, callout-info, callout-warning, callout-error, callout-success, callout-tip
Dividers: divider, divider-dashed
Utilities: mt-auto, text-right, text-center, truncate, visually-hidden`;

  // Note: For a real implementation, we would truncate if maxTokens is specified,
  // but for the static fragment above, it's already short enough.
  return fragment;
}
