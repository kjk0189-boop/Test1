import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __punchDbClient: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  // 빌드 시점에는 환경변수가 없을 수 있으므로 여기서 즉시 던지지 않고,
  // 실제 쿼리 실행 시점에 postgres 드라이버가 연결 오류를 내도록 둡니다.
  return postgres(connectionString || "postgres://placeholder:placeholder@localhost:5432/placeholder", {
    prepare: false,
    max: 5,
  });
}

// Next.js 개발 모드의 hot-reload 시 커넥션이 계속 새로 생기는 것을 방지
const client = global.__punchDbClient ?? createClient();
if (process.env.NODE_ENV !== "production") {
  global.__punchDbClient = client;
}

export const db = drizzle(client, { schema });
