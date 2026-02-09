const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const unityPath = 'C:/Users/hi040/OjamamonoUnity';
const pluginsPath = path.join(unityPath, 'Assets/Plugins/SocketIO');

const libs = [
    {
        url: 'https://github.com/itisnajim/SocketIOUnity/archive/refs/heads/master.zip',
        altUrl: 'https://github.com/itisnajim/SocketIOUnity/archive/refs/heads/main.zip',
        name: 's1.zip',
        folder: 'SocketIOUnity'
    },
    {
        url: 'https://github.com/doghappy/socket.io-client-csharp/archive/refs/heads/master.zip',
        altUrl: 'https://github.com/doghappy/socket.io-client-csharp/archive/refs/heads/main.zip',
        name: 's2.zip',
        folder: 'socket.io-client-csharp'
    }
];

if (!fs.existsSync(pluginsPath)) {
    fs.mkdirSync(pluginsPath, { recursive: true });
}

async function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                download(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function main() {
    for (const lib of libs) {
        console.log(`Downloading ${lib.folder}...`);
        const zipPath = path.join(unityPath, lib.name);
        try {
            await download(lib.url, zipPath);
        } catch (e) {
            console.log(`Retrying with alt url for ${lib.folder}... (${e.message})`);
            await download(lib.altUrl, zipPath);
        }

        console.log(`Extracting ${lib.name}...`);
        const tmpDir = path.join(unityPath, `tmp_${lib.name.replace('.zip', '')}`);
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        try {
            execSync(`tar -xf "${zipPath}" -C "${tmpDir}"`);
            const subDir = fs.readdirSync(tmpDir)[0];
            const runtimePath = path.join(tmpDir, subDir, 'Runtime');

            if (fs.existsSync(runtimePath)) {
                console.log(`Copying files from ${runtimePath} to ${pluginsPath}`);
                const files = fs.readdirSync(runtimePath);
                for (const f of files) {
                    const src = path.join(runtimePath, f);
                    const out = path.join(pluginsPath, f);
                    if (fs.lstatSync(src).isDirectory()) {
                        execSync(`xcopy /E /I /Y "${src}" "${out}"`);
                    } else {
                        fs.copyFileSync(src, out);
                    }
                }
            }
        } catch (e) {
            console.error(`Error processing ${lib.name}:`, e.message);
        } finally {
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        }
    }
    console.log("DONE! Please restart Unity.");
}

main();
