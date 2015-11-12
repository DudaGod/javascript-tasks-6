'use strict';

var moment = require('./moment');

var DAY = {
    ВС: 0,
    ПН: 1,
    ВТ: 2,
    СР: 3,
    ЧТ: 4,
    ПТ: 5,
    СБ: 6
};

var DAYS_IN_WEEK = 7;

// Выбирает подходящий ближайший момент начала ограбления
module.exports.getAppropriateMoment = function (json, minDuration, workingHours) {
    var appropriateMoment = moment();
    appropriateMoment.timezone = 5;

    var gang = JSON.parse(json, reviever);
    var bank = JSON.parse(JSON.stringify(workingHours), reviever);
    var busyTime = [];

    for (var prop in gang) {
        if (!gang.hasOwnProperty(prop)) {
            continue;
        }
        gang[prop].forEach(item => {
            if (!busyTime.length) {
                busyTime.push(item);
            } else {
                fillBusyTime(item);
            }
        });
    }

    var bankFrom = new Date(bank.from);
    var bankTo = new Date(bank.to);
    var appropriateTime = [];
    busyTime.forEach(item => {
        if (!busyTime.indexOf(item)) {
            findAppropriateTime(item, bankFrom);
        } else if (busyTime.indexOf(item) === busyTime.length - 1) {
            if (item.to.getDate() !== bankTo.getDate()) {
                bankFrom.setDate(bankFrom.getDate() + 1);
                bankTo.setDate(bankTo.getDate() + 1);
            }
            findAppropriateTime(item, item.to, bankTo);
        } else {
            var prevItem = busyTime[busyTime.indexOf(item) - 1];
            findAppropriateTime(item, prevItem.to);
        }
    });

    appropriateMoment.date = appropriateTime.length ? appropriateTime[0].from : null;
    return appropriateMoment;



    function findAppropriateTime(item, from, end) {
        var to = end || item.from;
        while (to.getDate() !== bankFrom.getDate() ||
        from.getDate() !== bankFrom.getDate()) {
            bankFrom.setDate(bankFrom.getDate() + 1);
            bankTo.setDate(bankTo.getDate() + 1);
        }
        to = validTime(to, bankFrom, bankTo);
        from = validTime(from, bankFrom, bankTo);

        var result = to - from;

        if (result / (1000 * 60) >= minDuration) {
            appropriateTime.push({from: from, to: to});
        }
    }

    function validTime(time, bankFrom, bankTo) {
        return new Date(Math.min(Math.max(time, bankFrom), bankTo));
    }

    function fillBusyTime(obj) {
        var inRange = false;
        busyTime.forEach(item => {
            if ((obj.from >= item.from && obj.from <= item.to) ||
                (obj.to >= item.from && obj.to <= item.to) ||
                (obj.from < item.from && obj.to > item.to)) {
                item.from = new Date(Math.min(obj.from, item.from));
                item.to = new Date(Math.max(obj.to, item.to));
                inRange = true;
            }
        });
        if (!inRange) {
            busyTime.push(obj);
        }
        busyTime.sort((a, b) => a.from - b.from);
    }

    function reviever(key, value) {
        if (key === 'from' || key === 'to') {
            var match = value.match(/^([А-Я]{0,2})\s?(\d{2}):(\d{2})([+-]\d{1,2})$/);
            var date = new Date();
            var needDay = match[1] ? DAY[match[1]] : DAY.ПН;
            var currentDay = date.getDay();
            var dist = needDay + DAYS_IN_WEEK - currentDay;
            date.setDate(date.getDate() + dist);
            if (appropriateMoment.timezone === Number(match[4])) {
                date.setHours(match[2], match[3], 0);
            } else {
                match[4] = appropriateMoment.timezone + (-Number(match[4]));
                date.setHours(Number(match[2]) + match[4], match[3], 0);
            }
            return date;
        }
        return value;
    }
};

// Возвращает статус ограбления (этот метод уже готов!)
module.exports.getStatus = function (moment, robberyMoment) {
    if (moment.date < robberyMoment.date) {
        return robberyMoment.fromMoment(moment);
    } else if (moment.date > robberyMoment.date && robberyMoment.date) {
        return 'Ограбление уже прошло!';
    } else if (!robberyMoment.date) {
        return 'Ограбление не состоится! Все пропало.';
    }

    return 'Ограбление уже идёт!';
};
