import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const teamState=sqliteTable('team_state',{id:text('id').primaryKey(),data:text('data').notNull(),revision:integer('revision').notNull(),updatedAt:text('updated_at').notNull()});
