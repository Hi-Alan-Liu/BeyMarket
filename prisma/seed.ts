import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 系列：CX / UX / BX
  const seriesData = [
    { code: "CX", name: "CX 系列", sortOrder: 1 },
    { code: "UX", name: "UX 系列", sortOrder: 2 },
    { code: "BX", name: "BX 系列", sortOrder: 3 },
  ];
  for (const s of seriesData) {
    await prisma.series.upsert({
      where: { code: s.code },
      update: { name: s.name, sortOrder: s.sortOrder },
      create: s,
    });
  }

  // 主分類：上蓋 / 固鎖 / 軸心 + 配件（發射器 / 拉條 / 握把 / 其他）
  const partTypeData = [
    { code: "BLADE", name: "上蓋", isAccessory: false, allowSubType: true, sortOrder: 1 },
    { code: "RATCHET", name: "固鎖", isAccessory: false, allowSubType: false, sortOrder: 2 },
    { code: "BIT", name: "軸心", isAccessory: false, allowSubType: false, sortOrder: 3 },
    { code: "LAUNCHER", name: "發射器", isAccessory: true, allowSubType: false, sortOrder: 4 },
    { code: "RIPCORD", name: "拉條", isAccessory: true, allowSubType: false, sortOrder: 5 },
    { code: "GRIP", name: "握把", isAccessory: true, allowSubType: false, sortOrder: 6 },
    { code: "OTHER", name: "其他配件", isAccessory: true, allowSubType: false, sortOrder: 7 },
  ];
  for (const p of partTypeData) {
    await prisma.partType.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }

  // CX 專屬子分類：紋章 / 戰刃 / 輔助戰刃（限定 CX 系列 + 上蓋主分類）
  const cx = await prisma.series.findUniqueOrThrow({ where: { code: "CX" } });
  const blade = await prisma.partType.findUniqueOrThrow({ where: { code: "BLADE" } });

  const subTypeData = [
    { code: "EMBLEM", name: "紋章", sortOrder: 1 },
    { code: "MAIN_BLADE", name: "戰刃", sortOrder: 2 },
    { code: "ASSIST_BLADE", name: "輔助戰刃", sortOrder: 3 },
  ];
  for (const st of subTypeData) {
    await prisma.subType.upsert({
      where: { code: st.code },
      update: {
        name: st.name,
        sortOrder: st.sortOrder,
        seriesId: cx.id,
        partTypeId: blade.id,
      },
      create: {
        ...st,
        seriesId: cx.id,
        partTypeId: blade.id,
      },
    });
  }

  console.log("✅ Seed 完成：系列 / 主分類 / CX 子分類");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
