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
import { Command } from 'commander';
import moment from 'moment';
import { readFile, writeFile } from 'fs/promises';

const program = new Command();
program
  .option('-p, --project <name>', 'Name of the project')
  .option('-d, --develop <boolean>', 'Development mode', 'false');

program.parse(process.argv);

const builderOptions = program.opts();
const nameProject = builderOptions.project;
const develop = builderOptions.develop === 'true';

const buildVersion = moment().format('YYMMDD[.]HHmm');
const prodFile = develop ? '' : '.prod';

const packageJson = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));
const version = develop ? `${packageJson.version}.dev` : packageJson.version;

const filePath = `projects/${nameProject}/src/environments/environment${prodFile}.ts`;

const updateFile = async () => {
  try {
    let content = await readFile(filePath, 'utf8');
    content = content.replace(/version: '.*'/g, `version: '${version}'`);
    content = content.replace(/build: '.*'/g, `build: '${buildVersion}'`);
    await writeFile(filePath, content, 'utf8');
    console.log(`Updated ${filePath} with version: ${version} and build: ${buildVersion}`);
  } catch (error) {
    console.error('Error updating file:', error);
  }
};

await updateFile();
