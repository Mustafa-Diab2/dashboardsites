'use client';

import { useState, useCallback } from 'react';
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

  const fetchCourses = useCallback((query: any) => {
    if (!user) return query;
    return query.eq('user_id', user.id);
  }, [user]);

  const { data: courses, isLoading } = useSupabaseCollection(
    'courses',
    fetchCourses
  );

  const isAdmin = userRole === 'admin';

  return (
    <>
      <CourseForm isOpen={isCourseFormOpen} onOpenChange={setCourseFormOpen} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-headline flex items-center gap-2">
            <BookOpen />
            {t('my_courses')}
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
              {courses.map(course => (
                <li key={course.id} className="p-3 rounded-md bg-muted/50 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{course.name}</p>
                    <p className="text-sm text-muted-foreground">{course.duration} - {course.status}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={course.link} target="_blank" rel="noopener noreferrer">
                      {t('go_to_course')}
                    </a>
                  </Button>
                </li>
              ))}
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
