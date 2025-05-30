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
