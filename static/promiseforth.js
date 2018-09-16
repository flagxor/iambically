'use strict';


function PromiseForth() {
  this.dstack = [];
  this.dictionary = {};
  this.built = {};
  this.variables = {
    dstack: this.dstack,
    dictionary: this.dictionary,
  };
}

PromiseForth.prototype.set = function(key, value) {
  this.variables[key] = value;
};

PromiseForth.prototype.get = function(key) {
  return this.variables[key];
};

PromiseForth.prototype.compile = function(word) {
  if (this.dictionary[word] === undefined) {
    throw new Error('undefined word: ' + word);
  }
  if (this.built[word] === null) {
    throw new Error('illegal recursion on: ' + word);
  }
  if (this.built[word] !== undefined) {
    return this.built[word];
  }
  this.built[word] = null;
  var result = this.nil();
  var isJS = false;
  var definition = this.dictionary[word];
  for (var i = 0; i < definition.length; i++) {
    var child = definition[i];
    if (isJS) {
      isJS = false;
      if (child.substr(0, 1) === '"') {
        child = child.substr(1, child.length - 2);
      }
      result = this.join(result, this.eval(child));
    } else if (child === 'js') {
      isJS = true;
    } else if (child.substr(0, 1) === "'") {
      var y = child.substr(1);
      var func = this.compile(y);
      result = this.join(result, this.pushWord(func));
    } else {
      if (this.dictionary[child] === undefined) {
        result = this.join(result, this.pushEval(child));
      } else {
        result = this.join(result, this.compile(child));
      }
    }
  }
  this.built[word] = result;
  return this.built[word];
};

PromiseForth.prototype.compilePrefix = function(prefix) {
  var result = this.nil();
  for (var key in this.dictionary) {
    if (key.search(prefix) === 0) {
      result = this.join(result, this.compile(key));
    }
  }
  return result;
};

PromiseForth.prototype.loadUnescaped = function(text) {
  return this.load(false, false, text);
};

PromiseForth.prototype.loadEscaped = function(text) {
  return this.load(true, false, text);
};

PromiseForth.prototype.loadDefaultOnly = function(text) {
  return this.load(true, true, text);
};

PromiseForth.prototype.load = function(escaped, defaultOnly, text) {
  var words = [];
  var lines = text.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/\r/g, '');
    if (escaped) {
      if (line.substr(0, 2) !== '~ ') {
        continue;
      } else {
        line = line.substr(2);
      }
    }
    var qparts = line.split('"');
    for (var j = 0; j < qparts.length; j++) {
      if (j % 2 === 0) {
        var parts = qparts[j].split(' ');
        for (var k = 0; k < parts.length; k++) {
          if (parts[k] !== '') {
            words.push(parts[k]);
          }
        }
      } else {
        words.push('"' + qparts[j] + '"');
      }
    }
  }
  this.loadWords(defaultOnly, words);
};

PromiseForth.prototype.loadWords = function(defaultOnly, words) {
  var current = '__default__';
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    if (word.substr(word.length - 1) === ':') {
      if (defaultOnly) {
        return;
      }
      current = word.substr(0, word.length - 1);
      if (this.dictionary[current] !== undefined) {
        throw new Error('duplicate definition of: ' + current);
      }
      this.dictionary[current] = [];
    } else {
      this.dictionary[current].push(word);
    }
  }
};

PromiseForth.prototype.reset = function(name) {
  this.dictionary[name] = [];
  delete this.built[name];
};

PromiseForth.prototype.clearStack = function() {
  this.dstack.splice(0, this.dstack.length);
};

PromiseForth.prototype.nil = function() {
  return function() {
    return Promise.resolve();
  };
};

PromiseForth.prototype.join = function(a, b) {
  return function() {
    return a().then(b);
  };
};

PromiseForth.prototype.eval = function(x) {
  var self = this;
  return eval(
      'function v() { return Promise.resolve().then(function() { ' +
      'var dstack = self.dstack; ' +
      x + '}); } v');
};

PromiseForth.prototype.pushEval = function(x) {
  return this.eval('dstack.push(' + x + ');');
};

PromiseForth.prototype.pushWord = function(x) {
  var dstack = this.dstack;
  return function() {
    return Promise.resolve().then(function() {
      dstack.push(x);
    });
  };
};
