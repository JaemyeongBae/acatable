// 데모용 샘플 데이터 생성 스크립트
// 목적: 개발 및 테스트를 위한 시간표 샘플 데이터

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedData() {
  try {
    console.log('🌱 샘플 데이터 생성 시작...')

    // 1. 학원 생성
    const academy = await prisma.academy.create({
      data: {
        id: 'demo-academy',
        name: '와이즈과학학원',
        code: 'DEMO001',
        address: '서울시 강남구 테스트로 123',
        phone: '02-1234-5678',
        email: 'contact@demo-academy.com'
      }
    })
    console.log('✅ 학원 생성 완료:', academy.name)

    // 2. 사용자 생성
    const users = await Promise.all([
      prisma.user.create({
        data: {
          id: 'user-admin',
          email: 'admin@demo.com',
          name: '김원장',
          phone: '010-1111-1111',
          role: 'OWNER',
          isActive: true,
          academyId: academy.id
        }
      }),
      prisma.user.create({
        data: {
          id: 'user-instructor-1',
          email: 'teacher1@demo.com',
          name: '이수학',
          phone: '010-2222-2222',
          role: 'INSTRUCTOR',
          isActive: true,
          academyId: academy.id
        }
      }),
      prisma.user.create({
        data: {
          id: 'user-instructor-2',
          email: 'teacher2@demo.com',
          name: '박영어',
          phone: '010-3333-3333',
          role: 'INSTRUCTOR',
          isActive: true,
          academyId: academy.id
        }
      }),
      prisma.user.create({
        data: {
          id: 'user-instructor-3',
          email: 'teacher3@demo.com',
          name: '최과학',
          phone: '010-4444-4444',
          role: 'INSTRUCTOR',
          isActive: true,
          academyId: academy.id
        }
      })
    ])
    console.log('✅ 사용자 생성 완료:', users.length, '명')

    // 3. 과목 생성
    const subjects = await Promise.all([
      prisma.subject.create({
        data: {
          id: 'subject-math',
          name: '수학',
          color: '#FF5722',
          academyId: academy.id
        }
      }),
      prisma.subject.create({
        data: {
          id: 'subject-english',
          name: '영어',
          color: '#2196F3',
          academyId: academy.id
        }
      }),
      prisma.subject.create({
        data: {
          id: 'subject-science',
          name: '과학',
          color: '#4CAF50',
          academyId: academy.id
        }
      }),
      prisma.subject.create({
        data: {
          id: 'subject-korean',
          name: '국어',
          color: '#9C27B0',
          academyId: academy.id
        }
      })
    ])
    console.log('✅ 과목 생성 완료:', subjects.length, '개')

    // 4. 강사 프로필 생성
    const instructors = await Promise.all([
      prisma.instructor.create({
        data: {
          id: 'instructor-1',
          userId: 'user-instructor-1',
          academyId: academy.id,
          specialties: JSON.stringify(['중학수학', '고1수학', '고2수학']),
          bio: '10년 경력의 수학 전문 강사입니다.'
        }
      }),
      prisma.instructor.create({
        data: {
          id: 'instructor-2',
          userId: 'user-instructor-2',
          academyId: academy.id,
          specialties: JSON.stringify(['중학영어', '고등영어', 'TOEFL']),
          bio: '영어 전문 강사로 토플 고득점 전문가입니다.'
        }
      }),
      prisma.instructor.create({
        data: {
          id: 'instructor-3',
          userId: 'user-instructor-3',
          academyId: academy.id,
          specialties: JSON.stringify(['물리', '화학', '생명과학']),
          bio: '과학 전 영역 담당하는 베테랑 강사입니다.'
        }
      })
    ])
    console.log('✅ 강사 프로필 생성 완료:', instructors.length, '명')

    // 5. 강의실 생성
    const classrooms = await Promise.all([
      prisma.classroom.create({
        data: {
          id: 'classroom-1',
          name: '수학실 A',
          capacity: 20,
          floor: 2,
          location: '201호',
          academyId: academy.id
        }
      }),
      prisma.classroom.create({
        data: {
          id: 'classroom-2',
          name: '영어실 B',
          capacity: 15,
          floor: 2,
          location: '202호',
          academyId: academy.id,
          isActive: true
        }
      }),
      prisma.classroom.create({
        data: {
          id: 'classroom-3',
          name: '과학실 C',
          capacity: 18,
          floor: 3,
          location: '301호',
          academyId: academy.id,
          isActive: true
        }
      }),
      prisma.classroom.create({
        data: {
          id: 'classroom-4',
          name: '멀티미디어실',
          capacity: 25,
          floor: 1,
          location: '101호',
          academyId: academy.id,
          isActive: true
        }
      })
    ])
    console.log('✅ 강의실 생성 완료:', classrooms.length, '개')

    // 6. 수업 유형 생성
    const classTypes = await Promise.all([
      prisma.classType.create({
        data: {
          id: 'classtype-regular',
          name: '정규수업',
          color: '#1976D2',
          description: '주 2-3회 정규 진도 수업',
          academyId: academy.id,
          isActive: true
        }
      }),
      prisma.classType.create({
        data: {
          id: 'classtype-intensive',
          name: '집중특강',
          color: '#D32F2F',
          description: '시험 대비 집중 특강',
          academyId: academy.id,
          isActive: true
        }
      }),
      prisma.classType.create({
        data: {
          id: 'classtype-makeup',
          name: '보충수업',
          color: '#388E3C',
          description: '결석자 대상 보충 수업',
          academyId: academy.id,
          isActive: true
        }
      })
    ])
    console.log('✅ 수업 유형 생성 완료:', classTypes.length, '개')

    // 7. 시간표 생성
    const schedules = await Promise.all([
      // 월요일
      prisma.schedule.create({
        data: {
          id: 'schedule-1',
          title: '중1 수학 기초',
          description: '중학교 1학년 수학 기본 개념',
          dayOfWeek: 'MONDAY',
          startTime: '14:00',
          endTime: '15:30',
          maxStudents: 15,
          academyId: academy.id,
          subjectId: 'subject-math',
          instructorId: 'instructor-1',
          classroomId: 'classroom-1',
          classTypeId: 'classtype-regular',
          isActive: true
        }
      }),
      prisma.schedule.create({
        data: {
          id: 'schedule-2',
          title: '고2 영어 독해',
          description: '고등학교 2학년 영어 독해 집중',
          dayOfWeek: 'MONDAY',
          startTime: '16:00',
          endTime: '17:30',
          maxStudents: 12,
          academyId: academy.id,
          subjectId: 'subject-english',
          instructorId: 'instructor-2',
          classroomId: 'classroom-2',
          classTypeId: 'classtype-regular',
          isActive: true
        }
      }),
      // 화요일
      prisma.schedule.create({
        data: {
          id: 'schedule-3',
          title: '중3 과학 실험',
          description: '중학교 3학년 과학 실험 수업',
          dayOfWeek: 'TUESDAY',
          startTime: '15:00',
          endTime: '16:30',
          maxStudents: 10,
          academyId: academy.id,
          subjectId: 'subject-science',
          instructorId: 'instructor-3',
          classroomId: 'classroom-3',
          classTypeId: 'classtype-regular',
          isActive: true
        }
      }),
      prisma.schedule.create({
        data: {
          id: 'schedule-4',
          title: '고1 수학 심화',
          description: '고등학교 1학년 수학 심화 과정',
          dayOfWeek: 'TUESDAY',
          startTime: '17:00',
          endTime: '18:30',
          maxStudents: 18,
          academyId: academy.id,
          subjectId: 'subject-math',
          instructorId: 'instructor-1',
          classroomId: 'classroom-1',
          classTypeId: 'classtype-regular',
          isActive: true
        }
      }),
      // 수요일
      prisma.schedule.create({
        data: {
          id: 'schedule-5',
          title: '토플 집중반',
          description: 'TOEFL 점수 향상 집중 특강',
          dayOfWeek: 'WEDNESDAY',
          startTime: '19:00',
          endTime: '21:00',
          maxStudents: 8,
          academyId: academy.id,
          subjectId: 'subject-english',
          instructorId: 'instructor-2',
          classroomId: 'classroom-4',
          classTypeId: 'classtype-intensive',
          isActive: true
        }
      }),
      // 목요일
      prisma.schedule.create({
        data: {
          id: 'schedule-6',
          title: '중2 수학',
          description: '중학교 2학년 수학 정규수업',
          dayOfWeek: 'THURSDAY',
          startTime: '14:30',
          endTime: '16:00',
          maxStudents: 16,
          academyId: academy.id,
          subjectId: 'subject-math',
          instructorId: 'instructor-1',
          classroomId: 'classroom-1',
          classTypeId: 'classtype-regular',
          isActive: true
        }
      }),
      prisma.schedule.create({
        data: {
          id: 'schedule-7',
          title: '고1 물리',
          description: '고등학교 1학년 물리 기초',
          dayOfWeek: 'THURSDAY',
          startTime: '16:30',
          endTime: '18:00',
          maxStudents: 14,
          academyId: academy.id,
          subjectId: 'subject-science',
          instructorId: 'instructor-3',
          classroomId: 'classroom-3',
          classTypeId: 'classtype-regular',
          isActive: true
        }
      }),
      // 금요일
      prisma.schedule.create({
        data: {
          id: 'schedule-8',
          title: '고3 수학 특강',
          description: '수능 대비 수학 집중 특강',
          dayOfWeek: 'FRIDAY',
          startTime: '17:00',
          endTime: '19:00',
          maxStudents: 20,
          academyId: academy.id,
          subjectId: 'subject-math',
          instructorId: 'instructor-1',
          classroomId: 'classroom-4',
          classTypeId: 'classtype-intensive',
          isActive: true
        }
      }),
      // 토요일
      prisma.schedule.create({
        data: {
          id: 'schedule-9',
          title: '영어 보충수업',
          description: '결석자 대상 영어 보충',
          dayOfWeek: 'SATURDAY',
          startTime: '10:00',
          endTime: '11:30',
          maxStudents: 5,
          academyId: academy.id,
          subjectId: 'subject-english',
          instructorId: 'instructor-2',
          classroomId: 'classroom-2',
          classTypeId: 'classtype-makeup',
          isActive: true
        }
      })
    ])
    console.log('✅ 시간표 생성 완료:', schedules.length, '개')

    console.log('🎉 모든 샘플 데이터 생성 완료!')
    console.log('')
    console.log('📊 생성된 데이터 요약:')
    console.log(`- 학원: ${academy.name}`)
    console.log(`- 사용자: ${users.length}명`)
    console.log(`- 과목: ${subjects.length}개`)
    console.log(`- 강사: ${instructors.length}명`)
    console.log(`- 강의실: ${classrooms.length}개`)
    console.log(`- 수업유형: ${classTypes.length}개`)
    console.log(`- 시간표: ${schedules.length}개`)
    console.log('')
    console.log('🌐 이제 http://localhost:3000 에서 시간표를 확인하세요!')

  } catch (error) {
    console.error('❌ 데이터 생성 중 오류:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 기존 데이터 삭제 함수 (개발용)
async function cleanData() {
  console.log('🧹 기존 데이터 정리 중...')
  
  try {
    await prisma.scheduleHistory.deleteMany()
    await prisma.studentSchedule.deleteMany()
    await prisma.schedule.deleteMany()
    await prisma.classType.deleteMany()
    await prisma.classroom.deleteMany()
    await prisma.instructor.deleteMany()
    await prisma.subject.deleteMany()
    await prisma.user.deleteMany()
    await prisma.academy.deleteMany()
    
    console.log('✅ 기존 데이터 정리 완료')
  } catch (error) {
    console.log('⚠️ 데이터 정리 중 일부 오류가 있었지만 계속 진행합니다:', error.message)
  }
}

// 메인 실행 함수
async function main() {
  const args = process.argv.slice(2)
  const shouldClean = args.includes('--clean')
  
  if (shouldClean) {
    await cleanData()
  }
  
  await seedData()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { seedData, cleanData } 