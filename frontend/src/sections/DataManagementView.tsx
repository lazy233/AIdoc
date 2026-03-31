import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { MetricCard } from '../components/MetricCard';
import { SectionHeader } from '../components/SectionHeader';
import { StatusPill } from '../components/StatusPill';
import {
  createStudent,
  deleteStudent,
  getStudent,
  listStudents,
  updateStudent,
  type StudentDetailApi,
  type StudentListItemApi,
  type StudentPayloadApi,
} from '../services/api';
import type { DataManagementData, TabKey } from '../types';

interface DataManagementViewProps {
  data: DataManagementData;
  onNavigate: (tab: TabKey) => void;
}

type StudentEditorTab = 'basic' | 'portrait' | 'lesson' | 'copy';
type DataPageMode = 'list' | 'detail';

const editorTabs: Array<{ key: StudentEditorTab; label: string; icon: 'document' | 'chart' | 'clock' | 'spark' }> = [
  { key: 'basic', label: 'Basic', icon: 'document' },
  { key: 'portrait', label: 'Profile', icon: 'chart' },
  { key: 'lesson', label: 'Lesson', icon: 'clock' },
  { key: 'copy', label: 'Copy', icon: 'spark' },
];

function createEmptyStudentPayload(): StudentPayloadApi {
  return {
    student_no: null,
    name: '',
    nickname: '',
    institution: '',
    major: '',
    grade: '',
    current_semester: '',
    report_subtitle: '',
    service_start_date: null,
    advisor_name: '',
    report_title: '',
    status: 'draft',
    learning_profile: {
      strength_subjects: '',
      international_score: '',
      study_intent: '',
      career_intent: '',
      interest_subjects: '',
      long_term_plan: '',
      learning_style: '',
      weakness: '',
    },
    lesson_data: {
      total_hours: null,
      used_hours: null,
      remaining_hours: null,
      tutoring_subjects: '',
      preview_subjects: '',
      skill_focus: '',
      skill_description: '',
    },
    ai_copy: {
      term_overview: '',
      course_feedback: '',
      short_term_advice: '',
      long_term_roadmap: '',
    },
    files: [],
  };
}

function toInputValue(value: string | number | null | undefined) {
  return value == null ? '' : String(value);
}

export function DataManagementView({ data, onNavigate }: DataManagementViewProps) {
  const [students, setStudents] = useState<StudentListItemApi[]>([]);
  const [pageMode, setPageMode] = useState<DataPageMode>('list');
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailApi | null>(null);
  const [activeTab, setActiveTab] = useState<StudentEditorTab>('basic');
  const [keyword, setKeyword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoadingList(true);
      try {
        setStudents(await listStudents());
      } finally {
        setIsLoadingList(false);
      }
    }

    void load();
  }, []);

  const visibleStudents = useMemo(() => {
    const query = keyword.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) =>
      [
        student.name,
        student.nickname,
        student.institution,
        student.major,
        student.grade,
        student.current_semester,
        student.advisor_name,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [keyword, students]);

  const refreshStudents = async () => {
    setStudents(await listStudents());
  };

  const openStudentDetail = async (studentId: string) => {
    setIsLoadingDetail(true);
    setPageMode('detail');
    setActiveTab('basic');

    try {
      setSelectedStudent(await getStudent(studentId));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCreateStudent = async () => {
    setIsSaving(true);
    try {
      const created = await createStudent({
        ...createEmptyStudentPayload(),
        name: 'New Student',
      });
      await refreshStudents();
      setSelectedStudent(created);
      setPageMode('detail');
      setActiveTab('basic');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    await deleteStudent(studentId);
    await refreshStudents();

    if (selectedStudent?.id === studentId) {
      setSelectedStudent(null);
      setPageMode('list');
    }
  };

  const updateSelectedStudent = (updater: (current: StudentDetailApi) => StudentDetailApi) => {
    setSelectedStudent((current) => (current ? updater(current) : current));
  };

  const handleSave = async () => {
    if (!selectedStudent) {
      return;
    }

    setIsSaving(true);
    try {
      const payload: StudentPayloadApi = {
        student_no: selectedStudent.student_no ?? null,
        name: selectedStudent.name,
        nickname: selectedStudent.nickname ?? '',
        institution: selectedStudent.institution ?? '',
        major: selectedStudent.major ?? '',
        grade: selectedStudent.grade ?? '',
        current_semester: selectedStudent.current_semester ?? '',
        report_subtitle: selectedStudent.report_subtitle ?? '',
        service_start_date: selectedStudent.service_start_date ?? null,
        advisor_name: selectedStudent.advisor_name ?? '',
        report_title: selectedStudent.report_title ?? '',
        status: selectedStudent.status,
        learning_profile: selectedStudent.learning_profile,
        lesson_data: {
          ...selectedStudent.lesson_data,
          total_hours: selectedStudent.lesson_data.total_hours == null ? null : Number(selectedStudent.lesson_data.total_hours),
          used_hours: selectedStudent.lesson_data.used_hours == null ? null : Number(selectedStudent.lesson_data.used_hours),
          remaining_hours:
            selectedStudent.lesson_data.remaining_hours == null ? null : Number(selectedStudent.lesson_data.remaining_hours),
        },
        ai_copy: selectedStudent.ai_copy,
        files: selectedStudent.files,
      };

      setSelectedStudent(await updateStudent(selectedStudent.id, payload));
      await refreshStudents();
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options?: { multiline?: boolean; span?: 'full' },
  ) => {
    const className = options?.span === 'full' ? 'student-field full' : 'student-field';

    return (
      <label className={className}>
        <span>{label}</span>
        {options?.multiline ? (
          <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
        ) : (
          <input value={value} onChange={(event) => onChange(event.target.value)} />
        )}
      </label>
    );
  };

  return (
    <section className="page-panel data-management-page">
      <article className="card">
        <SectionHeader
          title="Student Data"
          action={
            <button type="button" className="soft-button" onClick={() => onNavigate('workbench')}>
              Workbench
              <Icon name="arrowRight" className="button-icon" />
            </button>
          }
        />
        <div className="metric-grid">
          {data.stats.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </article>

      {pageMode === 'list' ? (
        <article className="card student-list-shell">
          <div className="student-list-toolbar">
            <label className="search-box student-list-search">
              <Icon name="database" className="button-icon" />
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Search students" />
            </label>

            <div className="student-list-toolbar-actions">
              <button type="button" className="accent-button" onClick={() => void handleCreateStudent()} disabled={isSaving}>
                New Student
              </button>
            </div>
          </div>

          <div className="student-table-shell student-list-table-shell">
            <table className="student-table student-batch-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>School / Major</th>
                  <th>Grade / Semester</th>
                  <th>Advisor</th>
                  <th>Status</th>
                  <th>Files</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.name || '-'}</strong>
                      <span>{student.nickname || '-'}</span>
                    </td>
                    <td>
                      <strong>{student.institution || '-'}</strong>
                      <span>{student.major || '-'}</span>
                    </td>
                    <td>
                      <strong>{student.grade || '-'}</strong>
                      <span>{student.current_semester || '-'}</span>
                    </td>
                    <td>
                      <strong>{student.advisor_name || '-'}</strong>
                    </td>
                    <td>
                      <StatusPill status={student.status} />
                    </td>
                    <td>{student.file_count}</td>
                    <td>{student.updated_at ? new Date(student.updated_at).toLocaleString('zh-CN') : '-'}</td>
                    <td>
                      <div className="student-row-actions">
                        <button type="button" className="page-mini-button" onClick={() => void openStudentDetail(student.id)}>
                          Detail
                        </button>
                        <button type="button" className="page-mini-button" onClick={() => void handleDeleteStudent(student.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!isLoadingList && visibleStudents.length === 0 ? <div className="student-list-empty">No students</div> : null}
          </div>
        </article>
      ) : (
        <article className="card student-detail-shell">
          {isLoadingDetail ? (
            <div className="student-list-empty">Loading student detail</div>
          ) : selectedStudent ? (
            <>
              <div className="student-detail-header">
                <div className="student-detail-title">
                  <button type="button" className="back-button" onClick={() => setPageMode('list')}>
                    <Icon name="arrowRight" className="button-icon reverse-icon" />
                  </button>
                  <div>
                    <h3>{selectedStudent.name || 'Unnamed Student'}</h3>
                    <div className="student-detail-meta">
                      <span>{selectedStudent.institution || '-'}</span>
                      <span>{selectedStudent.major || '-'}</span>
                      <span>{selectedStudent.updated_at ? new Date(selectedStudent.updated_at).toLocaleString('zh-CN') : '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="student-detail-actions">
                  <button type="button" className="soft-button" onClick={() => void handleDeleteStudent(selectedStudent.id)}>
                    Delete
                  </button>
                  <button type="button" className="accent-button" onClick={() => void handleSave()} disabled={isSaving}>
                    Save
                  </button>
                </div>
              </div>

              <div className="student-form-stepper">
                {editorTabs.map((tab, index) => (
                  <div key={tab.key} className="student-form-step">
                    <button
                      type="button"
                      className={`student-form-step-button ${activeTab === tab.key ? 'is-active' : ''}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      <Icon name={tab.icon} className="button-icon" />
                      {tab.label}
                    </button>
                    {index < editorTabs.length - 1 ? <span className="student-form-step-line" /> : null}
                  </div>
                ))}
              </div>

              {activeTab === 'basic' ? (
                <div className="student-editor-section">
                  <div className="student-form-grid">
                    {renderField('Name', selectedStudent.name, (value) => updateSelectedStudent((current) => ({ ...current, name: value })))}
                    {renderField('Nickname', selectedStudent.nickname ?? '', (value) => updateSelectedStudent((current) => ({ ...current, nickname: value })))}
                    {renderField('School', selectedStudent.institution ?? '', (value) => updateSelectedStudent((current) => ({ ...current, institution: value })))}
                    {renderField('Major', selectedStudent.major ?? '', (value) => updateSelectedStudent((current) => ({ ...current, major: value })))}
                    {renderField('Grade', selectedStudent.grade ?? '', (value) => updateSelectedStudent((current) => ({ ...current, grade: value })))}
                    {renderField('Semester', selectedStudent.current_semester ?? '', (value) => updateSelectedStudent((current) => ({ ...current, current_semester: value })))}
                    {renderField('Subtitle', selectedStudent.report_subtitle ?? '', (value) => updateSelectedStudent((current) => ({ ...current, report_subtitle: value })))}
                    {renderField('Start Date', selectedStudent.service_start_date ?? '', (value) => updateSelectedStudent((current) => ({ ...current, service_start_date: value || null })))}
                    {renderField('Advisor', selectedStudent.advisor_name ?? '', (value) => updateSelectedStudent((current) => ({ ...current, advisor_name: value })))}
                    {renderField('Report Title', selectedStudent.report_title ?? '', (value) => updateSelectedStudent((current) => ({ ...current, report_title: value })), { span: 'full' })}
                  </div>
                </div>
              ) : null}

              {activeTab === 'portrait' ? (
                <div className="student-editor-section">
                  <div className="student-form-grid">
                    {renderField('Strength Subjects', selectedStudent.learning_profile.strength_subjects ?? '', (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        learning_profile: { ...current.learning_profile, strength_subjects: value },
                      })),
                    )}
                    {renderField('International Score', selectedStudent.learning_profile.international_score ?? '', (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        learning_profile: { ...current.learning_profile, international_score: value },
                      })),
                    )}
                    {renderField('Study Intent', selectedStudent.learning_profile.study_intent ?? '', (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        learning_profile: { ...current.learning_profile, study_intent: value },
                      })),
                    )}
                    {renderField('Career Intent', selectedStudent.learning_profile.career_intent ?? '', (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        learning_profile: { ...current.learning_profile, career_intent: value },
                      })),
                    )}
                    {renderField('Interest Subjects', selectedStudent.learning_profile.interest_subjects ?? '', (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        learning_profile: { ...current.learning_profile, interest_subjects: value },
                      })),
                    )}
                    {renderField('Long Term Plan', selectedStudent.learning_profile.long_term_plan ?? '', (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        learning_profile: { ...current.learning_profile, long_term_plan: value },
                      })),
                    )}
                    {renderField('Learning Style', selectedStudent.learning_profile.learning_style ?? '', (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        learning_profile: { ...current.learning_profile, learning_style: value },
                      })),
                    { span: 'full', multiline: true })}
                    {renderField('Weakness', selectedStudent.learning_profile.weakness ?? '', (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        learning_profile: { ...current.learning_profile, weakness: value },
                      })),
                    { span: 'full', multiline: true })}
                  </div>
                </div>
              ) : null}

              {activeTab === 'lesson' ? (
                <div className="student-editor-section">
                  <div className="student-form-grid">
                    {renderField('Total Hours', toInputValue(selectedStudent.lesson_data.total_hours), (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        lesson_data: { ...current.lesson_data, total_hours: value === '' ? null : Number(value) },
                      })),
                    )}
                    {renderField('Used Hours', toInputValue(selectedStudent.lesson_data.used_hours), (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        lesson_data: { ...current.lesson_data, used_hours: value === '' ? null : Number(value) },
                      })),
                    )}
                    {renderField('Remaining Hours', toInputValue(selectedStudent.lesson_data.remaining_hours), (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        lesson_data: { ...current.lesson_data, remaining_hours: value === '' ? null : Number(value) },
                      })),
                    )}
                    {renderField('Tutoring Subjects', selectedStudent.lesson_data.tutoring_subjects ?? '', (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        lesson_data: { ...current.lesson_data, tutoring_subjects: value },
                      })),
                    { span: 'full', multiline: true })}
                    {renderField('Preview Subjects', selectedStudent.lesson_data.preview_subjects ?? '', (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        lesson_data: { ...current.lesson_data, preview_subjects: value },
                      })),
                    { span: 'full', multiline: true })}
                    {renderField('Skill Focus', selectedStudent.lesson_data.skill_focus ?? '', (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        lesson_data: { ...current.lesson_data, skill_focus: value },
                      })),
                    { span: 'full', multiline: true })}
                    {renderField('Skill Description', selectedStudent.lesson_data.skill_description ?? '', (value) =>
                      updateSelectedStudent((current) => ({
                        ...current,
                        lesson_data: { ...current.lesson_data, skill_description: value },
                      })),
                    { span: 'full', multiline: true })}
                  </div>
                </div>
              ) : null}

              {activeTab === 'copy' ? (
                <div className="student-editor-section student-ai-section">
                  <article className="student-ai-card">
                    <div className="student-ai-card-head">
                      <strong>Term Overview</strong>
                    </div>
                    <textarea
                      value={selectedStudent.ai_copy.term_overview ?? ''}
                      onChange={(event) =>
                        updateSelectedStudent((current) => ({
                          ...current,
                          ai_copy: { ...current.ai_copy, term_overview: event.target.value },
                        }))
                      }
                      rows={5}
                    />
                  </article>

                  <article className="student-ai-card">
                    <div className="student-ai-card-head">
                      <strong>Course Feedback</strong>
                    </div>
                    <textarea
                      value={selectedStudent.ai_copy.course_feedback ?? ''}
                      onChange={(event) =>
                        updateSelectedStudent((current) => ({
                          ...current,
                          ai_copy: { ...current.ai_copy, course_feedback: event.target.value },
                        }))
                      }
                      rows={5}
                    />
                  </article>

                  <article className="student-ai-card">
                    <div className="student-ai-card-head">
                      <strong>Short Term Advice</strong>
                    </div>
                    <textarea
                      value={selectedStudent.ai_copy.short_term_advice ?? ''}
                      onChange={(event) =>
                        updateSelectedStudent((current) => ({
                          ...current,
                          ai_copy: { ...current.ai_copy, short_term_advice: event.target.value },
                        }))
                      }
                      rows={5}
                    />
                  </article>

                  <article className="student-ai-card">
                    <div className="student-ai-card-head">
                      <strong>Long Term Roadmap</strong>
                    </div>
                    <textarea
                      value={selectedStudent.ai_copy.long_term_roadmap ?? ''}
                      onChange={(event) =>
                        updateSelectedStudent((current) => ({
                          ...current,
                          ai_copy: { ...current.ai_copy, long_term_roadmap: event.target.value },
                        }))
                      }
                      rows={5}
                    />
                  </article>
                </div>
              ) : null}
            </>
          ) : (
            <div className="student-list-empty">No detail loaded</div>
          )}
        </article>
      )}
    </section>
  );
}
