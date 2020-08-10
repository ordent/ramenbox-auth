"use strict";

const { MailModel } = require("../models/Mail");
const Mail = use("Mail");
const moment = require("moment");
const Sentry = use("Sentry");
class MailService {
  constructor() {
    this.model = MailModel;
    this.yesterday = moment().subtract("1", "hours");
  }

  async postConfirmRegistration(data, flag = false) {
    const check = await MailModel.query()
      .where("destination", data.email)
      .where("type", "confirmation")
      .where("created_at", this.yesterday)
      .first();
    if (flag || !check) {
      try {
        Mail.send("verifications", data.token, (message) => {
          message
            .to(data.email)
            .from("hello@ordent.co")
            .subject("HEALED - Welcome to Healed");
        });
        if (!flag && check) {
          try {
            MailModel.create({
              destination: data.email,
              type: "confirmation",
            });
          } catch (e) {
            Sentry.captureException(e);
          }
        }
      } catch (e) {
        Sentry.captureException(e);
      }
    }
  }

  async postConfirmForgot(data, flag = false) {
    const check = await MailModel.query()
      .where("destination", data.email)
      .where("type", "forgot")
      .where("created_at", this.yesterday)
      .first();
    if (flag || !check) {
      try {
        const result = await Mail.send("forgot", data.token, (message) => {
          message
            .to(data.email)
            .from("hello@ordent.co")
            .subject("Healed - Lupa Kata Sandi");
        });
        if (!flag && check) {
          try {
            MailModel.create({
              destination: data.email,
              type: "forgot",
            });
          } catch (e) {
            Sentry.captureException(e);
          }
        }
      } catch (e) {
        Sentry.captureException(e);
      }
    }
  }

  async postPaymentPending(data, flag = false) {
    const check = await MailModel.query()
      .where("destination", data.email)
      .where("type", "invoices")
      .where("created_at", this.yesterday)
      .first();
    if (flag || !check) {
      try {
        Mail.send("invoices", data.token, (message) => {
          message
            .to(data.email)
            .from("hello@ordent.co")
            .subject("Healed - Invoice Pembayaran");
        });
        if (!flag && check) {
          try {
            MailModel.create({
              destination: data.email,
              type: "invoices",
            });
          } catch (e) {
            Sentry.captureException(e);
          }
        }
      } catch (e) {
        Sentry.captureException(e);
      }
    }
  }

  async postPaymentApproved(data, flag = false) {
    const check = await MailModel.query()
      .where("destination", data.email)
      .where("type", "payment")
      .where("created_at", this.yesterday)
      .first();
    if (flag || !check) {
      try {
        Mail.send("payment", data.token, (message) => {
          message
            .to(data.email)
            .from("hello@ordent.co")
            .subject("Healed - Konfirmasi Pembayaran");
        });
        if (!flag && check) {
          try {
            MailModel.create({
              destination: data.email,
              type: "payment",
            });
          } catch (e) {
            Sentry.captureException(e);
          }
        }
      } catch (e) {
        Sentry.captureException(e);
      }
    }
  }

  async postBookingPaid(data, flag = false) {
    const check = await MailModel.query()
      .where("destination", data.email)
      .where("type", "paid")
      .where("created_at", ">", this.yesterday)
      .first();
    if (flag || !check) {
      try {
        Mail.send("paid", data.token, (message) => {
          message
            .to(data.email)
            .from("hello@ordent.co")
            .subject("Healed - Konfirmasi Pembayaran");
        });
        if (!flag && check) {
          try {
            MailModel.create({
              destination: data.email,
              type: "paid",
            });
          } catch (e) {
            Sentry.captureException(e);
          }
        }
      } catch (e) {
        Sentry.captureException(e);
      }
    }
  }
}

module.exports = MailService;
