CREATE TABLE "contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"employee_role" text NOT NULL,
	"store_id" text,
	"created_by" text NOT NULL,
	"start_date" text NOT NULL,
	"no_end_date" boolean DEFAULT true NOT NULL,
	"end_date" text,
	"workplace" text,
	"job_description" text,
	"work_days" jsonb DEFAULT '[1,2,3,4,5]'::jsonb NOT NULL,
	"work_start" text,
	"work_end" text,
	"break_minutes" integer DEFAULT 60,
	"hourly_wage" integer,
	"base_salary" integer,
	"overtime_rate" integer,
	"pay_date" text,
	"insurance" jsonb DEFAULT '{"ei":true,"ni":true,"health":true,"comp":true}'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"employer_signature" text,
	"employee_signature" text,
	"sign_token" text,
	"signed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"employee_role" text NOT NULL,
	"store_id" text,
	"month" text NOT NULL,
	"breakdown" jsonb NOT NULL,
	"grand_total" integer NOT NULL,
	"note" text,
	"issued_by" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "position" text DEFAULT '신입';--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;