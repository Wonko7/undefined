var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__7916 = x == null ? null : x;
  if(p[goog.typeOf(x__7916)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__7917__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__7917 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7917__delegate.call(this, array, i, idxs)
    };
    G__7917.cljs$lang$maxFixedArity = 2;
    G__7917.cljs$lang$applyTo = function(arglist__7918) {
      var array = cljs.core.first(arglist__7918);
      var i = cljs.core.first(cljs.core.next(arglist__7918));
      var idxs = cljs.core.rest(cljs.core.next(arglist__7918));
      return G__7917__delegate(array, i, idxs)
    };
    G__7917.cljs$lang$arity$variadic = G__7917__delegate;
    return G__7917
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____8003 = this$;
      if(and__3822__auto____8003) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____8003
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____8004 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8005 = cljs.core._invoke[goog.typeOf(x__2363__auto____8004)];
        if(or__3824__auto____8005) {
          return or__3824__auto____8005
        }else {
          var or__3824__auto____8006 = cljs.core._invoke["_"];
          if(or__3824__auto____8006) {
            return or__3824__auto____8006
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____8007 = this$;
      if(and__3822__auto____8007) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____8007
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____8008 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8009 = cljs.core._invoke[goog.typeOf(x__2363__auto____8008)];
        if(or__3824__auto____8009) {
          return or__3824__auto____8009
        }else {
          var or__3824__auto____8010 = cljs.core._invoke["_"];
          if(or__3824__auto____8010) {
            return or__3824__auto____8010
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____8011 = this$;
      if(and__3822__auto____8011) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____8011
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____8012 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8013 = cljs.core._invoke[goog.typeOf(x__2363__auto____8012)];
        if(or__3824__auto____8013) {
          return or__3824__auto____8013
        }else {
          var or__3824__auto____8014 = cljs.core._invoke["_"];
          if(or__3824__auto____8014) {
            return or__3824__auto____8014
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____8015 = this$;
      if(and__3822__auto____8015) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____8015
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____8016 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8017 = cljs.core._invoke[goog.typeOf(x__2363__auto____8016)];
        if(or__3824__auto____8017) {
          return or__3824__auto____8017
        }else {
          var or__3824__auto____8018 = cljs.core._invoke["_"];
          if(or__3824__auto____8018) {
            return or__3824__auto____8018
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____8019 = this$;
      if(and__3822__auto____8019) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____8019
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____8020 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8021 = cljs.core._invoke[goog.typeOf(x__2363__auto____8020)];
        if(or__3824__auto____8021) {
          return or__3824__auto____8021
        }else {
          var or__3824__auto____8022 = cljs.core._invoke["_"];
          if(or__3824__auto____8022) {
            return or__3824__auto____8022
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____8023 = this$;
      if(and__3822__auto____8023) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____8023
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____8024 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8025 = cljs.core._invoke[goog.typeOf(x__2363__auto____8024)];
        if(or__3824__auto____8025) {
          return or__3824__auto____8025
        }else {
          var or__3824__auto____8026 = cljs.core._invoke["_"];
          if(or__3824__auto____8026) {
            return or__3824__auto____8026
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____8027 = this$;
      if(and__3822__auto____8027) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____8027
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____8028 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8029 = cljs.core._invoke[goog.typeOf(x__2363__auto____8028)];
        if(or__3824__auto____8029) {
          return or__3824__auto____8029
        }else {
          var or__3824__auto____8030 = cljs.core._invoke["_"];
          if(or__3824__auto____8030) {
            return or__3824__auto____8030
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____8031 = this$;
      if(and__3822__auto____8031) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____8031
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____8032 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8033 = cljs.core._invoke[goog.typeOf(x__2363__auto____8032)];
        if(or__3824__auto____8033) {
          return or__3824__auto____8033
        }else {
          var or__3824__auto____8034 = cljs.core._invoke["_"];
          if(or__3824__auto____8034) {
            return or__3824__auto____8034
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____8035 = this$;
      if(and__3822__auto____8035) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____8035
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____8036 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8037 = cljs.core._invoke[goog.typeOf(x__2363__auto____8036)];
        if(or__3824__auto____8037) {
          return or__3824__auto____8037
        }else {
          var or__3824__auto____8038 = cljs.core._invoke["_"];
          if(or__3824__auto____8038) {
            return or__3824__auto____8038
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____8039 = this$;
      if(and__3822__auto____8039) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____8039
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____8040 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8041 = cljs.core._invoke[goog.typeOf(x__2363__auto____8040)];
        if(or__3824__auto____8041) {
          return or__3824__auto____8041
        }else {
          var or__3824__auto____8042 = cljs.core._invoke["_"];
          if(or__3824__auto____8042) {
            return or__3824__auto____8042
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____8043 = this$;
      if(and__3822__auto____8043) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____8043
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____8044 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8045 = cljs.core._invoke[goog.typeOf(x__2363__auto____8044)];
        if(or__3824__auto____8045) {
          return or__3824__auto____8045
        }else {
          var or__3824__auto____8046 = cljs.core._invoke["_"];
          if(or__3824__auto____8046) {
            return or__3824__auto____8046
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____8047 = this$;
      if(and__3822__auto____8047) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____8047
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____8048 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8049 = cljs.core._invoke[goog.typeOf(x__2363__auto____8048)];
        if(or__3824__auto____8049) {
          return or__3824__auto____8049
        }else {
          var or__3824__auto____8050 = cljs.core._invoke["_"];
          if(or__3824__auto____8050) {
            return or__3824__auto____8050
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____8051 = this$;
      if(and__3822__auto____8051) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____8051
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____8052 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8053 = cljs.core._invoke[goog.typeOf(x__2363__auto____8052)];
        if(or__3824__auto____8053) {
          return or__3824__auto____8053
        }else {
          var or__3824__auto____8054 = cljs.core._invoke["_"];
          if(or__3824__auto____8054) {
            return or__3824__auto____8054
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____8055 = this$;
      if(and__3822__auto____8055) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____8055
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____8056 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8057 = cljs.core._invoke[goog.typeOf(x__2363__auto____8056)];
        if(or__3824__auto____8057) {
          return or__3824__auto____8057
        }else {
          var or__3824__auto____8058 = cljs.core._invoke["_"];
          if(or__3824__auto____8058) {
            return or__3824__auto____8058
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____8059 = this$;
      if(and__3822__auto____8059) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____8059
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____8060 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8061 = cljs.core._invoke[goog.typeOf(x__2363__auto____8060)];
        if(or__3824__auto____8061) {
          return or__3824__auto____8061
        }else {
          var or__3824__auto____8062 = cljs.core._invoke["_"];
          if(or__3824__auto____8062) {
            return or__3824__auto____8062
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____8063 = this$;
      if(and__3822__auto____8063) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____8063
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____8064 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8065 = cljs.core._invoke[goog.typeOf(x__2363__auto____8064)];
        if(or__3824__auto____8065) {
          return or__3824__auto____8065
        }else {
          var or__3824__auto____8066 = cljs.core._invoke["_"];
          if(or__3824__auto____8066) {
            return or__3824__auto____8066
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____8067 = this$;
      if(and__3822__auto____8067) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____8067
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____8068 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8069 = cljs.core._invoke[goog.typeOf(x__2363__auto____8068)];
        if(or__3824__auto____8069) {
          return or__3824__auto____8069
        }else {
          var or__3824__auto____8070 = cljs.core._invoke["_"];
          if(or__3824__auto____8070) {
            return or__3824__auto____8070
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____8071 = this$;
      if(and__3822__auto____8071) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____8071
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____8072 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8073 = cljs.core._invoke[goog.typeOf(x__2363__auto____8072)];
        if(or__3824__auto____8073) {
          return or__3824__auto____8073
        }else {
          var or__3824__auto____8074 = cljs.core._invoke["_"];
          if(or__3824__auto____8074) {
            return or__3824__auto____8074
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____8075 = this$;
      if(and__3822__auto____8075) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____8075
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____8076 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8077 = cljs.core._invoke[goog.typeOf(x__2363__auto____8076)];
        if(or__3824__auto____8077) {
          return or__3824__auto____8077
        }else {
          var or__3824__auto____8078 = cljs.core._invoke["_"];
          if(or__3824__auto____8078) {
            return or__3824__auto____8078
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____8079 = this$;
      if(and__3822__auto____8079) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____8079
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____8080 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8081 = cljs.core._invoke[goog.typeOf(x__2363__auto____8080)];
        if(or__3824__auto____8081) {
          return or__3824__auto____8081
        }else {
          var or__3824__auto____8082 = cljs.core._invoke["_"];
          if(or__3824__auto____8082) {
            return or__3824__auto____8082
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____8083 = this$;
      if(and__3822__auto____8083) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____8083
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____8084 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8085 = cljs.core._invoke[goog.typeOf(x__2363__auto____8084)];
        if(or__3824__auto____8085) {
          return or__3824__auto____8085
        }else {
          var or__3824__auto____8086 = cljs.core._invoke["_"];
          if(or__3824__auto____8086) {
            return or__3824__auto____8086
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____8091 = coll;
    if(and__3822__auto____8091) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____8091
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____8092 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8093 = cljs.core._count[goog.typeOf(x__2363__auto____8092)];
      if(or__3824__auto____8093) {
        return or__3824__auto____8093
      }else {
        var or__3824__auto____8094 = cljs.core._count["_"];
        if(or__3824__auto____8094) {
          return or__3824__auto____8094
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____8099 = coll;
    if(and__3822__auto____8099) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____8099
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____8100 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8101 = cljs.core._empty[goog.typeOf(x__2363__auto____8100)];
      if(or__3824__auto____8101) {
        return or__3824__auto____8101
      }else {
        var or__3824__auto____8102 = cljs.core._empty["_"];
        if(or__3824__auto____8102) {
          return or__3824__auto____8102
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____8107 = coll;
    if(and__3822__auto____8107) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____8107
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____8108 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8109 = cljs.core._conj[goog.typeOf(x__2363__auto____8108)];
      if(or__3824__auto____8109) {
        return or__3824__auto____8109
      }else {
        var or__3824__auto____8110 = cljs.core._conj["_"];
        if(or__3824__auto____8110) {
          return or__3824__auto____8110
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____8119 = coll;
      if(and__3822__auto____8119) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____8119
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____8120 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____8121 = cljs.core._nth[goog.typeOf(x__2363__auto____8120)];
        if(or__3824__auto____8121) {
          return or__3824__auto____8121
        }else {
          var or__3824__auto____8122 = cljs.core._nth["_"];
          if(or__3824__auto____8122) {
            return or__3824__auto____8122
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____8123 = coll;
      if(and__3822__auto____8123) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____8123
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____8124 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____8125 = cljs.core._nth[goog.typeOf(x__2363__auto____8124)];
        if(or__3824__auto____8125) {
          return or__3824__auto____8125
        }else {
          var or__3824__auto____8126 = cljs.core._nth["_"];
          if(or__3824__auto____8126) {
            return or__3824__auto____8126
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____8131 = coll;
    if(and__3822__auto____8131) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____8131
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____8132 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8133 = cljs.core._first[goog.typeOf(x__2363__auto____8132)];
      if(or__3824__auto____8133) {
        return or__3824__auto____8133
      }else {
        var or__3824__auto____8134 = cljs.core._first["_"];
        if(or__3824__auto____8134) {
          return or__3824__auto____8134
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____8139 = coll;
    if(and__3822__auto____8139) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____8139
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____8140 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8141 = cljs.core._rest[goog.typeOf(x__2363__auto____8140)];
      if(or__3824__auto____8141) {
        return or__3824__auto____8141
      }else {
        var or__3824__auto____8142 = cljs.core._rest["_"];
        if(or__3824__auto____8142) {
          return or__3824__auto____8142
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____8147 = coll;
    if(and__3822__auto____8147) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____8147
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____8148 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8149 = cljs.core._next[goog.typeOf(x__2363__auto____8148)];
      if(or__3824__auto____8149) {
        return or__3824__auto____8149
      }else {
        var or__3824__auto____8150 = cljs.core._next["_"];
        if(or__3824__auto____8150) {
          return or__3824__auto____8150
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____8159 = o;
      if(and__3822__auto____8159) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____8159
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____8160 = o == null ? null : o;
      return function() {
        var or__3824__auto____8161 = cljs.core._lookup[goog.typeOf(x__2363__auto____8160)];
        if(or__3824__auto____8161) {
          return or__3824__auto____8161
        }else {
          var or__3824__auto____8162 = cljs.core._lookup["_"];
          if(or__3824__auto____8162) {
            return or__3824__auto____8162
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____8163 = o;
      if(and__3822__auto____8163) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____8163
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____8164 = o == null ? null : o;
      return function() {
        var or__3824__auto____8165 = cljs.core._lookup[goog.typeOf(x__2363__auto____8164)];
        if(or__3824__auto____8165) {
          return or__3824__auto____8165
        }else {
          var or__3824__auto____8166 = cljs.core._lookup["_"];
          if(or__3824__auto____8166) {
            return or__3824__auto____8166
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____8171 = coll;
    if(and__3822__auto____8171) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____8171
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____8172 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8173 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____8172)];
      if(or__3824__auto____8173) {
        return or__3824__auto____8173
      }else {
        var or__3824__auto____8174 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____8174) {
          return or__3824__auto____8174
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____8179 = coll;
    if(and__3822__auto____8179) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____8179
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____8180 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8181 = cljs.core._assoc[goog.typeOf(x__2363__auto____8180)];
      if(or__3824__auto____8181) {
        return or__3824__auto____8181
      }else {
        var or__3824__auto____8182 = cljs.core._assoc["_"];
        if(or__3824__auto____8182) {
          return or__3824__auto____8182
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____8187 = coll;
    if(and__3822__auto____8187) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____8187
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____8188 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8189 = cljs.core._dissoc[goog.typeOf(x__2363__auto____8188)];
      if(or__3824__auto____8189) {
        return or__3824__auto____8189
      }else {
        var or__3824__auto____8190 = cljs.core._dissoc["_"];
        if(or__3824__auto____8190) {
          return or__3824__auto____8190
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____8195 = coll;
    if(and__3822__auto____8195) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____8195
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____8196 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8197 = cljs.core._key[goog.typeOf(x__2363__auto____8196)];
      if(or__3824__auto____8197) {
        return or__3824__auto____8197
      }else {
        var or__3824__auto____8198 = cljs.core._key["_"];
        if(or__3824__auto____8198) {
          return or__3824__auto____8198
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____8203 = coll;
    if(and__3822__auto____8203) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____8203
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____8204 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8205 = cljs.core._val[goog.typeOf(x__2363__auto____8204)];
      if(or__3824__auto____8205) {
        return or__3824__auto____8205
      }else {
        var or__3824__auto____8206 = cljs.core._val["_"];
        if(or__3824__auto____8206) {
          return or__3824__auto____8206
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____8211 = coll;
    if(and__3822__auto____8211) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____8211
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____8212 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8213 = cljs.core._disjoin[goog.typeOf(x__2363__auto____8212)];
      if(or__3824__auto____8213) {
        return or__3824__auto____8213
      }else {
        var or__3824__auto____8214 = cljs.core._disjoin["_"];
        if(or__3824__auto____8214) {
          return or__3824__auto____8214
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____8219 = coll;
    if(and__3822__auto____8219) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____8219
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____8220 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8221 = cljs.core._peek[goog.typeOf(x__2363__auto____8220)];
      if(or__3824__auto____8221) {
        return or__3824__auto____8221
      }else {
        var or__3824__auto____8222 = cljs.core._peek["_"];
        if(or__3824__auto____8222) {
          return or__3824__auto____8222
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____8227 = coll;
    if(and__3822__auto____8227) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____8227
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____8228 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8229 = cljs.core._pop[goog.typeOf(x__2363__auto____8228)];
      if(or__3824__auto____8229) {
        return or__3824__auto____8229
      }else {
        var or__3824__auto____8230 = cljs.core._pop["_"];
        if(or__3824__auto____8230) {
          return or__3824__auto____8230
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____8235 = coll;
    if(and__3822__auto____8235) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____8235
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____8236 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8237 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____8236)];
      if(or__3824__auto____8237) {
        return or__3824__auto____8237
      }else {
        var or__3824__auto____8238 = cljs.core._assoc_n["_"];
        if(or__3824__auto____8238) {
          return or__3824__auto____8238
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____8243 = o;
    if(and__3822__auto____8243) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____8243
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____8244 = o == null ? null : o;
    return function() {
      var or__3824__auto____8245 = cljs.core._deref[goog.typeOf(x__2363__auto____8244)];
      if(or__3824__auto____8245) {
        return or__3824__auto____8245
      }else {
        var or__3824__auto____8246 = cljs.core._deref["_"];
        if(or__3824__auto____8246) {
          return or__3824__auto____8246
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____8251 = o;
    if(and__3822__auto____8251) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____8251
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____8252 = o == null ? null : o;
    return function() {
      var or__3824__auto____8253 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____8252)];
      if(or__3824__auto____8253) {
        return or__3824__auto____8253
      }else {
        var or__3824__auto____8254 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____8254) {
          return or__3824__auto____8254
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____8259 = o;
    if(and__3822__auto____8259) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____8259
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____8260 = o == null ? null : o;
    return function() {
      var or__3824__auto____8261 = cljs.core._meta[goog.typeOf(x__2363__auto____8260)];
      if(or__3824__auto____8261) {
        return or__3824__auto____8261
      }else {
        var or__3824__auto____8262 = cljs.core._meta["_"];
        if(or__3824__auto____8262) {
          return or__3824__auto____8262
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____8267 = o;
    if(and__3822__auto____8267) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____8267
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____8268 = o == null ? null : o;
    return function() {
      var or__3824__auto____8269 = cljs.core._with_meta[goog.typeOf(x__2363__auto____8268)];
      if(or__3824__auto____8269) {
        return or__3824__auto____8269
      }else {
        var or__3824__auto____8270 = cljs.core._with_meta["_"];
        if(or__3824__auto____8270) {
          return or__3824__auto____8270
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____8279 = coll;
      if(and__3822__auto____8279) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____8279
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____8280 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____8281 = cljs.core._reduce[goog.typeOf(x__2363__auto____8280)];
        if(or__3824__auto____8281) {
          return or__3824__auto____8281
        }else {
          var or__3824__auto____8282 = cljs.core._reduce["_"];
          if(or__3824__auto____8282) {
            return or__3824__auto____8282
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____8283 = coll;
      if(and__3822__auto____8283) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____8283
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____8284 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____8285 = cljs.core._reduce[goog.typeOf(x__2363__auto____8284)];
        if(or__3824__auto____8285) {
          return or__3824__auto____8285
        }else {
          var or__3824__auto____8286 = cljs.core._reduce["_"];
          if(or__3824__auto____8286) {
            return or__3824__auto____8286
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____8291 = coll;
    if(and__3822__auto____8291) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____8291
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____8292 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8293 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____8292)];
      if(or__3824__auto____8293) {
        return or__3824__auto____8293
      }else {
        var or__3824__auto____8294 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____8294) {
          return or__3824__auto____8294
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____8299 = o;
    if(and__3822__auto____8299) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____8299
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____8300 = o == null ? null : o;
    return function() {
      var or__3824__auto____8301 = cljs.core._equiv[goog.typeOf(x__2363__auto____8300)];
      if(or__3824__auto____8301) {
        return or__3824__auto____8301
      }else {
        var or__3824__auto____8302 = cljs.core._equiv["_"];
        if(or__3824__auto____8302) {
          return or__3824__auto____8302
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____8307 = o;
    if(and__3822__auto____8307) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____8307
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____8308 = o == null ? null : o;
    return function() {
      var or__3824__auto____8309 = cljs.core._hash[goog.typeOf(x__2363__auto____8308)];
      if(or__3824__auto____8309) {
        return or__3824__auto____8309
      }else {
        var or__3824__auto____8310 = cljs.core._hash["_"];
        if(or__3824__auto____8310) {
          return or__3824__auto____8310
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____8315 = o;
    if(and__3822__auto____8315) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____8315
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____8316 = o == null ? null : o;
    return function() {
      var or__3824__auto____8317 = cljs.core._seq[goog.typeOf(x__2363__auto____8316)];
      if(or__3824__auto____8317) {
        return or__3824__auto____8317
      }else {
        var or__3824__auto____8318 = cljs.core._seq["_"];
        if(or__3824__auto____8318) {
          return or__3824__auto____8318
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____8323 = coll;
    if(and__3822__auto____8323) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____8323
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____8324 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8325 = cljs.core._rseq[goog.typeOf(x__2363__auto____8324)];
      if(or__3824__auto____8325) {
        return or__3824__auto____8325
      }else {
        var or__3824__auto____8326 = cljs.core._rseq["_"];
        if(or__3824__auto____8326) {
          return or__3824__auto____8326
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____8331 = coll;
    if(and__3822__auto____8331) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____8331
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____8332 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8333 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____8332)];
      if(or__3824__auto____8333) {
        return or__3824__auto____8333
      }else {
        var or__3824__auto____8334 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____8334) {
          return or__3824__auto____8334
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____8339 = coll;
    if(and__3822__auto____8339) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____8339
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____8340 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8341 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____8340)];
      if(or__3824__auto____8341) {
        return or__3824__auto____8341
      }else {
        var or__3824__auto____8342 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____8342) {
          return or__3824__auto____8342
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____8347 = coll;
    if(and__3822__auto____8347) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____8347
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____8348 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8349 = cljs.core._entry_key[goog.typeOf(x__2363__auto____8348)];
      if(or__3824__auto____8349) {
        return or__3824__auto____8349
      }else {
        var or__3824__auto____8350 = cljs.core._entry_key["_"];
        if(or__3824__auto____8350) {
          return or__3824__auto____8350
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____8355 = coll;
    if(and__3822__auto____8355) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____8355
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____8356 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8357 = cljs.core._comparator[goog.typeOf(x__2363__auto____8356)];
      if(or__3824__auto____8357) {
        return or__3824__auto____8357
      }else {
        var or__3824__auto____8358 = cljs.core._comparator["_"];
        if(or__3824__auto____8358) {
          return or__3824__auto____8358
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____8363 = o;
    if(and__3822__auto____8363) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____8363
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____8364 = o == null ? null : o;
    return function() {
      var or__3824__auto____8365 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____8364)];
      if(or__3824__auto____8365) {
        return or__3824__auto____8365
      }else {
        var or__3824__auto____8366 = cljs.core._pr_seq["_"];
        if(or__3824__auto____8366) {
          return or__3824__auto____8366
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____8371 = d;
    if(and__3822__auto____8371) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____8371
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____8372 = d == null ? null : d;
    return function() {
      var or__3824__auto____8373 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____8372)];
      if(or__3824__auto____8373) {
        return or__3824__auto____8373
      }else {
        var or__3824__auto____8374 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____8374) {
          return or__3824__auto____8374
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____8379 = this$;
    if(and__3822__auto____8379) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____8379
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____8380 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____8381 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____8380)];
      if(or__3824__auto____8381) {
        return or__3824__auto____8381
      }else {
        var or__3824__auto____8382 = cljs.core._notify_watches["_"];
        if(or__3824__auto____8382) {
          return or__3824__auto____8382
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____8387 = this$;
    if(and__3822__auto____8387) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____8387
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____8388 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____8389 = cljs.core._add_watch[goog.typeOf(x__2363__auto____8388)];
      if(or__3824__auto____8389) {
        return or__3824__auto____8389
      }else {
        var or__3824__auto____8390 = cljs.core._add_watch["_"];
        if(or__3824__auto____8390) {
          return or__3824__auto____8390
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____8395 = this$;
    if(and__3822__auto____8395) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____8395
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____8396 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____8397 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____8396)];
      if(or__3824__auto____8397) {
        return or__3824__auto____8397
      }else {
        var or__3824__auto____8398 = cljs.core._remove_watch["_"];
        if(or__3824__auto____8398) {
          return or__3824__auto____8398
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____8403 = coll;
    if(and__3822__auto____8403) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____8403
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____8404 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8405 = cljs.core._as_transient[goog.typeOf(x__2363__auto____8404)];
      if(or__3824__auto____8405) {
        return or__3824__auto____8405
      }else {
        var or__3824__auto____8406 = cljs.core._as_transient["_"];
        if(or__3824__auto____8406) {
          return or__3824__auto____8406
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____8411 = tcoll;
    if(and__3822__auto____8411) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____8411
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____8412 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8413 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____8412)];
      if(or__3824__auto____8413) {
        return or__3824__auto____8413
      }else {
        var or__3824__auto____8414 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____8414) {
          return or__3824__auto____8414
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____8419 = tcoll;
    if(and__3822__auto____8419) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____8419
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____8420 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8421 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____8420)];
      if(or__3824__auto____8421) {
        return or__3824__auto____8421
      }else {
        var or__3824__auto____8422 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____8422) {
          return or__3824__auto____8422
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____8427 = tcoll;
    if(and__3822__auto____8427) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____8427
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____8428 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8429 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____8428)];
      if(or__3824__auto____8429) {
        return or__3824__auto____8429
      }else {
        var or__3824__auto____8430 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____8430) {
          return or__3824__auto____8430
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____8435 = tcoll;
    if(and__3822__auto____8435) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____8435
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____8436 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8437 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____8436)];
      if(or__3824__auto____8437) {
        return or__3824__auto____8437
      }else {
        var or__3824__auto____8438 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____8438) {
          return or__3824__auto____8438
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____8443 = tcoll;
    if(and__3822__auto____8443) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____8443
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____8444 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8445 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____8444)];
      if(or__3824__auto____8445) {
        return or__3824__auto____8445
      }else {
        var or__3824__auto____8446 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____8446) {
          return or__3824__auto____8446
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____8451 = tcoll;
    if(and__3822__auto____8451) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____8451
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____8452 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8453 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____8452)];
      if(or__3824__auto____8453) {
        return or__3824__auto____8453
      }else {
        var or__3824__auto____8454 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____8454) {
          return or__3824__auto____8454
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____8459 = tcoll;
    if(and__3822__auto____8459) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____8459
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____8460 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8461 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____8460)];
      if(or__3824__auto____8461) {
        return or__3824__auto____8461
      }else {
        var or__3824__auto____8462 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____8462) {
          return or__3824__auto____8462
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____8467 = x;
    if(and__3822__auto____8467) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____8467
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____8468 = x == null ? null : x;
    return function() {
      var or__3824__auto____8469 = cljs.core._compare[goog.typeOf(x__2363__auto____8468)];
      if(or__3824__auto____8469) {
        return or__3824__auto____8469
      }else {
        var or__3824__auto____8470 = cljs.core._compare["_"];
        if(or__3824__auto____8470) {
          return or__3824__auto____8470
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____8475 = coll;
    if(and__3822__auto____8475) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____8475
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____8476 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8477 = cljs.core._drop_first[goog.typeOf(x__2363__auto____8476)];
      if(or__3824__auto____8477) {
        return or__3824__auto____8477
      }else {
        var or__3824__auto____8478 = cljs.core._drop_first["_"];
        if(or__3824__auto____8478) {
          return or__3824__auto____8478
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____8483 = coll;
    if(and__3822__auto____8483) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____8483
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____8484 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8485 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____8484)];
      if(or__3824__auto____8485) {
        return or__3824__auto____8485
      }else {
        var or__3824__auto____8486 = cljs.core._chunked_first["_"];
        if(or__3824__auto____8486) {
          return or__3824__auto____8486
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____8491 = coll;
    if(and__3822__auto____8491) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____8491
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____8492 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8493 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____8492)];
      if(or__3824__auto____8493) {
        return or__3824__auto____8493
      }else {
        var or__3824__auto____8494 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____8494) {
          return or__3824__auto____8494
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____8499 = coll;
    if(and__3822__auto____8499) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____8499
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____8500 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8501 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____8500)];
      if(or__3824__auto____8501) {
        return or__3824__auto____8501
      }else {
        var or__3824__auto____8502 = cljs.core._chunked_next["_"];
        if(or__3824__auto____8502) {
          return or__3824__auto____8502
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____8504 = x === y;
    if(or__3824__auto____8504) {
      return or__3824__auto____8504
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__8505__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__8506 = y;
            var G__8507 = cljs.core.first.call(null, more);
            var G__8508 = cljs.core.next.call(null, more);
            x = G__8506;
            y = G__8507;
            more = G__8508;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__8505 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8505__delegate.call(this, x, y, more)
    };
    G__8505.cljs$lang$maxFixedArity = 2;
    G__8505.cljs$lang$applyTo = function(arglist__8509) {
      var x = cljs.core.first(arglist__8509);
      var y = cljs.core.first(cljs.core.next(arglist__8509));
      var more = cljs.core.rest(cljs.core.next(arglist__8509));
      return G__8505__delegate(x, y, more)
    };
    G__8505.cljs$lang$arity$variadic = G__8505__delegate;
    return G__8505
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__8510 = null;
  var G__8510__2 = function(o, k) {
    return null
  };
  var G__8510__3 = function(o, k, not_found) {
    return not_found
  };
  G__8510 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8510__2.call(this, o, k);
      case 3:
        return G__8510__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8510
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__8511 = null;
  var G__8511__2 = function(_, f) {
    return f.call(null)
  };
  var G__8511__3 = function(_, f, start) {
    return start
  };
  G__8511 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8511__2.call(this, _, f);
      case 3:
        return G__8511__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8511
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__8512 = null;
  var G__8512__2 = function(_, n) {
    return null
  };
  var G__8512__3 = function(_, n, not_found) {
    return not_found
  };
  G__8512 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8512__2.call(this, _, n);
      case 3:
        return G__8512__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8512
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____8513 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____8513) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____8513
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__8526 = cljs.core._count.call(null, cicoll);
    if(cnt__8526 === 0) {
      return f.call(null)
    }else {
      var val__8527 = cljs.core._nth.call(null, cicoll, 0);
      var n__8528 = 1;
      while(true) {
        if(n__8528 < cnt__8526) {
          var nval__8529 = f.call(null, val__8527, cljs.core._nth.call(null, cicoll, n__8528));
          if(cljs.core.reduced_QMARK_.call(null, nval__8529)) {
            return cljs.core.deref.call(null, nval__8529)
          }else {
            var G__8538 = nval__8529;
            var G__8539 = n__8528 + 1;
            val__8527 = G__8538;
            n__8528 = G__8539;
            continue
          }
        }else {
          return val__8527
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__8530 = cljs.core._count.call(null, cicoll);
    var val__8531 = val;
    var n__8532 = 0;
    while(true) {
      if(n__8532 < cnt__8530) {
        var nval__8533 = f.call(null, val__8531, cljs.core._nth.call(null, cicoll, n__8532));
        if(cljs.core.reduced_QMARK_.call(null, nval__8533)) {
          return cljs.core.deref.call(null, nval__8533)
        }else {
          var G__8540 = nval__8533;
          var G__8541 = n__8532 + 1;
          val__8531 = G__8540;
          n__8532 = G__8541;
          continue
        }
      }else {
        return val__8531
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__8534 = cljs.core._count.call(null, cicoll);
    var val__8535 = val;
    var n__8536 = idx;
    while(true) {
      if(n__8536 < cnt__8534) {
        var nval__8537 = f.call(null, val__8535, cljs.core._nth.call(null, cicoll, n__8536));
        if(cljs.core.reduced_QMARK_.call(null, nval__8537)) {
          return cljs.core.deref.call(null, nval__8537)
        }else {
          var G__8542 = nval__8537;
          var G__8543 = n__8536 + 1;
          val__8535 = G__8542;
          n__8536 = G__8543;
          continue
        }
      }else {
        return val__8535
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__8556 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__8557 = arr[0];
      var n__8558 = 1;
      while(true) {
        if(n__8558 < cnt__8556) {
          var nval__8559 = f.call(null, val__8557, arr[n__8558]);
          if(cljs.core.reduced_QMARK_.call(null, nval__8559)) {
            return cljs.core.deref.call(null, nval__8559)
          }else {
            var G__8568 = nval__8559;
            var G__8569 = n__8558 + 1;
            val__8557 = G__8568;
            n__8558 = G__8569;
            continue
          }
        }else {
          return val__8557
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__8560 = arr.length;
    var val__8561 = val;
    var n__8562 = 0;
    while(true) {
      if(n__8562 < cnt__8560) {
        var nval__8563 = f.call(null, val__8561, arr[n__8562]);
        if(cljs.core.reduced_QMARK_.call(null, nval__8563)) {
          return cljs.core.deref.call(null, nval__8563)
        }else {
          var G__8570 = nval__8563;
          var G__8571 = n__8562 + 1;
          val__8561 = G__8570;
          n__8562 = G__8571;
          continue
        }
      }else {
        return val__8561
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__8564 = arr.length;
    var val__8565 = val;
    var n__8566 = idx;
    while(true) {
      if(n__8566 < cnt__8564) {
        var nval__8567 = f.call(null, val__8565, arr[n__8566]);
        if(cljs.core.reduced_QMARK_.call(null, nval__8567)) {
          return cljs.core.deref.call(null, nval__8567)
        }else {
          var G__8572 = nval__8567;
          var G__8573 = n__8566 + 1;
          val__8565 = G__8572;
          n__8566 = G__8573;
          continue
        }
      }else {
        return val__8565
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8574 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__8575 = this;
  if(this__8575.i + 1 < this__8575.a.length) {
    return new cljs.core.IndexedSeq(this__8575.a, this__8575.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8576 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8577 = this;
  var c__8578 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__8578 > 0) {
    return new cljs.core.RSeq(coll, c__8578 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__8579 = this;
  var this__8580 = this;
  return cljs.core.pr_str.call(null, this__8580)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8581 = this;
  if(cljs.core.counted_QMARK_.call(null, this__8581.a)) {
    return cljs.core.ci_reduce.call(null, this__8581.a, f, this__8581.a[this__8581.i], this__8581.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__8581.a[this__8581.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8582 = this;
  if(cljs.core.counted_QMARK_.call(null, this__8582.a)) {
    return cljs.core.ci_reduce.call(null, this__8582.a, f, start, this__8582.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8583 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__8584 = this;
  return this__8584.a.length - this__8584.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__8585 = this;
  return this__8585.a[this__8585.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__8586 = this;
  if(this__8586.i + 1 < this__8586.a.length) {
    return new cljs.core.IndexedSeq(this__8586.a, this__8586.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8587 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8588 = this;
  var i__8589 = n + this__8588.i;
  if(i__8589 < this__8588.a.length) {
    return this__8588.a[i__8589]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8590 = this;
  var i__8591 = n + this__8590.i;
  if(i__8591 < this__8590.a.length) {
    return this__8590.a[i__8591]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__8592 = null;
  var G__8592__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__8592__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__8592 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8592__2.call(this, array, f);
      case 3:
        return G__8592__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8592
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__8593 = null;
  var G__8593__2 = function(array, k) {
    return array[k]
  };
  var G__8593__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__8593 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8593__2.call(this, array, k);
      case 3:
        return G__8593__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8593
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__8594 = null;
  var G__8594__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__8594__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__8594 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8594__2.call(this, array, n);
      case 3:
        return G__8594__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8594
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8595 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8596 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__8597 = this;
  var this__8598 = this;
  return cljs.core.pr_str.call(null, this__8598)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8599 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8600 = this;
  return this__8600.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8601 = this;
  return cljs.core._nth.call(null, this__8601.ci, this__8601.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8602 = this;
  if(this__8602.i > 0) {
    return new cljs.core.RSeq(this__8602.ci, this__8602.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8603 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__8604 = this;
  return new cljs.core.RSeq(this__8604.ci, this__8604.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8605 = this;
  return this__8605.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__8609__8610 = coll;
      if(G__8609__8610) {
        if(function() {
          var or__3824__auto____8611 = G__8609__8610.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____8611) {
            return or__3824__auto____8611
          }else {
            return G__8609__8610.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__8609__8610.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__8609__8610)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__8609__8610)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__8616__8617 = coll;
      if(G__8616__8617) {
        if(function() {
          var or__3824__auto____8618 = G__8616__8617.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____8618) {
            return or__3824__auto____8618
          }else {
            return G__8616__8617.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__8616__8617.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8616__8617)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8616__8617)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__8619 = cljs.core.seq.call(null, coll);
      if(s__8619 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__8619)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__8624__8625 = coll;
      if(G__8624__8625) {
        if(function() {
          var or__3824__auto____8626 = G__8624__8625.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____8626) {
            return or__3824__auto____8626
          }else {
            return G__8624__8625.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__8624__8625.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8624__8625)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8624__8625)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__8627 = cljs.core.seq.call(null, coll);
      if(!(s__8627 == null)) {
        return cljs.core._rest.call(null, s__8627)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__8631__8632 = coll;
      if(G__8631__8632) {
        if(function() {
          var or__3824__auto____8633 = G__8631__8632.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____8633) {
            return or__3824__auto____8633
          }else {
            return G__8631__8632.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__8631__8632.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__8631__8632)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__8631__8632)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__8635 = cljs.core.next.call(null, s);
    if(!(sn__8635 == null)) {
      var G__8636 = sn__8635;
      s = G__8636;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__8637__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__8638 = conj.call(null, coll, x);
          var G__8639 = cljs.core.first.call(null, xs);
          var G__8640 = cljs.core.next.call(null, xs);
          coll = G__8638;
          x = G__8639;
          xs = G__8640;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__8637 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8637__delegate.call(this, coll, x, xs)
    };
    G__8637.cljs$lang$maxFixedArity = 2;
    G__8637.cljs$lang$applyTo = function(arglist__8641) {
      var coll = cljs.core.first(arglist__8641);
      var x = cljs.core.first(cljs.core.next(arglist__8641));
      var xs = cljs.core.rest(cljs.core.next(arglist__8641));
      return G__8637__delegate(coll, x, xs)
    };
    G__8637.cljs$lang$arity$variadic = G__8637__delegate;
    return G__8637
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__8644 = cljs.core.seq.call(null, coll);
  var acc__8645 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__8644)) {
      return acc__8645 + cljs.core._count.call(null, s__8644)
    }else {
      var G__8646 = cljs.core.next.call(null, s__8644);
      var G__8647 = acc__8645 + 1;
      s__8644 = G__8646;
      acc__8645 = G__8647;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__8654__8655 = coll;
        if(G__8654__8655) {
          if(function() {
            var or__3824__auto____8656 = G__8654__8655.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____8656) {
              return or__3824__auto____8656
            }else {
              return G__8654__8655.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__8654__8655.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8654__8655)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8654__8655)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__8657__8658 = coll;
        if(G__8657__8658) {
          if(function() {
            var or__3824__auto____8659 = G__8657__8658.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____8659) {
              return or__3824__auto____8659
            }else {
              return G__8657__8658.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__8657__8658.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8657__8658)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8657__8658)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__8662__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__8661 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__8663 = ret__8661;
          var G__8664 = cljs.core.first.call(null, kvs);
          var G__8665 = cljs.core.second.call(null, kvs);
          var G__8666 = cljs.core.nnext.call(null, kvs);
          coll = G__8663;
          k = G__8664;
          v = G__8665;
          kvs = G__8666;
          continue
        }else {
          return ret__8661
        }
        break
      }
    };
    var G__8662 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8662__delegate.call(this, coll, k, v, kvs)
    };
    G__8662.cljs$lang$maxFixedArity = 3;
    G__8662.cljs$lang$applyTo = function(arglist__8667) {
      var coll = cljs.core.first(arglist__8667);
      var k = cljs.core.first(cljs.core.next(arglist__8667));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8667)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8667)));
      return G__8662__delegate(coll, k, v, kvs)
    };
    G__8662.cljs$lang$arity$variadic = G__8662__delegate;
    return G__8662
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__8670__delegate = function(coll, k, ks) {
      while(true) {
        var ret__8669 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__8671 = ret__8669;
          var G__8672 = cljs.core.first.call(null, ks);
          var G__8673 = cljs.core.next.call(null, ks);
          coll = G__8671;
          k = G__8672;
          ks = G__8673;
          continue
        }else {
          return ret__8669
        }
        break
      }
    };
    var G__8670 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8670__delegate.call(this, coll, k, ks)
    };
    G__8670.cljs$lang$maxFixedArity = 2;
    G__8670.cljs$lang$applyTo = function(arglist__8674) {
      var coll = cljs.core.first(arglist__8674);
      var k = cljs.core.first(cljs.core.next(arglist__8674));
      var ks = cljs.core.rest(cljs.core.next(arglist__8674));
      return G__8670__delegate(coll, k, ks)
    };
    G__8670.cljs$lang$arity$variadic = G__8670__delegate;
    return G__8670
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__8678__8679 = o;
    if(G__8678__8679) {
      if(function() {
        var or__3824__auto____8680 = G__8678__8679.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____8680) {
          return or__3824__auto____8680
        }else {
          return G__8678__8679.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__8678__8679.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__8678__8679)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__8678__8679)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__8683__delegate = function(coll, k, ks) {
      while(true) {
        var ret__8682 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__8684 = ret__8682;
          var G__8685 = cljs.core.first.call(null, ks);
          var G__8686 = cljs.core.next.call(null, ks);
          coll = G__8684;
          k = G__8685;
          ks = G__8686;
          continue
        }else {
          return ret__8682
        }
        break
      }
    };
    var G__8683 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8683__delegate.call(this, coll, k, ks)
    };
    G__8683.cljs$lang$maxFixedArity = 2;
    G__8683.cljs$lang$applyTo = function(arglist__8687) {
      var coll = cljs.core.first(arglist__8687);
      var k = cljs.core.first(cljs.core.next(arglist__8687));
      var ks = cljs.core.rest(cljs.core.next(arglist__8687));
      return G__8683__delegate(coll, k, ks)
    };
    G__8683.cljs$lang$arity$variadic = G__8683__delegate;
    return G__8683
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__8689 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__8689;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__8689
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__8691 = cljs.core.string_hash_cache[k];
  if(!(h__8691 == null)) {
    return h__8691
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____8693 = goog.isString(o);
      if(and__3822__auto____8693) {
        return check_cache
      }else {
        return and__3822__auto____8693
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__8697__8698 = x;
    if(G__8697__8698) {
      if(function() {
        var or__3824__auto____8699 = G__8697__8698.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____8699) {
          return or__3824__auto____8699
        }else {
          return G__8697__8698.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__8697__8698.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__8697__8698)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__8697__8698)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__8703__8704 = x;
    if(G__8703__8704) {
      if(function() {
        var or__3824__auto____8705 = G__8703__8704.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____8705) {
          return or__3824__auto____8705
        }else {
          return G__8703__8704.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__8703__8704.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__8703__8704)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__8703__8704)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__8709__8710 = x;
  if(G__8709__8710) {
    if(function() {
      var or__3824__auto____8711 = G__8709__8710.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____8711) {
        return or__3824__auto____8711
      }else {
        return G__8709__8710.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__8709__8710.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__8709__8710)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__8709__8710)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__8715__8716 = x;
  if(G__8715__8716) {
    if(function() {
      var or__3824__auto____8717 = G__8715__8716.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____8717) {
        return or__3824__auto____8717
      }else {
        return G__8715__8716.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__8715__8716.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__8715__8716)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__8715__8716)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__8721__8722 = x;
  if(G__8721__8722) {
    if(function() {
      var or__3824__auto____8723 = G__8721__8722.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____8723) {
        return or__3824__auto____8723
      }else {
        return G__8721__8722.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__8721__8722.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__8721__8722)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__8721__8722)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__8727__8728 = x;
  if(G__8727__8728) {
    if(function() {
      var or__3824__auto____8729 = G__8727__8728.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____8729) {
        return or__3824__auto____8729
      }else {
        return G__8727__8728.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__8727__8728.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8727__8728)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8727__8728)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__8733__8734 = x;
  if(G__8733__8734) {
    if(function() {
      var or__3824__auto____8735 = G__8733__8734.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____8735) {
        return or__3824__auto____8735
      }else {
        return G__8733__8734.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__8733__8734.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8733__8734)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8733__8734)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__8739__8740 = x;
    if(G__8739__8740) {
      if(function() {
        var or__3824__auto____8741 = G__8739__8740.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____8741) {
          return or__3824__auto____8741
        }else {
          return G__8739__8740.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__8739__8740.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__8739__8740)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__8739__8740)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__8745__8746 = x;
  if(G__8745__8746) {
    if(function() {
      var or__3824__auto____8747 = G__8745__8746.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____8747) {
        return or__3824__auto____8747
      }else {
        return G__8745__8746.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__8745__8746.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__8745__8746)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__8745__8746)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__8751__8752 = x;
  if(G__8751__8752) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____8753 = null;
      if(cljs.core.truth_(or__3824__auto____8753)) {
        return or__3824__auto____8753
      }else {
        return G__8751__8752.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__8751__8752.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__8751__8752)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__8751__8752)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__8754__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__8754 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8754__delegate.call(this, keyvals)
    };
    G__8754.cljs$lang$maxFixedArity = 0;
    G__8754.cljs$lang$applyTo = function(arglist__8755) {
      var keyvals = cljs.core.seq(arglist__8755);
      return G__8754__delegate(keyvals)
    };
    G__8754.cljs$lang$arity$variadic = G__8754__delegate;
    return G__8754
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__8757 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__8757.push(key)
  });
  return keys__8757
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__8761 = i;
  var j__8762 = j;
  var len__8763 = len;
  while(true) {
    if(len__8763 === 0) {
      return to
    }else {
      to[j__8762] = from[i__8761];
      var G__8764 = i__8761 + 1;
      var G__8765 = j__8762 + 1;
      var G__8766 = len__8763 - 1;
      i__8761 = G__8764;
      j__8762 = G__8765;
      len__8763 = G__8766;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__8770 = i + (len - 1);
  var j__8771 = j + (len - 1);
  var len__8772 = len;
  while(true) {
    if(len__8772 === 0) {
      return to
    }else {
      to[j__8771] = from[i__8770];
      var G__8773 = i__8770 - 1;
      var G__8774 = j__8771 - 1;
      var G__8775 = len__8772 - 1;
      i__8770 = G__8773;
      j__8771 = G__8774;
      len__8772 = G__8775;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__8779__8780 = s;
    if(G__8779__8780) {
      if(function() {
        var or__3824__auto____8781 = G__8779__8780.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____8781) {
          return or__3824__auto____8781
        }else {
          return G__8779__8780.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__8779__8780.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8779__8780)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8779__8780)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__8785__8786 = s;
  if(G__8785__8786) {
    if(function() {
      var or__3824__auto____8787 = G__8785__8786.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____8787) {
        return or__3824__auto____8787
      }else {
        return G__8785__8786.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__8785__8786.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__8785__8786)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__8785__8786)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____8790 = goog.isString(x);
  if(and__3822__auto____8790) {
    return!function() {
      var or__3824__auto____8791 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____8791) {
        return or__3824__auto____8791
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____8790
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____8793 = goog.isString(x);
  if(and__3822__auto____8793) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____8793
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____8795 = goog.isString(x);
  if(and__3822__auto____8795) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____8795
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____8800 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____8800) {
    return or__3824__auto____8800
  }else {
    var G__8801__8802 = f;
    if(G__8801__8802) {
      if(function() {
        var or__3824__auto____8803 = G__8801__8802.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____8803) {
          return or__3824__auto____8803
        }else {
          return G__8801__8802.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__8801__8802.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__8801__8802)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__8801__8802)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____8805 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____8805) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____8805
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____8808 = coll;
    if(cljs.core.truth_(and__3822__auto____8808)) {
      var and__3822__auto____8809 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____8809) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____8809
      }
    }else {
      return and__3822__auto____8808
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__8818__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__8814 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__8815 = more;
        while(true) {
          var x__8816 = cljs.core.first.call(null, xs__8815);
          var etc__8817 = cljs.core.next.call(null, xs__8815);
          if(cljs.core.truth_(xs__8815)) {
            if(cljs.core.contains_QMARK_.call(null, s__8814, x__8816)) {
              return false
            }else {
              var G__8819 = cljs.core.conj.call(null, s__8814, x__8816);
              var G__8820 = etc__8817;
              s__8814 = G__8819;
              xs__8815 = G__8820;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__8818 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8818__delegate.call(this, x, y, more)
    };
    G__8818.cljs$lang$maxFixedArity = 2;
    G__8818.cljs$lang$applyTo = function(arglist__8821) {
      var x = cljs.core.first(arglist__8821);
      var y = cljs.core.first(cljs.core.next(arglist__8821));
      var more = cljs.core.rest(cljs.core.next(arglist__8821));
      return G__8818__delegate(x, y, more)
    };
    G__8818.cljs$lang$arity$variadic = G__8818__delegate;
    return G__8818
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__8825__8826 = x;
            if(G__8825__8826) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____8827 = null;
                if(cljs.core.truth_(or__3824__auto____8827)) {
                  return or__3824__auto____8827
                }else {
                  return G__8825__8826.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__8825__8826.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__8825__8826)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__8825__8826)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__8832 = cljs.core.count.call(null, xs);
    var yl__8833 = cljs.core.count.call(null, ys);
    if(xl__8832 < yl__8833) {
      return-1
    }else {
      if(xl__8832 > yl__8833) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__8832, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__8834 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____8835 = d__8834 === 0;
        if(and__3822__auto____8835) {
          return n + 1 < len
        }else {
          return and__3822__auto____8835
        }
      }()) {
        var G__8836 = xs;
        var G__8837 = ys;
        var G__8838 = len;
        var G__8839 = n + 1;
        xs = G__8836;
        ys = G__8837;
        len = G__8838;
        n = G__8839;
        continue
      }else {
        return d__8834
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__8841 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__8841)) {
        return r__8841
      }else {
        if(cljs.core.truth_(r__8841)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__8843 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__8843, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__8843)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____8849 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____8849) {
      var s__8850 = temp__3971__auto____8849;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__8850), cljs.core.next.call(null, s__8850))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__8851 = val;
    var coll__8852 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__8852) {
        var nval__8853 = f.call(null, val__8851, cljs.core.first.call(null, coll__8852));
        if(cljs.core.reduced_QMARK_.call(null, nval__8853)) {
          return cljs.core.deref.call(null, nval__8853)
        }else {
          var G__8854 = nval__8853;
          var G__8855 = cljs.core.next.call(null, coll__8852);
          val__8851 = G__8854;
          coll__8852 = G__8855;
          continue
        }
      }else {
        return val__8851
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__8857 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__8857);
  return cljs.core.vec.call(null, a__8857)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__8864__8865 = coll;
      if(G__8864__8865) {
        if(function() {
          var or__3824__auto____8866 = G__8864__8865.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____8866) {
            return or__3824__auto____8866
          }else {
            return G__8864__8865.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__8864__8865.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8864__8865)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8864__8865)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__8867__8868 = coll;
      if(G__8867__8868) {
        if(function() {
          var or__3824__auto____8869 = G__8867__8868.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____8869) {
            return or__3824__auto____8869
          }else {
            return G__8867__8868.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__8867__8868.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8867__8868)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8867__8868)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__8870 = this;
  return this__8870.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__8871__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__8871 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8871__delegate.call(this, x, y, more)
    };
    G__8871.cljs$lang$maxFixedArity = 2;
    G__8871.cljs$lang$applyTo = function(arglist__8872) {
      var x = cljs.core.first(arglist__8872);
      var y = cljs.core.first(cljs.core.next(arglist__8872));
      var more = cljs.core.rest(cljs.core.next(arglist__8872));
      return G__8871__delegate(x, y, more)
    };
    G__8871.cljs$lang$arity$variadic = G__8871__delegate;
    return G__8871
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__8873__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__8873 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8873__delegate.call(this, x, y, more)
    };
    G__8873.cljs$lang$maxFixedArity = 2;
    G__8873.cljs$lang$applyTo = function(arglist__8874) {
      var x = cljs.core.first(arglist__8874);
      var y = cljs.core.first(cljs.core.next(arglist__8874));
      var more = cljs.core.rest(cljs.core.next(arglist__8874));
      return G__8873__delegate(x, y, more)
    };
    G__8873.cljs$lang$arity$variadic = G__8873__delegate;
    return G__8873
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__8875__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__8875 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8875__delegate.call(this, x, y, more)
    };
    G__8875.cljs$lang$maxFixedArity = 2;
    G__8875.cljs$lang$applyTo = function(arglist__8876) {
      var x = cljs.core.first(arglist__8876);
      var y = cljs.core.first(cljs.core.next(arglist__8876));
      var more = cljs.core.rest(cljs.core.next(arglist__8876));
      return G__8875__delegate(x, y, more)
    };
    G__8875.cljs$lang$arity$variadic = G__8875__delegate;
    return G__8875
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__8877__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__8877 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8877__delegate.call(this, x, y, more)
    };
    G__8877.cljs$lang$maxFixedArity = 2;
    G__8877.cljs$lang$applyTo = function(arglist__8878) {
      var x = cljs.core.first(arglist__8878);
      var y = cljs.core.first(cljs.core.next(arglist__8878));
      var more = cljs.core.rest(cljs.core.next(arglist__8878));
      return G__8877__delegate(x, y, more)
    };
    G__8877.cljs$lang$arity$variadic = G__8877__delegate;
    return G__8877
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__8879__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__8880 = y;
            var G__8881 = cljs.core.first.call(null, more);
            var G__8882 = cljs.core.next.call(null, more);
            x = G__8880;
            y = G__8881;
            more = G__8882;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__8879 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8879__delegate.call(this, x, y, more)
    };
    G__8879.cljs$lang$maxFixedArity = 2;
    G__8879.cljs$lang$applyTo = function(arglist__8883) {
      var x = cljs.core.first(arglist__8883);
      var y = cljs.core.first(cljs.core.next(arglist__8883));
      var more = cljs.core.rest(cljs.core.next(arglist__8883));
      return G__8879__delegate(x, y, more)
    };
    G__8879.cljs$lang$arity$variadic = G__8879__delegate;
    return G__8879
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__8884__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__8885 = y;
            var G__8886 = cljs.core.first.call(null, more);
            var G__8887 = cljs.core.next.call(null, more);
            x = G__8885;
            y = G__8886;
            more = G__8887;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__8884 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8884__delegate.call(this, x, y, more)
    };
    G__8884.cljs$lang$maxFixedArity = 2;
    G__8884.cljs$lang$applyTo = function(arglist__8888) {
      var x = cljs.core.first(arglist__8888);
      var y = cljs.core.first(cljs.core.next(arglist__8888));
      var more = cljs.core.rest(cljs.core.next(arglist__8888));
      return G__8884__delegate(x, y, more)
    };
    G__8884.cljs$lang$arity$variadic = G__8884__delegate;
    return G__8884
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__8889__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__8890 = y;
            var G__8891 = cljs.core.first.call(null, more);
            var G__8892 = cljs.core.next.call(null, more);
            x = G__8890;
            y = G__8891;
            more = G__8892;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__8889 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8889__delegate.call(this, x, y, more)
    };
    G__8889.cljs$lang$maxFixedArity = 2;
    G__8889.cljs$lang$applyTo = function(arglist__8893) {
      var x = cljs.core.first(arglist__8893);
      var y = cljs.core.first(cljs.core.next(arglist__8893));
      var more = cljs.core.rest(cljs.core.next(arglist__8893));
      return G__8889__delegate(x, y, more)
    };
    G__8889.cljs$lang$arity$variadic = G__8889__delegate;
    return G__8889
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__8894__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__8895 = y;
            var G__8896 = cljs.core.first.call(null, more);
            var G__8897 = cljs.core.next.call(null, more);
            x = G__8895;
            y = G__8896;
            more = G__8897;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__8894 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8894__delegate.call(this, x, y, more)
    };
    G__8894.cljs$lang$maxFixedArity = 2;
    G__8894.cljs$lang$applyTo = function(arglist__8898) {
      var x = cljs.core.first(arglist__8898);
      var y = cljs.core.first(cljs.core.next(arglist__8898));
      var more = cljs.core.rest(cljs.core.next(arglist__8898));
      return G__8894__delegate(x, y, more)
    };
    G__8894.cljs$lang$arity$variadic = G__8894__delegate;
    return G__8894
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__8899__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__8899 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8899__delegate.call(this, x, y, more)
    };
    G__8899.cljs$lang$maxFixedArity = 2;
    G__8899.cljs$lang$applyTo = function(arglist__8900) {
      var x = cljs.core.first(arglist__8900);
      var y = cljs.core.first(cljs.core.next(arglist__8900));
      var more = cljs.core.rest(cljs.core.next(arglist__8900));
      return G__8899__delegate(x, y, more)
    };
    G__8899.cljs$lang$arity$variadic = G__8899__delegate;
    return G__8899
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__8901__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__8901 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8901__delegate.call(this, x, y, more)
    };
    G__8901.cljs$lang$maxFixedArity = 2;
    G__8901.cljs$lang$applyTo = function(arglist__8902) {
      var x = cljs.core.first(arglist__8902);
      var y = cljs.core.first(cljs.core.next(arglist__8902));
      var more = cljs.core.rest(cljs.core.next(arglist__8902));
      return G__8901__delegate(x, y, more)
    };
    G__8901.cljs$lang$arity$variadic = G__8901__delegate;
    return G__8901
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__8904 = n % d;
  return cljs.core.fix.call(null, (n - rem__8904) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__8906 = cljs.core.quot.call(null, n, d);
  return n - d * q__8906
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__8909 = v - (v >> 1 & 1431655765);
  var v__8910 = (v__8909 & 858993459) + (v__8909 >> 2 & 858993459);
  return(v__8910 + (v__8910 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__8911__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__8912 = y;
            var G__8913 = cljs.core.first.call(null, more);
            var G__8914 = cljs.core.next.call(null, more);
            x = G__8912;
            y = G__8913;
            more = G__8914;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__8911 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8911__delegate.call(this, x, y, more)
    };
    G__8911.cljs$lang$maxFixedArity = 2;
    G__8911.cljs$lang$applyTo = function(arglist__8915) {
      var x = cljs.core.first(arglist__8915);
      var y = cljs.core.first(cljs.core.next(arglist__8915));
      var more = cljs.core.rest(cljs.core.next(arglist__8915));
      return G__8911__delegate(x, y, more)
    };
    G__8911.cljs$lang$arity$variadic = G__8911__delegate;
    return G__8911
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__8919 = n;
  var xs__8920 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____8921 = xs__8920;
      if(and__3822__auto____8921) {
        return n__8919 > 0
      }else {
        return and__3822__auto____8921
      }
    }())) {
      var G__8922 = n__8919 - 1;
      var G__8923 = cljs.core.next.call(null, xs__8920);
      n__8919 = G__8922;
      xs__8920 = G__8923;
      continue
    }else {
      return xs__8920
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__8924__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__8925 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__8926 = cljs.core.next.call(null, more);
            sb = G__8925;
            more = G__8926;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__8924 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8924__delegate.call(this, x, ys)
    };
    G__8924.cljs$lang$maxFixedArity = 1;
    G__8924.cljs$lang$applyTo = function(arglist__8927) {
      var x = cljs.core.first(arglist__8927);
      var ys = cljs.core.rest(arglist__8927);
      return G__8924__delegate(x, ys)
    };
    G__8924.cljs$lang$arity$variadic = G__8924__delegate;
    return G__8924
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__8928__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__8929 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__8930 = cljs.core.next.call(null, more);
            sb = G__8929;
            more = G__8930;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__8928 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8928__delegate.call(this, x, ys)
    };
    G__8928.cljs$lang$maxFixedArity = 1;
    G__8928.cljs$lang$applyTo = function(arglist__8931) {
      var x = cljs.core.first(arglist__8931);
      var ys = cljs.core.rest(arglist__8931);
      return G__8928__delegate(x, ys)
    };
    G__8928.cljs$lang$arity$variadic = G__8928__delegate;
    return G__8928
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__8932) {
    var fmt = cljs.core.first(arglist__8932);
    var args = cljs.core.rest(arglist__8932);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__8935 = cljs.core.seq.call(null, x);
    var ys__8936 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__8935 == null) {
        return ys__8936 == null
      }else {
        if(ys__8936 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__8935), cljs.core.first.call(null, ys__8936))) {
            var G__8937 = cljs.core.next.call(null, xs__8935);
            var G__8938 = cljs.core.next.call(null, ys__8936);
            xs__8935 = G__8937;
            ys__8936 = G__8938;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__8939_SHARP_, p2__8940_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__8939_SHARP_, cljs.core.hash.call(null, p2__8940_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__8944 = 0;
  var s__8945 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__8945) {
      var e__8946 = cljs.core.first.call(null, s__8945);
      var G__8947 = (h__8944 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__8946)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__8946)))) % 4503599627370496;
      var G__8948 = cljs.core.next.call(null, s__8945);
      h__8944 = G__8947;
      s__8945 = G__8948;
      continue
    }else {
      return h__8944
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__8952 = 0;
  var s__8953 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__8953) {
      var e__8954 = cljs.core.first.call(null, s__8953);
      var G__8955 = (h__8952 + cljs.core.hash.call(null, e__8954)) % 4503599627370496;
      var G__8956 = cljs.core.next.call(null, s__8953);
      h__8952 = G__8955;
      s__8953 = G__8956;
      continue
    }else {
      return h__8952
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__8977__8978 = cljs.core.seq.call(null, fn_map);
  if(G__8977__8978) {
    var G__8980__8982 = cljs.core.first.call(null, G__8977__8978);
    var vec__8981__8983 = G__8980__8982;
    var key_name__8984 = cljs.core.nth.call(null, vec__8981__8983, 0, null);
    var f__8985 = cljs.core.nth.call(null, vec__8981__8983, 1, null);
    var G__8977__8986 = G__8977__8978;
    var G__8980__8987 = G__8980__8982;
    var G__8977__8988 = G__8977__8986;
    while(true) {
      var vec__8989__8990 = G__8980__8987;
      var key_name__8991 = cljs.core.nth.call(null, vec__8989__8990, 0, null);
      var f__8992 = cljs.core.nth.call(null, vec__8989__8990, 1, null);
      var G__8977__8993 = G__8977__8988;
      var str_name__8994 = cljs.core.name.call(null, key_name__8991);
      obj[str_name__8994] = f__8992;
      var temp__3974__auto____8995 = cljs.core.next.call(null, G__8977__8993);
      if(temp__3974__auto____8995) {
        var G__8977__8996 = temp__3974__auto____8995;
        var G__8997 = cljs.core.first.call(null, G__8977__8996);
        var G__8998 = G__8977__8996;
        G__8980__8987 = G__8997;
        G__8977__8988 = G__8998;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8999 = this;
  var h__2192__auto____9000 = this__8999.__hash;
  if(!(h__2192__auto____9000 == null)) {
    return h__2192__auto____9000
  }else {
    var h__2192__auto____9001 = cljs.core.hash_coll.call(null, coll);
    this__8999.__hash = h__2192__auto____9001;
    return h__2192__auto____9001
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__9002 = this;
  if(this__9002.count === 1) {
    return null
  }else {
    return this__9002.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9003 = this;
  return new cljs.core.List(this__9003.meta, o, coll, this__9003.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__9004 = this;
  var this__9005 = this;
  return cljs.core.pr_str.call(null, this__9005)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9006 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9007 = this;
  return this__9007.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9008 = this;
  return this__9008.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9009 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9010 = this;
  return this__9010.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9011 = this;
  if(this__9011.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__9011.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9012 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9013 = this;
  return new cljs.core.List(meta, this__9013.first, this__9013.rest, this__9013.count, this__9013.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9014 = this;
  return this__9014.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9015 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9016 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__9017 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9018 = this;
  return new cljs.core.List(this__9018.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__9019 = this;
  var this__9020 = this;
  return cljs.core.pr_str.call(null, this__9020)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9021 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9022 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9023 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9024 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9025 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9026 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9027 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9028 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9029 = this;
  return this__9029.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9030 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__9034__9035 = coll;
  if(G__9034__9035) {
    if(function() {
      var or__3824__auto____9036 = G__9034__9035.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____9036) {
        return or__3824__auto____9036
      }else {
        return G__9034__9035.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__9034__9035.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__9034__9035)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__9034__9035)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__9037__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__9037 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9037__delegate.call(this, x, y, z, items)
    };
    G__9037.cljs$lang$maxFixedArity = 3;
    G__9037.cljs$lang$applyTo = function(arglist__9038) {
      var x = cljs.core.first(arglist__9038);
      var y = cljs.core.first(cljs.core.next(arglist__9038));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9038)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9038)));
      return G__9037__delegate(x, y, z, items)
    };
    G__9037.cljs$lang$arity$variadic = G__9037__delegate;
    return G__9037
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9039 = this;
  var h__2192__auto____9040 = this__9039.__hash;
  if(!(h__2192__auto____9040 == null)) {
    return h__2192__auto____9040
  }else {
    var h__2192__auto____9041 = cljs.core.hash_coll.call(null, coll);
    this__9039.__hash = h__2192__auto____9041;
    return h__2192__auto____9041
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__9042 = this;
  if(this__9042.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__9042.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9043 = this;
  return new cljs.core.Cons(null, o, coll, this__9043.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__9044 = this;
  var this__9045 = this;
  return cljs.core.pr_str.call(null, this__9045)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9046 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9047 = this;
  return this__9047.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9048 = this;
  if(this__9048.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__9048.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9049 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9050 = this;
  return new cljs.core.Cons(meta, this__9050.first, this__9050.rest, this__9050.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9051 = this;
  return this__9051.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9052 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9052.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____9057 = coll == null;
    if(or__3824__auto____9057) {
      return or__3824__auto____9057
    }else {
      var G__9058__9059 = coll;
      if(G__9058__9059) {
        if(function() {
          var or__3824__auto____9060 = G__9058__9059.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____9060) {
            return or__3824__auto____9060
          }else {
            return G__9058__9059.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__9058__9059.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9058__9059)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9058__9059)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__9064__9065 = x;
  if(G__9064__9065) {
    if(function() {
      var or__3824__auto____9066 = G__9064__9065.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____9066) {
        return or__3824__auto____9066
      }else {
        return G__9064__9065.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__9064__9065.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__9064__9065)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__9064__9065)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__9067 = null;
  var G__9067__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__9067__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__9067 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__9067__2.call(this, string, f);
      case 3:
        return G__9067__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9067
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__9068 = null;
  var G__9068__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__9068__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__9068 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9068__2.call(this, string, k);
      case 3:
        return G__9068__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9068
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__9069 = null;
  var G__9069__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__9069__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__9069 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9069__2.call(this, string, n);
      case 3:
        return G__9069__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9069
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__9081 = null;
  var G__9081__2 = function(this_sym9072, coll) {
    var this__9074 = this;
    var this_sym9072__9075 = this;
    var ___9076 = this_sym9072__9075;
    if(coll == null) {
      return null
    }else {
      var strobj__9077 = coll.strobj;
      if(strobj__9077 == null) {
        return cljs.core._lookup.call(null, coll, this__9074.k, null)
      }else {
        return strobj__9077[this__9074.k]
      }
    }
  };
  var G__9081__3 = function(this_sym9073, coll, not_found) {
    var this__9074 = this;
    var this_sym9073__9078 = this;
    var ___9079 = this_sym9073__9078;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__9074.k, not_found)
    }
  };
  G__9081 = function(this_sym9073, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9081__2.call(this, this_sym9073, coll);
      case 3:
        return G__9081__3.call(this, this_sym9073, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9081
}();
cljs.core.Keyword.prototype.apply = function(this_sym9070, args9071) {
  var this__9080 = this;
  return this_sym9070.call.apply(this_sym9070, [this_sym9070].concat(args9071.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__9090 = null;
  var G__9090__2 = function(this_sym9084, coll) {
    var this_sym9084__9086 = this;
    var this__9087 = this_sym9084__9086;
    return cljs.core._lookup.call(null, coll, this__9087.toString(), null)
  };
  var G__9090__3 = function(this_sym9085, coll, not_found) {
    var this_sym9085__9088 = this;
    var this__9089 = this_sym9085__9088;
    return cljs.core._lookup.call(null, coll, this__9089.toString(), not_found)
  };
  G__9090 = function(this_sym9085, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9090__2.call(this, this_sym9085, coll);
      case 3:
        return G__9090__3.call(this, this_sym9085, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9090
}();
String.prototype.apply = function(this_sym9082, args9083) {
  return this_sym9082.call.apply(this_sym9082, [this_sym9082].concat(args9083.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__9092 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__9092
  }else {
    lazy_seq.x = x__9092.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9093 = this;
  var h__2192__auto____9094 = this__9093.__hash;
  if(!(h__2192__auto____9094 == null)) {
    return h__2192__auto____9094
  }else {
    var h__2192__auto____9095 = cljs.core.hash_coll.call(null, coll);
    this__9093.__hash = h__2192__auto____9095;
    return h__2192__auto____9095
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__9096 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9097 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__9098 = this;
  var this__9099 = this;
  return cljs.core.pr_str.call(null, this__9099)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9100 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9101 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9102 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9103 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9104 = this;
  return new cljs.core.LazySeq(meta, this__9104.realized, this__9104.x, this__9104.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9105 = this;
  return this__9105.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9106 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9106.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__9107 = this;
  return this__9107.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__9108 = this;
  var ___9109 = this;
  this__9108.buf[this__9108.end] = o;
  return this__9108.end = this__9108.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__9110 = this;
  var ___9111 = this;
  var ret__9112 = new cljs.core.ArrayChunk(this__9110.buf, 0, this__9110.end);
  this__9110.buf = null;
  return ret__9112
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__9113 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__9113.arr[this__9113.off], this__9113.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__9114 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__9114.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__9115 = this;
  if(this__9115.off === this__9115.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__9115.arr, this__9115.off + 1, this__9115.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__9116 = this;
  return this__9116.arr[this__9116.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__9117 = this;
  if(function() {
    var and__3822__auto____9118 = i >= 0;
    if(and__3822__auto____9118) {
      return i < this__9117.end - this__9117.off
    }else {
      return and__3822__auto____9118
    }
  }()) {
    return this__9117.arr[this__9117.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__9119 = this;
  return this__9119.end - this__9119.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__9120 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9121 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9122 = this;
  return cljs.core._nth.call(null, this__9122.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9123 = this;
  if(cljs.core._count.call(null, this__9123.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__9123.chunk), this__9123.more, this__9123.meta)
  }else {
    if(this__9123.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__9123.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__9124 = this;
  if(this__9124.more == null) {
    return null
  }else {
    return this__9124.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9125 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__9126 = this;
  return new cljs.core.ChunkedCons(this__9126.chunk, this__9126.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9127 = this;
  return this__9127.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__9128 = this;
  return this__9128.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__9129 = this;
  if(this__9129.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__9129.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__9133__9134 = s;
    if(G__9133__9134) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____9135 = null;
        if(cljs.core.truth_(or__3824__auto____9135)) {
          return or__3824__auto____9135
        }else {
          return G__9133__9134.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__9133__9134.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__9133__9134)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__9133__9134)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__9138 = [];
  var s__9139 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__9139)) {
      ary__9138.push(cljs.core.first.call(null, s__9139));
      var G__9140 = cljs.core.next.call(null, s__9139);
      s__9139 = G__9140;
      continue
    }else {
      return ary__9138
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__9144 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__9145 = 0;
  var xs__9146 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__9146) {
      ret__9144[i__9145] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__9146));
      var G__9147 = i__9145 + 1;
      var G__9148 = cljs.core.next.call(null, xs__9146);
      i__9145 = G__9147;
      xs__9146 = G__9148;
      continue
    }else {
    }
    break
  }
  return ret__9144
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__9156 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9157 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9158 = 0;
      var s__9159 = s__9157;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____9160 = s__9159;
          if(and__3822__auto____9160) {
            return i__9158 < size
          }else {
            return and__3822__auto____9160
          }
        }())) {
          a__9156[i__9158] = cljs.core.first.call(null, s__9159);
          var G__9163 = i__9158 + 1;
          var G__9164 = cljs.core.next.call(null, s__9159);
          i__9158 = G__9163;
          s__9159 = G__9164;
          continue
        }else {
          return a__9156
        }
        break
      }
    }else {
      var n__2527__auto____9161 = size;
      var i__9162 = 0;
      while(true) {
        if(i__9162 < n__2527__auto____9161) {
          a__9156[i__9162] = init_val_or_seq;
          var G__9165 = i__9162 + 1;
          i__9162 = G__9165;
          continue
        }else {
        }
        break
      }
      return a__9156
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__9173 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9174 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9175 = 0;
      var s__9176 = s__9174;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____9177 = s__9176;
          if(and__3822__auto____9177) {
            return i__9175 < size
          }else {
            return and__3822__auto____9177
          }
        }())) {
          a__9173[i__9175] = cljs.core.first.call(null, s__9176);
          var G__9180 = i__9175 + 1;
          var G__9181 = cljs.core.next.call(null, s__9176);
          i__9175 = G__9180;
          s__9176 = G__9181;
          continue
        }else {
          return a__9173
        }
        break
      }
    }else {
      var n__2527__auto____9178 = size;
      var i__9179 = 0;
      while(true) {
        if(i__9179 < n__2527__auto____9178) {
          a__9173[i__9179] = init_val_or_seq;
          var G__9182 = i__9179 + 1;
          i__9179 = G__9182;
          continue
        }else {
        }
        break
      }
      return a__9173
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__9190 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9191 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9192 = 0;
      var s__9193 = s__9191;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____9194 = s__9193;
          if(and__3822__auto____9194) {
            return i__9192 < size
          }else {
            return and__3822__auto____9194
          }
        }())) {
          a__9190[i__9192] = cljs.core.first.call(null, s__9193);
          var G__9197 = i__9192 + 1;
          var G__9198 = cljs.core.next.call(null, s__9193);
          i__9192 = G__9197;
          s__9193 = G__9198;
          continue
        }else {
          return a__9190
        }
        break
      }
    }else {
      var n__2527__auto____9195 = size;
      var i__9196 = 0;
      while(true) {
        if(i__9196 < n__2527__auto____9195) {
          a__9190[i__9196] = init_val_or_seq;
          var G__9199 = i__9196 + 1;
          i__9196 = G__9199;
          continue
        }else {
        }
        break
      }
      return a__9190
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__9204 = s;
    var i__9205 = n;
    var sum__9206 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____9207 = i__9205 > 0;
        if(and__3822__auto____9207) {
          return cljs.core.seq.call(null, s__9204)
        }else {
          return and__3822__auto____9207
        }
      }())) {
        var G__9208 = cljs.core.next.call(null, s__9204);
        var G__9209 = i__9205 - 1;
        var G__9210 = sum__9206 + 1;
        s__9204 = G__9208;
        i__9205 = G__9209;
        sum__9206 = G__9210;
        continue
      }else {
        return sum__9206
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__9215 = cljs.core.seq.call(null, x);
      if(s__9215) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__9215)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__9215), concat.call(null, cljs.core.chunk_rest.call(null, s__9215), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__9215), concat.call(null, cljs.core.rest.call(null, s__9215), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__9219__delegate = function(x, y, zs) {
      var cat__9218 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__9217 = cljs.core.seq.call(null, xys);
          if(xys__9217) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__9217)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__9217), cat.call(null, cljs.core.chunk_rest.call(null, xys__9217), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__9217), cat.call(null, cljs.core.rest.call(null, xys__9217), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__9218.call(null, concat.call(null, x, y), zs)
    };
    var G__9219 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9219__delegate.call(this, x, y, zs)
    };
    G__9219.cljs$lang$maxFixedArity = 2;
    G__9219.cljs$lang$applyTo = function(arglist__9220) {
      var x = cljs.core.first(arglist__9220);
      var y = cljs.core.first(cljs.core.next(arglist__9220));
      var zs = cljs.core.rest(cljs.core.next(arglist__9220));
      return G__9219__delegate(x, y, zs)
    };
    G__9219.cljs$lang$arity$variadic = G__9219__delegate;
    return G__9219
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__9221__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__9221 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9221__delegate.call(this, a, b, c, d, more)
    };
    G__9221.cljs$lang$maxFixedArity = 4;
    G__9221.cljs$lang$applyTo = function(arglist__9222) {
      var a = cljs.core.first(arglist__9222);
      var b = cljs.core.first(cljs.core.next(arglist__9222));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9222)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9222))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9222))));
      return G__9221__delegate(a, b, c, d, more)
    };
    G__9221.cljs$lang$arity$variadic = G__9221__delegate;
    return G__9221
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__9264 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__9265 = cljs.core._first.call(null, args__9264);
    var args__9266 = cljs.core._rest.call(null, args__9264);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__9265)
      }else {
        return f.call(null, a__9265)
      }
    }else {
      var b__9267 = cljs.core._first.call(null, args__9266);
      var args__9268 = cljs.core._rest.call(null, args__9266);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__9265, b__9267)
        }else {
          return f.call(null, a__9265, b__9267)
        }
      }else {
        var c__9269 = cljs.core._first.call(null, args__9268);
        var args__9270 = cljs.core._rest.call(null, args__9268);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__9265, b__9267, c__9269)
          }else {
            return f.call(null, a__9265, b__9267, c__9269)
          }
        }else {
          var d__9271 = cljs.core._first.call(null, args__9270);
          var args__9272 = cljs.core._rest.call(null, args__9270);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__9265, b__9267, c__9269, d__9271)
            }else {
              return f.call(null, a__9265, b__9267, c__9269, d__9271)
            }
          }else {
            var e__9273 = cljs.core._first.call(null, args__9272);
            var args__9274 = cljs.core._rest.call(null, args__9272);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__9265, b__9267, c__9269, d__9271, e__9273)
              }else {
                return f.call(null, a__9265, b__9267, c__9269, d__9271, e__9273)
              }
            }else {
              var f__9275 = cljs.core._first.call(null, args__9274);
              var args__9276 = cljs.core._rest.call(null, args__9274);
              if(argc === 6) {
                if(f__9275.cljs$lang$arity$6) {
                  return f__9275.cljs$lang$arity$6(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275)
                }else {
                  return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275)
                }
              }else {
                var g__9277 = cljs.core._first.call(null, args__9276);
                var args__9278 = cljs.core._rest.call(null, args__9276);
                if(argc === 7) {
                  if(f__9275.cljs$lang$arity$7) {
                    return f__9275.cljs$lang$arity$7(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277)
                  }else {
                    return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277)
                  }
                }else {
                  var h__9279 = cljs.core._first.call(null, args__9278);
                  var args__9280 = cljs.core._rest.call(null, args__9278);
                  if(argc === 8) {
                    if(f__9275.cljs$lang$arity$8) {
                      return f__9275.cljs$lang$arity$8(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279)
                    }else {
                      return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279)
                    }
                  }else {
                    var i__9281 = cljs.core._first.call(null, args__9280);
                    var args__9282 = cljs.core._rest.call(null, args__9280);
                    if(argc === 9) {
                      if(f__9275.cljs$lang$arity$9) {
                        return f__9275.cljs$lang$arity$9(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281)
                      }else {
                        return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281)
                      }
                    }else {
                      var j__9283 = cljs.core._first.call(null, args__9282);
                      var args__9284 = cljs.core._rest.call(null, args__9282);
                      if(argc === 10) {
                        if(f__9275.cljs$lang$arity$10) {
                          return f__9275.cljs$lang$arity$10(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283)
                        }else {
                          return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283)
                        }
                      }else {
                        var k__9285 = cljs.core._first.call(null, args__9284);
                        var args__9286 = cljs.core._rest.call(null, args__9284);
                        if(argc === 11) {
                          if(f__9275.cljs$lang$arity$11) {
                            return f__9275.cljs$lang$arity$11(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285)
                          }else {
                            return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285)
                          }
                        }else {
                          var l__9287 = cljs.core._first.call(null, args__9286);
                          var args__9288 = cljs.core._rest.call(null, args__9286);
                          if(argc === 12) {
                            if(f__9275.cljs$lang$arity$12) {
                              return f__9275.cljs$lang$arity$12(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287)
                            }else {
                              return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287)
                            }
                          }else {
                            var m__9289 = cljs.core._first.call(null, args__9288);
                            var args__9290 = cljs.core._rest.call(null, args__9288);
                            if(argc === 13) {
                              if(f__9275.cljs$lang$arity$13) {
                                return f__9275.cljs$lang$arity$13(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289)
                              }else {
                                return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289)
                              }
                            }else {
                              var n__9291 = cljs.core._first.call(null, args__9290);
                              var args__9292 = cljs.core._rest.call(null, args__9290);
                              if(argc === 14) {
                                if(f__9275.cljs$lang$arity$14) {
                                  return f__9275.cljs$lang$arity$14(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291)
                                }else {
                                  return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291)
                                }
                              }else {
                                var o__9293 = cljs.core._first.call(null, args__9292);
                                var args__9294 = cljs.core._rest.call(null, args__9292);
                                if(argc === 15) {
                                  if(f__9275.cljs$lang$arity$15) {
                                    return f__9275.cljs$lang$arity$15(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291, o__9293)
                                  }else {
                                    return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291, o__9293)
                                  }
                                }else {
                                  var p__9295 = cljs.core._first.call(null, args__9294);
                                  var args__9296 = cljs.core._rest.call(null, args__9294);
                                  if(argc === 16) {
                                    if(f__9275.cljs$lang$arity$16) {
                                      return f__9275.cljs$lang$arity$16(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291, o__9293, p__9295)
                                    }else {
                                      return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291, o__9293, p__9295)
                                    }
                                  }else {
                                    var q__9297 = cljs.core._first.call(null, args__9296);
                                    var args__9298 = cljs.core._rest.call(null, args__9296);
                                    if(argc === 17) {
                                      if(f__9275.cljs$lang$arity$17) {
                                        return f__9275.cljs$lang$arity$17(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291, o__9293, p__9295, q__9297)
                                      }else {
                                        return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291, o__9293, p__9295, q__9297)
                                      }
                                    }else {
                                      var r__9299 = cljs.core._first.call(null, args__9298);
                                      var args__9300 = cljs.core._rest.call(null, args__9298);
                                      if(argc === 18) {
                                        if(f__9275.cljs$lang$arity$18) {
                                          return f__9275.cljs$lang$arity$18(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291, o__9293, p__9295, q__9297, r__9299)
                                        }else {
                                          return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291, o__9293, p__9295, q__9297, r__9299)
                                        }
                                      }else {
                                        var s__9301 = cljs.core._first.call(null, args__9300);
                                        var args__9302 = cljs.core._rest.call(null, args__9300);
                                        if(argc === 19) {
                                          if(f__9275.cljs$lang$arity$19) {
                                            return f__9275.cljs$lang$arity$19(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291, o__9293, p__9295, q__9297, r__9299, s__9301)
                                          }else {
                                            return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291, o__9293, p__9295, q__9297, r__9299, s__9301)
                                          }
                                        }else {
                                          var t__9303 = cljs.core._first.call(null, args__9302);
                                          var args__9304 = cljs.core._rest.call(null, args__9302);
                                          if(argc === 20) {
                                            if(f__9275.cljs$lang$arity$20) {
                                              return f__9275.cljs$lang$arity$20(a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291, o__9293, p__9295, q__9297, r__9299, s__9301, t__9303)
                                            }else {
                                              return f__9275.call(null, a__9265, b__9267, c__9269, d__9271, e__9273, f__9275, g__9277, h__9279, i__9281, j__9283, k__9285, l__9287, m__9289, n__9291, o__9293, p__9295, q__9297, r__9299, s__9301, t__9303)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__9319 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9320 = cljs.core.bounded_count.call(null, args, fixed_arity__9319 + 1);
      if(bc__9320 <= fixed_arity__9319) {
        return cljs.core.apply_to.call(null, f, bc__9320, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__9321 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__9322 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9323 = cljs.core.bounded_count.call(null, arglist__9321, fixed_arity__9322 + 1);
      if(bc__9323 <= fixed_arity__9322) {
        return cljs.core.apply_to.call(null, f, bc__9323, arglist__9321)
      }else {
        return f.cljs$lang$applyTo(arglist__9321)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9321))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__9324 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__9325 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9326 = cljs.core.bounded_count.call(null, arglist__9324, fixed_arity__9325 + 1);
      if(bc__9326 <= fixed_arity__9325) {
        return cljs.core.apply_to.call(null, f, bc__9326, arglist__9324)
      }else {
        return f.cljs$lang$applyTo(arglist__9324)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9324))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__9327 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__9328 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9329 = cljs.core.bounded_count.call(null, arglist__9327, fixed_arity__9328 + 1);
      if(bc__9329 <= fixed_arity__9328) {
        return cljs.core.apply_to.call(null, f, bc__9329, arglist__9327)
      }else {
        return f.cljs$lang$applyTo(arglist__9327)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9327))
    }
  };
  var apply__6 = function() {
    var G__9333__delegate = function(f, a, b, c, d, args) {
      var arglist__9330 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__9331 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__9332 = cljs.core.bounded_count.call(null, arglist__9330, fixed_arity__9331 + 1);
        if(bc__9332 <= fixed_arity__9331) {
          return cljs.core.apply_to.call(null, f, bc__9332, arglist__9330)
        }else {
          return f.cljs$lang$applyTo(arglist__9330)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__9330))
      }
    };
    var G__9333 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9333__delegate.call(this, f, a, b, c, d, args)
    };
    G__9333.cljs$lang$maxFixedArity = 5;
    G__9333.cljs$lang$applyTo = function(arglist__9334) {
      var f = cljs.core.first(arglist__9334);
      var a = cljs.core.first(cljs.core.next(arglist__9334));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9334)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9334))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9334)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9334)))));
      return G__9333__delegate(f, a, b, c, d, args)
    };
    G__9333.cljs$lang$arity$variadic = G__9333__delegate;
    return G__9333
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__9335) {
    var obj = cljs.core.first(arglist__9335);
    var f = cljs.core.first(cljs.core.next(arglist__9335));
    var args = cljs.core.rest(cljs.core.next(arglist__9335));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__9336__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__9336 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9336__delegate.call(this, x, y, more)
    };
    G__9336.cljs$lang$maxFixedArity = 2;
    G__9336.cljs$lang$applyTo = function(arglist__9337) {
      var x = cljs.core.first(arglist__9337);
      var y = cljs.core.first(cljs.core.next(arglist__9337));
      var more = cljs.core.rest(cljs.core.next(arglist__9337));
      return G__9336__delegate(x, y, more)
    };
    G__9336.cljs$lang$arity$variadic = G__9336__delegate;
    return G__9336
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__9338 = pred;
        var G__9339 = cljs.core.next.call(null, coll);
        pred = G__9338;
        coll = G__9339;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____9341 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____9341)) {
        return or__3824__auto____9341
      }else {
        var G__9342 = pred;
        var G__9343 = cljs.core.next.call(null, coll);
        pred = G__9342;
        coll = G__9343;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__9344 = null;
    var G__9344__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__9344__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__9344__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__9344__3 = function() {
      var G__9345__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__9345 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__9345__delegate.call(this, x, y, zs)
      };
      G__9345.cljs$lang$maxFixedArity = 2;
      G__9345.cljs$lang$applyTo = function(arglist__9346) {
        var x = cljs.core.first(arglist__9346);
        var y = cljs.core.first(cljs.core.next(arglist__9346));
        var zs = cljs.core.rest(cljs.core.next(arglist__9346));
        return G__9345__delegate(x, y, zs)
      };
      G__9345.cljs$lang$arity$variadic = G__9345__delegate;
      return G__9345
    }();
    G__9344 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__9344__0.call(this);
        case 1:
          return G__9344__1.call(this, x);
        case 2:
          return G__9344__2.call(this, x, y);
        default:
          return G__9344__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__9344.cljs$lang$maxFixedArity = 2;
    G__9344.cljs$lang$applyTo = G__9344__3.cljs$lang$applyTo;
    return G__9344
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__9347__delegate = function(args) {
      return x
    };
    var G__9347 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9347__delegate.call(this, args)
    };
    G__9347.cljs$lang$maxFixedArity = 0;
    G__9347.cljs$lang$applyTo = function(arglist__9348) {
      var args = cljs.core.seq(arglist__9348);
      return G__9347__delegate(args)
    };
    G__9347.cljs$lang$arity$variadic = G__9347__delegate;
    return G__9347
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__9355 = null;
      var G__9355__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__9355__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__9355__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__9355__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__9355__4 = function() {
        var G__9356__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9356 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9356__delegate.call(this, x, y, z, args)
        };
        G__9356.cljs$lang$maxFixedArity = 3;
        G__9356.cljs$lang$applyTo = function(arglist__9357) {
          var x = cljs.core.first(arglist__9357);
          var y = cljs.core.first(cljs.core.next(arglist__9357));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9357)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9357)));
          return G__9356__delegate(x, y, z, args)
        };
        G__9356.cljs$lang$arity$variadic = G__9356__delegate;
        return G__9356
      }();
      G__9355 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9355__0.call(this);
          case 1:
            return G__9355__1.call(this, x);
          case 2:
            return G__9355__2.call(this, x, y);
          case 3:
            return G__9355__3.call(this, x, y, z);
          default:
            return G__9355__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9355.cljs$lang$maxFixedArity = 3;
      G__9355.cljs$lang$applyTo = G__9355__4.cljs$lang$applyTo;
      return G__9355
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__9358 = null;
      var G__9358__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__9358__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__9358__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__9358__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__9358__4 = function() {
        var G__9359__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__9359 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9359__delegate.call(this, x, y, z, args)
        };
        G__9359.cljs$lang$maxFixedArity = 3;
        G__9359.cljs$lang$applyTo = function(arglist__9360) {
          var x = cljs.core.first(arglist__9360);
          var y = cljs.core.first(cljs.core.next(arglist__9360));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9360)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9360)));
          return G__9359__delegate(x, y, z, args)
        };
        G__9359.cljs$lang$arity$variadic = G__9359__delegate;
        return G__9359
      }();
      G__9358 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9358__0.call(this);
          case 1:
            return G__9358__1.call(this, x);
          case 2:
            return G__9358__2.call(this, x, y);
          case 3:
            return G__9358__3.call(this, x, y, z);
          default:
            return G__9358__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9358.cljs$lang$maxFixedArity = 3;
      G__9358.cljs$lang$applyTo = G__9358__4.cljs$lang$applyTo;
      return G__9358
    }()
  };
  var comp__4 = function() {
    var G__9361__delegate = function(f1, f2, f3, fs) {
      var fs__9352 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__9362__delegate = function(args) {
          var ret__9353 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__9352), args);
          var fs__9354 = cljs.core.next.call(null, fs__9352);
          while(true) {
            if(fs__9354) {
              var G__9363 = cljs.core.first.call(null, fs__9354).call(null, ret__9353);
              var G__9364 = cljs.core.next.call(null, fs__9354);
              ret__9353 = G__9363;
              fs__9354 = G__9364;
              continue
            }else {
              return ret__9353
            }
            break
          }
        };
        var G__9362 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__9362__delegate.call(this, args)
        };
        G__9362.cljs$lang$maxFixedArity = 0;
        G__9362.cljs$lang$applyTo = function(arglist__9365) {
          var args = cljs.core.seq(arglist__9365);
          return G__9362__delegate(args)
        };
        G__9362.cljs$lang$arity$variadic = G__9362__delegate;
        return G__9362
      }()
    };
    var G__9361 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9361__delegate.call(this, f1, f2, f3, fs)
    };
    G__9361.cljs$lang$maxFixedArity = 3;
    G__9361.cljs$lang$applyTo = function(arglist__9366) {
      var f1 = cljs.core.first(arglist__9366);
      var f2 = cljs.core.first(cljs.core.next(arglist__9366));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9366)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9366)));
      return G__9361__delegate(f1, f2, f3, fs)
    };
    G__9361.cljs$lang$arity$variadic = G__9361__delegate;
    return G__9361
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__9367__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__9367 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9367__delegate.call(this, args)
      };
      G__9367.cljs$lang$maxFixedArity = 0;
      G__9367.cljs$lang$applyTo = function(arglist__9368) {
        var args = cljs.core.seq(arglist__9368);
        return G__9367__delegate(args)
      };
      G__9367.cljs$lang$arity$variadic = G__9367__delegate;
      return G__9367
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__9369__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__9369 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9369__delegate.call(this, args)
      };
      G__9369.cljs$lang$maxFixedArity = 0;
      G__9369.cljs$lang$applyTo = function(arglist__9370) {
        var args = cljs.core.seq(arglist__9370);
        return G__9369__delegate(args)
      };
      G__9369.cljs$lang$arity$variadic = G__9369__delegate;
      return G__9369
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__9371__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__9371 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9371__delegate.call(this, args)
      };
      G__9371.cljs$lang$maxFixedArity = 0;
      G__9371.cljs$lang$applyTo = function(arglist__9372) {
        var args = cljs.core.seq(arglist__9372);
        return G__9371__delegate(args)
      };
      G__9371.cljs$lang$arity$variadic = G__9371__delegate;
      return G__9371
    }()
  };
  var partial__5 = function() {
    var G__9373__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__9374__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__9374 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__9374__delegate.call(this, args)
        };
        G__9374.cljs$lang$maxFixedArity = 0;
        G__9374.cljs$lang$applyTo = function(arglist__9375) {
          var args = cljs.core.seq(arglist__9375);
          return G__9374__delegate(args)
        };
        G__9374.cljs$lang$arity$variadic = G__9374__delegate;
        return G__9374
      }()
    };
    var G__9373 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9373__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__9373.cljs$lang$maxFixedArity = 4;
    G__9373.cljs$lang$applyTo = function(arglist__9376) {
      var f = cljs.core.first(arglist__9376);
      var arg1 = cljs.core.first(cljs.core.next(arglist__9376));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9376)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9376))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9376))));
      return G__9373__delegate(f, arg1, arg2, arg3, more)
    };
    G__9373.cljs$lang$arity$variadic = G__9373__delegate;
    return G__9373
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__9377 = null;
      var G__9377__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__9377__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__9377__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__9377__4 = function() {
        var G__9378__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__9378 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9378__delegate.call(this, a, b, c, ds)
        };
        G__9378.cljs$lang$maxFixedArity = 3;
        G__9378.cljs$lang$applyTo = function(arglist__9379) {
          var a = cljs.core.first(arglist__9379);
          var b = cljs.core.first(cljs.core.next(arglist__9379));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9379)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9379)));
          return G__9378__delegate(a, b, c, ds)
        };
        G__9378.cljs$lang$arity$variadic = G__9378__delegate;
        return G__9378
      }();
      G__9377 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__9377__1.call(this, a);
          case 2:
            return G__9377__2.call(this, a, b);
          case 3:
            return G__9377__3.call(this, a, b, c);
          default:
            return G__9377__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9377.cljs$lang$maxFixedArity = 3;
      G__9377.cljs$lang$applyTo = G__9377__4.cljs$lang$applyTo;
      return G__9377
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__9380 = null;
      var G__9380__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__9380__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__9380__4 = function() {
        var G__9381__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__9381 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9381__delegate.call(this, a, b, c, ds)
        };
        G__9381.cljs$lang$maxFixedArity = 3;
        G__9381.cljs$lang$applyTo = function(arglist__9382) {
          var a = cljs.core.first(arglist__9382);
          var b = cljs.core.first(cljs.core.next(arglist__9382));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9382)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9382)));
          return G__9381__delegate(a, b, c, ds)
        };
        G__9381.cljs$lang$arity$variadic = G__9381__delegate;
        return G__9381
      }();
      G__9380 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__9380__2.call(this, a, b);
          case 3:
            return G__9380__3.call(this, a, b, c);
          default:
            return G__9380__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9380.cljs$lang$maxFixedArity = 3;
      G__9380.cljs$lang$applyTo = G__9380__4.cljs$lang$applyTo;
      return G__9380
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__9383 = null;
      var G__9383__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__9383__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__9383__4 = function() {
        var G__9384__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__9384 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9384__delegate.call(this, a, b, c, ds)
        };
        G__9384.cljs$lang$maxFixedArity = 3;
        G__9384.cljs$lang$applyTo = function(arglist__9385) {
          var a = cljs.core.first(arglist__9385);
          var b = cljs.core.first(cljs.core.next(arglist__9385));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9385)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9385)));
          return G__9384__delegate(a, b, c, ds)
        };
        G__9384.cljs$lang$arity$variadic = G__9384__delegate;
        return G__9384
      }();
      G__9383 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__9383__2.call(this, a, b);
          case 3:
            return G__9383__3.call(this, a, b, c);
          default:
            return G__9383__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9383.cljs$lang$maxFixedArity = 3;
      G__9383.cljs$lang$applyTo = G__9383__4.cljs$lang$applyTo;
      return G__9383
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__9401 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9409 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9409) {
        var s__9410 = temp__3974__auto____9409;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__9410)) {
          var c__9411 = cljs.core.chunk_first.call(null, s__9410);
          var size__9412 = cljs.core.count.call(null, c__9411);
          var b__9413 = cljs.core.chunk_buffer.call(null, size__9412);
          var n__2527__auto____9414 = size__9412;
          var i__9415 = 0;
          while(true) {
            if(i__9415 < n__2527__auto____9414) {
              cljs.core.chunk_append.call(null, b__9413, f.call(null, idx + i__9415, cljs.core._nth.call(null, c__9411, i__9415)));
              var G__9416 = i__9415 + 1;
              i__9415 = G__9416;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__9413), mapi.call(null, idx + size__9412, cljs.core.chunk_rest.call(null, s__9410)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__9410)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__9410)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__9401.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9426 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9426) {
      var s__9427 = temp__3974__auto____9426;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__9427)) {
        var c__9428 = cljs.core.chunk_first.call(null, s__9427);
        var size__9429 = cljs.core.count.call(null, c__9428);
        var b__9430 = cljs.core.chunk_buffer.call(null, size__9429);
        var n__2527__auto____9431 = size__9429;
        var i__9432 = 0;
        while(true) {
          if(i__9432 < n__2527__auto____9431) {
            var x__9433 = f.call(null, cljs.core._nth.call(null, c__9428, i__9432));
            if(x__9433 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__9430, x__9433)
            }
            var G__9435 = i__9432 + 1;
            i__9432 = G__9435;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__9430), keep.call(null, f, cljs.core.chunk_rest.call(null, s__9427)))
      }else {
        var x__9434 = f.call(null, cljs.core.first.call(null, s__9427));
        if(x__9434 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__9427))
        }else {
          return cljs.core.cons.call(null, x__9434, keep.call(null, f, cljs.core.rest.call(null, s__9427)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__9461 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9471 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9471) {
        var s__9472 = temp__3974__auto____9471;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__9472)) {
          var c__9473 = cljs.core.chunk_first.call(null, s__9472);
          var size__9474 = cljs.core.count.call(null, c__9473);
          var b__9475 = cljs.core.chunk_buffer.call(null, size__9474);
          var n__2527__auto____9476 = size__9474;
          var i__9477 = 0;
          while(true) {
            if(i__9477 < n__2527__auto____9476) {
              var x__9478 = f.call(null, idx + i__9477, cljs.core._nth.call(null, c__9473, i__9477));
              if(x__9478 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__9475, x__9478)
              }
              var G__9480 = i__9477 + 1;
              i__9477 = G__9480;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__9475), keepi.call(null, idx + size__9474, cljs.core.chunk_rest.call(null, s__9472)))
        }else {
          var x__9479 = f.call(null, idx, cljs.core.first.call(null, s__9472));
          if(x__9479 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__9472))
          }else {
            return cljs.core.cons.call(null, x__9479, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__9472)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__9461.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9566 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9566)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____9566
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9567 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9567)) {
            var and__3822__auto____9568 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____9568)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____9568
            }
          }else {
            return and__3822__auto____9567
          }
        }())
      };
      var ep1__4 = function() {
        var G__9637__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____9569 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____9569)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____9569
            }
          }())
        };
        var G__9637 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9637__delegate.call(this, x, y, z, args)
        };
        G__9637.cljs$lang$maxFixedArity = 3;
        G__9637.cljs$lang$applyTo = function(arglist__9638) {
          var x = cljs.core.first(arglist__9638);
          var y = cljs.core.first(cljs.core.next(arglist__9638));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9638)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9638)));
          return G__9637__delegate(x, y, z, args)
        };
        G__9637.cljs$lang$arity$variadic = G__9637__delegate;
        return G__9637
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9581 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9581)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____9581
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9582 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9582)) {
            var and__3822__auto____9583 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____9583)) {
              var and__3822__auto____9584 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____9584)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____9584
              }
            }else {
              return and__3822__auto____9583
            }
          }else {
            return and__3822__auto____9582
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9585 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9585)) {
            var and__3822__auto____9586 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____9586)) {
              var and__3822__auto____9587 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____9587)) {
                var and__3822__auto____9588 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____9588)) {
                  var and__3822__auto____9589 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____9589)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____9589
                  }
                }else {
                  return and__3822__auto____9588
                }
              }else {
                return and__3822__auto____9587
              }
            }else {
              return and__3822__auto____9586
            }
          }else {
            return and__3822__auto____9585
          }
        }())
      };
      var ep2__4 = function() {
        var G__9639__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____9590 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____9590)) {
              return cljs.core.every_QMARK_.call(null, function(p1__9436_SHARP_) {
                var and__3822__auto____9591 = p1.call(null, p1__9436_SHARP_);
                if(cljs.core.truth_(and__3822__auto____9591)) {
                  return p2.call(null, p1__9436_SHARP_)
                }else {
                  return and__3822__auto____9591
                }
              }, args)
            }else {
              return and__3822__auto____9590
            }
          }())
        };
        var G__9639 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9639__delegate.call(this, x, y, z, args)
        };
        G__9639.cljs$lang$maxFixedArity = 3;
        G__9639.cljs$lang$applyTo = function(arglist__9640) {
          var x = cljs.core.first(arglist__9640);
          var y = cljs.core.first(cljs.core.next(arglist__9640));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9640)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9640)));
          return G__9639__delegate(x, y, z, args)
        };
        G__9639.cljs$lang$arity$variadic = G__9639__delegate;
        return G__9639
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9610 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9610)) {
            var and__3822__auto____9611 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9611)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____9611
            }
          }else {
            return and__3822__auto____9610
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9612 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9612)) {
            var and__3822__auto____9613 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9613)) {
              var and__3822__auto____9614 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____9614)) {
                var and__3822__auto____9615 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____9615)) {
                  var and__3822__auto____9616 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____9616)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____9616
                  }
                }else {
                  return and__3822__auto____9615
                }
              }else {
                return and__3822__auto____9614
              }
            }else {
              return and__3822__auto____9613
            }
          }else {
            return and__3822__auto____9612
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9617 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9617)) {
            var and__3822__auto____9618 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9618)) {
              var and__3822__auto____9619 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____9619)) {
                var and__3822__auto____9620 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____9620)) {
                  var and__3822__auto____9621 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____9621)) {
                    var and__3822__auto____9622 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____9622)) {
                      var and__3822__auto____9623 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____9623)) {
                        var and__3822__auto____9624 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____9624)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____9624
                        }
                      }else {
                        return and__3822__auto____9623
                      }
                    }else {
                      return and__3822__auto____9622
                    }
                  }else {
                    return and__3822__auto____9621
                  }
                }else {
                  return and__3822__auto____9620
                }
              }else {
                return and__3822__auto____9619
              }
            }else {
              return and__3822__auto____9618
            }
          }else {
            return and__3822__auto____9617
          }
        }())
      };
      var ep3__4 = function() {
        var G__9641__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____9625 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____9625)) {
              return cljs.core.every_QMARK_.call(null, function(p1__9437_SHARP_) {
                var and__3822__auto____9626 = p1.call(null, p1__9437_SHARP_);
                if(cljs.core.truth_(and__3822__auto____9626)) {
                  var and__3822__auto____9627 = p2.call(null, p1__9437_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____9627)) {
                    return p3.call(null, p1__9437_SHARP_)
                  }else {
                    return and__3822__auto____9627
                  }
                }else {
                  return and__3822__auto____9626
                }
              }, args)
            }else {
              return and__3822__auto____9625
            }
          }())
        };
        var G__9641 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9641__delegate.call(this, x, y, z, args)
        };
        G__9641.cljs$lang$maxFixedArity = 3;
        G__9641.cljs$lang$applyTo = function(arglist__9642) {
          var x = cljs.core.first(arglist__9642);
          var y = cljs.core.first(cljs.core.next(arglist__9642));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9642)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9642)));
          return G__9641__delegate(x, y, z, args)
        };
        G__9641.cljs$lang$arity$variadic = G__9641__delegate;
        return G__9641
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__9643__delegate = function(p1, p2, p3, ps) {
      var ps__9628 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__9438_SHARP_) {
            return p1__9438_SHARP_.call(null, x)
          }, ps__9628)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__9439_SHARP_) {
            var and__3822__auto____9633 = p1__9439_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9633)) {
              return p1__9439_SHARP_.call(null, y)
            }else {
              return and__3822__auto____9633
            }
          }, ps__9628)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__9440_SHARP_) {
            var and__3822__auto____9634 = p1__9440_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9634)) {
              var and__3822__auto____9635 = p1__9440_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____9635)) {
                return p1__9440_SHARP_.call(null, z)
              }else {
                return and__3822__auto____9635
              }
            }else {
              return and__3822__auto____9634
            }
          }, ps__9628)
        };
        var epn__4 = function() {
          var G__9644__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____9636 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____9636)) {
                return cljs.core.every_QMARK_.call(null, function(p1__9441_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__9441_SHARP_, args)
                }, ps__9628)
              }else {
                return and__3822__auto____9636
              }
            }())
          };
          var G__9644 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9644__delegate.call(this, x, y, z, args)
          };
          G__9644.cljs$lang$maxFixedArity = 3;
          G__9644.cljs$lang$applyTo = function(arglist__9645) {
            var x = cljs.core.first(arglist__9645);
            var y = cljs.core.first(cljs.core.next(arglist__9645));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9645)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9645)));
            return G__9644__delegate(x, y, z, args)
          };
          G__9644.cljs$lang$arity$variadic = G__9644__delegate;
          return G__9644
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__9643 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9643__delegate.call(this, p1, p2, p3, ps)
    };
    G__9643.cljs$lang$maxFixedArity = 3;
    G__9643.cljs$lang$applyTo = function(arglist__9646) {
      var p1 = cljs.core.first(arglist__9646);
      var p2 = cljs.core.first(cljs.core.next(arglist__9646));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9646)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9646)));
      return G__9643__delegate(p1, p2, p3, ps)
    };
    G__9643.cljs$lang$arity$variadic = G__9643__delegate;
    return G__9643
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____9727 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9727)) {
          return or__3824__auto____9727
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____9728 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9728)) {
          return or__3824__auto____9728
        }else {
          var or__3824__auto____9729 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9729)) {
            return or__3824__auto____9729
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__9798__delegate = function(x, y, z, args) {
          var or__3824__auto____9730 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9730)) {
            return or__3824__auto____9730
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__9798 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9798__delegate.call(this, x, y, z, args)
        };
        G__9798.cljs$lang$maxFixedArity = 3;
        G__9798.cljs$lang$applyTo = function(arglist__9799) {
          var x = cljs.core.first(arglist__9799);
          var y = cljs.core.first(cljs.core.next(arglist__9799));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9799)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9799)));
          return G__9798__delegate(x, y, z, args)
        };
        G__9798.cljs$lang$arity$variadic = G__9798__delegate;
        return G__9798
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____9742 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9742)) {
          return or__3824__auto____9742
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____9743 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9743)) {
          return or__3824__auto____9743
        }else {
          var or__3824__auto____9744 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9744)) {
            return or__3824__auto____9744
          }else {
            var or__3824__auto____9745 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9745)) {
              return or__3824__auto____9745
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____9746 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9746)) {
          return or__3824__auto____9746
        }else {
          var or__3824__auto____9747 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9747)) {
            return or__3824__auto____9747
          }else {
            var or__3824__auto____9748 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____9748)) {
              return or__3824__auto____9748
            }else {
              var or__3824__auto____9749 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____9749)) {
                return or__3824__auto____9749
              }else {
                var or__3824__auto____9750 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9750)) {
                  return or__3824__auto____9750
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__9800__delegate = function(x, y, z, args) {
          var or__3824__auto____9751 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9751)) {
            return or__3824__auto____9751
          }else {
            return cljs.core.some.call(null, function(p1__9481_SHARP_) {
              var or__3824__auto____9752 = p1.call(null, p1__9481_SHARP_);
              if(cljs.core.truth_(or__3824__auto____9752)) {
                return or__3824__auto____9752
              }else {
                return p2.call(null, p1__9481_SHARP_)
              }
            }, args)
          }
        };
        var G__9800 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9800__delegate.call(this, x, y, z, args)
        };
        G__9800.cljs$lang$maxFixedArity = 3;
        G__9800.cljs$lang$applyTo = function(arglist__9801) {
          var x = cljs.core.first(arglist__9801);
          var y = cljs.core.first(cljs.core.next(arglist__9801));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9801)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9801)));
          return G__9800__delegate(x, y, z, args)
        };
        G__9800.cljs$lang$arity$variadic = G__9800__delegate;
        return G__9800
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____9771 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9771)) {
          return or__3824__auto____9771
        }else {
          var or__3824__auto____9772 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9772)) {
            return or__3824__auto____9772
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____9773 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9773)) {
          return or__3824__auto____9773
        }else {
          var or__3824__auto____9774 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9774)) {
            return or__3824__auto____9774
          }else {
            var or__3824__auto____9775 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9775)) {
              return or__3824__auto____9775
            }else {
              var or__3824__auto____9776 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9776)) {
                return or__3824__auto____9776
              }else {
                var or__3824__auto____9777 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9777)) {
                  return or__3824__auto____9777
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____9778 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9778)) {
          return or__3824__auto____9778
        }else {
          var or__3824__auto____9779 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9779)) {
            return or__3824__auto____9779
          }else {
            var or__3824__auto____9780 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9780)) {
              return or__3824__auto____9780
            }else {
              var or__3824__auto____9781 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9781)) {
                return or__3824__auto____9781
              }else {
                var or__3824__auto____9782 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9782)) {
                  return or__3824__auto____9782
                }else {
                  var or__3824__auto____9783 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____9783)) {
                    return or__3824__auto____9783
                  }else {
                    var or__3824__auto____9784 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____9784)) {
                      return or__3824__auto____9784
                    }else {
                      var or__3824__auto____9785 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____9785)) {
                        return or__3824__auto____9785
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__9802__delegate = function(x, y, z, args) {
          var or__3824__auto____9786 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9786)) {
            return or__3824__auto____9786
          }else {
            return cljs.core.some.call(null, function(p1__9482_SHARP_) {
              var or__3824__auto____9787 = p1.call(null, p1__9482_SHARP_);
              if(cljs.core.truth_(or__3824__auto____9787)) {
                return or__3824__auto____9787
              }else {
                var or__3824__auto____9788 = p2.call(null, p1__9482_SHARP_);
                if(cljs.core.truth_(or__3824__auto____9788)) {
                  return or__3824__auto____9788
                }else {
                  return p3.call(null, p1__9482_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__9802 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9802__delegate.call(this, x, y, z, args)
        };
        G__9802.cljs$lang$maxFixedArity = 3;
        G__9802.cljs$lang$applyTo = function(arglist__9803) {
          var x = cljs.core.first(arglist__9803);
          var y = cljs.core.first(cljs.core.next(arglist__9803));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9803)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9803)));
          return G__9802__delegate(x, y, z, args)
        };
        G__9802.cljs$lang$arity$variadic = G__9802__delegate;
        return G__9802
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__9804__delegate = function(p1, p2, p3, ps) {
      var ps__9789 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__9483_SHARP_) {
            return p1__9483_SHARP_.call(null, x)
          }, ps__9789)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__9484_SHARP_) {
            var or__3824__auto____9794 = p1__9484_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9794)) {
              return or__3824__auto____9794
            }else {
              return p1__9484_SHARP_.call(null, y)
            }
          }, ps__9789)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__9485_SHARP_) {
            var or__3824__auto____9795 = p1__9485_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9795)) {
              return or__3824__auto____9795
            }else {
              var or__3824__auto____9796 = p1__9485_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9796)) {
                return or__3824__auto____9796
              }else {
                return p1__9485_SHARP_.call(null, z)
              }
            }
          }, ps__9789)
        };
        var spn__4 = function() {
          var G__9805__delegate = function(x, y, z, args) {
            var or__3824__auto____9797 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____9797)) {
              return or__3824__auto____9797
            }else {
              return cljs.core.some.call(null, function(p1__9486_SHARP_) {
                return cljs.core.some.call(null, p1__9486_SHARP_, args)
              }, ps__9789)
            }
          };
          var G__9805 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9805__delegate.call(this, x, y, z, args)
          };
          G__9805.cljs$lang$maxFixedArity = 3;
          G__9805.cljs$lang$applyTo = function(arglist__9806) {
            var x = cljs.core.first(arglist__9806);
            var y = cljs.core.first(cljs.core.next(arglist__9806));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9806)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9806)));
            return G__9805__delegate(x, y, z, args)
          };
          G__9805.cljs$lang$arity$variadic = G__9805__delegate;
          return G__9805
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__9804 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9804__delegate.call(this, p1, p2, p3, ps)
    };
    G__9804.cljs$lang$maxFixedArity = 3;
    G__9804.cljs$lang$applyTo = function(arglist__9807) {
      var p1 = cljs.core.first(arglist__9807);
      var p2 = cljs.core.first(cljs.core.next(arglist__9807));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9807)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9807)));
      return G__9804__delegate(p1, p2, p3, ps)
    };
    G__9804.cljs$lang$arity$variadic = G__9804__delegate;
    return G__9804
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9826 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9826) {
        var s__9827 = temp__3974__auto____9826;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__9827)) {
          var c__9828 = cljs.core.chunk_first.call(null, s__9827);
          var size__9829 = cljs.core.count.call(null, c__9828);
          var b__9830 = cljs.core.chunk_buffer.call(null, size__9829);
          var n__2527__auto____9831 = size__9829;
          var i__9832 = 0;
          while(true) {
            if(i__9832 < n__2527__auto____9831) {
              cljs.core.chunk_append.call(null, b__9830, f.call(null, cljs.core._nth.call(null, c__9828, i__9832)));
              var G__9844 = i__9832 + 1;
              i__9832 = G__9844;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__9830), map.call(null, f, cljs.core.chunk_rest.call(null, s__9827)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__9827)), map.call(null, f, cljs.core.rest.call(null, s__9827)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9833 = cljs.core.seq.call(null, c1);
      var s2__9834 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____9835 = s1__9833;
        if(and__3822__auto____9835) {
          return s2__9834
        }else {
          return and__3822__auto____9835
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__9833), cljs.core.first.call(null, s2__9834)), map.call(null, f, cljs.core.rest.call(null, s1__9833), cljs.core.rest.call(null, s2__9834)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9836 = cljs.core.seq.call(null, c1);
      var s2__9837 = cljs.core.seq.call(null, c2);
      var s3__9838 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____9839 = s1__9836;
        if(and__3822__auto____9839) {
          var and__3822__auto____9840 = s2__9837;
          if(and__3822__auto____9840) {
            return s3__9838
          }else {
            return and__3822__auto____9840
          }
        }else {
          return and__3822__auto____9839
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__9836), cljs.core.first.call(null, s2__9837), cljs.core.first.call(null, s3__9838)), map.call(null, f, cljs.core.rest.call(null, s1__9836), cljs.core.rest.call(null, s2__9837), cljs.core.rest.call(null, s3__9838)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__9845__delegate = function(f, c1, c2, c3, colls) {
      var step__9843 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__9842 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9842)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__9842), step.call(null, map.call(null, cljs.core.rest, ss__9842)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__9647_SHARP_) {
        return cljs.core.apply.call(null, f, p1__9647_SHARP_)
      }, step__9843.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__9845 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9845__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9845.cljs$lang$maxFixedArity = 4;
    G__9845.cljs$lang$applyTo = function(arglist__9846) {
      var f = cljs.core.first(arglist__9846);
      var c1 = cljs.core.first(cljs.core.next(arglist__9846));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9846)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9846))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9846))));
      return G__9845__delegate(f, c1, c2, c3, colls)
    };
    G__9845.cljs$lang$arity$variadic = G__9845__delegate;
    return G__9845
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____9849 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9849) {
        var s__9850 = temp__3974__auto____9849;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9850), take.call(null, n - 1, cljs.core.rest.call(null, s__9850)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__9856 = function(n, coll) {
    while(true) {
      var s__9854 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9855 = n > 0;
        if(and__3822__auto____9855) {
          return s__9854
        }else {
          return and__3822__auto____9855
        }
      }())) {
        var G__9857 = n - 1;
        var G__9858 = cljs.core.rest.call(null, s__9854);
        n = G__9857;
        coll = G__9858;
        continue
      }else {
        return s__9854
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9856.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__9861 = cljs.core.seq.call(null, coll);
  var lead__9862 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__9862) {
      var G__9863 = cljs.core.next.call(null, s__9861);
      var G__9864 = cljs.core.next.call(null, lead__9862);
      s__9861 = G__9863;
      lead__9862 = G__9864;
      continue
    }else {
      return s__9861
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__9870 = function(pred, coll) {
    while(true) {
      var s__9868 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9869 = s__9868;
        if(and__3822__auto____9869) {
          return pred.call(null, cljs.core.first.call(null, s__9868))
        }else {
          return and__3822__auto____9869
        }
      }())) {
        var G__9871 = pred;
        var G__9872 = cljs.core.rest.call(null, s__9868);
        pred = G__9871;
        coll = G__9872;
        continue
      }else {
        return s__9868
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9870.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9875 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9875) {
      var s__9876 = temp__3974__auto____9875;
      return cljs.core.concat.call(null, s__9876, cycle.call(null, s__9876))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9881 = cljs.core.seq.call(null, c1);
      var s2__9882 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____9883 = s1__9881;
        if(and__3822__auto____9883) {
          return s2__9882
        }else {
          return and__3822__auto____9883
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__9881), cljs.core.cons.call(null, cljs.core.first.call(null, s2__9882), interleave.call(null, cljs.core.rest.call(null, s1__9881), cljs.core.rest.call(null, s2__9882))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__9885__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__9884 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9884)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__9884), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__9884)))
        }else {
          return null
        }
      }, null)
    };
    var G__9885 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9885__delegate.call(this, c1, c2, colls)
    };
    G__9885.cljs$lang$maxFixedArity = 2;
    G__9885.cljs$lang$applyTo = function(arglist__9886) {
      var c1 = cljs.core.first(arglist__9886);
      var c2 = cljs.core.first(cljs.core.next(arglist__9886));
      var colls = cljs.core.rest(cljs.core.next(arglist__9886));
      return G__9885__delegate(c1, c2, colls)
    };
    G__9885.cljs$lang$arity$variadic = G__9885__delegate;
    return G__9885
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__9896 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9894 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9894) {
        var coll__9895 = temp__3971__auto____9894;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__9895), cat.call(null, cljs.core.rest.call(null, coll__9895), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__9896.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__9897__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__9897 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9897__delegate.call(this, f, coll, colls)
    };
    G__9897.cljs$lang$maxFixedArity = 2;
    G__9897.cljs$lang$applyTo = function(arglist__9898) {
      var f = cljs.core.first(arglist__9898);
      var coll = cljs.core.first(cljs.core.next(arglist__9898));
      var colls = cljs.core.rest(cljs.core.next(arglist__9898));
      return G__9897__delegate(f, coll, colls)
    };
    G__9897.cljs$lang$arity$variadic = G__9897__delegate;
    return G__9897
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9908 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9908) {
      var s__9909 = temp__3974__auto____9908;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__9909)) {
        var c__9910 = cljs.core.chunk_first.call(null, s__9909);
        var size__9911 = cljs.core.count.call(null, c__9910);
        var b__9912 = cljs.core.chunk_buffer.call(null, size__9911);
        var n__2527__auto____9913 = size__9911;
        var i__9914 = 0;
        while(true) {
          if(i__9914 < n__2527__auto____9913) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__9910, i__9914)))) {
              cljs.core.chunk_append.call(null, b__9912, cljs.core._nth.call(null, c__9910, i__9914))
            }else {
            }
            var G__9917 = i__9914 + 1;
            i__9914 = G__9917;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__9912), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__9909)))
      }else {
        var f__9915 = cljs.core.first.call(null, s__9909);
        var r__9916 = cljs.core.rest.call(null, s__9909);
        if(cljs.core.truth_(pred.call(null, f__9915))) {
          return cljs.core.cons.call(null, f__9915, filter.call(null, pred, r__9916))
        }else {
          return filter.call(null, pred, r__9916)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__9920 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__9920.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__9918_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__9918_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__9924__9925 = to;
    if(G__9924__9925) {
      if(function() {
        var or__3824__auto____9926 = G__9924__9925.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____9926) {
          return or__3824__auto____9926
        }else {
          return G__9924__9925.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__9924__9925.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9924__9925)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9924__9925)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__9927__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__9927 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9927__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9927.cljs$lang$maxFixedArity = 4;
    G__9927.cljs$lang$applyTo = function(arglist__9928) {
      var f = cljs.core.first(arglist__9928);
      var c1 = cljs.core.first(cljs.core.next(arglist__9928));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9928)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9928))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9928))));
      return G__9927__delegate(f, c1, c2, c3, colls)
    };
    G__9927.cljs$lang$arity$variadic = G__9927__delegate;
    return G__9927
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9935 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9935) {
        var s__9936 = temp__3974__auto____9935;
        var p__9937 = cljs.core.take.call(null, n, s__9936);
        if(n === cljs.core.count.call(null, p__9937)) {
          return cljs.core.cons.call(null, p__9937, partition.call(null, n, step, cljs.core.drop.call(null, step, s__9936)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9938 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9938) {
        var s__9939 = temp__3974__auto____9938;
        var p__9940 = cljs.core.take.call(null, n, s__9939);
        if(n === cljs.core.count.call(null, p__9940)) {
          return cljs.core.cons.call(null, p__9940, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__9939)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__9940, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__9945 = cljs.core.lookup_sentinel;
    var m__9946 = m;
    var ks__9947 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__9947) {
        var m__9948 = cljs.core._lookup.call(null, m__9946, cljs.core.first.call(null, ks__9947), sentinel__9945);
        if(sentinel__9945 === m__9948) {
          return not_found
        }else {
          var G__9949 = sentinel__9945;
          var G__9950 = m__9948;
          var G__9951 = cljs.core.next.call(null, ks__9947);
          sentinel__9945 = G__9949;
          m__9946 = G__9950;
          ks__9947 = G__9951;
          continue
        }
      }else {
        return m__9946
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__9952, v) {
  var vec__9957__9958 = p__9952;
  var k__9959 = cljs.core.nth.call(null, vec__9957__9958, 0, null);
  var ks__9960 = cljs.core.nthnext.call(null, vec__9957__9958, 1);
  if(cljs.core.truth_(ks__9960)) {
    return cljs.core.assoc.call(null, m, k__9959, assoc_in.call(null, cljs.core._lookup.call(null, m, k__9959, null), ks__9960, v))
  }else {
    return cljs.core.assoc.call(null, m, k__9959, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__9961, f, args) {
    var vec__9966__9967 = p__9961;
    var k__9968 = cljs.core.nth.call(null, vec__9966__9967, 0, null);
    var ks__9969 = cljs.core.nthnext.call(null, vec__9966__9967, 1);
    if(cljs.core.truth_(ks__9969)) {
      return cljs.core.assoc.call(null, m, k__9968, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__9968, null), ks__9969, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__9968, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__9968, null), args))
    }
  };
  var update_in = function(m, p__9961, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__9961, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__9970) {
    var m = cljs.core.first(arglist__9970);
    var p__9961 = cljs.core.first(cljs.core.next(arglist__9970));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9970)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9970)));
    return update_in__delegate(m, p__9961, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9973 = this;
  var h__2192__auto____9974 = this__9973.__hash;
  if(!(h__2192__auto____9974 == null)) {
    return h__2192__auto____9974
  }else {
    var h__2192__auto____9975 = cljs.core.hash_coll.call(null, coll);
    this__9973.__hash = h__2192__auto____9975;
    return h__2192__auto____9975
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9976 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9977 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9978 = this;
  var new_array__9979 = this__9978.array.slice();
  new_array__9979[k] = v;
  return new cljs.core.Vector(this__9978.meta, new_array__9979, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__10010 = null;
  var G__10010__2 = function(this_sym9980, k) {
    var this__9982 = this;
    var this_sym9980__9983 = this;
    var coll__9984 = this_sym9980__9983;
    return coll__9984.cljs$core$ILookup$_lookup$arity$2(coll__9984, k)
  };
  var G__10010__3 = function(this_sym9981, k, not_found) {
    var this__9982 = this;
    var this_sym9981__9985 = this;
    var coll__9986 = this_sym9981__9985;
    return coll__9986.cljs$core$ILookup$_lookup$arity$3(coll__9986, k, not_found)
  };
  G__10010 = function(this_sym9981, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10010__2.call(this, this_sym9981, k);
      case 3:
        return G__10010__3.call(this, this_sym9981, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10010
}();
cljs.core.Vector.prototype.apply = function(this_sym9971, args9972) {
  var this__9987 = this;
  return this_sym9971.call.apply(this_sym9971, [this_sym9971].concat(args9972.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9988 = this;
  var new_array__9989 = this__9988.array.slice();
  new_array__9989.push(o);
  return new cljs.core.Vector(this__9988.meta, new_array__9989, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__9990 = this;
  var this__9991 = this;
  return cljs.core.pr_str.call(null, this__9991)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__9992 = this;
  return cljs.core.ci_reduce.call(null, this__9992.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__9993 = this;
  return cljs.core.ci_reduce.call(null, this__9993.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9994 = this;
  if(this__9994.array.length > 0) {
    var vector_seq__9995 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__9994.array.length) {
          return cljs.core.cons.call(null, this__9994.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__9995.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9996 = this;
  return this__9996.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9997 = this;
  var count__9998 = this__9997.array.length;
  if(count__9998 > 0) {
    return this__9997.array[count__9998 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9999 = this;
  if(this__9999.array.length > 0) {
    var new_array__10000 = this__9999.array.slice();
    new_array__10000.pop();
    return new cljs.core.Vector(this__9999.meta, new_array__10000, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__10001 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10002 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10003 = this;
  return new cljs.core.Vector(meta, this__10003.array, this__10003.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10004 = this;
  return this__10004.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10005 = this;
  if(function() {
    var and__3822__auto____10006 = 0 <= n;
    if(and__3822__auto____10006) {
      return n < this__10005.array.length
    }else {
      return and__3822__auto____10006
    }
  }()) {
    return this__10005.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10007 = this;
  if(function() {
    var and__3822__auto____10008 = 0 <= n;
    if(and__3822__auto____10008) {
      return n < this__10007.array.length
    }else {
      return and__3822__auto____10008
    }
  }()) {
    return this__10007.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10009 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__10009.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__10012 = pv.cnt;
  if(cnt__10012 < 32) {
    return 0
  }else {
    return cnt__10012 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__10018 = level;
  var ret__10019 = node;
  while(true) {
    if(ll__10018 === 0) {
      return ret__10019
    }else {
      var embed__10020 = ret__10019;
      var r__10021 = cljs.core.pv_fresh_node.call(null, edit);
      var ___10022 = cljs.core.pv_aset.call(null, r__10021, 0, embed__10020);
      var G__10023 = ll__10018 - 5;
      var G__10024 = r__10021;
      ll__10018 = G__10023;
      ret__10019 = G__10024;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__10030 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__10031 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__10030, subidx__10031, tailnode);
    return ret__10030
  }else {
    var child__10032 = cljs.core.pv_aget.call(null, parent, subidx__10031);
    if(!(child__10032 == null)) {
      var node_to_insert__10033 = push_tail.call(null, pv, level - 5, child__10032, tailnode);
      cljs.core.pv_aset.call(null, ret__10030, subidx__10031, node_to_insert__10033);
      return ret__10030
    }else {
      var node_to_insert__10034 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__10030, subidx__10031, node_to_insert__10034);
      return ret__10030
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____10038 = 0 <= i;
    if(and__3822__auto____10038) {
      return i < pv.cnt
    }else {
      return and__3822__auto____10038
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__10039 = pv.root;
      var level__10040 = pv.shift;
      while(true) {
        if(level__10040 > 0) {
          var G__10041 = cljs.core.pv_aget.call(null, node__10039, i >>> level__10040 & 31);
          var G__10042 = level__10040 - 5;
          node__10039 = G__10041;
          level__10040 = G__10042;
          continue
        }else {
          return node__10039.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__10045 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__10045, i & 31, val);
    return ret__10045
  }else {
    var subidx__10046 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__10045, subidx__10046, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__10046), i, val));
    return ret__10045
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__10052 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__10053 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__10052));
    if(function() {
      var and__3822__auto____10054 = new_child__10053 == null;
      if(and__3822__auto____10054) {
        return subidx__10052 === 0
      }else {
        return and__3822__auto____10054
      }
    }()) {
      return null
    }else {
      var ret__10055 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__10055, subidx__10052, new_child__10053);
      return ret__10055
    }
  }else {
    if(subidx__10052 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__10056 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__10056, subidx__10052, null);
        return ret__10056
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__10059 = this;
  return new cljs.core.TransientVector(this__10059.cnt, this__10059.shift, cljs.core.tv_editable_root.call(null, this__10059.root), cljs.core.tv_editable_tail.call(null, this__10059.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10060 = this;
  var h__2192__auto____10061 = this__10060.__hash;
  if(!(h__2192__auto____10061 == null)) {
    return h__2192__auto____10061
  }else {
    var h__2192__auto____10062 = cljs.core.hash_coll.call(null, coll);
    this__10060.__hash = h__2192__auto____10062;
    return h__2192__auto____10062
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10063 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10064 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10065 = this;
  if(function() {
    var and__3822__auto____10066 = 0 <= k;
    if(and__3822__auto____10066) {
      return k < this__10065.cnt
    }else {
      return and__3822__auto____10066
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__10067 = this__10065.tail.slice();
      new_tail__10067[k & 31] = v;
      return new cljs.core.PersistentVector(this__10065.meta, this__10065.cnt, this__10065.shift, this__10065.root, new_tail__10067, null)
    }else {
      return new cljs.core.PersistentVector(this__10065.meta, this__10065.cnt, this__10065.shift, cljs.core.do_assoc.call(null, coll, this__10065.shift, this__10065.root, k, v), this__10065.tail, null)
    }
  }else {
    if(k === this__10065.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__10065.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__10115 = null;
  var G__10115__2 = function(this_sym10068, k) {
    var this__10070 = this;
    var this_sym10068__10071 = this;
    var coll__10072 = this_sym10068__10071;
    return coll__10072.cljs$core$ILookup$_lookup$arity$2(coll__10072, k)
  };
  var G__10115__3 = function(this_sym10069, k, not_found) {
    var this__10070 = this;
    var this_sym10069__10073 = this;
    var coll__10074 = this_sym10069__10073;
    return coll__10074.cljs$core$ILookup$_lookup$arity$3(coll__10074, k, not_found)
  };
  G__10115 = function(this_sym10069, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10115__2.call(this, this_sym10069, k);
      case 3:
        return G__10115__3.call(this, this_sym10069, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10115
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym10057, args10058) {
  var this__10075 = this;
  return this_sym10057.call.apply(this_sym10057, [this_sym10057].concat(args10058.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__10076 = this;
  var step_init__10077 = [0, init];
  var i__10078 = 0;
  while(true) {
    if(i__10078 < this__10076.cnt) {
      var arr__10079 = cljs.core.array_for.call(null, v, i__10078);
      var len__10080 = arr__10079.length;
      var init__10084 = function() {
        var j__10081 = 0;
        var init__10082 = step_init__10077[1];
        while(true) {
          if(j__10081 < len__10080) {
            var init__10083 = f.call(null, init__10082, j__10081 + i__10078, arr__10079[j__10081]);
            if(cljs.core.reduced_QMARK_.call(null, init__10083)) {
              return init__10083
            }else {
              var G__10116 = j__10081 + 1;
              var G__10117 = init__10083;
              j__10081 = G__10116;
              init__10082 = G__10117;
              continue
            }
          }else {
            step_init__10077[0] = len__10080;
            step_init__10077[1] = init__10082;
            return init__10082
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__10084)) {
        return cljs.core.deref.call(null, init__10084)
      }else {
        var G__10118 = i__10078 + step_init__10077[0];
        i__10078 = G__10118;
        continue
      }
    }else {
      return step_init__10077[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10085 = this;
  if(this__10085.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__10086 = this__10085.tail.slice();
    new_tail__10086.push(o);
    return new cljs.core.PersistentVector(this__10085.meta, this__10085.cnt + 1, this__10085.shift, this__10085.root, new_tail__10086, null)
  }else {
    var root_overflow_QMARK___10087 = this__10085.cnt >>> 5 > 1 << this__10085.shift;
    var new_shift__10088 = root_overflow_QMARK___10087 ? this__10085.shift + 5 : this__10085.shift;
    var new_root__10090 = root_overflow_QMARK___10087 ? function() {
      var n_r__10089 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__10089, 0, this__10085.root);
      cljs.core.pv_aset.call(null, n_r__10089, 1, cljs.core.new_path.call(null, null, this__10085.shift, new cljs.core.VectorNode(null, this__10085.tail)));
      return n_r__10089
    }() : cljs.core.push_tail.call(null, coll, this__10085.shift, this__10085.root, new cljs.core.VectorNode(null, this__10085.tail));
    return new cljs.core.PersistentVector(this__10085.meta, this__10085.cnt + 1, new_shift__10088, new_root__10090, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10091 = this;
  if(this__10091.cnt > 0) {
    return new cljs.core.RSeq(coll, this__10091.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__10092 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__10093 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__10094 = this;
  var this__10095 = this;
  return cljs.core.pr_str.call(null, this__10095)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__10096 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__10097 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10098 = this;
  if(this__10098.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10099 = this;
  return this__10099.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10100 = this;
  if(this__10100.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__10100.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10101 = this;
  if(this__10101.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__10101.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__10101.meta)
    }else {
      if(1 < this__10101.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__10101.meta, this__10101.cnt - 1, this__10101.shift, this__10101.root, this__10101.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__10102 = cljs.core.array_for.call(null, coll, this__10101.cnt - 2);
          var nr__10103 = cljs.core.pop_tail.call(null, coll, this__10101.shift, this__10101.root);
          var new_root__10104 = nr__10103 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__10103;
          var cnt_1__10105 = this__10101.cnt - 1;
          if(function() {
            var and__3822__auto____10106 = 5 < this__10101.shift;
            if(and__3822__auto____10106) {
              return cljs.core.pv_aget.call(null, new_root__10104, 1) == null
            }else {
              return and__3822__auto____10106
            }
          }()) {
            return new cljs.core.PersistentVector(this__10101.meta, cnt_1__10105, this__10101.shift - 5, cljs.core.pv_aget.call(null, new_root__10104, 0), new_tail__10102, null)
          }else {
            return new cljs.core.PersistentVector(this__10101.meta, cnt_1__10105, this__10101.shift, new_root__10104, new_tail__10102, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__10107 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10108 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10109 = this;
  return new cljs.core.PersistentVector(meta, this__10109.cnt, this__10109.shift, this__10109.root, this__10109.tail, this__10109.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10110 = this;
  return this__10110.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10111 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10112 = this;
  if(function() {
    var and__3822__auto____10113 = 0 <= n;
    if(and__3822__auto____10113) {
      return n < this__10112.cnt
    }else {
      return and__3822__auto____10113
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10114 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__10114.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__10119 = xs.length;
  var xs__10120 = no_clone === true ? xs : xs.slice();
  if(l__10119 < 32) {
    return new cljs.core.PersistentVector(null, l__10119, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__10120, null)
  }else {
    var node__10121 = xs__10120.slice(0, 32);
    var v__10122 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__10121, null);
    var i__10123 = 32;
    var out__10124 = cljs.core._as_transient.call(null, v__10122);
    while(true) {
      if(i__10123 < l__10119) {
        var G__10125 = i__10123 + 1;
        var G__10126 = cljs.core.conj_BANG_.call(null, out__10124, xs__10120[i__10123]);
        i__10123 = G__10125;
        out__10124 = G__10126;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__10124)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__10127) {
    var args = cljs.core.seq(arglist__10127);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__10128 = this;
  if(this__10128.off + 1 < this__10128.node.length) {
    var s__10129 = cljs.core.chunked_seq.call(null, this__10128.vec, this__10128.node, this__10128.i, this__10128.off + 1);
    if(s__10129 == null) {
      return null
    }else {
      return s__10129
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10130 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10131 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10132 = this;
  return this__10132.node[this__10132.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10133 = this;
  if(this__10133.off + 1 < this__10133.node.length) {
    var s__10134 = cljs.core.chunked_seq.call(null, this__10133.vec, this__10133.node, this__10133.i, this__10133.off + 1);
    if(s__10134 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__10134
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__10135 = this;
  var l__10136 = this__10135.node.length;
  var s__10137 = this__10135.i + l__10136 < cljs.core._count.call(null, this__10135.vec) ? cljs.core.chunked_seq.call(null, this__10135.vec, this__10135.i + l__10136, 0) : null;
  if(s__10137 == null) {
    return null
  }else {
    return s__10137
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10138 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__10139 = this;
  return cljs.core.chunked_seq.call(null, this__10139.vec, this__10139.node, this__10139.i, this__10139.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__10140 = this;
  return this__10140.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10141 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__10141.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__10142 = this;
  return cljs.core.array_chunk.call(null, this__10142.node, this__10142.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__10143 = this;
  var l__10144 = this__10143.node.length;
  var s__10145 = this__10143.i + l__10144 < cljs.core._count.call(null, this__10143.vec) ? cljs.core.chunked_seq.call(null, this__10143.vec, this__10143.i + l__10144, 0) : null;
  if(s__10145 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__10145
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10148 = this;
  var h__2192__auto____10149 = this__10148.__hash;
  if(!(h__2192__auto____10149 == null)) {
    return h__2192__auto____10149
  }else {
    var h__2192__auto____10150 = cljs.core.hash_coll.call(null, coll);
    this__10148.__hash = h__2192__auto____10150;
    return h__2192__auto____10150
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10151 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10152 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__10153 = this;
  var v_pos__10154 = this__10153.start + key;
  return new cljs.core.Subvec(this__10153.meta, cljs.core._assoc.call(null, this__10153.v, v_pos__10154, val), this__10153.start, this__10153.end > v_pos__10154 + 1 ? this__10153.end : v_pos__10154 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__10180 = null;
  var G__10180__2 = function(this_sym10155, k) {
    var this__10157 = this;
    var this_sym10155__10158 = this;
    var coll__10159 = this_sym10155__10158;
    return coll__10159.cljs$core$ILookup$_lookup$arity$2(coll__10159, k)
  };
  var G__10180__3 = function(this_sym10156, k, not_found) {
    var this__10157 = this;
    var this_sym10156__10160 = this;
    var coll__10161 = this_sym10156__10160;
    return coll__10161.cljs$core$ILookup$_lookup$arity$3(coll__10161, k, not_found)
  };
  G__10180 = function(this_sym10156, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10180__2.call(this, this_sym10156, k);
      case 3:
        return G__10180__3.call(this, this_sym10156, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10180
}();
cljs.core.Subvec.prototype.apply = function(this_sym10146, args10147) {
  var this__10162 = this;
  return this_sym10146.call.apply(this_sym10146, [this_sym10146].concat(args10147.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10163 = this;
  return new cljs.core.Subvec(this__10163.meta, cljs.core._assoc_n.call(null, this__10163.v, this__10163.end, o), this__10163.start, this__10163.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__10164 = this;
  var this__10165 = this;
  return cljs.core.pr_str.call(null, this__10165)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__10166 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__10167 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10168 = this;
  var subvec_seq__10169 = function subvec_seq(i) {
    if(i === this__10168.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__10168.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__10169.call(null, this__10168.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10170 = this;
  return this__10170.end - this__10170.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10171 = this;
  return cljs.core._nth.call(null, this__10171.v, this__10171.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10172 = this;
  if(this__10172.start === this__10172.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__10172.meta, this__10172.v, this__10172.start, this__10172.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__10173 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10174 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10175 = this;
  return new cljs.core.Subvec(meta, this__10175.v, this__10175.start, this__10175.end, this__10175.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10176 = this;
  return this__10176.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10177 = this;
  return cljs.core._nth.call(null, this__10177.v, this__10177.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10178 = this;
  return cljs.core._nth.call(null, this__10178.v, this__10178.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10179 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__10179.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__10182 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__10182, 0, tl.length);
  return ret__10182
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__10186 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__10187 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__10186, subidx__10187, level === 5 ? tail_node : function() {
    var child__10188 = cljs.core.pv_aget.call(null, ret__10186, subidx__10187);
    if(!(child__10188 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__10188, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__10186
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__10193 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__10194 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__10195 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__10193, subidx__10194));
    if(function() {
      var and__3822__auto____10196 = new_child__10195 == null;
      if(and__3822__auto____10196) {
        return subidx__10194 === 0
      }else {
        return and__3822__auto____10196
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__10193, subidx__10194, new_child__10195);
      return node__10193
    }
  }else {
    if(subidx__10194 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__10193, subidx__10194, null);
        return node__10193
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____10201 = 0 <= i;
    if(and__3822__auto____10201) {
      return i < tv.cnt
    }else {
      return and__3822__auto____10201
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__10202 = tv.root;
      var node__10203 = root__10202;
      var level__10204 = tv.shift;
      while(true) {
        if(level__10204 > 0) {
          var G__10205 = cljs.core.tv_ensure_editable.call(null, root__10202.edit, cljs.core.pv_aget.call(null, node__10203, i >>> level__10204 & 31));
          var G__10206 = level__10204 - 5;
          node__10203 = G__10205;
          level__10204 = G__10206;
          continue
        }else {
          return node__10203.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__10246 = null;
  var G__10246__2 = function(this_sym10209, k) {
    var this__10211 = this;
    var this_sym10209__10212 = this;
    var coll__10213 = this_sym10209__10212;
    return coll__10213.cljs$core$ILookup$_lookup$arity$2(coll__10213, k)
  };
  var G__10246__3 = function(this_sym10210, k, not_found) {
    var this__10211 = this;
    var this_sym10210__10214 = this;
    var coll__10215 = this_sym10210__10214;
    return coll__10215.cljs$core$ILookup$_lookup$arity$3(coll__10215, k, not_found)
  };
  G__10246 = function(this_sym10210, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10246__2.call(this, this_sym10210, k);
      case 3:
        return G__10246__3.call(this, this_sym10210, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10246
}();
cljs.core.TransientVector.prototype.apply = function(this_sym10207, args10208) {
  var this__10216 = this;
  return this_sym10207.call.apply(this_sym10207, [this_sym10207].concat(args10208.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10217 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10218 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10219 = this;
  if(this__10219.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10220 = this;
  if(function() {
    var and__3822__auto____10221 = 0 <= n;
    if(and__3822__auto____10221) {
      return n < this__10220.cnt
    }else {
      return and__3822__auto____10221
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10222 = this;
  if(this__10222.root.edit) {
    return this__10222.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__10223 = this;
  if(this__10223.root.edit) {
    if(function() {
      var and__3822__auto____10224 = 0 <= n;
      if(and__3822__auto____10224) {
        return n < this__10223.cnt
      }else {
        return and__3822__auto____10224
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__10223.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__10229 = function go(level, node) {
          var node__10227 = cljs.core.tv_ensure_editable.call(null, this__10223.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__10227, n & 31, val);
            return node__10227
          }else {
            var subidx__10228 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__10227, subidx__10228, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__10227, subidx__10228)));
            return node__10227
          }
        }.call(null, this__10223.shift, this__10223.root);
        this__10223.root = new_root__10229;
        return tcoll
      }
    }else {
      if(n === this__10223.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__10223.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__10230 = this;
  if(this__10230.root.edit) {
    if(this__10230.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__10230.cnt) {
        this__10230.cnt = 0;
        return tcoll
      }else {
        if((this__10230.cnt - 1 & 31) > 0) {
          this__10230.cnt = this__10230.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__10231 = cljs.core.editable_array_for.call(null, tcoll, this__10230.cnt - 2);
            var new_root__10233 = function() {
              var nr__10232 = cljs.core.tv_pop_tail.call(null, tcoll, this__10230.shift, this__10230.root);
              if(!(nr__10232 == null)) {
                return nr__10232
              }else {
                return new cljs.core.VectorNode(this__10230.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____10234 = 5 < this__10230.shift;
              if(and__3822__auto____10234) {
                return cljs.core.pv_aget.call(null, new_root__10233, 1) == null
              }else {
                return and__3822__auto____10234
              }
            }()) {
              var new_root__10235 = cljs.core.tv_ensure_editable.call(null, this__10230.root.edit, cljs.core.pv_aget.call(null, new_root__10233, 0));
              this__10230.root = new_root__10235;
              this__10230.shift = this__10230.shift - 5;
              this__10230.cnt = this__10230.cnt - 1;
              this__10230.tail = new_tail__10231;
              return tcoll
            }else {
              this__10230.root = new_root__10233;
              this__10230.cnt = this__10230.cnt - 1;
              this__10230.tail = new_tail__10231;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__10236 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10237 = this;
  if(this__10237.root.edit) {
    if(this__10237.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__10237.tail[this__10237.cnt & 31] = o;
      this__10237.cnt = this__10237.cnt + 1;
      return tcoll
    }else {
      var tail_node__10238 = new cljs.core.VectorNode(this__10237.root.edit, this__10237.tail);
      var new_tail__10239 = cljs.core.make_array.call(null, 32);
      new_tail__10239[0] = o;
      this__10237.tail = new_tail__10239;
      if(this__10237.cnt >>> 5 > 1 << this__10237.shift) {
        var new_root_array__10240 = cljs.core.make_array.call(null, 32);
        var new_shift__10241 = this__10237.shift + 5;
        new_root_array__10240[0] = this__10237.root;
        new_root_array__10240[1] = cljs.core.new_path.call(null, this__10237.root.edit, this__10237.shift, tail_node__10238);
        this__10237.root = new cljs.core.VectorNode(this__10237.root.edit, new_root_array__10240);
        this__10237.shift = new_shift__10241;
        this__10237.cnt = this__10237.cnt + 1;
        return tcoll
      }else {
        var new_root__10242 = cljs.core.tv_push_tail.call(null, tcoll, this__10237.shift, this__10237.root, tail_node__10238);
        this__10237.root = new_root__10242;
        this__10237.cnt = this__10237.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10243 = this;
  if(this__10243.root.edit) {
    this__10243.root.edit = null;
    var len__10244 = this__10243.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__10245 = cljs.core.make_array.call(null, len__10244);
    cljs.core.array_copy.call(null, this__10243.tail, 0, trimmed_tail__10245, 0, len__10244);
    return new cljs.core.PersistentVector(null, this__10243.cnt, this__10243.shift, this__10243.root, trimmed_tail__10245, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10247 = this;
  var h__2192__auto____10248 = this__10247.__hash;
  if(!(h__2192__auto____10248 == null)) {
    return h__2192__auto____10248
  }else {
    var h__2192__auto____10249 = cljs.core.hash_coll.call(null, coll);
    this__10247.__hash = h__2192__auto____10249;
    return h__2192__auto____10249
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10250 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__10251 = this;
  var this__10252 = this;
  return cljs.core.pr_str.call(null, this__10252)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10253 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10254 = this;
  return cljs.core._first.call(null, this__10254.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10255 = this;
  var temp__3971__auto____10256 = cljs.core.next.call(null, this__10255.front);
  if(temp__3971__auto____10256) {
    var f1__10257 = temp__3971__auto____10256;
    return new cljs.core.PersistentQueueSeq(this__10255.meta, f1__10257, this__10255.rear, null)
  }else {
    if(this__10255.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__10255.meta, this__10255.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10258 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10259 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__10259.front, this__10259.rear, this__10259.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10260 = this;
  return this__10260.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10261 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10261.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10262 = this;
  var h__2192__auto____10263 = this__10262.__hash;
  if(!(h__2192__auto____10263 == null)) {
    return h__2192__auto____10263
  }else {
    var h__2192__auto____10264 = cljs.core.hash_coll.call(null, coll);
    this__10262.__hash = h__2192__auto____10264;
    return h__2192__auto____10264
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10265 = this;
  if(cljs.core.truth_(this__10265.front)) {
    return new cljs.core.PersistentQueue(this__10265.meta, this__10265.count + 1, this__10265.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____10266 = this__10265.rear;
      if(cljs.core.truth_(or__3824__auto____10266)) {
        return or__3824__auto____10266
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__10265.meta, this__10265.count + 1, cljs.core.conj.call(null, this__10265.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__10267 = this;
  var this__10268 = this;
  return cljs.core.pr_str.call(null, this__10268)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10269 = this;
  var rear__10270 = cljs.core.seq.call(null, this__10269.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____10271 = this__10269.front;
    if(cljs.core.truth_(or__3824__auto____10271)) {
      return or__3824__auto____10271
    }else {
      return rear__10270
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__10269.front, cljs.core.seq.call(null, rear__10270), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10272 = this;
  return this__10272.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10273 = this;
  return cljs.core._first.call(null, this__10273.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10274 = this;
  if(cljs.core.truth_(this__10274.front)) {
    var temp__3971__auto____10275 = cljs.core.next.call(null, this__10274.front);
    if(temp__3971__auto____10275) {
      var f1__10276 = temp__3971__auto____10275;
      return new cljs.core.PersistentQueue(this__10274.meta, this__10274.count - 1, f1__10276, this__10274.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__10274.meta, this__10274.count - 1, cljs.core.seq.call(null, this__10274.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10277 = this;
  return cljs.core.first.call(null, this__10277.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10278 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10279 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10280 = this;
  return new cljs.core.PersistentQueue(meta, this__10280.count, this__10280.front, this__10280.rear, this__10280.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10281 = this;
  return this__10281.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10282 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__10283 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__10286 = array.length;
  var i__10287 = 0;
  while(true) {
    if(i__10287 < len__10286) {
      if(k === array[i__10287]) {
        return i__10287
      }else {
        var G__10288 = i__10287 + incr;
        i__10287 = G__10288;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__10291 = cljs.core.hash.call(null, a);
  var b__10292 = cljs.core.hash.call(null, b);
  if(a__10291 < b__10292) {
    return-1
  }else {
    if(a__10291 > b__10292) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__10300 = m.keys;
  var len__10301 = ks__10300.length;
  var so__10302 = m.strobj;
  var out__10303 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__10304 = 0;
  var out__10305 = cljs.core.transient$.call(null, out__10303);
  while(true) {
    if(i__10304 < len__10301) {
      var k__10306 = ks__10300[i__10304];
      var G__10307 = i__10304 + 1;
      var G__10308 = cljs.core.assoc_BANG_.call(null, out__10305, k__10306, so__10302[k__10306]);
      i__10304 = G__10307;
      out__10305 = G__10308;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__10305, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__10314 = {};
  var l__10315 = ks.length;
  var i__10316 = 0;
  while(true) {
    if(i__10316 < l__10315) {
      var k__10317 = ks[i__10316];
      new_obj__10314[k__10317] = obj[k__10317];
      var G__10318 = i__10316 + 1;
      i__10316 = G__10318;
      continue
    }else {
    }
    break
  }
  return new_obj__10314
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__10321 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10322 = this;
  var h__2192__auto____10323 = this__10322.__hash;
  if(!(h__2192__auto____10323 == null)) {
    return h__2192__auto____10323
  }else {
    var h__2192__auto____10324 = cljs.core.hash_imap.call(null, coll);
    this__10322.__hash = h__2192__auto____10324;
    return h__2192__auto____10324
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10325 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10326 = this;
  if(function() {
    var and__3822__auto____10327 = goog.isString(k);
    if(and__3822__auto____10327) {
      return!(cljs.core.scan_array.call(null, 1, k, this__10326.keys) == null)
    }else {
      return and__3822__auto____10327
    }
  }()) {
    return this__10326.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10328 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____10329 = this__10328.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____10329) {
        return or__3824__auto____10329
      }else {
        return this__10328.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__10328.keys) == null)) {
        var new_strobj__10330 = cljs.core.obj_clone.call(null, this__10328.strobj, this__10328.keys);
        new_strobj__10330[k] = v;
        return new cljs.core.ObjMap(this__10328.meta, this__10328.keys, new_strobj__10330, this__10328.update_count + 1, null)
      }else {
        var new_strobj__10331 = cljs.core.obj_clone.call(null, this__10328.strobj, this__10328.keys);
        var new_keys__10332 = this__10328.keys.slice();
        new_strobj__10331[k] = v;
        new_keys__10332.push(k);
        return new cljs.core.ObjMap(this__10328.meta, new_keys__10332, new_strobj__10331, this__10328.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10333 = this;
  if(function() {
    var and__3822__auto____10334 = goog.isString(k);
    if(and__3822__auto____10334) {
      return!(cljs.core.scan_array.call(null, 1, k, this__10333.keys) == null)
    }else {
      return and__3822__auto____10334
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__10356 = null;
  var G__10356__2 = function(this_sym10335, k) {
    var this__10337 = this;
    var this_sym10335__10338 = this;
    var coll__10339 = this_sym10335__10338;
    return coll__10339.cljs$core$ILookup$_lookup$arity$2(coll__10339, k)
  };
  var G__10356__3 = function(this_sym10336, k, not_found) {
    var this__10337 = this;
    var this_sym10336__10340 = this;
    var coll__10341 = this_sym10336__10340;
    return coll__10341.cljs$core$ILookup$_lookup$arity$3(coll__10341, k, not_found)
  };
  G__10356 = function(this_sym10336, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10356__2.call(this, this_sym10336, k);
      case 3:
        return G__10356__3.call(this, this_sym10336, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10356
}();
cljs.core.ObjMap.prototype.apply = function(this_sym10319, args10320) {
  var this__10342 = this;
  return this_sym10319.call.apply(this_sym10319, [this_sym10319].concat(args10320.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10343 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__10344 = this;
  var this__10345 = this;
  return cljs.core.pr_str.call(null, this__10345)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10346 = this;
  if(this__10346.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__10309_SHARP_) {
      return cljs.core.vector.call(null, p1__10309_SHARP_, this__10346.strobj[p1__10309_SHARP_])
    }, this__10346.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10347 = this;
  return this__10347.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10348 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10349 = this;
  return new cljs.core.ObjMap(meta, this__10349.keys, this__10349.strobj, this__10349.update_count, this__10349.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10350 = this;
  return this__10350.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10351 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__10351.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10352 = this;
  if(function() {
    var and__3822__auto____10353 = goog.isString(k);
    if(and__3822__auto____10353) {
      return!(cljs.core.scan_array.call(null, 1, k, this__10352.keys) == null)
    }else {
      return and__3822__auto____10353
    }
  }()) {
    var new_keys__10354 = this__10352.keys.slice();
    var new_strobj__10355 = cljs.core.obj_clone.call(null, this__10352.strobj, this__10352.keys);
    new_keys__10354.splice(cljs.core.scan_array.call(null, 1, k, new_keys__10354), 1);
    cljs.core.js_delete.call(null, new_strobj__10355, k);
    return new cljs.core.ObjMap(this__10352.meta, new_keys__10354, new_strobj__10355, this__10352.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10360 = this;
  var h__2192__auto____10361 = this__10360.__hash;
  if(!(h__2192__auto____10361 == null)) {
    return h__2192__auto____10361
  }else {
    var h__2192__auto____10362 = cljs.core.hash_imap.call(null, coll);
    this__10360.__hash = h__2192__auto____10362;
    return h__2192__auto____10362
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10363 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10364 = this;
  var bucket__10365 = this__10364.hashobj[cljs.core.hash.call(null, k)];
  var i__10366 = cljs.core.truth_(bucket__10365) ? cljs.core.scan_array.call(null, 2, k, bucket__10365) : null;
  if(cljs.core.truth_(i__10366)) {
    return bucket__10365[i__10366 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10367 = this;
  var h__10368 = cljs.core.hash.call(null, k);
  var bucket__10369 = this__10367.hashobj[h__10368];
  if(cljs.core.truth_(bucket__10369)) {
    var new_bucket__10370 = bucket__10369.slice();
    var new_hashobj__10371 = goog.object.clone(this__10367.hashobj);
    new_hashobj__10371[h__10368] = new_bucket__10370;
    var temp__3971__auto____10372 = cljs.core.scan_array.call(null, 2, k, new_bucket__10370);
    if(cljs.core.truth_(temp__3971__auto____10372)) {
      var i__10373 = temp__3971__auto____10372;
      new_bucket__10370[i__10373 + 1] = v;
      return new cljs.core.HashMap(this__10367.meta, this__10367.count, new_hashobj__10371, null)
    }else {
      new_bucket__10370.push(k, v);
      return new cljs.core.HashMap(this__10367.meta, this__10367.count + 1, new_hashobj__10371, null)
    }
  }else {
    var new_hashobj__10374 = goog.object.clone(this__10367.hashobj);
    new_hashobj__10374[h__10368] = [k, v];
    return new cljs.core.HashMap(this__10367.meta, this__10367.count + 1, new_hashobj__10374, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10375 = this;
  var bucket__10376 = this__10375.hashobj[cljs.core.hash.call(null, k)];
  var i__10377 = cljs.core.truth_(bucket__10376) ? cljs.core.scan_array.call(null, 2, k, bucket__10376) : null;
  if(cljs.core.truth_(i__10377)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__10402 = null;
  var G__10402__2 = function(this_sym10378, k) {
    var this__10380 = this;
    var this_sym10378__10381 = this;
    var coll__10382 = this_sym10378__10381;
    return coll__10382.cljs$core$ILookup$_lookup$arity$2(coll__10382, k)
  };
  var G__10402__3 = function(this_sym10379, k, not_found) {
    var this__10380 = this;
    var this_sym10379__10383 = this;
    var coll__10384 = this_sym10379__10383;
    return coll__10384.cljs$core$ILookup$_lookup$arity$3(coll__10384, k, not_found)
  };
  G__10402 = function(this_sym10379, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10402__2.call(this, this_sym10379, k);
      case 3:
        return G__10402__3.call(this, this_sym10379, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10402
}();
cljs.core.HashMap.prototype.apply = function(this_sym10358, args10359) {
  var this__10385 = this;
  return this_sym10358.call.apply(this_sym10358, [this_sym10358].concat(args10359.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10386 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__10387 = this;
  var this__10388 = this;
  return cljs.core.pr_str.call(null, this__10388)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10389 = this;
  if(this__10389.count > 0) {
    var hashes__10390 = cljs.core.js_keys.call(null, this__10389.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__10357_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__10389.hashobj[p1__10357_SHARP_]))
    }, hashes__10390)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10391 = this;
  return this__10391.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10392 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10393 = this;
  return new cljs.core.HashMap(meta, this__10393.count, this__10393.hashobj, this__10393.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10394 = this;
  return this__10394.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10395 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__10395.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10396 = this;
  var h__10397 = cljs.core.hash.call(null, k);
  var bucket__10398 = this__10396.hashobj[h__10397];
  var i__10399 = cljs.core.truth_(bucket__10398) ? cljs.core.scan_array.call(null, 2, k, bucket__10398) : null;
  if(cljs.core.not.call(null, i__10399)) {
    return coll
  }else {
    var new_hashobj__10400 = goog.object.clone(this__10396.hashobj);
    if(3 > bucket__10398.length) {
      cljs.core.js_delete.call(null, new_hashobj__10400, h__10397)
    }else {
      var new_bucket__10401 = bucket__10398.slice();
      new_bucket__10401.splice(i__10399, 2);
      new_hashobj__10400[h__10397] = new_bucket__10401
    }
    return new cljs.core.HashMap(this__10396.meta, this__10396.count - 1, new_hashobj__10400, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__10403 = ks.length;
  var i__10404 = 0;
  var out__10405 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__10404 < len__10403) {
      var G__10406 = i__10404 + 1;
      var G__10407 = cljs.core.assoc.call(null, out__10405, ks[i__10404], vs[i__10404]);
      i__10404 = G__10406;
      out__10405 = G__10407;
      continue
    }else {
      return out__10405
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__10411 = m.arr;
  var len__10412 = arr__10411.length;
  var i__10413 = 0;
  while(true) {
    if(len__10412 <= i__10413) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__10411[i__10413], k)) {
        return i__10413
      }else {
        if("\ufdd0'else") {
          var G__10414 = i__10413 + 2;
          i__10413 = G__10414;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__10417 = this;
  return new cljs.core.TransientArrayMap({}, this__10417.arr.length, this__10417.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10418 = this;
  var h__2192__auto____10419 = this__10418.__hash;
  if(!(h__2192__auto____10419 == null)) {
    return h__2192__auto____10419
  }else {
    var h__2192__auto____10420 = cljs.core.hash_imap.call(null, coll);
    this__10418.__hash = h__2192__auto____10420;
    return h__2192__auto____10420
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10421 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10422 = this;
  var idx__10423 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10423 === -1) {
    return not_found
  }else {
    return this__10422.arr[idx__10423 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10424 = this;
  var idx__10425 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10425 === -1) {
    if(this__10424.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__10424.meta, this__10424.cnt + 1, function() {
        var G__10426__10427 = this__10424.arr.slice();
        G__10426__10427.push(k);
        G__10426__10427.push(v);
        return G__10426__10427
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__10424.arr[idx__10425 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__10424.meta, this__10424.cnt, function() {
          var G__10428__10429 = this__10424.arr.slice();
          G__10428__10429[idx__10425 + 1] = v;
          return G__10428__10429
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10430 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__10462 = null;
  var G__10462__2 = function(this_sym10431, k) {
    var this__10433 = this;
    var this_sym10431__10434 = this;
    var coll__10435 = this_sym10431__10434;
    return coll__10435.cljs$core$ILookup$_lookup$arity$2(coll__10435, k)
  };
  var G__10462__3 = function(this_sym10432, k, not_found) {
    var this__10433 = this;
    var this_sym10432__10436 = this;
    var coll__10437 = this_sym10432__10436;
    return coll__10437.cljs$core$ILookup$_lookup$arity$3(coll__10437, k, not_found)
  };
  G__10462 = function(this_sym10432, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10462__2.call(this, this_sym10432, k);
      case 3:
        return G__10462__3.call(this, this_sym10432, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10462
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym10415, args10416) {
  var this__10438 = this;
  return this_sym10415.call.apply(this_sym10415, [this_sym10415].concat(args10416.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10439 = this;
  var len__10440 = this__10439.arr.length;
  var i__10441 = 0;
  var init__10442 = init;
  while(true) {
    if(i__10441 < len__10440) {
      var init__10443 = f.call(null, init__10442, this__10439.arr[i__10441], this__10439.arr[i__10441 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__10443)) {
        return cljs.core.deref.call(null, init__10443)
      }else {
        var G__10463 = i__10441 + 2;
        var G__10464 = init__10443;
        i__10441 = G__10463;
        init__10442 = G__10464;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10444 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__10445 = this;
  var this__10446 = this;
  return cljs.core.pr_str.call(null, this__10446)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10447 = this;
  if(this__10447.cnt > 0) {
    var len__10448 = this__10447.arr.length;
    var array_map_seq__10449 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__10448) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__10447.arr[i], this__10447.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__10449.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10450 = this;
  return this__10450.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10451 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10452 = this;
  return new cljs.core.PersistentArrayMap(meta, this__10452.cnt, this__10452.arr, this__10452.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10453 = this;
  return this__10453.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10454 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__10454.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10455 = this;
  var idx__10456 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10456 >= 0) {
    var len__10457 = this__10455.arr.length;
    var new_len__10458 = len__10457 - 2;
    if(new_len__10458 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__10459 = cljs.core.make_array.call(null, new_len__10458);
      var s__10460 = 0;
      var d__10461 = 0;
      while(true) {
        if(s__10460 >= len__10457) {
          return new cljs.core.PersistentArrayMap(this__10455.meta, this__10455.cnt - 1, new_arr__10459, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__10455.arr[s__10460])) {
            var G__10465 = s__10460 + 2;
            var G__10466 = d__10461;
            s__10460 = G__10465;
            d__10461 = G__10466;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__10459[d__10461] = this__10455.arr[s__10460];
              new_arr__10459[d__10461 + 1] = this__10455.arr[s__10460 + 1];
              var G__10467 = s__10460 + 2;
              var G__10468 = d__10461 + 2;
              s__10460 = G__10467;
              d__10461 = G__10468;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__10469 = cljs.core.count.call(null, ks);
  var i__10470 = 0;
  var out__10471 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__10470 < len__10469) {
      var G__10472 = i__10470 + 1;
      var G__10473 = cljs.core.assoc_BANG_.call(null, out__10471, ks[i__10470], vs[i__10470]);
      i__10470 = G__10472;
      out__10471 = G__10473;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10471)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__10474 = this;
  if(cljs.core.truth_(this__10474.editable_QMARK_)) {
    var idx__10475 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__10475 >= 0) {
      this__10474.arr[idx__10475] = this__10474.arr[this__10474.len - 2];
      this__10474.arr[idx__10475 + 1] = this__10474.arr[this__10474.len - 1];
      var G__10476__10477 = this__10474.arr;
      G__10476__10477.pop();
      G__10476__10477.pop();
      G__10476__10477;
      this__10474.len = this__10474.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__10478 = this;
  if(cljs.core.truth_(this__10478.editable_QMARK_)) {
    var idx__10479 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__10479 === -1) {
      if(this__10478.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__10478.len = this__10478.len + 2;
        this__10478.arr.push(key);
        this__10478.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__10478.len, this__10478.arr), key, val)
      }
    }else {
      if(val === this__10478.arr[idx__10479 + 1]) {
        return tcoll
      }else {
        this__10478.arr[idx__10479 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10480 = this;
  if(cljs.core.truth_(this__10480.editable_QMARK_)) {
    if(function() {
      var G__10481__10482 = o;
      if(G__10481__10482) {
        if(function() {
          var or__3824__auto____10483 = G__10481__10482.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____10483) {
            return or__3824__auto____10483
          }else {
            return G__10481__10482.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__10481__10482.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10481__10482)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10481__10482)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__10484 = cljs.core.seq.call(null, o);
      var tcoll__10485 = tcoll;
      while(true) {
        var temp__3971__auto____10486 = cljs.core.first.call(null, es__10484);
        if(cljs.core.truth_(temp__3971__auto____10486)) {
          var e__10487 = temp__3971__auto____10486;
          var G__10493 = cljs.core.next.call(null, es__10484);
          var G__10494 = tcoll__10485.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__10485, cljs.core.key.call(null, e__10487), cljs.core.val.call(null, e__10487));
          es__10484 = G__10493;
          tcoll__10485 = G__10494;
          continue
        }else {
          return tcoll__10485
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10488 = this;
  if(cljs.core.truth_(this__10488.editable_QMARK_)) {
    this__10488.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__10488.len, 2), this__10488.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__10489 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__10490 = this;
  if(cljs.core.truth_(this__10490.editable_QMARK_)) {
    var idx__10491 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__10491 === -1) {
      return not_found
    }else {
      return this__10490.arr[idx__10491 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__10492 = this;
  if(cljs.core.truth_(this__10492.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__10492.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__10497 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__10498 = 0;
  while(true) {
    if(i__10498 < len) {
      var G__10499 = cljs.core.assoc_BANG_.call(null, out__10497, arr[i__10498], arr[i__10498 + 1]);
      var G__10500 = i__10498 + 2;
      out__10497 = G__10499;
      i__10498 = G__10500;
      continue
    }else {
      return out__10497
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__10505__10506 = arr.slice();
    G__10505__10506[i] = a;
    return G__10505__10506
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__10507__10508 = arr.slice();
    G__10507__10508[i] = a;
    G__10507__10508[j] = b;
    return G__10507__10508
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__10510 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__10510, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__10510, 2 * i, new_arr__10510.length - 2 * i);
  return new_arr__10510
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__10513 = inode.ensure_editable(edit);
    editable__10513.arr[i] = a;
    return editable__10513
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__10514 = inode.ensure_editable(edit);
    editable__10514.arr[i] = a;
    editable__10514.arr[j] = b;
    return editable__10514
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__10521 = arr.length;
  var i__10522 = 0;
  var init__10523 = init;
  while(true) {
    if(i__10522 < len__10521) {
      var init__10526 = function() {
        var k__10524 = arr[i__10522];
        if(!(k__10524 == null)) {
          return f.call(null, init__10523, k__10524, arr[i__10522 + 1])
        }else {
          var node__10525 = arr[i__10522 + 1];
          if(!(node__10525 == null)) {
            return node__10525.kv_reduce(f, init__10523)
          }else {
            return init__10523
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__10526)) {
        return cljs.core.deref.call(null, init__10526)
      }else {
        var G__10527 = i__10522 + 2;
        var G__10528 = init__10526;
        i__10522 = G__10527;
        init__10523 = G__10528;
        continue
      }
    }else {
      return init__10523
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__10529 = this;
  var inode__10530 = this;
  if(this__10529.bitmap === bit) {
    return null
  }else {
    var editable__10531 = inode__10530.ensure_editable(e);
    var earr__10532 = editable__10531.arr;
    var len__10533 = earr__10532.length;
    editable__10531.bitmap = bit ^ editable__10531.bitmap;
    cljs.core.array_copy.call(null, earr__10532, 2 * (i + 1), earr__10532, 2 * i, len__10533 - 2 * (i + 1));
    earr__10532[len__10533 - 2] = null;
    earr__10532[len__10533 - 1] = null;
    return editable__10531
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10534 = this;
  var inode__10535 = this;
  var bit__10536 = 1 << (hash >>> shift & 31);
  var idx__10537 = cljs.core.bitmap_indexed_node_index.call(null, this__10534.bitmap, bit__10536);
  if((this__10534.bitmap & bit__10536) === 0) {
    var n__10538 = cljs.core.bit_count.call(null, this__10534.bitmap);
    if(2 * n__10538 < this__10534.arr.length) {
      var editable__10539 = inode__10535.ensure_editable(edit);
      var earr__10540 = editable__10539.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__10540, 2 * idx__10537, earr__10540, 2 * (idx__10537 + 1), 2 * (n__10538 - idx__10537));
      earr__10540[2 * idx__10537] = key;
      earr__10540[2 * idx__10537 + 1] = val;
      editable__10539.bitmap = editable__10539.bitmap | bit__10536;
      return editable__10539
    }else {
      if(n__10538 >= 16) {
        var nodes__10541 = cljs.core.make_array.call(null, 32);
        var jdx__10542 = hash >>> shift & 31;
        nodes__10541[jdx__10542] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__10543 = 0;
        var j__10544 = 0;
        while(true) {
          if(i__10543 < 32) {
            if((this__10534.bitmap >>> i__10543 & 1) === 0) {
              var G__10597 = i__10543 + 1;
              var G__10598 = j__10544;
              i__10543 = G__10597;
              j__10544 = G__10598;
              continue
            }else {
              nodes__10541[i__10543] = !(this__10534.arr[j__10544] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__10534.arr[j__10544]), this__10534.arr[j__10544], this__10534.arr[j__10544 + 1], added_leaf_QMARK_) : this__10534.arr[j__10544 + 1];
              var G__10599 = i__10543 + 1;
              var G__10600 = j__10544 + 2;
              i__10543 = G__10599;
              j__10544 = G__10600;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__10538 + 1, nodes__10541)
      }else {
        if("\ufdd0'else") {
          var new_arr__10545 = cljs.core.make_array.call(null, 2 * (n__10538 + 4));
          cljs.core.array_copy.call(null, this__10534.arr, 0, new_arr__10545, 0, 2 * idx__10537);
          new_arr__10545[2 * idx__10537] = key;
          new_arr__10545[2 * idx__10537 + 1] = val;
          cljs.core.array_copy.call(null, this__10534.arr, 2 * idx__10537, new_arr__10545, 2 * (idx__10537 + 1), 2 * (n__10538 - idx__10537));
          added_leaf_QMARK_.val = true;
          var editable__10546 = inode__10535.ensure_editable(edit);
          editable__10546.arr = new_arr__10545;
          editable__10546.bitmap = editable__10546.bitmap | bit__10536;
          return editable__10546
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__10547 = this__10534.arr[2 * idx__10537];
    var val_or_node__10548 = this__10534.arr[2 * idx__10537 + 1];
    if(key_or_nil__10547 == null) {
      var n__10549 = val_or_node__10548.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__10549 === val_or_node__10548) {
        return inode__10535
      }else {
        return cljs.core.edit_and_set.call(null, inode__10535, edit, 2 * idx__10537 + 1, n__10549)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__10547)) {
        if(val === val_or_node__10548) {
          return inode__10535
        }else {
          return cljs.core.edit_and_set.call(null, inode__10535, edit, 2 * idx__10537 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__10535, edit, 2 * idx__10537, null, 2 * idx__10537 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__10547, val_or_node__10548, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__10550 = this;
  var inode__10551 = this;
  return cljs.core.create_inode_seq.call(null, this__10550.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10552 = this;
  var inode__10553 = this;
  var bit__10554 = 1 << (hash >>> shift & 31);
  if((this__10552.bitmap & bit__10554) === 0) {
    return inode__10553
  }else {
    var idx__10555 = cljs.core.bitmap_indexed_node_index.call(null, this__10552.bitmap, bit__10554);
    var key_or_nil__10556 = this__10552.arr[2 * idx__10555];
    var val_or_node__10557 = this__10552.arr[2 * idx__10555 + 1];
    if(key_or_nil__10556 == null) {
      var n__10558 = val_or_node__10557.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__10558 === val_or_node__10557) {
        return inode__10553
      }else {
        if(!(n__10558 == null)) {
          return cljs.core.edit_and_set.call(null, inode__10553, edit, 2 * idx__10555 + 1, n__10558)
        }else {
          if(this__10552.bitmap === bit__10554) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__10553.edit_and_remove_pair(edit, bit__10554, idx__10555)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__10556)) {
        removed_leaf_QMARK_[0] = true;
        return inode__10553.edit_and_remove_pair(edit, bit__10554, idx__10555)
      }else {
        if("\ufdd0'else") {
          return inode__10553
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__10559 = this;
  var inode__10560 = this;
  if(e === this__10559.edit) {
    return inode__10560
  }else {
    var n__10561 = cljs.core.bit_count.call(null, this__10559.bitmap);
    var new_arr__10562 = cljs.core.make_array.call(null, n__10561 < 0 ? 4 : 2 * (n__10561 + 1));
    cljs.core.array_copy.call(null, this__10559.arr, 0, new_arr__10562, 0, 2 * n__10561);
    return new cljs.core.BitmapIndexedNode(e, this__10559.bitmap, new_arr__10562)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__10563 = this;
  var inode__10564 = this;
  return cljs.core.inode_kv_reduce.call(null, this__10563.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__10565 = this;
  var inode__10566 = this;
  var bit__10567 = 1 << (hash >>> shift & 31);
  if((this__10565.bitmap & bit__10567) === 0) {
    return not_found
  }else {
    var idx__10568 = cljs.core.bitmap_indexed_node_index.call(null, this__10565.bitmap, bit__10567);
    var key_or_nil__10569 = this__10565.arr[2 * idx__10568];
    var val_or_node__10570 = this__10565.arr[2 * idx__10568 + 1];
    if(key_or_nil__10569 == null) {
      return val_or_node__10570.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__10569)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__10569, val_or_node__10570], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__10571 = this;
  var inode__10572 = this;
  var bit__10573 = 1 << (hash >>> shift & 31);
  if((this__10571.bitmap & bit__10573) === 0) {
    return inode__10572
  }else {
    var idx__10574 = cljs.core.bitmap_indexed_node_index.call(null, this__10571.bitmap, bit__10573);
    var key_or_nil__10575 = this__10571.arr[2 * idx__10574];
    var val_or_node__10576 = this__10571.arr[2 * idx__10574 + 1];
    if(key_or_nil__10575 == null) {
      var n__10577 = val_or_node__10576.inode_without(shift + 5, hash, key);
      if(n__10577 === val_or_node__10576) {
        return inode__10572
      }else {
        if(!(n__10577 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__10571.bitmap, cljs.core.clone_and_set.call(null, this__10571.arr, 2 * idx__10574 + 1, n__10577))
        }else {
          if(this__10571.bitmap === bit__10573) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__10571.bitmap ^ bit__10573, cljs.core.remove_pair.call(null, this__10571.arr, idx__10574))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__10575)) {
        return new cljs.core.BitmapIndexedNode(null, this__10571.bitmap ^ bit__10573, cljs.core.remove_pair.call(null, this__10571.arr, idx__10574))
      }else {
        if("\ufdd0'else") {
          return inode__10572
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__10578 = this;
  var inode__10579 = this;
  var bit__10580 = 1 << (hash >>> shift & 31);
  var idx__10581 = cljs.core.bitmap_indexed_node_index.call(null, this__10578.bitmap, bit__10580);
  if((this__10578.bitmap & bit__10580) === 0) {
    var n__10582 = cljs.core.bit_count.call(null, this__10578.bitmap);
    if(n__10582 >= 16) {
      var nodes__10583 = cljs.core.make_array.call(null, 32);
      var jdx__10584 = hash >>> shift & 31;
      nodes__10583[jdx__10584] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__10585 = 0;
      var j__10586 = 0;
      while(true) {
        if(i__10585 < 32) {
          if((this__10578.bitmap >>> i__10585 & 1) === 0) {
            var G__10601 = i__10585 + 1;
            var G__10602 = j__10586;
            i__10585 = G__10601;
            j__10586 = G__10602;
            continue
          }else {
            nodes__10583[i__10585] = !(this__10578.arr[j__10586] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__10578.arr[j__10586]), this__10578.arr[j__10586], this__10578.arr[j__10586 + 1], added_leaf_QMARK_) : this__10578.arr[j__10586 + 1];
            var G__10603 = i__10585 + 1;
            var G__10604 = j__10586 + 2;
            i__10585 = G__10603;
            j__10586 = G__10604;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__10582 + 1, nodes__10583)
    }else {
      var new_arr__10587 = cljs.core.make_array.call(null, 2 * (n__10582 + 1));
      cljs.core.array_copy.call(null, this__10578.arr, 0, new_arr__10587, 0, 2 * idx__10581);
      new_arr__10587[2 * idx__10581] = key;
      new_arr__10587[2 * idx__10581 + 1] = val;
      cljs.core.array_copy.call(null, this__10578.arr, 2 * idx__10581, new_arr__10587, 2 * (idx__10581 + 1), 2 * (n__10582 - idx__10581));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__10578.bitmap | bit__10580, new_arr__10587)
    }
  }else {
    var key_or_nil__10588 = this__10578.arr[2 * idx__10581];
    var val_or_node__10589 = this__10578.arr[2 * idx__10581 + 1];
    if(key_or_nil__10588 == null) {
      var n__10590 = val_or_node__10589.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__10590 === val_or_node__10589) {
        return inode__10579
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__10578.bitmap, cljs.core.clone_and_set.call(null, this__10578.arr, 2 * idx__10581 + 1, n__10590))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__10588)) {
        if(val === val_or_node__10589) {
          return inode__10579
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__10578.bitmap, cljs.core.clone_and_set.call(null, this__10578.arr, 2 * idx__10581 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__10578.bitmap, cljs.core.clone_and_set.call(null, this__10578.arr, 2 * idx__10581, null, 2 * idx__10581 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__10588, val_or_node__10589, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__10591 = this;
  var inode__10592 = this;
  var bit__10593 = 1 << (hash >>> shift & 31);
  if((this__10591.bitmap & bit__10593) === 0) {
    return not_found
  }else {
    var idx__10594 = cljs.core.bitmap_indexed_node_index.call(null, this__10591.bitmap, bit__10593);
    var key_or_nil__10595 = this__10591.arr[2 * idx__10594];
    var val_or_node__10596 = this__10591.arr[2 * idx__10594 + 1];
    if(key_or_nil__10595 == null) {
      return val_or_node__10596.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__10595)) {
        return val_or_node__10596
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__10612 = array_node.arr;
  var len__10613 = 2 * (array_node.cnt - 1);
  var new_arr__10614 = cljs.core.make_array.call(null, len__10613);
  var i__10615 = 0;
  var j__10616 = 1;
  var bitmap__10617 = 0;
  while(true) {
    if(i__10615 < len__10613) {
      if(function() {
        var and__3822__auto____10618 = !(i__10615 === idx);
        if(and__3822__auto____10618) {
          return!(arr__10612[i__10615] == null)
        }else {
          return and__3822__auto____10618
        }
      }()) {
        new_arr__10614[j__10616] = arr__10612[i__10615];
        var G__10619 = i__10615 + 1;
        var G__10620 = j__10616 + 2;
        var G__10621 = bitmap__10617 | 1 << i__10615;
        i__10615 = G__10619;
        j__10616 = G__10620;
        bitmap__10617 = G__10621;
        continue
      }else {
        var G__10622 = i__10615 + 1;
        var G__10623 = j__10616;
        var G__10624 = bitmap__10617;
        i__10615 = G__10622;
        j__10616 = G__10623;
        bitmap__10617 = G__10624;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__10617, new_arr__10614)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10625 = this;
  var inode__10626 = this;
  var idx__10627 = hash >>> shift & 31;
  var node__10628 = this__10625.arr[idx__10627];
  if(node__10628 == null) {
    var editable__10629 = cljs.core.edit_and_set.call(null, inode__10626, edit, idx__10627, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__10629.cnt = editable__10629.cnt + 1;
    return editable__10629
  }else {
    var n__10630 = node__10628.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__10630 === node__10628) {
      return inode__10626
    }else {
      return cljs.core.edit_and_set.call(null, inode__10626, edit, idx__10627, n__10630)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__10631 = this;
  var inode__10632 = this;
  return cljs.core.create_array_node_seq.call(null, this__10631.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10633 = this;
  var inode__10634 = this;
  var idx__10635 = hash >>> shift & 31;
  var node__10636 = this__10633.arr[idx__10635];
  if(node__10636 == null) {
    return inode__10634
  }else {
    var n__10637 = node__10636.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__10637 === node__10636) {
      return inode__10634
    }else {
      if(n__10637 == null) {
        if(this__10633.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__10634, edit, idx__10635)
        }else {
          var editable__10638 = cljs.core.edit_and_set.call(null, inode__10634, edit, idx__10635, n__10637);
          editable__10638.cnt = editable__10638.cnt - 1;
          return editable__10638
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__10634, edit, idx__10635, n__10637)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__10639 = this;
  var inode__10640 = this;
  if(e === this__10639.edit) {
    return inode__10640
  }else {
    return new cljs.core.ArrayNode(e, this__10639.cnt, this__10639.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__10641 = this;
  var inode__10642 = this;
  var len__10643 = this__10641.arr.length;
  var i__10644 = 0;
  var init__10645 = init;
  while(true) {
    if(i__10644 < len__10643) {
      var node__10646 = this__10641.arr[i__10644];
      if(!(node__10646 == null)) {
        var init__10647 = node__10646.kv_reduce(f, init__10645);
        if(cljs.core.reduced_QMARK_.call(null, init__10647)) {
          return cljs.core.deref.call(null, init__10647)
        }else {
          var G__10666 = i__10644 + 1;
          var G__10667 = init__10647;
          i__10644 = G__10666;
          init__10645 = G__10667;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__10645
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__10648 = this;
  var inode__10649 = this;
  var idx__10650 = hash >>> shift & 31;
  var node__10651 = this__10648.arr[idx__10650];
  if(!(node__10651 == null)) {
    return node__10651.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__10652 = this;
  var inode__10653 = this;
  var idx__10654 = hash >>> shift & 31;
  var node__10655 = this__10652.arr[idx__10654];
  if(!(node__10655 == null)) {
    var n__10656 = node__10655.inode_without(shift + 5, hash, key);
    if(n__10656 === node__10655) {
      return inode__10653
    }else {
      if(n__10656 == null) {
        if(this__10652.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__10653, null, idx__10654)
        }else {
          return new cljs.core.ArrayNode(null, this__10652.cnt - 1, cljs.core.clone_and_set.call(null, this__10652.arr, idx__10654, n__10656))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__10652.cnt, cljs.core.clone_and_set.call(null, this__10652.arr, idx__10654, n__10656))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__10653
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__10657 = this;
  var inode__10658 = this;
  var idx__10659 = hash >>> shift & 31;
  var node__10660 = this__10657.arr[idx__10659];
  if(node__10660 == null) {
    return new cljs.core.ArrayNode(null, this__10657.cnt + 1, cljs.core.clone_and_set.call(null, this__10657.arr, idx__10659, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__10661 = node__10660.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__10661 === node__10660) {
      return inode__10658
    }else {
      return new cljs.core.ArrayNode(null, this__10657.cnt, cljs.core.clone_and_set.call(null, this__10657.arr, idx__10659, n__10661))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__10662 = this;
  var inode__10663 = this;
  var idx__10664 = hash >>> shift & 31;
  var node__10665 = this__10662.arr[idx__10664];
  if(!(node__10665 == null)) {
    return node__10665.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__10670 = 2 * cnt;
  var i__10671 = 0;
  while(true) {
    if(i__10671 < lim__10670) {
      if(cljs.core.key_test.call(null, key, arr[i__10671])) {
        return i__10671
      }else {
        var G__10672 = i__10671 + 2;
        i__10671 = G__10672;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10673 = this;
  var inode__10674 = this;
  if(hash === this__10673.collision_hash) {
    var idx__10675 = cljs.core.hash_collision_node_find_index.call(null, this__10673.arr, this__10673.cnt, key);
    if(idx__10675 === -1) {
      if(this__10673.arr.length > 2 * this__10673.cnt) {
        var editable__10676 = cljs.core.edit_and_set.call(null, inode__10674, edit, 2 * this__10673.cnt, key, 2 * this__10673.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__10676.cnt = editable__10676.cnt + 1;
        return editable__10676
      }else {
        var len__10677 = this__10673.arr.length;
        var new_arr__10678 = cljs.core.make_array.call(null, len__10677 + 2);
        cljs.core.array_copy.call(null, this__10673.arr, 0, new_arr__10678, 0, len__10677);
        new_arr__10678[len__10677] = key;
        new_arr__10678[len__10677 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__10674.ensure_editable_array(edit, this__10673.cnt + 1, new_arr__10678)
      }
    }else {
      if(this__10673.arr[idx__10675 + 1] === val) {
        return inode__10674
      }else {
        return cljs.core.edit_and_set.call(null, inode__10674, edit, idx__10675 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__10673.collision_hash >>> shift & 31), [null, inode__10674, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__10679 = this;
  var inode__10680 = this;
  return cljs.core.create_inode_seq.call(null, this__10679.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10681 = this;
  var inode__10682 = this;
  var idx__10683 = cljs.core.hash_collision_node_find_index.call(null, this__10681.arr, this__10681.cnt, key);
  if(idx__10683 === -1) {
    return inode__10682
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__10681.cnt === 1) {
      return null
    }else {
      var editable__10684 = inode__10682.ensure_editable(edit);
      var earr__10685 = editable__10684.arr;
      earr__10685[idx__10683] = earr__10685[2 * this__10681.cnt - 2];
      earr__10685[idx__10683 + 1] = earr__10685[2 * this__10681.cnt - 1];
      earr__10685[2 * this__10681.cnt - 1] = null;
      earr__10685[2 * this__10681.cnt - 2] = null;
      editable__10684.cnt = editable__10684.cnt - 1;
      return editable__10684
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__10686 = this;
  var inode__10687 = this;
  if(e === this__10686.edit) {
    return inode__10687
  }else {
    var new_arr__10688 = cljs.core.make_array.call(null, 2 * (this__10686.cnt + 1));
    cljs.core.array_copy.call(null, this__10686.arr, 0, new_arr__10688, 0, 2 * this__10686.cnt);
    return new cljs.core.HashCollisionNode(e, this__10686.collision_hash, this__10686.cnt, new_arr__10688)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__10689 = this;
  var inode__10690 = this;
  return cljs.core.inode_kv_reduce.call(null, this__10689.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__10691 = this;
  var inode__10692 = this;
  var idx__10693 = cljs.core.hash_collision_node_find_index.call(null, this__10691.arr, this__10691.cnt, key);
  if(idx__10693 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__10691.arr[idx__10693])) {
      return cljs.core.PersistentVector.fromArray([this__10691.arr[idx__10693], this__10691.arr[idx__10693 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__10694 = this;
  var inode__10695 = this;
  var idx__10696 = cljs.core.hash_collision_node_find_index.call(null, this__10694.arr, this__10694.cnt, key);
  if(idx__10696 === -1) {
    return inode__10695
  }else {
    if(this__10694.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__10694.collision_hash, this__10694.cnt - 1, cljs.core.remove_pair.call(null, this__10694.arr, cljs.core.quot.call(null, idx__10696, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__10697 = this;
  var inode__10698 = this;
  if(hash === this__10697.collision_hash) {
    var idx__10699 = cljs.core.hash_collision_node_find_index.call(null, this__10697.arr, this__10697.cnt, key);
    if(idx__10699 === -1) {
      var len__10700 = this__10697.arr.length;
      var new_arr__10701 = cljs.core.make_array.call(null, len__10700 + 2);
      cljs.core.array_copy.call(null, this__10697.arr, 0, new_arr__10701, 0, len__10700);
      new_arr__10701[len__10700] = key;
      new_arr__10701[len__10700 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__10697.collision_hash, this__10697.cnt + 1, new_arr__10701)
    }else {
      if(cljs.core._EQ_.call(null, this__10697.arr[idx__10699], val)) {
        return inode__10698
      }else {
        return new cljs.core.HashCollisionNode(null, this__10697.collision_hash, this__10697.cnt, cljs.core.clone_and_set.call(null, this__10697.arr, idx__10699 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__10697.collision_hash >>> shift & 31), [null, inode__10698])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__10702 = this;
  var inode__10703 = this;
  var idx__10704 = cljs.core.hash_collision_node_find_index.call(null, this__10702.arr, this__10702.cnt, key);
  if(idx__10704 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__10702.arr[idx__10704])) {
      return this__10702.arr[idx__10704 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__10705 = this;
  var inode__10706 = this;
  if(e === this__10705.edit) {
    this__10705.arr = array;
    this__10705.cnt = count;
    return inode__10706
  }else {
    return new cljs.core.HashCollisionNode(this__10705.edit, this__10705.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__10711 = cljs.core.hash.call(null, key1);
    if(key1hash__10711 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__10711, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___10712 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__10711, key1, val1, added_leaf_QMARK___10712).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___10712)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__10713 = cljs.core.hash.call(null, key1);
    if(key1hash__10713 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__10713, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___10714 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__10713, key1, val1, added_leaf_QMARK___10714).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___10714)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10715 = this;
  var h__2192__auto____10716 = this__10715.__hash;
  if(!(h__2192__auto____10716 == null)) {
    return h__2192__auto____10716
  }else {
    var h__2192__auto____10717 = cljs.core.hash_coll.call(null, coll);
    this__10715.__hash = h__2192__auto____10717;
    return h__2192__auto____10717
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10718 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__10719 = this;
  var this__10720 = this;
  return cljs.core.pr_str.call(null, this__10720)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10721 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10722 = this;
  if(this__10722.s == null) {
    return cljs.core.PersistentVector.fromArray([this__10722.nodes[this__10722.i], this__10722.nodes[this__10722.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__10722.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10723 = this;
  if(this__10723.s == null) {
    return cljs.core.create_inode_seq.call(null, this__10723.nodes, this__10723.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__10723.nodes, this__10723.i, cljs.core.next.call(null, this__10723.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10724 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10725 = this;
  return new cljs.core.NodeSeq(meta, this__10725.nodes, this__10725.i, this__10725.s, this__10725.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10726 = this;
  return this__10726.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10727 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10727.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__10734 = nodes.length;
      var j__10735 = i;
      while(true) {
        if(j__10735 < len__10734) {
          if(!(nodes[j__10735] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__10735, null, null)
          }else {
            var temp__3971__auto____10736 = nodes[j__10735 + 1];
            if(cljs.core.truth_(temp__3971__auto____10736)) {
              var node__10737 = temp__3971__auto____10736;
              var temp__3971__auto____10738 = node__10737.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____10738)) {
                var node_seq__10739 = temp__3971__auto____10738;
                return new cljs.core.NodeSeq(null, nodes, j__10735 + 2, node_seq__10739, null)
              }else {
                var G__10740 = j__10735 + 2;
                j__10735 = G__10740;
                continue
              }
            }else {
              var G__10741 = j__10735 + 2;
              j__10735 = G__10741;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10742 = this;
  var h__2192__auto____10743 = this__10742.__hash;
  if(!(h__2192__auto____10743 == null)) {
    return h__2192__auto____10743
  }else {
    var h__2192__auto____10744 = cljs.core.hash_coll.call(null, coll);
    this__10742.__hash = h__2192__auto____10744;
    return h__2192__auto____10744
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10745 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__10746 = this;
  var this__10747 = this;
  return cljs.core.pr_str.call(null, this__10747)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10748 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10749 = this;
  return cljs.core.first.call(null, this__10749.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10750 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__10750.nodes, this__10750.i, cljs.core.next.call(null, this__10750.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10751 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10752 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__10752.nodes, this__10752.i, this__10752.s, this__10752.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10753 = this;
  return this__10753.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10754 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10754.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__10761 = nodes.length;
      var j__10762 = i;
      while(true) {
        if(j__10762 < len__10761) {
          var temp__3971__auto____10763 = nodes[j__10762];
          if(cljs.core.truth_(temp__3971__auto____10763)) {
            var nj__10764 = temp__3971__auto____10763;
            var temp__3971__auto____10765 = nj__10764.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____10765)) {
              var ns__10766 = temp__3971__auto____10765;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__10762 + 1, ns__10766, null)
            }else {
              var G__10767 = j__10762 + 1;
              j__10762 = G__10767;
              continue
            }
          }else {
            var G__10768 = j__10762 + 1;
            j__10762 = G__10768;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__10771 = this;
  return new cljs.core.TransientHashMap({}, this__10771.root, this__10771.cnt, this__10771.has_nil_QMARK_, this__10771.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10772 = this;
  var h__2192__auto____10773 = this__10772.__hash;
  if(!(h__2192__auto____10773 == null)) {
    return h__2192__auto____10773
  }else {
    var h__2192__auto____10774 = cljs.core.hash_imap.call(null, coll);
    this__10772.__hash = h__2192__auto____10774;
    return h__2192__auto____10774
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10775 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10776 = this;
  if(k == null) {
    if(this__10776.has_nil_QMARK_) {
      return this__10776.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__10776.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__10776.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10777 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____10778 = this__10777.has_nil_QMARK_;
      if(and__3822__auto____10778) {
        return v === this__10777.nil_val
      }else {
        return and__3822__auto____10778
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__10777.meta, this__10777.has_nil_QMARK_ ? this__10777.cnt : this__10777.cnt + 1, this__10777.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___10779 = new cljs.core.Box(false);
    var new_root__10780 = (this__10777.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__10777.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___10779);
    if(new_root__10780 === this__10777.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__10777.meta, added_leaf_QMARK___10779.val ? this__10777.cnt + 1 : this__10777.cnt, new_root__10780, this__10777.has_nil_QMARK_, this__10777.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10781 = this;
  if(k == null) {
    return this__10781.has_nil_QMARK_
  }else {
    if(this__10781.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__10781.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__10804 = null;
  var G__10804__2 = function(this_sym10782, k) {
    var this__10784 = this;
    var this_sym10782__10785 = this;
    var coll__10786 = this_sym10782__10785;
    return coll__10786.cljs$core$ILookup$_lookup$arity$2(coll__10786, k)
  };
  var G__10804__3 = function(this_sym10783, k, not_found) {
    var this__10784 = this;
    var this_sym10783__10787 = this;
    var coll__10788 = this_sym10783__10787;
    return coll__10788.cljs$core$ILookup$_lookup$arity$3(coll__10788, k, not_found)
  };
  G__10804 = function(this_sym10783, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10804__2.call(this, this_sym10783, k);
      case 3:
        return G__10804__3.call(this, this_sym10783, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10804
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym10769, args10770) {
  var this__10789 = this;
  return this_sym10769.call.apply(this_sym10769, [this_sym10769].concat(args10770.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10790 = this;
  var init__10791 = this__10790.has_nil_QMARK_ ? f.call(null, init, null, this__10790.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__10791)) {
    return cljs.core.deref.call(null, init__10791)
  }else {
    if(!(this__10790.root == null)) {
      return this__10790.root.kv_reduce(f, init__10791)
    }else {
      if("\ufdd0'else") {
        return init__10791
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10792 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__10793 = this;
  var this__10794 = this;
  return cljs.core.pr_str.call(null, this__10794)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10795 = this;
  if(this__10795.cnt > 0) {
    var s__10796 = !(this__10795.root == null) ? this__10795.root.inode_seq() : null;
    if(this__10795.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__10795.nil_val], true), s__10796)
    }else {
      return s__10796
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10797 = this;
  return this__10797.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10798 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10799 = this;
  return new cljs.core.PersistentHashMap(meta, this__10799.cnt, this__10799.root, this__10799.has_nil_QMARK_, this__10799.nil_val, this__10799.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10800 = this;
  return this__10800.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10801 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__10801.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10802 = this;
  if(k == null) {
    if(this__10802.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__10802.meta, this__10802.cnt - 1, this__10802.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__10802.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__10803 = this__10802.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__10803 === this__10802.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__10802.meta, this__10802.cnt - 1, new_root__10803, this__10802.has_nil_QMARK_, this__10802.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__10805 = ks.length;
  var i__10806 = 0;
  var out__10807 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__10806 < len__10805) {
      var G__10808 = i__10806 + 1;
      var G__10809 = cljs.core.assoc_BANG_.call(null, out__10807, ks[i__10806], vs[i__10806]);
      i__10806 = G__10808;
      out__10807 = G__10809;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10807)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__10810 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__10811 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__10812 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10813 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__10814 = this;
  if(k == null) {
    if(this__10814.has_nil_QMARK_) {
      return this__10814.nil_val
    }else {
      return null
    }
  }else {
    if(this__10814.root == null) {
      return null
    }else {
      return this__10814.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__10815 = this;
  if(k == null) {
    if(this__10815.has_nil_QMARK_) {
      return this__10815.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__10815.root == null) {
      return not_found
    }else {
      return this__10815.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10816 = this;
  if(this__10816.edit) {
    return this__10816.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__10817 = this;
  var tcoll__10818 = this;
  if(this__10817.edit) {
    if(function() {
      var G__10819__10820 = o;
      if(G__10819__10820) {
        if(function() {
          var or__3824__auto____10821 = G__10819__10820.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____10821) {
            return or__3824__auto____10821
          }else {
            return G__10819__10820.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__10819__10820.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10819__10820)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10819__10820)
      }
    }()) {
      return tcoll__10818.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__10822 = cljs.core.seq.call(null, o);
      var tcoll__10823 = tcoll__10818;
      while(true) {
        var temp__3971__auto____10824 = cljs.core.first.call(null, es__10822);
        if(cljs.core.truth_(temp__3971__auto____10824)) {
          var e__10825 = temp__3971__auto____10824;
          var G__10836 = cljs.core.next.call(null, es__10822);
          var G__10837 = tcoll__10823.assoc_BANG_(cljs.core.key.call(null, e__10825), cljs.core.val.call(null, e__10825));
          es__10822 = G__10836;
          tcoll__10823 = G__10837;
          continue
        }else {
          return tcoll__10823
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__10826 = this;
  var tcoll__10827 = this;
  if(this__10826.edit) {
    if(k == null) {
      if(this__10826.nil_val === v) {
      }else {
        this__10826.nil_val = v
      }
      if(this__10826.has_nil_QMARK_) {
      }else {
        this__10826.count = this__10826.count + 1;
        this__10826.has_nil_QMARK_ = true
      }
      return tcoll__10827
    }else {
      var added_leaf_QMARK___10828 = new cljs.core.Box(false);
      var node__10829 = (this__10826.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__10826.root).inode_assoc_BANG_(this__10826.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___10828);
      if(node__10829 === this__10826.root) {
      }else {
        this__10826.root = node__10829
      }
      if(added_leaf_QMARK___10828.val) {
        this__10826.count = this__10826.count + 1
      }else {
      }
      return tcoll__10827
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__10830 = this;
  var tcoll__10831 = this;
  if(this__10830.edit) {
    if(k == null) {
      if(this__10830.has_nil_QMARK_) {
        this__10830.has_nil_QMARK_ = false;
        this__10830.nil_val = null;
        this__10830.count = this__10830.count - 1;
        return tcoll__10831
      }else {
        return tcoll__10831
      }
    }else {
      if(this__10830.root == null) {
        return tcoll__10831
      }else {
        var removed_leaf_QMARK___10832 = new cljs.core.Box(false);
        var node__10833 = this__10830.root.inode_without_BANG_(this__10830.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___10832);
        if(node__10833 === this__10830.root) {
        }else {
          this__10830.root = node__10833
        }
        if(cljs.core.truth_(removed_leaf_QMARK___10832[0])) {
          this__10830.count = this__10830.count - 1
        }else {
        }
        return tcoll__10831
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__10834 = this;
  var tcoll__10835 = this;
  if(this__10834.edit) {
    this__10834.edit = null;
    return new cljs.core.PersistentHashMap(null, this__10834.count, this__10834.root, this__10834.has_nil_QMARK_, this__10834.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__10840 = node;
  var stack__10841 = stack;
  while(true) {
    if(!(t__10840 == null)) {
      var G__10842 = ascending_QMARK_ ? t__10840.left : t__10840.right;
      var G__10843 = cljs.core.conj.call(null, stack__10841, t__10840);
      t__10840 = G__10842;
      stack__10841 = G__10843;
      continue
    }else {
      return stack__10841
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10844 = this;
  var h__2192__auto____10845 = this__10844.__hash;
  if(!(h__2192__auto____10845 == null)) {
    return h__2192__auto____10845
  }else {
    var h__2192__auto____10846 = cljs.core.hash_coll.call(null, coll);
    this__10844.__hash = h__2192__auto____10846;
    return h__2192__auto____10846
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10847 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__10848 = this;
  var this__10849 = this;
  return cljs.core.pr_str.call(null, this__10849)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10850 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10851 = this;
  if(this__10851.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__10851.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__10852 = this;
  return cljs.core.peek.call(null, this__10852.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__10853 = this;
  var t__10854 = cljs.core.first.call(null, this__10853.stack);
  var next_stack__10855 = cljs.core.tree_map_seq_push.call(null, this__10853.ascending_QMARK_ ? t__10854.right : t__10854.left, cljs.core.next.call(null, this__10853.stack), this__10853.ascending_QMARK_);
  if(!(next_stack__10855 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__10855, this__10853.ascending_QMARK_, this__10853.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10856 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10857 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__10857.stack, this__10857.ascending_QMARK_, this__10857.cnt, this__10857.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10858 = this;
  return this__10858.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____10860 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____10860) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____10860
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____10862 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____10862) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____10862
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__10866 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__10866)) {
    return cljs.core.deref.call(null, init__10866)
  }else {
    var init__10867 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__10866) : init__10866;
    if(cljs.core.reduced_QMARK_.call(null, init__10867)) {
      return cljs.core.deref.call(null, init__10867)
    }else {
      var init__10868 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__10867) : init__10867;
      if(cljs.core.reduced_QMARK_.call(null, init__10868)) {
        return cljs.core.deref.call(null, init__10868)
      }else {
        return init__10868
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10871 = this;
  var h__2192__auto____10872 = this__10871.__hash;
  if(!(h__2192__auto____10872 == null)) {
    return h__2192__auto____10872
  }else {
    var h__2192__auto____10873 = cljs.core.hash_coll.call(null, coll);
    this__10871.__hash = h__2192__auto____10873;
    return h__2192__auto____10873
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__10874 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__10875 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__10876 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__10876.key, this__10876.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__10924 = null;
  var G__10924__2 = function(this_sym10877, k) {
    var this__10879 = this;
    var this_sym10877__10880 = this;
    var node__10881 = this_sym10877__10880;
    return node__10881.cljs$core$ILookup$_lookup$arity$2(node__10881, k)
  };
  var G__10924__3 = function(this_sym10878, k, not_found) {
    var this__10879 = this;
    var this_sym10878__10882 = this;
    var node__10883 = this_sym10878__10882;
    return node__10883.cljs$core$ILookup$_lookup$arity$3(node__10883, k, not_found)
  };
  G__10924 = function(this_sym10878, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10924__2.call(this, this_sym10878, k);
      case 3:
        return G__10924__3.call(this, this_sym10878, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10924
}();
cljs.core.BlackNode.prototype.apply = function(this_sym10869, args10870) {
  var this__10884 = this;
  return this_sym10869.call.apply(this_sym10869, [this_sym10869].concat(args10870.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__10885 = this;
  return cljs.core.PersistentVector.fromArray([this__10885.key, this__10885.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10886 = this;
  return this__10886.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10887 = this;
  return this__10887.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__10888 = this;
  var node__10889 = this;
  return ins.balance_right(node__10889)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__10890 = this;
  var node__10891 = this;
  return new cljs.core.RedNode(this__10890.key, this__10890.val, this__10890.left, this__10890.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__10892 = this;
  var node__10893 = this;
  return cljs.core.balance_right_del.call(null, this__10892.key, this__10892.val, this__10892.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__10894 = this;
  var node__10895 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__10896 = this;
  var node__10897 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10897, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__10898 = this;
  var node__10899 = this;
  return cljs.core.balance_left_del.call(null, this__10898.key, this__10898.val, del, this__10898.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__10900 = this;
  var node__10901 = this;
  return ins.balance_left(node__10901)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__10902 = this;
  var node__10903 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__10903, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__10925 = null;
  var G__10925__0 = function() {
    var this__10904 = this;
    var this__10906 = this;
    return cljs.core.pr_str.call(null, this__10906)
  };
  G__10925 = function() {
    switch(arguments.length) {
      case 0:
        return G__10925__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10925
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__10907 = this;
  var node__10908 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10908, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__10909 = this;
  var node__10910 = this;
  return node__10910
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10911 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10912 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10913 = this;
  return cljs.core.list.call(null, this__10913.key, this__10913.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10914 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10915 = this;
  return this__10915.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10916 = this;
  return cljs.core.PersistentVector.fromArray([this__10916.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10917 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10917.key, this__10917.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10918 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10919 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10919.key, this__10919.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10920 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10921 = this;
  if(n === 0) {
    return this__10921.key
  }else {
    if(n === 1) {
      return this__10921.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__10922 = this;
  if(n === 0) {
    return this__10922.key
  }else {
    if(n === 1) {
      return this__10922.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__10923 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10928 = this;
  var h__2192__auto____10929 = this__10928.__hash;
  if(!(h__2192__auto____10929 == null)) {
    return h__2192__auto____10929
  }else {
    var h__2192__auto____10930 = cljs.core.hash_coll.call(null, coll);
    this__10928.__hash = h__2192__auto____10930;
    return h__2192__auto____10930
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__10931 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__10932 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__10933 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__10933.key, this__10933.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__10981 = null;
  var G__10981__2 = function(this_sym10934, k) {
    var this__10936 = this;
    var this_sym10934__10937 = this;
    var node__10938 = this_sym10934__10937;
    return node__10938.cljs$core$ILookup$_lookup$arity$2(node__10938, k)
  };
  var G__10981__3 = function(this_sym10935, k, not_found) {
    var this__10936 = this;
    var this_sym10935__10939 = this;
    var node__10940 = this_sym10935__10939;
    return node__10940.cljs$core$ILookup$_lookup$arity$3(node__10940, k, not_found)
  };
  G__10981 = function(this_sym10935, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10981__2.call(this, this_sym10935, k);
      case 3:
        return G__10981__3.call(this, this_sym10935, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10981
}();
cljs.core.RedNode.prototype.apply = function(this_sym10926, args10927) {
  var this__10941 = this;
  return this_sym10926.call.apply(this_sym10926, [this_sym10926].concat(args10927.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__10942 = this;
  return cljs.core.PersistentVector.fromArray([this__10942.key, this__10942.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10943 = this;
  return this__10943.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10944 = this;
  return this__10944.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__10945 = this;
  var node__10946 = this;
  return new cljs.core.RedNode(this__10945.key, this__10945.val, this__10945.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__10947 = this;
  var node__10948 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__10949 = this;
  var node__10950 = this;
  return new cljs.core.RedNode(this__10949.key, this__10949.val, this__10949.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__10951 = this;
  var node__10952 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__10953 = this;
  var node__10954 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10954, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__10955 = this;
  var node__10956 = this;
  return new cljs.core.RedNode(this__10955.key, this__10955.val, del, this__10955.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__10957 = this;
  var node__10958 = this;
  return new cljs.core.RedNode(this__10957.key, this__10957.val, ins, this__10957.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__10959 = this;
  var node__10960 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10959.left)) {
    return new cljs.core.RedNode(this__10959.key, this__10959.val, this__10959.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__10959.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10959.right)) {
      return new cljs.core.RedNode(this__10959.right.key, this__10959.right.val, new cljs.core.BlackNode(this__10959.key, this__10959.val, this__10959.left, this__10959.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__10959.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__10960, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__10982 = null;
  var G__10982__0 = function() {
    var this__10961 = this;
    var this__10963 = this;
    return cljs.core.pr_str.call(null, this__10963)
  };
  G__10982 = function() {
    switch(arguments.length) {
      case 0:
        return G__10982__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10982
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__10964 = this;
  var node__10965 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10964.right)) {
    return new cljs.core.RedNode(this__10964.key, this__10964.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10964.left, null), this__10964.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10964.left)) {
      return new cljs.core.RedNode(this__10964.left.key, this__10964.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10964.left.left, null), new cljs.core.BlackNode(this__10964.key, this__10964.val, this__10964.left.right, this__10964.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10965, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__10966 = this;
  var node__10967 = this;
  return new cljs.core.BlackNode(this__10966.key, this__10966.val, this__10966.left, this__10966.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10968 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10969 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10970 = this;
  return cljs.core.list.call(null, this__10970.key, this__10970.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10971 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10972 = this;
  return this__10972.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10973 = this;
  return cljs.core.PersistentVector.fromArray([this__10973.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10974 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10974.key, this__10974.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10975 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10976 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10976.key, this__10976.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10977 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10978 = this;
  if(n === 0) {
    return this__10978.key
  }else {
    if(n === 1) {
      return this__10978.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__10979 = this;
  if(n === 0) {
    return this__10979.key
  }else {
    if(n === 1) {
      return this__10979.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__10980 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__10986 = comp.call(null, k, tree.key);
    if(c__10986 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__10986 < 0) {
        var ins__10987 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__10987 == null)) {
          return tree.add_left(ins__10987)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__10988 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__10988 == null)) {
            return tree.add_right(ins__10988)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__10991 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10991)) {
            return new cljs.core.RedNode(app__10991.key, app__10991.val, new cljs.core.RedNode(left.key, left.val, left.left, app__10991.left, null), new cljs.core.RedNode(right.key, right.val, app__10991.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__10991, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__10992 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10992)) {
              return new cljs.core.RedNode(app__10992.key, app__10992.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__10992.left, null), new cljs.core.BlackNode(right.key, right.val, app__10992.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__10992, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__10998 = comp.call(null, k, tree.key);
    if(c__10998 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__10998 < 0) {
        var del__10999 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____11000 = !(del__10999 == null);
          if(or__3824__auto____11000) {
            return or__3824__auto____11000
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__10999, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__10999, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__11001 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____11002 = !(del__11001 == null);
            if(or__3824__auto____11002) {
              return or__3824__auto____11002
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__11001)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__11001, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__11005 = tree.key;
  var c__11006 = comp.call(null, k, tk__11005);
  if(c__11006 === 0) {
    return tree.replace(tk__11005, v, tree.left, tree.right)
  }else {
    if(c__11006 < 0) {
      return tree.replace(tk__11005, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__11005, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__11009 = this;
  var h__2192__auto____11010 = this__11009.__hash;
  if(!(h__2192__auto____11010 == null)) {
    return h__2192__auto____11010
  }else {
    var h__2192__auto____11011 = cljs.core.hash_imap.call(null, coll);
    this__11009.__hash = h__2192__auto____11011;
    return h__2192__auto____11011
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__11012 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__11013 = this;
  var n__11014 = coll.entry_at(k);
  if(!(n__11014 == null)) {
    return n__11014.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__11015 = this;
  var found__11016 = [null];
  var t__11017 = cljs.core.tree_map_add.call(null, this__11015.comp, this__11015.tree, k, v, found__11016);
  if(t__11017 == null) {
    var found_node__11018 = cljs.core.nth.call(null, found__11016, 0);
    if(cljs.core._EQ_.call(null, v, found_node__11018.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__11015.comp, cljs.core.tree_map_replace.call(null, this__11015.comp, this__11015.tree, k, v), this__11015.cnt, this__11015.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__11015.comp, t__11017.blacken(), this__11015.cnt + 1, this__11015.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__11019 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__11053 = null;
  var G__11053__2 = function(this_sym11020, k) {
    var this__11022 = this;
    var this_sym11020__11023 = this;
    var coll__11024 = this_sym11020__11023;
    return coll__11024.cljs$core$ILookup$_lookup$arity$2(coll__11024, k)
  };
  var G__11053__3 = function(this_sym11021, k, not_found) {
    var this__11022 = this;
    var this_sym11021__11025 = this;
    var coll__11026 = this_sym11021__11025;
    return coll__11026.cljs$core$ILookup$_lookup$arity$3(coll__11026, k, not_found)
  };
  G__11053 = function(this_sym11021, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11053__2.call(this, this_sym11021, k);
      case 3:
        return G__11053__3.call(this, this_sym11021, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11053
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym11007, args11008) {
  var this__11027 = this;
  return this_sym11007.call.apply(this_sym11007, [this_sym11007].concat(args11008.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__11028 = this;
  if(!(this__11028.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__11028.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__11029 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__11030 = this;
  if(this__11030.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__11030.tree, false, this__11030.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__11031 = this;
  var this__11032 = this;
  return cljs.core.pr_str.call(null, this__11032)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__11033 = this;
  var coll__11034 = this;
  var t__11035 = this__11033.tree;
  while(true) {
    if(!(t__11035 == null)) {
      var c__11036 = this__11033.comp.call(null, k, t__11035.key);
      if(c__11036 === 0) {
        return t__11035
      }else {
        if(c__11036 < 0) {
          var G__11054 = t__11035.left;
          t__11035 = G__11054;
          continue
        }else {
          if("\ufdd0'else") {
            var G__11055 = t__11035.right;
            t__11035 = G__11055;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__11037 = this;
  if(this__11037.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__11037.tree, ascending_QMARK_, this__11037.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__11038 = this;
  if(this__11038.cnt > 0) {
    var stack__11039 = null;
    var t__11040 = this__11038.tree;
    while(true) {
      if(!(t__11040 == null)) {
        var c__11041 = this__11038.comp.call(null, k, t__11040.key);
        if(c__11041 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__11039, t__11040), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__11041 < 0) {
              var G__11056 = cljs.core.conj.call(null, stack__11039, t__11040);
              var G__11057 = t__11040.left;
              stack__11039 = G__11056;
              t__11040 = G__11057;
              continue
            }else {
              var G__11058 = stack__11039;
              var G__11059 = t__11040.right;
              stack__11039 = G__11058;
              t__11040 = G__11059;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__11041 > 0) {
                var G__11060 = cljs.core.conj.call(null, stack__11039, t__11040);
                var G__11061 = t__11040.right;
                stack__11039 = G__11060;
                t__11040 = G__11061;
                continue
              }else {
                var G__11062 = stack__11039;
                var G__11063 = t__11040.left;
                stack__11039 = G__11062;
                t__11040 = G__11063;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__11039 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__11039, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__11042 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__11043 = this;
  return this__11043.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11044 = this;
  if(this__11044.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__11044.tree, true, this__11044.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11045 = this;
  return this__11045.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11046 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11047 = this;
  return new cljs.core.PersistentTreeMap(this__11047.comp, this__11047.tree, this__11047.cnt, meta, this__11047.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11048 = this;
  return this__11048.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11049 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__11049.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__11050 = this;
  var found__11051 = [null];
  var t__11052 = cljs.core.tree_map_remove.call(null, this__11050.comp, this__11050.tree, k, found__11051);
  if(t__11052 == null) {
    if(cljs.core.nth.call(null, found__11051, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__11050.comp, null, 0, this__11050.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__11050.comp, t__11052.blacken(), this__11050.cnt - 1, this__11050.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__11066 = cljs.core.seq.call(null, keyvals);
    var out__11067 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__11066) {
        var G__11068 = cljs.core.nnext.call(null, in__11066);
        var G__11069 = cljs.core.assoc_BANG_.call(null, out__11067, cljs.core.first.call(null, in__11066), cljs.core.second.call(null, in__11066));
        in__11066 = G__11068;
        out__11067 = G__11069;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__11067)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__11070) {
    var keyvals = cljs.core.seq(arglist__11070);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__11071) {
    var keyvals = cljs.core.seq(arglist__11071);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__11075 = [];
    var obj__11076 = {};
    var kvs__11077 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__11077) {
        ks__11075.push(cljs.core.first.call(null, kvs__11077));
        obj__11076[cljs.core.first.call(null, kvs__11077)] = cljs.core.second.call(null, kvs__11077);
        var G__11078 = cljs.core.nnext.call(null, kvs__11077);
        kvs__11077 = G__11078;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__11075, obj__11076)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__11079) {
    var keyvals = cljs.core.seq(arglist__11079);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__11082 = cljs.core.seq.call(null, keyvals);
    var out__11083 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__11082) {
        var G__11084 = cljs.core.nnext.call(null, in__11082);
        var G__11085 = cljs.core.assoc.call(null, out__11083, cljs.core.first.call(null, in__11082), cljs.core.second.call(null, in__11082));
        in__11082 = G__11084;
        out__11083 = G__11085;
        continue
      }else {
        return out__11083
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__11086) {
    var keyvals = cljs.core.seq(arglist__11086);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__11089 = cljs.core.seq.call(null, keyvals);
    var out__11090 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__11089) {
        var G__11091 = cljs.core.nnext.call(null, in__11089);
        var G__11092 = cljs.core.assoc.call(null, out__11090, cljs.core.first.call(null, in__11089), cljs.core.second.call(null, in__11089));
        in__11089 = G__11091;
        out__11090 = G__11092;
        continue
      }else {
        return out__11090
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__11093) {
    var comparator = cljs.core.first(arglist__11093);
    var keyvals = cljs.core.rest(arglist__11093);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__11094_SHARP_, p2__11095_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____11097 = p1__11094_SHARP_;
          if(cljs.core.truth_(or__3824__auto____11097)) {
            return or__3824__auto____11097
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__11095_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__11098) {
    var maps = cljs.core.seq(arglist__11098);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__11106 = function(m, e) {
        var k__11104 = cljs.core.first.call(null, e);
        var v__11105 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__11104)) {
          return cljs.core.assoc.call(null, m, k__11104, f.call(null, cljs.core._lookup.call(null, m, k__11104, null), v__11105))
        }else {
          return cljs.core.assoc.call(null, m, k__11104, v__11105)
        }
      };
      var merge2__11108 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__11106, function() {
          var or__3824__auto____11107 = m1;
          if(cljs.core.truth_(or__3824__auto____11107)) {
            return or__3824__auto____11107
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__11108, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__11109) {
    var f = cljs.core.first(arglist__11109);
    var maps = cljs.core.rest(arglist__11109);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__11114 = cljs.core.ObjMap.EMPTY;
  var keys__11115 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__11115) {
      var key__11116 = cljs.core.first.call(null, keys__11115);
      var entry__11117 = cljs.core._lookup.call(null, map, key__11116, "\ufdd0'cljs.core/not-found");
      var G__11118 = cljs.core.not_EQ_.call(null, entry__11117, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__11114, key__11116, entry__11117) : ret__11114;
      var G__11119 = cljs.core.next.call(null, keys__11115);
      ret__11114 = G__11118;
      keys__11115 = G__11119;
      continue
    }else {
      return ret__11114
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__11123 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__11123.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__11124 = this;
  var h__2192__auto____11125 = this__11124.__hash;
  if(!(h__2192__auto____11125 == null)) {
    return h__2192__auto____11125
  }else {
    var h__2192__auto____11126 = cljs.core.hash_iset.call(null, coll);
    this__11124.__hash = h__2192__auto____11126;
    return h__2192__auto____11126
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__11127 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__11128 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__11128.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__11149 = null;
  var G__11149__2 = function(this_sym11129, k) {
    var this__11131 = this;
    var this_sym11129__11132 = this;
    var coll__11133 = this_sym11129__11132;
    return coll__11133.cljs$core$ILookup$_lookup$arity$2(coll__11133, k)
  };
  var G__11149__3 = function(this_sym11130, k, not_found) {
    var this__11131 = this;
    var this_sym11130__11134 = this;
    var coll__11135 = this_sym11130__11134;
    return coll__11135.cljs$core$ILookup$_lookup$arity$3(coll__11135, k, not_found)
  };
  G__11149 = function(this_sym11130, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11149__2.call(this, this_sym11130, k);
      case 3:
        return G__11149__3.call(this, this_sym11130, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11149
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym11121, args11122) {
  var this__11136 = this;
  return this_sym11121.call.apply(this_sym11121, [this_sym11121].concat(args11122.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11137 = this;
  return new cljs.core.PersistentHashSet(this__11137.meta, cljs.core.assoc.call(null, this__11137.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__11138 = this;
  var this__11139 = this;
  return cljs.core.pr_str.call(null, this__11139)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11140 = this;
  return cljs.core.keys.call(null, this__11140.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__11141 = this;
  return new cljs.core.PersistentHashSet(this__11141.meta, cljs.core.dissoc.call(null, this__11141.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11142 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11143 = this;
  var and__3822__auto____11144 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____11144) {
    var and__3822__auto____11145 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____11145) {
      return cljs.core.every_QMARK_.call(null, function(p1__11120_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__11120_SHARP_)
      }, other)
    }else {
      return and__3822__auto____11145
    }
  }else {
    return and__3822__auto____11144
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11146 = this;
  return new cljs.core.PersistentHashSet(meta, this__11146.hash_map, this__11146.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11147 = this;
  return this__11147.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11148 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__11148.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__11150 = cljs.core.count.call(null, items);
  var i__11151 = 0;
  var out__11152 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__11151 < len__11150) {
      var G__11153 = i__11151 + 1;
      var G__11154 = cljs.core.conj_BANG_.call(null, out__11152, items[i__11151]);
      i__11151 = G__11153;
      out__11152 = G__11154;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__11152)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__11172 = null;
  var G__11172__2 = function(this_sym11158, k) {
    var this__11160 = this;
    var this_sym11158__11161 = this;
    var tcoll__11162 = this_sym11158__11161;
    if(cljs.core._lookup.call(null, this__11160.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__11172__3 = function(this_sym11159, k, not_found) {
    var this__11160 = this;
    var this_sym11159__11163 = this;
    var tcoll__11164 = this_sym11159__11163;
    if(cljs.core._lookup.call(null, this__11160.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__11172 = function(this_sym11159, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11172__2.call(this, this_sym11159, k);
      case 3:
        return G__11172__3.call(this, this_sym11159, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11172
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym11156, args11157) {
  var this__11165 = this;
  return this_sym11156.call.apply(this_sym11156, [this_sym11156].concat(args11157.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__11166 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__11167 = this;
  if(cljs.core._lookup.call(null, this__11167.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__11168 = this;
  return cljs.core.count.call(null, this__11168.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__11169 = this;
  this__11169.transient_map = cljs.core.dissoc_BANG_.call(null, this__11169.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__11170 = this;
  this__11170.transient_map = cljs.core.assoc_BANG_.call(null, this__11170.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__11171 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__11171.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__11175 = this;
  var h__2192__auto____11176 = this__11175.__hash;
  if(!(h__2192__auto____11176 == null)) {
    return h__2192__auto____11176
  }else {
    var h__2192__auto____11177 = cljs.core.hash_iset.call(null, coll);
    this__11175.__hash = h__2192__auto____11177;
    return h__2192__auto____11177
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__11178 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__11179 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__11179.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__11205 = null;
  var G__11205__2 = function(this_sym11180, k) {
    var this__11182 = this;
    var this_sym11180__11183 = this;
    var coll__11184 = this_sym11180__11183;
    return coll__11184.cljs$core$ILookup$_lookup$arity$2(coll__11184, k)
  };
  var G__11205__3 = function(this_sym11181, k, not_found) {
    var this__11182 = this;
    var this_sym11181__11185 = this;
    var coll__11186 = this_sym11181__11185;
    return coll__11186.cljs$core$ILookup$_lookup$arity$3(coll__11186, k, not_found)
  };
  G__11205 = function(this_sym11181, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11205__2.call(this, this_sym11181, k);
      case 3:
        return G__11205__3.call(this, this_sym11181, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11205
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym11173, args11174) {
  var this__11187 = this;
  return this_sym11173.call.apply(this_sym11173, [this_sym11173].concat(args11174.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11188 = this;
  return new cljs.core.PersistentTreeSet(this__11188.meta, cljs.core.assoc.call(null, this__11188.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__11189 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__11189.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__11190 = this;
  var this__11191 = this;
  return cljs.core.pr_str.call(null, this__11191)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__11192 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__11192.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__11193 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__11193.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__11194 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__11195 = this;
  return cljs.core._comparator.call(null, this__11195.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11196 = this;
  return cljs.core.keys.call(null, this__11196.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__11197 = this;
  return new cljs.core.PersistentTreeSet(this__11197.meta, cljs.core.dissoc.call(null, this__11197.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11198 = this;
  return cljs.core.count.call(null, this__11198.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11199 = this;
  var and__3822__auto____11200 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____11200) {
    var and__3822__auto____11201 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____11201) {
      return cljs.core.every_QMARK_.call(null, function(p1__11155_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__11155_SHARP_)
      }, other)
    }else {
      return and__3822__auto____11201
    }
  }else {
    return and__3822__auto____11200
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11202 = this;
  return new cljs.core.PersistentTreeSet(meta, this__11202.tree_map, this__11202.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11203 = this;
  return this__11203.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11204 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__11204.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__11210__delegate = function(keys) {
      var in__11208 = cljs.core.seq.call(null, keys);
      var out__11209 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__11208)) {
          var G__11211 = cljs.core.next.call(null, in__11208);
          var G__11212 = cljs.core.conj_BANG_.call(null, out__11209, cljs.core.first.call(null, in__11208));
          in__11208 = G__11211;
          out__11209 = G__11212;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__11209)
        }
        break
      }
    };
    var G__11210 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11210__delegate.call(this, keys)
    };
    G__11210.cljs$lang$maxFixedArity = 0;
    G__11210.cljs$lang$applyTo = function(arglist__11213) {
      var keys = cljs.core.seq(arglist__11213);
      return G__11210__delegate(keys)
    };
    G__11210.cljs$lang$arity$variadic = G__11210__delegate;
    return G__11210
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__11214) {
    var keys = cljs.core.seq(arglist__11214);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__11216) {
    var comparator = cljs.core.first(arglist__11216);
    var keys = cljs.core.rest(arglist__11216);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__11222 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____11223 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____11223)) {
        var e__11224 = temp__3971__auto____11223;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__11224))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__11222, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__11215_SHARP_) {
      var temp__3971__auto____11225 = cljs.core.find.call(null, smap, p1__11215_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____11225)) {
        var e__11226 = temp__3971__auto____11225;
        return cljs.core.second.call(null, e__11226)
      }else {
        return p1__11215_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__11256 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__11249, seen) {
        while(true) {
          var vec__11250__11251 = p__11249;
          var f__11252 = cljs.core.nth.call(null, vec__11250__11251, 0, null);
          var xs__11253 = vec__11250__11251;
          var temp__3974__auto____11254 = cljs.core.seq.call(null, xs__11253);
          if(temp__3974__auto____11254) {
            var s__11255 = temp__3974__auto____11254;
            if(cljs.core.contains_QMARK_.call(null, seen, f__11252)) {
              var G__11257 = cljs.core.rest.call(null, s__11255);
              var G__11258 = seen;
              p__11249 = G__11257;
              seen = G__11258;
              continue
            }else {
              return cljs.core.cons.call(null, f__11252, step.call(null, cljs.core.rest.call(null, s__11255), cljs.core.conj.call(null, seen, f__11252)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__11256.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__11261 = cljs.core.PersistentVector.EMPTY;
  var s__11262 = s;
  while(true) {
    if(cljs.core.next.call(null, s__11262)) {
      var G__11263 = cljs.core.conj.call(null, ret__11261, cljs.core.first.call(null, s__11262));
      var G__11264 = cljs.core.next.call(null, s__11262);
      ret__11261 = G__11263;
      s__11262 = G__11264;
      continue
    }else {
      return cljs.core.seq.call(null, ret__11261)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____11267 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____11267) {
        return or__3824__auto____11267
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__11268 = x.lastIndexOf("/");
      if(i__11268 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__11268 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____11271 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____11271) {
      return or__3824__auto____11271
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__11272 = x.lastIndexOf("/");
    if(i__11272 > -1) {
      return cljs.core.subs.call(null, x, 2, i__11272)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__11279 = cljs.core.ObjMap.EMPTY;
  var ks__11280 = cljs.core.seq.call(null, keys);
  var vs__11281 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____11282 = ks__11280;
      if(and__3822__auto____11282) {
        return vs__11281
      }else {
        return and__3822__auto____11282
      }
    }()) {
      var G__11283 = cljs.core.assoc.call(null, map__11279, cljs.core.first.call(null, ks__11280), cljs.core.first.call(null, vs__11281));
      var G__11284 = cljs.core.next.call(null, ks__11280);
      var G__11285 = cljs.core.next.call(null, vs__11281);
      map__11279 = G__11283;
      ks__11280 = G__11284;
      vs__11281 = G__11285;
      continue
    }else {
      return map__11279
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__11288__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__11273_SHARP_, p2__11274_SHARP_) {
        return max_key.call(null, k, p1__11273_SHARP_, p2__11274_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__11288 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11288__delegate.call(this, k, x, y, more)
    };
    G__11288.cljs$lang$maxFixedArity = 3;
    G__11288.cljs$lang$applyTo = function(arglist__11289) {
      var k = cljs.core.first(arglist__11289);
      var x = cljs.core.first(cljs.core.next(arglist__11289));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11289)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11289)));
      return G__11288__delegate(k, x, y, more)
    };
    G__11288.cljs$lang$arity$variadic = G__11288__delegate;
    return G__11288
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__11290__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__11286_SHARP_, p2__11287_SHARP_) {
        return min_key.call(null, k, p1__11286_SHARP_, p2__11287_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__11290 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11290__delegate.call(this, k, x, y, more)
    };
    G__11290.cljs$lang$maxFixedArity = 3;
    G__11290.cljs$lang$applyTo = function(arglist__11291) {
      var k = cljs.core.first(arglist__11291);
      var x = cljs.core.first(cljs.core.next(arglist__11291));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11291)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11291)));
      return G__11290__delegate(k, x, y, more)
    };
    G__11290.cljs$lang$arity$variadic = G__11290__delegate;
    return G__11290
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____11294 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____11294) {
        var s__11295 = temp__3974__auto____11294;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__11295), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__11295)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____11298 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____11298) {
      var s__11299 = temp__3974__auto____11298;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__11299)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__11299), take_while.call(null, pred, cljs.core.rest.call(null, s__11299)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__11301 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__11301.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__11313 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____11314 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____11314)) {
        var vec__11315__11316 = temp__3974__auto____11314;
        var e__11317 = cljs.core.nth.call(null, vec__11315__11316, 0, null);
        var s__11318 = vec__11315__11316;
        if(cljs.core.truth_(include__11313.call(null, e__11317))) {
          return s__11318
        }else {
          return cljs.core.next.call(null, s__11318)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__11313, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____11319 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____11319)) {
      var vec__11320__11321 = temp__3974__auto____11319;
      var e__11322 = cljs.core.nth.call(null, vec__11320__11321, 0, null);
      var s__11323 = vec__11320__11321;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__11322)) ? s__11323 : cljs.core.next.call(null, s__11323))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__11335 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____11336 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____11336)) {
        var vec__11337__11338 = temp__3974__auto____11336;
        var e__11339 = cljs.core.nth.call(null, vec__11337__11338, 0, null);
        var s__11340 = vec__11337__11338;
        if(cljs.core.truth_(include__11335.call(null, e__11339))) {
          return s__11340
        }else {
          return cljs.core.next.call(null, s__11340)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__11335, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____11341 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____11341)) {
      var vec__11342__11343 = temp__3974__auto____11341;
      var e__11344 = cljs.core.nth.call(null, vec__11342__11343, 0, null);
      var s__11345 = vec__11342__11343;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__11344)) ? s__11345 : cljs.core.next.call(null, s__11345))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__11346 = this;
  var h__2192__auto____11347 = this__11346.__hash;
  if(!(h__2192__auto____11347 == null)) {
    return h__2192__auto____11347
  }else {
    var h__2192__auto____11348 = cljs.core.hash_coll.call(null, rng);
    this__11346.__hash = h__2192__auto____11348;
    return h__2192__auto____11348
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__11349 = this;
  if(this__11349.step > 0) {
    if(this__11349.start + this__11349.step < this__11349.end) {
      return new cljs.core.Range(this__11349.meta, this__11349.start + this__11349.step, this__11349.end, this__11349.step, null)
    }else {
      return null
    }
  }else {
    if(this__11349.start + this__11349.step > this__11349.end) {
      return new cljs.core.Range(this__11349.meta, this__11349.start + this__11349.step, this__11349.end, this__11349.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__11350 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__11351 = this;
  var this__11352 = this;
  return cljs.core.pr_str.call(null, this__11352)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__11353 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__11354 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__11355 = this;
  if(this__11355.step > 0) {
    if(this__11355.start < this__11355.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__11355.start > this__11355.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__11356 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__11356.end - this__11356.start) / this__11356.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__11357 = this;
  return this__11357.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__11358 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__11358.meta, this__11358.start + this__11358.step, this__11358.end, this__11358.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__11359 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__11360 = this;
  return new cljs.core.Range(meta, this__11360.start, this__11360.end, this__11360.step, this__11360.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__11361 = this;
  return this__11361.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__11362 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__11362.start + n * this__11362.step
  }else {
    if(function() {
      var and__3822__auto____11363 = this__11362.start > this__11362.end;
      if(and__3822__auto____11363) {
        return this__11362.step === 0
      }else {
        return and__3822__auto____11363
      }
    }()) {
      return this__11362.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__11364 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__11364.start + n * this__11364.step
  }else {
    if(function() {
      var and__3822__auto____11365 = this__11364.start > this__11364.end;
      if(and__3822__auto____11365) {
        return this__11364.step === 0
      }else {
        return and__3822__auto____11365
      }
    }()) {
      return this__11364.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__11366 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__11366.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____11369 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____11369) {
      var s__11370 = temp__3974__auto____11369;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__11370), take_nth.call(null, n, cljs.core.drop.call(null, n, s__11370)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____11377 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____11377) {
      var s__11378 = temp__3974__auto____11377;
      var fst__11379 = cljs.core.first.call(null, s__11378);
      var fv__11380 = f.call(null, fst__11379);
      var run__11381 = cljs.core.cons.call(null, fst__11379, cljs.core.take_while.call(null, function(p1__11371_SHARP_) {
        return cljs.core._EQ_.call(null, fv__11380, f.call(null, p1__11371_SHARP_))
      }, cljs.core.next.call(null, s__11378)));
      return cljs.core.cons.call(null, run__11381, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__11381), s__11378))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____11396 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____11396) {
        var s__11397 = temp__3971__auto____11396;
        return reductions.call(null, f, cljs.core.first.call(null, s__11397), cljs.core.rest.call(null, s__11397))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____11398 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____11398) {
        var s__11399 = temp__3974__auto____11398;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__11399)), cljs.core.rest.call(null, s__11399))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__11402 = null;
      var G__11402__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__11402__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__11402__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__11402__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__11402__4 = function() {
        var G__11403__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__11403 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11403__delegate.call(this, x, y, z, args)
        };
        G__11403.cljs$lang$maxFixedArity = 3;
        G__11403.cljs$lang$applyTo = function(arglist__11404) {
          var x = cljs.core.first(arglist__11404);
          var y = cljs.core.first(cljs.core.next(arglist__11404));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11404)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11404)));
          return G__11403__delegate(x, y, z, args)
        };
        G__11403.cljs$lang$arity$variadic = G__11403__delegate;
        return G__11403
      }();
      G__11402 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11402__0.call(this);
          case 1:
            return G__11402__1.call(this, x);
          case 2:
            return G__11402__2.call(this, x, y);
          case 3:
            return G__11402__3.call(this, x, y, z);
          default:
            return G__11402__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11402.cljs$lang$maxFixedArity = 3;
      G__11402.cljs$lang$applyTo = G__11402__4.cljs$lang$applyTo;
      return G__11402
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__11405 = null;
      var G__11405__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__11405__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__11405__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__11405__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__11405__4 = function() {
        var G__11406__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__11406 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11406__delegate.call(this, x, y, z, args)
        };
        G__11406.cljs$lang$maxFixedArity = 3;
        G__11406.cljs$lang$applyTo = function(arglist__11407) {
          var x = cljs.core.first(arglist__11407);
          var y = cljs.core.first(cljs.core.next(arglist__11407));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11407)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11407)));
          return G__11406__delegate(x, y, z, args)
        };
        G__11406.cljs$lang$arity$variadic = G__11406__delegate;
        return G__11406
      }();
      G__11405 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11405__0.call(this);
          case 1:
            return G__11405__1.call(this, x);
          case 2:
            return G__11405__2.call(this, x, y);
          case 3:
            return G__11405__3.call(this, x, y, z);
          default:
            return G__11405__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11405.cljs$lang$maxFixedArity = 3;
      G__11405.cljs$lang$applyTo = G__11405__4.cljs$lang$applyTo;
      return G__11405
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__11408 = null;
      var G__11408__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__11408__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__11408__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__11408__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__11408__4 = function() {
        var G__11409__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__11409 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11409__delegate.call(this, x, y, z, args)
        };
        G__11409.cljs$lang$maxFixedArity = 3;
        G__11409.cljs$lang$applyTo = function(arglist__11410) {
          var x = cljs.core.first(arglist__11410);
          var y = cljs.core.first(cljs.core.next(arglist__11410));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11410)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11410)));
          return G__11409__delegate(x, y, z, args)
        };
        G__11409.cljs$lang$arity$variadic = G__11409__delegate;
        return G__11409
      }();
      G__11408 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11408__0.call(this);
          case 1:
            return G__11408__1.call(this, x);
          case 2:
            return G__11408__2.call(this, x, y);
          case 3:
            return G__11408__3.call(this, x, y, z);
          default:
            return G__11408__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11408.cljs$lang$maxFixedArity = 3;
      G__11408.cljs$lang$applyTo = G__11408__4.cljs$lang$applyTo;
      return G__11408
    }()
  };
  var juxt__4 = function() {
    var G__11411__delegate = function(f, g, h, fs) {
      var fs__11401 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__11412 = null;
        var G__11412__0 = function() {
          return cljs.core.reduce.call(null, function(p1__11382_SHARP_, p2__11383_SHARP_) {
            return cljs.core.conj.call(null, p1__11382_SHARP_, p2__11383_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__11401)
        };
        var G__11412__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__11384_SHARP_, p2__11385_SHARP_) {
            return cljs.core.conj.call(null, p1__11384_SHARP_, p2__11385_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__11401)
        };
        var G__11412__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__11386_SHARP_, p2__11387_SHARP_) {
            return cljs.core.conj.call(null, p1__11386_SHARP_, p2__11387_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__11401)
        };
        var G__11412__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__11388_SHARP_, p2__11389_SHARP_) {
            return cljs.core.conj.call(null, p1__11388_SHARP_, p2__11389_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__11401)
        };
        var G__11412__4 = function() {
          var G__11413__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__11390_SHARP_, p2__11391_SHARP_) {
              return cljs.core.conj.call(null, p1__11390_SHARP_, cljs.core.apply.call(null, p2__11391_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__11401)
          };
          var G__11413 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__11413__delegate.call(this, x, y, z, args)
          };
          G__11413.cljs$lang$maxFixedArity = 3;
          G__11413.cljs$lang$applyTo = function(arglist__11414) {
            var x = cljs.core.first(arglist__11414);
            var y = cljs.core.first(cljs.core.next(arglist__11414));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11414)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11414)));
            return G__11413__delegate(x, y, z, args)
          };
          G__11413.cljs$lang$arity$variadic = G__11413__delegate;
          return G__11413
        }();
        G__11412 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__11412__0.call(this);
            case 1:
              return G__11412__1.call(this, x);
            case 2:
              return G__11412__2.call(this, x, y);
            case 3:
              return G__11412__3.call(this, x, y, z);
            default:
              return G__11412__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__11412.cljs$lang$maxFixedArity = 3;
        G__11412.cljs$lang$applyTo = G__11412__4.cljs$lang$applyTo;
        return G__11412
      }()
    };
    var G__11411 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11411__delegate.call(this, f, g, h, fs)
    };
    G__11411.cljs$lang$maxFixedArity = 3;
    G__11411.cljs$lang$applyTo = function(arglist__11415) {
      var f = cljs.core.first(arglist__11415);
      var g = cljs.core.first(cljs.core.next(arglist__11415));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11415)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11415)));
      return G__11411__delegate(f, g, h, fs)
    };
    G__11411.cljs$lang$arity$variadic = G__11411__delegate;
    return G__11411
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__11418 = cljs.core.next.call(null, coll);
        coll = G__11418;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____11417 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____11417) {
          return n > 0
        }else {
          return and__3822__auto____11417
        }
      }())) {
        var G__11419 = n - 1;
        var G__11420 = cljs.core.next.call(null, coll);
        n = G__11419;
        coll = G__11420;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__11422 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__11422), s)) {
    if(cljs.core.count.call(null, matches__11422) === 1) {
      return cljs.core.first.call(null, matches__11422)
    }else {
      return cljs.core.vec.call(null, matches__11422)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__11424 = re.exec(s);
  if(matches__11424 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__11424) === 1) {
      return cljs.core.first.call(null, matches__11424)
    }else {
      return cljs.core.vec.call(null, matches__11424)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__11429 = cljs.core.re_find.call(null, re, s);
  var match_idx__11430 = s.search(re);
  var match_str__11431 = cljs.core.coll_QMARK_.call(null, match_data__11429) ? cljs.core.first.call(null, match_data__11429) : match_data__11429;
  var post_match__11432 = cljs.core.subs.call(null, s, match_idx__11430 + cljs.core.count.call(null, match_str__11431));
  if(cljs.core.truth_(match_data__11429)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__11429, re_seq.call(null, re, post_match__11432))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__11439__11440 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___11441 = cljs.core.nth.call(null, vec__11439__11440, 0, null);
  var flags__11442 = cljs.core.nth.call(null, vec__11439__11440, 1, null);
  var pattern__11443 = cljs.core.nth.call(null, vec__11439__11440, 2, null);
  return new RegExp(pattern__11443, flags__11442)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__11433_SHARP_) {
    return print_one.call(null, p1__11433_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____11453 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____11453)) {
            var and__3822__auto____11457 = function() {
              var G__11454__11455 = obj;
              if(G__11454__11455) {
                if(function() {
                  var or__3824__auto____11456 = G__11454__11455.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____11456) {
                    return or__3824__auto____11456
                  }else {
                    return G__11454__11455.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__11454__11455.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__11454__11455)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__11454__11455)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____11457)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____11457
            }
          }else {
            return and__3822__auto____11453
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____11458 = !(obj == null);
          if(and__3822__auto____11458) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____11458
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__11459__11460 = obj;
          if(G__11459__11460) {
            if(function() {
              var or__3824__auto____11461 = G__11459__11460.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____11461) {
                return or__3824__auto____11461
              }else {
                return G__11459__11460.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__11459__11460.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__11459__11460)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__11459__11460)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__11481 = new goog.string.StringBuffer;
  var G__11482__11483 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__11482__11483) {
    var string__11484 = cljs.core.first.call(null, G__11482__11483);
    var G__11482__11485 = G__11482__11483;
    while(true) {
      sb__11481.append(string__11484);
      var temp__3974__auto____11486 = cljs.core.next.call(null, G__11482__11485);
      if(temp__3974__auto____11486) {
        var G__11482__11487 = temp__3974__auto____11486;
        var G__11500 = cljs.core.first.call(null, G__11482__11487);
        var G__11501 = G__11482__11487;
        string__11484 = G__11500;
        G__11482__11485 = G__11501;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__11488__11489 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__11488__11489) {
    var obj__11490 = cljs.core.first.call(null, G__11488__11489);
    var G__11488__11491 = G__11488__11489;
    while(true) {
      sb__11481.append(" ");
      var G__11492__11493 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__11490, opts));
      if(G__11492__11493) {
        var string__11494 = cljs.core.first.call(null, G__11492__11493);
        var G__11492__11495 = G__11492__11493;
        while(true) {
          sb__11481.append(string__11494);
          var temp__3974__auto____11496 = cljs.core.next.call(null, G__11492__11495);
          if(temp__3974__auto____11496) {
            var G__11492__11497 = temp__3974__auto____11496;
            var G__11502 = cljs.core.first.call(null, G__11492__11497);
            var G__11503 = G__11492__11497;
            string__11494 = G__11502;
            G__11492__11495 = G__11503;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____11498 = cljs.core.next.call(null, G__11488__11491);
      if(temp__3974__auto____11498) {
        var G__11488__11499 = temp__3974__auto____11498;
        var G__11504 = cljs.core.first.call(null, G__11488__11499);
        var G__11505 = G__11488__11499;
        obj__11490 = G__11504;
        G__11488__11491 = G__11505;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__11481
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__11507 = cljs.core.pr_sb.call(null, objs, opts);
  sb__11507.append("\n");
  return[cljs.core.str(sb__11507)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__11526__11527 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__11526__11527) {
    var string__11528 = cljs.core.first.call(null, G__11526__11527);
    var G__11526__11529 = G__11526__11527;
    while(true) {
      cljs.core.string_print.call(null, string__11528);
      var temp__3974__auto____11530 = cljs.core.next.call(null, G__11526__11529);
      if(temp__3974__auto____11530) {
        var G__11526__11531 = temp__3974__auto____11530;
        var G__11544 = cljs.core.first.call(null, G__11526__11531);
        var G__11545 = G__11526__11531;
        string__11528 = G__11544;
        G__11526__11529 = G__11545;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__11532__11533 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__11532__11533) {
    var obj__11534 = cljs.core.first.call(null, G__11532__11533);
    var G__11532__11535 = G__11532__11533;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__11536__11537 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__11534, opts));
      if(G__11536__11537) {
        var string__11538 = cljs.core.first.call(null, G__11536__11537);
        var G__11536__11539 = G__11536__11537;
        while(true) {
          cljs.core.string_print.call(null, string__11538);
          var temp__3974__auto____11540 = cljs.core.next.call(null, G__11536__11539);
          if(temp__3974__auto____11540) {
            var G__11536__11541 = temp__3974__auto____11540;
            var G__11546 = cljs.core.first.call(null, G__11536__11541);
            var G__11547 = G__11536__11541;
            string__11538 = G__11546;
            G__11536__11539 = G__11547;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____11542 = cljs.core.next.call(null, G__11532__11535);
      if(temp__3974__auto____11542) {
        var G__11532__11543 = temp__3974__auto____11542;
        var G__11548 = cljs.core.first.call(null, G__11532__11543);
        var G__11549 = G__11532__11543;
        obj__11534 = G__11548;
        G__11532__11535 = G__11549;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__11550) {
    var objs = cljs.core.seq(arglist__11550);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__11551) {
    var objs = cljs.core.seq(arglist__11551);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__11552) {
    var objs = cljs.core.seq(arglist__11552);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__11553) {
    var objs = cljs.core.seq(arglist__11553);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__11554) {
    var objs = cljs.core.seq(arglist__11554);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__11555) {
    var objs = cljs.core.seq(arglist__11555);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__11556) {
    var objs = cljs.core.seq(arglist__11556);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__11557) {
    var objs = cljs.core.seq(arglist__11557);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__11558) {
    var fmt = cljs.core.first(arglist__11558);
    var args = cljs.core.rest(arglist__11558);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11559 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11559, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11560 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11560, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11561 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11561, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____11562 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____11562)) {
        var nspc__11563 = temp__3974__auto____11562;
        return[cljs.core.str(nspc__11563), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____11564 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____11564)) {
          var nspc__11565 = temp__3974__auto____11564;
          return[cljs.core.str(nspc__11565), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11566 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11566, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__11568 = function(n, len) {
    var ns__11567 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__11567) < len) {
        var G__11570 = [cljs.core.str("0"), cljs.core.str(ns__11567)].join("");
        ns__11567 = G__11570;
        continue
      }else {
        return ns__11567
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__11568.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__11568.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__11568.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__11568.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__11568.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__11568.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11569 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11569, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__11571 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__11572 = this;
  var G__11573__11574 = cljs.core.seq.call(null, this__11572.watches);
  if(G__11573__11574) {
    var G__11576__11578 = cljs.core.first.call(null, G__11573__11574);
    var vec__11577__11579 = G__11576__11578;
    var key__11580 = cljs.core.nth.call(null, vec__11577__11579, 0, null);
    var f__11581 = cljs.core.nth.call(null, vec__11577__11579, 1, null);
    var G__11573__11582 = G__11573__11574;
    var G__11576__11583 = G__11576__11578;
    var G__11573__11584 = G__11573__11582;
    while(true) {
      var vec__11585__11586 = G__11576__11583;
      var key__11587 = cljs.core.nth.call(null, vec__11585__11586, 0, null);
      var f__11588 = cljs.core.nth.call(null, vec__11585__11586, 1, null);
      var G__11573__11589 = G__11573__11584;
      f__11588.call(null, key__11587, this$, oldval, newval);
      var temp__3974__auto____11590 = cljs.core.next.call(null, G__11573__11589);
      if(temp__3974__auto____11590) {
        var G__11573__11591 = temp__3974__auto____11590;
        var G__11598 = cljs.core.first.call(null, G__11573__11591);
        var G__11599 = G__11573__11591;
        G__11576__11583 = G__11598;
        G__11573__11584 = G__11599;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__11592 = this;
  return this$.watches = cljs.core.assoc.call(null, this__11592.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__11593 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__11593.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__11594 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__11594.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__11595 = this;
  return this__11595.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__11596 = this;
  return this__11596.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__11597 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__11611__delegate = function(x, p__11600) {
      var map__11606__11607 = p__11600;
      var map__11606__11608 = cljs.core.seq_QMARK_.call(null, map__11606__11607) ? cljs.core.apply.call(null, cljs.core.hash_map, map__11606__11607) : map__11606__11607;
      var validator__11609 = cljs.core._lookup.call(null, map__11606__11608, "\ufdd0'validator", null);
      var meta__11610 = cljs.core._lookup.call(null, map__11606__11608, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__11610, validator__11609, null)
    };
    var G__11611 = function(x, var_args) {
      var p__11600 = null;
      if(goog.isDef(var_args)) {
        p__11600 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11611__delegate.call(this, x, p__11600)
    };
    G__11611.cljs$lang$maxFixedArity = 1;
    G__11611.cljs$lang$applyTo = function(arglist__11612) {
      var x = cljs.core.first(arglist__11612);
      var p__11600 = cljs.core.rest(arglist__11612);
      return G__11611__delegate(x, p__11600)
    };
    G__11611.cljs$lang$arity$variadic = G__11611__delegate;
    return G__11611
  }();
  atom = function(x, var_args) {
    var p__11600 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____11616 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____11616)) {
    var validate__11617 = temp__3974__auto____11616;
    if(cljs.core.truth_(validate__11617.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__11618 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__11618, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__11619__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__11619 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__11619__delegate.call(this, a, f, x, y, z, more)
    };
    G__11619.cljs$lang$maxFixedArity = 5;
    G__11619.cljs$lang$applyTo = function(arglist__11620) {
      var a = cljs.core.first(arglist__11620);
      var f = cljs.core.first(cljs.core.next(arglist__11620));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11620)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11620))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11620)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11620)))));
      return G__11619__delegate(a, f, x, y, z, more)
    };
    G__11619.cljs$lang$arity$variadic = G__11619__delegate;
    return G__11619
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__11621) {
    var iref = cljs.core.first(arglist__11621);
    var f = cljs.core.first(cljs.core.next(arglist__11621));
    var args = cljs.core.rest(cljs.core.next(arglist__11621));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__11622 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__11622.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__11623 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__11623.state, function(p__11624) {
    var map__11625__11626 = p__11624;
    var map__11625__11627 = cljs.core.seq_QMARK_.call(null, map__11625__11626) ? cljs.core.apply.call(null, cljs.core.hash_map, map__11625__11626) : map__11625__11626;
    var curr_state__11628 = map__11625__11627;
    var done__11629 = cljs.core._lookup.call(null, map__11625__11627, "\ufdd0'done", null);
    if(cljs.core.truth_(done__11629)) {
      return curr_state__11628
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__11623.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__11650__11651 = options;
    var map__11650__11652 = cljs.core.seq_QMARK_.call(null, map__11650__11651) ? cljs.core.apply.call(null, cljs.core.hash_map, map__11650__11651) : map__11650__11651;
    var keywordize_keys__11653 = cljs.core._lookup.call(null, map__11650__11652, "\ufdd0'keywordize-keys", null);
    var keyfn__11654 = cljs.core.truth_(keywordize_keys__11653) ? cljs.core.keyword : cljs.core.str;
    var f__11669 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2462__auto____11668 = function iter__11662(s__11663) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__11663__11666 = s__11663;
                    while(true) {
                      if(cljs.core.seq.call(null, s__11663__11666)) {
                        var k__11667 = cljs.core.first.call(null, s__11663__11666);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__11654.call(null, k__11667), thisfn.call(null, x[k__11667])], true), iter__11662.call(null, cljs.core.rest.call(null, s__11663__11666)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____11668.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__11669.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__11670) {
    var x = cljs.core.first(arglist__11670);
    var options = cljs.core.rest(arglist__11670);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__11675 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__11679__delegate = function(args) {
      var temp__3971__auto____11676 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__11675), args, null);
      if(cljs.core.truth_(temp__3971__auto____11676)) {
        var v__11677 = temp__3971__auto____11676;
        return v__11677
      }else {
        var ret__11678 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__11675, cljs.core.assoc, args, ret__11678);
        return ret__11678
      }
    };
    var G__11679 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11679__delegate.call(this, args)
    };
    G__11679.cljs$lang$maxFixedArity = 0;
    G__11679.cljs$lang$applyTo = function(arglist__11680) {
      var args = cljs.core.seq(arglist__11680);
      return G__11679__delegate(args)
    };
    G__11679.cljs$lang$arity$variadic = G__11679__delegate;
    return G__11679
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__11682 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__11682)) {
        var G__11683 = ret__11682;
        f = G__11683;
        continue
      }else {
        return ret__11682
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__11684__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__11684 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11684__delegate.call(this, f, args)
    };
    G__11684.cljs$lang$maxFixedArity = 1;
    G__11684.cljs$lang$applyTo = function(arglist__11685) {
      var f = cljs.core.first(arglist__11685);
      var args = cljs.core.rest(arglist__11685);
      return G__11684__delegate(f, args)
    };
    G__11684.cljs$lang$arity$variadic = G__11684__delegate;
    return G__11684
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__11687 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__11687, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__11687, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____11696 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____11696) {
      return or__3824__auto____11696
    }else {
      var or__3824__auto____11697 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____11697) {
        return or__3824__auto____11697
      }else {
        var and__3822__auto____11698 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____11698) {
          var and__3822__auto____11699 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____11699) {
            var and__3822__auto____11700 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____11700) {
              var ret__11701 = true;
              var i__11702 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____11703 = cljs.core.not.call(null, ret__11701);
                  if(or__3824__auto____11703) {
                    return or__3824__auto____11703
                  }else {
                    return i__11702 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__11701
                }else {
                  var G__11704 = isa_QMARK_.call(null, h, child.call(null, i__11702), parent.call(null, i__11702));
                  var G__11705 = i__11702 + 1;
                  ret__11701 = G__11704;
                  i__11702 = G__11705;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____11700
            }
          }else {
            return and__3822__auto____11699
          }
        }else {
          return and__3822__auto____11698
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__11714 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__11715 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__11716 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__11717 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____11718 = cljs.core.contains_QMARK_.call(null, tp__11714.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__11716.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__11716.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__11714, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__11717.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__11715, parent, ta__11716), "\ufdd0'descendants":tf__11717.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__11716, tag, td__11715)})
    }();
    if(cljs.core.truth_(or__3824__auto____11718)) {
      return or__3824__auto____11718
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__11723 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__11724 = cljs.core.truth_(parentMap__11723.call(null, tag)) ? cljs.core.disj.call(null, parentMap__11723.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__11725 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__11724)) ? cljs.core.assoc.call(null, parentMap__11723, tag, childsParents__11724) : cljs.core.dissoc.call(null, parentMap__11723, tag);
    var deriv_seq__11726 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__11706_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__11706_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__11706_SHARP_), cljs.core.second.call(null, p1__11706_SHARP_)))
    }, cljs.core.seq.call(null, newParents__11725)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__11723.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__11707_SHARP_, p2__11708_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__11707_SHARP_, p2__11708_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__11726))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__11734 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____11736 = cljs.core.truth_(function() {
    var and__3822__auto____11735 = xprefs__11734;
    if(cljs.core.truth_(and__3822__auto____11735)) {
      return xprefs__11734.call(null, y)
    }else {
      return and__3822__auto____11735
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____11736)) {
    return or__3824__auto____11736
  }else {
    var or__3824__auto____11738 = function() {
      var ps__11737 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__11737) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__11737), prefer_table))) {
          }else {
          }
          var G__11741 = cljs.core.rest.call(null, ps__11737);
          ps__11737 = G__11741;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____11738)) {
      return or__3824__auto____11738
    }else {
      var or__3824__auto____11740 = function() {
        var ps__11739 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__11739) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__11739), y, prefer_table))) {
            }else {
            }
            var G__11742 = cljs.core.rest.call(null, ps__11739);
            ps__11739 = G__11742;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____11740)) {
        return or__3824__auto____11740
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____11744 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____11744)) {
    return or__3824__auto____11744
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__11762 = cljs.core.reduce.call(null, function(be, p__11754) {
    var vec__11755__11756 = p__11754;
    var k__11757 = cljs.core.nth.call(null, vec__11755__11756, 0, null);
    var ___11758 = cljs.core.nth.call(null, vec__11755__11756, 1, null);
    var e__11759 = vec__11755__11756;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__11757)) {
      var be2__11761 = cljs.core.truth_(function() {
        var or__3824__auto____11760 = be == null;
        if(or__3824__auto____11760) {
          return or__3824__auto____11760
        }else {
          return cljs.core.dominates.call(null, k__11757, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__11759 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__11761), k__11757, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__11757), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__11761)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__11761
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__11762)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__11762));
      return cljs.core.second.call(null, best_entry__11762)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____11767 = mf;
    if(and__3822__auto____11767) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____11767
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____11768 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11769 = cljs.core._reset[goog.typeOf(x__2363__auto____11768)];
      if(or__3824__auto____11769) {
        return or__3824__auto____11769
      }else {
        var or__3824__auto____11770 = cljs.core._reset["_"];
        if(or__3824__auto____11770) {
          return or__3824__auto____11770
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____11775 = mf;
    if(and__3822__auto____11775) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____11775
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____11776 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11777 = cljs.core._add_method[goog.typeOf(x__2363__auto____11776)];
      if(or__3824__auto____11777) {
        return or__3824__auto____11777
      }else {
        var or__3824__auto____11778 = cljs.core._add_method["_"];
        if(or__3824__auto____11778) {
          return or__3824__auto____11778
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____11783 = mf;
    if(and__3822__auto____11783) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____11783
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____11784 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11785 = cljs.core._remove_method[goog.typeOf(x__2363__auto____11784)];
      if(or__3824__auto____11785) {
        return or__3824__auto____11785
      }else {
        var or__3824__auto____11786 = cljs.core._remove_method["_"];
        if(or__3824__auto____11786) {
          return or__3824__auto____11786
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____11791 = mf;
    if(and__3822__auto____11791) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____11791
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____11792 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11793 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____11792)];
      if(or__3824__auto____11793) {
        return or__3824__auto____11793
      }else {
        var or__3824__auto____11794 = cljs.core._prefer_method["_"];
        if(or__3824__auto____11794) {
          return or__3824__auto____11794
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____11799 = mf;
    if(and__3822__auto____11799) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____11799
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____11800 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11801 = cljs.core._get_method[goog.typeOf(x__2363__auto____11800)];
      if(or__3824__auto____11801) {
        return or__3824__auto____11801
      }else {
        var or__3824__auto____11802 = cljs.core._get_method["_"];
        if(or__3824__auto____11802) {
          return or__3824__auto____11802
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____11807 = mf;
    if(and__3822__auto____11807) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____11807
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____11808 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11809 = cljs.core._methods[goog.typeOf(x__2363__auto____11808)];
      if(or__3824__auto____11809) {
        return or__3824__auto____11809
      }else {
        var or__3824__auto____11810 = cljs.core._methods["_"];
        if(or__3824__auto____11810) {
          return or__3824__auto____11810
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____11815 = mf;
    if(and__3822__auto____11815) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____11815
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____11816 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11817 = cljs.core._prefers[goog.typeOf(x__2363__auto____11816)];
      if(or__3824__auto____11817) {
        return or__3824__auto____11817
      }else {
        var or__3824__auto____11818 = cljs.core._prefers["_"];
        if(or__3824__auto____11818) {
          return or__3824__auto____11818
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____11823 = mf;
    if(and__3822__auto____11823) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____11823
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____11824 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11825 = cljs.core._dispatch[goog.typeOf(x__2363__auto____11824)];
      if(or__3824__auto____11825) {
        return or__3824__auto____11825
      }else {
        var or__3824__auto____11826 = cljs.core._dispatch["_"];
        if(or__3824__auto____11826) {
          return or__3824__auto____11826
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__11829 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__11830 = cljs.core._get_method.call(null, mf, dispatch_val__11829);
  if(cljs.core.truth_(target_fn__11830)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__11829)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__11830, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__11831 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__11832 = this;
  cljs.core.swap_BANG_.call(null, this__11832.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__11832.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__11832.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__11832.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__11833 = this;
  cljs.core.swap_BANG_.call(null, this__11833.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__11833.method_cache, this__11833.method_table, this__11833.cached_hierarchy, this__11833.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__11834 = this;
  cljs.core.swap_BANG_.call(null, this__11834.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__11834.method_cache, this__11834.method_table, this__11834.cached_hierarchy, this__11834.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__11835 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__11835.cached_hierarchy), cljs.core.deref.call(null, this__11835.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__11835.method_cache, this__11835.method_table, this__11835.cached_hierarchy, this__11835.hierarchy)
  }
  var temp__3971__auto____11836 = cljs.core.deref.call(null, this__11835.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____11836)) {
    var target_fn__11837 = temp__3971__auto____11836;
    return target_fn__11837
  }else {
    var temp__3971__auto____11838 = cljs.core.find_and_cache_best_method.call(null, this__11835.name, dispatch_val, this__11835.hierarchy, this__11835.method_table, this__11835.prefer_table, this__11835.method_cache, this__11835.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____11838)) {
      var target_fn__11839 = temp__3971__auto____11838;
      return target_fn__11839
    }else {
      return cljs.core.deref.call(null, this__11835.method_table).call(null, this__11835.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__11840 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__11840.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__11840.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__11840.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__11840.method_cache, this__11840.method_table, this__11840.cached_hierarchy, this__11840.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__11841 = this;
  return cljs.core.deref.call(null, this__11841.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__11842 = this;
  return cljs.core.deref.call(null, this__11842.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__11843 = this;
  return cljs.core.do_dispatch.call(null, mf, this__11843.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__11845__delegate = function(_, args) {
    var self__11844 = this;
    return cljs.core._dispatch.call(null, self__11844, args)
  };
  var G__11845 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__11845__delegate.call(this, _, args)
  };
  G__11845.cljs$lang$maxFixedArity = 1;
  G__11845.cljs$lang$applyTo = function(arglist__11846) {
    var _ = cljs.core.first(arglist__11846);
    var args = cljs.core.rest(arglist__11846);
    return G__11845__delegate(_, args)
  };
  G__11845.cljs$lang$arity$variadic = G__11845__delegate;
  return G__11845
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__11847 = this;
  return cljs.core._dispatch.call(null, self__11847, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__11848 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_11850, _) {
  var this__11849 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__11849.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__11851 = this;
  var and__3822__auto____11852 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____11852) {
    return this__11851.uuid === other.uuid
  }else {
    return and__3822__auto____11852
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__11853 = this;
  var this__11854 = this;
  return cljs.core.pr_str.call(null, this__11854)
};
cljs.core.UUID;
goog.provide("fb.jq");
goog.require("cljs.core");
fb.jq.$ = jQuery;
fb.jq.$.prototype.cljs$core$IReduce$ = true;
fb.jq.$.prototype.cljs$core$IReduce$_reduce$arity$2 = function(this$, f) {
  return cljs.core.ci_reduce.call(null, this$, f)
};
fb.jq.$.prototype.cljs$core$IReduce$_reduce$arity$3 = function(this$, f, start) {
  return cljs.core.ci_reduce.call(null, this$, f, start)
};
fb.jq.$.prototype.cljs$core$ILookup$ = true;
fb.jq.$.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this$, k) {
  var or__3824__auto____158782 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3824__auto____158782)) {
    return or__3824__auto____158782
  }else {
    return null
  }
};
fb.jq.$.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this$, k, not_found) {
  return cljs.core._nth.call(null, this$, k, not_found)
};
fb.jq.$.prototype.cljs$core$ISequential$ = true;
fb.jq.$.prototype.cljs$core$IIndexed$ = true;
fb.jq.$.prototype.cljs$core$IIndexed$_nth$arity$2 = function(this$, n) {
  if(n < cljs.core.count.call(null, this$)) {
    return this$.slice(n, n + 1)
  }else {
    return null
  }
};
fb.jq.$.prototype.cljs$core$IIndexed$_nth$arity$3 = function(this$, n, not_found) {
  if(n < cljs.core.count.call(null, this$)) {
    return this$.slice(n, n + 1)
  }else {
    if(void 0 === not_found) {
      return null
    }else {
      return not_found
    }
  }
};
fb.jq.$.prototype.cljs$core$ICounted$ = true;
fb.jq.$.prototype.cljs$core$ICounted$_count$arity$1 = function(this$) {
  return this$.size()
};
fb.jq.$.prototype.cljs$core$ISeq$ = true;
fb.jq.$.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  return this$.get(0)
};
fb.jq.$.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  if(cljs.core.count.call(null, this$) > 1) {
    return this$.slice(1)
  }else {
    return cljs.core.list.call(null)
  }
};
fb.jq.$.prototype.cljs$core$ISeqable$ = true;
fb.jq.$.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  if(cljs.core.truth_(this$.get(0))) {
    return this$
  }else {
    return null
  }
};
fb.jq.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        return cljs.core.reduce.call(null, function(m, p__158788) {
          var vec__158789__158790 = p__158788;
          var k__158791 = cljs.core.nth.call(null, vec__158789__158790, 0, null);
          var v__158792 = cljs.core.nth.call(null, vec__158789__158790, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__158791), clj__GT_js.call(null, v__158792))
        }, cljs.core.ObjMap.EMPTY, x).strobj
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
fb.jq.map__GT_js = function map__GT_js(m) {
  var out__158813 = {};
  var G__158814__158815 = cljs.core.seq.call(null, m);
  if(G__158814__158815) {
    var G__158817__158819 = cljs.core.first.call(null, G__158814__158815);
    var vec__158818__158820 = G__158817__158819;
    var k__158821 = cljs.core.nth.call(null, vec__158818__158820, 0, null);
    var v__158822 = cljs.core.nth.call(null, vec__158818__158820, 1, null);
    var G__158814__158823 = G__158814__158815;
    var G__158817__158824 = G__158817__158819;
    var G__158814__158825 = G__158814__158823;
    while(true) {
      var vec__158826__158827 = G__158817__158824;
      var k__158828 = cljs.core.nth.call(null, vec__158826__158827, 0, null);
      var v__158829 = cljs.core.nth.call(null, vec__158826__158827, 1, null);
      var G__158814__158830 = G__158814__158825;
      out__158813[cljs.core.name.call(null, k__158828)] = v__158829;
      var temp__3974__auto____158831 = cljs.core.next.call(null, G__158814__158830);
      if(temp__3974__auto____158831) {
        var G__158814__158832 = temp__3974__auto____158831;
        var G__158833 = cljs.core.first.call(null, G__158814__158832);
        var G__158834 = G__158814__158832;
        G__158817__158824 = G__158833;
        G__158814__158825 = G__158834;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__158813
};
goog.provide("fb.misc");
goog.require("cljs.core");
goog.require("fb.jq");
goog.require("fb.jq");
fb.misc.mk_settings = function mk_settings(r) {
  var i__75820 = r.rows.item(0);
  return cljs.core.ObjMap.fromObject(["\ufdd0'menuOn", "\ufdd0'help", "\ufdd0'optIn", "\ufdd0'menuPos", "\ufdd0'theme"], {"\ufdd0'menuOn":cljs.core._EQ_.call(null, 1, i__75820.menuOn), "\ufdd0'help":cljs.core._EQ_.call(null, 1, i__75820.help), "\ufdd0'optIn":cljs.core._EQ_.call(null, 1, i__75820.optIn), "\ufdd0'menuPos":cljs.core._EQ_.call(null, 1, i__75820.menuPos) ? "\ufdd0'top" : "\ufdd0'bottom", "\ufdd0'theme":i__75820.theme})
};
fb.misc.add_data = function add_data(elt, name, data) {
  var temp__3971__auto____75828 = name.call(null, data);
  if(cljs.core.truth_(temp__3971__auto____75828)) {
    var d__75829 = temp__3971__auto____75828;
    return cljs.core.reduce.call(null, function(e, p__75830) {
      var vec__75831__75832 = p__75830;
      var k__75833 = cljs.core.nth.call(null, vec__75831__75832, 0, null);
      var v__75834 = cljs.core.nth.call(null, vec__75831__75832, 1, null);
      return e.data(k__75833, v__75834)
    }, elt, d__75829)
  }else {
    return elt
  }
};
fb.misc.trim = function trim(s) {
  return s.replace(/^(.*\S)\s*$/, "$1")
};
fb.misc.num = function num(n) {
  return Number(n)
};
fb.misc.get_current_page = function get_current_page(type) {
  if(cljs.core._EQ_.call(null, type, "\ufdd0'current")) {
    return fb.jq.$.call(null, "#content div.middle div:first").attr("class")
  }else {
    return fb.jq.$.call(null, "#newpage div.middle div:first").attr("class")
  }
};
goog.provide("fb.init");
goog.require("cljs.core");
goog.require("fb.jq");
goog.require("fb.jq");
fb.init.inits = cljs.core.ObjMap.fromObject(["\ufdd0'any", "\ufdd0'last"], {"\ufdd0'any":cljs.core.PersistentVector.EMPTY, "\ufdd0'last":cljs.core.PersistentVector.EMPTY});
fb.init.add_init_BANG_ = function() {
  var add_init_BANG_ = null;
  var add_init_BANG___1 = function(f) {
    fb.init.inits = cljs.core.ObjMap.fromObject(["\ufdd0'any", "\ufdd0'last"], {"\ufdd0'any":cljs.core.conj.call(null, (new cljs.core.Keyword("\ufdd0'any")).call(null, fb.init.inits), f), "\ufdd0'last":(new cljs.core.Keyword("\ufdd0'last")).call(null, fb.init.inits)})
  };
  var add_init_BANG___2 = function(f, last) {
    fb.init.inits = cljs.core.ObjMap.fromObject(["\ufdd0'last", "\ufdd0'any"], {"\ufdd0'last":cljs.core.conj.call(null, (new cljs.core.Keyword("\ufdd0'last")).call(null, fb.init.inits), f), "\ufdd0'any":(new cljs.core.Keyword("\ufdd0'any")).call(null, fb.init.inits)})
  };
  add_init_BANG_ = function(f, last) {
    switch(arguments.length) {
      case 1:
        return add_init_BANG___1.call(this, f);
      case 2:
        return add_init_BANG___2.call(this, f, last)
    }
    throw"Invalid arity: " + arguments.length;
  };
  add_init_BANG_.cljs$lang$arity$1 = add_init_BANG___1;
  add_init_BANG_.cljs$lang$arity$2 = add_init_BANG___2;
  return add_init_BANG_
}();
fb.init.do_inits = function do_inits() {
  return fb.jq.$.call(null, function() {
    var G__9747__9748 = cljs.core.seq.call(null, cljs.core.concat.call(null, (new cljs.core.Keyword("\ufdd0'any")).call(null, fb.init.inits), (new cljs.core.Keyword("\ufdd0'last")).call(null, fb.init.inits)));
    if(G__9747__9748) {
      var f__9749 = cljs.core.first.call(null, G__9747__9748);
      var G__9747__9750 = G__9747__9748;
      while(true) {
        f__9749.call(null);
        var temp__3974__auto____9751 = cljs.core.next.call(null, G__9747__9750);
        if(temp__3974__auto____9751) {
          var G__9747__9752 = temp__3974__auto____9751;
          var G__9753 = cljs.core.first.call(null, G__9747__9752);
          var G__9754 = G__9747__9752;
          f__9749 = G__9753;
          G__9747__9750 = G__9754;
          continue
        }else {
          return null
        }
        break
      }
    }else {
      return null
    }
  })
};
fb.init.do_inits.call(null);
goog.provide("fb.back");
goog.require("cljs.core");
goog.require("fb.misc");
goog.require("fb.misc");
fb.back.back_pages = null;
fb.back.get_back = function get_back(p__258889, current) {
  var vec__258898__258900 = p__258889;
  var vec__258899__258901 = cljs.core.nth.call(null, vec__258898__258900, 0, null);
  var fname__258902 = cljs.core.nth.call(null, vec__258899__258901, 0, null);
  var fd__258903 = cljs.core.nth.call(null, vec__258899__258901, 1, null);
  var bs__258904 = cljs.core.nthnext.call(null, vec__258898__258900, 1);
  var back_pages__258905 = vec__258898__258900;
  if(cljs.core._EQ_.call(null, fname__258902, fb.misc.get_current_page.call(null, current))) {
    return bs__258904
  }else {
    return back_pages__258905
  }
};
fb.back.get_back_href = function get_back_href() {
  var vec__258913__258915 = fb.back.get_back.call(null, fb.back.back_pages, "\ufdd0'newpage");
  var vec__258914__258916 = cljs.core.nth.call(null, vec__258913__258915, 0, null);
  var name__258917 = cljs.core.nth.call(null, vec__258914__258916, 0, null);
  var d__258918 = cljs.core.nth.call(null, vec__258914__258916, 1, null);
  var bs__258919 = cljs.core.nthnext.call(null, vec__258913__258915, 1);
  return name__258917
};
fb.back.rm_from_back_BANG_ = function rm_from_back_BANG_(key, val) {
  fb.back.back_pages = function() {
    var iter__2462__auto____258955 = function iter__258939(s__258940) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__258940__258948 = s__258940;
        while(true) {
          if(cljs.core.seq.call(null, s__258940__258948)) {
            var vec__258949__258950 = cljs.core.first.call(null, s__258940__258948);
            var name__258951 = cljs.core.nth.call(null, vec__258949__258950, 0, null);
            var data__258952 = cljs.core.nth.call(null, vec__258949__258950, 1, null);
            var bp__258953 = vec__258949__258950;
            var v__258954 = key.call(null, cljs.core.apply.call(null, cljs.core.hash_map, cljs.core.flatten.call(null, name__258951.call(null, data__258952))));
            if(cljs.core.not_EQ_.call(null, v__258954, val)) {
              return cljs.core.cons.call(null, bp__258953, iter__258939.call(null, cljs.core.rest.call(null, s__258940__258948)))
            }else {
              var G__258956 = cljs.core.rest.call(null, s__258940__258948);
              s__258940__258948 = G__258956;
              continue
            }
          }else {
            return null
          }
          break
        }
      }, null)
    };
    return iter__2462__auto____258955.call(null, fb.back.back_pages)
  }()
};
fb.back.update_back_BANG_ = function update_back_BANG_(name, a) {
  if(cljs.core._EQ_.call(null, name, "settings")) {
    var vec__258964__258966 = fb.back.back_pages;
    var vec__258965__258967 = cljs.core.nth.call(null, vec__258964__258966, 0, null);
    var name__258968 = cljs.core.nth.call(null, vec__258965__258967, 0, null);
    var data__258969 = cljs.core.nth.call(null, vec__258965__258967, 1, null);
    var back_end__258970 = cljs.core.nthnext.call(null, vec__258964__258966, 1);
    fb.back.back_pages = cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([name__258968, cljs.core.PersistentArrayMap.fromArrays([name__258968], [cljs.core.replace.call(null, cljs.core.PersistentArrayMap.fromArrays([cljs.core.PersistentVector.fromArray(["anim", "slideright"], true)], [cljs.core.PersistentVector.fromArray(["anim", "flipleft"], true)]), name__258968.call(null, data__258969))])], true), back_end__258970)
  }else {
  }
  if(cljs.core.truth_(cljs.core.some.call(null, function(p1__258920_SHARP_) {
    return cljs.core._EQ_.call(null, name, p1__258920_SHARP_)
  }, cljs.core.PersistentVector.fromArray(["proj", "projects", "buddies", "indivbuddy", "total"], true)))) {
    fb.back.back_pages = cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([name, cljs.core.PersistentArrayMap.fromArrays([name], [cljs.core.doall.call(null, cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray(["anim", "slideright"], true), cljs.core.map.call(null, function(p1__258921_SHARP_) {
      return cljs.core.vector.call(null, p1__258921_SHARP_, a.data(p1__258921_SHARP_))
    }, cljs.core.PersistentVector.fromArray(["pid", "bid", "cid"], true))))])], true), cljs.core.take.call(null, 15, fb.back.back_pages))
  }else {
    return null
  }
};
fb.back.go_back = function go_back(trigger_new_page, e) {
  var vec__258978__258980 = fb.back.get_back.call(null, fb.back.back_pages, "\ufdd0'current");
  var vec__258979__258981 = cljs.core.nth.call(null, vec__258978__258980, 0, null);
  var name__258982 = cljs.core.nth.call(null, vec__258979__258981, 0, null);
  var d__258983 = cljs.core.nth.call(null, vec__258979__258981, 1, null);
  var bs__258984 = cljs.core.nthnext.call(null, vec__258978__258980, 1);
  fb.back.back_pages = bs__258984;
  if(cljs.core.truth_(name__258982)) {
    return trigger_new_page.call(null, name__258982, d__258983)
  }else {
    return trigger_new_page.call(null, "projects", null)
  }
};
goog.provide("fb.sql");
goog.require("cljs.core");
goog.require("fb.init");
goog.require("fb.jq");
goog.require("fb.misc");
goog.require("fb.init");
goog.require("fb.misc");
goog.require("fb.jq");
fb.sql.do_select = function do_select(f, rq) {
  return fb.sql.db.transaction(function(t) {
    return t.executeSql(rq, fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.EMPTY), f, function(p1__221926_SHARP_, p2__221925_SHARP_) {
      return alert([cljs.core.str("fuck. "), cljs.core.str(p2__221925_SHARP_.message)].join(""))
    })
  })
};
fb.sql.init_settings = function init_settings(t, r) {
  return t.executeSql("SELECT * FROM settings;", fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.EMPTY), function(p1__221928_SHARP_, p2__221927_SHARP_) {
    if(p2__221927_SHARP_.rows.length === 0) {
      return p1__221928_SHARP_.executeSql('INSERT INTO settings (menuPos, menuOn, help, theme, optIn) VALUES (1, 1, 1, "jqtouch-edited", 1);', fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.EMPTY))
    }else {
      return null
    }
  })
};
fb.sql.add_db_BANG_ = function() {
  var add_db_BANG___delegate = function(name, schema, p__221929) {
    var vec__221935__221936 = p__221929;
    var f__221937 = cljs.core.nth.call(null, vec__221935__221936, 0, null);
    var n__221938 = cljs.core.apply.call(null, cljs.core.str, cljs.core.next.call(null, [cljs.core.str(name)].join("")));
    return fb.sql.db.transaction(function(t) {
      var rq__221939 = [cljs.core.str("CREATE TABLE IF NOT EXISTS "), cljs.core.str(n__221938), cljs.core.str(" ( "), cljs.core.str(schema), cljs.core.str(" );")].join("");
      if(cljs.core.truth_(f__221937)) {
        return t.executeSql(rq__221939, fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.EMPTY), f__221937)
      }else {
        return t.executeSql(rq__221939)
      }
    })
  };
  var add_db_BANG_ = function(name, schema, var_args) {
    var p__221929 = null;
    if(goog.isDef(var_args)) {
      p__221929 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return add_db_BANG___delegate.call(this, name, schema, p__221929)
  };
  add_db_BANG_.cljs$lang$maxFixedArity = 2;
  add_db_BANG_.cljs$lang$applyTo = function(arglist__221940) {
    var name = cljs.core.first(arglist__221940);
    var schema = cljs.core.first(cljs.core.next(arglist__221940));
    var p__221929 = cljs.core.rest(cljs.core.next(arglist__221940));
    return add_db_BANG___delegate(name, schema, p__221929)
  };
  add_db_BANG_.cljs$lang$arity$variadic = add_db_BANG___delegate;
  return add_db_BANG_
}();
fb.sql.db_init = function db_init() {
  fb.sql.db = openDatabase("projs", "1.0", "projs", 65536);
  fb.sql.add_db_BANG_.call(null, "\ufdd0'projects", [cljs.core.str(" id   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"), cljs.core.str(" name TEXT NOT NULL")].join(""));
  fb.sql.add_db_BANG_.call(null, "\ufdd0'buddies", [cljs.core.str(" id   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"), cljs.core.str(" pid  INTEGER NOT NULL,"), cljs.core.str(" name TEXT NOT NULL,"), cljs.core.str(" img  TEXT NOT NULL")].join(""));
  fb.sql.add_db_BANG_.call(null, "\ufdd0'costs", [cljs.core.str(" id   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"), cljs.core.str(" pid  INTEGER NOT NULL,"), cljs.core.str(" name TEXT NOT NULL,"), cljs.core.str(" tot  NUMERIC NOT NULL")].join(""));
  fb.sql.add_db_BANG_.call(null, "\ufdd0'settings", [cljs.core.str(" id   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"), cljs.core.str(" menuPos INTEGER NOT NULL,"), cljs.core.str(" menuOn INTEGER NOT NULL,"), cljs.core.str(" optIn INTEGER NOT NULL,"), cljs.core.str(" theme TEXT NOT NULL,"), cljs.core.str(" help INTEGER NOT NULL")].join(""), fb.sql.init_settings);
  return fb.sql.add_db_BANG_.call(null, "\ufdd0'relcbp", [cljs.core.str(" id   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"), cljs.core.str(" pid  INTEGER NOT NULL,"), cljs.core.str(" bid  INTEGER NOT NULL,"), cljs.core.str(" cid  INTEGER NOT NULL,"), cljs.core.str(" tot  NUMERIC NOT NULL")].join(""))
};
fb.init.add_init_BANG_.call(null, fb.sql.db_init);
fb.sql.update_settings = function update_settings(settings, f) {
  return fb.sql.db.transaction(function(t) {
    return t.executeSql("UPDATE settings SET menuPos = ?, menuOn = ?, optIn = ?, help = ?, theme = ? WHERE id = 1;", fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.fromArray([cljs.core._EQ_.call(null, "\ufdd0'top", (new cljs.core.Keyword("\ufdd0'menuPos")).call(null, settings)) ? 1 : 0, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'menuOn")).call(null, settings)) ? 1 : 0, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'optIn")).call(null, settings)) ? 1 : 0, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'help")).call(null, 
    settings)) ? 1 : 0, (new cljs.core.Keyword("\ufdd0'theme")).call(null, settings)], true)), f)
  })
};
fb.sql.do_settings = function do_settings(f) {
  var rq__221944 = [cljs.core.str("SELECT settings.menuOn, settings.menuPos, settings.help, settings.theme, settings.optIn FROM settings "), cljs.core.str(" ;")].join("");
  return fb.sql.do_select.call(null, function(p1__221942_SHARP_, p2__221941_SHARP_) {
    return f.call(null, fb.misc.mk_settings.call(null, p2__221941_SHARP_))
  }, rq__221944)
};
fb.sql.add_proj = function add_proj(name, f) {
  return fb.sql.db.transaction(function(t) {
    return t.executeSql("INSERT INTO projects (name) VALUES (?);", fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.fromArray([fb.misc.trim.call(null, name)], true)), f)
  })
};
fb.sql.add_buddy = function add_buddy(proj, name, img, f) {
  return fb.sql.db.transaction(function(t) {
    return t.executeSql("INSERT INTO buddies (name, pid, img) VALUES (?, ?, ?);", fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.fromArray([fb.misc.trim.call(null, name), proj, img], true)), f, function(p1__221946_SHARP_, p2__221945_SHARP_) {
      return alert([cljs.core.str("fuck. "), cljs.core.str(p2__221945_SHARP_.message)].join(""))
    })
  })
};
fb.sql.up_buddy = function up_buddy(bid, name, img, f) {
  return fb.sql.db.transaction(function(t) {
    return t.executeSql([cljs.core.str("UPDATE buddies SET name = ?, img = ? WHERE id = "), cljs.core.str(bid), cljs.core.str("; ")].join(""), fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.fromArray([fb.misc.trim.call(null, name), img], true)), f)
  })
};
fb.sql.up_cost = function up_cost(cid, name, buddies_add, buddies_up, buddies_rm, proj, amount, f) {
  var do_cbud__221968 = function(f, rq, vals) {
    return function(t, r) {
      return t.executeSql(rq, fb.jq.clj__GT_js.call(null, vals), f, function(p1__221948_SHARP_, p2__221947_SHARP_) {
        return alert([cljs.core.str("fuck. "), cljs.core.str(p2__221947_SHARP_.message)].join(""))
      })
    }
  };
  var addrq__221969 = "INSERT INTO relcbp (pid, bid, cid, tot) VALUES (?, ?, ?, ?);";
  var uprq__221970 = function(p1__221949_SHARP_) {
    return[cljs.core.str("UPDATE relcbp SET tot = ? WHERE id = "), cljs.core.str(p1__221949_SHARP_), cljs.core.str(";")].join("")
  };
  var rmrq__221971 = function(p1__221950_SHARP_) {
    return[cljs.core.str("DELETE FROM relcbp WHERE id = "), cljs.core.str(p1__221950_SHARP_), cljs.core.str(";")].join("")
  };
  var fns__221972 = cljs.core.reduce.call(null, function(p1__221951_SHARP_, p2__221952_SHARP_) {
    return do_cbud__221968.call(null, p1__221951_SHARP_, addrq__221969, cljs.core.PersistentVector.fromArray([proj, (new cljs.core.Keyword("\ufdd0'bid")).call(null, p2__221952_SHARP_), cid, (new cljs.core.Keyword("\ufdd0'tot")).call(null, p2__221952_SHARP_)], true))
  }, f, buddies_add);
  var fns__221973 = cljs.core.reduce.call(null, function(p1__221953_SHARP_, p2__221954_SHARP_) {
    return do_cbud__221968.call(null, p1__221953_SHARP_, uprq__221970.call(null, (new cljs.core.Keyword("\ufdd0'rid")).call(null, p2__221954_SHARP_)), cljs.core.PersistentVector.fromArray([(new cljs.core.Keyword("\ufdd0'tot")).call(null, p2__221954_SHARP_)], true))
  }, fns__221972, buddies_up);
  var fns__221974 = cljs.core.reduce.call(null, function(p1__221955_SHARP_, p2__221956_SHARP_) {
    return do_cbud__221968.call(null, p1__221955_SHARP_, rmrq__221971.call(null, (new cljs.core.Keyword("\ufdd0'rid")).call(null, p2__221956_SHARP_)), cljs.core.PersistentVector.EMPTY)
  }, fns__221973, buddies_rm);
  return fb.sql.db.transaction(function(t) {
    return t.executeSql([cljs.core.str("UPDATE costs SET name = ?, pid = ?, tot = ? WHERE id = "), cljs.core.str(cid), cljs.core.str("; ")].join(""), fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.fromArray([fb.misc.trim.call(null, name), proj, amount], true)), fns__221974)
  })
};
fb.sql.add_cost = function add_cost(name, buddies, proj, amount, f) {
  var do_cbud__221976 = function(f, vals) {
    return function(t, r) {
      return t.executeSql("INSERT INTO relcbp (pid, bid, cid, tot) VALUES (?, ?, ?, ?);", fb.jq.clj__GT_js.call(null, vals), f, function(p1__221958_SHARP_, p2__221957_SHARP_) {
        return alert([cljs.core.str("fuck. "), cljs.core.str(p2__221957_SHARP_.message)].join(""))
      })
    }
  };
  return fb.sql.db.transaction(function(t) {
    return t.executeSql("INSERT INTO costs (name, pid, tot) VALUES (?, ?, ?);", fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.fromArray([fb.misc.trim.call(null, name), proj, amount], true)), function(t, r) {
      return cljs.core.reduce.call(null, function(p1__221959_SHARP_, p2__221960_SHARP_) {
        return do_cbud__221976.call(null, p1__221959_SHARP_, cljs.core.PersistentVector.fromArray([proj, (new cljs.core.Keyword("\ufdd0'bid")).call(null, p2__221960_SHARP_), r.insertId, (new cljs.core.Keyword("\ufdd0'tot")).call(null, p2__221960_SHARP_)], true))
      }, f, buddies).call(null, t, r)
    })
  })
};
fb.sql.do_proj = function() {
  var do_proj__delegate = function(f, p__221977) {
    var vec__221982__221983 = p__221977;
    var id__221984 = cljs.core.nth.call(null, vec__221982__221983, 0, null);
    var rq__221985 = cljs.core.truth_(id__221984) ? [cljs.core.str("SELECT projects.id, projects.name, SUM(relcbp.tot) AS tot, settings.menuOn, settings.menuPos, settings.help, settings.theme, settings.optIn FROM projects, relcbp, settings "), cljs.core.str("WHERE projects.id = "), cljs.core.str(id__221984), cljs.core.str(" AND relcbp.pid = projects.id "), cljs.core.str("GROUP BY projects.id "), cljs.core.str("UNION ALL SELECT  projects.id, projects.name, 0 AS tot, settings.menuOn, settings.menuPos, settings.help, settings.theme, settings.optIn FROM projects, settings "), 
    cljs.core.str("WHERE projects.id = "), cljs.core.str(id__221984), cljs.core.str(" AND NOT EXISTS (SELECT * FROM relcbp WHERE projects.id = relcbp.pid )"), cljs.core.str(" ;")].join("") : "SELECT * FROM projects;";
    return fb.sql.do_select.call(null, f, rq__221985)
  };
  var do_proj = function(f, var_args) {
    var p__221977 = null;
    if(goog.isDef(var_args)) {
      p__221977 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return do_proj__delegate.call(this, f, p__221977)
  };
  do_proj.cljs$lang$maxFixedArity = 1;
  do_proj.cljs$lang$applyTo = function(arglist__221986) {
    var f = cljs.core.first(arglist__221986);
    var p__221977 = cljs.core.rest(arglist__221986);
    return do_proj__delegate(f, p__221977)
  };
  do_proj.cljs$lang$arity$variadic = do_proj__delegate;
  return do_proj
}();
fb.sql.do_costs = function do_costs(f, id) {
  var rq__221988 = [cljs.core.str("SELECT costs.name, costs.id, SUM(relcbp.tot) AS tot FROM costs, relcbp "), cljs.core.str("WHERE costs.pid = "), cljs.core.str(id), cljs.core.str(" "), cljs.core.str("AND relcbp.cid = costs.id "), cljs.core.str("GROUP BY costs.id "), cljs.core.str(";")].join("");
  return fb.sql.do_select.call(null, f, rq__221988)
};
fb.sql.do_cost = function do_cost(f, id) {
  var rq__221990 = [cljs.core.str("SELECT costs.name AS cname, buddies.name AS bname, costs.tot AS ctot, relcbp.tot AS btot, relcbp.id, relcbp.bid, relcbp.cid "), cljs.core.str("FROM costs, relcbp, buddies "), cljs.core.str("WHERE costs.id = "), cljs.core.str(id), cljs.core.str(" AND relcbp.cid = costs.id AND relcbp.bid = buddies.id;")].join("");
  return fb.sql.do_select.call(null, f, rq__221990)
};
fb.sql.do_buddy = function do_buddy(f, id) {
  var rq__221992 = [cljs.core.str("SELECT costs.name AS cname, buddies.name AS bname, costs.tot AS ctot, relcbp.tot AS btot "), cljs.core.str("FROM costs, relcbp, buddies "), cljs.core.str("WHERE relcbp.bid = "), cljs.core.str(id), cljs.core.str(" AND relcbp.cid = costs.id AND relcbp.bid = buddies.id "), cljs.core.str("GROUP BY costs.id "), cljs.core.str("UNION ALL SELECT 0 AS cname, buddies.name AS bname, 0 AS ctot, 0 AS btot FROM buddies "), cljs.core.str("WHERE buddies.id = "), cljs.core.str(id), 
  cljs.core.str(" "), cljs.core.str("AND NOT EXISTS (SELECT * FROM relcbp WHERE relcbp.bid = "), cljs.core.str(id), cljs.core.str(" );")].join("");
  return fb.sql.do_select.call(null, f, rq__221992)
};
fb.sql.do_row = function do_row(f, r) {
  var G__221999__222000 = cljs.core.seq.call(null, cljs.core.range.call(null, r.rows.length));
  if(G__221999__222000) {
    var i__222001 = cljs.core.first.call(null, G__221999__222000);
    var G__221999__222002 = G__221999__222000;
    while(true) {
      f.call(null, r.rows.item(i__222001));
      var temp__3974__auto____222003 = cljs.core.next.call(null, G__221999__222002);
      if(temp__3974__auto____222003) {
        var G__221999__222004 = temp__3974__auto____222003;
        var G__222005 = cljs.core.first.call(null, G__221999__222004);
        var G__222006 = G__221999__222004;
        i__222001 = G__222005;
        G__221999__222002 = G__222006;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
fb.sql.row_seq = function row_seq(r) {
  var iter__2462__auto____222020 = function iter__222014(s__222015) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__222015__222018 = s__222015;
      while(true) {
        if(cljs.core.seq.call(null, s__222015__222018)) {
          var i__222019 = cljs.core.first.call(null, s__222015__222018);
          return cljs.core.cons.call(null, r.rows.item(i__222019), iter__222014.call(null, cljs.core.rest.call(null, s__222015__222018)))
        }else {
          return null
        }
        break
      }
    }, null)
  };
  return iter__2462__auto____222020.call(null, cljs.core.range.call(null, r.rows.length))
};
fb.sql.do_buddies = function() {
  var do_buddies__delegate = function(f, pid, p__222027) {
    var vec__222032__222033 = p__222027;
    var cid__222034 = cljs.core.nth.call(null, vec__222032__222033, 0, null);
    var rq__222035 = cljs.core.truth_(cid__222034) ? [cljs.core.str("SELECT buddies.name AS bname, buddies.id, buddies.img, relcbp.tot AS btot, SUM(costs.tot) AS ptot, costs.name AS cname, relcbp.id AS rid "), cljs.core.str("FROM buddies, relcbp, costs "), cljs.core.str("WHERE buddies.id = relcbp.bid AND buddies.pid = "), cljs.core.str(pid), cljs.core.str(" and relcbp.pid = "), cljs.core.str(pid), cljs.core.str(" AND costs.pid = "), cljs.core.str(pid), cljs.core.str(" AND relcbp.cid = costs.id "), 
    cljs.core.str("AND relcbp.cid = "), cljs.core.str(cid__222034), cljs.core.str(" "), cljs.core.str("GROUP BY buddies.id "), cljs.core.str("UNION ALL SELECT buddies.name, buddies.id, buddies.img, 0 AS btot, 0 AS ptot, 0 AS cname, 0 AS rid FROM buddies "), cljs.core.str("WHERE buddies.pid = "), cljs.core.str(pid), cljs.core.str(" "), cljs.core.str("AND NOT EXISTS (SELECT * FROM relcbp WHERE buddies.id = relcbp.bid AND relcbp.cid = "), cljs.core.str(cid__222034), cljs.core.str(" ) "), cljs.core.str(" ;")].join("") : 
    [cljs.core.str("SELECT buddies.name AS bname, buddies.id, buddies.img, SUM(relcbp.tot) AS btot, SUM(costs.tot) AS ptot "), cljs.core.str("FROM buddies, relcbp, costs "), cljs.core.str("WHERE buddies.id = relcbp.bid AND buddies.pid = "), cljs.core.str(pid), cljs.core.str(" and relcbp.pid = "), cljs.core.str(pid), cljs.core.str(" AND costs.pid = "), cljs.core.str(pid), cljs.core.str(" AND relcbp.cid = costs.id "), cljs.core.str("GROUP BY buddies.id "), cljs.core.str("UNION ALL SELECT buddies.name, buddies.id, buddies.img, 0 AS btot, 100 AS ptot FROM buddies "), 
    cljs.core.str("WHERE buddies.pid = "), cljs.core.str(pid), cljs.core.str(" "), cljs.core.str("AND NOT EXISTS (SELECT * FROM relcbp, costs WHERE buddies.id = relcbp.bid AND buddies.pid = relcbp.pid AND relcbp.cid = costs.id AND costs.pid = buddies.pid)"), cljs.core.str(" ;")].join("");
    return fb.sql.do_select.call(null, f, rq__222035)
  };
  var do_buddies = function(f, pid, var_args) {
    var p__222027 = null;
    if(goog.isDef(var_args)) {
      p__222027 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return do_buddies__delegate.call(this, f, pid, p__222027)
  };
  do_buddies.cljs$lang$maxFixedArity = 2;
  do_buddies.cljs$lang$applyTo = function(arglist__222036) {
    var f = cljs.core.first(arglist__222036);
    var pid = cljs.core.first(cljs.core.next(arglist__222036));
    var p__222027 = cljs.core.rest(cljs.core.next(arglist__222036));
    return do_buddies__delegate(f, pid, p__222027)
  };
  do_buddies.cljs$lang$arity$variadic = do_buddies__delegate;
  return do_buddies
}();
fb.sql.do_total = function do_total(f, pid) {
  var rq_buds__222060 = [cljs.core.str("SELECT buddies.name AS bname, buddies.id AS bid, buddies.img FROM buddies WHERE buddies.pid = "), cljs.core.str(pid), cljs.core.str(" ;")].join("");
  var rq_costs__222061 = function(p1__222021_SHARP_) {
    return[cljs.core.str("SELECT relb.cid, SUM(relb.tot) as btot, relc.nbbuds, relc.ctot FROM relcbp AS relb "), cljs.core.str(" INNER JOIN ( SELECT reld.cid, COUNT(reld.bid) AS nbbuds, SUM(reld.tot) AS ctot FROM relcbp AS reld "), cljs.core.str("              WHERE reld.pid = "), cljs.core.str(pid), cljs.core.str(" GROUP BY reld.cid ) AS relc "), cljs.core.str("  ON relc.cid = relb.cid  "), cljs.core.str(" WHERE relb.bid = "), cljs.core.str(p1__222021_SHARP_), cljs.core.str(" "), cljs.core.str(" GROUP BY relb.cid ;")].join("")
  };
  var mk_cost__222069 = function(r) {
    return cljs.core.doall.call(null, function() {
      var iter__2462__auto____222068 = function iter__222062(s__222063) {
        return new cljs.core.LazySeq(null, false, function() {
          var s__222063__222066 = s__222063;
          while(true) {
            if(cljs.core.seq.call(null, s__222063__222066)) {
              var c__222067 = cljs.core.first.call(null, s__222063__222066);
              return cljs.core.cons.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'cid", "\ufdd0'btot", "\ufdd0'nbbuds", "\ufdd0'ctot"], {"\ufdd0'cid":c__222067.cid, "\ufdd0'btot":c__222067.btot, "\ufdd0'nbbuds":c__222067.nbbuds, "\ufdd0'ctot":c__222067.ctot}), iter__222062.call(null, cljs.core.rest.call(null, s__222063__222066)))
            }else {
              return null
            }
            break
          }
        }, null)
      };
      return iter__2462__auto____222068.call(null, fb.sql.row_seq.call(null, r))
    }())
  };
  var mk_buds__222075 = function(b, r, p__222070) {
    var vec__222071__222072 = p__222070;
    var bb__222073 = cljs.core.nth.call(null, vec__222071__222072, 0, null);
    var bs__222074 = cljs.core.nthnext.call(null, vec__222071__222072, 1);
    return cljs.core.cons.call(null, b, cljs.core.cons.call(null, cljs.core.assoc.call(null, bb__222073, "\ufdd0'costs", mk_cost__222069.call(null, r)), bs__222074))
  };
  var do_bud__222077 = function(f, b, buddies) {
    var b__222076 = cljs.core.ObjMap.fromObject(["\ufdd0'bname", "\ufdd0'bid", "\ufdd0'btot"], {"\ufdd0'bname":b.bname, "\ufdd0'bid":b.id, "\ufdd0'btot":b.btot});
    return function(t, r) {
      return t.executeSql(rq_costs__222061.call(null, (new cljs.core.Keyword("\ufdd0'bid")).call(null, b__222076)), fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.EMPTY), f.call(null, mk_buds__222075.call(null, b__222076, r, buddies)), function(p1__222023_SHARP_, p2__222022_SHARP_) {
        return alert([cljs.core.str("fuck. "), cljs.core.str(p2__222022_SHARP_.message)].join(""))
      })
    }
  };
  var do_buds__222078 = function(t, r) {
    return cljs.core.reduce.call(null, function(p1__222024_SHARP_, p2__222025_SHARP_) {
      return cljs.core.partial.call(null, do_bud__222077, p1__222024_SHARP_, p2__222025_SHARP_)
    }, function(p1__222026_SHARP_) {
      return function(t, r) {
        return f.call(null, cljs.core.drop_last.call(null, cljs.core.next.call(null, mk_buds__222075.call(null, null, r, p1__222026_SHARP_))))
      }
    }, fb.sql.row_seq.call(null, r)).call(null, cljs.core.PersistentVector.fromArray([cljs.core.ObjMap.EMPTY], true)).call(null, t, r)
  };
  return fb.sql.do_buddies.call(null, do_buds__222078, pid)
};
fb.sql.rm = function() {
  var rm__delegate = function(rq, p__222079) {
    var vec__222083__222084 = p__222079;
    var f__222085 = cljs.core.nth.call(null, vec__222083__222084, 0, null);
    return function(t, r) {
      if(cljs.core.truth_(f__222085)) {
        return t.executeSql(rq, fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.EMPTY), f__222085, function(p1__222038_SHARP_, p2__222037_SHARP_) {
          return alert([cljs.core.str("rm fuck. "), cljs.core.str(p2__222037_SHARP_.message)].join(""))
        })
      }else {
        return t.executeSql(rq, fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.EMPTY), null, function(p1__222040_SHARP_, p2__222039_SHARP_) {
          return alert([cljs.core.str("rm fuck. "), cljs.core.str(p2__222039_SHARP_.message)].join(""))
        })
      }
    }
  };
  var rm = function(rq, var_args) {
    var p__222079 = null;
    if(goog.isDef(var_args)) {
      p__222079 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return rm__delegate.call(this, rq, p__222079)
  };
  rm.cljs$lang$maxFixedArity = 1;
  rm.cljs$lang$applyTo = function(arglist__222086) {
    var rq = cljs.core.first(arglist__222086);
    var p__222079 = cljs.core.rest(arglist__222086);
    return rm__delegate(rq, p__222079)
  };
  rm.cljs$lang$arity$variadic = rm__delegate;
  return rm
}();
fb.sql.rm_proj = function rm_proj(f, pid) {
  var rq_p__222091 = [cljs.core.str("DELETE FROM projects WHERE projects.id = "), cljs.core.str(pid), cljs.core.str(" ;")].join("");
  var rq_b__222092 = [cljs.core.str("DELETE FROM buddies WHERE buddies.pid = "), cljs.core.str(pid), cljs.core.str(" ;")].join("");
  var rq_c__222093 = [cljs.core.str("DELETE FROM costs WHERE costs.pid = "), cljs.core.str(pid), cljs.core.str(" ;")].join("");
  var rq_r__222094 = [cljs.core.str("DELETE FROM relcbp WHERE relcbp.pid = "), cljs.core.str(pid), cljs.core.str(" ;")].join("");
  return fb.sql.db.transaction(fb.sql.rm.call(null, rq_p__222091, fb.sql.rm.call(null, rq_b__222092, fb.sql.rm.call(null, rq_c__222093, fb.sql.rm.call(null, rq_r__222094, f)))))
};
fb.sql.rm_cost = function rm_cost(f, cid) {
  var rq_c__222097 = [cljs.core.str("DELETE FROM costs WHERE costs.id = "), cljs.core.str(cid), cljs.core.str(" ;")].join("");
  var rq_r__222098 = [cljs.core.str("DELETE FROM relcbp WHERE relcbp.cid = "), cljs.core.str(cid), cljs.core.str(" ;")].join("");
  return fb.sql.db.transaction(fb.sql.rm.call(null, rq_c__222097, fb.sql.rm.call(null, rq_r__222098, f)))
};
fb.sql.rm_buddy = function rm_buddy(f, bid) {
  var rq_c__222111 = [cljs.core.str("DELETE FROM buddies WHERE buddies.id = "), cljs.core.str(bid), cljs.core.str(" ;")].join("");
  var rq_r__222112 = [cljs.core.str("DELETE FROM relcbp WHERE relcbp.bid = "), cljs.core.str(bid), cljs.core.str(" ;")].join("");
  return fb.sql.db.transaction(fb.sql.rm.call(null, rq_c__222111, fb.sql.rm.call(null, rq_r__222112, f)))
};
fb.sql.nuke_db = function nuke_db() {
  return fb.sql.db.transaction(function(t) {
    return t.executeSql("DROP TABLE IF EXISTS projects;", fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.EMPTY), function(t, r) {
      return t.executeSql("DROP TABLE buddies;", fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.EMPTY), function(t, r) {
        return t.executeSql("DROP TABLE costs;", fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.EMPTY), function(t, r) {
          return t.executeSql("DROP TABLE relcbp;", fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.EMPTY), function(t, r) {
            return t.executeSql("DROP TABLE settings;", fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.EMPTY), function() {
              return alert([cljs.core.str("dropped.")].join(""))
            }, function(p1__222100_SHARP_, p2__222099_SHARP_) {
              return alert([cljs.core.str("fuck. "), cljs.core.str(p2__222099_SHARP_.message)].join(""))
            })
          }, function(p1__222102_SHARP_, p2__222101_SHARP_) {
            return alert([cljs.core.str("fuck. "), cljs.core.str(p2__222101_SHARP_.message)].join(""))
          })
        }, function(p1__222104_SHARP_, p2__222103_SHARP_) {
          return alert([cljs.core.str("fuck. "), cljs.core.str(p2__222103_SHARP_.message)].join(""))
        })
      }, function(p1__222106_SHARP_, p2__222105_SHARP_) {
        return alert([cljs.core.str("fuck. "), cljs.core.str(p2__222105_SHARP_.message)].join(""))
      })
    }, function(p1__222108_SHARP_, p2__222107_SHARP_) {
      return alert([cljs.core.str("fuck. "), cljs.core.str(p2__222107_SHARP_.message)].join(""))
    })
  })
};
fb.sql.nuke_settings = function nuke_settings() {
  return fb.sql.db.transaction(function(t) {
    return t.executeSql("DROP TABLE settings;", fb.jq.clj__GT_js.call(null, cljs.core.PersistentVector.EMPTY), function() {
      return alert([cljs.core.str("dropped.")].join(""))
    }, function(p1__222114_SHARP_, p2__222113_SHARP_) {
      return alert([cljs.core.str("fuck. "), cljs.core.str(p2__222113_SHARP_.message)].join(""))
    })
  })
};
goog.provide("fb.vis");
goog.require("cljs.core");
goog.require("fb.misc");
goog.require("fb.jq");
goog.require("fb.back");
goog.require("fb.sql");
goog.require("fb.back");
goog.require("fb.misc");
goog.require("fb.sql");
goog.require("fb.jq");
fb.vis.page_titles = cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["projects", "Home"], true), cljs.core.PersistentVector.fromArray(["proj", "Expenses"], true), cljs.core.PersistentVector.fromArray(["buddies", "Buddies"], true), cljs.core.PersistentVector.fromArray(["total", "Total"], true), cljs.core.PersistentVector.fromArray(["settings", "Settings"], true)], true);
fb.vis.page_titles_map = cljs.core.into.call(null, cljs.core.ObjMap.fromObject(["indivbuddy", "cost", "newcost", "new"], {"indivbuddy":"Buddy", "cost":"Expense", "newcost":"New Expense", "new":"New"}), cljs.core.apply.call(null, cljs.core.hash_map, cljs.core.flatten.call(null, fb.vis.page_titles)));
fb.vis.set_theme = function set_theme(settings) {
  return fb.jq.$.call(null, "#settheme").attr("href", [cljs.core.str("themes/css/"), cljs.core.str((new cljs.core.Keyword("\ufdd0'theme")).call(null, settings)), cljs.core.str(".css")].join(""))
};
var sp__113690 = fb.jq.$.call(null, "<span></span>").addClass("money");
fb.vis.money = function money(amount) {
  return sp__113690.clone().text(function(p1__113689_SHARP_) {
    if(cljs.core._EQ_.call(null, 1, cljs.core.count.call(null, p1__113689_SHARP_))) {
      return"$0"
    }else {
      return p1__113689_SHARP_
    }
  }.call(null, [cljs.core.str(amount)].join("").replace(/^0*([0-9]*\.?[0-9]{0,2})?.*$/, "$$$1").replace(/(\.[0-9])$/, "$10")))
};
var sp__113694 = fb.jq.$.call(null, "<span></span>").addClass("buddy");
fb.vis.buddy = function buddy(name) {
  return sp__113694.clone().text(name)
};
fb.vis.add_menu = function add_menu(pid, settings) {
  var place__113732 = cljs.core._EQ_.call(null, "\ufdd0'top", (new cljs.core.Keyword("\ufdd0'menuPos")).call(null, settings)) ? fb.jq.$.call(null, "#newpage div.top") : fb.jq.$.call(null, "#newpage div.bottom");
  var menu__113733 = fb.jq.$.call(null, "div.hidden div.menu").clone();
  place__113732.append(cljs.core.truth_((new cljs.core.Keyword("\ufdd0'menuOn")).call(null, settings)) ? menu__113733.show() : menu__113733.hide());
  var ulr__113734 = fb.jq.$.call(null, "#newpage div.menu div.right ul");
  var ull__113735 = fb.jq.$.call(null, "#newpage div.menu div.left ul");
  var li__113736 = fb.jq.$.call(null, "<li></li>");
  var a__113737 = fb.jq.$.call(null, "<a></a>");
  var curr__113738 = fb.misc.get_current_page.call(null, "\ufdd0'new");
  var data__113739 = cljs.core.ObjMap.fromObject(["settings"], {"settings":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["anim", "flipright"], true)], true)});
  var links__113747 = cljs.core.remove.call(null, function(p1__113691_SHARP_) {
    var li__113740 = cljs.core.first.call(null, p1__113691_SHARP_);
    if(function() {
      var or__3824__auto____113741 = cljs.core._EQ_.call(null, li__113740, "indivbuddy");
      if(or__3824__auto____113741) {
        return or__3824__auto____113741
      }else {
        return cljs.core._EQ_.call(null, li__113740, "buddies")
      }
    }()) {
      var or__3824__auto____113742 = cljs.core._EQ_.call(null, curr__113738, "indivbuddy");
      if(or__3824__auto____113742) {
        return or__3824__auto____113742
      }else {
        return cljs.core._EQ_.call(null, curr__113738, "buddies")
      }
    }else {
      if(function() {
        var or__3824__auto____113743 = cljs.core._EQ_.call(null, li__113740, "newcost");
        if(or__3824__auto____113743) {
          return or__3824__auto____113743
        }else {
          var or__3824__auto____113744 = cljs.core._EQ_.call(null, li__113740, "cost");
          if(or__3824__auto____113744) {
            return or__3824__auto____113744
          }else {
            return cljs.core._EQ_.call(null, li__113740, "proj")
          }
        }
      }()) {
        var or__3824__auto____113745 = cljs.core._EQ_.call(null, curr__113738, "cost");
        if(or__3824__auto____113745) {
          return or__3824__auto____113745
        }else {
          var or__3824__auto____113746 = cljs.core._EQ_.call(null, curr__113738, "newcost");
          if(or__3824__auto____113746) {
            return or__3824__auto____113746
          }else {
            return cljs.core._EQ_.call(null, curr__113738, "proj")
          }
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core._EQ_.call(null, li__113740, curr__113738)
        }else {
          return null
        }
      }
    }
  }, fb.vis.page_titles);
  var half__113748 = cljs.core.count.call(null, links__113747) / 2;
  var add__113768 = function(p1__113692_SHARP_, p2__113693_SHARP_) {
    var G__113749__113750 = cljs.core.seq.call(null, p1__113692_SHARP_);
    if(G__113749__113750) {
      var G__113752__113754 = cljs.core.first.call(null, G__113749__113750);
      var vec__113753__113755 = G__113752__113754;
      var l__113756 = cljs.core.nth.call(null, vec__113753__113755, 0, null);
      var t__113757 = cljs.core.nth.call(null, vec__113753__113755, 1, null);
      var G__113749__113758 = G__113749__113750;
      var G__113752__113759 = G__113752__113754;
      var G__113749__113760 = G__113749__113758;
      while(true) {
        var vec__113761__113762 = G__113752__113759;
        var l__113763 = cljs.core.nth.call(null, vec__113761__113762, 0, null);
        var t__113764 = cljs.core.nth.call(null, vec__113761__113762, 1, null);
        var G__113749__113765 = G__113749__113760;
        p2__113693_SHARP_.append(li__113736.clone().append(fb.misc.add_data.call(null, a__113737.clone().data("pid", pid).attr("href", l__113763).text(t__113764), l__113763, data__113739)));
        var temp__3974__auto____113766 = cljs.core.next.call(null, G__113749__113765);
        if(temp__3974__auto____113766) {
          var G__113749__113767 = temp__3974__auto____113766;
          var G__113769 = cljs.core.first.call(null, G__113749__113767);
          var G__113770 = G__113749__113767;
          G__113752__113759 = G__113769;
          G__113749__113760 = G__113770;
          continue
        }else {
          return null
        }
        break
      }
    }else {
      return null
    }
  };
  add__113768.call(null, cljs.core.take.call(null, half__113748, links__113747), ull__113735);
  return add__113768.call(null, cljs.core.drop.call(null, half__113748, links__113747), ulr__113734)
};
fb.vis.set_title_project = function set_title_project(f, pid) {
  var sett__113792 = function(tx, r) {
    var i__113782 = r.rows.item(0);
    var n__113783 = i__113782.name;
    var id__113784 = i__113782.id;
    var tot__113785 = i__113782.tot;
    var settings__113786 = fb.misc.mk_settings.call(null, r);
    var a__113787 = fb.jq.$.call(null, "<a></a>");
    var help__113788 = fb.jq.$.call(null, "#newpage div.info");
    if(cljs.core.truth_((new cljs.core.Keyword("\ufdd0'help")).call(null, settings__113786))) {
      help__113788.show()
    }else {
      help__113788.hide()
    }
    fb.jq.$.call(null, "#newpage div.top").data("pid", pid).append(fb.jq.$.call(null, '<div class="toolbar"></div>').append(fb.jq.$.call(null, "<h1></h1>").append(a__113787.clone().attr("href", "proj").data("pid", pid).append([cljs.core.str(n__113783), cljs.core.str(": ")].join("")).append(fb.vis.money.call(null, tot__113785)))).append(a__113787.clone().addClass("back").addClass("button").attr("href", "back").text(fb.back.get_back_href.call(null).call(null, fb.vis.page_titles_map))).append(a__113787.clone().addClass("button").attr("href", 
    "menu").text("Menu").on("click", function() {
      fb.sql.do_settings.call(null, function(settings) {
        var menu__113789 = fb.jq.$.call(null, "#content div.menu");
        var settings__113790 = cljs.core.assoc.call(null, settings, "\ufdd0'menuOn", cljs.core.not.call(null, (new cljs.core.Keyword("\ufdd0'menuOn")).call(null, settings)));
        var on__113791 = (new cljs.core.Keyword("\ufdd0'menuOn")).call(null, settings__113790);
        return fb.sql.update_settings.call(null, settings__113790, function() {
          if(cljs.core.truth_(on__113791)) {
            return menu__113789.show()
          }else {
            return menu__113789.hide()
          }
        })
      });
      return false
    })));
    fb.vis.add_menu.call(null, pid, settings__113786);
    return f.call(null, id__113784, n__113783, tot__113785, tx, settings__113786)
  };
  return fb.sql.do_proj.call(null, sett__113792, pid)
};
fb.vis.mk_validate = function mk_validate(addb) {
  fb.jq.$.call(null, addb).hide();
  var addb__113796 = addb.replace(/^#newpage(.*)$/, "#content$1");
  return function(e) {
    var inp__113797 = fb.jq.$.call(null, e.currentTarget);
    var addb__113798 = fb.jq.$.call(null, addb__113796);
    if(cljs.core.count.call(null, inp__113797.val()) === 0) {
      return addb__113798.hide()
    }else {
      return addb__113798.show()
    }
  }
};
fb.vis.give_input_focus = function() {
  var give_input_focus = null;
  var give_input_focus__1 = function(inp) {
    inp.parents("li:first").on("click", function(e) {
      return fb.jq.$.call(null, e.currentTarget).children("input").trigger("focus")
    });
    return inp
  };
  var give_input_focus__2 = function(li, lisel) {
    li.on("click", function(e) {
      return fb.jq.$.call(null, e.currentTarget).children("input").trigger("focus")
    });
    return li
  };
  var give_input_focus__3 = function(li, lisel, radiosel) {
    var inp__113804 = li.find("input");
    if(cljs.core._EQ_.call(null, "checkbox", inp__113804.attr("type"))) {
      inp__113804.on("click", function(e) {
        var inp__113805 = fb.jq.$.call(null, cljs.core.first.call(null, fb.jq.$.call(null, e.currentTarget)));
        inp__113805.attr("checked", cljs.core.truth_(inp__113805.attr("checked")) ? null : "checked");
        return true
      })
    }else {
    }
    li.on("click", function(e) {
      var inp__113806 = fb.jq.$.call(null, e.currentTarget).children("input");
      if(cljs.core._EQ_.call(null, "radio", inp__113806.attr("type"))) {
        return inp__113806.attr("checked", true)
      }else {
        return inp__113806.attr("checked", cljs.core.truth_(inp__113806.attr("checked")) ? null : "checked")
      }
    });
    return li
  };
  give_input_focus = function(li, lisel, radiosel) {
    switch(arguments.length) {
      case 1:
        return give_input_focus__1.call(this, li);
      case 2:
        return give_input_focus__2.call(this, li, lisel);
      case 3:
        return give_input_focus__3.call(this, li, lisel, radiosel)
    }
    throw"Invalid arity: " + arguments.length;
  };
  give_input_focus.cljs$lang$arity$1 = give_input_focus__1;
  give_input_focus.cljs$lang$arity$2 = give_input_focus__2;
  give_input_focus.cljs$lang$arity$3 = give_input_focus__3;
  return give_input_focus
}();
fb.vis.get_canvas_colors = function get_canvas_colors() {
  var div__113809 = fb.jq.$.call(null, "<div></div>");
  var getcss__113810 = function(p1__113799_SHARP_, p2__113800_SHARP_) {
    return fb.jq.$.call(null, [cljs.core.str(".hidden ."), cljs.core.str(p1__113799_SHARP_)].join("")).css(p2__113800_SHARP_)
  };
  return cljs.core.PersistentVector.fromArray([getcss__113810.call(null, "graphPaid", "color"), getcss__113810.call(null, "graphNothing", "color"), getcss__113810.call(null, "graphOwes", "color"), getcss__113810.call(null, "graphNeeds", "color"), getcss__113810.call(null, "graphAvg", "color"), getcss__113810.call(null, "graphNothing", "background-image")], true)
};
fb.vis.canvas_rect = function canvas_rect(w_tot, h_tot, w, colors) {
  var c__113821 = cljs.core.first.call(null, fb.jq.$.call(null, "<canvas></canvas>"));
  var ctx__113822 = c__113821.getContext("2d", w_tot, h_tot);
  var vec__113820__113823 = colors;
  var paid__113824 = cljs.core.nth.call(null, vec__113820__113823, 0, null);
  var nothing__113825 = cljs.core.nth.call(null, vec__113820__113823, 1, null);
  var owes__113826 = cljs.core.nth.call(null, vec__113820__113823, 2, null);
  var needs__113827 = cljs.core.nth.call(null, vec__113820__113823, 3, null);
  var average__113828 = cljs.core.nth.call(null, vec__113820__113823, 4, null);
  c__113821.width = w_tot;
  c__113821.height = h_tot;
  ctx__113822.fillStyle = nothing__113825;
  ctx__113822.fillRect(0, 0, w_tot, h_tot);
  ctx__113822.fillStyle = paid__113824;
  ctx__113822.fillRect(0, 0, w, h_tot);
  return ctx__113822
};
fb.vis.set_rect_back = function set_rect_back(elt, tot, amount) {
  var w__113835 = screen.width > screen.height ? screen.width : screen.height;
  var h__113836 = 50;
  var nw__113837 = cljs.core.int$.call(null, w__113835 * (amount / tot));
  var cols__113838 = fb.vis.get_canvas_colors.call(null);
  var bck__113839 = cljs.core.last.call(null, cols__113838);
  var cvs__113840 = fb.vis.canvas_rect.call(null, w__113835, h__113836, nw__113837, cols__113838);
  return elt.css("background-image", [cljs.core.str(bck__113839), cljs.core.str(", url("), cljs.core.str(cvs__113840.canvas.toDataURL("image/png")), cljs.core.str(")")].join("")).css("background-size", "100%")
};
fb.vis.canvas_rect_take = function canvas_rect_take(w_tot, h_tot, wpaid, avg, cols) {
  var c__113851 = cljs.core.first.call(null, fb.jq.$.call(null, "<canvas></canvas>"));
  var ctx__113852 = c__113851.getContext("2d", w_tot, h_tot);
  var vec__113850__113853 = cols;
  var paid__113854 = cljs.core.nth.call(null, vec__113850__113853, 0, null);
  var nothing__113855 = cljs.core.nth.call(null, vec__113850__113853, 1, null);
  var owes__113856 = cljs.core.nth.call(null, vec__113850__113853, 2, null);
  var needs__113857 = cljs.core.nth.call(null, vec__113850__113853, 3, null);
  var average__113858 = cljs.core.nth.call(null, vec__113850__113853, 4, null);
  c__113851.width = w_tot;
  c__113851.height = h_tot;
  ctx__113852.fillStyle = nothing__113855;
  ctx__113852.fillRect(0, 0, w_tot, h_tot);
  ctx__113852.fillStyle = paid__113854;
  ctx__113852.fillRect(0, 0, avg, h_tot);
  ctx__113852.fillStyle = needs__113857;
  ctx__113852.fillRect(avg, 0, wpaid - avg, h_tot);
  return ctx__113852
};
fb.vis.canvas_rect_give = function canvas_rect_give(w_tot, h_tot, wpaid, avg, cols) {
  var c__113869 = cljs.core.first.call(null, fb.jq.$.call(null, "<canvas></canvas>"));
  var ctx__113870 = c__113869.getContext("2d", w_tot, h_tot);
  var vec__113868__113871 = cols;
  var paid__113872 = cljs.core.nth.call(null, vec__113868__113871, 0, null);
  var nothing__113873 = cljs.core.nth.call(null, vec__113868__113871, 1, null);
  var owes__113874 = cljs.core.nth.call(null, vec__113868__113871, 2, null);
  var needs__113875 = cljs.core.nth.call(null, vec__113868__113871, 3, null);
  var average__113876 = cljs.core.nth.call(null, vec__113868__113871, 4, null);
  c__113869.width = w_tot;
  c__113869.height = h_tot;
  ctx__113870.fillStyle = nothing__113873;
  ctx__113870.fillRect(0, 0, w_tot, h_tot);
  ctx__113870.fillStyle = paid__113872;
  ctx__113870.fillRect(0, 0, wpaid, h_tot);
  ctx__113870.fillStyle = owes__113874;
  ctx__113870.fillRect(wpaid, 0, avg - wpaid, h_tot);
  return ctx__113870
};
fb.vis.set_tot_rect_back = function set_tot_rect_back(elt, maxpaid, avg, amount) {
  var w__113884 = screen.width > screen.height ? screen.width : screen.height;
  var h__113885 = 50;
  var np__113886 = cljs.core.int$.call(null, w__113884 * (amount / maxpaid));
  var na__113887 = cljs.core.int$.call(null, w__113884 * (avg / maxpaid));
  var cols__113888 = fb.vis.get_canvas_colors.call(null);
  var bck__113889 = cljs.core.last.call(null, cols__113888);
  var cvs__113890 = (np__113886 > na__113887 ? fb.vis.canvas_rect_take : fb.vis.canvas_rect_give).call(null, w__113884, h__113885, np__113886, na__113887, cols__113888);
  return elt.css("background-image", [cljs.core.str(bck__113889), cljs.core.str(", url("), cljs.core.str(cvs__113890.canvas.toDataURL("image/png")), cljs.core.str(")")].join("")).css("background-size", "100%")
};
goog.provide("fb.pages");
goog.require("cljs.core");
goog.require("fb.init");
goog.require("fb.vis");
goog.require("fb.back");
goog.require("fb.jq");
goog.require("fb.misc");
goog.require("fb.sql");
goog.require("fb.back");
goog.require("fb.init");
goog.require("fb.misc");
goog.require("fb.vis");
goog.require("fb.sql");
goog.require("fb.jq");
fb.pages.page_dyn_inits = cljs.core.ObjMap.EMPTY;
fb.pages.jQT = null;
fb.init.add_init_BANG_.call(null, function() {
  fb.pages.jQT = fb.jq.$.jQTouch(fb.jq.map__GT_js.call(null, cljs.core.ObjMap.fromObject(["icon", "statusBar"], {"icon":"img/icon.png", "statusBar":"black-translucent"})))
});
fb.pages.add_page_init_BANG_ = function add_page_init_BANG_(name, func) {
  fb.pages.page_dyn_inits = cljs.core.into.call(null, fb.pages.page_dyn_inits, cljs.core.PersistentArrayMap.fromArrays([name], [func]))
};
fb.pages.load_template = function load_template(name) {
  var temp__218305 = fb.jq.$.call(null, [cljs.core.str("div.hidden div."), cljs.core.str(name)].join(""));
  var temp__218306 = temp__218305.length === 0 ? fb.jq.$.call(null, "div.hidden div.404") : temp__218305;
  var body__218307 = fb.jq.$.call(null, "body");
  var bug__218308 = fb.jq.$.call(null, "#newpage").remove();
  var newp__218309 = fb.jq.$.call(null, '<div id="newpage"></div>').hide();
  return body__218307.append(newp__218309.append(fb.jq.$.call(null, '<div class="top"></div>')).append(fb.jq.$.call(null, '<div class="middle"></div>').append(temp__218306.clone())).append(fb.jq.$.call(null, '<div class="bottom"></div>')).append())
};
fb.pages.swap_page = function swap_page(e, a) {
  var newp__218313 = fb.jq.$.call(null, "#newpage").show();
  var cont__218314 = fb.jq.$.call(null, "#content");
  var anim__218315 = a.data("anim");
  if(cljs.core.truth_(anim__218315)) {
    fb.pages.jQT.goTo("#newpage", anim__218315)
  }else {
    fb.pages.jQT.goTo("#newpage", "slideleft")
  }
  newp__218313.attr("id", "content");
  return cont__218314.attr("id", "old")
};
fb.init.add_init_BANG_.call(null, function() {
  return fb.jq.$.call(null, "body").on("pageAnimationEnd", function(e, info) {
    fb.jq.$.call(null, "#old").remove();
    return fb.jq.$.call(null, "body").height(fb.jq.$.call(null, "#content").height())
  })
});
fb.pages.load_dyn_page = function load_dyn_page(name, e, a) {
  fb.back.update_back_BANG_.call(null, name, a);
  var temp__3971__auto____218318 = fb.pages.page_dyn_inits.call(null, name);
  if(cljs.core.truth_(temp__3971__auto____218318)) {
    var f__218319 = temp__3971__auto____218318;
    return f__218319.call(null, e, a)
  }else {
    fb.pages.load_template.call(null, name);
    return fb.pages.swap_page.call(null, e, a)
  }
};
fb.init.add_init_BANG_.call(null, function() {
  return fb.jq.$.call(null, "body").on("click", "a", function(e) {
    var a__218320 = fb.jq.$.call(null, cljs.core.first.call(null, fb.jq.$.call(null, e.currentTarget)));
    var link__218321 = a__218320.attr("href");
    if(cljs.core.not_EQ_.call(null, link__218321, fb.misc.get_current_page.call(null, "\ufdd0'current"))) {
      if(cljs.core._EQ_.call(null, "mailto", cljs.core.apply.call(null, cljs.core.str, cljs.core.take.call(null, 6, link__218321)))) {
        return true
      }else {
        fb.pages.load_dyn_page.call(null, link__218321, e, a__218320);
        return false
      }
    }else {
      return false
    }
  })
});
fb.pages.trigger_new_page = function trigger_new_page(href, data) {
  return fb.misc.add_data.call(null, fb.jq.$.call(null, "<a></a>").hide().attr("href", href), href, data).appendTo(fb.jq.$.call(null, "#content")).click()
};
fb.init.add_init_BANG_.call(null, function() {
  return fb.pages.trigger_new_page.call(null, "projects", null)
}, "\ufdd0'last");
fb.pages.add_page_init_BANG_.call(null, "back", cljs.core.partial.call(null, fb.back.go_back, fb.pages.trigger_new_page));
goog.provide("fb.rm");
goog.require("cljs.core");
goog.require("fb.back");
goog.require("fb.vis");
goog.require("fb.pages");
goog.require("fb.jq");
goog.require("fb.misc");
goog.require("fb.sql");
goog.require("fb.back");
goog.require("fb.pages");
goog.require("fb.misc");
goog.require("fb.vis");
goog.require("fb.sql");
goog.require("fb.jq");
fb.rm.show_rm = function show_rm(e, origa) {
  fb.pages.load_template.call(null, "rm");
  var pid__75298 = origa.data("pid");
  var cid__75299 = origa.data("cid");
  var bid__75300 = origa.data("bid");
  var rmtype__75301 = origa.data("rm");
  var title__75302 = fb.jq.$.call(null, "#newpage div.rm div.toolbar h1");
  var menu__75303 = fb.jq.$.call(null, "#newpage div.rm div.toolbar");
  var ul__75304 = fb.jq.$.call(null, "#newpage div.rm ul");
  var li__75305 = fb.jq.$.call(null, "<li></li>");
  var a__75306 = fb.jq.$.call(null, "<a></a>");
  var rm_proj_page__75307 = function(e) {
    fb.back.rm_from_back_BANG_.call(null, "pid", pid__75298);
    fb.sql.rm_proj.call(null, function() {
      return fb.pages.trigger_new_page.call(null, "projects", cljs.core.ObjMap.fromObject(["projects"], {"projects":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["anim", "pop"], true)], true)}))
    }, pid__75298);
    return false
  };
  var rm_cost_page__75308 = function(e) {
    fb.back.rm_from_back_BANG_.call(null, "cid", cid__75299);
    fb.sql.rm_cost.call(null, function() {
      return fb.pages.trigger_new_page.call(null, "proj", cljs.core.ObjMap.fromObject(["proj"], {"proj":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["pid", pid__75298], true), cljs.core.PersistentVector.fromArray(["anim", "pop"], true)], true)}))
    }, cid__75299);
    return false
  };
  var rm_budd_page__75309 = function(e) {
    fb.back.rm_from_back_BANG_.call(null, "bid", bid__75300);
    fb.sql.rm_buddy.call(null, function() {
      return fb.pages.trigger_new_page.call(null, "buddies", cljs.core.ObjMap.fromObject(["buddies"], {"buddies":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["bid", bid__75300], true), cljs.core.PersistentVector.fromArray(["pid", pid__75298], true), cljs.core.PersistentVector.fromArray(["anim", "pop"], true)], true)}))
    }, bid__75300);
    return false
  };
  var set_rm_budd__75312 = function(t, r) {
    var i__75310 = r.rows.item(0);
    var tot__75311 = cljs.core.reduce.call(null, cljs.core._PLUS_, cljs.core.map.call(null, function(p1__75273_SHARP_) {
      return p1__75273_SHARP_.btot
    }, fb.sql.row_seq.call(null, r)));
    ul__75304.append(li__75305.clone().append([cljs.core.str("Delete buddy "), cljs.core.str(i__75310.bname), cljs.core.str("?")].join(""))).append(li__75305.clone().append([cljs.core.str("Total contribution: ")].join("")).append(fb.vis.money.call(null, tot__75311))).append(li__75305.clone().addClass("rmli").append(a__75306.clone().text("Delete").attr("href", "null").data("bid", bid__75300).on("click", rm_budd_page__75309)));
    return fb.pages.swap_page.call(null, e, origa)
  };
  var set_rm_cost__75314 = function(t, r) {
    var i__75313 = r.rows.item(0);
    ul__75304.append(li__75305.clone().append([cljs.core.str("Delete Expense "), cljs.core.str(i__75313.cname), cljs.core.str("?")].join(""))).append(li__75305.clone().append([cljs.core.str("Total: ")].join("")).append(fb.vis.money.call(null, i__75313.ctot))).append(li__75305.clone().addClass("rmli").append(a__75306.clone().text("Delete").attr("href", "null").data("cid", i__75313.id).on("click", rm_cost_page__75308)));
    return fb.pages.swap_page.call(null, e, origa)
  };
  var set_rm_proj__75316 = function(t, r) {
    var i__75315 = r.rows.item(0);
    ul__75304.append(li__75305.clone().text([cljs.core.str("Delete project "), cljs.core.str(i__75315.name), cljs.core.str("?")].join(""))).append(li__75305.clone().addClass("rmli").append(a__75306.clone().text("Delete").attr("href", "null").data("pid", i__75315.id).on("click", rm_proj_page__75307)));
    return fb.pages.swap_page.call(null, e, origa)
  };
  menu__75303.append(a__75306.clone().addClass("button").addClass("back").attr("href", "back").text("Cancel"));
  var pred__75317__75320 = cljs.core._EQ_;
  var expr__75318__75321 = rmtype__75301;
  if(pred__75317__75320.call(null, "cost", expr__75318__75321)) {
    return fb.sql.do_cost.call(null, set_rm_cost__75314, cid__75299)
  }else {
    if(pred__75317__75320.call(null, "buddy", expr__75318__75321)) {
      return fb.sql.do_buddy.call(null, set_rm_budd__75312, bid__75300)
    }else {
      if(pred__75317__75320.call(null, "proj", expr__75318__75321)) {
        return fb.sql.do_proj.call(null, set_rm_proj__75316, pid__75298)
      }else {
        throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__75318__75321)].join(""));
      }
    }
  }
};
fb.pages.add_page_init_BANG_.call(null, "rm", fb.rm.show_rm);
goog.provide("fb.proj");
goog.require("cljs.core");
goog.require("fb.vis");
goog.require("fb.pages");
goog.require("fb.jq");
goog.require("fb.misc");
goog.require("fb.sql");
goog.require("fb.pages");
goog.require("fb.misc");
goog.require("fb.vis");
goog.require("fb.sql");
goog.require("fb.jq");
fb.proj.add_page_project = function add_page_project() {
  var name__74729 = fb.jq.$.call(null, '#content div.new form [name="name"]').val();
  var addp__74730 = function(tx, r) {
    return fb.pages.trigger_new_page.call(null, "proj", cljs.core.ObjMap.fromObject(["proj"], {"proj":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["pid", r.insertId], true)], true)}))
  };
  if(cljs.core.count.call(null, name__74729) <= 0) {
    alert("Invalid name")
  }else {
    fb.sql.add_proj.call(null, name__74729, addp__74730)
  }
  return false
};
fb.proj.show_new_form = function show_new_form(e, origa) {
  fb.pages.load_template.call(null, "new");
  var addb__74733 = "#newpage div.new form ul li a";
  var inp__74734 = fb.jq.$.call(null, '#newpage div.new form [name="name"]');
  fb.vis.give_input_focus.call(null, inp__74734.keyup(fb.vis.mk_validate.call(null, addb__74733)).focus());
  fb.jq.$.call(null, "#newpage div.new form").submit(fb.proj.add_page_project);
  fb.jq.$.call(null, addb__74733).on("click", fb.proj.add_page_project);
  fb.pages.swap_page.call(null, e, origa);
  return fb.jq.$.call(null, '#content div.new form [name="name"]').focus()
};
fb.proj.show_projects = function show_projects(e, a) {
  fb.pages.load_template.call(null, "projects");
  var li__74738 = fb.jq.$.call(null, "<li></li>");
  var ul__74739 = fb.jq.$.call(null, "#newpage div ul").append(li__74738.clone().addClass("addli").append(fb.jq.$.call(null, "<a></a>").text("New Project").attr("href", "new")));
  return fb.sql.do_proj.call(null, function(t, r) {
    fb.sql.do_row.call(null, function(i) {
      return ul__74739.append(li__74738.clone().addClass("arrow").append(fb.jq.$.call(null, "<a></a>").text(i.name).attr("href", "proj").data("pid", i.id)))
    }, r);
    return fb.pages.swap_page.call(null, e, a)
  })
};
fb.proj.show_proj = function show_proj(e, origa) {
  fb.pages.load_template.call(null, "proj");
  var pid__74775 = origa.data("pid");
  var li__74776 = fb.jq.$.call(null, "<li></li>");
  var a__74777 = fb.jq.$.call(null, "<a></a>");
  var ul__74778 = fb.jq.$.call(null, "#newpage div.proj ul").append(li__74776.clone().addClass("addli").append(fb.jq.$.call(null, "<a></a>").text("Add Expense").data("pid", pid__74775).attr("href", "newcost")));
  var set_proj_data__74809 = function(id, name, tot, tx, settings) {
    fb.jq.$.call(null, "#newpage div.proj div.menu a").data("pid", pid__74775);
    fb.sql.do_costs.call(null, function(tx, r) {
      var costs__74786 = function() {
        var iter__2462__auto____74785 = function iter__74779(s__74780) {
          return new cljs.core.LazySeq(null, false, function() {
            var s__74780__74783 = s__74780;
            while(true) {
              if(cljs.core.seq.call(null, s__74780__74783)) {
                var c__74784 = cljs.core.first.call(null, s__74780__74783);
                return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([c__74784.id, c__74784.name, c__74784.tot], true), iter__74779.call(null, cljs.core.rest.call(null, s__74780__74783)))
              }else {
                return null
              }
              break
            }
          }, null)
        };
        return iter__2462__auto____74785.call(null, fb.sql.row_seq.call(null, r))
      }();
      var maxpaid__74787 = cljs.core.apply.call(null, cljs.core.max, cljs.core.map.call(null, function(p1__74735_SHARP_) {
        return cljs.core.nth.call(null, p1__74735_SHARP_, 2)
      }, costs__74786));
      var G__74788__74789 = cljs.core.seq.call(null, costs__74786);
      if(G__74788__74789) {
        var G__74791__74793 = cljs.core.first.call(null, G__74788__74789);
        var vec__74792__74794 = G__74791__74793;
        var cid__74795 = cljs.core.nth.call(null, vec__74792__74794, 0, null);
        var name__74796 = cljs.core.nth.call(null, vec__74792__74794, 1, null);
        var tot__74797 = cljs.core.nth.call(null, vec__74792__74794, 2, null);
        var G__74788__74798 = G__74788__74789;
        var G__74791__74799 = G__74791__74793;
        var G__74788__74800 = G__74788__74798;
        while(true) {
          var vec__74801__74802 = G__74791__74799;
          var cid__74803 = cljs.core.nth.call(null, vec__74801__74802, 0, null);
          var name__74804 = cljs.core.nth.call(null, vec__74801__74802, 1, null);
          var tot__74805 = cljs.core.nth.call(null, vec__74801__74802, 2, null);
          var G__74788__74806 = G__74788__74800;
          ul__74778.append(fb.vis.set_rect_back.call(null, li__74776.clone().addClass("arrow"), maxpaid__74787, tot__74805).append(a__74777.clone().text([cljs.core.str(name__74804), cljs.core.str(": ")].join("")).append(fb.vis.money.call(null, tot__74805)).data("cid", cid__74803).data("pid", pid__74775).attr("href", "cost")));
          var temp__3974__auto____74807 = cljs.core.next.call(null, G__74788__74806);
          if(temp__3974__auto____74807) {
            var G__74788__74808 = temp__3974__auto____74807;
            var G__74810 = cljs.core.first.call(null, G__74788__74808);
            var G__74811 = G__74788__74808;
            G__74791__74799 = G__74810;
            G__74788__74800 = G__74811;
            continue
          }else {
          }
          break
        }
      }else {
      }
      return ul__74778.append(li__74776.clone().addClass("rmli").append(a__74777.clone().text("Delete Project").data("pid", pid__74775).data("rm", "proj").data("anim", "pop").attr("href", "rm")))
    }, pid__74775);
    return fb.pages.swap_page.call(null, e, origa)
  };
  return fb.vis.set_title_project.call(null, set_proj_data__74809, pid__74775)
};
fb.pages.add_page_init_BANG_.call(null, "projects", fb.proj.show_projects);
fb.pages.add_page_init_BANG_.call(null, "new", fb.proj.show_new_form);
fb.pages.add_page_init_BANG_.call(null, "proj", fb.proj.show_proj);
goog.provide("fb.buddies");
goog.require("cljs.core");
goog.require("fb.vis");
goog.require("fb.pages");
goog.require("fb.jq");
goog.require("fb.misc");
goog.require("fb.sql");
goog.require("fb.pages");
goog.require("fb.misc");
goog.require("fb.vis");
goog.require("fb.sql");
goog.require("fb.jq");
fb.buddies.show_buddy = function show_buddy(e, origa) {
  fb.pages.load_template.call(null, "indivbuddy");
  var pid__75129 = origa.data("pid");
  var bid__75130 = origa.data("bid");
  var ul__75131 = fb.jq.$.call(null, "#newpage div.indivbuddy div.list ul");
  var title__75132 = fb.jq.$.call(null, "#newpage div.indivbuddy h2 div.title");
  var li__75133 = fb.jq.$.call(null, "<li></li>");
  var a__75134 = fb.jq.$.call(null, "<a></a>");
  var validate__75135 = fb.vis.mk_validate.call(null, "#newpage div.indivbuddy div.editname a");
  var update_name__75138 = function(e) {
    var v__75136 = fb.jq.$.call(null, "#content div.indivbuddy div.editname input").val();
    var done__75137 = function(e) {
      return fb.sql.do_buddy.call(null, function(p1__75075_SHARP_, p2__75074_SHARP_) {
        fb.jq.$.call(null, "#content div.indivbuddy span.buddy").text(p2__75074_SHARP_.rows.item(0).bname);
        return fb.jq.$.call(null, "#content div.indivbuddy div.list li.editnamebuttonid a").trigger("click")
      }, bid__75130)
    };
    if(cljs.core.count.call(null, v__75136) === 0) {
      alert("Empty name")
    }else {
      fb.sql.up_buddy.call(null, bid__75130, v__75136, "img", done__75137)
    }
    return false
  };
  var edit_name__75141 = function(e) {
    var a__75139 = fb.jq.$.call(null, cljs.core.first.call(null, fb.jq.$.call(null, e.currentTarget)));
    var editdiv__75140 = fb.jq.$.call(null, "#content div.indivbuddy div.editname");
    if(cljs.core.truth_(editdiv__75140.is(":visible"))) {
      editdiv__75140.hide();
      a__75139.text("Edit Name").parent().removeClass("rmli").addClass("addli")
    }else {
      editdiv__75140.show();
      a__75139.text("Cancel Edit Name").parent().removeClass("addli").addClass("rmli");
      editdiv__75140.find("input:first").focus();
      fb.jq.$.call(null, "#content div.indivbuddy div.editname a").hide()
    }
    return false
  };
  var set_edit__75144 = function(bname) {
    var div__75142 = fb.jq.$.call(null, "#newpage div.indivbuddy div.editname").hide();
    var inp__75143 = fb.jq.$.call(null, "#newpage div.indivbuddy div.editname input").val(bname);
    fb.jq.$.call(null, "#newpage div.indivbuddy div.editname").hide();
    fb.jq.$.call(null, "#newpage div.indivbuddy div.editname li.addli a").on("click", update_name__75138);
    fb.jq.$.call(null, "#newpage div.indivbuddy div.editname form").submit(update_name__75138);
    fb.vis.give_input_focus.call(null, inp__75143.keyup(validate__75135));
    return ul__75131.append(li__75133.clone().addClass("addli").addClass("editnamebuttonid").append(a__75134.clone().text("Edit name").data("pid", pid__75129).data("bid", bid__75130).attr("href", "null").on("click", edit_name__75141)))
  };
  var set_budd_data__75179 = function(id, name, tot, tx, settings) {
    return fb.sql.do_buddy.call(null, function(tx, r) {
      var i__75145 = r.rows.item(0);
      var nbc__75146 = r.rows.length;
      var costs__75154 = function() {
        var iter__2462__auto____75153 = function iter__75147(s__75148) {
          return new cljs.core.LazySeq(null, false, function() {
            var s__75148__75151 = s__75148;
            while(true) {
              if(cljs.core.seq.call(null, s__75148__75151)) {
                var c__75152 = cljs.core.first.call(null, s__75148__75151);
                return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([c__75152.cname, c__75152.ctot, c__75152.btot], true), iter__75147.call(null, cljs.core.rest.call(null, s__75148__75151)))
              }else {
                return null
              }
              break
            }
          }, null)
        };
        return iter__2462__auto____75153.call(null, fb.sql.row_seq.call(null, r))
      }();
      var tot__75155 = cljs.core.reduce.call(null, cljs.core._PLUS_, cljs.core.map.call(null, function(p1__75076_SHARP_) {
        return cljs.core.nth.call(null, p1__75076_SHARP_, 2)
      }, costs__75154));
      var maxpaid__75156 = cljs.core.apply.call(null, cljs.core.max, cljs.core.map.call(null, function(p1__75077_SHARP_) {
        return cljs.core.nth.call(null, p1__75077_SHARP_, 2)
      }, costs__75154));
      var bname__75157 = fb.vis.buddy.call(null, i__75145.bname);
      title__75132.append(bname__75157.clone()).append("'s total contribution: ").append(fb.vis.money.call(null, tot__75155));
      set_edit__75144.call(null, i__75145.bname);
      if(0 < tot__75155) {
        var G__75158__75159 = cljs.core.seq.call(null, costs__75154);
        if(G__75158__75159) {
          var G__75161__75163 = cljs.core.first.call(null, G__75158__75159);
          var vec__75162__75164 = G__75161__75163;
          var cname__75165 = cljs.core.nth.call(null, vec__75162__75164, 0, null);
          var ctot__75166 = cljs.core.nth.call(null, vec__75162__75164, 1, null);
          var btot__75167 = cljs.core.nth.call(null, vec__75162__75164, 2, null);
          var G__75158__75168 = G__75158__75159;
          var G__75161__75169 = G__75161__75163;
          var G__75158__75170 = G__75158__75168;
          while(true) {
            var vec__75171__75172 = G__75161__75169;
            var cname__75173 = cljs.core.nth.call(null, vec__75171__75172, 0, null);
            var ctot__75174 = cljs.core.nth.call(null, vec__75171__75172, 1, null);
            var btot__75175 = cljs.core.nth.call(null, vec__75171__75172, 2, null);
            var G__75158__75176 = G__75158__75170;
            ul__75131.append(fb.vis.set_rect_back.call(null, li__75133.clone().append(cname__75173).append(": ").append(bname__75157.clone()).append(" paid ").append(fb.vis.money.call(null, btot__75175)).append(" of ").append(fb.vis.money.call(null, ctot__75174)), maxpaid__75156, btot__75175));
            var temp__3974__auto____75177 = cljs.core.next.call(null, G__75158__75176);
            if(temp__3974__auto____75177) {
              var G__75158__75178 = temp__3974__auto____75177;
              var G__75180 = cljs.core.first.call(null, G__75158__75178);
              var G__75181 = G__75158__75178;
              G__75161__75169 = G__75180;
              G__75158__75170 = G__75181;
              continue
            }else {
            }
            break
          }
        }else {
        }
      }else {
      }
      ul__75131.append(li__75133.clone().addClass("rmli").append(a__75134.clone().text("Delete Buddy").data("pid", pid__75129).data("bid", bid__75130).data("rm", "buddy").data("anim", "pop").attr("href", "rm")));
      return fb.pages.swap_page.call(null, e, origa)
    }, bid__75130)
  };
  return fb.vis.set_title_project.call(null, set_budd_data__75179, pid__75129)
};
fb.buddies.append_buddy = function append_buddy(ul, li, pid, bid, name, maxpaid, btot) {
  return ul.append(fb.vis.set_rect_back.call(null, li.clone().addClass("arrow").append(fb.jq.$.call(null, "<a></a>").append(fb.vis.buddy.call(null, name)).append(": ").append(fb.vis.money.call(null, btot)).attr("href", "indivbuddy").data("bid", bid).data("pid", pid)), maxpaid, btot))
};
fb.buddies.add_page_buddy = function add_page_buddy() {
  var i__75190 = fb.jq.$.call(null, '#content div.buddies form [name="name"]');
  var name__75191 = i__75190.val();
  var pid__75192 = i__75190.data("pid");
  var addb__75196 = function(tx, r) {
    var ul__75193 = fb.jq.$.call(null, "#content div.buddies form div.list ul").show();
    var li__75194 = fb.jq.$.call(null, "<li></li>");
    var inp__75195 = fb.jq.$.call(null, '#content div.buddies form [name="name"]');
    inp__75195.val("");
    return fb.buddies.append_buddy.call(null, ul__75193, li__75194, pid__75192, r.insertId, fb.misc.trim.call(null, name__75191), 100, 0)
  };
  fb.jq.$.call(null, "#content div.buddies form ul li.addli a").hide();
  if(cljs.core.count.call(null, name__75191) <= 0) {
    alert("Invalid name")
  }else {
    fb.sql.add_buddy.call(null, pid__75192, name__75191, "img", addb__75196)
  }
  return false
};
fb.buddies.show_buddies = function show_buddies(e, origa) {
  fb.pages.load_template.call(null, "buddies");
  var pid__75234 = origa.data("pid");
  var inp__75235 = fb.jq.$.call(null, '#newpage div.buddies form [name="name"]');
  var ul__75236 = fb.jq.$.call(null, "#newpage div.buddies form div.list ul");
  var li__75237 = fb.jq.$.call(null, "<li></li>");
  var add__75238 = "#newpage div.buddies form ul li.addli a";
  var validate__75239 = fb.vis.mk_validate.call(null, add__75238);
  var set_buddy_data__75270 = function(id, name, tot, tx, settings) {
    fb.vis.give_input_focus.call(null, inp__75235.keyup(validate__75239).data("pid", pid__75234));
    fb.jq.$.call(null, "#newpage div.buddies form").submit(fb.buddies.add_page_buddy);
    fb.jq.$.call(null, add__75238).on("click", fb.buddies.add_page_buddy);
    fb.sql.do_buddies.call(null, function(tx, r) {
      var buds__75247 = function() {
        var iter__2462__auto____75246 = function iter__75240(s__75241) {
          return new cljs.core.LazySeq(null, false, function() {
            var s__75241__75244 = s__75241;
            while(true) {
              if(cljs.core.seq.call(null, s__75241__75244)) {
                var b__75245 = cljs.core.first.call(null, s__75241__75244);
                return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([b__75245.id, b__75245.bname, b__75245.btot], true), iter__75240.call(null, cljs.core.rest.call(null, s__75241__75244)))
              }else {
                return null
              }
              break
            }
          }, null)
        };
        return iter__2462__auto____75246.call(null, fb.sql.row_seq.call(null, r))
      }();
      var maxpaid__75248 = cljs.core.apply.call(null, cljs.core.max, cljs.core.map.call(null, function(p1__75182_SHARP_) {
        return cljs.core.nth.call(null, p1__75182_SHARP_, 2)
      }, buds__75247));
      var G__75249__75250 = cljs.core.seq.call(null, buds__75247);
      if(G__75249__75250) {
        var G__75252__75254 = cljs.core.first.call(null, G__75249__75250);
        var vec__75253__75255 = G__75252__75254;
        var id__75256 = cljs.core.nth.call(null, vec__75253__75255, 0, null);
        var bname__75257 = cljs.core.nth.call(null, vec__75253__75255, 1, null);
        var btot__75258 = cljs.core.nth.call(null, vec__75253__75255, 2, null);
        var G__75249__75259 = G__75249__75250;
        var G__75252__75260 = G__75252__75254;
        var G__75249__75261 = G__75249__75259;
        while(true) {
          var vec__75262__75263 = G__75252__75260;
          var id__75264 = cljs.core.nth.call(null, vec__75262__75263, 0, null);
          var bname__75265 = cljs.core.nth.call(null, vec__75262__75263, 1, null);
          var btot__75266 = cljs.core.nth.call(null, vec__75262__75263, 2, null);
          var G__75249__75267 = G__75249__75261;
          fb.buddies.append_buddy.call(null, ul__75236, li__75237, pid__75234, id__75264, bname__75265, maxpaid__75248, btot__75266);
          var temp__3974__auto____75268 = cljs.core.next.call(null, G__75249__75267);
          if(temp__3974__auto____75268) {
            var G__75249__75269 = temp__3974__auto____75268;
            var G__75271 = cljs.core.first.call(null, G__75249__75269);
            var G__75272 = G__75249__75269;
            G__75252__75260 = G__75271;
            G__75249__75261 = G__75272;
            continue
          }else {
          }
          break
        }
      }else {
      }
      if(cljs.core.count.call(null, buds__75247) === 0) {
        return ul__75236.hide()
      }else {
        return null
      }
    }, pid__75234);
    return fb.pages.swap_page.call(null, e, origa)
  };
  return fb.vis.set_title_project.call(null, set_buddy_data__75270, pid__75234)
};
fb.pages.add_page_init_BANG_.call(null, "indivbuddy", fb.buddies.show_buddy);
fb.pages.add_page_init_BANG_.call(null, "buddies", fb.buddies.show_buddies);
goog.provide("fb.total");
goog.require("cljs.core");
goog.require("fb.vis");
goog.require("fb.pages");
goog.require("fb.jq");
goog.require("fb.misc");
goog.require("fb.sql");
goog.require("fb.pages");
goog.require("fb.misc");
goog.require("fb.vis");
goog.require("fb.sql");
goog.require("fb.jq");
fb.total.show_total = function show_total(e, origa) {
  fb.pages.load_template.call(null, "total");
  var pid__74603 = origa.data("pid");
  var ul__74604 = fb.jq.$.call(null, "#newpage div.total div ul");
  var li__74605 = fb.jq.$.call(null, "<li></li>");
  var title__74606 = fb.jq.$.call(null, "#newpage h2 div.title");
  var set_total_data__74712 = function(id, name, tot, tx, settings) {
    fb.sql.do_total.call(null, function(buddies) {
      var abs__74607 = function(p1__74052_SHARP_) {
        if(0 < p1__74052_SHARP_) {
          return p1__74052_SHARP_
        }else {
          return-p1__74052_SHARP_
        }
      };
      var buds__74617 = function() {
        var iter__2462__auto____74616 = function iter__74608(s__74609) {
          return new cljs.core.LazySeq(null, false, function() {
            var s__74609__74613 = s__74609;
            while(true) {
              if(cljs.core.seq.call(null, s__74609__74613)) {
                var b__74614 = cljs.core.first.call(null, s__74609__74613);
                var av__74615 = cljs.core.reduce.call(null, function(b__74614) {
                  return function(p1__74053_SHARP_, p2__74054_SHARP_) {
                    return p1__74053_SHARP_ + (new cljs.core.Keyword("\ufdd0'ctot")).call(null, p2__74054_SHARP_) / (new cljs.core.Keyword("\ufdd0'nbbuds")).call(null, p2__74054_SHARP_)
                  }
                }(b__74614), 0, (new cljs.core.Keyword("\ufdd0'costs")).call(null, b__74614));
                return cljs.core.cons.call(null, cljs.core.assoc.call(null, b__74614, "\ufdd0'avg", av__74615, "\ufdd0'delta", abs__74607.call(null, (new cljs.core.Keyword("\ufdd0'btot")).call(null, b__74614) - av__74615)), iter__74608.call(null, cljs.core.rest.call(null, s__74609__74613)))
              }else {
                return null
              }
              break
            }
          }, null)
        };
        return iter__2462__auto____74616.call(null, buddies)
      }();
      var divbuds__74618 = cljs.core.group_by.call(null, function(p1__74055_SHARP_) {
        return(new cljs.core.Keyword("\ufdd0'avg")).call(null, p1__74055_SHARP_) > (new cljs.core.Keyword("\ufdd0'btot")).call(null, p1__74055_SHARP_)
      }, buds__74617);
      var maxpaid__74619 = cljs.core.apply.call(null, cljs.core.max, cljs.core.map.call(null, function(p1__74056_SHARP_) {
        return(new cljs.core.Keyword("\ufdd0'avg")).call(null, p1__74056_SHARP_) > (new cljs.core.Keyword("\ufdd0'btot")).call(null, p1__74056_SHARP_) ? (new cljs.core.Keyword("\ufdd0'avg")).call(null, p1__74056_SHARP_) : (new cljs.core.Keyword("\ufdd0'btot")).call(null, p1__74056_SHARP_)
      }, buds__74617));
      var cmp__74620 = function(p1__74057_SHARP_, p2__74058_SHARP_) {
        return(new cljs.core.Keyword("\ufdd0'btot")).call(null, p1__74057_SHARP_) < (new cljs.core.Keyword("\ufdd0'btot")).call(null, p2__74058_SHARP_)
      };
      var bgive__74621 = cljs.core.sort.call(null, cmp__74620, divbuds__74618.call(null, true));
      var btake__74622 = cljs.core.sort.call(null, cmp__74620, divbuds__74618.call(null, false));
      var owes__74665 = function() {
        var G__74625__74629 = cljs.core.first.call(null, btake__74622);
        var map__74627__74630 = G__74625__74629;
        var map__74627__74631 = cljs.core.seq_QMARK_.call(null, map__74627__74630) ? cljs.core.apply.call(null, cljs.core.hash_map, map__74627__74630) : map__74627__74630;
        var t__74632 = map__74627__74631;
        var tdelta__74633 = cljs.core._lookup.call(null, map__74627__74631, "\ufdd0'delta", null);
        var ttot__74634 = cljs.core._lookup.call(null, map__74627__74631, "\ufdd0'btot", null);
        var ts__74635 = cljs.core.next.call(null, btake__74622);
        var G__74626__74636 = cljs.core.first.call(null, bgive__74621);
        var map__74628__74637 = G__74626__74636;
        var map__74628__74638 = cljs.core.seq_QMARK_.call(null, map__74628__74637) ? cljs.core.apply.call(null, cljs.core.hash_map, map__74628__74637) : map__74628__74637;
        var g__74639 = map__74628__74638;
        var gdelta__74640 = cljs.core._lookup.call(null, map__74628__74638, "\ufdd0'delta", null);
        var gtot__74641 = cljs.core._lookup.call(null, map__74628__74638, "\ufdd0'btot", null);
        var gs__74642 = cljs.core.next.call(null, bgive__74621);
        var ac__74643 = cljs.core.PersistentVector.EMPTY;
        var G__74625__74644 = G__74625__74629;
        var ts__74645 = ts__74635;
        var G__74626__74646 = G__74626__74636;
        var gs__74647 = gs__74642;
        var ac__74648 = ac__74643;
        while(true) {
          var map__74649__74651 = G__74625__74644;
          var map__74649__74652 = cljs.core.seq_QMARK_.call(null, map__74649__74651) ? cljs.core.apply.call(null, cljs.core.hash_map, map__74649__74651) : map__74649__74651;
          var t__74653 = map__74649__74652;
          var tdelta__74654 = cljs.core._lookup.call(null, map__74649__74652, "\ufdd0'delta", null);
          var ttot__74655 = cljs.core._lookup.call(null, map__74649__74652, "\ufdd0'btot", null);
          var ts__74656 = ts__74645;
          var map__74650__74657 = G__74626__74646;
          var map__74650__74658 = cljs.core.seq_QMARK_.call(null, map__74650__74657) ? cljs.core.apply.call(null, cljs.core.hash_map, map__74650__74657) : map__74650__74657;
          var g__74659 = map__74650__74658;
          var gdelta__74660 = cljs.core._lookup.call(null, map__74650__74658, "\ufdd0'delta", null);
          var gtot__74661 = cljs.core._lookup.call(null, map__74650__74658, "\ufdd0'btot", null);
          var gs__74662 = gs__74647;
          var ac__74663 = ac__74648;
          if(cljs.core.truth_(function() {
            var and__3822__auto____74664 = g__74659;
            if(cljs.core.truth_(and__3822__auto____74664)) {
              return t__74653
            }else {
              return and__3822__auto____74664
            }
          }())) {
            if(tdelta__74654 > gdelta__74660) {
              var G__74713 = cljs.core.assoc.call(null, t__74653, "\ufdd0'delta", tdelta__74654 - gdelta__74660);
              var G__74714 = ts__74656;
              var G__74715 = cljs.core.first.call(null, gs__74662);
              var G__74716 = cljs.core.next.call(null, gs__74662);
              var G__74717 = cljs.core.conj.call(null, ac__74663, cljs.core.PersistentVector.fromArray([g__74659, t__74653, gdelta__74660], true));
              G__74625__74644 = G__74713;
              ts__74645 = G__74714;
              G__74626__74646 = G__74715;
              gs__74647 = G__74716;
              ac__74648 = G__74717;
              continue
            }else {
              var G__74718 = cljs.core.first.call(null, ts__74656);
              var G__74719 = cljs.core.next.call(null, ts__74656);
              var G__74720 = cljs.core.assoc.call(null, g__74659, "\ufdd0'delta", gdelta__74660 - tdelta__74654);
              var G__74721 = gs__74662;
              var G__74722 = tdelta__74654 > 0 ? cljs.core.conj.call(null, ac__74663, cljs.core.PersistentVector.fromArray([g__74659, t__74653, tdelta__74654], true)) : ac__74663;
              G__74625__74644 = G__74718;
              ts__74645 = G__74719;
              G__74626__74646 = G__74720;
              gs__74647 = G__74721;
              ac__74648 = G__74722;
              continue
            }
          }else {
            return ac__74663
          }
          break
        }
      }();
      title__74606.append("Total: ").append(fb.vis.money.call(null, tot));
      var G__74666__74667 = cljs.core.seq.call(null, buds__74617);
      if(G__74666__74667) {
        var G__74669__74671 = cljs.core.first.call(null, G__74666__74667);
        var map__74670__74672 = G__74669__74671;
        var map__74670__74673 = cljs.core.seq_QMARK_.call(null, map__74670__74672) ? cljs.core.apply.call(null, cljs.core.hash_map, map__74670__74672) : map__74670__74672;
        var n__74674 = cljs.core._lookup.call(null, map__74670__74673, "\ufdd0'bname", null);
        var t__74675 = cljs.core._lookup.call(null, map__74670__74673, "\ufdd0'btot", null);
        var a__74676 = cljs.core._lookup.call(null, map__74670__74673, "\ufdd0'avg", null);
        var d__74677 = cljs.core._lookup.call(null, map__74670__74673, "\ufdd0'delta", null);
        var G__74666__74678 = G__74666__74667;
        var G__74669__74679 = G__74669__74671;
        var G__74666__74680 = G__74666__74678;
        while(true) {
          var map__74681__74682 = G__74669__74679;
          var map__74681__74683 = cljs.core.seq_QMARK_.call(null, map__74681__74682) ? cljs.core.apply.call(null, cljs.core.hash_map, map__74681__74682) : map__74681__74682;
          var n__74684 = cljs.core._lookup.call(null, map__74681__74683, "\ufdd0'bname", null);
          var t__74685 = cljs.core._lookup.call(null, map__74681__74683, "\ufdd0'btot", null);
          var a__74686 = cljs.core._lookup.call(null, map__74681__74683, "\ufdd0'avg", null);
          var d__74687 = cljs.core._lookup.call(null, map__74681__74683, "\ufdd0'delta", null);
          var G__74666__74688 = G__74666__74680;
          ul__74604.append(fb.vis.set_tot_rect_back.call(null, li__74605.clone().append(fb.vis.buddy.call(null, n__74684)).append(" paid: ").append(fb.vis.money.call(null, t__74685)).append(t__74685 > a__74686 ? " needs: " : " owes: ").append(fb.vis.money.call(null, d__74687)), maxpaid__74619, a__74686, t__74685));
          var temp__3974__auto____74689 = cljs.core.next.call(null, G__74666__74688);
          if(temp__3974__auto____74689) {
            var G__74666__74690 = temp__3974__auto____74689;
            var G__74723 = cljs.core.first.call(null, G__74666__74690);
            var G__74724 = G__74666__74690;
            G__74669__74679 = G__74723;
            G__74666__74680 = G__74724;
            continue
          }else {
          }
          break
        }
      }else {
      }
      ul__74604.append(li__74605.clone().addClass("sepli").text("Solution:"));
      var G__74691__74692 = cljs.core.seq.call(null, owes__74665);
      if(G__74691__74692) {
        var G__74694__74696 = cljs.core.first.call(null, G__74691__74692);
        var vec__74695__74697 = G__74694__74696;
        var gn__74698 = cljs.core.nth.call(null, vec__74695__74697, 0, null);
        var tn__74699 = cljs.core.nth.call(null, vec__74695__74697, 1, null);
        var tot__74700 = cljs.core.nth.call(null, vec__74695__74697, 2, null);
        var G__74691__74701 = G__74691__74692;
        var G__74694__74702 = G__74694__74696;
        var G__74691__74703 = G__74691__74701;
        while(true) {
          var vec__74704__74705 = G__74694__74702;
          var gn__74706 = cljs.core.nth.call(null, vec__74704__74705, 0, null);
          var tn__74707 = cljs.core.nth.call(null, vec__74704__74705, 1, null);
          var tot__74708 = cljs.core.nth.call(null, vec__74704__74705, 2, null);
          var G__74691__74709 = G__74691__74703;
          ul__74604.append(li__74605.clone().append(fb.vis.buddy.call(null, (new cljs.core.Keyword("\ufdd0'bname")).call(null, gn__74706))).append(" owes ").append(fb.vis.money.call(null, tot__74708)).append(" to ").append(fb.vis.buddy.call(null, (new cljs.core.Keyword("\ufdd0'bname")).call(null, tn__74707))));
          var temp__3974__auto____74710 = cljs.core.next.call(null, G__74691__74709);
          if(temp__3974__auto____74710) {
            var G__74691__74711 = temp__3974__auto____74710;
            var G__74725 = cljs.core.first.call(null, G__74691__74711);
            var G__74726 = G__74691__74711;
            G__74694__74702 = G__74725;
            G__74691__74703 = G__74726;
            continue
          }else {
          }
          break
        }
      }else {
      }
      if(cljs.core.count.call(null, buds__74617) === 0) {
        return ul__74604.remove()
      }else {
        return null
      }
    }, pid__74603);
    return fb.pages.swap_page.call(null, e, origa)
  };
  return fb.vis.set_title_project.call(null, set_total_data__74712, pid__74603)
};
fb.pages.add_page_init_BANG_.call(null, "total", fb.total.show_total);
goog.provide("fb.settings");
goog.require("cljs.core");
goog.require("fb.init");
goog.require("fb.vis");
goog.require("fb.pages");
goog.require("fb.jq");
goog.require("fb.misc");
goog.require("fb.sql");
goog.require("fb.init");
goog.require("fb.pages");
goog.require("fb.misc");
goog.require("fb.vis");
goog.require("fb.sql");
goog.require("fb.jq");
fb.settings.show_settings = function show_settings(e, origa) {
  fb.pages.load_template.call(null, "settings");
  var pid__74831 = origa.data("pid");
  var menu__74832 = fb.jq.$.call(null, "#newpage div.settings .toolbar");
  var ulPos__74833 = fb.jq.$.call(null, "#newpage div.settings ul.menuPos");
  var ulTheme__74834 = fb.jq.$.call(null, "#newpage div.settings ul.theme");
  var ulHelp__74835 = fb.jq.$.call(null, "#newpage div.settings ul.help");
  var ulOptin__74836 = fb.jq.$.call(null, "#newpage div.settings ul.optin");
  var liApply__74837 = fb.jq.$.call(null, "#newpage div.settings ul.apply li");
  var li__74838 = fb.jq.$.call(null, "<li></li>");
  var a__74839 = fb.jq.$.call(null, "<a></a>");
  var inp__74840 = fb.jq.$.call(null, "<input />");
  var add_inp__74841 = function(li, type, title, grp, check_QMARK_, data) {
    return fb.vis.give_input_focus.call(null, li.clone().append(fb.misc.add_data.call(null, inp__74840.clone(), "inp", data).attr("checked", check_QMARK_).attr("title", title).attr("value", title).attr("type", type).attr("name", grp)), "\ufdd0'li", "\ufdd0'radio").append()
  };
  var update__74848 = function(e) {
    fb.sql.do_settings.call(null, function(settings) {
      var settings__74847 = cljs.core.ObjMap.fromObject(["\ufdd0'menuOn", "\ufdd0'menuPos", "\ufdd0'optIn", "\ufdd0'help", "\ufdd0'theme"], {"\ufdd0'menuOn":(new cljs.core.Keyword("\ufdd0'menuOn")).call(null, settings), "\ufdd0'menuPos":function() {
        var pred__74842__74845 = cljs.core._EQ_;
        var expr__74843__74846 = fb.jq.$.call(null, '#content input[name="menuPos"]:checked').data("type");
        if(pred__74842__74845.call(null, "top", expr__74843__74846)) {
          return"\ufdd0'top"
        }else {
          if(pred__74842__74845.call(null, "bottom", expr__74843__74846)) {
            return"\ufdd0'bottom"
          }else {
            throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__74843__74846)].join(""));
          }
        }
      }(), "\ufdd0'optIn":cljs.core._EQ_.call(null, "optin", fb.jq.$.call(null, '#content input[name="optIn"]:checked').data("type")), "\ufdd0'help":fb.jq.$.call(null, '#content input[name="help"]').attr("checked"), "\ufdd0'theme":fb.jq.$.call(null, '#content input[name="theme"]:checked').data("theme")});
      return fb.sql.update_settings.call(null, settings__74847, function() {
        fb.vis.set_theme.call(null, settings__74847);
        fb.pages.trigger_new_page.call(null, "back", null);
        return false
      })
    });
    return false
  };
  var set_settings__74849 = function(settings) {
    ulOptin__74836.append(li__74838.clone().addClass("sepli").text("Add Expense Behaviour:")).append(add_inp__74841.call(null, li__74838, "radio", "Opt In by default", "optIn", (new cljs.core.Keyword("\ufdd0'optIn")).call(null, settings), cljs.core.ObjMap.fromObject(["inp"], {"inp":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["type", "optin"], true)], true)}))).append(add_inp__74841.call(null, li__74838, "radio", "Opt Out by default", "optIn", cljs.core.not.call(null, 
    (new cljs.core.Keyword("\ufdd0'optIn")).call(null, settings)), cljs.core.ObjMap.fromObject(["inp"], {"inp":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["type", "optout"], true)], true)})));
    ulPos__74833.append(li__74838.clone().addClass("sepli").text("Menu Placement:")).append(add_inp__74841.call(null, li__74838, "radio", "Top", "menuPos", cljs.core._EQ_.call(null, "\ufdd0'top", (new cljs.core.Keyword("\ufdd0'menuPos")).call(null, settings)), cljs.core.ObjMap.fromObject(["inp"], {"inp":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["type", "top"], true)], true)}))).append(add_inp__74841.call(null, li__74838, "radio", "Bottom", "menuPos", cljs.core._EQ_.call(null, 
    "\ufdd0'bottom", (new cljs.core.Keyword("\ufdd0'menuPos")).call(null, settings)), cljs.core.ObjMap.fromObject(["inp"], {"inp":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["type", "bottom"], true)], true)})));
    ulHelp__74835.append(li__74838.clone().addClass("sepli").text("Help/Info:")).append(add_inp__74841.call(null, li__74838, "checkbox", "Display Help", "help", (new cljs.core.Keyword("\ufdd0'help")).call(null, settings), cljs.core.ObjMap.fromObject(["inp"], {"inp":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["type", "help"], true)], true)})));
    ulTheme__74834.append(li__74838.clone().addClass("sepli").text("Theme:")).append(add_inp__74841.call(null, li__74838, "radio", "Grey", "theme", cljs.core._EQ_.call(null, "jqtouch-edited", (new cljs.core.Keyword("\ufdd0'theme")).call(null, settings)), cljs.core.ObjMap.fromObject(["inp"], {"inp":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["theme", "jqtouch-edited"], true)], true)}))).append(add_inp__74841.call(null, li__74838, "radio", "Blue", "theme", cljs.core._EQ_.call(null, 
    "blue", (new cljs.core.Keyword("\ufdd0'theme")).call(null, settings)), cljs.core.ObjMap.fromObject(["inp"], {"inp":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["theme", "blue"], true)], true)}))).append(add_inp__74841.call(null, li__74838, "radio", "Green", "theme", cljs.core._EQ_.call(null, "green", (new cljs.core.Keyword("\ufdd0'theme")).call(null, settings)), cljs.core.ObjMap.fromObject(["inp"], {"inp":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["theme", 
    "green"], true)], true)}))).append(add_inp__74841.call(null, li__74838, "radio", "Red", "theme", cljs.core._EQ_.call(null, "red", (new cljs.core.Keyword("\ufdd0'theme")).call(null, settings)), cljs.core.ObjMap.fromObject(["inp"], {"inp":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["theme", "red"], true)], true)})));
    liApply__74837.addClass("addli").append(a__74839.clone().attr("href", "back").text("Apply").on("click", update__74848));
    fb.jq.$.call(null, "#newpage div.settings form").submit(update__74848);
    return fb.pages.swap_page.call(null, e, origa)
  };
  menu__74832.append(a__74839.clone().addClass("back").attr("href", "back").text("Back"));
  return fb.sql.do_settings.call(null, set_settings__74849)
};
fb.pages.add_page_init_BANG_.call(null, "settings", fb.settings.show_settings);
fb.init.add_init_BANG_.call(null, function() {
  return fb.sql.do_settings.call(null, fb.vis.set_theme)
});
goog.provide("fb.cost");
goog.require("cljs.core");
goog.require("fb.vis");
goog.require("fb.pages");
goog.require("fb.jq");
goog.require("fb.misc");
goog.require("fb.sql");
goog.require("fb.pages");
goog.require("fb.misc");
goog.require("fb.vis");
goog.require("fb.sql");
goog.require("fb.jq");
fb.cost.show_cost = function show_cost(e, origa) {
  fb.pages.load_template.call(null, "cost");
  var pid__75557 = origa.data("pid");
  var cid__75558 = origa.data("cid");
  var ul__75559 = fb.jq.$.call(null, "#newpage div.cost div ul");
  var ti__75560 = fb.jq.$.call(null, "#newpage div.cost div.title");
  var li__75561 = fb.jq.$.call(null, "<li></li>");
  var a__75562 = fb.jq.$.call(null, "<a></a>");
  var set_cost_data__75594 = function(id, name, tot, tx, settings) {
    fb.sql.do_cost.call(null, function(tx, r) {
      var i__75563 = r.rows.item(0);
      var buds__75571 = function() {
        var iter__2462__auto____75570 = function iter__75564(s__75565) {
          return new cljs.core.LazySeq(null, false, function() {
            var s__75565__75568 = s__75565;
            while(true) {
              if(cljs.core.seq.call(null, s__75565__75568)) {
                var b__75569 = cljs.core.first.call(null, s__75565__75568);
                return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([b__75569.bname, b__75569.btot, b__75569.ctot], true), iter__75564.call(null, cljs.core.rest.call(null, s__75565__75568)))
              }else {
                return null
              }
              break
            }
          }, null)
        };
        return iter__2462__auto____75570.call(null, fb.sql.row_seq.call(null, r))
      }();
      var maxpaid__75572 = cljs.core.apply.call(null, cljs.core.max, cljs.core.map.call(null, function(p1__75512_SHARP_) {
        return cljs.core.nth.call(null, p1__75512_SHARP_, 1)
      }, buds__75571));
      ti__75560.append([cljs.core.str(i__75563.cname), cljs.core.str(": ")].join("")).append(fb.vis.money.call(null, i__75563.ctot));
      ul__75559.append(li__75561.clone().addClass("addli").append(a__75562.clone().text("Edit").data("pid", pid__75557).data("cid", cid__75558).attr("href", "newcost")));
      var G__75573__75574 = cljs.core.seq.call(null, buds__75571);
      if(G__75573__75574) {
        var G__75576__75578 = cljs.core.first.call(null, G__75573__75574);
        var vec__75577__75579 = G__75576__75578;
        var name__75580 = cljs.core.nth.call(null, vec__75577__75579, 0, null);
        var btot__75581 = cljs.core.nth.call(null, vec__75577__75579, 1, null);
        var ctot__75582 = cljs.core.nth.call(null, vec__75577__75579, 2, null);
        var G__75573__75583 = G__75573__75574;
        var G__75576__75584 = G__75576__75578;
        var G__75573__75585 = G__75573__75583;
        while(true) {
          var vec__75586__75587 = G__75576__75584;
          var name__75588 = cljs.core.nth.call(null, vec__75586__75587, 0, null);
          var btot__75589 = cljs.core.nth.call(null, vec__75586__75587, 1, null);
          var ctot__75590 = cljs.core.nth.call(null, vec__75586__75587, 2, null);
          var G__75573__75591 = G__75573__75585;
          ul__75559.append(fb.vis.set_rect_back.call(null, li__75561.clone().append(fb.vis.buddy.call(null, name__75588)).append(": ").append(fb.vis.money.call(null, btot__75589)).data("cid", cid__75558).data("pid", pid__75557), maxpaid__75572, btot__75589));
          var temp__3974__auto____75592 = cljs.core.next.call(null, G__75573__75591);
          if(temp__3974__auto____75592) {
            var G__75573__75593 = temp__3974__auto____75592;
            var G__75595 = cljs.core.first.call(null, G__75573__75593);
            var G__75596 = G__75573__75593;
            G__75576__75584 = G__75595;
            G__75573__75585 = G__75596;
            continue
          }else {
          }
          break
        }
      }else {
      }
      return ul__75559.append(li__75561.clone().addClass("rmli").append(a__75562.clone().text("Delete Expense").data("pid", pid__75557).data("cid", cid__75558).data("rm", "cost").data("anim", "pop").attr("href", "rm")))
    }, cid__75558);
    return fb.pages.swap_page.call(null, e, origa)
  };
  return fb.vis.set_title_project.call(null, set_cost_data__75594, pid__75557)
};
fb.cost.add_page_cost = function add_page_cost() {
  var i__75623 = fb.jq.$.call(null, '#content div.newcost form [name="name"]');
  var name__75624 = i__75623.val();
  var pid__75625 = i__75623.data("pid");
  var cid__75626 = i__75623.data("cid");
  var costs__75642 = function() {
    var iter__2462__auto____75641 = function iter__75627(s__75628) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__75628__75635 = s__75628;
        while(true) {
          if(cljs.core.seq.call(null, s__75628__75635)) {
            var i__75636 = cljs.core.first.call(null, s__75628__75635);
            var e__75637 = fb.jq.$.call(null, i__75636);
            var rid__75638 = e__75637.data("rid");
            var bid__75639 = e__75637.data("bid");
            var o_QMARK___75640 = e__75637.parent().find('input[name="optin"]').attr("checked");
            return cljs.core.cons.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'rid", "\ufdd0'bid", "\ufdd0'o?", "\ufdd0'tot"], {"\ufdd0'rid":rid__75638, "\ufdd0'bid":bid__75639, "\ufdd0'o?":o_QMARK___75640, "\ufdd0'tot":fb.misc.num.call(null, e__75637.val())}), iter__75627.call(null, cljs.core.rest.call(null, s__75628__75635)))
          }else {
            return null
          }
          break
        }
      }, null)
    };
    return iter__2462__auto____75641.call(null, fb.jq.$.call(null, '#content div.newcost form div.buddieslist [name="tot"]'))
  }();
  var total__75643 = cljs.core.reduce.call(null, function(p1__75513_SHARP_, p2__75514_SHARP_) {
    return p1__75513_SHARP_ + (cljs.core.truth_((new cljs.core.Keyword("\ufdd0'o?")).call(null, p2__75514_SHARP_)) ? (new cljs.core.Keyword("\ufdd0'tot")).call(null, p2__75514_SHARP_) : 0)
  }, 0, costs__75642);
  var done__75644 = function() {
    return fb.pages.trigger_new_page.call(null, "proj", cljs.core.ObjMap.fromObject(["proj"], {"proj":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["pid", pid__75625], true)], true)}))
  };
  if(cljs.core.count.call(null, name__75624) <= 0) {
    alert("Invalid name")
  }else {
    if(total__75643 <= 0) {
      alert("No money")
    }else {
      if(cljs.core.truth_(cid__75626)) {
        fb.sql.up_cost.call(null, cid__75626, name__75624, cljs.core.filter.call(null, function(p1__75515_SHARP_) {
          var and__3822__auto____75645 = (new cljs.core.Keyword("\ufdd0'rid")).call(null, p1__75515_SHARP_) === 0;
          if(and__3822__auto____75645) {
            return(new cljs.core.Keyword("\ufdd0'o?")).call(null, p1__75515_SHARP_)
          }else {
            return and__3822__auto____75645
          }
        }, costs__75642), cljs.core.filter.call(null, function(p1__75516_SHARP_) {
          var and__3822__auto____75646 = (new cljs.core.Keyword("\ufdd0'rid")).call(null, p1__75516_SHARP_) > 0;
          if(and__3822__auto____75646) {
            return(new cljs.core.Keyword("\ufdd0'o?")).call(null, p1__75516_SHARP_)
          }else {
            return and__3822__auto____75646
          }
        }, costs__75642), cljs.core.filter.call(null, function(p1__75517_SHARP_) {
          var and__3822__auto____75647 = (new cljs.core.Keyword("\ufdd0'rid")).call(null, p1__75517_SHARP_) > 0;
          if(and__3822__auto____75647) {
            return cljs.core.not.call(null, (new cljs.core.Keyword("\ufdd0'o?")).call(null, p1__75517_SHARP_))
          }else {
            return and__3822__auto____75647
          }
        }, costs__75642), pid__75625, total__75643, done__75644)
      }else {
        fb.sql.add_cost.call(null, name__75624, cljs.core.filter.call(null, function(p1__75518_SHARP_) {
          return(new cljs.core.Keyword("\ufdd0'o?")).call(null, p1__75518_SHARP_)
        }, costs__75642), pid__75625, total__75643, done__75644)
      }
    }
  }
  return false
};
fb.cost.show_new_cost = function show_new_cost(e, origa) {
  fb.pages.load_template.call(null, "newcost");
  var pid__75725 = origa.data("pid");
  var cid__75726 = origa.data("cid");
  var inp__75727 = fb.jq.$.call(null, '#newpage div.newcost form [name="name"]');
  var ul__75728 = fb.jq.$.call(null, "#newpage div.newcost form div.buddieslist ul");
  var label__75729 = fb.jq.$.call(null, "<label></label>");
  var li__75730 = fb.jq.$.call(null, "<li></li>");
  var div__75731 = fb.jq.$.call(null, "<span></span>");
  var binput__75732 = fb.jq.$.call(null, '<input type="number" step="any" min="0" class="numbers" name="tot" />');
  var cinput__75733 = fb.jq.$.call(null, '<input type="checkbox" name="optin" />').attr("tabindex", 1E3);
  var optinfo__75734 = fb.jq.$.call(null, '<span class="optout"> has opted out of this expense.</span>').hide();
  var validate__75750 = function(e) {
    var total__75735 = fb.jq.$.call(null, "#content div.newcost .costtotal");
    var alli__75736 = fb.jq.$.call(null, '#content div.newcost form div.buddieslist [name="tot"]');
    var name__75737 = fb.jq.$.call(null, '#content div.newcost form [name="name"]').val();
    var addb__75738 = fb.jq.$.call(null, "#content div.newcost form div.buddieslist ul li.addli a");
    var tot__75748 = cljs.core.reduce.call(null, cljs.core._PLUS_, 0, function() {
      var iter__2462__auto____75747 = function iter__75739(s__75740) {
        return new cljs.core.LazySeq(null, false, function() {
          var s__75740__75744 = s__75740;
          while(true) {
            if(cljs.core.seq.call(null, s__75740__75744)) {
              var i__75745 = cljs.core.first.call(null, s__75740__75744);
              var i__75746 = fb.jq.$.call(null, i__75745);
              if(cljs.core.truth_(i__75746.is(":visible"))) {
                return cljs.core.cons.call(null, fb.misc.num.call(null, i__75746.val()), iter__75739.call(null, cljs.core.rest.call(null, s__75740__75744)))
              }else {
                var G__75802 = cljs.core.rest.call(null, s__75740__75744);
                s__75740__75744 = G__75802;
                continue
              }
            }else {
              return null
            }
            break
          }
        }, null)
      };
      return iter__2462__auto____75747.call(null, alli__75736)
    }());
    total__75735.html(fb.vis.money.call(null, tot__75748));
    if(function() {
      var or__3824__auto____75749 = tot__75748 <= 0;
      if(or__3824__auto____75749) {
        return or__3824__auto____75749
      }else {
        return cljs.core.count.call(null, name__75737) <= 0
      }
    }()) {
      return addb__75738.hide()
    }else {
      return addb__75738.show()
    }
  };
  var opt_vis__75754 = function(li, c_QMARK_) {
    var ninp__75751 = fb.jq.$.call(null, li.find('input[name="tot"]'));
    var info__75752 = fb.jq.$.call(null, li.find("span.optout"));
    var bud__75753 = fb.jq.$.call(null, li.find("span.buddy"));
    if(cljs.core.truth_(c_QMARK_)) {
      bud__75753.removeClass("unselected");
      info__75752.hide();
      ninp__75751.show()
    }else {
      bud__75753.addClass("unselected");
      info__75752.show();
      ninp__75751.hide()
    }
    return validate__75750.call(null, null)
  };
  var opt_toggle__75758 = function(src, child) {
    return src.on("click", function(e) {
      var li__75755 = fb.jq.$.call(null, e.currentTarget).parents("li");
      var cinp__75756 = li__75755.find('input[name="optin"]');
      var c_QMARK___75757 = cljs.core.not.call(null, cinp__75756.attr("checked"));
      cinp__75756.attr("checked", c_QMARK___75757);
      opt_vis__75754.call(null, li__75755, c_QMARK___75757);
      return true
    })
  };
  var opt_set__75762 = function(li, settings) {
    var cinp__75759 = fb.jq.$.call(null, li.find('input[name="optin"]'));
    var rid__75760 = cinp__75759.data("rid");
    var c_QMARK___75761 = cljs.core.truth_(cid__75726) ? rid__75760 > 0 : (new cljs.core.Keyword("\ufdd0'optIn")).call(null, settings);
    cinp__75759.attr("checked", c_QMARK___75761);
    opt_vis__75754.call(null, li, c_QMARK___75761);
    return li
  };
  var set_buddy_data__75801 = function(id, name, tot, tx, settings) {
    fb.vis.give_input_focus.call(null, inp__75727.keyup(validate__75750).data("cid", cid__75726).data("pid", pid__75725));
    fb.sql.do_buddies.call(null, function(tx, r) {
      if(r.rows.length > 0) {
        var buds__75777 = cljs.core.truth_(cid__75726) ? function() {
          var iter__2462__auto____75769 = function iter__75763(s__75764) {
            return new cljs.core.LazySeq(null, false, function() {
              var s__75764__75767 = s__75764;
              while(true) {
                if(cljs.core.seq.call(null, s__75764__75767)) {
                  var b__75768 = cljs.core.first.call(null, s__75764__75767);
                  return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([b__75768.bname, b__75768.id, b__75768.btot, b__75768.rid], true), iter__75763.call(null, cljs.core.rest.call(null, s__75764__75767)))
                }else {
                  return null
                }
                break
              }
            }, null)
          };
          return iter__2462__auto____75769.call(null, fb.sql.row_seq.call(null, r))
        }() : function() {
          var iter__2462__auto____75776 = function iter__75770(s__75771) {
            return new cljs.core.LazySeq(null, false, function() {
              var s__75771__75774 = s__75771;
              while(true) {
                if(cljs.core.seq.call(null, s__75771__75774)) {
                  var b__75775 = cljs.core.first.call(null, s__75771__75774);
                  return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([b__75775.bname, b__75775.id, 0, null], true), iter__75770.call(null, cljs.core.rest.call(null, s__75771__75774)))
                }else {
                  return null
                }
                break
              }
            }, null)
          };
          return iter__2462__auto____75776.call(null, fb.sql.row_seq.call(null, r))
        }();
        var G__75778__75779 = cljs.core.seq.call(null, buds__75777);
        if(G__75778__75779) {
          var G__75781__75783 = cljs.core.first.call(null, G__75778__75779);
          var vec__75782__75784 = G__75781__75783;
          var bname__75785 = cljs.core.nth.call(null, vec__75782__75784, 0, null);
          var bid__75786 = cljs.core.nth.call(null, vec__75782__75784, 1, null);
          var btot__75787 = cljs.core.nth.call(null, vec__75782__75784, 2, null);
          var rid__75788 = cljs.core.nth.call(null, vec__75782__75784, 3, null);
          var G__75778__75789 = G__75778__75779;
          var G__75781__75790 = G__75781__75783;
          var G__75778__75791 = G__75778__75789;
          while(true) {
            var vec__75792__75793 = G__75781__75790;
            var bname__75794 = cljs.core.nth.call(null, vec__75792__75793, 0, null);
            var bid__75795 = cljs.core.nth.call(null, vec__75792__75793, 1, null);
            var btot__75796 = cljs.core.nth.call(null, vec__75792__75793, 2, null);
            var rid__75797 = cljs.core.nth.call(null, vec__75792__75793, 3, null);
            var G__75778__75798 = G__75778__75791;
            ul__75728.append(fb.vis.give_input_focus.call(null, opt_set__75762.call(null, li__75730.clone().append(opt_toggle__75758.call(null, div__75731.clone().append(opt_toggle__75758.call(null, cinput__75733.clone().data("bid", bid__75795).data("rid", rid__75797), "\ufdd0'current")).append(" ").append(label__75729.clone().append(fb.vis.buddy.call(null, bname__75794)).append(":")).append(optinfo__75734.clone()), 'input[name="optin"]')).append(function(G__75781__75790, G__75778__75791, vec__75792__75793, 
            bname__75794, bid__75795, btot__75796, rid__75797, G__75778__75798) {
              return function(p1__75597_SHARP_) {
                if(btot__75796 === 0) {
                  return p1__75597_SHARP_
                }else {
                  return p1__75597_SHARP_.val(btot__75796)
                }
              }
            }(G__75781__75790, G__75778__75791, vec__75792__75793, bname__75794, bid__75795, btot__75796, rid__75797, G__75778__75798).call(null, binput__75732.clone().data("pid", pid__75725).data("bid", bid__75795).data("rid", rid__75797).attr("placeholder", [cljs.core.str(bname__75794), cljs.core.str(" paid...")].join(""))).keyup(validate__75750)), settings), "\ufdd0'li"));
            var temp__3974__auto____75799 = cljs.core.next.call(null, G__75778__75798);
            if(temp__3974__auto____75799) {
              var G__75778__75800 = temp__3974__auto____75799;
              var G__75803 = cljs.core.first.call(null, G__75778__75800);
              var G__75804 = G__75778__75800;
              G__75781__75790 = G__75803;
              G__75778__75791 = G__75804;
              continue
            }else {
            }
            break
          }
        }else {
        }
        if(cljs.core.truth_(cid__75726)) {
          inp__75727.val(r.rows.item(0).cname)
        }else {
        }
        return ul__75728.append(li__75730.clone().addClass("addli").append(fb.jq.$.call(null, "<a></a>").hide().text("Add").attr("href", "null").on("click", fb.cost.add_page_cost)))
      }else {
        return ul__75728.append(li__75730.clone().append(fb.jq.$.call(null, "<a></a>").attr("href", "buddies").data("pid", pid__75725).text("Add buddies first!")))
      }
    }, pid__75725, cid__75726);
    fb.jq.$.call(null, "#newpage div.newcost form").submit(fb.cost.add_page_cost);
    fb.jq.$.call(null, "#newpage").on("pageAnimationEnd", function() {
      return inp__75727.trigger("keyup")
    });
    fb.pages.swap_page.call(null, e, origa);
    return fb.jq.$.call(null, '#content div.newcost form [name="name"]').focus()
  };
  return fb.vis.set_title_project.call(null, set_buddy_data__75801, pid__75725)
};
fb.pages.add_page_init_BANG_.call(null, "cost", fb.cost.show_cost);
fb.pages.add_page_init_BANG_.call(null, "newcost", fb.cost.show_new_cost);
