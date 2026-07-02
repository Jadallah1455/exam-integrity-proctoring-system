import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AcademicCohortSelectors from './AcademicCohortSelectors';

const teachers = [
  { id: 't1', nameAr: 'أحمد', nameEn: 'Ahmed' },
  { id: 't2', nameAr: 'سارة', nameEn: 'Sara' },
];

const subjects = [
  { id: 's1', teacherId: 't1', nameAr: 'رياضيات', nameEn: 'Math' },
  { id: 's2', teacherId: 't2', nameAr: 'فيزياء', nameEn: 'Physics' },
];

const exams = [
  { id: 'e1', subjectId: 's1', nameAr: 'امتحان 1', nameEn: 'Exam 1' },
  { id: 'e2', subjectId: 's2', nameAr: 'امتحان 2', nameEn: 'Exam 2' },
];

describe('AcademicCohortSelectors', () => {
  it('renders all 3 select dropdowns', () => {
    render(
      <AcademicCohortSelectors
        selectedTeacherId="t1" selectedSubjectId="s1" selectedExamId="e1"
        teachers={teachers} subjects={subjects} exams={exams}
        lang="en" isLightMode={true}
        onTeacherChange={vi.fn()} onSubjectChange={vi.fn()} onExamChange={vi.fn()}
      />
    );
    expect(screen.getAllByRole('combobox')).toHaveLength(3);
  });

  it('calls onTeacherChange when teacher is switched', () => {
    const onTeacherChange = vi.fn();
    render(
      <AcademicCohortSelectors
        selectedTeacherId="t1" selectedSubjectId="s1" selectedExamId="e1"
        teachers={teachers} subjects={subjects} exams={exams}
        lang="en" isLightMode={true}
        onTeacherChange={onTeacherChange} onSubjectChange={vi.fn()} onExamChange={vi.fn()}
      />
    );
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 't2' } });
    expect(onTeacherChange).toHaveBeenCalledWith('t2');
  });

  it('displays English teacher names', () => {
    render(
      <AcademicCohortSelectors
        selectedTeacherId="t1" selectedSubjectId="s1" selectedExamId="e1"
        teachers={teachers} subjects={subjects} exams={exams}
        lang="en" isLightMode={true}
        onTeacherChange={vi.fn()} onSubjectChange={vi.fn()} onExamChange={vi.fn()}
      />
    );
    expect(screen.getByText('Ahmed')).toBeTruthy();
  });

  it('displays Arabic teacher names', () => {
    render(
      <AcademicCohortSelectors
        selectedTeacherId="t1" selectedSubjectId="s1" selectedExamId="e1"
        teachers={teachers} subjects={subjects} exams={exams}
        lang="ar" isLightMode={true}
        onTeacherChange={vi.fn()} onSubjectChange={vi.fn()} onExamChange={vi.fn()}
      />
    );
    expect(screen.getByText('أحمد')).toBeTruthy();
  });
});
