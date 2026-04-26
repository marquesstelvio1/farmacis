const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let changed = false;

            // Substituir fetch(`/api/...`) por fetch(`${API_URL}/api/...`)
            if (content.includes('fetch(`/api/')) {
                content = content.replace(/fetch\(`\/api\//g, 'fetch(`${import.meta.env.VITE_API_URL}\/api/');
                changed = true;
            }

            // Substituir fetch('/api/...', ...) por fetch(import.meta.env.VITE_API_URL + '/api/...', ...)
            if (content.includes(`fetch('/api/`)) {
                content = content.replace(/fetch\('\/api\//g, "fetch(import.meta.env.VITE_API_URL + '/api/");
                changed = true;
            }

            // Substituir a configuração do Socket.IO
            if (content.includes(`io('/', {`)) {
                content = content.replace(`io('/', {`, `io(import.meta.env.VITE_API_URL, {`);
                changed = true;
            }

            if (changed) {
                console.log(`Corrigido: ${fullPath}`);
                fs.writeFileSync(fullPath, content, 'utf-8');
            }
        }
    }
}

console.log('A corrigir caminhos da API no Admin...');
processDir(path.join(__dirname, 'apps/web-admin/src'));

console.log('A corrigir caminhos da API na Farmácia...');
processDir(path.join(__dirname, 'apps/web-farmacia/src'));

console.log('Feito!');
