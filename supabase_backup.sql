

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."autofill_trainer_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if NEW.trainer_id is null then
    select trainer_id into NEW.trainer_id
    from members
    where id = NEW.member_id;
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."autofill_trainer_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_week_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- `appointment_date`를 기준으로 해당 날짜의 `week_id`를 계산
  NEW.week_id := EXTRACT(WEEK FROM NEW.appointment_date)::INTEGER;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_week_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_score"("member_id_input" "uuid", "point" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  update members
  set score = coalesce(score, 0) + point
  where id = member_id_input;
end;
$$;


ALTER FUNCTION "public"."increment_score"("member_id_input" "uuid", "point" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_appointment_complete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- 완료된 경우에만 점수 기록
  if NEW.is_completed = true and OLD.is_completed is distinct from true then
    insert into score_events (member_id, type, score_delta)
    values (
      NEW.member_id,
      NEW.type,
      case
        when NEW.type = 'personal' then 5
        when NEW.type = 'lesson' then 10
        else 0
      end
    );
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."on_appointment_complete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_mission_complete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if NEW.is_completed = true and OLD.is_completed is distinct from true then
    insert into score_events (member_id, type, score_delta)
    values (
      NEW.member_id,
      'mission',
      7
    );
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."on_mission_complete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_recommendation_complete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if NEW.is_completed = true and OLD.is_completed is distinct from true then
    insert into score_events (member_id, type, score_delta)
    values (
      NEW.member_id,
      'recommendation',
      6
    );
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."on_recommendation_complete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_watch_complete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if NEW.is_completed = true and OLD.is_completed is distinct from true then
    insert into score_events (member_id, type, score_delta)
    values (
      NEW.member_id,
      'watch',
      4
    );
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."on_watch_complete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_weekly_workout_complete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if NEW.is_completed = true then
    insert into score_events (member_id, type, score_delta, metadata)
    values (
      NEW.member_id,
      'weekly',
      20,
      jsonb_build_object(
        'week', NEW.week,
        'video_url', NEW.video_url,
        'title', NEW.workout_notes
      )
    );
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."on_weekly_workout_complete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_trainer_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- 해당 멤버 ID에 해당하는 트레이너 ID를 가져와서 `trainer_id` 컬럼에 자동으로 설정
  update workouts
  set trainer_id = (select trainer_id from members where id = NEW.member_id limit 1)
  where id = NEW.id;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."set_trainer_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_routine_logs_from_appointments"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- `appointment_date`에서 주차 계산
  DECLARE
    calculated_week_id INT;
    lesson_type BOOLEAN;
  BEGIN
    -- `appointment_date`로부터 주차를 계산
    calculated_week_id := EXTRACT(WEEK FROM NEW.appointment_date)::INTEGER;

    -- `type`이 "lesson"일 경우 lesson_count 1 증가
    IF NEW.type = 'lesson' THEN
      -- `lesson_count` 1 증가
      UPDATE members
      SET lesson_count = lesson_count + 1
      WHERE member_id = NEW.member_id;
    END IF;

    -- `routine_logs` 테이블에 값 삽입
    INSERT INTO routine_logs (member_id, date, week_id, day, completed, lesson_count)
    VALUES (NEW.member_id, NEW.appointment_date, calculated_week_id, EXTRACT(DOW FROM NEW.appointment_date), TRUE, CASE WHEN lesson_type THEN 1 ELSE 0 END)
    ON CONFLICT (member_id, date) 
    DO NOTHING; -- 이미 해당 날짜에 기록이 있으면 무시

    RETURN NEW;
  END;
END;
$$;


ALTER FUNCTION "public"."sync_routine_logs_from_appointments"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_score_from_event"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update members
  set score = coalesce(score, 0) + NEW.score_delta
  where id = NEW.member_id;
  
  return NEW;
end;
$$;


ALTER FUNCTION "public"."update_score_from_event"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "appointment_date" "date" NOT NULL,
    "appointment_time" time without time zone NOT NULL,
    "reason" "text",
    "type" "text" NOT NULL,
    "is_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "week_id" integer,
    "trainer_id" "uuid",
    CONSTRAINT "appointments_type_check" CHECK (("type" = ANY (ARRAY['lesson'::"text", 'personal'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."body_compositions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "weight" numeric,
    "body_fat_percent" numeric,
    "muscle_mass" numeric,
    "bmi" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."body_compositions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."center_announcements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "link_url" "text",
    "is_active" boolean DEFAULT true,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."center_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_videos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "video_url" "text" NOT NULL,
    "category" "text",
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."exercise_videos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_recommendations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "recommendation_id" "uuid" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_completed" boolean DEFAULT false,
    "trainer_confirmed" boolean,
    "description" "text",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "order" integer DEFAULT 0
);


ALTER TABLE "public"."member_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "phone_last4" "text" NOT NULL,
    "trainer_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "segment" "text" DEFAULT 'C'::"text",
    "score" integer DEFAULT 0,
    "level" integer DEFAULT 1,
    "extra_score" integer DEFAULT 0,
    CONSTRAINT "members_segment_check" CHECK (("segment" = ANY (ARRAY['A'::"text", 'B'::"text", 'C'::"text"])))
);


ALTER TABLE "public"."members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mission_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "mission_id" "uuid" NOT NULL,
    "is_completed" boolean DEFAULT false,
    "assigned_month" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mission_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routine_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "day" integer NOT NULL,
    "week_id" "text" NOT NULL,
    "completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "lesson_count" integer DEFAULT 0,
    CONSTRAINT "routine_logs_day_check" CHECK ((("day" >= 0) AND ("day" <= 6)))
);


ALTER TABLE "public"."routine_logs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."member_achievement_view" AS
 WITH "base" AS (
         SELECT "m"."id" AS "member_id",
            "m"."name",
            COALESCE("ml"."count", (0)::bigint) AS "mission_count",
            COALESCE("wl"."count", (0)::bigint) AS "workout_count",
            COALESCE("rl"."count", (0)::bigint) AS "routine_count",
            COALESCE("al"."count_lesson", (0)::bigint) AS "lesson_count",
            COALESCE("ap"."count_personal", (0)::bigint) AS "personal_count",
            ((((((COALESCE("ml"."count", (0)::bigint) * 10) + (COALESCE("wl"."count", (0)::bigint) * 10)) + (COALESCE("rl"."count", (0)::bigint) * 10)) + (COALESCE("al"."count_lesson", (0)::bigint) * 20)) + (COALESCE("ap"."count_personal", (0)::bigint) * 20)) + COALESCE("m"."extra_score", 0)) AS "score"
           FROM ((((("public"."members" "m"
             LEFT JOIN ( SELECT "mission_logs"."member_id",
                    "count"(*) AS "count"
                   FROM "public"."mission_logs"
                  WHERE ("mission_logs"."is_completed" = true)
                  GROUP BY "mission_logs"."member_id") "ml" ON (("ml"."member_id" = "m"."id")))
             LEFT JOIN ( SELECT "member_recommendations"."member_id",
                    "count"(*) AS "count"
                   FROM "public"."member_recommendations"
                  WHERE ("member_recommendations"."is_completed" = true)
                  GROUP BY "member_recommendations"."member_id") "wl" ON (("wl"."member_id" = "m"."id")))
             LEFT JOIN ( SELECT "routine_logs"."member_id",
                    "count"(*) AS "count"
                   FROM "public"."routine_logs"
                  WHERE ("routine_logs"."completed" = true)
                  GROUP BY "routine_logs"."member_id") "rl" ON (("rl"."member_id" = "m"."id")))
             LEFT JOIN ( SELECT "appointments"."member_id",
                    "count"(*) AS "count_lesson"
                   FROM "public"."appointments"
                  WHERE (("appointments"."type" = 'lesson'::"text") AND ("appointments"."is_completed" = true))
                  GROUP BY "appointments"."member_id") "al" ON (("al"."member_id" = "m"."id")))
             LEFT JOIN ( SELECT "appointments"."member_id",
                    "count"(*) AS "count_personal"
                   FROM "public"."appointments"
                  WHERE (("appointments"."type" = 'personal'::"text") AND ("appointments"."is_completed" = true))
                  GROUP BY "appointments"."member_id") "ap" ON (("ap"."member_id" = "m"."id")))
        )
 SELECT "member_id",
    "name",
    "mission_count",
    "workout_count",
    "routine_count",
    "lesson_count",
    "personal_count",
    "score",
    ("floor"((("score" / 160))::double precision) + (1)::double precision) AS "level",
    "trunc"(((("mod"("score", (160)::bigint))::numeric / 160.0) * (100)::numeric), 1) AS "percent"
   FROM "base";


ALTER VIEW "public"."member_achievement_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_pain_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "member_id" "uuid",
    "date" "date" NOT NULL,
    "pain_area" "text" NOT NULL,
    "pain_score" integer NOT NULL,
    "activity" "text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "member_pain_logs_pain_score_check" CHECK ((("pain_score" >= 0) AND ("pain_score" <= 10)))
);


ALTER TABLE "public"."member_pain_logs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."monthly_mission_progress" AS
 SELECT "member_id",
    "assigned_month",
    "count"(*) FILTER (WHERE "is_completed") AS "completed_count",
    "count"(*) AS "total_count"
   FROM "public"."mission_logs"
  GROUP BY "member_id", "assigned_month";


ALTER VIEW "public"."monthly_mission_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monthly_missions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "month" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."monthly_missions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pain_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "member_id" "uuid",
    "date" "date" NOT NULL,
    "pain_score" integer NOT NULL,
    "pain_area" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pain_logs_pain_score_check" CHECK ((("pain_score" >= 0) AND ("pain_score" <= 10)))
);


ALTER TABLE "public"."pain_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recommended_workouts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "week" integer NOT NULL,
    "title" "text" NOT NULL,
    "video_url" "text" NOT NULL,
    "order" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."recommended_workouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."score_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "member_id" "uuid",
    "type" "text",
    "score_delta" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb"
);


ALTER TABLE "public"."score_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trainer_notes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "trainer_id" "uuid",
    "member_id" "uuid",
    "note" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trainer_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trainer_recommendations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "video_id" "uuid",
    "title" "text" NOT NULL,
    "exercise_video_id" "uuid"
);


ALTER TABLE "public"."trainer_recommendations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_member_recommendations" AS
 SELECT "mr"."id",
    "mr"."member_id",
    "mr"."recommendation_id",
    "mr"."sort_order",
    "mr"."is_completed",
    "mr"."trainer_confirmed",
    "mr"."description",
    "mr"."assigned_at",
    "ev"."title",
    "ev"."video_url",
    "ev"."category",
    "ev"."tags"
   FROM (("public"."member_recommendations" "mr"
     JOIN "public"."trainer_recommendations" "tr" ON (("mr"."recommendation_id" = "tr"."id")))
     JOIN "public"."exercise_videos" "ev" ON (("tr"."exercise_video_id" = "ev"."id")));


ALTER VIEW "public"."v_member_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."watch_progress_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "video_url" "text" NOT NULL,
    "seconds" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."watch_progress_logs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."weekly_stats" AS
 SELECT "member_id",
    "week_id",
    "count"(*) FILTER (WHERE "completed") AS "completed_count",
    "count"(*) AS "total_days"
   FROM "public"."routine_logs"
  GROUP BY "member_id", "week_id";


ALTER VIEW "public"."weekly_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "member_id" "uuid",
    "date" "date" NOT NULL,
    "week" integer,
    "is_completed" boolean DEFAULT false,
    "video_url" "text",
    "workout_notes" "text",
    "type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "workout_logs_type_check" CHECK (("type" = ANY (ARRAY['weekly'::"text", 'recommended'::"text", 'personal'::"text"])))
);


ALTER TABLE "public"."workout_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workouts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "member_id" "uuid",
    "date" "date" NOT NULL,
    "title" "text" NOT NULL,
    "feedback" "text",
    "pain_score" integer,
    "completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "trainer_id" "uuid"
);


ALTER TABLE "public"."workouts" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."body_compositions"
    ADD CONSTRAINT "body_compositions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."center_announcements"
    ADD CONSTRAINT "center_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_videos"
    ADD CONSTRAINT "exercise_videos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_pain_logs"
    ADD CONSTRAINT "member_pain_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_recommendations"
    ADD CONSTRAINT "member_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mission_logs"
    ADD CONSTRAINT "mission_logs_member_id_mission_id_key" UNIQUE ("member_id", "mission_id");



ALTER TABLE ONLY "public"."mission_logs"
    ADD CONSTRAINT "mission_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_missions"
    ADD CONSTRAINT "monthly_missions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pain_logs"
    ADD CONSTRAINT "pain_logs_member_id_date_pain_area_key" UNIQUE ("member_id", "date", "pain_area");



ALTER TABLE ONLY "public"."pain_logs"
    ADD CONSTRAINT "pain_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recommended_workouts"
    ADD CONSTRAINT "recommended_workouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routine_logs"
    ADD CONSTRAINT "routine_logs_member_id_date_key" UNIQUE ("member_id", "date");



ALTER TABLE ONLY "public"."routine_logs"
    ADD CONSTRAINT "routine_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."score_events"
    ADD CONSTRAINT "score_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_notes"
    ADD CONSTRAINT "trainer_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_recommendations"
    ADD CONSTRAINT "trainer_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "unique_member_video" UNIQUE ("member_id", "video_url");



ALTER TABLE ONLY "public"."watch_progress_logs"
    ADD CONSTRAINT "watch_progress_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "trg_appointment_complete" AFTER UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."on_appointment_complete"();



CREATE OR REPLACE TRIGGER "trg_autofill_trainer_id" BEFORE INSERT ON "public"."workouts" FOR EACH ROW EXECUTE FUNCTION "public"."autofill_trainer_id"();



CREATE OR REPLACE TRIGGER "trg_calculate_week_id" BEFORE INSERT ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_week_id"();



CREATE OR REPLACE TRIGGER "trg_mission_complete" AFTER UPDATE ON "public"."mission_logs" FOR EACH ROW EXECUTE FUNCTION "public"."on_mission_complete"();



CREATE OR REPLACE TRIGGER "trg_score_event_insert" AFTER INSERT ON "public"."score_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_score_from_event"();



CREATE OR REPLACE TRIGGER "trg_set_trainer_id" BEFORE INSERT ON "public"."workouts" FOR EACH ROW EXECUTE FUNCTION "public"."autofill_trainer_id"();



CREATE OR REPLACE TRIGGER "trg_sync_routine_logs" AFTER UPDATE ON "public"."appointments" FOR EACH ROW WHEN (("new"."is_completed" = true)) EXECUTE FUNCTION "public"."sync_routine_logs_from_appointments"();



CREATE OR REPLACE TRIGGER "trg_weekly_workout_complete" AFTER INSERT ON "public"."workout_logs" FOR EACH ROW WHEN (("new"."is_completed" = true)) EXECUTE FUNCTION "public"."on_weekly_workout_complete"();



CREATE OR REPLACE TRIGGER "trigger_set_trainer_id" AFTER INSERT ON "public"."workouts" FOR EACH ROW EXECUTE FUNCTION "public"."set_trainer_id"();



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."body_compositions"
    ADD CONSTRAINT "body_compositions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_pain_logs"
    ADD CONSTRAINT "member_pain_logs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_recommendations"
    ADD CONSTRAINT "member_recommendations_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "public"."trainer_recommendations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mission_logs"
    ADD CONSTRAINT "mission_logs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mission_logs"
    ADD CONSTRAINT "mission_logs_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "public"."monthly_missions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pain_logs"
    ADD CONSTRAINT "pain_logs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routine_logs"
    ADD CONSTRAINT "routine_logs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."score_events"
    ADD CONSTRAINT "score_events_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_notes"
    ADD CONSTRAINT "trainer_notes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_notes"
    ADD CONSTRAINT "trainer_notes_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_recommendations"
    ADD CONSTRAINT "trainer_recommendations_exercise_video_id_fkey" FOREIGN KEY ("exercise_video_id") REFERENCES "public"."exercise_videos"("id");



ALTER TABLE ONLY "public"."trainer_recommendations"
    ADD CONSTRAINT "trainer_recommendations_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "public"."exercise_videos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



CREATE POLICY "All can read missions" ON "public"."monthly_missions" FOR SELECT USING (true);



CREATE POLICY "Allow all insert for routine_logs (no auth)" ON "public"."routine_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow all read" ON "public"."mission_logs" FOR SELECT USING (true);



CREATE POLICY "Allow all read" ON "public"."routine_logs" FOR SELECT USING (true);



CREATE POLICY "Allow all to delete appointments" ON "public"."appointments" FOR DELETE USING (true);



CREATE POLICY "Allow all to mark appointment completed" ON "public"."appointments" FOR UPDATE USING (true);



CREATE POLICY "Allow insert by member" ON "public"."workout_logs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE ("members"."id" = "workout_logs"."member_id"))));



CREATE POLICY "Allow insert of routine logs without auth" ON "public"."routine_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert to routine_logs without auth" ON "public"."routine_logs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE ("members"."id" = "routine_logs"."member_id"))));



CREATE POLICY "Allow public insert" ON "public"."appointments" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert for routine logs" ON "public"."routine_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow read for all" ON "public"."recommended_workouts" FOR SELECT USING (true);



CREATE POLICY "Allow trainers to read" ON "public"."member_recommendations" FOR SELECT USING (("auth"."role"() = 'trainer'::"text"));



CREATE POLICY "Anyone can delete routines" ON "public"."routine_logs" FOR DELETE USING (true);



CREATE POLICY "Anyone can insert member logs with valid member_id" ON "public"."member_pain_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can insert routines" ON "public"."routine_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can read workouts if they know member_id" ON "public"."workouts" FOR SELECT USING (true);



CREATE POLICY "Anyone can select routines" ON "public"."routine_logs" FOR SELECT USING (true);



CREATE POLICY "Anyone can update routines" ON "public"."routine_logs" FOR UPDATE USING (true);



CREATE POLICY "Insert own routines" ON "public"."routine_logs" FOR INSERT TO "authenticated" WITH CHECK (("member_id" = "auth"."uid"()));



CREATE POLICY "Member accesses own mission logs" ON "public"."mission_logs" FOR SELECT USING (("auth"."uid"() = "member_id"));



CREATE POLICY "Member can manage own pain diary" ON "public"."member_pain_logs" FOR SELECT USING (("member_id" = "auth"."uid"()));



CREATE POLICY "Member can manage own pain logs" ON "public"."member_pain_logs" USING (("auth"."uid"() = "member_id")) WITH CHECK (("auth"."uid"() = "member_id"));



CREATE POLICY "Member can read own trainer notes" ON "public"."trainer_notes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE ("members"."id" = "trainer_notes"."member_id"))));



CREATE POLICY "Member can view own body compositions" ON "public"."body_compositions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE ("members"."id" = "body_compositions"."member_id"))));



CREATE POLICY "Member can view own pain logs" ON "public"."pain_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "pain_logs"."member_id") AND ("members"."id" = "pain_logs"."member_id")))));



CREATE POLICY "Member can view own trainer notes" ON "public"."trainer_notes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE ("members"."id" = "trainer_notes"."member_id"))));



CREATE POLICY "Member can view their own pain logs" ON "public"."member_pain_logs" FOR SELECT USING (("member_id" = "auth"."uid"()));



CREATE POLICY "Member can view their own workout logs" ON "public"."workouts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "workouts"."member_id") AND (("members"."id")::"text" = ("auth"."uid"())::"text")))));



CREATE POLICY "Member updates own mission status" ON "public"."mission_logs" FOR UPDATE USING (("auth"."uid"() = "member_id")) WITH CHECK (("auth"."uid"() = "member_id"));



CREATE POLICY "Members can insert their own routines" ON "public"."routine_logs" FOR INSERT TO "authenticated" WITH CHECK (("member_id" = "auth"."uid"()));



CREATE POLICY "Members can read their own routines" ON "public"."routine_logs" FOR SELECT TO "authenticated" USING (("member_id" = "auth"."uid"()));



CREATE POLICY "Members can update their own routine logs" ON "public"."routine_logs" FOR UPDATE TO "authenticated" USING (("member_id" = "auth"."uid"()));



CREATE POLICY "Members can update their own routines" ON "public"."routine_logs" FOR UPDATE TO "authenticated" USING (("member_id" = "auth"."uid"()));



CREATE POLICY "Public can read active announcements" ON "public"."center_announcements" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can select for login check" ON "public"."members" FOR SELECT USING (true);



CREATE POLICY "Public delete access" ON "public"."member_recommendations" FOR DELETE USING (true);



CREATE POLICY "Public insert access" ON "public"."member_recommendations" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert routine logs" ON "public"."routine_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public read access" ON "public"."member_recommendations" FOR SELECT USING (true);



CREATE POLICY "Public update access" ON "public"."member_recommendations" FOR UPDATE USING (true);



CREATE POLICY "Select own routines" ON "public"."routine_logs" FOR SELECT TO "authenticated" USING (("member_id" = "auth"."uid"()));



CREATE POLICY "TEMP: Allow all inserts (public)" ON "public"."appointments" FOR INSERT WITH CHECK (true);



CREATE POLICY "TEMP: Allow all selects" ON "public"."appointments" FOR SELECT USING (true);



CREATE POLICY "TEMP: allow select on exercise_videos" ON "public"."exercise_videos" FOR SELECT USING (true);



CREATE POLICY "Temporary open for debug" ON "public"."trainer_notes" FOR SELECT USING (true);



CREATE POLICY "Trainer can insert monthly missions" ON "public"."monthly_missions" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'trainer'::"text"));



CREATE POLICY "Trainer can insert own members" ON "public"."members" FOR INSERT WITH CHECK (("trainer_id" = "auth"."uid"()));



CREATE POLICY "Trainer can manage own member pain logs" ON "public"."pain_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "pain_logs"."member_id") AND ("members"."trainer_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "pain_logs"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer can read own members" ON "public"."members" FOR SELECT USING (("auth"."uid"() = "trainer_id"));



CREATE POLICY "Trainer can read routine logs of own members" ON "public"."routine_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "routine_logs"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer can update own members" ON "public"."members" FOR UPDATE USING (("auth"."uid"() = "trainer_id")) WITH CHECK (("auth"."uid"() = "trainer_id"));



CREATE POLICY "Trainer deletes own member body data" ON "public"."body_compositions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "body_compositions"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer deletes routine logs for own members" ON "public"."routine_logs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "routine_logs"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer inserts appointments for own members" ON "public"."appointments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "appointments"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer inserts body data for own member" ON "public"."body_compositions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "body_compositions"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer inserts routine logs for own members" ON "public"."routine_logs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "routine_logs"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer manages mission logs for own members" ON "public"."mission_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "mission_logs"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer manages notes for own members" ON "public"."trainer_notes" USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "trainer_notes"."member_id") AND ("members"."trainer_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "trainer_notes"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer manages own member mission logs" ON "public"."mission_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "mission_logs"."member_id") AND ("members"."trainer_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "mission_logs"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer manages own members' workouts" ON "public"."workouts" USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "workouts"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer manages workouts" ON "public"."workouts" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "workouts"."member_id") AND ("members"."trainer_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "workouts"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer reads own member body data" ON "public"."body_compositions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "body_compositions"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer reads own members' appointments" ON "public"."appointments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "appointments"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer reads own members' routines" ON "public"."routine_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "routine_logs"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer updates own member body data" ON "public"."body_compositions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "body_compositions"."member_id") AND ("members"."trainer_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "body_compositions"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer updates own members' appointments" ON "public"."appointments" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "appointments"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainer updates routine logs for own members" ON "public"."routine_logs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "routine_logs"."member_id") AND ("members"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainers can read member info" ON "public"."members" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Update own routines" ON "public"."routine_logs" FOR UPDATE TO "authenticated" USING (("member_id" = "auth"."uid"()));



ALTER TABLE "public"."body_compositions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."center_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_pain_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mission_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monthly_missions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pain_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recommended_workouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routine_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."score_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trainer_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workouts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "멤버는 score_events insert 가능" ON "public"."score_events" FOR INSERT WITH CHECK (true);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."autofill_trainer_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."autofill_trainer_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."autofill_trainer_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_week_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_week_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_week_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_score"("member_id_input" "uuid", "point" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_score"("member_id_input" "uuid", "point" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_score"("member_id_input" "uuid", "point" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."on_appointment_complete"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_appointment_complete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_appointment_complete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."on_mission_complete"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_mission_complete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_mission_complete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."on_recommendation_complete"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_recommendation_complete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_recommendation_complete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."on_watch_complete"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_watch_complete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_watch_complete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."on_weekly_workout_complete"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_weekly_workout_complete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_weekly_workout_complete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_trainer_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_trainer_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_trainer_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_routine_logs_from_appointments"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_routine_logs_from_appointments"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_routine_logs_from_appointments"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_score_from_event"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_score_from_event"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_score_from_event"() TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."body_compositions" TO "anon";
GRANT ALL ON TABLE "public"."body_compositions" TO "authenticated";
GRANT ALL ON TABLE "public"."body_compositions" TO "service_role";



GRANT ALL ON TABLE "public"."center_announcements" TO "anon";
GRANT ALL ON TABLE "public"."center_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."center_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_videos" TO "anon";
GRANT ALL ON TABLE "public"."exercise_videos" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_videos" TO "service_role";



GRANT ALL ON TABLE "public"."member_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."member_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."member_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";



GRANT ALL ON TABLE "public"."mission_logs" TO "anon";
GRANT ALL ON TABLE "public"."mission_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."mission_logs" TO "service_role";



GRANT ALL ON TABLE "public"."routine_logs" TO "anon";
GRANT ALL ON TABLE "public"."routine_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."routine_logs" TO "service_role";



GRANT ALL ON TABLE "public"."member_achievement_view" TO "anon";
GRANT ALL ON TABLE "public"."member_achievement_view" TO "authenticated";
GRANT ALL ON TABLE "public"."member_achievement_view" TO "service_role";



GRANT ALL ON TABLE "public"."member_pain_logs" TO "anon";
GRANT ALL ON TABLE "public"."member_pain_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."member_pain_logs" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_mission_progress" TO "anon";
GRANT ALL ON TABLE "public"."monthly_mission_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_mission_progress" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_missions" TO "anon";
GRANT ALL ON TABLE "public"."monthly_missions" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_missions" TO "service_role";



GRANT ALL ON TABLE "public"."pain_logs" TO "anon";
GRANT ALL ON TABLE "public"."pain_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."pain_logs" TO "service_role";



GRANT ALL ON TABLE "public"."recommended_workouts" TO "anon";
GRANT ALL ON TABLE "public"."recommended_workouts" TO "authenticated";
GRANT ALL ON TABLE "public"."recommended_workouts" TO "service_role";



GRANT ALL ON TABLE "public"."score_events" TO "anon";
GRANT ALL ON TABLE "public"."score_events" TO "authenticated";
GRANT ALL ON TABLE "public"."score_events" TO "service_role";



GRANT ALL ON TABLE "public"."trainer_notes" TO "anon";
GRANT ALL ON TABLE "public"."trainer_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."trainer_notes" TO "service_role";



GRANT ALL ON TABLE "public"."trainer_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."trainer_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."trainer_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."v_member_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."v_member_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."v_member_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."watch_progress_logs" TO "anon";
GRANT ALL ON TABLE "public"."watch_progress_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."watch_progress_logs" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_stats" TO "anon";
GRANT ALL ON TABLE "public"."weekly_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_stats" TO "service_role";



GRANT ALL ON TABLE "public"."workout_logs" TO "anon";
GRANT ALL ON TABLE "public"."workout_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_logs" TO "service_role";



GRANT ALL ON TABLE "public"."workouts" TO "anon";
GRANT ALL ON TABLE "public"."workouts" TO "authenticated";
GRANT ALL ON TABLE "public"."workouts" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
