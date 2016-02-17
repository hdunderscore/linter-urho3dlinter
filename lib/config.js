'use strict';

var path = require('path');
var fs = require('fs');

module.exports.niceName = 'Custom file (.urho-flags.json)';

module.exports.settings = function () {

  var SETTINGS_FILENAME = ".urho-flags.json";
  var MAX_ITERATIONS = 30;

  var file_settings = atom.workspace.getActiveTextEditor().getPath() + SETTINGS_FILENAME;
  var directory_settings = path.join(path.dirname(file_settings), SETTINGS_FILENAME);
  var config_file = "";

  if (fs.existsSync(file_settings)) {
      config_file = file_settings;
  } else if (fs.existsSync(directory_settings)) {
      config_file = directory_settings;
  }

  if (config_file === "" && atom.project.getPaths()[0] !== undefined) {
      var project_path = atom.project.getPaths()[0];
      var current_path = path.dirname(file_settings);
      var current_file = "";
      var counter = 0;
      while (path.relative(current_path, project_path) !== "" && counter < MAX_ITERATIONS){
          current_path = path.join(current_path, "..");
          current_file = path.join(current_path, SETTINGS_FILENAME);
          if (fs.existsSync(current_file)) {
              config_file = current_file;
              break;
          }
          counter += 1;
      }
  }

  if (config_file !== "") {
      console.log("Reading settings from: " + config_file);
      delete require.cache[config_file];
      var config_data = require(config_file);
      return {
        execPath: config_data.execPath,
        defaultFlags: config_data.defaultFlags,
        defaultPackages: config_data.defaultPackages
      };
  } else {
      return {
          execPath: atom.config.get("linter-urho3dlinter.execPath"),
          defaultFlags: atom.config.get("linter-urho3dlinter.defaultFlags"),
          defaultPackages: atom.config.get("linter-urho3dlinter.defaultPackages")
      };
  }

};
