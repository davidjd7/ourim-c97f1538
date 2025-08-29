import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground">Page non trouvée</h2>
          <p className="text-muted-foreground">
            Désolé, la page que vous recherchez n'existe pas.
          </p>
        </div>
        
        <Link to="/">
          <Button className="btn-financial gap-2">
            <Home className="h-4 w-4" />
            Retour au Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
