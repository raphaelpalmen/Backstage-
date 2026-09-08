#!/usr/bin/env node
/**
 * Prüft index.html vor dem Ausliefern.
 *
 *   npm install @babel/core @babel/preset-react @babel/parser @babel/traverse
 *   node pruefen.js
 *
 * Fängt genau die Fehler ab, die uns bisher erwischt haben:
 *  - JSX kompiliert nicht
 *  - fehlende Props (z. B. „Can't find variable: viewAs")
 *  - Hooks hinter einem return (führt zum schwarzen Bildschirm)
 *  - eine Ansicht ohne Tab oder ein Tab ohne Ansicht
 *  - eine Variable namens L — das ist Leaflet und darf nie überschrieben werden
 */
const fs = require('fs');
const babel = require('@babel/core');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const FILE = process.argv[2] || 'index.html';
const html = fs.readFileSync(FILE, 'utf8');

const jsx = (html.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/) || [])[1];
const boots = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
if (!jsx) { console.error('❌ Kein <script type="text/babel"> gefunden'); process.exit(1); }

let fehler = 0;
const ok = m => console.log('✅ ' + m);
const nok = m => { console.log('❌ ' + m); fehler++; };

/* 1 — Kompiliert es? */
try {
  babel.transformSync(jsx, { presets: [['@babel/preset-react']], filename: 'app.jsx' });
  ok('JSX kompiliert');
} catch (e) { nok('JSX kompiliert nicht: ' + e.message); process.exit(1); }

/* 2 — Start-Skript syntaktisch in Ordnung? */
try { new Function(boots); ok('Start-Skript syntaktisch in Ordnung'); }
catch (e) { nok('Start-Skript: ' + e.message); }

/* 3 — Leaflet-Kollision */
if (/\b(?:const|let|var)\s+L\s*=/.test(boots + jsx)) nok('Variable namens L gefunden — das ist Leaflet, umbenennen!');
else ok('kein Namenskonflikt mit Leaflet');

/* 4 — Fehlende Props und Variablen */
const ausBoot = new Set();
parser.parse(boots, { sourceType: 'script' }).program.body.forEach(n => {
  if (n.type === 'VariableDeclaration') n.declarations.forEach(d => d.id.name && ausBoot.add(d.id.name));
  if (n.type === 'FunctionDeclaration' && n.id) ausBoot.add(n.id.name);
});
const GLOBALS = new Set([...ausBoot,
  'React','ReactDOM','L','window','document','navigator','location','localStorage','firebase',
  'Math','JSON','Object','Array','String','Number','Boolean','Date','Promise','Set','Map','console',
  'Blob','URL','Image','Error','setTimeout','clearTimeout','setInterval','clearInterval','fetch',
  'alert','confirm','parseInt','parseFloat','isNaN','isFinite','encodeURIComponent','decodeURIComponent',
  'undefined','NaN','Infinity','arguments']);
const offen = [], gesehen = new Set();
traverse(parser.parse(jsx, { sourceType: 'script', plugins: ['jsx'] }), {
  ReferencedIdentifier(path) {
    const n = path.node.name;
    if (GLOBALS.has(n) || path.scope.hasBinding(n, true)) return;
    let fn = path.getFunctionParent(), wo = '(oberste Ebene)';
    while (fn) { const id = fn.node.id && fn.node.id.name; if (id) { wo = id; break; } fn = fn.getFunctionParent(); }
    const k = wo + ':' + n; if (gesehen.has(k)) return; gesehen.add(k);
    offen.push(`${wo} → ${n} (Zeile ${path.node.loc.start.line})`);
  }
});
offen.length ? nok('fehlende Props/Variablen:\n   ' + offen.join('\n   '))
             : ok('alle Props und Variablen vorhanden');

/* 5 — Tabs und Ansichten */
const tabs = [...new Set([...jsx.matchAll(/\{id:'(\w+)', *label:/g)].map(m => m[1]))];
const views = [...new Set([...jsx.matchAll(/valid==='(\w+)'/g)].map(m => m[1]))];
const ohneAnsicht = tabs.filter(t => !views.includes(t));
ohneAnsicht.length ? nok('Tab ohne Ansicht: ' + ohneAnsicht.join(', '))
                   : ok(`alle ${tabs.length} Tabs haben eine Ansicht`);

/* 6 — Hooks hinter einem return findet ESLint */
console.log('\nNoch offen: npx eslint --no-eslintrc -c .eslintrc.json app.jsx (react-hooks/rules-of-hooks)');
console.log(fehler ? `\n❌ ${fehler} Problem(e) — nicht ausliefern` : '\n✅ alles in Ordnung');
process.exit(fehler ? 1 : 0);
