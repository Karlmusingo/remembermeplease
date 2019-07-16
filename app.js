import express from "express";
import bodyParser from "body-parser";
import events from "./routes/events";
import upcomingEvents from "./helpers/check-dates";
import getTodaysEvents from "./helpers/todaysEvents";
import sendMessage, { sendWithChatApi } from "./helpers/messaging";
import path from "path";
import cors from "cors";
import nofifyer from "node-cron";
import "./config/passport";

import userRouter from "./routes/user";

const port = process.env.PORT || 5000;
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// allowing the UI to consume my APIs
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

app.use(express.static(path.resolve(__dirname, "views")));
app.use(express.static(path.resolve(__dirname, "views/front-end")));
nofifyer.schedule("0 8 * * *", async () => {
  const events = await upcomingEvents();
  if (events.length) {
    events.forEach(event => {
      const message = `Hello ${event.firstname} ${event.lastname} Your ${
        event.target
      }'s ${event.type} Is happening in ${
        event.notificationTime
      } days Click https://remembermeplease.herokuapp.com/write-message.html?id=${
        event.id
      } to write a ${event.type} Message That will be sent on that day`;
      sendWithChatApi(message, event.user_phone);
    });
  }
});
// nofifyer.schedule('* * * * * *', async () => {
//   const events = await upcomingEvents();
//   events.forEach((event) => {
//     const message = `Hello ${event.firstname} ${event.lastname} Your ${
//       event.target
//       }'s ${event.type} Is happening in ${event.notificationTime} days`;
//     sendMessage(message, event.user_phone);
//   });
//   const todaysEvents = await getTodaysEvents();
//   console.log(todaysEvents);
//   todaysEvents.forEach((event) => {
//     if (event.messages.length === 0) {
//       const message = `Hello ${event.firstname} ${event.lastname} Your ${
//         event.target
//         }'s ${event.type} Is happening in today`;
//       console.log(event);
//       sendMessage(message, event.User.phonenumber);
//     }
//     console.log(event);
//   })
// });
app.get("/", (req, res) => {
  res.json({ message: "Welcome to remember me please" });
});
app.use("/events", events);

app.use("/user", userRouter);

const server = app.listen(port, () => {
  console.log(`server started on port ${port}`);
});

export default server;
