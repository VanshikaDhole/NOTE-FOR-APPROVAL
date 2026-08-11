// require("dotenv").config();

// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: Number(process.env.EMAIL_PORT),
//     secure: false,
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });

// async function sendTestMail() {

//     await transporter.sendMail({

//         from: process.env.EMAIL_USER,

//         to: process.env.EMAIL_RECIVER,

//         subject: "NFA Test Email",

//         text: "Congratulations! Nodemailer is working successfully."

//     });

//     console.log("✅ Test email sent successfully.");

// }

// module.exports = {
//     sendTestMail
// };