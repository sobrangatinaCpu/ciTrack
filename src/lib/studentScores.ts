import { supabase } from './supabase'

export type StudentScoreInput = {
  classId: string
  studentNumber: string
  title: string
  type: 'exam' | 'quiz' | 'project' | 'recitation' | 'attendance'
  term: 'midterm' | 'final'
  maxScore: number
  score: number
  status: 'pending' | 'draft' | 'published'
  assessmentId?: string
}

export async function saveStudentScore(input: StudentScoreInput): Promise<string> {
  const classId = input.classId.trim()
  const studentNumber = input.studentNumber.trim()
  const title = input.title.trim()

  if (!classId) throw new Error('A class must be selected.')
  if (!studentNumber) throw new Error('Student number is required.')
  if (!title) throw new Error('Assessment title is required.')
  if (!Number.isFinite(input.maxScore) || input.maxScore <= 0) {
    throw new Error('Maximum score must be greater than zero.')
  }
  if (!Number.isFinite(input.score) || input.score < 0 || input.score > input.maxScore) {
    throw new Error(`Score must be between 0 and ${input.maxScore}.`)
  }

  const { data, error } = await supabase.rpc('comptech_faculty_save_score', {
    p_class_id: classId,
    p_student_number: studentNumber,
    p_title: title,
    p_type: input.type,
    p_term: input.term,
    p_max_score: input.maxScore,
    p_score: input.score,
    p_status: input.status,
    p_assessment_id: input.assessmentId ?? null,
  })

  if (error) throw new Error(error.message || 'Unable to save the student score.')
  if (typeof data !== 'string' || !data.trim()) {
    throw new Error('The database returned an invalid assessment identifier.')
  }
  return data
}
