import knex, { Knex } from 'knex';
import config from '../../knexfile';

export namespace Database {
  export let KNEX_INSTANCE: Knex;
  export let TEST_KNEX_INSTANCE: Knex;

  export const getDBInstance = () => {
    const env = process.env.NODE_ENV || 'development';
    
    // For test environment, always return the test instance
    if (env === 'test') {
      return getDBTestInstance();
    }
    
    if (!KNEX_INSTANCE) {
      KNEX_INSTANCE = knex(config[env]);
    }
    return KNEX_INSTANCE;
  };

  export const migrate = async () => {
    try {
      await getDBInstance().migrate.latest();
    } catch (e) {
      console.error(`MIGRATION ERROR: ${e}`);
    }
  };

  export const getDBTestInstance = () => {
    if (!TEST_KNEX_INSTANCE) {
      TEST_KNEX_INSTANCE = knex(config['test']);
    }
    return TEST_KNEX_INSTANCE;
  };

  export const closeTestConnection = async () => {
    if (TEST_KNEX_INSTANCE) {
      await TEST_KNEX_INSTANCE.destroy();
      TEST_KNEX_INSTANCE = null as any;
    }
  };

  export const closeConnection = async () => {
    if (KNEX_INSTANCE) {
      await KNEX_INSTANCE.destroy();
      KNEX_INSTANCE = null as any;
    }
  };
}
