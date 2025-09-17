import type { Knex } from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/migrations',
      extension: 'ts',
      tableName: 'knex_migrations'
    }
  },
  development: {
    client: 'pg',
    connection: {
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'password',
      database: process.env.PG_DATABASE || 'postgres'
    },
    migrations: {
      directory: './src/migrations',
      extension: 'ts',
      tableName: 'knex_migrations'
    }
  },
  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user: 'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/migrations',
      tableName: 'knex_migrations',
      extension: 'ts'
    }
  },
  production: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user: 'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      extension: 'ts'
    }
  }
};

export default config;
