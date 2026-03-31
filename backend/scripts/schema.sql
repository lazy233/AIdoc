CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_no VARCHAR(64) UNIQUE,
  name VARCHAR(120) NOT NULL,
  nickname VARCHAR(120),
  institution VARCHAR(255),
  major VARCHAR(255),
  grade VARCHAR(120),
  current_semester VARCHAR(64),
  report_subtitle VARCHAR(255),
  service_start_date DATE,
  advisor_name VARCHAR(120),
  report_title VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  strength_subjects TEXT,
  international_score VARCHAR(120),
  study_intent VARCHAR(255),
  career_intent VARCHAR(255),
  interest_subjects TEXT,
  long_term_plan TEXT,
  learning_style TEXT,
  weakness TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_lesson_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  total_hours NUMERIC(10, 2),
  used_hours NUMERIC(10, 2),
  remaining_hours NUMERIC(10, 2),
  tutoring_subjects TEXT,
  preview_subjects TEXT,
  skill_focus TEXT,
  skill_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_ai_copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  term_overview TEXT,
  course_feedback TEXT,
  short_term_advice TEXT,
  long_term_roadmap TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type VARCHAR(64),
  mime_type VARCHAR(128),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ppt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  source_file_name TEXT,
  source_file_path TEXT NOT NULL,
  cover_image_path TEXT,
  file_size BIGINT,
  page_count INTEGER NOT NULL DEFAULT 0,
  aspect_ratio VARCHAR(16),
  theme_name VARCHAR(128),
  template_version VARCHAR(64),
  parse_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  parse_error TEXT,
  outline_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  pages_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  components_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  style_tokens_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  slot_bindings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  parsed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ppt_template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ppt_template_id UUID NOT NULL REFERENCES ppt_templates(id) ON DELETE CASCADE,
  section_order INTEGER NOT NULL,
  section_title VARCHAR(255) NOT NULL,
  start_page_no INTEGER,
  end_page_no INTEGER,
  page_count INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ppt_template_sections_order UNIQUE (ppt_template_id, section_order)
);

CREATE TABLE IF NOT EXISTS ppt_template_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ppt_template_id UUID NOT NULL REFERENCES ppt_templates(id) ON DELETE CASCADE,
  section_id UUID REFERENCES ppt_template_sections(id) ON DELETE SET NULL,
  page_no INTEGER NOT NULL,
  page_title VARCHAR(255),
  page_type VARCHAR(64),
  layout_name VARCHAR(128),
  notes TEXT,
  component_count INTEGER NOT NULL DEFAULT 0,
  snapshot_path TEXT,
  raw_page_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ppt_template_pages_page_no UNIQUE (ppt_template_id, page_no)
);

CREATE TABLE IF NOT EXISTS ppt_template_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ppt_template_id UUID NOT NULL REFERENCES ppt_templates(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES ppt_template_pages(id) ON DELETE CASCADE,
  component_order INTEGER NOT NULL,
  component_type VARCHAR(64) NOT NULL,
  component_name VARCHAR(255),
  placeholder_key VARCHAR(128),
  text_content TEXT,
  x NUMERIC(10, 2),
  y NUMERIC(10, 2),
  width NUMERIC(10, 2),
  height NUMERIC(10, 2),
  z_index INTEGER NOT NULL DEFAULT 0,
  style_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  binding_hint VARCHAR(255),
  raw_component_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ppt_template_components_order UNIQUE (page_id, component_order)
);

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  report_type VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  section_order INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  content_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_bindings JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_pages VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_report_template_sections_order UNIQUE (report_template_id, section_order)
);

CREATE TABLE IF NOT EXISTS report_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  report_type VARCHAR(64) NOT NULL,
  report_template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  ppt_template_id UUID REFERENCES ppt_templates(id) ON DELETE SET NULL,
  prompt TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_project_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES report_projects(id) ON DELETE CASCADE,
  page_order INTEGER NOT NULL,
  title VARCHAR(255),
  description TEXT,
  slide_hint VARCHAR(64),
  manual_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_report_project_pages_order UNIQUE (project_id, page_order)
);

CREATE TABLE IF NOT EXISTS report_project_page_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_page_id UUID NOT NULL REFERENCES report_project_pages(id) ON DELETE CASCADE,
  binding_group VARCHAR(255) NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  field_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_report_project_page_bindings_order UNIQUE (project_page_id, binding_group, field_order)
);

CREATE TABLE IF NOT EXISTS report_project_page_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_page_id UUID NOT NULL REFERENCES report_project_pages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type VARCHAR(64),
  mime_type VARCHAR(128),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES report_projects(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generation_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES report_projects(id) ON DELETE SET NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  report_title VARCHAR(255),
  ppt_template_id UUID REFERENCES ppt_templates(id) ON DELETE SET NULL,
  report_template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  output_format VARCHAR(32),
  status VARCHAR(32),
  output_file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_student_files_student_id ON student_files(student_id);
CREATE INDEX IF NOT EXISTS idx_ppt_templates_status ON ppt_templates(status);
CREATE INDEX IF NOT EXISTS idx_ppt_templates_parse_status ON ppt_templates(parse_status);
CREATE INDEX IF NOT EXISTS idx_ppt_template_sections_template_id ON ppt_template_sections(ppt_template_id);
CREATE INDEX IF NOT EXISTS idx_ppt_template_pages_template_id ON ppt_template_pages(ppt_template_id);
CREATE INDEX IF NOT EXISTS idx_ppt_template_pages_section_id ON ppt_template_pages(section_id);
CREATE INDEX IF NOT EXISTS idx_ppt_template_components_page_id ON ppt_template_components(page_id);
CREATE INDEX IF NOT EXISTS idx_ppt_template_components_placeholder_key ON ppt_template_components(placeholder_key);
CREATE INDEX IF NOT EXISTS idx_report_templates_report_type ON report_templates(report_type);
CREATE INDEX IF NOT EXISTS idx_report_templates_status ON report_templates(status);
CREATE INDEX IF NOT EXISTS idx_report_template_sections_template_id ON report_template_sections(report_template_id);
CREATE INDEX IF NOT EXISTS idx_report_projects_student_id ON report_projects(student_id);
CREATE INDEX IF NOT EXISTS idx_report_projects_status ON report_projects(status);
CREATE INDEX IF NOT EXISTS idx_report_project_pages_project_id ON report_project_pages(project_id);
CREATE INDEX IF NOT EXISTS idx_report_project_page_bindings_page_id ON report_project_page_bindings(project_page_id);
CREATE INDEX IF NOT EXISTS idx_report_project_page_files_page_id ON report_project_page_files(project_page_id);
CREATE INDEX IF NOT EXISTS idx_project_chat_messages_project_id ON project_chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_generation_histories_project_id ON generation_histories(project_id);
CREATE INDEX IF NOT EXISTS idx_generation_histories_student_id ON generation_histories(student_id);
CREATE INDEX IF NOT EXISTS idx_generation_histories_created_at ON generation_histories(created_at DESC);

DO $$
DECLARE
  target_table TEXT;
BEGIN
  FOR target_table IN
    SELECT unnest(ARRAY[
      'students',
      'student_learning_profiles',
      'student_lesson_data',
      'student_ai_copies',
      'ppt_templates',
      'ppt_template_sections',
      'ppt_template_pages',
      'ppt_template_components',
      'report_templates',
      'report_template_sections',
      'report_projects',
      'report_project_pages'
    ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;', target_table, target_table);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', target_table, target_table);
  END LOOP;
END $$;
