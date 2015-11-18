'use strict';

var DAY_NAME = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

var MS_IN_DAY = 1000 * 60 * 60 * 24;
var MS_IN_HOUR = 1000 * 60 * 60;
var MS_IN_MINUTES = 1000 * 60;

var DAYS_IN_MONTH = 30;
var HOURS_IN_DAY = 24;
var MINUTES_IN_HOUR = 60;

var READABLE_TIME = [
    ['день', 'дня', 'дней'],
    ['час', 'часа', 'часов'],
    ['минута', 'минуты', 'минут']
];

var REG_EXP_DECLINATION_1 = /[^1]1$|^1$/;
var REG_EXP_DECLINATION_2 = /[^1][2-4]$|^[2-4]$/;

module.exports = function () {
    return {
        // Здесь как-то хранится дата ;)
        _date: null,

        get date() {
            return this._date;
        },

        set date(value) {
            if (typeof value === 'string') {
                value = parseStringToDate.call(this, value);
            }
            this._date = value;
        },

        // А здесь часовой пояс
        _timezone: null,

        get timezone() {
            return this._timezone;
        },

        set timezone(value) {
            if (this.date) {
                var displacement = Math.max(value, this._timezone) -
                    Math.min(value, this._timezone);
                displacement *= value < this._timezone ? -1 : 1;
                this.date.setHours(this.date.getHours() + displacement, this.date.getMinutes(), 0);
            }
            this._timezone = value;
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

            var numberIn = [MINUTES_IN_HOUR, HOURS_IN_DAY, DAYS_IN_MONTH];
            [MS_IN_MINUTES, MS_IN_HOUR, MS_IN_DAY].forEach((item, index) => {
                if (index === 0) {
                    timeRemain.push(Math.round(date / item) % numberIn[index]);
                } else {
                    timeRemain.push(Math.floor(date / item) % numberIn[index]);
                }
            });
            timeRemain.reverse();

            for (var i = 0; i < timeRemain.length; i++) {
                if (!timeRemain[i]) {
                    continue;
                }
                if (i !== timeRemain.length - 1) {
                    mainStr += (REG_EXP_DECLINATION_1.test(String(timeRemain[i]))) ? 'остался'
                        : 'осталось';
                    break;
                }
                mainStr += (REG_EXP_DECLINATION_1.test(String(timeRemain[i]))) ? 'осталась'
                    : 'осталось';
            }

            timeRemain.forEach((item, index) => {
                if (item) {
                    mainStr += morph(READABLE_TIME[index], item);
                }
            });

            return mainStr;
        }
    };
};

function morph(arrDeclinations, value) {
    var index = 0;
    if (REG_EXP_DECLINATION_2.test(String(value))) {
        index = 1;
    } else if (!REG_EXP_DECLINATION_1.test(String(value))) {
        index = 2;
    }
    return ' ' + value + ' ' + arrDeclinations[index];
}

function parseStringToDate(string) {
    var match = string.match(/^([А-Я]{0,2})\s?(\d{2}):(\d{2})([+-]\d{1,2})$/);
    var date = new Date();
    var needDay = match[1] ? DAY_NAME.indexOf(match[1]) : DAY_NAME.indexOf('ПН');
    var currentDay = date.getDay();
    var dist = needDay + DAY_NAME.length - currentDay;
    date.setDate(date.getDate() + dist);
    if (!this.timezone) {
        this.timezone = Number(match[4]);
        date.setHours(match[2], match[3], 0);
    } else if (this.timezone === Number(match[4])) {
        date.setHours(match[2], match[3], 0);
    } else {
        match[4] = this.timezone + (-Number(match[4]));
        date.setHours(Number(match[2]) + match[4], match[3], 0);
    }
    return date;
}

module.exports.MS_IN_MINUTES = MS_IN_MINUTES;
module.exports.parseStringToDate = parseStringToDate;
