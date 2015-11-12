'use strict';

var DAY_NAME = {
    0: 'ВС',
    1: 'ПН',
    2: 'ВТ',
    3: 'СР',
    4: 'ЧТ',
    5: 'ПТ',
    6: 'СБ'
};

var DAY_VALUE = {
    ВС: 0,
    ПН: 1,
    ВТ: 2,
    СР: 3,
    ЧТ: 4,
    ПТ: 5,
    СБ: 6
};

var DAYS_IN_WEEK = 7;

var DAYS = {
    value: 1000 * 60 * 60 * 24,
    count: 30
};

var HOURS = {
    value: 1000 * 60 * 60,
    count: 24
};

var MINUTES = {
    value: 1000 * 60,
    count: 60
};

var READABLE_TIME = {
    0: ['день', 'дня', 'дней'],
    1: ['час', 'часа', 'часов'],
    2: ['минута', 'минуты', 'минут']
};

module.exports = function () {
    return {
        // Здесь как-то хранится дата ;)
        _d: null,

        get date() {
            return this._d;
        },

        set date(value) {
            if (typeof value === 'string') {
                var parseString = parseStringToDate.bind(this);
                value = parseString(value);
            }
            this._d = value;
        },

        // А здесь часовой пояс
        _timez: null,

        get timezone() {
            return this._timez;
        },

        set timezone(value) {
            if (this.date) {
                var displacement = Math.max(value, this._timez) - Math.min(value, this._timez);
                displacement *= value < this._timez ? -1 : 1;
                this.date.setHours(this.date.getHours() + displacement, this.date.getMinutes(), 0);
            }
            this._timez = value;
        },

        // Выводит дату в переданном формате
        format: function (pattern) {
            if (!this.date) {
                return 'Ограбление не состоится! Все пропало.';
            }
            var target = ['%DD', '%HH', '%MM'];
            var values = {'%DD': DAY_NAME[this.date.getDay()], '%HH': this.date.getHours(),
                '%MM': this.date.getMinutes()};
            target.forEach(item => {
                var pos = pattern.indexOf(item);
                if (typeof values[item] === 'number' && values[item] < 10) {
                    values[item] = '0' + values[item];
                }
                if (pos >= 0) {
                    pattern = pattern.slice(0, pos) + values[item] +
                        pattern.slice(-(pattern.length - pos - item.length));
                }
            }, this);
            return pattern;
        },

        // Возвращает кол-во времени между текущей датой и переданной `moment`
        // в человекопонятном виде
        fromMoment: function (moment) {
            var mainStr = 'До ограбления ';
            var timeRemain = [];
            var date = this.date - moment.date;

            [MINUTES, HOURS, DAYS].forEach((item, index) => {
                if (index === 0) {
                    timeRemain.push(Math.round(date / item.value) % item.count);
                } else {
                    timeRemain.push(Math.floor(date / item.value) % item.count);
                }
            });
            timeRemain.reverse();

            mainStr += convertToHumanReadable(timeRemain);
            return mainStr;
        }
    };
};

function convertToHumanReadable(arrayTime) {
    var str = '';
    arrayTime.forEach((item, index, arr) => {
        var num = 0;
        if (item) {
            if (index !== arr.length - 1 && !str) {
                str = (/[^1]1$|^1$/.test(String(item))) ? 'остался' : 'осталось';
            } else if (!str) {
                str = 'осталось';
            }

            if (/[^1][2-4]$|^[2-4]$/.test(String(item))) {
                num = 1;
            } else if (!/[^1]1$|^1$/.test(String(item))) {
                num = 2;
            }

            str += ' ' + item + ' ' + READABLE_TIME[index][num];
        }
    });

    return str;
}

function parseStringToDate(string) {
    var match = string.match(/^([А-Я]{0,2})\s?(\d{2}):(\d{2})([+-]\d{1,2})$/);
    var date = new Date();
    var needDay = match[1] ? DAY_VALUE[match[1]] : DAY_VALUE.ПН;
    var currentDay = date.getDay();
    var dist = needDay + DAYS_IN_WEEK - currentDay;
    date.setDate(date.getDate() + dist);
    if (this.timezone === Number(match[4]) || !this.timezone) {
        this.timezone = Number(match[4]);
        date.setHours(match[2], match[3], 0);
    } else {
        match[4] = this.timezone + (-Number(match[4]));
        date.setHours(Number(match[2]) + match[4], match[3], 0);
    }
    return date;
}
