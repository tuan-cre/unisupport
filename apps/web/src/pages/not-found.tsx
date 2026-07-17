import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <p className="text-6xl font-bold text-muted-foreground">404</p>
          <CardTitle className="text-xl">Page not found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm text-muted-foreground">
            The page you're looking for doesn't exist.
          </p>
          <Link to="/tickets">
            <Button>Back to tickets</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
