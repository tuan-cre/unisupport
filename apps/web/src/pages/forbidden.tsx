import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <p className="text-6xl font-bold text-muted-foreground">403</p>
          <CardTitle className="text-xl">Access denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm text-muted-foreground">
            You don't have permission to view this page.
          </p>
          <Link to="/tickets">
            <Button>Back to tickets</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
