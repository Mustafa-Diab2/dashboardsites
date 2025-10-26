'use client';

import { useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useLanguage } from '@/context/language-context';
import CourseForm from './course-form';
import { Button } from './ui/button';

export default function Courses({ userRole }: { userRole: string }) {
  const { t } = useLanguage();
  const { firestore, user } = useFirebase();
  const [isCourseFormOpen, setCourseFormOpen] = useState(false);

  // Correctly filtered query for the user's courses
  const coursesQuery = useMemoFirebase(
    () => {
      if (!firestore || !user) return null;
      return query(
        collection(firestore, 'courses'),
        where('userId', '==', user.uid)
      );
    },
    [firestore, user]
  );

  const { data: courses, isLoading } = useCollection(coursesQuery);
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
            <p>{t('loading')}</p>
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
