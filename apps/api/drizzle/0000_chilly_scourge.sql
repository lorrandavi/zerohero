CREATE TABLE `credit_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`closing_day` integer NOT NULL,
	`due_day` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `commitments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`card_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`amount_in_cents` integer,
	`total_amount_in_cents` integer,
	`total_installments` integer,
	`paid_installments` integer DEFAULT 0,
	`billing_day` integer,
	`frequency` text DEFAULT 'monthly',
	`purchase_date` text,
	`payoff_date` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `credit_cards`(`id`) ON UPDATE no action ON DELETE cascade
);
