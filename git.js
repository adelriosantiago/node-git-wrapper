// imports
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var commands = require('./commands');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

// Class Git
var Git = module.exports = function (options) {
  this.binary = 'git';
  options = options || {};

  // if a gitDir is provided, make sure we are chdir-ed into
  // the directory before performing git operations.
  var gitDir = options['git-dir'];
  if(gitDir) {
    var dir = path.dirname(gitDir);
    var spawn = this.spawn.bind(this);
    this.spawn = function(command){
      if(command.indexOf('clone') === 0) {
        return spawn.apply(this, arguments);
      }

      process.chdir(dir);
      return spawn.apply(this, arguments);
    };
  }

  this.args = Git.optionsToArray(options);
};

inherits(Git, EventEmitter);

Git.prototype.exec = function(command, args, callback) {
  callback = arguments[arguments.length - 1];
  if(arguments.length == 2) {
    args = [];
  }
  var child = this.spawn(command, args);
  	
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  var data = "", 
	err;
	
  child.stdout.on('data', function(d){ 
    data += d;
  });
  child.stderr.on('data', function(e){
    err += e;  
  });

  child.on('exit', function(){
    callback(err, data);
  });
};

// git.spawn(command [, args], callback
Git.prototype.spawn = function(command, args){
  if(arguments.length == 1) {
    args = [];
  }
  
  command = Array.isArray(command) ? command : [command];
  var rawargs = this.args.concat(command).concat(Git.optionsToArray(args));
  args = [];
  
  // Get rid of nulls and undefineds.
  for(var i = 0, len = rawargs.length; i < len; i++) {
    if(rawargs[i] != null) args.push(rawargs[i]+"");
  }
  
  var child = spawn(this.binary, args);
  return child;
};

Git.optionsToArray = function(options){
  var args = [];
  
  Object.keys(options).forEach(function(k){
    var val = options[k];

    if(k.length == 1) {
      if(val === true) {
        args.push('-' + k);
      } else if(val !== false) {
        args.push('-' + k, val);
      }
    } else {
      if(val === true) {
        args.push('--' + k);
      } else if(val !== false) {
        args.push('--' + k + '=' + val);
      }
    }
  });

  return args;
};

Object.keys(commands).forEach(function(key) {
  Git.prototype[key] = commands[key];
});
