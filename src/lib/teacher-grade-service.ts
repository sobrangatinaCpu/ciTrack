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

// Returns the database gradebook assessment UUID. Reuse it for every
// student score that belongs to the same assessment.
export async function saveStudentScore(input: StudentScoreInput): Promise<string> {
  const { data, error } = await supabase.rpc('comptech_faculty_save_score', {
    p_class_id: input.classId,
    p_student_number: input.studentNumber.trim(),
    p_title: input.title.trim(),
    p_type: input.type,
    p_term: input.term,
    p_max_score: input.maxScore,
    p_score: input.score,
    p_status: input.status,
    p_assessment_id: input.assessmentId ?? null,
  })

  if (error) throw error
  if (typeof data !== 'string') throw new Error('Invalid assessment response')
  return data
}
