ALTER TABLE "attendance_records" ADD COLUMN "check_in_distance" integer;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "check_out_distance" integer;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "radius_meters" integer DEFAULT 100 NOT NULL;