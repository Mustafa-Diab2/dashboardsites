'use client';

import { Book, Plus, Play, StopCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useFirebase, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, serverTimestamp, doc } from "firebase/firestore";
import { useMutations } from "@/hooks/use-mutations";
import { useState } from "react";
import CourseForm from "./course-form";

export default function Courses() {
  const { user, firestore } = useFirebase();
  const { updateDoc } = useMutations();
  const [isCourseFormOpen, setCourseFormOpen] = useState(false);

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData } = useDoc(userDocRef);
  const userRole = (userData as any)?.role;

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    // Admins see all courses
    if (userRole === 'admin') {
        return query(collection(firestore, 'courses'));
    }
    
    // Regular users see only their own courses
    return query(collection(firestore, 'courses'), where('userId', '==', user.uid));
  }, [firestore, user, userRole]);

  const { data: courses, isLoading } = useCollection(coursesQuery);

  const handleStartCourse = (courseId: string) => {
    updateDoc('courses', courseId, { status: 'in_progress', startedAt: serverTimestamp() });
  };

  const handleEndCourse = (courseId: string) => {
    updateDoc('courses', courseId, { status: 'completed', completedAt: serverTimestamp() });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'completed':
        return <Badge>Completed</Badge>;
      case 'not_started':
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  return (
    <>
      <CourseForm isOpen={isCourseFormOpen} onOpenChange={setCourseFormOpen} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline flex items-center gap-2">
              <Book />
              My Courses
            </CardTitle>
            <CardDescription>Courses assigned to you and your team.</CardDescription>
          </div>
          {userRole === 'admin' && (
            <Button onClick={() => setCourseFormOpen(true)}><Plus/> Add Course</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p>Loading courses...</p>
          ) : courses && courses.length > 0 ? (
            courses.map((course) => (
              <div key={course.id} className="p-4 rounded-lg bg-muted/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                     <h4 className="font-semibold">{course.name}</h4>
                     {getStatusBadge(course.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">Duration: {course.duration}</p>
                   <a href={course.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    Go to course <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    onClick={() => handleStartCourse(course.id)}
                    disabled={course.status !== 'not_started'}
                  >
                    <Play className="mr-2" /> Start
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEndCourse(course.id)}
                    disabled={course.status !== 'in_progress'}
                  >
                    <StopCircle className="mr-2" /> End
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground p-4 text-center">No courses assigned yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
