import fs from 'node:fs';
fs.rmSync('dist',{recursive:true,force:true});
const base=fs.readFileSync('src/layout.html','utf8').split('<script src="lucide.min.js">')[0];
const html=base.replace('<span class="preview">Anteprima da approvare</span>','<span class="preview">Accesso privato</span>').replace('<div class="fields" id="fields"></div>','<div class="fields" id="fields"></div>').replace('<p class="notice">Anteprima: nessun dato viene salvato nel tuo database.</p>','<p id="form-error" role="alert" class="notice"></p>').replace('Prova inserimento','Salva')+'<script src="/lucide.min.js"></script><script src="/app.js"></script></body></html>';
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
const assets={'/':html,'/lucide.min.js':fs.readFileSync('src/lucide.min.js','utf8'),'/app.js':fs.readFileSync('src/app.js','utf8')};
fs.writeFileSync('dist/server/index.js','const assets='+JSON.stringify(assets)+';\n'+fs.readFileSync('src/worker.js','utf8'));
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Worker pronto');
