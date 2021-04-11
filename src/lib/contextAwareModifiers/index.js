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
 * into the data store. These keys like `!some data blob:!some item in that blob`. 
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
 *      "!::": "data", 
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
 *   "some number": "#!some number!.!_transform_some_blob#",
 *   "!some number!" [
 *     "!some number:!one",
 *     "!some number:!two"
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
 * the { "!::" } data.
 * 
 * ---
 * 
 * The grammar may apply environment-aware modifiers to loaded data by targeting the "reference" keys.
 * 
 * For example,
 * {
 *   "origin": "#number times two#",
 *   "some number": {
 *      "!::": "data", 
 *      "data": {
 *        "one": { "number": 1 },
 *        "two": { "number": 2 }
 *      },
 *   },
 *   "number times two": "#!some number.!getNumber.!timesTwo",
 *   "getNumber": {
 *      "!::": "jq",
 *      "path": ".number"
 *   },
 *   "timesTwo": {
 *     "!::": "math",
 *     "expression": "x*2",
 *   }
 * }
 * 
 * will be transpiled into an grammar like
 * {
 *   "origin": "#some number times two#",
 *   "some number": "#!some number!.!_transform_some_blob#",
 *   "!some number!": [
 *     "!some number:!one",
 *     "!some number:!two"
 *   ]
 *   "some number times two": "#!some number!.!getNumber.!timesTwo"
 * }
 * 
 * with modifiers {
 *   "!some_number": a function which looks up data from `some number` and strinigifies it
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
    date: require('./modules/date'),
    environment: require('./modules/environment'),
    switch: require('./modules/switch'),
};

function environmentFactory(config) {
    const date = config.date ? new Date(config.date) : new Date();

    return {
        ...config,
        date,
    }
}

function modifierSlug() {
    return '!' + [].slice.call(arguments).map(x => x.replace(new RegExp(/[#\.\s]/, 'g'), '_')).join('_');
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
        const keys = Object.keys(dict);
        if (!keys.length) {
            return this._prepareKey(collectionKey);
        }
        return keys.map(itemKey => this._prepareKey(collectionKey, itemKey));
    }

    static dataKeyRE = /^!(.+):!(.+)$/;
    static singleItemKey = '__singleton__';

    _prepareKey = function(collectionKey, itemKey) {
        if (typeof itemKey === "undefined") {
            itemKey = DataLookup.singleItemKey;
        }
        return `!${collectionKey}:!${itemKey}`;
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

        console.debug("DataClass.getItem", { key, collectionKey, itemKey });

        if (!collectionKey || !itemKey || typeof this._data[collectionKey] === "undefined") {
            return key;
        }

        if (itemKey === DataLookup.singleItemKey) {
            return this._data[collectionKey];
        }
        return this._data[collectionKey][itemKey];
    }

    static modifier = function(objOrStr) {
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

function getDataFunction(specification, strict = false) {
    const dataSpecification =
        specification["!data::"] ||
        (!strict ? (specification["!::"] && specification) : undefined);
    const dataModule = dataSpecification && modules[dataSpecification["!::"]];
    return {
        dataSpecification,
        dataFunction: dataModule && dataModule.data,
    };
}

function getModifierFunction(specification, strict = false) {
    const modifierSpecification =
        specification["!modifier::"] ||
        (!strict ? (specification["!::"] && specification) : undefined);
    const modifierModule = modifierSpecification && modules[modifierSpecification["!::"]] || DataLookup;

    return {
        modifierSpecification,
        modifierFunction: modifierModule && modifierModule.modifier,
    };
}

async function evaluateNestedData(environment, obj, keys = []) {
    console.debug("evaluateNestedData evaluating", keys, obj);
    if (typeof obj !== "object") {
        return obj;
    }
    const res = Array.isArray(obj) ? [...obj] : {...obj};

    for (const [key, specification] of Object.entries(obj)) {
        res[key] = await evaluateNestedData(environment, specification, [...keys, key]);
        // Skip root items to evaluate all the arguments
        if (!keys) {
            continue;
        }

        const {
            dataSpecification,
            dataFunction,
        } = getDataFunction(specification, true);
        console.debug("evaluateNestedData post getDataFunction", { keys: [...keys, key], specification, dataSpecification, dataFunction });
        if (!dataFunction) {
            continue;
        }

        let loadedData = undefined;
        try {
            loadedData = await dataFunction(key, dataSpecification, environment);
        } catch (e) {
            console.error({
                "error": `context-aware dfsEvaluateData data: could not load data for ${keys.join(',')}`,
                specification,
                e,
            });
        }

        // Immediately modify data 
        const {
            modifierSpecification,
            modifierFunction,
        } = getModifierFunction(specification, true);
        if (typeof modifierFunction === "function") {
            try {
                // TODO debug: should this be a "if array then map"?
                loadedData = modifierFunction(
                    loadedData,
                    environment,
                    keys.join(','),
                    modifierSpecification,
                );
            } catch (e) {
                console.error({
                    "error": `context-aware dfsEvaluateData data: could not run modifier on data for ${keys.join(',')}`,
                    loadedData,
                    specification,
                    e,
                });
            }
        }

        if (typeof loadedData === "undefined") {
            delete res[key];
        } else {
            res[key] = loadedData;
        }
    }
    console.debug("evaluateNestedData returning", keys, res);
    return res;
}

function collectModifiers(grammarSource, environment, data) {
    const modifiers = {};

    for (const [key, specification] of Object.entries(grammarSource)) {
        const {
            modifierSpecification,
            modifierFunction,
        } = getModifierFunction(specification);

        modifiers[modifierSlug(key)] = contextAwareModifierDecorator(
            environment,
            data,
            modifierFunction,
            key,
            modifierSpecification,
        );
    }
    
    return modifiers;
}

async function loadRootData(grammarSource, environment, data) {
    let res = {
        ...grammarSource,
    }
    for (const [key, specification] of Object.entries(grammarSource)) {
        const {
            dataSpecification,
            dataFunction,
        } = getDataFunction(specification);
        console.debug("loadRootData",{ key, dataSpecification, dataFunction } );
        if (typeof dataFunction !== "function") {
            // Tidy up for Tracery
            if (specification["!::"] || specification["!data::"] || specification["!modifer::"]) {
                delete res[key];
            }
            continue;
        }
        let loadedData = undefined;
        try {
            loadedData = await dataFunction(key, specification, environment);
        } catch (e) {
            console.error([`context-aware modifier: could not load data for ${key}`, specification, e]);
        }

        const dataKeys = data.addItems(loadedData, key);
        console.debug("dataKeys", { key, dataKeys, loadedData });
        const indexKey = `!${key}`;
        res = {
            ...res,
            [key]: `#${indexKey}.${modifierSlug(key)}#`, // grammar can reference #The Original Key# with the default context-aware modifier
            [indexKey]: dataKeys, // grammar can reference #!The Original Key.!someOtherContextAwareModifier#
        };
    }

    return res;
}

async function contextAwareModifierFactory(grammarSource, environment) {
    const data = new DataLookup();

    console.debug("pre evaluateNestedData", grammarSource);
    grammarSource = await evaluateNestedData(environment, grammarSource);
    console.debug("post evaluateNestedData", grammarSource);

    const modifiers = collectModifiers(grammarSource, environment, data);
    console.debug("post collectModifiers", modifiers);

    grammarSource = await loadRootData(grammarSource, environment, data);
    console.debug("post loadRootData", grammarSource);
    console.debug("data", data._data);

    return {
        grammarSource, 
        modifiers,
    };
}


module.exports = {
    contextAwareModifierFactory,
    environmentFactory,
};
