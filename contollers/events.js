import { Event, Message } from "../models";
import sendMessage, { sendWithChatApi } from "../helpers/messaging";
import select from "lodash";
const events = {
  create: async (req, res) => {
    try {
      let event = req.body;
      event = select.pick(event, [
        "type",
        "day",
        "month",
        "year",
        "target",
        "phonenumber",
        "country",
        "notificationTime"
      ]);
      event.userId = 1;
      const newEvent = await Event.create(event);
      let newMessage;
      if (req.body.message) {
        newMessage = await Message.create({
          content: req.body.message,
          userId: 1,
          eventId: newEvent.id
        });
      }
      sendWithChatApi(req.body.message, event.phonenumber);
      return res.status(200).json({
        message: "Event created successfully",
        newEvent,
        message: newMessage
      });
    } catch (e) {
      res.status(500).json({
        message: "error",
        error: e.message
      });
    }
  },
  getAll: async (req, res) => {
    try {
      const events = await Event.findAndCountAll({
        where: { userId: 1 },
        include: {
          model: Message
        }
      });
      let todays = [];
      let thisWeek = [];
      let other = [];
      events.rows.map(event => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const currentDay = new Date().getDate();
        const currentTime = new Date(
          `${currentYear}-${currentMonth}-${currentDay}`
        ).getTime();

        if (!event.year) event.year = currentYear;
        const { day, month, year } = event;
        const eventTime = new Date(`${year}-${month}-${day}`).getTime();
        const diff = (eventTime - currentTime) / (1000 * 60 * 60 * 24);

        if (Math.sign(diff) !== -1 && 0 <= diff < 2) {
          todays.push(event.dataValues);
        } else if (Math.sign(diff) === 1 && 2 < diff < 7) {
          thisWeek.push(event.dataValues);
        } else {
          other.push(event.dataValues);
        }
      });

      return res.status(200).json({
        todays: {
          events: todays,
          eventsCount: todays.length
        },
        thisWeek: {
          events: thisWeek,
          eventsCount: thisWeek.length
        },
        other: {
          events: other,
          eventsCount: other.length
        }
      });
    } catch (e) {
      return res.status(500).json({
        message: "error",
        error: e.message
      });
    }
  },
  getOne: async (req, res) => {
    try {
      const event = await Event.findOne({
        where: {
          id: req.params.id
        }
      });
      return res.status(200).json({
        status: 200,
        event
      });
    } catch (e) {
      res.status(500).json({
        message: "error",
        error: e.message
      });
    }
  }
};

export default events;
