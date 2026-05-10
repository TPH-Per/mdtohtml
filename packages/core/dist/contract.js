import { parse } from 'css-tree';
import * as fs from 'fs/promises';
import crypto from 'crypto';
import { CATEGORY_PATTERNS } from './constants.js';
export async function loadContract(stylesheetPath) {
    const source = await fs.readFile(stylesheetPath, 'utf-8');
    const ast = parse(source);
    const classSet = new Set();
    const customPropSet = new Set();
    if (ast.type === 'StyleSheet') {
        ast.children.forEach(node => {
            if (node.type === 'Rule') {
                const rule = node;
                // Parse selectors
                if (rule.prelude && rule.prelude.type === 'SelectorList') {
                    rule.prelude.children.forEach(selector => {
                        if (selector.type === 'Selector') {
                            selector.children.forEach(term => {
                                if (term.type === 'ClassSelector') {
                                    classSet.add(term.name);
                                }
                            });
                        }
                    });
                }
                // Parse declarations
                if (rule.block && rule.block.type === 'Block') {
                    rule.block.children.forEach(decl => {
                        if (decl.type === 'Declaration') {
                            const property = decl.property;
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
export function groupClassesByCategory(classes) {
    const categories = {
        Layout: [],
        Typography: [],
        Components: [],
        Badges: [],
        Callouts: [],
        Dividers: [],
        Utilities: []
    };
    for (const cls of classes) {
        if (cls.match(CATEGORY_PATTERNS.Layout))
            categories.Layout.push(cls);
        else if (cls.match(CATEGORY_PATTERNS.Typography))
            categories.Typography.push(cls);
        else if (cls.match(CATEGORY_PATTERNS.Components))
            categories.Components.push(cls);
        else if (cls.match(CATEGORY_PATTERNS.Badges))
            categories.Badges.push(cls);
        else if (cls.match(CATEGORY_PATTERNS.Callouts))
            categories.Callouts.push(cls);
        else if (cls.match(CATEGORY_PATTERNS.Dividers))
            categories.Dividers.push(cls);
        else
            categories.Utilities.push(cls);
    }
    return Object.entries(categories)
        .filter(([_, items]) => items.length > 0)
        .map(([cat, items]) => `${cat}: ${items.join(', ')}`)
        .join('\n');
}
export function vocabularyToPromptFragment(contract, maxTokens) {
    const lines = groupClassesByCategory(contract.classes);
    let fragment = `Available CSS classes (use these, never write inline styles):\n${lines}`;
    if (maxTokens) {
        const maxChars = maxTokens * 4; // 1 token ≈ 4 chars for CSS class names
        if (fragment.length > maxChars) {
            // Truncate at last newline boundary to avoid cutting mid-word
            const truncated = fragment.slice(0, maxChars);
            const lastNewline = truncated.lastIndexOf('\n');
            fragment = (lastNewline > 0 ? truncated.slice(0, lastNewline) : truncated)
                + '\n... (vocabulary truncated — increase maxVocabularyTokens)';
        }
    }
    return fragment;
}
