import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import bcrypt from "bcryptjs";
import { stores, users } from "../src/lib/schema";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL이 설정되지 않았어요. .env 파일을 확인해주세요.");
  }
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  const passwordHash = await bcrypt.hash("0000", 10);

  const seedStores = [
    { id: "store1", name: "강남점", address: "서울 강남구 테헤란로 123", qrToken: "PUNCH-STORE1-FIXED", weeklyHolidayDow: 0, sealImage: null },
    { id: "store2", name: "홍대점", address: "서울 마포구 와우산로 45", qrToken: "PUNCH-STORE2-FIXED", weeklyHolidayDow: 0, sealImage: null },
  ];

  const seedUsers = [
    { id: "u_admin", name: "김대표", role: "admin", storeId: null, phone: "01000000000", passwordHash, mustChangePassword: false, hourlyWage: null, hireDate: null, active: true },
    { id: "u_mgr1", name: "박매니저", role: "manager", storeId: "store1", phone: "01010001000", passwordHash, mustChangePassword: false, hourlyWage: null, hireDate: null, active: true },
    { id: "u_mgr2", name: "이매니저", role: "manager", storeId: "store2", phone: "01020002000", passwordHash, mustChangePassword: false, hourlyWage: null, hireDate: null, active: true },
    { id: "u_crew1", name: "최크루", role: "crew", storeId: "store1", phone: "01011112222", passwordHash, mustChangePassword: false, hourlyWage: 10030, hireDate: "2025-03-02", active: true },
    { id: "u_crew2", name: "정크루", role: "crew", storeId: "store1", phone: "01022223333", passwordHash, mustChangePassword: false, hourlyWage: 10500, hireDate: "2025-06-10", active: true },
    { id: "u_crew3", name: "한크루", role: "crew", storeId: "store2", phone: "01033334444", passwordHash, mustChangePassword: false, hourlyWage: 10030, hireDate: "2025-01-20", active: true },
  ];

  console.log("지점 데이터를 넣는 중...");
  await db.insert(stores).values(seedStores).onConflictDoNothing();

  console.log("계정 데이터를 넣는 중...");
  await db.insert(users).values(seedUsers as any).onConflictDoNothing();

  console.log("완료! 모든 계정의 초기 비밀번호는 0000이에요.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
