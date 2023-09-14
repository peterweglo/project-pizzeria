import { templates, select, settings, classNames } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.selectedTable = [];
  }
  getData() {
    const thisBooking = this;

    const startDateParam =
      settings.db.dateStartParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.minDate);

    const endDateParam =
      settings.db.dateEndParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };

    // console.log('getData params', params);

    const urls = {
      booking:
        settings.db.url +
        '/' +
        settings.db.bookings +
        '?' +
        params.booking.join('&'),
      eventsCurrent:
        settings.db.url +
        '/' +
        settings.db.events +
        '?' +
        params.eventsCurrent.join('&'),
      eventsRepeat:
        settings.db.url +
        '/' +
        settings.db.events +
        '?' +
        params.eventsRepeat.join('&'),
    };
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;
    thisBooking.booked = {};
    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of bookings) {
      if (item.repeat == 'daily')
        for (
          let loopDate = minDate;
          loopDate <= maxDate;
          loopDate = utils.addDays(loopDate, 1)
        ) {
          thisBooking.makeBooked(
            utils.dateToStr(loopDate),
            item.hour,
            item.duration,
            item.table
          );
        }
    }
    for (let item of eventsRepeat) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    // console.log('thisBooking.booked', thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;
    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (
      let hourBlock = startHour;
      hourBlock < startHour + duration;
      hourBlock += 0.5
    ) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ==
        'undefined'
    ) {
      allAvailable = true;
    }
    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      table.classList.remove(classNames.booking.tableSelected);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(element) {
    const thisBooking = this;
    const generatedHtml = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHtml;
    thisBooking.dom.peopleAmount = element.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = element.querySelector(
      select.booking.hoursAmount
    );
    thisBooking.dom.inputDatePicker = element.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.inputHourPicker = element.querySelector(
      select.widgets.hourPicker.wrapper
    );
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.tables
    );
    thisBooking.dom.tablesWrapper = element.querySelector(select.booking.floor);
    thisBooking.dom.submitBtn = element.querySelector(select.booking.button);
    thisBooking.dom.phone = element.querySelector(select.booking.phone);
    thisBooking.dom.address = element.querySelector(select.booking.address);
    thisBooking.dom.peopleAmountInput =
      thisBooking.dom.peopleAmount.querySelector(select.booking.amountInput);
    thisBooking.dom.hoursAmountInput =
      thisBooking.dom.hoursAmount.querySelector(select.booking.amountInput);
    thisBooking.dom.startersInputs = element.querySelectorAll(
      select.booking.startersInput
    );
  }
  initWidgets() {
    const thisBooking = this;
    thisBooking.peopleWidget = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursWidget = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.inputDatePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.inputHourPicker);
    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });
    thisBooking.dom.tablesWrapper.addEventListener('click', function (event) {
      thisBooking.initTables(event);
    });
    thisBooking.dom.submitBtn.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }
  initTables(event) {
    const thisBooking = this;
    const tableId = event.target.getAttribute(
      settings.booking.tableIdAttribute
    );

    if (
      event.target.classList.contains(classNames.booking.table) &&
      !event.target.classList.contains(classNames.booking.tableBooked) &&
      !event.target.classList.contains(classNames.booking.tableSelected)
    ) {
      for (let table of thisBooking.dom.tables) {
        table.classList.remove(classNames.booking.tableSelected);
      }
      event.target.classList.add(classNames.booking.tableSelected);
      thisBooking.selectedTable = [];
      thisBooking.selectedTable.push(tableId);
    } else if (
      event.target.classList.contains(classNames.booking.table) &&
      !event.target.classList.contains(classNames.booking.tableBooked) &&
      event.target.classList.contains(classNames.booking.tableSelected) &&
      thisBooking.selectedTable.includes(tableId)
    ) {
      event.target.classList.remove(classNames.booking.tableSelected);
      const indexOfTable = thisBooking.selectedTable.indexOf(tableId);
      thisBooking.selectedTable.splice(indexOfTable, 1);
    } else if (
      event.target.classList.contains(classNames.booking.table) &&
      event.target.classList.contains(classNames.booking.tableBooked)
    ) {
      alert('The table is unavailable');
    }
    // console.log('thisBooking.selectedTable', thisBooking.selectedTable);
  }
  sendBooking() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.bookings;
    let tableNumber = parseInt(thisBooking.selectedTable[0]);
    if (thisBooking.selectedTable.length == 0) {
      tableNumber = null;
      alert('You have to choose a table');
      return;
    }
    let starters = [];
    for (let starterInput of thisBooking.dom.startersInputs) {
      if (starterInput.checked) {
        starters.push(starterInput.value);
      }
    }
    const bookingOrder = {
      date: thisBooking.date,
      hour: thisBooking.hourPicker.value,
      table: tableNumber,
      duration: parseInt(thisBooking.dom.hoursAmountInput.value),
      ppl: parseInt(thisBooking.dom.peopleAmountInput.value),
      starters: starters,
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };

    // console.log('bookingOrder', bookingOrder);

    thisBooking.makeBooked(
      bookingOrder.date,
      bookingOrder.hour,
      bookingOrder.duration,
      bookingOrder.table
    );
    thisBooking.updateDOM();

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingOrder),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
      });

    // console.log('thisBooking.booked', thisBooking.booked);
    thisBooking.selectedTable = [];
  }
}

export default Booking;
