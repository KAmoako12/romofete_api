// src/_services/constants.ts

export const Constants = {
    POSTGRES_USER: process.env.PG_USER || 'postgres',
    POSTGRES_PASSWORD: process.env.PG_PASSWORD || 'password',
    POSTGRES_DB: process.env.PG_DATABASE || 'postgres',
    POSTGRES_HOST: process.env.PG_HOST || 'localhost',
    POSTGRES_PORT: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
    JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret',
    
};
