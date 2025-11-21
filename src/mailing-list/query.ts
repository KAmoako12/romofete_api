// This file defines database queries for Mailing List operations.
import { Database } from "../_services/databaseService";
import { MAILING_LIST } from "../_services/_dbTables";

const db = Database.getDBInstance;

export class Query {
  static async addEmailToMailingList(email: string) {
    return db()(MAILING_LIST).insert({ email }).returning("*");
  }

  static async getEmailFromMailingList(email: string) {
    return db()(MAILING_LIST).where({ email }).first();
  }

  static async getAllMailingListEmails() {
    return db()(MAILING_LIST).select("*").orderBy("created_at", "desc");
  }
}
