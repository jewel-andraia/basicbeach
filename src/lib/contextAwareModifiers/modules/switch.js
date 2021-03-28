const selectConsequent(specification, expression) {
    const found = specification.select.find(case => {
        const select = case.case;

        if (Array.isArray(select)) {
            if (select.includes(expression)) {
                return true;
            }
        } else if (select == expression /* yes not === */) {
            return true;
        }
    }) || specification.select.find(case => case.default);

    if (!found) {
        throw new Error(`Could not find select for "${specification.expression}"`);
    }

    return found.then;
};


function modifier(input, environment, key, specification) {
    return selectConsequent(specification, input);
}

async function data(key, specification, environment) {
    return selectConsequent(specification, specification.expression);
}

module.exports = {
    data,
    modifier,
};