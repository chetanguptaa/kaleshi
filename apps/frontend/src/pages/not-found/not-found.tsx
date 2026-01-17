import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/header/header";
import { useCurrentUser } from "@/schemas/layout/hooks";
import Loading from "@/components/loading";
import RootLayout from "@/layout/rootLayout";

const NotFound = () => {
  const location = useLocation();
  const currentUser = useCurrentUser();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  if (currentUser.isLoading) {
    return <Loading />;
  }

  return (
    <RootLayout isPrivate={false} currentUser={currentUser.data}>
      <Header selectedTab={null} currentUser={currentUser.data.user} />
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">
            Oops! Page not found
          </p>
          <a href="/" className="text-primary underline hover:text-primary/90">
            Return to Home
          </a>
        </div>
      </div>
    </RootLayout>
  );
};

export default NotFound;
