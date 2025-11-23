import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // Check if table exists and has the columns
    const tableExists = await knex.schema.hasTable("personalized_orders");
    
    if (tableExists) {
        // Alter selected_colors column from json to jsonb
        await knex.raw(`
            ALTER TABLE personalized_orders 
            ALTER COLUMN selected_colors TYPE jsonb 
            USING CASE 
                WHEN selected_colors IS NULL THEN NULL 
                ELSE selected_colors::jsonb 
            END
        `);
        
        // Alter metadata column from json to jsonb
        await knex.raw(`
            ALTER TABLE personalized_orders 
            ALTER COLUMN metadata TYPE jsonb 
            USING CASE 
                WHEN metadata IS NULL THEN NULL 
                ELSE metadata::jsonb 
            END
        `);
    }
}

export async function down(knex: Knex): Promise<void> {
    const tableExists = await knex.schema.hasTable("personalized_orders");
    
    if (tableExists) {
        // Revert selected_colors column from jsonb to json
        await knex.raw(`
            ALTER TABLE personalized_orders 
            ALTER COLUMN selected_colors TYPE json 
            USING CASE 
                WHEN selected_colors IS NULL THEN NULL 
                ELSE selected_colors::json 
            END
        `);
        
        // Revert metadata column from jsonb to json
        await knex.raw(`
            ALTER TABLE personalized_orders 
            ALTER COLUMN metadata TYPE json 
            USING CASE 
                WHEN metadata IS NULL THEN NULL 
                ELSE metadata::json 
            END
        `);
    }
}
