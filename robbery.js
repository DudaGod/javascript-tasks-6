'use strict';

var moment = require('./moment').moment;
var parseStringToDate = require('./moment').parseStringToDate;
var MS_IN_MINUTES = require('./moment').MS_IN_MINUTES;

// Выбирает подходящий ближайший момент начала ограбления
module.exports.getAppropriateMoment = function (json, minDuration, workingHours) {
    var appropriateMoment = moment();

    var bank = JSON.parse(JSON.stringify(workingHours), reviver);
    bank.deadline = new Date(bank.from);
    bank.deadline.setDate(bank.deadline.getDate() + 2);
    bank.deadline.setHours(23, 59, 59);

    if (bank.to < bank.from) {
        bank.to.setDate(bank.to.getDate() + 1);
    }
    var gang = JSON.parse(json, reviver);
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
        while (bankTo < from) {
            bankFrom.setDate(bankFrom.getDate() + 1);
            bankTo.setDate(bankTo.getDate() + 1);
        }
        from = validTime(from, bankFrom, bankTo);
        to = validTime(to, bankFrom, bankTo);
        var result = to - from;

        if (result / MS_IN_MINUTES >= minDuration) {
            appropriateTime.push({from: from, to: to});
        }
    }


    function validTime(time, bankFrom, bankTo) {
        time = new Date(Math.min(Math.max(time, bankFrom), bankTo));
        return time > bank.deadline ? new Date(bank.deadline) : time;
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

    function reviver(key, value) {
        if (key === 'from' || key === 'to') {
            return parseStringToDate.call(appropriateMoment, value);
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
