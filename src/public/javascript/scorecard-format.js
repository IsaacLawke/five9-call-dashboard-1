export function formatValue(value, field) {
    let format, styleClass;
    switch(field) {
        case 'Date':
            format = (val) => moment(val).format('MMM D');
            styleClass = (val) => '';
            break;

        case 'Close Rate':
            format = (val) => isNaN(val)
                            ? 'N/A'
                            : (val * 100).toFixed(0) + '%';
            styleClass = (val) => isNaN(val)
                            ? ''
                            : val >= 0.5 ? 'green' : 'red';
            break;

        case 'AHT':
            format = (val) => val;
            styleClass = (val) => {
                if (val == 'N/A') return '';
                return moment(val, 'mm:ss').valueOf() <= moment('10:00', 'mm:ss').valueOf()
                        ? 'green' : 'red';
            };
            break;

        default:
            format = (val) => val;
            styleClass = (val) => '';
            break;
    };
    return { value: format(value), styleClass: styleClass(value) };
};
