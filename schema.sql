-- =============================================
-- 宝龙口腔 Supabase 数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件
-- =============================================

-- 1. 用户表 (简易登录)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT '医生',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 插入默认账号
INSERT INTO users (username, password, role)
VALUES ('baolong1', '00001', '主治医师')
ON CONFLICT (username) DO NOTHING;

-- 2. 患者表
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  card_number TEXT,
  age TEXT,
  gender TEXT CHECK (gender IN ('男', '女')),
  visit_date TEXT,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT '待检查',
  treatment_type TEXT NOT NULL DEFAULT '初诊',
  time TEXT,
  description TEXT,
  tooth_pos TEXT,
  image_url TEXT,
  room_number TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 诊疗记录表
CREATE TABLE IF NOT EXISTS treatment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  tooth_pos TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 预约表
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  duration INTEGER DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'break')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 药品表
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT DEFAULT '未知',
  expiry_date TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT '盒',
  min_stock INTEGER DEFAULT 5,
  category TEXT DEFAULT '其他' CHECK (category IN ('麻醉', '填充', '消毒', '耗材', '其他')),
  status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'expired', 'warning')),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 采购单表
CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT TRUE,
  added_date TEXT,
  is_bought BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_patients_is_deleted ON patients(is_deleted);
CREATE INDEX IF NOT EXISTS idx_patients_visit_date ON patients(visit_date);
CREATE INDEX IF NOT EXISTS idx_treatment_records_patient_id ON treatment_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_medicines_is_deleted ON medicines(is_deleted);

-- 关闭 RLS (开发阶段)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- 允许匿名访问 (开发阶段，生产环境应配置更严格的策略)
CREATE POLICY "Allow all access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON treatment_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON medicines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON shopping_items FOR ALL USING (true) WITH CHECK (true);
