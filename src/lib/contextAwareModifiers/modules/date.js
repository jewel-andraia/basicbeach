const dayjs = require('dayjs');

function data(key, specification, environment) {
    const input = specification.value;
    const date = input ? new Date(input) : environment.date;
    return date;
}

function modifier(input, environment, key, specification) {
    const date = input ? new Date(input) : environment.date;
    console.debug("date.modifier", { key, date, input, environment });

    switch (specification.method) {
        case "YYYY":
        case "year":
        case "getFullYear":
        case "getUTCFullYear":
            return date.getUTCFullYear().toString();
        case "yearOfCentury":
            return (date.getUTCFullYear() % 100).toString();
        case "century":
            return Math.floor(date.getUTCFullYear() / 100).toString();
        case "quarter":
            return (date.getMonth() % 12).toString();
        case "MM":
        case "month":
        case "getMonth":
        case "getUTCMonth":
            return date.getUTCMonth().toString();
        case "DD":
        case "day":
        case "getDay":
        case "getUTCDay":
            return date.getUTCDay().toString();
        case "HH":
        case "hour":
        case "hours":
        case "getHours":
        case "getUTCHours":
            return date.getUTCHours().toString();
        case "AM": 
        case "PM":
        case "AMPM":
            if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
                return 'midnight';
            }
            if (date.getUTCHours() === 12 && date.getUTCMinutes() === 0) {
                return 'noon';
            }

            if (date.getUTCHours() < 12) {
                return 'AM';
            }
            return 'PM';
        case "mm":
        case "minute":
        case "minutes":
        case "getMinutes":
        case "getUTCMinutes":
            return date.getUTCMinutes().toString();
        case "format":
        case (typeof specification.format === "string"):
            return dayjs(date).format(specification.format);
        case "toLocaleString":
        default:
            return date.toLocaleString(
                specification.locale,
                specification.options,
            );
    }
}

module.exports = {
    data,
    modifier,
};