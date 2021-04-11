function selectConsequent(specification, expression) {
    const found = specification.select.find(x => {
        const select = x.case;

        if (Array.isArray(select)) {
            if (select.includes(expression)) {
                return true;
            }
        } else if (select == expression /* yes not === */) {
            return true;
        }
    }) || specification.select.find(x => x.default);

    if (!found) {
        console.debug("switch.selectConsequent", { specification, expression });
        throw new Error(`Could not find select for "${expression}"`);
    }

    return found.then;
};


function modifier(input, environment, key, specification) {
    return selectConsequent(specification, input);
}

async function data(key, specification, environment) {
    const res = selectConsequent(specification, specification.expression);
    console.debug("switch.data", { key, res })
    return res;

}

module.exports = {
    data,
    modifier,
};