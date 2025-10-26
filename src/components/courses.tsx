'use client';

import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useLanguage } from "@/context/language-context";

export default function Courses() {
  const { t } = useLanguage();
  const { firestore, user } = useFirebase();

  // Correctly filtered query for the user's courses
  const coursesQuery = useMemoFirebase(
    () => {
      if (!firestore || !user) return null;
      return query(collection(firestore, "courses"), where("userId", "==", user.uid));
    },
    [firestore, user]
  );

  const { data: courses, isLoading } = useCollection(coursesQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <BookOpen />
          {t('my_courses')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>{t('loading')}</p>
        ) : courses && courses.length > 0 ? (
          <ul className="space-y-2">
            {courses.map(course => (
              <li key={course.id} className="p-2 rounded-md bg-muted/50">
                {course.title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t('no_courses_assigned')}</p>
        )}
      </CardContent>
    </Card>
  );
}
