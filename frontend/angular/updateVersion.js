/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
const program = require('commander');
const fs = require('fs');
const path = require('path');

program
    .option('-p, --type <type>', 'Type of update: major, minor o patch');

program.parse(process.argv);

const builderOptions = program.opts();
const versionType = builderOptions.type;

// Percorso del file package.json
const packageJsonPath = path.join(__dirname, 'package.json');

// Funzione per aggiornare la versione
function updateVersion(type) {
    fs.readFile(packageJsonPath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Errore durante la lettura del file: ${err}`);
            return;
        }

        try {
            // Parsing del file package.json
            const packageJson = JSON.parse(data);
            const currentVersion = packageJson.version;

            if (!currentVersion) {
                console.error("La versione non è presente nel file package.json.");
                return;
            }

            // Separazione della versione corrente in [MAJOR, MINOR, PATCH]
            const [major, minor, patch] = currentVersion.split('.').map(Number);

            let newVersion;

            // Incremento della versione in base al tipo specificato
            switch (type) {
                case 'major':
                    newVersion = `${major + 1}.0.0`;
                    break;
                case 'minor':
                    newVersion = `${major}.${minor + 1}.0`;
                    break;
                case 'patch':
                    newVersion = `${major}.${minor}.${patch + 1}`;
                    break;
                default:
                    console.error("Tipo non valido. Usa 'major', 'minor', o 'patch'.");
                    return;
            }

            // Aggiornamento della versione nel file package.json
            packageJson.version = newVersion;

            // Scrittura del nuovo file package.json
            fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error(`Errore durante la scrittura del file: ${err}`);
                    return;
                }
                console.log(`La versione è stata aggiornata con successo a: ${newVersion}`);
            });
        } catch (parseErr) {
            console.error(`Errore durante il parsing del file JSON: ${parseErr}`);
        }
    });
}

updateVersion(versionType);

// Esempio di utilizzo: specifica il tipo di aggiornamento (major, minor, patch)
// node ./updateVersion.js --type=major
// node ./updateVersion.js --type=minor
// node ./updateVersion.js --type=patch
