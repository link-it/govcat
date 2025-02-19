var program = require('commander');
var moment = require('moment');
var replace = require('replace-in-file');
var version = require("./package.json").version;

program
  .option('-p, --project <name>', 'Name of the project')
  .option('-d, --develop <boolean>', 'Development mode', 'false');

program.parse(process.argv);

var builderOptions = program.opts();
var nameProject = builderOptions.project;
var develop = (builderOptions.develop === 'true');

var buildVersion = moment().format('YYMMDD[.]HHmm');
var prodFile = develop ? '' : '.prod';

version = develop ? `${version}.dev` : version;

var options = {
  files: `projects/${nameProject}/src/environments/environment${prodFile}.ts`,
  from: /version: '.*'/g,
  to: `version: '${version}'`,
  allowEmptyPaths: false
};

try {
  var changedFiles = replace.sync(options);
  console.log('Version set: ', buildVersion);
  for (var i = 0; i < changedFiles.length; i++) {
    console.log('Changed File: ', changedFiles[i].file);
    console.log('Changed: ', changedFiles[i].hasChanged);
  }
} catch (error) {
  console.error('Error occurred:', error);
}

options = {
  files: `projects/${nameProject}/src/environments/environment${prodFile}.ts`,
  from: /build: '.*'/g,
  to: `build: '${buildVersion}'`,
  allowEmptyPaths: false
};

try {
  var changedFiles = replace.sync(options);
  console.log('Build set: ', buildVersion);
  for (var i = 0; i < changedFiles.length; i++) {
    console.log('Changed File: ', changedFiles[i].file);
    console.log('Changed: ', changedFiles[i].hasChanged);
  }
} catch (error) {
  console.error('Error occurred:', error);
}
