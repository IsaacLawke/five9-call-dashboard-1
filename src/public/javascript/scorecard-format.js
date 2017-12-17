let comparators = {
    '>=': (value, goal) => value >= goal,
    '<=': (value, goal) => value <= goal
};


export function formatValue(value, field) {
    let formattedValue, style;


    if (!field) {
        return {
            value: value,
            styleClass: ''
        }
    }

    if (field.hasGoal) {
        style = comparators[field.comparator](
            value, field.goal
        )
        ? 'green'
        : 'red';
    } else {
        style = '';
    }


    if (field.format.type == 'Number') {
        formattedValue = d3.format(field.format.string)(value);
    } else if (field.format.type == 'Time') {
        formattedValue = moment(value).format(field.format.string);
    } else {
        formattedValue = value;
    }

    return {
        value: formattedValue,
        styleClass: style
    };

    // let format, styleClass;
    // switch(field) {
    //     case 'Date':
    //         format = (val) => moment(val).format('MMM D');
    //         styleClass = (val) => '';
    //         break;
    //
    //     case 'Close Rate':
    //         format = (val) => isNaN(val)
    //                         ? 'N/A'
    //                         : (val * 100).toFixed(0) + '%';
    //         styleClass = (val) => isNaN(val)
    //                         ? ''
    //                         : val >= 0.5 ? 'green' : 'red';
    //         break;
    //
    //     case 'AHT':
    //         format = (val) => val;
    //         styleClass = (val) => {
    //             if (val == 'N/A') return '';
    //             return moment(val, 'mm:ss').valueOf() <= moment('10:00', 'mm:ss').valueOf()
    //                     ? 'green' : 'red';
    //         };
    //         break;
    //
    //     default:
    //         format = (val) => val;
    //         styleClass = (val) => '';
    //         break;
    // };
    // return { value: format(value), styleClass: styleClass(value) };
};
