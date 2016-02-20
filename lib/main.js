'use babel'

CompositeDisposable = require('atom').CompositeDisposable;

var fs = require('fs');

module.exports = {
  config: {
    execPath: {
      title: "Urho3DLinter Executable Path",
      description: "Note for Windows/Mac OSX users: please ensure that GCC is in your ```$PATH``` otherwise the linter might not work. If your path contains spaces, it needs to be enclosed in double quotes.",
      type: "string",
      default: "./Urho3DLinter",
      order : 1
    },
    defaultFlags: {
      title: "Commandline Flags",
      description: "Supports the use of espcaped characters",
      type: "string",
      default: "-log debug",
      order : 2
    },
    defaultPackages: {
        title: "Packages",
        description: "Seperated by semicolons",
        type: "string",
        default: "Data;CoreData",
      order : 3
    },
    lintOnTheFly: {
      title: "Lint on-the-fly",
      description: "Please ensure any auto-saving packages are disabled before using this feature",
      type: "boolean",
      default: false,
      order : 4
    }
  },

  messages: {},
  linter_urho3dlinter: undefined,

  temp_file : require("tempfile")(".as"),
  temp_fileLua : require("tempfile")(".lua"),

  lint: function(editor, linted_file, real_file){
    const helpers = require("atom-linter");
    const regexAS = "(?<file>.+):(?<line>\\d+),(?<col>\\d+) (?<message>.+)";
    const regexLua = "Load Buffer failed for (?<file>.+): \\[string \".+\"\\]:(?<line>\\d+): (?<message>.+)";
    const regex = "\\[.+\\] (?<type>(ERROR|WARNING)): (" + regexAS + "|" + regexLua +"|(?<message>.+))";
    command = require("./utility").buildCommand(editor, linted_file);
    return helpers.exec(command.binary, command.args, {stream: 'both'}).then(out => {
      var output = out.stdout + '\n' + out.stderr;
      console.log("output:");
      console.log(output);
      msgs = helpers.parse(output, regex);
      console.log(msgs);
      msgs.forEach(function(entry){
          var matched = false;
          command.package_array.forEach(function(pkg){
              var tFilePath = pkg + '/' + entry.filePath;
              if (fs.existsSync(tFilePath)) {
                  entry.filePath = tFilePath;
                  matched = true;
              }
          });
          if (!matched)
              entry.filePath = real_file;
      });
      if (msgs.length === 0 && output.indexOf("error") !== -1){
        msgs = [{
          type: 'error',
          text: output,
          filePath: real_file
        }];
      }
      module.exports.messages[real_file] = msgs;
      if (typeof module.exports.linter_urho3dlinter !== "undefined"){
          console.log(module.exports.messages);
        module.exports.linter_urho3dlinter.setMessages(require("./utility").flattenHash(module.exports.messages));
      }
      return msgs;
  });
  },

  activate: function() {
    this.subscriptions = new CompositeDisposable();
    if(!atom.packages.getLoadedPackages("linter")) {
    atom.notifications.addError(
      "Linter package not found.",
      {
        detail: "Please install the `linter` package in your Settings view."
      }
    );
    }
    if(!atom.packages.getLoadedPackages("language-angelscript")) {
    atom.notifications.addError(
      "Linter package not found.",
      {
        detail: "Please install the `language-angelscript` package in your Settings view."
      }
    );
    }
    require("atom-package-deps").install("linter-urho3dlinter");
  },
  deactivate: function() {
    this.subscriptions.dispose();
  },
  consumeLinter: function(indieRegistry) {
    module.exports.linter_urho3dlinter = indieRegistry.register({
      name: 'Urho3DLinter'
  });

    subs = this.subscriptions;
    utility = require("./utility");
    lintOnTheFly = function() {
      editor = utility.getValidEditor(atom.workspace.getActiveTextEditor());
      if (!editor) return;
      if (atom.config.get("linter-urho3dlinter.lintOnTheFly") === false) return;
      real_file = editor.getPath();
      if (require('path').extname(real_file) === '.as')
      {
        require('fs-extra').outputFileSync(module.exports.temp_file, editor.getText());
        module.exports.lint(editor, module.exports.temp_file, real_file);
      }
      else
      {
        require('fs-extra').outputFileSync(module.exports.temp_fileLua, editor.getText());
        module.exports.lint(editor, module.exports.temp_fileLua, real_file);
      }
    };

    lintOnSave = function(){
      editor = utility.getValidEditor(atom.workspace.getActiveTextEditor());
      if (!editor) return;
      if (atom.config.get("linter-urho3dlinter.lintOnTheFly") === true) return;
      real_file = editor.getPath();
      module.exports.lint(editor, real_file, real_file);
    };

    cleanupMessages = function(){
      editor_hash = {};
      console.log("Editor paths");
      atom.workspace.getTextEditors().forEach( function(entry){
        try{
          path = entry.getPath();
        } catch(err){
        }
        console.log(path);
        editor_hash[entry.getPath()] = 1;
      });
      console.log("Messages paths");
      for (var file in module.exports.messages){
        console.log(file);
        if (!editor_hash.hasOwnProperty(file)){
          delete module.exports.messages[file];
        }
      }
      module.exports.linter_urho3dlinter.setMessages( require("./utility").flattenHash(module.exports.messages) );
    };

    subs.add(module.exports.linter_urho3dlinter);

    atom.workspace.observeTextEditors(function(editor) {
      subs.add(editor.onDidSave(lintOnSave));
      subs.add(editor.onDidStopChanging(lintOnTheFly));
      subs.add(editor.onDidDestroy(cleanupMessages));
  });
  }
};
