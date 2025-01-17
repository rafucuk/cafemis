import * as fs from 'node:fs';
import * as yaml from 'js-yaml';

export const merge = (...args) => args.reduce((a, c) => ({
    ...a,
    ...c,
    ...Object.entries(a)
        .filter(([k]) => c && typeof c[k] === 'object')
        .reduce((a, [k, v]) => (a[k] = merge(v, c[k]), a), {})
}), {});

const languages = [
    'en-US',
    'tr-TR',
];

const primaries = {
    'tr': 'TR',
    'en': 'US',
};

// Clean YAML files from unwanted characters
const clean = (text) => text.replace(new RegExp(String.fromCodePoint(0x08), 'g'), '').replaceAll(new RegExp(/\\+\{/, 'g'), '{');

export function build() {
    const metaUrl = import.meta.url;
    const sharkeyLocales = languages.reduce((a, c) => (a[c] = yaml.load(clean(fs.readFileSync(new URL(`../cafemis-locales/${c}.yml`, metaUrl), 'utf-8'))) || {}, a), {});
    const misskeyLocales = languages.reduce((a, c) => (a[c] = yaml.load(clean(fs.readFileSync(new URL(`${c}.yml`, metaUrl), 'utf-8'))) || {}, a), {});

    // Merge Sharkey and Misskey locales, prioritize Sharkey
    const locales = merge(misskeyLocales, sharkeyLocales);

    // Remove empty properties
    const removeEmpty = (obj) => {
        for (const [k, v] of Object.entries(obj)) {
            if (v === '') {
                delete obj[k];
            } else if (typeof v === 'object') {
                removeEmpty(v);
            }
        }
        return obj;
    };
    removeEmpty(locales);

    return Object.entries(locales)
        .reduce((a, [k, v]) => (a[k] = (() => {
            const [lang] = k.split('-');
            switch (k) {
                case 'tr-TR': return v;
                case 'en-US': return merge(locales['tr-TR'], v);
                default: return merge(
                    locales['tr-TR'],
                    locales['en-US'],
                    locales[`${lang}-${primaries[lang]}`] ?? {},
                    v
                );
            }
        })(), a), {});
}

export default build();
