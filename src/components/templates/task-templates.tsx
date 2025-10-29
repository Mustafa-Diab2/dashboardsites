'use client';

import { TaskTemplate } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Code, Palette, Layers } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface TaskTemplatesProps {
  templates: TaskTemplate[];
  onSelectTemplate: (template: TaskTemplate) => void;
}

const ICON_MAP = {
  backend: Code,
  frontend: Palette,
  fullstack: Layers,
  design: Palette,
  other: FileText,
};

export function TaskTemplates({ templates, onSelectTemplate }: TaskTemplatesProps) {
  const { t } = useLanguage();

  // Default templates if none exist
  const defaultTemplates: TaskTemplate[] = [
    {
      id: 'backend-api',
      name: 'Backend API',
      description: 'API endpoint development with Swagger docs and testing',
      type: 'work',
      category: 'backend',
      defaultFields: {
        backend_conditions: 'Swagger documentation\nUnit tests\nError handling\nRate limiting',
        tags: ['api', 'backend'],
      },
      defaultChecklist: [
        { title: 'Define API endpoints and methods', done: false },
        { title: 'Create Swagger/OpenAPI documentation', done: false },
        { title: 'Implement endpoints', done: false },
        { title: 'Add input validation', done: false },
        { title: 'Write unit tests', done: false },
        { title: 'Test with Postman/Insomnia', done: false },
      ],
      createdBy: 'system',
      createdAt: new Date(),
    },
    {
      id: 'frontend-page',
      name: 'Frontend Page',
      description: 'New page/component with responsive design',
      type: 'work',
      category: 'frontend',
      defaultFields: {
        frontend_conditions: 'Responsive design\nAccessibility (WCAG)\nLoading states\nError handling',
        ux_requirements: 'Mobile-first approach\nClean UI\nFast loading',
        tags: ['frontend', 'ui'],
      },
      defaultChecklist: [
        { title: 'Design mockup review', done: false },
        { title: 'Create component structure', done: false },
        { title: 'Implement responsive layout', done: false },
        { title: 'Add loading/error states', done: false },
        { title: 'Accessibility testing', done: false },
        { title: 'Cross-browser testing', done: false },
      ],
      createdBy: 'system',
      createdAt: new Date(),
    },
    {
      id: 'fullstack-feature',
      name: 'Full-Stack Feature',
      description: 'Complete feature with backend and frontend',
      type: 'work',
      category: 'fullstack',
      defaultFields: {
        backend_conditions: 'API endpoints\nDatabase schema\nBusiness logic',
        frontend_conditions: 'UI components\nState management\nAPI integration',
        tags: ['fullstack', 'feature'],
      },
      defaultChecklist: [
        { title: 'Define requirements', done: false },
        { title: 'Design database schema', done: false },
        { title: 'Create API endpoints', done: false },
        { title: 'Implement frontend UI', done: false },
        { title: 'Integrate frontend with API', done: false },
        { title: 'End-to-end testing', done: false },
      ],
      createdBy: 'system',
      createdAt: new Date(),
    },
  ];

  const allTemplates = templates.length > 0 ? templates : defaultTemplates;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {allTemplates.map((template) => {
        const Icon = ICON_MAP[template.category];
        return (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="mt-2">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onSelectTemplate(template)}
                variant="secondary"
                className="w-full"
              >
                {t('use_template')}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
