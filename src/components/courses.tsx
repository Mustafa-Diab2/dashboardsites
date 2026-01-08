'use client';

import { useState, useMemo } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection } from '@/hooks/use-supabase-data';
import { useLanguage } from '@/context/language-context';
import CourseForm from './course-form';
import { Button } from './ui/button';

export default function Courses({ userRole }: { userRole: string }) {
  const { t } = useLanguage();
  const { user } = useSupabase();
  const [isCourseFormOpen, setCourseFormOpen] = useState(false);

  const isAdmin = userRole === 'admin';
  const userId = user?.id;

  // جلب كل الكورسات
  const { data: allCourses, isLoading } = useSupabaseCollection('courses');
  
  // جلب بيانات الموظفين للـ Admin فقط
  const { data: profiles } = useSupabaseCollection(isAdmin ? 'profiles' : null as any);

  // فلتر الكورسات بناءً على الدور
  const courses = useMemo(() => {
    if (!allCourses) return null;
    if (isAdmin) {
      // Admin يرى كل الكورسات مرتبة
      return [...allCourses].sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    // المستخدم العادي يرى كورساته فقط
    return allCourses.filter((course: any) => course.user_id === userId);
  }, [allCourses, isAdmin, userId]);

  return (
    <>
      <CourseForm isOpen={isCourseFormOpen} onOpenChange={setCourseFormOpen} />
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-headline flex items-center gap-2">
            <BookOpen />
            {isAdmin ? (t('all_courses') || 'All Courses') : t('my_courses')}
          </CardTitle>
          {isAdmin && (
            <Button size="sm" onClick={() => setCourseFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('add_course')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">{t('loading')}</p>
            </div>
          ) : courses && courses.length > 0 ? (
            <ul className="space-y-2">
              {courses.map(course => {
                const assignedUser = isAdmin && profiles ? 
                  profiles.find((p: any) => p.id === course.user_id) : null;
                
                return (
                  <li key={course.id} className="p-3 rounded-md bg-muted/50 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{course.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.duration} - {course.status}
                        {isAdmin && assignedUser && (
                          <span className="ml-2 text-primary">
                            • {assignedUser.full_name || assignedUser.email}
                          </span>
                        )}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a href={course.link} target="_blank" rel="noopener noreferrer">
                        {t('go_to_course')}
                      </a>
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {t('no_courses_assigned')}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
