var _fs = require('fs'),
    _sys = require('sys'),
    _path = require('path'),
    _jshint = require('./../packages/jshint/jshint.js'),
    _config;

function _lint(file, results, data) {
    var buffer,
        lintdata;

    try {
        buffer = _fs.readFileSync(file, 'utf-8');
    } catch (e) {
        _sys.puts("Error: Cant open: " + file);
        _sys.puts(e + '\n');
    }

    if (!_jshint.JSHINT(buffer, _config)) {
        _jshint.JSHINT.errors.forEach(function (error) {
            if (error) {
                results.push({file: file, error: error});
            }
        });
    }

    lintdata = _jshint.JSHINT.data();
    lintdata.file = file;
    data.push(lintdata);
}

function _collect(path, files) {
    if (_fs.statSync(path).isDirectory()) {
        _fs.readdirSync(path).forEach(function (item) {
            _collect(_path.join(path, item), files);
        });
    } else if (path.match(/\.js$/)) {
        files.push(path);
    }
}

function _reporter(results, data) {
    var len = results.length,
        str = '',
        file, error, globals, unuseds;

    results.forEach(function (result) {
        file = result.file;
        error = result.error;
        str += file  + ': line ' + error.line + ', col ' +
            error.character + ', ' + error.reason + '\n';
    });

    str += len > 0 ? ("\n" + len + ' error' + ((len === 1) ? '' : 's')) : "Lint Free!";

    data.forEach(function (data) {
        file = data.file;
        globals = data.implieds;
        unuseds = data.unused;

        if (globals || unuseds){
            str += '\n\n' + file  + ' :\n';
        }
        
        if (globals) {
             str += '\tImplied globals:\n';
            globals.forEach(function (global) {
                str += '\t\t' + global.name  + ': ' + global.line + '\n';
            });
        }
        if (unuseds) {
            str += '\tUnused Variables:\n\t\t';
            unuseds.forEach(function (unused) {
                str += unused.name + '(' + unused.line + '), ';
            });

        }
    });

    _sys.puts(str);

    process.exit(len > 0 ? 1 : 0);
}

module.exports = {
    hint: function (targets, config, reporter) {
        var files = [],
            results = [],
            data = [];

        if (!reporter) reporter = _reporter;
        _config = config || null;

        targets.forEach(function (target) {
            _collect(target, files);
        });

        files.forEach(function (file) {
            _lint(file, results, data);
        });

        reporter(results, data);
    }
};
