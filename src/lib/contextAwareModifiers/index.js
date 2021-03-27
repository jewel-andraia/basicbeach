/**
 * Add support for complex data structures and functions embedded into Tracery grammars
 * 
 * The Tracery engine can only handle strings or arrays of strings, so
 * extracting data from complex data structures or defining modifier functions
 * must be handled outside the Tracery engine. The Tracery engine does not
 * support forking based on environmental variables, such as date, weather, etc.
 * This "environment-aware grammar transpiler" seeks to bridge those gaps.
 * 
 * The "environment-aware grammar transpiler" takes in a "environment-aware" grammar 
 * and reduces into a standard Tracery grammar plus Tracery modifiers customized
 * to that grammar. The "environment-aware" grammar can include hard-coded complex data,
 * references to data from external packages (e.g. tinysubversion's corpora),
 * and specifications for transpiler modules or modifiers. 
 * Transpiling a "environment-aware grammar" will generate a Tracery grammar and 
 * "environment-aware" modifiers, i.e. modifiers which can use data described in the 
 * original "environment-aware" grammar or environmental variables.
 * This grammar and modifiers can then be fed into a Tracery engine, allowing
 * Tracery grammar writers to write much more flexible and space-efficient grammars.
 * 
 * The transpiler extracts "preprocessor" and "modifier" function definitions from 
 * the "environment-aware" grammar and generates Tracery modifiers which have access
 * to the "environment": environmental variables like date, time, weather, whatever
 * parameters are passed in. 
 * 
 * The "environment-aware" modifiers also have access to data loaded into the "environment-aware"
 * grammar. When a data loader is specified into a "environment-aware" grammar, the transpiler
 * inserts "reference keys" into the Tracery grammar, which refer to items loaded
 * into the data store. These keys like `!*some data blob!:!some item in that blob!`. 
 * "environment-aware" modifiers implicitly resolve the reference keys to the corresponding item 
 * in the data store. environment-aware modifiers should (eventually*) output a string.
 * Modifiers may be chained to perform several transformations, which must finally result 
 * in a simple string. Standard Tracery modifiers expect to be given strings and to return strings.
 * 
 * ---
 * 
 * For example,
 * {
 *   "origin": "#some number#",
 *   "some number": {
 *      "_contextAwareType": "data", 
 *      "data": {
 *        "one": 1,
 *        "two": 2
 *      },
 *   } 
 * }
 * 
 * will be transpiled into an grammar like
 * {
 *   "origin": "#some number#",
 *   "some number": "#!*some number!.!_transform_some_blob#",
 *   "!*some number!" [
 *     "!*some number!:!*one!",
 *     "!*some number!:!*two!"
 *   ]
 * }
 * 
 * with modifiers {
 *   "!transform_some_blob": a function which looks up data from `some number`'s data and strinigifes it
 * }
 * 
 * This grammar can be flattened into values like `1` or `2`
 *
 * ---
 * 
 * Other contextAwareType modules may specify a default `transformData` function
 * instead of a simple stringifier. That function may use parameters from
 * the { "_contextAwareType" } data.
 * 
 * ---
 * 
 * The grammar may apply environment-aware modifiers to loaded data by targeting the "reference" keys.
 * 
 * For example,
 * {
 *   "origin": "#number times two#",
 *   "some number": {
 *      "_contextAwareType": "data", 
 *      "data": {
 *        "one": { "number": 1 },
 *        "two": { "number": 2 }
 *      },
 *   },
 *   "number times two": "#!*some number.!getNumber.!timesTwo",
 *   "getNumber": {
 *      "_contextAwareType": "jq",
 *      "path": ".number"
 *   },
 *   "timesTwo": {
 *     "_contextAwareType": "math",
 *     "expression": "x*2",
 *   }
 * }
 * 
 * will be transpiled into an grammar like
 * {
 *   "origin": "#some number times two#",
 *   "some number": "#!*some number!.!_transform_some_blob#",
 *   "!*some number!": [
 *     "!*some number!:!*one!",
 *     "!*some number!:!*two!"
 *   ]
 *   "some number times two": "#!*some number!.!getNumber.!timesTwo"
 * }
 * 
 * with modifiers {
 *   "!_transform_some_blob": a function which looks up data from `some number` and strinigifies it
 *   "!getNumber": a function which takes data and calls the jq module's modifier to apply the path ".bar"
 *   "!timesTwo": a function which takes data and calls the math module's modifier to multiply the value by 2.
 * }
 * 
 * This grammar can be flattened into values like `2` or `4`
 *
 */

const modules = {
    // jq: require('./modules/jq'),
    // groq: require('./modules/groq'),
    corpora: require('./modules/corpora'),
    data: require('./modules/data'),
    // template: require('./modules/template'),
};

function environmentFactory(config) {
    const date = config.date ? new Date(config.date) : new Date();

    return {
        ...config,
        date,
        dateYear: date.getUTCFullYear(),
        dateYearOfCentury: date.getUTCFullYear() % 100,
        dateCentury: Math.floor(date.getUTCFullYear() / 100),
        dateQuarter: date.getMonth() % 12,
        dateMonth: date.getMonth(),
        dateDay: date.getUTCDay(),
        dateHours: date.getUTCHours(),
        dateMinutes: date.getUTCMinutes(),
    }
}

function modifierSlug() {
    return '!&' + [].slice.call(arguments).map(x => x.replace(/[#\.\s]/, '_')).join('_');
}


class DataLookup {
    constructor() {
        this._data = {};
    }

    addItems = function(dict, collectionKey) {
        this._data[collectionKey] = dict;
        return this._prepareKeys(collectionKey, dict);
    }
    
    _prepareKeys = function(collectionKey, dict) {
        return Object.keys(dict).map(itemKey => 
            this._prepareKey(collectionKey, itemKey));
    }

    static dataKeyRE = /^!\*(.+)!:!\*(.+)!$/;

    _prepareKey = function(collectionKey, itemKey) {
        return `!*${collectionKey}!:!*${itemKey}!`;
    }

    _parseKey = function(key) {
        const components = DataLookup.dataKeyRE.exec(key);
        if (!components) {
            return [];
        }

        return components.slice(1, 3);
    }

    getItem = function(key) {
        const [ collectionKey, itemKey ] = this._parseKey(key);

        if (!collectionKey || !itemKey || !this._data[collectionKey]) {
            return key;
        }

        return this._data[collectionKey][itemKey];
    }

    static transformData = function(objOrStr) {
        if (typeof objOrStr === 'object') {
            return JSON.stringify(objOrStr);
        }

        return objOrStr;
    }
}

function contextAwareModifierDecorator(environment, data, modifier, key, specification) {
    return function(strOrDataKey) {
        const resolved = data.getItem(strOrDataKey);
        return modifier(resolved, environment, key, specification);
    }
}

function getModuleFunction(specification, func) {
    console.debug({ specification, func });
    const nil = [];
    const funcSpec = specification[`!_${func}`];
    
    if (!funcSpec) {
        return nil;
    }
    const mod = modules[funcSpec.type];
    if (!mod) {
        return nil;
    }

    if (typeof mod[func] !== "function") {
        return nil;
    }

    return [ mod[func], funcSpec ];
}

function getModuleFunctionsArray(specification, func) {
    const nil = [];
    const funcSpec = specification[`!_${func}`];
    if (!funcSpec) {
        return nil;
    }

    if (!Array.isArray(funcSpec)) {
        return [ getModuleFunction(specification, func) ];
    }

    return funcSpec
        .map(s => getModuleFunction({ [`!_${func}`]: s }, func))
        .filter( x => !!x);
}

async function contextAwareModifierFactory(grammarSource, environment) {
    const modifiers = {};
    const data = new DataLookup();
    for (const [key, specification] of Object.entries(grammarSource)) {
        const [dataFunc, dataSpec] = getModuleFunction(specification, 'data');
        if (dataFunc) {
            let loadedData = [];
            try {
                loadedData = await dataFunc(key, dataSpec, environment);
            } catch (e) {
                console.error([`context-aware modifier: could not load data for ${key}`, specification, e]);
                                loadedData = `((!${key}))`;
                loadedData = [`((!!${key}))`];
            }

            const filters = getModuleFunctionsArray(specification, "filter");
            console.debug({ filters });
            if (filters) {
                loadedData = filters.reduce(([filterFunc, filterSpec], loadedData) => {
                    filterFunc(key, filterSpec, loadedData, environment);
                }, loadedData);
            }

            const dataKeys = data.addItems(loadedData, key);
            const transformModifierName = modifierSlug("transform", key);
            const indexKey = `!*${key}!`;

            const [modifierFunc, modifierSpec] = getModuleFunction(specification, 'modifier')
                || [ DataLookup.transformData, {}];

            modifiers[transformModifierName] = contextAwareModifierDecorator(environment, data, modifierFunc, key, modifierSpec);
            grammarSource = {
                ...grammarSource,
                [key]: `#${indexKey}.${transformModifierName}#`, // resolve using the default transformer
                [indexKey]: dataKeys, // so the grammar can resolve using `"#!*theKey.someOtherTransformer#"
            };
        }

        const [ modifierFunc, modifierSpec ] = getModuleFunction(specification, "modifier");
        if (modifierFunc) {
            modifiers[modifierSlug(key)] = contextAwareModifierDecorator(environment, data, modifierMod, key, modifierSpec);
        }

        const [ preprocessFunc, preprocessSpec ] = getModuleFunction(specification, "preprocessSpec");
        if (preprocessSpec) {
            grammarSource = await preprocessFunc(grammarSource, environment, key, preprocessSpec);
        }
    }

    return {
        grammarSource, 
        modifiers,
    };
}


module.exports = {
    contextAwareModifierFactory,
    environmentFactory,
};
